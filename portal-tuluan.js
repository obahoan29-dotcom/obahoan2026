// =========================================================
// FILE: portal-tuluan.js
// QUẢN LÝ NỘP BÀI TỰ LUẬN GOOGLE DRIVE 5TB ĐỒNG BỘ 1 THƯ MỤC DUY NHẤT
// BẢO VỆ CHỐNG CHÉP BÀI, NÚT XÓA ẢNH (✕) TỰ ĐỘNG NHÚNG CSS
// TỰ ĐỘNG NẠP ĐÚNG 5 ĐỀ MỚI NHẤT CHO TỪNG LỚP
// =========================================================

// TỰ ĐỘNG NHÚNG CSS NÚT XÓA ẢNH (✕) VÀO TRANG MÀ KHÔNG CẦN SỬA FILE style-modals.css
(function injectTuLuanButtonStyles() {
    const styleId = "tuluan-custom-delete-btn-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
        .tuluan-img-thumbnail-item {
            position: relative !important;
            display: inline-block !important;
        }
        .btn-del-single-thumb {
            position: absolute !important;
            top: 2px !important;
            right: 2px !important;
            width: 17px !important;
            height: 17px !important;
            background: #ef4444 !important;
            color: #ffffff !important;
            border: 1px solid #ffffff !important;
            border-radius: 50% !important;
            font-size: 10px !important;
            font-weight: 900 !important;
            line-height: 1 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45) !important;
            opacity: 0;
            transition: opacity 0.2s ease, transform 0.15s ease, background 0.15s ease !important;
            z-index: 20 !important;
            padding: 0 !important;
            user-select: none !important;
        }
        .tuluan-img-thumbnail-item:hover .btn-del-single-thumb {
            opacity: 1 !important;
        }
        @media (hover: none) {
            .btn-del-single-thumb {
                opacity: 0.9 !important;
            }
        }
        .btn-del-single-thumb:hover {
            background: #b91c1c !important;
            transform: scale(1.2) !important;
        }
        .btn-del-single-thumb:active {
            transform: scale(0.9) !important;
        }
    `;
    document.head.appendChild(style);
})();

let currentTuLuanModalData = {
    classId: "lop-11a",
    quizId: "",
    examTitle: "",
    submissionsMap: {},
    availableExams: [],
    statusFilter: "all"
};

let tuLuanEventSource = null;

// Chuẩn hóa tên lớp thành tên thư mục Drive duy nhất (VD: "lop-11a" -> "11A")
function getCleanDriveClassName(rawClass) {
    if (!rawClass) return "11A";
    let str = String(rawClass).trim();
    str = str.replace(/^(?:Lớp|Lop|lop)[_\-\s]*/i, "");
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    str = str.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").trim().toUpperCase();
    return str || "11A";
}

// Chuẩn hóa tên thư mục đề thi trên Google Drive
function getUnifiedExamFolderKey(title, maDe, quizId) {
    let key = (title || maDe || quizId || "BAI_TAP_TU_LUAN").trim();
    return key
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[\\\/\:\*\?\"<>\|]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_');
}

// Chuẩn hóa tên thư mục học sinh: STT - SBD - HO_VA_TEN
function getStudentFolderKey(stt, sbd, name) {
    const padStt = String(stt || "00").padStart(2, '0');
    const cleanSbd = String(sbd || "NOSBD").trim().replace(/[^a-zA-Z0-9]/g, '_');
    const cleanName = String(name || "HOC_SINH").trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .toUpperCase();
    return `${padStt}_${cleanSbd}_${cleanName}`;
}

// Nén ảnh Client-side bằng HTML5 Canvas siêu tốc
function compressImageForTuLuanAsync(file, maxDimension = 2048, quality = 0.82) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.match(/image.*/)) {
            return reject(new Error("Tệp chọn không phải là hình ảnh!"));
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                const base64 = dataUrl.split(",")[1];
                resolve({ base64, dataUrl, mimeType: "image/jpeg" });
            };
            img.onerror = () => reject(new Error("Lỗi đọc cấu trúc ảnh!"));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Lỗi đọc tệp từ thiết bị!"));
        reader.readAsDataURL(file);
    });
}

function ensureTuLuanModalDOM() {
    if (document.getElementById("modal-tuluan-submission")) return;
    const modalDiv = document.createElement("div");
    modalDiv.id = "modal-tuluan-submission";
    modalDiv.className = "move-modal-overlay";
    modalDiv.innerHTML = `
        <div class="tuluan-modal-card" onclick="event.stopPropagation()">
            <!-- HEADER -->
            <div class="tuluan-modal-header">
                <div class="tuluan-header-title-box">
                    <span class="tuluan-icon-badge">📁</span>
                    <div>
                        <h3 id="tuluan-modal-heading" style="margin:0; color:#0f172a; font-size:16px; font-weight:900;">📤 NỘP BÀI TỰ LUẬN GOOGLE DRIVE</h3>
                        <div id="tuluan-modal-subheading" style="font-size:12px; color:#64748b; font-weight:700; margin-top:2px;">
                            Thư mục Drive: <code id="tuluan-drive-folder-path" style="color:#0284c7; background:#e0f2fe; padding:2px 6px; border-radius:6px;">BAI_TAP_TU_LUAN</code>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn-close-cleanup-modal" onclick="closeTuLuanModal(event)">✕</button>
            </div>

            <!-- THANH ĐIỀU HƯỚNG CHỌN LỚP, CHỌN 5 ĐỀ MỚI NHẤT & ADMIN THÊM ĐỀ -->
            <div class="tuluan-select-bar">
                <div class="tuluan-select-group">
                    <label>🏫 Lớp:</label>
                    <select id="tuluan-class-selector" onchange="onTuLuanClassChanged(this.value)">
                        <option value="lop-11a">Lớp 11A</option>
                        <option value="lop-11c">Lớp 11C</option>
                        <option value="lop-10p">Lớp 10P</option>
                        <option value="lop-11e">Lớp 11E</option>
                        <option value="them-11">Thêm 11</option>
                        <option value="them-10">Thêm 10</option>
                        <option value="them-12">Thêm 12</option>
                        <option value="hsg-toan-11">HSG Toán 11</option>
                    </select>
                </div>

                <div class="tuluan-select-group" style="flex:1; min-width:220px;">
                    <label>📝 Chọn đề thi (5 đề mới nhất):</label>
                    <select id="tuluan-exam-selector" onchange="onTuLuanExamChanged(this.value)"></select>
                </div>

                <div id="tuluan-admin-add-exam-box" style="display:none; align-items:flex-end; gap:6px;">
                    <button type="button" class="btn-tuluan-add-exam" onclick="promptAddNewTuLuanExam()">
                        ➕ Thêm đề mới
                    </button>
                    <button type="button" class="btn-tuluan-approve-all" onclick="toggleApproveAllSubmissions(true)" title="Duyệt tất cả bài làm của đề này để học sinh cùng xem">
                        ✅ Duyệt tất cả
                    </button>
                </div>
            </div>

            <!-- TOOLBAR LỌC & TÌM KIẾM -->
            <div class="tuluan-toolbar-bar">
                <input type="text" id="tuluan-search-student" class="tuluan-search-box" placeholder="🔍 Tìm tên hoặc SBD..." oninput="filterTuLuanStudentTable()">
                <div class="tuluan-filter-tabs">
                    <button type="button" class="tuluan-tab-pill active" id="tab-filter-all" onclick="filterTuLuanStatus('all')">Tất cả (<span id="count-all-st">0</span>)</button>
                    <button type="button" class="tuluan-tab-pill" id="tab-filter-submitted" onclick="filterTuLuanStatus('submitted')">✅ Đã nộp (<span id="count-sub-st">0</span>)</button>
                    <button type="button" class="tuluan-tab-pill" id="tab-filter-pending" onclick="filterTuLuanStatus('pending')">⏳ Chưa nộp (<span id="count-pen-st">0</span>)</button>
                </div>
            </div>

            <!-- BẢNG DANH SÁCH HỌC SINH -->
            <div class="tuluan-table-wrap">
                <table class="tuluan-table">
                    <thead>
                        <tr>
                            <th style="width: 42px; text-align: center;">STT</th>
                            <th style="width: 165px;">Họ và tên</th>
                            <th style="width: 80px; text-align: center;">SBD</th>
                            <th style="width: 155px;">Trạng thái / Ngày nộp</th>
                            <th style="width: 125px; text-align: center;">Phê duyệt</th>
                            <th style="min-width: 180px;">Ảnh bài làm đã nộp</th>
                            <th style="width: 105px; text-align: center;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="tuluan-students-tbody"></tbody>
                </table>
            </div>

            <div class="tuluan-modal-footer">
                <span style="font-size:11.5px; color:#475569; font-style:italic;">
                    🔒 Học sinh chỉ xem được ảnh bài làm phóng to của bạn bè sau khi được Giáo viên phê duyệt.
                </span>
                <button type="button" class="btn-admin btn-cancel" style="padding: 6px 18px;" onclick="closeTuLuanModal(event)">Đóng</button>
            </div>
        </div>

        <!-- LIGHTBOX PHÓNG TO ẢNH -->
        <div id="tuluan-lightbox" class="tuluan-lightbox-overlay" onclick="closeTuLuanLightbox(event)">
            <div class="tuluan-lightbox-content" onclick="event.stopPropagation()">
                <div class="tuluan-lightbox-header">
                    <span id="lightbox-student-title" style="font-weight:800; font-size:14px; color:#ffffff;">Ảnh bài làm</span>
                    <div style="display:flex; gap:8px;">
                        <a id="lightbox-drive-link" href="#" target="_blank" class="btn-lightbox-open-drive">🔗 Mở trên Drive</a>
                        <button type="button" class="btn-close-lightbox" onclick="closeTuLuanLightbox(event)">✕</button>
                    </div>
                </div>
                <div class="tuluan-lightbox-img-box">
                    <img id="lightbox-full-img" src="" alt="Ảnh bài làm tự luận">
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalDiv);
}

