// =========================================================
// FILE: portal-ui-cards.js
// QUẢN LÝ THẺ BÀI THI, TÀI LIỆU, CÔNG TẮC GẠT, BIỂU ĐIỂM & POPOVER AVATAR
// =========================================================

function createItemCardElement(item, categoryId) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = buildCardHtmlString(item, categoryId);
    return wrapper.firstElementChild;
}

function getItemDisplayDate(item) {
    if (!item) return "---";
    let rawDate = item.date || item.articleDate || "";
    if (rawDate && String(rawDate).trim() !== "" && String(rawDate).trim() !== "---") return String(rawDate).trim();
    if (item.articleTime && String(item.articleTime).trim() !== "") {
        let cleanTime = String(item.articleTime).trim();
        let m = cleanTime.match(/(\d{1,2}\/\d{1,2}\/\d{4}(?:\s*-\s*\d{1,2}:\d{2})?)/);
        if (m) return m[1];
        return cleanTime;
    }
    if (item.timestamp && !isNaN(Number(item.timestamp))) {
        let d = new Date(Number(item.timestamp));
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    if (item.categoryId === "nhac-nho" || item.isDoc) {
        let d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return "---";
}

function testExamAsAdmin(quizId, categoryId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const targetCat = categoryId || "them-11";
    safeLocal.removeItem("last_submission_cleared");
    safeLocal.removeItem("saved_student_sbd");
    safeLocal.removeItem("saved_student_name");
    safeLocal.removeItem("saved_student_class");
    safeLocal.setItem("current_exam_student", JSON.stringify({ sbd: "Trying", name: "Obahoan29", className: "42", categoryId: targetCat }));
    safeLocal.setItem(`exam_allow_free_${quizId}`, "true");
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("exam_autosave_active_session_") && key.includes(quizId)) { safeLocal.removeItem(key); }
        }
    } catch(e) {}
    window.open(`./thi.html?id=${quizId}&cat=${encodeURIComponent(targetCat)}&sbd=Trying&name=Obahoan29&class=42&autostart=1&admin=1`, "_blank");
}

