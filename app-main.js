// =========================================================
// FILE: app-main.js
// BỘ MÁY ĐIỀU HÀNH GIAO DIỆN CHÍNH: NẠP BANNER, HIỂN THỊ DANH MỤC,
// NẠP DỮ LIỆU FIREBASE, RENDER THẺ ĐỀ THI & ĐĂNG NHẬP HỌC SINH
// CẬP NHẬT:
// 1. ĐĂNG NHẬP THEO LỚP: SO SÁNH CHUẨN XÁC 2 THÔNG SỐ (USERNAME & PASS)
// 2. CHỜ PHẢN HỒI FIREBASE SIÊU NHANH TRƯỚC KHI CHO VÀO THI
// 3. WIDGET 3D NỔI KHỐI ĐẾM TRUY CẬP HÔM NAY, THEO GIỜ & TỔNG TRUY CẬP
// 4. MỖI LỚP HIỆN 2 BÀI ĐẦU TIÊN, DƯỚI CÓ MŨI TÊN XEM TIẾP CÁC BÀI CÒN LẠI
// =========================================================

let activeDayThemCatId = null;
let activeChinhKhoaRow1CatId = null;
let activeChinhKhoaRow2CatId = null;
let activeDantriCatId = null;

// Quản lý trạng thái mở rộng (> 2 bài) cho từng danh mục
let expandedCategoriesMap = {};

// Khởi chạy khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", async function() {
    initBannerAndAvatars();
    if (typeof initTableSettings === "function") initTableSettings();
    if (typeof initAvatarGrid === "function") initAvatarGrid();
    if (typeof checkAdminSessionValidity === "function") checkAdminSessionValidity();

    refreshAllViews();
    await loadDataFromFirebase();
    initSiteVisitorTracking();
});

// Gán ảnh Banner & Avatar
function initBannerAndAvatars() {
    const topImg = document.getElementById("top-banner-img");
    const avatarImg = document.getElementById("web-avatar-img");
    const botImg = document.getElementById("bottom-banner-img");

    if (topImg) {
        topImg.src = TOP_BANNER_URL || "https://files.catbox.moe/cf5o9u.jpg";
        topImg.onerror = function() {
            this.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200";
        };
    }
    if (avatarImg) {
        avatarImg.src = WEB_AVATAR_URL || "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150";
        avatarImg.onerror = function() {
            this.src = "https://cdn-icons-png.flaticon.com/512/3135/3135768.png";
        };
    }
    if (botImg) {
        botImg.src = BOTTOM_BANNER_URL || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1000";
        botImg.onerror = function() {
            this.src = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1000";
        };
    }
}

function sortLinksNewestFirst(linksArray) {
    if (!Array.isArray(linksArray)) return [];
    return linksArray.sort((a, b) => {
        let tA = a.timestamp || parseDateString(a.date) || 0;
        let tB = b.timestamp || parseDateString(b.date) || 0;
        if (tB !== tA) return tB - tA;
        return (a.title || "").localeCompare(b.title || "");
    });
}