// Mở Modal Nộp bài tự luận
async function openTuLuanModal(classId, itemId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    ensureTuLuanModalDOM();

    let targetCat = classId;
    if (targetCat === "tu-luan-padlet" || !targetCat) {
        if (itemId && itemId.includes("11c")) targetCat = "lop-11c";
        else if (itemId && itemId.includes("10p")) targetCat = "lop-10p";
        else if (itemId && itemId.includes("11e")) targetCat = "lop-11e";
        else targetCat = "lop-11a";
    }

    currentTuLuanModalData.classId = targetCat;
    const classSelector = document.getElementById("tuluan-class-selector");
    if (classSelector) classSelector.value = targetCat;

    const adminBox = document.getElementById("tuluan-admin-add-exam-box");
    if (adminBox) {
        adminBox.style.display = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) ? "flex" : "none";
    }

    document.getElementById("modal-tuluan-submission").style.display = "flex";
    await refreshTuLuanExamList(targetCat, itemId);
}

function closeTuLuanModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const modal = document.getElementById("modal-tuluan-submission");
    if (modal) modal.style.display = "none";
    if (tuLuanEventSource) {
        tuLuanEventSource.close();
        tuLuanEventSource = null;
    }
}

// XỬ LÝ TRIỆT ĐỂ VIỆC BỊ KHÓA CHẾT ĐỀ, QUÉT ĐÚNG 5 ĐỀ MỚI NHẤT CỦA LỚP
async function refreshTuLuanExamList(targetCat, preferredExamId = null) {
    const selector = document.getElementById("tuluan-exam-selector");
    if (!selector) return;
    selector.innerHTML = "<option value=''>⏳ Đang tải danh sách 5 đề mới nhất...</option>";

    let rawExams = [];

    // 1. Quét từ Firebase node /custom_links/{targetCat}
    try {
        const resCat = await fetch(`${FIREBASE_DB_URL}/custom_links/${targetCat}.json`);
        if (resCat && resCat.ok) {
            const catData = await resCat.json();
            if (catData && typeof catData === 'object') {
                for (let k in catData) {
                    const item = catData[k];
                    if (item && item.title && String(item.title).trim() !== "" && !item.isDoc) {
                        let t = item.timestamp || (typeof parseDateString === 'function' ? parseDateString(item.date) : 0) || 0;
                        rawExams.push({
                            id: (typeof extractQuizIdFromItem === 'function') ? (extractQuizIdFromItem(item) || k) : k,
                            title: item.title,
                            timestamp: t
                        });
                    }
                }
            }
        }
    } catch(e) {}

    // 2. Quét dự phòng từ danh mục đề thi cục bộ trên RAM
    const allCats = [...(window.DAY_THEM_CATEGORIES || []), ...(window.CHINH_KHOA_CATEGORIES || [])];
    const catObj = allCats.find(c => c.id === targetCat);
    if (catObj && Array.isArray(catObj.links)) {
        catObj.links.forEach(l => {
            if (l && l.title && !l.isDoc) {
                let t = l.timestamp || (typeof parseDateString === 'function' ? parseDateString(l.date) : 0) || 0;
                rawExams.push({
                    id: (typeof extractQuizIdFromItem === 'function') ? (extractQuizIdFromItem(l) || l.id) : l.id,
                    title: l.title,
                    timestamp: t
                });
            }
        });
    }

    // 3. Quét các đề tự luận bổ sung được giáo viên tạo
    try {
        const resCustom = await fetch(`${FIREBASE_DB_URL}/custom_tuluan_exams/${targetCat}.json`);
        if (resCustom && resCustom.ok) {
            const customData = await resCustom.json();
            if (customData && typeof customData === 'object') {
                for (let k in customData) {
                    if (customData[k] && customData[k].title) {
                        rawExams.push({
                            id: k,
                            title: customData[k].title,
                            timestamp: customData[k].createdAt || Date.now()
                        });
                    }
                }
            }
        }
    } catch(e) {}

    // Sắp xếp giảm dần theo thời gian (đề mới nhất lên trên)
    rawExams.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Lọc trùng theo tên đề thi
    const uniqueExams = [];
    const seenTitles = new Set();
    rawExams.forEach(ex => {
        const norm = ex.title.trim().toLowerCase();
        if (!seenTitles.has(norm)) {
            seenTitles.add(norm);
            uniqueExams.push(ex);
        }
    });

    // LẤY ĐÚNG 5 ĐỀ MỚI NHẤT
    let top5Exams = uniqueExams.slice(0, 5);

    if (top5Exams.length === 0) {
        top5Exams.push({ id: "DE_108_TOAN_11_THEM-_HK1", title: "DE_108_TOAN_11_THEM-_HK1", timestamp: Date.now() });
    }

    currentTuLuanModalData.availableExams = top5Exams;
    selector.innerHTML = "";

    top5Exams.forEach((ex, idx) => {
        const opt = document.createElement("option");
        opt.value = ex.id;
        opt.innerText = `${idx + 1}. ${ex.title}`;
        opt.dataset.title = ex.title;
        selector.appendChild(opt);
    });

    let selectedExam = top5Exams[0];
    if (preferredExamId) {
        const found = top5Exams.find(e => e.id === preferredExamId || e.title === preferredExamId);
        if (found) selectedExam = found;
    }
    selector.value = selectedExam.id;

    await switchTuLuanExam(selectedExam.id, selectedExam.title);
}