function buildCardHtmlString(item, categoryId) {
    const isReminder = (categoryId === "nhac-nho");
    const isDoc = isReminder || item.isDoc;
    const itemId = item.id || item.firebaseId || `item_${Date.now()}`;
    const quizId = extractQuizIdFromItem(item) || itemId;
    const badge = item.badgeText || (item.isHot ? "HOT" : "NONE");
    const avatar = toDirectGoogleDriveImageUrl(item.avatar) || PRESET_20_AVATARS[0];
    const encodedData = encodeURIComponent(JSON.stringify(item));
    const isAllowFree = (item.allowFree !== false);
    const showOnlineCount = (item.showOnlineCount !== false);
    const allowExportExam = (item.allowExportExam === true);
    
    const displayDate = getItemDisplayDate(item);
    const avatarSize = parseInt(item.avatarSize, 10) || 48;

    let badgeClass = "badge-empty";
    if (badge === "HOT") badgeClass = "b-hot";
    else if (badge === "NEW") badgeClass = "b-new";
    else if (badge === "MỚI") badgeClass = "b-moi";
    else if (badge === "LÀM NGAY") badgeClass = "b-lamngay";
    else if (badge === "CHÚ Ý" || badge === "WARNING") badgeClass = "b-warning";
    else if (badge === "BẮT ĐẦU") badgeClass = "b-start";

    let timeBoxHtml = "";
    if (!isDoc && (categoryId.includes("them") || categoryId.includes("lop") || categoryId.includes("hsg"))) {
        timeBoxHtml = `
            <div class="st-modal-time-box" style="margin: 6px 0 0 0; padding: 6px 10px; font-size: 11.5px; text-align: left;">
                ${buildTimeBoxHtml(item.timeLimitMinutes, item.examStartTimeStr, item.examEndTimeStr, item.date || displayDate)}
            </div>
        `;
    }

    let viewTestBtnHtml = "";
    if (!isDoc && isAdminLoggedIn) {
        viewTestBtnHtml = `
            <button type="button" class="btn-test-exam-admin" onclick="testExamAsAdmin('${quizId}', '${categoryId}', event)" title="Test thử đề thi & paste/upload ảnh trực tiếp">
                🚀 View đề & Đổi ảnh
            </button>
        `;
    }

    let reviewBtnHtml = "";
    if (!isDoc && item.allowReviewOriginal) {
        reviewBtnHtml = `
            <a href="thi.html?id=${quizId}&review=1" target="_blank" onclick="event.stopPropagation()" class="btn-review-origin-tag">
                📖 Xem Đ.Á Gốc
            </a>
        `;
    }

    let exportExamBtnHtml = "";
    if (!isDoc && (allowExportExam || isAdminLoggedIn)) {
        exportExamBtnHtml = `
            <div class="exam-export-dropdown-wrapper" onclick="event.stopPropagation()">
                <button type="button" class="btn-export-exam-trigger" onclick="toggleExamExportMenu('${itemId}', event)" title="Xuất đề thi ra bản in PDF hoặc file Word chuẩn đẹp">
                    📥 Xuất đề ▾
                </button>
                <div class="exam-export-menu" id="export-menu-${itemId}">
                    <div class="export-menu-header">📄 TÙY CHỌN XUẤT ĐỀ THI:</div>
                    <div class="export-menu-item" onclick="handleExportExamAction('${categoryId}', '${itemId}', 'pdf', false, event)">
                        <span class="export-item-icon">📄</span>
                        <div class="export-item-text">
                            <b>Xuất PDF - Đề thi</b>
                            <span>In ấn / Phát đề kiểm tra A4 (không đáp án)</span>
                        </div>
                    </div>
                    <div class="export-menu-item" onclick="handleExportExamAction('${categoryId}', '${itemId}', 'pdf', true, event)">
                        <span class="export-item-icon">📑</span>
                        <div class="export-item-text">
                            <b>Xuất PDF - Kèm Đáp án & Lời giải</b>
                            <span>Đề thi + Bảng đáp án + Lời giải chi tiết</span>
                        </div>
                    </div>
                    <div class="export-menu-divider"></div>
                    <div class="export-menu-item" onclick="handleExportExamAction('${categoryId}', '${itemId}', 'word', false, event)">
                        <span class="export-item-icon">📝</span>
                        <div class="export-item-text">
                            <b>Xuất Word (.doc) - Đề thi</b>
                            <span>Mở trực tiếp trên MS Word để chỉnh sửa</span>
                        </div>
                    </div>
                    <div class="export-menu-item" onclick="handleExportExamAction('${categoryId}', '${itemId}', 'word', true, event)">
                        <span class="export-item-icon">📘</span>
                        <div class="export-item-text">
                            <b>Xuất Word (.doc) - Kèm Lời giải</b>
                            <span>Soạn giáo án, đề thi hoàn chỉnh kèm đáp án</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // NÚT NỘP BÀI TỰ LUẬN DRIVE CHO MỖI ĐỀ THI
    let tuLuanBtnHtml = "";
    if (!isDoc || categoryId === "tu-luan-padlet") {
        tuLuanBtnHtml = `
            <button type="button" class="btn-tuluan-modal-trigger" onclick="openTuLuanModal('${categoryId}', '${itemId}', event)" title="Mở bảng nộp bài tự luận 45 học sinh lên Google Drive">
                📝 Nộp tự luận Drive
            </button>
        `;
    }

    let bottomActionButtonsHtml = "";
    if (viewTestBtnHtml || reviewBtnHtml || exportExamBtnHtml || tuLuanBtnHtml) {
        bottomActionButtonsHtml = `
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                ${tuLuanBtnHtml}
                ${viewTestBtnHtml}
                ${reviewBtnHtml}
                ${exportExamBtnHtml}
            </div>
        `;
    }

    let avatarPopoverHtml = "";
    if (isAdminLoggedIn) {
        avatarPopoverHtml = `
            <div class="avatar-selection-popover" id="avatar-popover-${itemId}" onclick="event.stopPropagation()">
                <div class="avatar-popover-header">
                    <span>🖼️ Cấu hình Avatar & Kích thước</span>
                    <button type="button" class="btn-close-popover-x" onclick="closeAvatarPopover('${itemId}', event)">✕</button>
                </div>
                
                <div class="avatar-size-control-box">
                    <div class="size-control-label">📏 Kích cỡ hiển thị avatar:</div>
                    <div class="avatar-size-pills">
                        <button type="button" class="size-pill-btn ${avatarSize === 38 ? 'active' : ''}" onclick="changeAvatarSize('${categoryId}', '${itemId}', 38, event)">🟢 Nhỏ (38px)</button>
                        <button type="button" class="size-pill-btn ${avatarSize === 48 ? 'active' : ''}" onclick="changeAvatarSize('${categoryId}', '${itemId}', 48, event)">🔵 Vừa (48px)</button>
                        <button type="button" class="size-pill-btn ${avatarSize === 62 ? 'active' : ''}" onclick="changeAvatarSize('${categoryId}', '${itemId}', 62, event)">🟠 To (62px)</button>
                        <button type="button" class="size-pill-btn ${avatarSize === 78 ? 'active' : ''}" onclick="changeAvatarSize('${categoryId}', '${itemId}', 78, event)">🔴 Rất to (78px)</button>
                    </div>
                </div>

                <div class="avatar-palette-title">🎨 Chọn trong 20 Avatar mẫu:</div>
                <div class="avatar-grid-20">
                    ${PRESET_20_AVATARS.map((url, i) => `
                        <div class="avatar-thumb-wrapper ${avatar === url ? 'current-selected' : ''}" onclick="selectItemAvatar('${categoryId}', '${itemId}', '${url}', event)">
                            <img src="${url}" class="avatar-mini-thumb" title="Avatar ${i+1}">
                        </div>
                    `).join('')}
                </div>

                <div class="avatar-upload-pc-box">
                    <button type="button" class="btn-upload-pc-avatar" onclick="triggerItemAvatarUploadPC('${categoryId}', '${itemId}', event)">
                        📁 Tải ảnh từ máy tính (lưu Google Drive)
                    </button>
                    <div class="avatar-upload-note">
                        💡 <b>Chú ý cỡ ảnh:</b> Khuyên dùng ảnh vuông tỉ lệ <b>1:1</b>.
                    </div>
                </div>
            </div>
        `;
    }

    if (isAdminLoggedIn) {
        return `
        <div class="exam-card admin-card-mode" id="card-${itemId}">
            <div class="admin-card-top-row">
                <div class="left-admin-actions-col">
                    ${!isDoc ? `
                        <button type="button" class="btn-view-results-left" onclick="openExamResultModal(${JSON.stringify(item).replace(/"/g, '&quot;')}, '${categoryId}', event)" title="Xem bảng điểm và nhật ký thi">
                            📊 Kết quả
                        </button>

                        <label class="free-student-toggle-wrap" title="Bật/Tắt chế độ thí sinh tự do" onclick="event.stopPropagation()">
                            <span class="free-toggle-lbl">Tự do:</span>
                            <span class="mini-switch">
                                <input type="checkbox" id="free-toggle-${itemId}" ${isAllowFree ? "checked" : ""} onchange="handleAllowFreeToggleChange('${categoryId}', '${itemId}', this.checked, event)">
                                <span class="slider-toggle"></span>
                            </span>
                            <span class="free-toggle-status ${isAllowFree ? 'st-on' : 'st-off'}" id="free-status-txt-${itemId}">
                                ${isAllowFree ? 'BẬT' : 'TẮT'}
                            </span>
                        </label>

                        <label class="free-student-toggle-wrap" title="Bật/Tắt hiển thị sĩ số phòng thi cho học sinh" onclick="event.stopPropagation()">
                            <span class="free-toggle-lbl" style="color:#0284c7;">Sĩ số:</span>
                            <span class="mini-switch">
                                <input type="checkbox" id="online-toggle-${itemId}" ${showOnlineCount ? "checked" : ""} onchange="handleShowOnlineCountToggleChange('${categoryId}', '${itemId}', '${quizId}', this.checked, event)">
                                <span class="slider-toggle" style="${showOnlineCount ? 'background-color:#0284c7;' : ''}"></span>
                            </span>
                            <span class="free-toggle-status ${showOnlineCount ? 'st-on' : 'st-off'}" id="online-status-txt-${itemId}" style="${showOnlineCount ? 'color:#0284c7;' : ''}">
                                ${showOnlineCount ? 'HIỆN' : 'ẨN'}
                            </span>
                        </label>
                        
                        <label class="free-student-toggle-wrap" title="Bật/Tắt chế độ cho học sinh xem đáp án gốc không cần thi" onclick="event.stopPropagation()">
                            <span class="free-toggle-lbl" style="color:#059669;">Xem Giải:</span>
                            <span class="mini-switch">
                                <input type="checkbox" id="review-toggle-${itemId}" ${item.allowReviewOriginal ? "checked" : ""} onchange="handleAllowReviewOriginalToggleChange('${categoryId}', '${itemId}', this.checked, event)">
                                <span class="slider-toggle" style="${item.allowReviewOriginal ? 'background-color:#10b981;' : ''}"></span>
                            </span>
                            <span class="free-toggle-status ${item.allowReviewOriginal ? 'st-on' : 'st-off'}" id="review-status-txt-${itemId}">
                                ${item.allowReviewOriginal ? 'MỞ' : 'TẮT'}
                            </span>
                        </label>

                        <label class="free-student-toggle-wrap" title="Bật/Tắt hiển thị nút Xuất đề thi (PDF/Word) cho học sinh" onclick="event.stopPropagation()">
                            <span class="free-toggle-lbl" style="color:#047857;">Hiện xuất đề:</span>
                            <span class="mini-switch">
                                <input type="checkbox" id="export-toggle-${itemId}" ${allowExportExam ? "checked" : ""} onchange="handleAllowExportExamToggleChange('${categoryId}', '${itemId}', '${quizId}', this.checked, event)">
                                <span class="slider-toggle" style="${allowExportExam ? 'background-color:#10b981;' : ''}"></span>
                            </span>
                            <span class="free-toggle-status ${allowExportExam ? 'st-on' : 'st-off'}" id="export-status-txt-${itemId}" style="${allowExportExam ? 'color:#16a34a;' : ''}">
                                ${allowExportExam ? 'HIỆN' : 'ẨN'}
                            </span>
                        </label>

                        <div class="left-sub-btns-row">
                            <button type="button" class="btn-time-sub-action btn-time-sub-minutes" onclick="openEditMinutesModal('${quizId}', event)" title="Đổi số phút làm bài">
                                ⏱ Đổi phút
                            </button>
                            <button type="button" class="btn-time-sub-action btn-time-sub-schedule" onclick="openEditScheduleModal('${quizId}', event)" title="Gia hạn thời gian đóng/mở đề">
                                📅 Gia hạn
                            </button>
                            <button type="button" class="btn-time-sub-action btn-time-sub-score" onclick="openGradingScaleModal('${quizId}', '${categoryId}', event)" title="Cấu hình thang điểm và phân bổ điểm cho đề thi">
                                🎯 Biểu điểm
                            </button>
                            
                            <div class="badge-wrapper" onclick="toggleResultModeMenu('${itemId}', event)" style="margin-left: 2px;">
                                <button type="button" class="btn-time-sub-action" style="background:#f3e8ff; color:#6b21a8; border:1px solid #d8b4fe; padding-right:12px;" title="Cấu hình hiển thị kết quả sau khi nộp bài">
                                    👁️ Công bố KQ ▾
                                </button>
                                <div class="badge-dropdown-menu" id="result-mode-menu-${itemId}" style="width: 265px; white-space: normal; padding: 6px;">
                                    <div class="b-item-btn ${item.resultMode === 'hide_all' ? 'b-hot' : 'b-none-btn'}" onclick="setResultMode('${categoryId}', '${itemId}', '${quizId}', 'hide_all', event)" style="text-align:left; line-height:1.3; margin-bottom:5px;">
                                        <b>🚫 Tắt toàn bộ</b><br><span style="font-size:10.5px; font-weight:600;">Giấu điểm & đáp án (Chỉ báo nộp thành công)</span>
                                    </div>
                                    <div class="b-item-btn ${item.resultMode === 'score_only' ? 'b-moi' : 'b-none-btn'}" onclick="setResultMode('${categoryId}', '${itemId}', '${quizId}', 'score_only', event)" style="text-align:left; line-height:1.3; margin-bottom:5px;">
                                        <b>🔢 Chỉ hiện điểm</b><br><span style="font-size:10.5px; font-weight:600;">Báo điểm số, giấu chi tiết đúng/sai từng câu</span>
                                    </div>
                                    <div class="b-item-btn ${(!item.resultMode || item.resultMode === 'show_all') ? 'b-start' : 'b-none-btn'}" onclick="setResultMode('${categoryId}', '${itemId}', '${quizId}', 'show_all', event)" style="text-align:left; line-height:1.3;">
                                        <b>✅ Hiện tất cả (Mặc định)</b><br><span style="font-size:10.5px; font-weight:600;">Hiện điểm và giải thích chi tiết từng câu</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : (isReminder ? `
                        <button type="button" class="btn-edit-inline-title" onclick="openDantriArticleModal(${JSON.stringify(item).replace(/"/g, '&quot;')}, '${categoryId}', event, true)" title="Mở trang soạn thảo bài viết phong cách Dân trí">
                            📰 Soạn thảo bài viết
                        </button>
                    ` : '')}
                </div>

                <div class="admin-link-tools">
                    ${!isDoc ? `
                        <span class="shuffle-label">Đảo:</span>
                        <label class="switch-toggle" title="Bật/Tắt đảo thứ tự câu hỏi và phương án">
                            <input type="checkbox" ${item.isShuffled !== false ? "checked" : ""} onchange="toggleShuffle('${categoryId}', '${itemId}', this.checked, event)">
                            <span class="slider-toggle"></span>
                        </label>
                    ` : ''}
                    <button type="button" class="tool-btn tool-btn-up" onclick="moveItemOrder('${categoryId}', '${itemId}', 'up', event)" title="Lên trên">▲</button>
                    <button type="button" class="tool-btn tool-btn-down" onclick="moveItemOrder('${categoryId}', '${itemId}', 'down', event)" title="Xuống dưới">▼</button>
                    <button type="button" class="tool-btn tool-btn-copy" onclick="openCopyModal('${categoryId}', '${itemId}', '${encodedData}', event)" title="Nhân bản sang lớp khác">📋</button>
                    <button type="button" class="tool-btn tool-btn-move" onclick="openMoveModal('${categoryId}', '${itemId}', '${encodedData}', event)" title="Chuyển lớp">🔄</button>
                    <button type="button" class="tool-btn tool-btn-edit" onclick="${isReminder ? `openDantriArticleModal(${JSON.stringify(item).replace(/"/g, '&quot;')}, '${categoryId}', event, true)` : `renameItem('${categoryId}', '${itemId}', ${isDoc}, '${(item.title || "").replace(/'/g, "\\'")}', event)`}" title="Sửa bài">✏️</button>
                    <button type="button" class="tool-btn tool-btn-delete" onclick="deleteItem('${categoryId}', '${itemId}', event)" title="Xóa vĩnh viễn">🗑️</button>
                </div>
            </div>

            <div class="admin-card-bottom-row" onclick="handleCardClick('${categoryId}', '${itemId}', ${isDoc}, '${encodeURIComponent(item.url || '')}', '${encodedData}', event)">
                <div class="exam-thumb-box" onclick="openItemAvatarPicker('${itemId}', event)" title="Ấn để chọn 20 Avatar mẫu, đổi kích thước từ nhỏ đến rất to, hoặc tải từ máy tính" style="width: ${avatarSize}px; height: ${avatarSize}px; cursor: pointer;">
                    <img src="${avatar}" class="exam-thumb" alt="icon">
                    ${avatarPopoverHtml}
                </div>
                <div class="exam-info">
                    <div class="exam-header-row">
                        <div class="badge-wrapper" onclick="toggleBadgeMenu('${itemId}', event)">
                            <span class="badge-item ${badgeClass}">${badge !== "NONE" ? badge : "+ Badge"}</span>
                            <div class="badge-dropdown-menu" id="badge-menu-${itemId}">
                                <div class="b-item-btn b-hot" onclick="selectBadgeOption('${categoryId}', '${itemId}', 'HOT', event)">HOT</div>
                                <div class="b-item-btn b-new" onclick="selectBadgeOption('${categoryId}', '${itemId}', 'NEW', event)">NEW</div>
                                <div class="b-item-btn b-moi" onclick="selectBadgeOption('${categoryId}', '${itemId}', 'MỚI', event)">MỚI</div>
                                <div class="b-item-btn b-lamngay" onclick="selectBadgeOption('${categoryId}', '${itemId}', 'LÀM NGAY', event)">LÀM NGAY</div>
                                <div class="b-item-btn b-warning" onclick="selectBadgeOption('${categoryId}', '${itemId}', 'CHÚ Ý', event)">CHÚ Ý</div>
                                <div class="b-item-btn b-start" onclick="selectBadgeOption('${categoryId}', '${itemId}', 'BẮT ĐẦU', event)">BẮT ĐẦU</div>
                                <div class="b-item-btn b-none-btn" onclick="selectBadgeOption('${categoryId}', '${itemId}', 'NONE', event)">✕ Ẩn Badge</div>
                            </div>
                        </div>
                        <span class="exam-title-text">${item.title}</span>
                        ${isReminder ? `
                            <button type="button" class="btn-edit-inline-title" onclick="openDantriArticleModal(${JSON.stringify(item).replace(/"/g, '&quot;')}, '${categoryId}', event, true)" title="Chỉnh sửa bài viết">
                                ✏️ Sửa
                            </button>
                        ` : `
                            <button type="button" class="btn-edit-inline-title" onclick="renameItem('${categoryId}', '${itemId}', ${isDoc}, '${(item.title || "").replace(/'/g, "\\'")}', event)" title="Sửa tên tiêu đề">
                                ✏️ Sửa
                            </button>
                        `}
                    </div>
                    <div class="exam-date">📅 ${displayDate}</div>
                    ${timeBoxHtml}
                    ${bottomActionButtonsHtml}
                </div>
                <div class="arrow">›</div>
            </div>
        </div>`;
    }

    return `
    <div class="exam-card" id="card-${itemId}" onclick="handleCardClick('${categoryId}', '${itemId}', ${isDoc}, '${encodeURIComponent(item.url || '')}', '${encodedData}', event)">
        <div class="exam-thumb-box" style="width: ${avatarSize}px; height: ${avatarSize}px;">
            <img src="${avatar}" class="exam-thumb" alt="icon">
        </div>
        <div class="exam-info">
            <div class="exam-header-row">
                ${badge !== "NONE" ? `<span class="badge-item ${badgeClass}">${badge}</span>` : ''}
                <span class="exam-title-text">${item.title}</span>
            </div>
            <div class="exam-date">📅 ${displayDate}</div>
            ${timeBoxHtml}
            ${bottomActionButtonsHtml}
        </div>
        <div class="arrow">›</div>
    </div>`;
}