async function loadDataFromFirebase() {
    try {
        const [linksRes, quizzesRes] = await Promise.all([
            fetch(`${FIREBASE_DB_URL}/custom_links.json`).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/quizzes.json`).catch(() => null)
        ]);

        let customLinksData = linksRes && linksRes.ok ? await linksRes.json() : null;
        let quizzesData = quizzesRes && quizzesRes.ok ? await quizzesRes.json() : null;

        if (customLinksData && typeof customLinksData === "object") {
            if (customLinksData["nhac-nho"]) {
                const rLinks = Object.keys(customLinksData["nhac-nho"]).map(k => ({
                    id: k,
                    firebaseId: k,
                    ...customLinksData["nhac-nho"][k],
                    categoryId: "nhac-nho"
                }));
                if (rLinks.length > 0) REMINDER_CATEGORY.links = sortLinksNewestFirst(rLinks);
            }

            DAY_THEM_CATEGORIES.forEach(cat => {
                if (customLinksData[cat.id]) {
                    let list = Object.keys(customLinksData[cat.id]).map(k => ({
                        id: k,
                        firebaseId: k,
                        ...customLinksData[cat.id][k],
                        categoryId: cat.id
                    }));
                    cat.links = sortLinksNewestFirst(list);
                } else if (cat.links) {
                    cat.links = sortLinksNewestFirst(cat.links);
                }
            });

            CHINH_KHOA_CATEGORIES.forEach(cat => {
                if (customLinksData[cat.id]) {
                    let list = Object.keys(customLinksData[cat.id]).map(k => ({
                        id: k,
                        firebaseId: k,
                        ...customLinksData[cat.id][k],
                        categoryId: cat.id
                    }));
                    cat.links = sortLinksNewestFirst(list);
                } else if (cat.links) {
                    cat.links = sortLinksNewestFirst(cat.links);
                }
            });

            if (customLinksData["kho-tai-lieu"]) {
                let list = Object.keys(customLinksData["kho-tai-lieu"]).map(k => ({
                    id: k,
                    firebaseId: k,
                    ...customLinksData["kho-tai-lieu"][k],
                    categoryId: "kho-tai-lieu"
                }));
                KHO_TAI_LIEU_FOLDER.links = sortLinksNewestFirst(list);
            } else if (KHO_TAI_LIEU_FOLDER.links) {
                KHO_TAI_LIEU_FOLDER.links = sortLinksNewestFirst(KHO_TAI_LIEU_FOLDER.links);
            }
        }

        if (quizzesData && typeof quizzesData === "object") {
            const syncQuizMeta = (catList) => {
                catList.forEach(c => {
                    (c.links || []).forEach(l => {
                        const qId = extractQuizIdFromItem(l);
                        if (qId && quizzesData[qId]) {
                            const q = quizzesData[qId];
                            if (q.timeLimitMinutes) l.timeLimitMinutes = q.timeLimitMinutes;
                            if (q.examStartTimeStr) l.examStartTimeStr = q.examStartTimeStr;
                            if (q.examEndTimeStr) l.examEndTimeStr = q.examEndTimeStr;
                            if (q.allowFree !== undefined) l.allowFree = q.allowFree;
                        }
                    });
                });
            };
            syncQuizMeta(DAY_THEM_CATEGORIES);
            syncQuizMeta(CHINH_KHOA_CATEGORIES);
        }

        refreshAllViews();
    } catch (e) {
        console.warn("Lỗi tải dữ liệu Firebase:", e);
        refreshAllViews();
    }
}

function refreshAllViews() {
    renderDantriNav();
    renderReminderSection();
    renderDayThemSection();
    renderChinhKhoaSection();
    renderKhoTaiLieuSection();
    renderNewsSection();

    const gear = document.getElementById("gear-btn");
    if (gear) {
        if (isAdminLoggedIn) gear.classList.add("active-gear");
        else gear.classList.remove("active-gear");
    }
}

function renderDantriNav() {
    const bar = document.getElementById("dantri-nav-bar");
    if (!bar) return;
    bar.innerHTML = "";

    DANTRI_NAV_CATEGORIES.forEach(cat => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dantri-nav-btn" + (activeDantriCatId === cat.id ? " active" : "");
        btn.innerHTML = `<span>${cat.title}</span> <span class="caret-icon">▼</span>`;
        btn.onclick = () => toggleDantriCategory(cat.id);
        bar.appendChild(btn);
    });

    renderDantriDropdown();
}

function toggleDantriCategory(catId) {
    if (activeDantriCatId === catId) activeDantriCatId = null;
    else activeDantriCatId = catId;
    renderDantriNav();
}

function renderDantriDropdown() {
    const panel = document.getElementById("dantri-dropdown-panel");
    const subTitle = document.getElementById("dantri-sub-title");
    const list = document.getElementById("dantri-news-list");
    if (!panel || !list) return;

    if (!activeDantriCatId) {
        panel.classList.remove("show");
        return;
    }

    const cat = DANTRI_NAV_CATEGORIES.find(c => c.id === activeDantriCatId);
    if (!cat) {
        panel.classList.remove("show");
        return;
    }

    subTitle.innerHTML = cat.subTitle || "📌 Tin tức nổi bật";
    list.innerHTML = "";

    (cat.news || []).forEach(n => {
        const item = document.createElement("a");
        item.href = n.url || "#";
        item.target = "_blank";
        item.className = "news-item";
        item.innerHTML = `
            <div class="news-content">
                <div class="news-title"><span style="color:#059669; font-weight:800;">[${n.tag || 'TIN'}]</span> ${n.title}</div>
                <div class="news-date">⏱ ${n.date || 'Hôm nay'}</div>
            </div>
            <div class="arrow">›</div>
        `;
        list.appendChild(item);
    });

    panel.classList.add("show");
}

function renderReminderSection() {
    const container = document.getElementById("reminder-container");
    if (!container) return;
    container.innerHTML = "";

    const links = sortLinksNewestFirst(REMINDER_CATEGORY.links || []);
    links.forEach(item => {
        container.appendChild(createItemCardElement(item, "nhac-nho"));
    });
}

// =========================================================
// HÀM HIỂN THỊ DANH SÁCH BÀI CÓ THU GỌN: MẶC ĐỊNH HIỆN 2 BÀI ĐẦU TIÊN
// CÒN LẠI HIỆN NÚT "XEM TIẾP X BÀI CÒN LẠI"
// =========================================================
function renderPaginatedItemsList(containerEl, itemsArray, categoryId, contextType) {
    containerEl.innerHTML = "";
    if (!itemsArray || itemsArray.length === 0) {
        containerEl.innerHTML = `<div class="empty-folder">Chưa có bài kiểm tra nào trong mục này.</div>`;
        return;
    }

    const sorted = sortLinksNewestFirst(itemsArray);
    const total = sorted.length;
    const isExpanded = !!expandedCategoriesMap[categoryId];

    // Luôn hiển thị 2 bài đầu
    const firstTwo = sorted.slice(0, 2);
    firstTwo.forEach(item => {
        containerEl.appendChild(createItemCardElement(item, categoryId));
    });

    // Nếu có trên 2 bài
    if (total > 2) {
        const remainingItems = sorted.slice(2);
        const extraWrap = document.createElement("div");
        extraWrap.id = `extra-items-${categoryId}`;
        extraWrap.className = "extra-items-wrapper" + (isExpanded ? " show" : "");
        extraWrap.style.display = isExpanded ? "flex" : "none";
        extraWrap.style.flexDirection = "column";
        extraWrap.style.gap = "8px";
        extraWrap.style.width = "100%";

        remainingItems.forEach(item => {
            extraWrap.appendChild(createItemCardElement(item, categoryId));
        });
        containerEl.appendChild(extraWrap);

        const btnWrap = document.createElement("div");
        btnWrap.className = "expand-toggle-wrapper";
        btnWrap.innerHTML = `
            <button type="button" class="btn-expand-more ${isExpanded ? 'is-expanded' : ''}" onclick="toggleExpandCategoryItems('${categoryId}', '${contextType}', event)">
                <span>${isExpanded ? `▲ Thu gọn (đang xem ${total}/${total} bài)` : `▼ Xem tiếp ${remainingItems.length} bài tập còn lại`}</span>
            </button>
        `;
        containerEl.appendChild(btnWrap);
    }
}

function toggleExpandCategoryItems(categoryId, contextType, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    expandedCategoriesMap[categoryId] = !expandedCategoriesMap[categoryId];

    if (contextType === "daythem") {
        renderDayThemSection();
    } else if (contextType === "chinhkhoa") {
        renderChinhKhoaSection();
    }
}

function renderDayThemSection() {
    const bar = document.getElementById("daythem-nav-bar");
    const panel = document.getElementById("daythem-dropdown-panel");
    const list = document.getElementById("daythem-links-container");
    if (!bar || !panel || !list) return;

    bar.innerHTML = "";

    DAY_THEM_CATEGORIES.forEach(cat => {
        const isActive = (activeDayThemCatId === cat.id);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dantri-nav-btn" + (isActive ? " active" : "");
        btn.innerHTML = `<span>${cat.title}</span> <span class="caret-icon">${isActive ? "▲" : "▼"}</span>`;
        btn.onclick = () => {
            activeDayThemCatId = (activeDayThemCatId === cat.id) ? null : cat.id;
            renderDayThemSection();
        };
        bar.appendChild(btn);
    });

    if (!activeDayThemCatId) {
        panel.classList.remove("show");
        return;
    }

    const activeCat = DAY_THEM_CATEGORIES.find(c => c.id === activeDayThemCatId);
    if (activeCat) {
        renderPaginatedItemsList(list, activeCat.links || [], activeCat.id, "daythem");
        panel.classList.add("show");
    }
}

function renderChinhKhoaSection() {
    // HÀNG 1: 11A, 11C, 10P
    const row1Bar = document.getElementById("chinhkhoa-row1-bar");
    const row1Panel = document.getElementById("chinhkhoa-row1-dropdown");
    const row1List = document.getElementById("chinhkhoa-row1-links");

    const row1Cats = CHINH_KHOA_CATEGORIES.filter(c => c.row === 1);
    if (row1Bar && row1Panel && row1List) {
        row1Bar.innerHTML = "";
        row1Cats.forEach(cat => {
            const isActive = (activeChinhKhoaRow1CatId === cat.id);
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "dantri-nav-btn" + (isActive ? " active" : "");
            btn.innerHTML = `<span>${cat.title}</span> <span class="caret-icon">${isActive ? "▲" : "▼"}</span>`;
            btn.onclick = () => {
                activeChinhKhoaRow1CatId = (activeChinhKhoaRow1CatId === cat.id) ? null : cat.id;
                renderChinhKhoaSection();
            };
            row1Bar.appendChild(btn);
        });

        if (!activeChinhKhoaRow1CatId) {
            row1Panel.classList.remove("show");
        } else {
            const activeCat1 = row1Cats.find(c => c.id === activeChinhKhoaRow1CatId);
            if (activeCat1) {
                renderPaginatedItemsList(row1List, activeCat1.links || [], activeCat1.id, "chinhkhoa");
                row1Panel.classList.add("show");
            }
        }
    }

    // HÀNG 2: 11E, HSG 11, Padlet
    const row2Bar = document.getElementById("chinhkhoa-row2-bar");
    const row2Panel = document.getElementById("chinhkhoa-row2-dropdown");
    const row2List = document.getElementById("chinhkhoa-row2-links");

    const row2Cats = CHINH_KHOA_CATEGORIES.filter(c => c.row === 2);
    if (row2Bar && row2Panel && row2List) {
        row2Bar.innerHTML = "";
        row2Cats.forEach(cat => {
            const isActive = (activeChinhKhoaRow2CatId === cat.id);
            const btn = document.createElement("button");
            btn.type = "button";
            let customCls = "";
            if (cat.id === "lop-11e") customCls = " lop11e-btn";
            else if (cat.isGold) customCls = " hsg-gold-btn";
            else if (cat.isPurple) customCls = " padlet-purple-btn";

            btn.className = "dantri-nav-btn" + customCls + (isActive ? " active" : "");
            btn.innerHTML = `<span>${cat.title}</span> <span class="caret-icon">${isActive ? "▲" : "▼"}</span>`;
            btn.onclick = () => {
                activeChinhKhoaRow2CatId = (activeChinhKhoaRow2CatId === cat.id) ? null : cat.id;
                renderChinhKhoaSection();
            };
            row2Bar.appendChild(btn);
        });

        if (!activeChinhKhoaRow2CatId) {
            row2Panel.classList.remove("show");
        } else {
            const activeCat2 = row2Cats.find(c => c.id === activeChinhKhoaRow2CatId);
            if (activeCat2) {
                renderPaginatedItemsList(row2List, activeCat2.links || [], activeCat2.id, "chinhkhoa");
                row2Panel.classList.add("show");
            }
        }
    }
}

function renderKhoTaiLieuSection() {
    const container = document.getElementById("kho-tai-lieu-container");
    if (!container) return;

    let linksHtml = "";
    const sorted = sortLinksNewestFirst(KHO_TAI_LIEU_FOLDER.links || []);
    sorted.forEach(item => {
        linksHtml += buildCardHtmlString(item, "kho-tai-lieu");
    });

    if (!linksHtml) {
        linksHtml = `<div class="empty-folder">Kho tài liệu đang được cập nhật...</div>`;
    }

    container.innerHTML = `
        <details class="folder-section" open>
            <summary class="folder-header">
                <img src="${KHO_TAI_LIEU_FOLDER.folderAvatar}" class="folder-avatar" alt="Kho tài liệu">
                <h3 class="folder-title">${KHO_TAI_LIEU_FOLDER.folderName}</h3>
                <span class="folder-arrow">▶</span>
            </summary>
            <div class="link-list">${linksHtml}</div>
        </details>
    `;
}

function renderNewsSection() {
    const container = document.getElementById("news-container");
    if (!container) return;
    container.innerHTML = "";

    NEWS_DATA.forEach(n => {
        const a = document.createElement("a");
        a.className = "news-item";
        a.href = n.url || "#";
        a.target = n.url && n.url !== "#" ? "_blank" : "_self";
        a.innerHTML = `
            <div class="news-content">
                <div class="news-title">${n.title}</div>
                <div class="news-date">📅 ${n.date}</div>
            </div>
            <div class="news-img-box">
                <img class="news-img" src="${n.image}" alt="Tin tức">
            </div>
        `;
        container.appendChild(a);
    });
}

function createItemCardElement(item, categoryId) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = buildCardHtmlString(item, categoryId);
    return wrapper.firstElementChild;
}

function buildCardHtmlString(item, categoryId) {
    const isDoc = item.isDoc;
    const itemId = item.id || item.firebaseId || `item_${Date.now()}`;
    const quizId = extractQuizIdFromItem(item) || itemId;
    const badge = item.badgeText || (item.isHot ? "HOT" : "NONE");
    const avatar = item.avatar || PRESET_AVATARS[0];
    const encodedData = encodeURIComponent(JSON.stringify(item));
    const isAllowFree = (item.allowFree !== false);

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
                ${buildTimeBoxHtml(item.timeLimitMinutes, item.examStartTimeStr, item.examEndTimeStr, item.date)}
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

                        <div class="left-sub-btns-row">
                            <button type="button" class="btn-time-sub-action btn-time-sub-minutes" onclick="openEditMinutesModal('${quizId}', event)" title="Đổi số phút làm bài">
                                ⏱ Đổi phút
                            </button>
                            <button type="button" class="btn-time-sub-action btn-time-sub-schedule" onclick="openEditScheduleModal('${quizId}', event)" title="Gia hạn thời gian đóng/mở đề">
                                📅 Gia hạn
                            </button>
                        </div>
                    ` : ''}
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
                    <button type="button" class="tool-btn tool-btn-edit" onclick="renameItem('${categoryId}', '${itemId}', ${isDoc}, '${(item.title || "").replace(/'/g, "\\'")}', event)" title="Sửa tên">✏️</button>
                    <button type="button" class="tool-btn tool-btn-delete" onclick="deleteItem('${categoryId}', '${itemId}', event)" title="Xóa vĩnh viễn">🗑️</button>
                </div>
            </div>

            <div class="admin-card-bottom-row" onclick="handleCardClick('${categoryId}', '${itemId}', ${isDoc}, '${encodeURIComponent(item.url || '')}', '${encodedData}', event)">
                <div class="exam-thumb-box">
                    <img src="${avatar}" class="exam-thumb" alt="icon">
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
                    </div>
                    <div class="exam-date">📅 ${item.date || "---"}</div>
                    ${timeBoxHtml}
                </div>
                <div class="arrow">›</div>
            </div>
        </div>`;
    }

    return `
    <div class="exam-card" id="card-${itemId}" onclick="handleCardClick('${categoryId}', '${itemId}', ${isDoc}, '${encodeURIComponent(item.url || '')}', '${encodedData}', event)">
        <div class="exam-thumb-box">
            <img src="${avatar}" class="exam-thumb" alt="icon">
        </div>
        <div class="exam-info">
            <div class="exam-header-row">
                ${badge !== "NONE" ? `<span class="badge-item ${badgeClass}">${badge}</span>` : ''}
                <span class="exam-title-text">${item.title}</span>
            </div>
            <div class="exam-date">📅 ${item.date || "---"}</div>
            ${timeBoxHtml}
        </div>
        <div class="arrow">›</div>
    </div>`;
}

function handleCardClick(categoryId, itemId, isDoc, rawUrl, stringifiedData, event) {
    if (event) {
        if (event.target.closest('.free-student-toggle-wrap') || event.target.closest('.mini-switch') || event.target.closest('.admin-link-tools') || event.target.closest('.badge-wrapper') || event.target.closest('.btn-view-results-left') || event.target.closest('.left-sub-btns-row')) {
            return;
        }
    }

    const item = JSON.parse(decodeURIComponent(stringifiedData));
    const url = decodeURIComponent(rawUrl || item.url || "");

    if (isDoc || categoryId === "tu-luan-padlet" || categoryId === "kho-tai-lieu" || !url.includes("thi.html")) {
        if (url && url !== "#") {
            window.open(url, "_blank");
        }
        return;
    }

    openStudentLoginModal(item, categoryId, event);
}

// ==========================================
// MODAL ĐĂNG NHẬP LÀM BÀI CHO HỌC SINH
// ==========================================
function openStudentLoginModal(item, categoryId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    activeStudentLogin.targetUrl = item.url || "";
    activeStudentLogin.examTitle = item.title || "Bài kiểm tra";
    activeStudentLogin.categoryId = categoryId || item.categoryId || "them-11";
    activeStudentLogin.currentMode = "class";
    activeStudentLogin.item = item;

    const modal = document.getElementById("student-login-modal");
    const nameEl = document.getElementById("st-modal-exam-name");
    const timeBox = document.getElementById("st-modal-time-box");
    const errBox = document.getElementById("st-login-error");
    const mainTitleEl = document.getElementById("st-modal-main-title");

    const catName = getCategoryDisplayName(activeStudentLogin.categoryId);
    if (mainTitleEl) {
        mainTitleEl.innerText = `Đăng Nhập Làm Bài Thi: ${catName}`;
    }

    if (nameEl) nameEl.innerText = item.title;
    if (errBox) { errBox.style.display = "none"; errBox.innerText = ""; }

    if (timeBox) {
        timeBox.innerHTML = buildTimeBoxHtml(item.timeLimitMinutes, item.examStartTimeStr, item.examEndTimeStr, item.date);
    }

    // XÓA TRẮNG HOÀN TOÀN CÁC Ô NHẬP NẾU LẦN TRƯỚC ĐÃ NỘP BÀI
    const isCleanSession = (localStorage.getItem("last_submission_cleared") === "true") || 
                           !localStorage.getItem("saved_student_name");

    const userIn = document.getElementById("st-username-input");
    const passIn = document.getElementById("st-password-input");
    const fNameIn = document.getElementById("st-free-name-input");
    const fClassIn = document.getElementById("st-free-class-input");
    const fSbdIn = document.getElementById("st-free-sbd-input");

    if (isCleanSession) {
        if (userIn) userIn.value = "";
        if (passIn) passIn.value = "";
        if (fNameIn) fNameIn.value = "";
        if (fClassIn) fClassIn.value = "";
        if (fSbdIn) fSbdIn.value = "";
    } else {
        const savedSbd = localStorage.getItem("saved_student_sbd") || "";
        const savedName = localStorage.getItem("saved_student_name") || "";
        const savedClass = localStorage.getItem("saved_student_class") || "";

        if (userIn) userIn.value = savedSbd || savedName;
        if (passIn) passIn.value = "";
        if (fNameIn) fNameIn.value = savedName;
        if (fClassIn) fClassIn.value = savedClass;
        if (fSbdIn) fSbdIn.value = savedSbd;
    }

    const allowFree = (item.allowFree !== false);
    const tabFree = document.getElementById("tab-st-free");
    if (tabFree) {
        if (!allowFree) {
            tabFree.disabled = true;
            tabFree.classList.add("disabled");
            tabFree.title = "Đề thi này chỉ dành cho học sinh trong danh sách lớp";
        } else {
            tabFree.disabled = false;
            tabFree.classList.remove("disabled");
            tabFree.title = "";
        }
    }

    switchStudentLoginMode("class");
    if (modal) modal.style.display = "flex";
}

function closeStudentLoginModal() {
    const modal = document.getElementById("student-login-modal");
    if (modal) modal.style.display = "none";
}

function switchStudentLoginMode(mode) {
    activeStudentLogin.currentMode = mode;
    const tabClass = document.getElementById("tab-st-class");
    const tabFree = document.getElementById("tab-st-free");
    const viewClass = document.getElementById("st-login-mode-class");
    const viewFree = document.getElementById("st-login-mode-free");
    const errBox = document.getElementById("st-login-error");

    if (errBox) { errBox.style.display = "none"; errBox.innerText = ""; }

    if (mode === "free") {
        if (activeStudentLogin.item && activeStudentLogin.item.allowFree === false) {
            alert("⛔ Đề thi này không cho phép thí sinh tự do tham gia!");
            return;
        }
        if (tabClass) tabClass.classList.remove("active");
        if (tabFree) tabFree.classList.add("active");
        if (viewClass) viewClass.style.display = "none";
        if (viewFree) viewFree.style.display = "block";
    } else {
        if (tabClass) tabClass.classList.add("active");
        if (tabFree) tabFree.classList.remove("active");
        if (viewClass) viewClass.style.display = "block";
        if (viewFree) viewFree.style.display = "none";
    }
}

function toggleStudentPassVisibility() {
    const passIn = document.getElementById("st-password-input");
    const eyeBtn = document.getElementById("st-eye-btn");
    if (!passIn) return;
    if (passIn.type === "password") {
        passIn.type = "text";
        if (eyeBtn) eyeBtn.innerText = "🙈";
    } else {
        passIn.type = "password";
        if (eyeBtn) eyeBtn.innerText = "👁️";
    }
}

// =========================================================
// QUY TRÌNH ĐĂNG NHẬP THEO LỚP: SO SÁNH CHUẨN XÁC 2 THÔNG SỐ (USERNAME & PASS)
// VÀ CHỜ PHẢN HỒI FIREBASE SIÊU TỐC TRƯỚC KHI CHO VÀO THI
// =========================================================
async function submitStudentLogin() {
    const errBox = document.getElementById("st-login-error");
    const submitBtn = document.getElementById("st-submit-btn");

    const showErr = (msg) => {
        if (errBox) {
            errBox.innerText = msg;
            errBox.style.display = "block";
        } else {
            alert(msg);
        }
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Vào thi 🚀";
        }
    };

    let targetUrl = activeStudentLogin.targetUrl;
    if (!targetUrl) {
        showErr("❌ Không tìm thấy đường dẫn đề thi!");
        return;
    }

    let finalSbd = "";
    let finalName = "";
    let finalClass = "";

    // 1. KIỂM TRA SO SÁNH 2 THÔNG SỐ: USERNAME VÀ PASS
    if (activeStudentLogin.currentMode === "class") {
        const usernameVal = (document.getElementById("st-username-input").value || "").trim();
        const passVal = (document.getElementById("st-password-input").value || "").trim();

        if (!usernameVal || !passVal) {
            showErr("⚠️ Vui lòng nhập đầy đủ 2 thông số: Tên đăng nhập (username) và Mật khẩu (pass)!");
            return;
        }

        const accounts = getAccountsForCategory(activeStudentLogin.categoryId);
        const normInputUser = normalizeName(usernameVal);

        // So sánh chính xác 2 thông số: username & pass
        const matched = accounts.find(acc => {
            const accUser = String(acc.username || "").trim();
            const accPass = String(acc.pass || "").trim();

            const isUserMatch = (accUser.toLowerCase() === usernameVal.toLowerCase()) || 
                                (normalizeName(accUser) === normInputUser) ||
                                (String(acc.sbd || "").trim().toLowerCase() === usernameVal.toLowerCase());
            
            const isPassMatch = (accPass === passVal);
            return isUserMatch && isPassMatch;
        });

        if (!matched) {
            showErr("❌ Tên đăng nhập (username) hoặc Mật khẩu (pass) không chính xác cho lớp này!");
            return;
        }

        finalSbd = matched.sbd;
        finalName = matched.name || matched.username;
        finalClass = matched.className || "Lớp học";

    } else {
        // Thí sinh tự do
        if (activeStudentLogin.item && activeStudentLogin.item.allowFree === false) {
            showErr("⛔ Giáo viên đã tắt chế độ thi tự do đối với đề thi này!");
            return;
        }

        finalName = (document.getElementById("st-free-name-input").value || "").trim();
        finalClass = (document.getElementById("st-free-class-input").value || "").trim();
        finalSbd = (document.getElementById("st-free-sbd-input").value || "").trim();

        if (!finalName || !finalClass || !finalSbd) {
            showErr("⚠️ Vui lòng nhập đầy đủ Họ tên, Lớp và SBD tự do!");
            return;
        }
    }

    // 2. GỬI HANDSHAKE XÁC THỰC VÀ CHỜ PHẢN HỒI FIREBASE SIÊU NHANH
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "⏳ Đang kết nối máy chủ thi...";
    }

    const quizId = extractQuizIdFromItem(activeStudentLogin.item) || activeStudentLogin.categoryId;
    const safeSbd = String(finalSbd).replace(/[^a-zA-Z0-9]/g, '_');
    const handshakePayload = {
        sbd: finalSbd,
        name: finalName,
        className: finalClass,
        cat: activeStudentLogin.categoryId,
        categoryId: activeStudentLogin.categoryId,
        examTitle: activeStudentLogin.examTitle,
        quizId: quizId,
        loginHandshakeTime: Date.now(),
        clientStatus: "ready_to_start"
    };

    let isFirebaseConfirmed = false;

    try {
        // Timeout 3.5s đảm bảo nếu mạng chập chờn vẫn không bị treo mà phản hồi ngay
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const fbResponse = await fetch(`${FIREBASE_DB_URL}/active_sessions/${quizId}/${safeSbd}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(handshakePayload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (fbResponse.ok) {
            isFirebaseConfirmed = true;
        } else {
            throw new Error(`Máy chủ từ chối kết nối (Mã lỗi: ${fbResponse.status})`);
        }
    } catch (fbErr) {
        console.warn("Lỗi bắt tay Firebase:", fbErr);
        // Nếu timeout do mạng lag cục bộ, thử gửi dự phòng kênh test nhanh 1.5s
        try {
            const fbRetry = await fetch(`${FIREBASE_DB_URL}/active_sessions/${quizId}/${safeSbd}/lastPing.json`, {
                method: 'PUT',
                body: JSON.stringify(Date.now())
            });
            if (fbRetry.ok) isFirebaseConfirmed = true;
        } catch(e) {}

        if (!isFirebaseConfirmed) {
            showErr("⚠️ Chưa nhận được xác nhận từ máy chủ Firebase! Vui lòng kiểm tra lại kết nối mạng và thử lại.");
            return;
        }
    }

    // 3. KHI FIREBASE PHẢN HỒI THÀNH CÔNG: LƯU TRỮ VÀ VÀO THI
    try {
        localStorage.removeItem("last_submission_cleared");
        localStorage.setItem("saved_student_sbd", finalSbd);
        localStorage.setItem("saved_student_name", finalName);
        localStorage.setItem("saved_student_class", finalClass);
        localStorage.setItem("current_exam_student", JSON.stringify({
            sbd: finalSbd,
            name: finalName,
            className: finalClass,
            categoryId: activeStudentLogin.categoryId
        }));
    } catch (e) {}

    try {
        let u = new URL(targetUrl, window.location.href);
        u.searchParams.set("cat", activeStudentLogin.categoryId);
        u.searchParams.set("sbd", finalSbd);
        u.searchParams.set("name", finalName);
        u.searchParams.set("class", finalClass);
        u.searchParams.set("autostart", "1");
        window.location.href = u.toString();
    } catch (e) {
        window.location.href = `${targetUrl}&cat=${encodeURIComponent(activeStudentLogin.categoryId)}&sbd=${encodeURIComponent(finalSbd)}&name=${encodeURIComponent(finalName)}&class=${encodeURIComponent(finalClass)}&autostart=1`;
    }
}

function toggleBadgeMenu(itemId, event) {
    if (!isAdminLoggedIn) return;
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const menu = document.getElementById(`badge-menu-${itemId}`);
    if (!menu) return;

    document.querySelectorAll(".badge-dropdown-menu.show").forEach(m => {
        if (m !== menu) m.classList.remove("show");
    });
    menu.classList.toggle("show");
}

async function selectBadgeOption(categoryId, itemId, badgeType, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const menu = document.getElementById(`badge-menu-${itemId}`);
    if (menu) menu.classList.remove("show");

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: 'PATCH',
            body: JSON.stringify({ badgeText: badgeType })
        });
        window.location.reload();
    } catch (e) {
        alert("Lỗi đổi badge!");
    }
}