// Chuyển đổi đề thi hiển thị trong Modal
async function switchTuLuanExam(examId, examTitle) {
    currentTuLuanModalData.quizId = examId;
    currentTuLuanModalData.examTitle = examTitle;

    const folderKey = getUnifiedExamFolderKey(examTitle, "", examId);
    const driveClassName = getCleanDriveClassName(currentTuLuanModalData.classId);

    const headTitle = document.getElementById("tuluan-modal-heading");
    const pathCode = document.getElementById("tuluan-drive-folder-path");
    if (headTitle) headTitle.innerText = `📤 NỘP BÀI TỰ LUẬN - ${examTitle}`;
    if (pathCode) pathCode.innerText = `BAI_TAP_TU_LUAN / ${driveClassName} / ${folderKey} / [STT_SBD_HỌ_TÊN]`;

    await loadTuLuanSubmissionsFromFirebase();
    renderTuLuanStudentsTable();
    startTuLuanRealtimeListener(examId);
}

function onTuLuanClassChanged(newClassId) {
    currentTuLuanModalData.classId = newClassId;
    refreshTuLuanExamList(newClassId);
}

function onTuLuanExamChanged(newExamId) {
    const selector = document.getElementById("tuluan-exam-selector");
    const selectedOpt = selector.options[selector.selectedIndex];
    const examTitle = selectedOpt ? selectedOpt.dataset.title : newExamId;
    switchTuLuanExam(newExamId, examTitle);
}