function handleCardClick(categoryId, itemId, isDoc, rawUrl, stringifiedData, event) {
    if (event) {
        if (event.target.closest('.exam-thumb-box') ||
            event.target.closest('.avatar-selection-popover') ||
            event.target.closest('.free-student-toggle-wrap') || 
            event.target.closest('.mini-switch') || 
            event.target.closest('.admin-link-tools') || 
            event.target.closest('.badge-wrapper') || 
            event.target.closest('.btn-view-results-left') || 
            event.target.closest('.left-sub-btns-row') ||
            event.target.closest('.btn-edit-inline-title') ||
            event.target.closest('.btn-test-exam-admin') ||
            event.target.closest('.exam-export-dropdown-wrapper') ||
            event.target.closest('.btn-tuluan-modal-trigger')) {
            return;
        }
    }

    const item = JSON.parse(decodeURIComponent(stringifiedData));

    if (categoryId === "nhac-nho") {
        openDantriArticleModal(item, categoryId, event, false);
        return;
    }

    const url = decodeURIComponent(rawUrl || item.url || "");
    if (isDoc || categoryId === "tu-luan-padlet" || categoryId === "kho-tai-lieu" || !url.includes("thi.html")) {
        if (url && url !== "#") window.open(url, "_blank");
        return;
    }

    openStudentLoginModal(item, categoryId, event);
}