// =========================================================
// HỆ THỐNG THỐNG KÊ TRUY CẬP WEBSITE 3D NỔI KHỐI (HÔM NAY, THEO GIỜ & TỔNG)
// =========================================================
let currentVisitorStatsData = {
    todayCount: 0,
    totalCount: 0,
    hourlyMap: {}
};

function getFormattedDateKey() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function initSiteVisitorTracking() {
    const dateKey = getFormattedDateKey();
    const currentHour = new Date().getHours();
    const sessionVisitedKey = `visited_site_${dateKey}_h${currentHour}`;

    const isCountedThisHour = sessionStorage.getItem(sessionVisitedKey) === "true";

    try {
        // Tải dữ liệu thống kê từ Firebase
        const [todayRes, totalRes] = await Promise.all([
            fetch(`${FIREBASE_DB_URL}/site_analytics/days/${dateKey}.json`).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/site_analytics/total.json`).catch(() => null)
        ]);

        let todayData = todayRes && todayRes.ok ? await todayRes.json() : null;
        let totalVal = totalRes && totalRes.ok ? await totalRes.json() : 0;
        if (typeof totalVal !== 'number') totalVal = parseInt(totalVal, 10) || 0;

        let todayTotal = (todayData && todayData.total) ? parseInt(todayData.total, 10) : 0;
        let hourly = (todayData && todayData.hours) ? todayData.hours : {};

        // Nếu người dùng mới truy cập trong khung giờ này, tăng biến đếm
        if (!isCountedThisHour) {
            todayTotal++;
            totalVal++;
            hourly[currentHour] = (hourly[currentHour] || 0) + 1;

            sessionStorage.setItem(sessionVisitedKey, "true");

            // Cập nhật Firebase ngầm siêu nhanh
            fetch(`${FIREBASE_DB_URL}/site_analytics/days/${dateKey}/total.json`, { method: 'PUT', body: JSON.stringify(todayTotal) }).catch(() => null);
            fetch(`${FIREBASE_DB_URL}/site_analytics/days/${dateKey}/hours/${currentHour}.json`, { method: 'PUT', body: JSON.stringify(hourly[currentHour]) }).catch(() => null);
            fetch(`${FIREBASE_DB_URL}/site_analytics/total.json`, { method: 'PUT', body: JSON.stringify(totalVal) }).catch(() => null);
        }

        currentVisitorStatsData.todayCount = todayTotal;
        currentVisitorStatsData.totalCount = totalVal;
        currentVisitorStatsData.hourlyMap = hourly;

        renderVisitorStatsBadge();
    } catch (e) {
        console.warn("Lỗi thống kê truy cập:", e);
        renderVisitorStatsBadge();
    }
}

function renderVisitorStatsBadge() {
    const todayEl = document.getElementById("widget-today-visits");
    if (todayEl) {
        todayEl.innerText = Number(currentVisitorStatsData.todayCount || 0).toLocaleString("vi-VN");
    }
}

function toggleVisitorPopover(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const pop = document.getElementById("visitor-stats-popover");
    if (!pop) return;

    if (pop.classList.contains("show")) {
        pop.classList.remove("show");
    } else {
        renderVisitorPopoverContent();
        pop.classList.add("show");
    }
}

function closeVisitorPopover(event) {
    if (event) event.stopPropagation();
    const pop = document.getElementById("visitor-stats-popover");
    if (pop) pop.classList.remove("show");
}

function renderVisitorPopoverContent() {
    const popTotal = document.getElementById("pop-total-visits");
    const popToday = document.getElementById("pop-today-visits");
    const grid = document.getElementById("pop-hourly-grid");
    if (!grid) return;

    if (popTotal) popTotal.innerText = Number(currentVisitorStatsData.totalCount || 0).toLocaleString("vi-VN");
    if (popToday) popToday.innerText = Number(currentVisitorStatsData.todayCount || 0).toLocaleString("vi-VN");

    const curH = new Date().getHours();
    let maxHourly = 1;
    for (let h = 0; h < 24; h++) {
        const v = currentVisitorStatsData.hourlyMap[h] || 0;
        if (v > maxHourly) maxHourly = v;
    }

    grid.innerHTML = "";
    for (let h = 0; h < 24; h++) {
        const count = currentVisitorStatsData.hourlyMap[h] || 0;
        const isCurrent = (h === curH);
        const item = document.createElement("div");
        item.className = "hourly-item" + (isCurrent ? " current-hour" : "") + (count > 0 ? " has-visits" : "");
        item.innerHTML = `
            <span class="hourly-time">${h}h - ${h+1}h</span>
            <div class="hourly-bar-wrap">
                <div class="hourly-bar-fill" style="width: ${Math.round((count / maxHourly) * 100)}%;"></div>
            </div>
            <span class="hourly-val">${count}</span>
        `;
        grid.appendChild(item);
    }
}

// =========================================================
// SỰ KIỆN TOÀN CỤC: THU LẠI ADMIN PANEL, AUTH, BADGE, POPOVER
// =========================================================
document.addEventListener("click", function(event) {
    // 1. Thu lại bảng Admin & ô mật khẩu Admin khi click ra ngoài
    const adminWrapper = event.target.closest(".admin-controls-wrapper");
    if (!adminWrapper) {
        const authContainer = document.getElementById("auth-container");
        if (authContainer && authContainer.classList.contains("show")) {
            authContainer.classList.remove("show");
        }
        if (typeof closeAdminPanel === "function") {
            closeAdminPanel();
        }
    }

    // 2. Thu lại tất cả menu Badge khi click ra ngoài
    const badgeWrapper = event.target.closest(".badge-wrapper");
    if (!badgeWrapper) {
        document.querySelectorAll(".badge-dropdown-menu.show").forEach(m => m.classList.remove("show"));
    }

    // 3. Thu lại popover thống kê người truy cập khi click ra ngoài
    const visitorWidget = event.target.closest(".visitor-floating-widget-wrap");
    if (!visitorWidget) {
        closeVisitorPopover();
    }
});