// Thêm đề tự luận mới
async function promptAddNewTuLuanExam() {
    const inputTitle = prompt("➕ NHẬP TÊN ĐỀ THI TỰ LUẬN MỚI (VD: Đề 109 Giữa Kỳ 1, Đề 108 Toán 11...):");
    if (!inputTitle || !inputTitle.trim()) return;

    const examTitle = inputTitle.trim();
    const classId = currentTuLuanModalData.classId || "lop-11a";
    const examId = "exam_" + Date.now();
    const folderKey = getUnifiedExamFolderKey(examTitle, "", examId);
    const driveClassName = getCleanDriveClassName(classId);

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_tuluan_exams/${classId}/${examId}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: examTitle, createdAt: Date.now() })
        });

        const gasUrl = (typeof GOOGLE_DRIVE_TULUAN_GAS_URL !== "undefined" && GOOGLE_DRIVE_TULUAN_GAS_URL) 
            ? GOOGLE_DRIVE_TULUAN_GAS_URL 
            : GOOGLE_DRIVE_UPLOAD_GAS_URL;

        if (gasUrl && !gasUrl.includes("DÁN_URL")) {
            fetch(gasUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "createExamFolders",
                    examTitle: folderKey,
                    classList: [driveClassName]
                })
            }).catch(() => null);
        }

        alert(`✅ Đã thêm đề "${examTitle}" thành công!\nThư mục tương ứng đã được khởi tạo trên Google Drive 5TB.`);
        await refreshTuLuanExamList(classId, examId);
    } catch(err) {
        alert("❌ Lỗi khi thêm đề: " + err.message);
    }
}