async function handleAllowExportExamToggleChange(categoryId, itemId, quizId, isChecked, event) {
    if (event) event.stopPropagation();

    const txt = document.getElementById(`export-status-txt-${itemId}`);
    if (txt) {
        txt.innerText = isChecked ? 'HIỆN' : 'ẨN';
        txt.className = `free-toggle-status ${isChecked ? 'st-on' : 'st-off'}`;
        txt.style.color = isChecked ? '#16a34a' : '';
    }

    const slider = document.querySelector(`#export-toggle-${itemId} ~ .slider-toggle`);
    if (slider) slider.style.backgroundColor = isChecked ? '#10b981' : '#cbd5e1';

    const allCats = [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES, KHO_TAI_LIEU_FOLDER];
    allCats.forEach(cat => {
        if (cat.links) {
            const found = cat.links.find(l => (l.firebaseId === itemId || l.id === itemId));
            if (found) found.allowExportExam = isChecked;
        }
    });

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allowExportExam: isChecked })
        });
        const effectiveQuizId = quizId || (itemId.startsWith('quiz_') ? itemId : null);
        if (effectiveQuizId) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${effectiveQuizId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ allowExportExam: isChecked })
            }).catch(() => null);
            await fetch(`${FIREBASE_DB_URL}/exam_configs/${effectiveQuizId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ allowExportExam: isChecked })
            }).catch(() => null);
        }
    } catch(e) {
        console.error("Lỗi cập nhật trạng thái xuất đề:", e);
    }
}

async function handleShowOnlineCountToggleChange(categoryId, itemId, quizId, isChecked, event) {
    if (event) event.stopPropagation();
    
    const txt = document.getElementById(`online-status-txt-${itemId}`);
    if (txt) {
        txt.innerText = isChecked ? 'HIỆN' : 'ẨN';
        txt.className = `free-toggle-status ${isChecked ? 'st-on' : 'st-off'}`;
        txt.style.color = isChecked ? '#0284c7' : '';
    }
    
    const slider = document.querySelector(`#online-toggle-${itemId} ~ .slider-toggle`);
    if (slider) slider.style.backgroundColor = isChecked ? '#0284c7' : '#cbd5e1';

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: 'PATCH', body: JSON.stringify({ showOnlineCount: isChecked })
        });
        if (quizId) {
            await fetch(`${FIREBASE_DB_URL}/exam_configs/${quizId}.json`, {
                method: 'PATCH', body: JSON.stringify({ showOnlineCount: isChecked })
            });
            await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, {
                method: 'PATCH', body: JSON.stringify({ showOnlineCount: isChecked })
            }).catch(e=>null);
        }
    } catch(e) { console.error(e); }
}