// Đọc danh sách bài nộp từ Firebase
async function loadTuLuanSubmissionsFromFirebase() {
    const qId = currentTuLuanModalData.quizId;
    if (!qId) return;
    try {
        const [qRes, exRes] = await Promise.all([
            fetch(`${FIREBASE_DB_URL}/quizzes/${qId}/tu_luan.json`).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/exams/${qId}/tu_luan.json`).catch(() => null)
        ]);

        let combined = {};
        if (qRes && qRes.ok) {
            const data1 = await qRes.json();
            if (data1 && typeof data1 === 'object') Object.assign(combined, data1);
        }
        if (exRes && exRes.ok) {
            const data2 = await exRes.json();
            if (data2 && typeof data2 === 'object') {
                for (let k in data2) {
                    if (!combined[k] || (data2[k].lastSubmitTime || 0) > (combined[k].lastSubmitTime || 0)) {
                        combined[k] = data2[k];
                    }
                }
            }
        }
        currentTuLuanModalData.submissionsMap = combined;
    } catch(e) {
        currentTuLuanModalData.submissionsMap = {};
    }
}

function startTuLuanRealtimeListener(quizId) {
    if (tuLuanEventSource) {
        tuLuanEventSource.close();
        tuLuanEventSource = null;
    }
    if (!quizId) return;
    try {
        tuLuanEventSource = new EventSource(`${FIREBASE_DB_URL}/quizzes/${quizId}/tu_luan.json`);
        tuLuanEventSource.addEventListener('put', async () => {
            await loadTuLuanSubmissionsFromFirebase();
            renderTuLuanStudentsTable();
        });
        tuLuanEventSource.addEventListener('patch', async () => {
            await loadTuLuanSubmissionsFromFirebase();
            renderTuLuanStudentsTable();
        });
    } catch(e) {}
}

// Render bảng học sinh: CÓ NÚT XÓA ẢNH (✕) TẠI MỖI THUMBNAIL
function renderTuLuanStudentsTable() {
    const tbody = document.getElementById("tuluan-students-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const students = getAccountsForCategory(currentTuLuanModalData.classId);
    const searchVal = (document.getElementById("tuluan-search-student")?.value || "").trim().toLowerCase();
    const subMap = currentTuLuanModalData.submissionsMap || {};
    const isAdmin = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn);

    let totalSt = students.length;
    let submittedCount = 0;

    students.forEach(st => {
        const cleanSbd = String(st.sbd || "").trim().replace(/[^a-zA-Z0-9]/g, '_');
        if (subMap[cleanSbd] && subMap[cleanSbd].images && subMap[cleanSbd].images.length > 0) {
            submittedCount++;
        }
    });

    const elTotal = document.getElementById("count-all-st");
    const elSub = document.getElementById("count-sub-st");
    const elPen = document.getElementById("count-pen-st");
    if (elTotal) elTotal.innerText = totalSt;
    if (elSub) elSub.innerText = submittedCount;
    if (elPen) elPen.innerText = (totalSt - submittedCount);

    students.forEach(st => {
        const cleanSbd = String(st.sbd || "").trim().replace(/[^a-zA-Z0-9]/g, '_');
        const record = subMap[cleanSbd];
        const hasSubmitted = Boolean(record && record.images && record.images.length > 0);
        const isApproved = Boolean(record && record.isApproved === true);

        if (currentTuLuanModalData.statusFilter === "submitted" && !hasSubmitted) return;
        if (currentTuLuanModalData.statusFilter === "pending" && hasSubmitted) return;

        if (searchVal) {
            const nameNorm = (typeof normalizeName === 'function') ? normalizeName(st.name) : st.name.toLowerCase();
            const sbdNorm = String(st.sbd || "").toLowerCase();
            if (!nameNorm.includes(searchVal) && !sbdNorm.includes(searchVal)) return;
        }

        const tr = document.createElement("tr");

        let statusHtml = `<span class="tuluan-status-badge pending">⏳ Chưa nộp</span>`;
        let thumbnailsHtml = `<span style="font-size:11.5px; color:#94a3b8; font-style:italic;">Chưa có ảnh</span>`;

        let approveHtml = "";
        if (!hasSubmitted) {
            approveHtml = `<span style="color:#cbd5e1; font-weight:700;">---</span>`;
        } else if (isAdmin) {
            approveHtml = `
                <label class="approve-switch-wrapper" title="Bật/Tắt duyệt bài cho học sinh này" onclick="event.stopPropagation()">
                    <span class="mini-switch">
                        <input type="checkbox" ${isApproved ? "checked" : ""} onchange="handleToggleApproveStudent('${cleanSbd}', this.checked)">
                        <span class="slider-toggle" style="${isApproved ? 'background-color:#10b981;' : ''}"></span>
                    </span>
                    <b class="approve-text ${isApproved ? 'approved' : 'pending'}">${isApproved ? 'Đã duyệt' : 'Chưa duyệt'}</b>
                </label>
            `;
        } else {
            approveHtml = isApproved 
                ? `<span class="tuluan-approved-badge yes">✅ Đã duyệt</span>`
                : `<span class="tuluan-approved-badge no">⏳ Chưa duyệt</span>`;
        }

        if (hasSubmitted) {
            const imgCount = record.images.length;
            const lastTime = record.lastSubmit || "Vừa xong";
            statusHtml = `
                <div class="tuluan-status-badge done">✅ Đã nộp ${imgCount} ảnh</div>
                <div style="font-size: 11px; color: #64748b; font-weight: 700; margin-top: 2px;">🕒 ${lastTime}</div>
            `;

            const currentStudentSbd = (safeLocal.getItem("saved_student_sbd") || "").trim().toLowerCase();
            const isOwner = (currentStudentSbd && currentStudentSbd === String(st.sbd).trim().toLowerCase());
            const canViewDetailed = (isAdmin || isApproved || isOwner);

            thumbnailsHtml = `
                <div class="tuluan-thumb-row">
                    ${record.images.map((im, idx) => `
                        <div class="tuluan-img-thumbnail-item ${!canViewDetailed ? 'locked-anti-cheat' : ''}" 
                             onclick="onThumbnailClicked('${im.directUrl || im.fileUrl}', '${im.fileUrl}', '${st.name} - Trang ${idx + 1}', ${canViewDetailed}, event)" 
                             title="${canViewDetailed ? 'Bấm để xem ảnh phóng to' : '🔒 Bài làm đang chờ Thầy phê duyệt, em chưa thể xem chi tiết!'}">
                            <img src="${im.directUrl || im.fileUrl}" alt="Trang ${idx + 1}">
                            <span class="tuluan-thumb-page">Trang ${idx + 1}</span>
                            ${!canViewDetailed ? `<div class="lock-overlay-icon">🔒</div>` : ''}
                            
                            <!-- NÚT XÓA ẢNH X NHỎ GÓC TRÊN PHẢI -->
                            <button type="button" class="btn-del-single-thumb" 
                                onclick="deleteSingleStudentImage('${cleanSbd}', ${idx}, '${st.name}', event)" 
                                title="Xóa bức ảnh này">✕</button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        tr.innerHTML = `
            <td style="text-align: center; font-weight: 800; color: #475569;">${st.stt}</td>
            <td style="font-weight: 800; color: #0f172a;">${st.name}</td>
            <td style="text-align: center; font-weight: 800; color: #0284c7; font-family: monospace;">${st.sbd}</td>
            <td>${statusHtml}</td>
            <td style="text-align: center;">${approveHtml}</td>
            <td>${thumbnailsHtml}</td>
            <td style="text-align: center;">
                <input type="file" id="tuluan-input-${cleanSbd}" accept="image/*" multiple style="display:none;" onchange="handleStudentEssayUploadPC('${st.stt}', '${st.sbd}', '${st.name}', this)">
                <button type="button" class="btn-tuluan-upload-row" onclick="triggerStudentUpload('${st.stt}', '${st.sbd}', '${st.name}', '${st.pass}')" id="btn-up-${cleanSbd}">
                    📷 Tải ảnh
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function onThumbnailClicked(imgSrc, driveUrl, title, canView, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!canView) {
        alert("🔒 BÀI LÀM ĐANG CHỜ THẦY PHÊ DUYỆT!\n\nĐể đảm bảo tính công bằng và chống sao chép bài làm, Thầy chưa mở tính năng xem chi tiết bài của bạn này. Sau khi Thầy phê duyệt, em sẽ được xem để học hỏi nhé!");
        return;
    }
    openTuLuanLightbox(imgSrc, driveUrl, title, event);
}

// HÀM XÓA 1 BỨC ẢNH CỤ THỂ KHI ẤN VÀO NÚT "✕"
async function deleteSingleStudentImage(cleanSbd, imgIndex, studentName, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const record = currentTuLuanModalData.submissionsMap[cleanSbd];
    if (!record || !Array.isArray(record.images) || !record.images[imgIndex]) {
        alert("⚠️ Không tìm thấy ảnh này để xóa!");
        return;
    }

    if (!confirm(`⚠️ XÁC NHẬN XÓA ẢNH:\n\nBạn có chắc chắn muốn xóa ảnh Trang ${imgIndex + 1} của học sinh [${studentName}] không?`)) {
        return;
    }

    const qId = currentTuLuanModalData.quizId;
    const removedImg = record.images[imgIndex];
    record.images.splice(imgIndex, 1);
    record.count = record.images.length;

    try {
        if (record.images.length === 0) {
            delete currentTuLuanModalData.submissionsMap[cleanSbd];
            await Promise.all([
                fetch(`${FIREBASE_DB_URL}/quizzes/${qId}/tu_luan/${cleanSbd}.json`, { method: "DELETE" }),
                fetch(`${FIREBASE_DB_URL}/exams/${qId}/tu_luan/${cleanSbd}.json`, { method: "DELETE" })
            ]);
        } else {
            currentTuLuanModalData.submissionsMap[cleanSbd] = record;
            await Promise.all([
                fetch(`${FIREBASE_DB_URL}/quizzes/${qId}/tu_luan/${cleanSbd}.json`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images: record.images, count: record.images.length })
                }),
                fetch(`${FIREBASE_DB_URL}/exams/${qId}/tu_luan/${cleanSbd}.json`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images: record.images, count: record.images.length })
                })
            ]);
        }

        if (removedImg && removedImg.fileId) {
            const gasUrl = (typeof GOOGLE_DRIVE_TULUAN_GAS_URL !== "undefined" && GOOGLE_DRIVE_TULUAN_GAS_URL) 
                ? GOOGLE_DRIVE_TULUAN_GAS_URL 
                : GOOGLE_DRIVE_UPLOAD_GAS_URL;
            if (gasUrl && !gasUrl.includes("DÁN_URL")) {
                fetch(gasUrl, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: "deleteFile", fileId: removedImg.fileId })
                }).catch(() => null);
            }
        }

        renderTuLuanStudentsTable();
        alert("🗑️ Đã xóa ảnh thành công!");
    } catch(err) {
        alert("❌ Lỗi khi xóa ảnh: " + err.message);
    }
}

// Bật/Tắt duyệt từng học sinh
async function handleToggleApproveStudent(cleanSbd, isChecked) {
    const qId = currentTuLuanModalData.quizId;
    if (!qId) return;

    try {
        await Promise.all([
            fetch(`${FIREBASE_DB_URL}/quizzes/${qId}/tu_luan/${cleanSbd}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: isChecked })
            }),
            fetch(`${FIREBASE_DB_URL}/exams/${qId}/tu_luan/${cleanSbd}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: isChecked })
            })
        ]);

        if (currentTuLuanModalData.submissionsMap[cleanSbd]) {
            currentTuLuanModalData.submissionsMap[cleanSbd].isApproved = isChecked;
        }
        renderTuLuanStudentsTable();
    } catch(err) {
        alert("❌ Lỗi cập nhật phê duyệt: " + err.message);
    }
}

// Duyệt toàn bộ đề
async function toggleApproveAllSubmissions(isApproved) {
    const qId = currentTuLuanModalData.quizId;
    const subMap = currentTuLuanModalData.submissionsMap || {};
    const keys = Object.keys(subMap);
    if (keys.length === 0) {
        alert("ℹ️ Chưa có bài nộp nào để phê duyệt!");
        return;
    }

    if (!confirm(`Bạn có chắc muốn ${isApproved ? 'PHÊ DUYỆT TẤT CẢ' : 'HỦY DUYỆT'} bài làm của đề này không?`)) return;

    try {
        const patchPromises = [];
        keys.forEach(k => {
            patchPromises.push(
                fetch(`${FIREBASE_DB_URL}/quizzes/${qId}/tu_luan/${k}.json`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isApproved: isApproved })
                })
            );
            patchPromises.push(
                fetch(`${FIREBASE_DB_URL}/exams/${qId}/tu_luan/${k}.json`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isApproved: isApproved })
                })
            );
        });

        await Promise.all(patchPromises);
        keys.forEach(k => { if (subMap[k]) subMap[k].isApproved = isApproved; });
        renderTuLuanStudentsTable();
        alert(`✅ Đã cập nhật trạng thái phê duyệt cho ${keys.length} học sinh!`);
    } catch(e) {
        alert("❌ Lỗi duyệt bài: " + e.message);
    }
}

function filterTuLuanStudentTable() { renderTuLuanStudentsTable(); }
function filterTuLuanStatus(filterType) {
    currentTuLuanModalData.statusFilter = filterType;
    document.querySelectorAll(".tuluan-tab-pill").forEach(p => p.classList.remove("active"));
    const activeBtn = document.getElementById(`tab-filter-${filterType}`);
    if (activeBtn) activeBtn.classList.add("active");
    renderTuLuanStudentsTable();
}

function triggerStudentUpload(stt, sbd, studentName, correctPass) {
    const cleanSbd = String(sbd).replace(/[^a-zA-Z0-9]/g, '_');
    const sessionAuthKey = `tuluan_authed_${currentTuLuanModalData.quizId}_${cleanSbd}`;

    if ((typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) || safeSession.getItem(sessionAuthKey) === "true") {
        document.getElementById(`tuluan-input-${cleanSbd}`).click();
        return;
    }

    const inputPass = prompt(`🔐 XÁC NHẬN NỘP BÀI:\n\nEm đang nộp bài cho: [${stt}] ${studentName} (SBD: ${sbd}).\nVui lòng nhập Mật khẩu hoặc SBD của em để xác nhận:`);
    if (inputPass === null) return;

    const trimmedInput = inputPass.trim().toLowerCase();
    const isPassOk = (trimmedInput === String(correctPass).trim().toLowerCase()) || (trimmedInput === String(sbd).trim().toLowerCase());

    if (isPassOk) {
        safeSession.setItem(sessionAuthKey, "true");
        document.getElementById(`tuluan-input-${cleanSbd}`).click();
    } else {
        alert("❌ Sai mật khẩu hoặc SBD! Vui lòng thử lại để tránh nộp nhầm bài của bạn khác.");
    }
}