function toggleBadgeMenu(itemId, event) {
    if (!isAdminLoggedIn) return;
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const menu = document.getElementById(`badge-menu-${itemId}`);
    if (!menu) return;
    document.querySelectorAll(".badge-dropdown-menu.show").forEach(m => { if (m !== menu) m.classList.remove("show"); });
    menu.classList.toggle("show");
}

async function selectBadgeOption(categoryId, itemId, badgeType, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const menu = document.getElementById(`badge-menu-${itemId}`);
    if (menu) menu.classList.remove("show");
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: 'PATCH', body: JSON.stringify({ badgeText: badgeType })
        });
        window.location.reload();
    } catch (e) { alert("Lỗi đổi badge!"); }
}

function toggleResultModeMenu(itemId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const menu = document.getElementById(`result-mode-menu-${itemId}`); if (!menu) return;
    document.querySelectorAll(".badge-dropdown-menu.show").forEach(m => { if (m !== menu) m.classList.remove("show"); });
    menu.classList.toggle("show");
}

async function setResultMode(categoryId, itemId, quizId, mode, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const menu = document.getElementById(`result-mode-menu-${itemId}`); if (menu) menu.classList.remove("show");
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ resultMode: mode }) });
        if (quizId && quizId !== itemId) { await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, { method: 'PATCH', body: JSON.stringify({ resultMode: mode }) }); } 
        else if (itemId.startsWith('quiz_')) { await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ resultMode: mode }) }); }
        alert("✅ Đã cập nhật chế độ hiển thị kết quả thành công!"); window.location.reload();
    } catch(e) { alert("❌ Lỗi cập nhật: " + e.message); }
}