// TỔ CHỨC CÂY THƯ MỤC DRIVE PHÂN CẤP ĐẦY ĐỦ 4 TẦNG:
// BAI_TAP_TU_LUAN / LOP / DE / STT_SBD_HOTEN / ANH_CHUP
async function handleStudentEssayUploadPC(stt, sbd, studentName, fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return;

    const files = Array.from(fileInput.files);
    const cleanSbd = String(sbd).replace(/[^a-zA-Z0-9]/g, '_');
    const upBtn = document.getElementById(`btn-up-${cleanSbd}`);

    if (upBtn) {
        upBtn.disabled = true;
        upBtn.innerText = "⏳ Đang gửi...";
    }

    const classId = currentTuLuanModalData.classId || "lop-11a";
    const driveClassName = getCleanDriveClassName(classId);
    const quizId = currentTuLuanModalData.quizId || "quiz";
    const examTitle = currentTuLuanModalData.examTitle || "BAI_TAP_TU_LUAN";
    const unifiedFolder = getUnifiedExamFolderKey(examTitle, "", quizId);
    const studentFolderName = getStudentFolderKey(stt, sbd, studentName);

    const currentSub = currentTuLuanModalData.submissionsMap[cleanSbd] || {};
    const existingImages = Array.isArray(currentSub.images) ? [...currentSub.images] : [];

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pageIdx = existingImages.length + i + 1;
        try {
            if (upBtn) upBtn.innerText = `⏳ Nén ảnh ${i + 1}/${files.length}...`;
            const compressed = await compressImageForTuLuanAsync(file, 2048, 0.82);

            if (upBtn) upBtn.innerText = `🚀 Lưu trang ${pageIdx}...`;

            const payload = {
                rootFolder: "BAI_TAP_TU_LUAN",
                className: driveClassName,
                examTitle: unifiedFolder,
                studentFolder: studentFolderName,
                stt: stt,
                sbd: sbd,
                studentName: studentName,
                filename: `Trang_${pageIdx}_${Date.now()}.jpg`,
                mimeType: "image/jpeg",
                base64: compressed.base64
            };

            const gasUrl = (typeof GOOGLE_DRIVE_TULUAN_GAS_URL !== "undefined" && GOOGLE_DRIVE_TULUAN_GAS_URL)
                ? GOOGLE_DRIVE_TULUAN_GAS_URL
                : GOOGLE_DRIVE_UPLOAD_GAS_URL;

            const res = await fetch(gasUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (result && result.status === "success" && result.fileId) {
                const directImgUrl = result.directUrl || (typeof toDirectGoogleDriveImageUrl === 'function' ? toDirectGoogleDriveImageUrl(result.fileUrl) : result.fileUrl);
                existingImages.push({
                    fileId: result.fileId,
                    fileUrl: result.fileUrl,
                    directUrl: directImgUrl,
                    fileName: payload.filename,
                    uploadedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN")
                });
                successCount++;
            } else {
                throw new Error(result.message || "Lỗi lưu file vào Google Drive.");
            }
        } catch(err) {
            console.error(`Lỗi upload ảnh trang ${i + 1}:`, err);
            alert(`⚠️ Lỗi tải ảnh trang ${i + 1}: ${err.message}`);
        }
    }

    if (successCount > 0) {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const submitDateStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

        const firebaseRecord = {
            stt: stt,
            sbd: sbd,
            studentName: studentName,
            className: driveClassName,
            examTitle: examTitle,
            lastSubmit: submitDateStr,
            lastSubmitTime: Date.now(),
            count: existingImages.length,
            images: existingImages,
            isApproved: currentSub.isApproved || false
        };

        await Promise.all([
            fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/tu_luan/${cleanSbd}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(firebaseRecord)
            }).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/exams/${quizId}/tu_luan/${cleanSbd}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(firebaseRecord)
            }).catch(() => null)
        ]);

        currentTuLuanModalData.submissionsMap[cleanSbd] = firebaseRecord;
        renderTuLuanStudentsTable();
        alert(`🎉 THÀNH CÔNG!\n\nĐã lưu ${successCount} ảnh bài làm vào Google Drive theo đường dẫn:\nBAI_TAP_TU_LUAN / ${driveClassName} / ${unifiedFolder} / ${studentFolderName}`);
    }

    if (upBtn) {
        upBtn.disabled = false;
        upBtn.innerText = "📷 Tải ảnh";
    }
    fileInput.value = "";
}

function openTuLuanLightbox(imgSrc, driveUrl, title, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const lb = document.getElementById("tuluan-lightbox");
    const fullImg = document.getElementById("lightbox-full-img");
    const titleEl = document.getElementById("lightbox-student-title");
    const driveLink = document.getElementById("lightbox-drive-link");

    if (fullImg) fullImg.src = imgSrc;
    if (titleEl) titleEl.innerText = title || "Ảnh bài làm tự luận";
    if (driveLink) driveLink.href = driveUrl || "#";
    if (lb) lb.style.display = "flex";
}

function closeTuLuanLightbox(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const lb = document.getElementById("tuluan-lightbox");
    if (lb) lb.style.display = "none";
}

// Nộp bài tự luận TRONG BÀI THI (thi.html): ĐỒNG BỘ ĐÚNG CẤU TRÚC 4 TẦNG TRÊN DRIVE
async function triggerExamRoomDriveUpload(qId) {
    const sId = document.getElementById("student-id")?.value.trim() || safeLocal.getItem("saved_student_sbd");
    const sName = document.getElementById("student-name")?.value.trim() || safeLocal.getItem("saved_student_name");
    const sClass = document.getElementById("student-class")?.value.trim() || safeLocal.getItem("saved_student_class");

    if (!sId || !sName) {
        alert("⚠️ Không xác định được thông tin học sinh đang làm bài!");
        return;
    }

    let input = document.getElementById(`drive-exam-input-${qId}`);
    if (!input) {
        input = document.createElement("input");
        input.type = "file";
        input.id = `drive-exam-input-${qId}`;
        input.accept = "image/*";
        input.multiple = true;
        input.style.display = "none";
        document.body.appendChild(input);

        input.onchange = async function() {
            if (!this.files || this.files.length === 0) return;
            const files = Array.from(this.files);

            const statusEl = document.getElementById(`drive-upload-status-${qId}`);
            if (statusEl) {
                statusEl.style.display = "inline-flex";
                statusEl.innerText = "⏳ Đang nén & lưu Drive...";
            }

            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('id') || (typeof examData !== 'undefined' && examData && examData.id) || "quiz";
            const examTitle = typeof EXAM_NAME !== 'undefined' ? EXAM_NAME : "Bài thi";
            
            const driveClassName = getCleanDriveClassName(sClass);
            const unifiedFolder = getUnifiedExamFolderKey(examTitle, (typeof getMaDe === 'function' ? getMaDe() : ""), quizId);
            const studentFolderName = getStudentFolderKey("00", sId, sName);
            const cleanSbd = sId.replace(/[^a-zA-Z0-9]/g, '_');

            let existingImages = [];
            try {
                const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/tu_luan/${cleanSbd}.json`);
                if (res.ok) {
                    const d = await res.json();
                    if (d && Array.isArray(d.images)) existingImages = d.images;
                }
            } catch(e) {}

            let successCount = 0;
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const pageIdx = existingImages.length + i + 1;
                try {
                    const comp = await compressImageForTuLuanAsync(f, 2048, 0.82);
                    const payload = {
                        rootFolder: "BAI_TAP_TU_LUAN",
                        className: driveClassName,
                        examTitle: unifiedFolder,
                        studentFolder: studentFolderName,
                        stt: "00",
                        sbd: sId,
                        studentName: sName,
                        filename: `Cau_${qId}_Trang_${pageIdx}_${Date.now()}.jpg`,
                        mimeType: "image/jpeg",
                        base64: comp.base64
                    };

                    const gasUrl = (typeof GOOGLE_DRIVE_TULUAN_GAS_URL !== "undefined" && GOOGLE_DRIVE_TULUAN_GAS_URL)
                        ? GOOGLE_DRIVE_TULUAN_GAS_URL
                        : GOOGLE_DRIVE_UPLOAD_GAS_URL;

                    const r = await fetch(gasUrl, {
                        method: "POST",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify(payload)
                    });
                    const resJson = await r.json();
                    if (resJson && resJson.status === "success") {
                        existingImages.push({
                            fileId: resJson.fileId,
                            fileUrl: resJson.fileUrl,
                            directUrl: resJson.directUrl || resJson.fileUrl,
                            fileName: payload.filename,
                            uploadedAt: new Date().toLocaleTimeString("vi-VN")
                        });
                        successCount++;
                    }
                } catch(err) {
                    console.error("Lỗi upload ảnh tự luận trong phòng thi:", err);
                }
            }

            if (successCount > 0) {
                const submitRecord = {
                    sbd: sId,
                    studentName: sName,
                    className: driveClassName,
                    examTitle: examTitle,
                    lastSubmit: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
                    lastSubmitTime: Date.now(),
                    count: existingImages.length,
                    images: existingImages,
                    isApproved: false
                };

                await Promise.all([
                    fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/tu_luan/${cleanSbd}.json`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(submitRecord)
                    }).catch(() => null),
                    fetch(`${FIREBASE_DB_URL}/exams/${quizId}/tu_luan/${cleanSbd}.json`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(submitRecord)
                    }).catch(() => null)
                ]);

                if (statusEl) {
                    statusEl.className = "drive-up-status success";
                    statusEl.innerText = `✅ Đã lưu ${existingImages.length} ảnh lên Drive!`;
                }
                alert(`✅ ĐÃ LƯU BÀI TỰ LUẬN THÀNH CÔNG!\n\nĐường dẫn Drive: BAI_TAP_TU_LUAN / ${driveClassName} / ${unifiedFolder} / ${studentFolderName}`);
            } else {
                if (statusEl) {
                    statusEl.className = "drive-up-status error";
                    statusEl.innerText = `❌ Lỗi gửi ảnh!`;
                }
            }
            this.value = "";
        };
    }
    input.click();
}

window.openTuLuanModal = openTuLuanModal;
window.closeTuLuanModal = closeTuLuanModal;
window.triggerStudentUpload = triggerStudentUpload;
window.handleStudentEssayUploadPC = handleStudentEssayUploadPC;
window.filterTuLuanStudentTable = filterTuLuanStudentTable;
window.filterTuLuanStatus = filterTuLuanStatus;
window.openTuLuanLightbox = openTuLuanLightbox;
window.closeTuLuanLightbox = closeTuLuanLightbox;
window.triggerExamRoomDriveUpload = triggerExamRoomDriveUpload;
window.onTuLuanClassChanged = onTuLuanClassChanged;
window.onTuLuanExamChanged = onTuLuanExamChanged;
window.promptAddNewTuLuanExam = promptAddNewTuLuanExam;
window.handleToggleApproveStudent = handleToggleApproveStudent;
window.toggleApproveAllSubmissions = toggleApproveAllSubmissions;
window.onThumbnailClicked = onThumbnailClicked;
window.deleteSingleStudentImage = deleteSingleStudentImage;
window.getUnifiedExamFolderKey = getUnifiedExamFolderKey;
window.getCleanDriveClassName = getCleanDriveClassName;
window.getStudentFolderKey = getStudentFolderKey;