async function handleAllowReviewOriginalToggleChange(categoryId, itemId, isChecked, event) {
    if (event) event.stopPropagation();
    const txt = document.getElementById(`review-status-txt-${itemId}`);
    if (txt) { txt.innerText = isChecked ? 'MỞ' : 'TẮT'; txt.className = `free-toggle-status ${isChecked ? 'st-on' : 'st-off'}`; }
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ allowReviewOriginal: isChecked }) });
        const quizId = itemId.startsWith('quiz_') ? itemId : null;
        if (quizId) { await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, { method: 'PATCH', body: JSON.stringify({ allowReviewOriginal: isChecked }) }); }
    } catch(e) { console.error(e); }
}

document.addEventListener("click", function(event) {
    const adminWrapper = event.target.closest(".admin-controls-wrapper");
    if (!adminWrapper) {
        const authContainer = document.getElementById("auth-container");
        if (authContainer && authContainer.classList.contains("show")) { authContainer.classList.remove("show"); }
        if (typeof closeAdminPanel === "function") { closeAdminPanel(); }
    }
    const badgeWrapper = event.target.closest(".badge-wrapper");
    if (!badgeWrapper) { document.querySelectorAll(".badge-dropdown-menu.show").forEach(m => m.classList.remove("show")); }
    const avatarBox = event.target.closest(".exam-thumb-box");
    if (!avatarBox) {
        document.querySelectorAll(".avatar-selection-popover.show").forEach(p => p.classList.remove("show"));
        document.querySelectorAll(".exam-card.has-active-popover").forEach(c => c.classList.remove("has-active-popover"));
    }
    const exportWrapper = event.target.closest(".exam-export-dropdown-wrapper");
    if (!exportWrapper) {
        document.querySelectorAll(".exam-export-menu.show").forEach(m => m.classList.remove("show"));
        document.querySelectorAll(".exam-card.has-active-export").forEach(c => c.classList.remove("has-active-export"));
    }
    const visitModal = document.getElementById("visit-stats-modal");
    if (visitModal && visitModal.style.display === "flex") { if (event.target === visitModal) { closeVisitStatsModal(); } }
    const articleModal = document.getElementById("dantri-article-modal");
    if (articleModal && articleModal.style.display === "flex") { if (event.target.id === "dantri-article-modal") { closeArticleModal(); } }
});
