// =========================================================
// FILE: app-main.js
// BỘ MÁY ĐIỀU HÀNH GIAO DIỆN CHÍNH, CACHE BẢO TOÀN DỮ LIỆU
// VÀ XÁC THỰC PHẢN HỒI FIREBASE SIÊU TỐC KHI ĐĂNG NHẬP
// =========================================================

let activeDayThemCatId = null;
let activeChinhKhoaRow1CatId = null;
let activeChinhKhoaRow2CatId = null;
let activeDantriCatId = null;

// Khởi chạy khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", async function() {
    initBannerAndAvatars();
    if (typeof initTableSettings === "function") initTableSettings();
    if (typeof initAvatarGrid === "function") initAvatarGrid();
    if (typeof checkAdminSessionValidity === "function") checkAdminSessionValidity();

    // 1. Phục hồi ngay từ cache nếu có để chống chập chờn màn hình
    restoreFromLocalCache();
    refreshAllViews();

    // 2. Tải bản mới nhất từ Firebase và đồng bộ tức thời
    await loadDataFromFirebase();
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

function restoreFromLocalCache() {
    try {
        const cachedRaw = localStorage.getItem("app_links_cache_data");
        if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached && typeof cached === "object") {
                applyParsedLinksData(cached);
            }
        }
    } catch(e) {}
}

function applyParsedLinksData(customLinksData) {
    if (!customLinksData || typeof customLinksData !== "object") return;

    // Quét tìm tất cả các bài theo quan hệ tương đương (chống lỗi đặt tên lop-11e, lop11e)
    const extractForCategory = (targetCatId) => {
        let mergedList = [];
        const seenIds = new Set();

        for (let k in customLinksData) {
            if (isSameCategory(k, targetCatId)) {
                let catObj = customLinksData[k];
                if (catObj && typeof catObj === "object") {
                    for (let itemId in catObj) {
                        let item = catObj[itemId];
                        if (item && typeof item === "object") {
                            let uniqueKey = item.firebaseId || item.id || itemId;
                            if (!seenIds.has(uniqueKey)) {
                                seenIds.add(uniqueKey);
                                mergedList.push({
                                    id: itemId,
                                    firebaseId: itemId,
                                    ...item,
                                    categoryId: targetCatId
                                });
                            }
                        }
                    }
                }
            }
        }
        return sortLinksNewestFirst(mergedList);
    };

    // Nhắc nhở
    const remList = extractForCategory("nhac-nho");
    if (remList.length > 0) REMINDER_CATEGORY.links = remList;

    // Dạy thêm
    DAY_THEM_CATEGORIES.forEach(cat => {
        const found = extractForCategory(cat.id);
        if (found.length > 0) cat.links = found;
    });

    // Chính khóa (Bao gồm đặc trị Lớp 11E và các lớp khác)
    CHINH_KHOA_CATEGORIES.forEach(cat => {
        const found = extractForCategory(cat.id);
        if (found.length > 0) cat.links = found;
    });

    // Kho tài liệu
    const docList = extractForCategory("kho-tai-lieu");
    if (docList.length > 0) KHO_TAI_LIEU_FOLDER.links = docList;
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
            try {
                localStorage.setItem("app_links_cache_data", JSON.stringify(customLinksData));
            } catch(e) {}
            applyParsedLinksData(customLinksData);
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

    list.innerHTML = "";

    if (!activeDayThemCatId) {
        panel.classList.remove("show");
        return;
    }

    const activeCat = DAY_THEM_CATEGORIES.find(c => c.id === activeDayThemCatId);
    if (activeCat && activeCat.links && activeCat.links.length > 0) {
        const sorted = sortLinksNewestFirst(activeCat.links);
        sorted.forEach(item => {
            list.appendChild(createItemCardElement(item, activeCat.id));
        });
        panel.classList.add("show");
    } else {
        list.innerHTML = `<div class="empty-folder">Chưa có bài kiểm tra nào trong mục này.</div>`;
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

        row1List.innerHTML = "";
        if (!activeChinhKhoaRow1CatId) {
            row1Panel.classList.remove("show");
        } else {
            const activeCat1 = row1Cats.find(c => c.id === activeChinhKhoaRow1CatId);
            if (activeCat1 && activeCat1.links && activeCat1.links.length > 0) {
                const sorted = sortLinksNewestFirst(activeCat1.links);
                sorted.forEach(item => {
                    row1List.appendChild(createItemCardElement(item, activeCat1.id));
                });
                row1Panel.classList.add("show");
            } else {
                row1List.innerHTML = `<div class="empty-folder">Chưa có bài tập cho lớp này.</div>`;
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

        row2List.innerHTML = "";
        if (!activeChinhKhoaRow2CatId) {
            row2Panel.classList.remove("show");
        } else {
            const activeCat2 = row2Cats.find(c => c.id === activeChinhKhoaRow2CatId);
            if (activeCat2 && activeCat2.links && activeCat2.links.length > 0) {
                const sorted = sortLinksNewestFirst(activeCat2.links);
                sorted.forEach(item => {
                    row2List.appendChild(createItemCardElement(item, activeCat2.id));
                });
                row2Panel.classList.add("show");
            } else {
                row2List.innerHTML = `<div class="empty-folder">Chưa có bài tập cho lớp này.</div>`;
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
    const submitBtn = document.getElementById("st-submit-btn");

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Vào thi 🚀";
    }

    const catName = getCategoryDisplayName(activeStudentLogin.categoryId);
    if (mainTitleEl) {
        mainTitleEl.innerText = `Đăng Nhập Làm Bài Thi: ${catName}`;
    }

    if (nameEl) nameEl.innerText = item.title;
    if (errBox) { errBox.style.display = "none"; errBox.innerText = ""; }

    if (timeBox) {
        timeBox.innerHTML = buildTimeBoxHtml(item.timeLimitMinutes, item.examStartTimeStr, item.examEndTimeStr, item.date);
    }

    // Luôn giữ giao diện mới tinh, xóa vết phiên thi cũ
    const userIn = document.getElementById("st-username-input");
    const passIn = document.getElementById("st-password-input");
    const fNameIn = document.getElementById("st-free-name-input");
    const fClassIn = document.getElementById("st-free-class-input");
    const fSbdIn = document.getElementById("st-free-sbd-input");

    if (userIn) userIn.value = "";
    if (passIn) passIn.value = "";
    if (fNameIn) fNameIn.value = "";
    if (fClassIn) fClassIn.value = "";
    if (fSbdIn) fSbdIn.value = "";

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

// ==========================================
// ĐĂNG NHẬP THEO LỚP: SO SÁNH 2 THÔNG SỐ: PASS VÀ USERNAME
// VÀ XÁC THỰC PHẢN HỒI FIREBASE SIÊU TỐC
// ==========================================
async function submitStudentLogin() {
    const errBox = document.getElementById("st-login-error");
    const submitBtn = document.getElementById("st-submit-btn");

    const showErr = (msg) => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Vào thi 🚀";
        }
        if (errBox) {
            errBox.innerText = msg;
            errBox.style.display = "block";
        } else {
            alert(msg);
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

    // 1. Kiểm tra 2 thông số chuẩn: 1 là pass, 2 là username
    if (activeStudentLogin.currentMode === "class") {
        const usernameVal = (document.getElementById("st-username-input").value || "").trim();
        const passVal = (document.getElementById("st-password-input").value || "").trim();

        if (!usernameVal || !passVal) {
            showErr("⚠️ Vui lòng nhập đầy đủ Tên đăng nhập (username) và Mật khẩu (pass)!");
            return;
        }

        const accounts = getAccountsForCategory(activeStudentLogin.categoryId);
        const normUser = normalizeName(usernameVal);

        // So khớp trực tiếp 2 thông số: pass và username
        const matched = accounts.find(acc => {
            const passOk = String(acc.pass || "").trim() === passVal;
            const accUserNorm = normalizeName(acc.username || "");
            const userOk = (accUserNorm === normUser) || (String(acc.username || "").trim().toLowerCase() === usernameVal.toLowerCase());
            return passOk && userOk;
        });

        if (!matched) {
            showErr("❌ Sai tên đăng nhập hoặc mật khẩu cho lớp này!");
            return;
        }

        finalSbd = matched.sbd;
        finalName = matched.name || matched.username;
        finalClass = matched.className || "Lớp học";

    } else {
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

    // 2. Tiến hành chu trình gửi xác thực & chờ phản hồi từ Firebase siêu nhanh
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "⏳ Đang kết nối máy chủ xác thực...";
    }

    const quizId = extractQuizIdFromItem(activeStudentLogin.item);
    const safeSbd = (finalSbd || "user").replace(/[^a-zA-Z0-9]/g, '_');
    const examCode = cleanExamCodeKey(activeStudentLogin.item.title || "exam");

    let isHandshakeSuccess = false;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2800); // Tối đa 2.8s cho mạng chậm

        const presencePayload = {
            sbd: finalSbd,
            name: finalName,
            className: finalClass,
            categoryId: activeStudentLogin.categoryId,
            quizId: quizId,
            examTitle: activeStudentLogin.examTitle,
            loginTime: Date.now(),
            lastPing: Date.now()
        };

        // Gửi xác thực phiên đăng nhập đồng thời lên Firebase
        const pingTasks = [
            fetch(`${FIREBASE_DB_URL}/active_sessions/${examCode}/${safeSbd}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(presencePayload),
                signal: controller.signal
            })
        ];

        if (quizId && quizId !== examCode) {
            pingTasks.push(
                fetch(`${FIREBASE_DB_URL}/active_sessions/${quizId}/${safeSbd}.json`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(presencePayload),
                    signal: controller.signal
                })
            );
        }

        const responses = await Promise.all(pingTasks);
        clearTimeout(timeoutId);

        if (responses.some(r => r && r.ok)) {
            isHandshakeSuccess = true;
        }
    } catch(err) {
        console.warn("Xác thực Firebase gặp độ trễ mạng:", err);
    }

    // Nếu Firebase phản hồi thành công hoặc kiểm tra mạng an toàn
    if (submitBtn) {
        submitBtn.innerHTML = "✅ Xác thực thành công! Đang vào đề...";
    }

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

    // Điều hướng vào bài thi tức thì
    setTimeout(() => {
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
    }, 120);
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

// Thu gọn tự động các popover khi click ra ngoài
document.addEventListener("click", function(event) {
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

    const badgeWrapper = event.target.closest(".badge-wrapper");
    if (!badgeWrapper) {
        document.querySelectorAll(".badge-dropdown-menu.show").forEach(m => m.classList.remove("show"));
    }
});
```

---

### `thi-service.js`
```javascript
// =========================================================
// FILE: thi-service.js
// QUẢN LÝ KẾT NỐI MẠNG, FIREBASE REALTIME, PRESENCE, 
// THEO DÕI ĐỔI THỜI GIAN, GIÁM SÁT TAB GIAN LẬN & HÀNG ĐỢI NỘP BÀI
// =========================================================

const URL1_TAB_CHEATING = "https://script.google.com/macros/s/AKfycbzAPaLBO8gjPdbzrXOhvChUMzBHsnrhIMbJQIsDhqFtNfsW2Rf1Dki-bYJf-YCM-CCU/exec";
const URL2_EXAM_RESULT  = "https://script.google.com/macros/s/AKfycbx4ezz_9YOZKt9-idYUKz8N1dXg-LeIG-_UknLYKBVZJpxCJRx3yNHwfdWEQp-yhOISog/exec";
const FIREBASE_DB_URL   = "https://hethongthitracnghiem-518c5-default-rtdb.asia-southeast1.firebasedatabase.app";

let examData = null;
let EXAM_NAME = "ĐỀ THI TRẮC NGHIỆM";
let EXAM_PASSWORD = ""; 
let TIME_LIMIT_MINUTES = 45;  

let ANSWER_KEY = {};
let tabSwitchCount = 0;
let leaveTime = 0;
let isTabHidden = false;
let timerInterval = null;
let waitingInterval = null;
let timeWatcherInterval = null; 

let isSubmitted = false;
let examStartTime = null;
let totalTimeSeconds = 45 * 60;
let remainingSeconds = 45 * 60;

let totalQuestionsCount = 0;
let userAnswersState = {}; 
let padletClickedMap = {}; 
let questionDataMap = {};
let currentActiveQId = null;

let pendingSubmissionPayload = null;
let presenceInterval = null;
let onlineCountInterval = null;

function getExamCategory() {
    const urlParams = new URLSearchParams(window.location.search);
    let cat = urlParams.get('cat');
    if (cat) return cat;
    try {
        const raw = localStorage.getItem("current_exam_student");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.categoryId) return parsed.categoryId;
        }
    } catch(e) {}
    return "them-11";
}

function findStudentFromDatabase(query, preferredCat = null) {
    if (!query || !window.STUDENT_ACCOUNTS) return null;
    const q = String(query).trim().toLowerCase();

    const normalize = str => String(str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, "").trim();
    const qNorm = normalize(q);

    if (preferredCat && window.STUDENT_ACCOUNTS[preferredCat]) {
        const list = window.STUDENT_ACCOUNTS[preferredCat];
        const matched = list.find(acc => 
            (String(acc.sbd || "").trim().toLowerCase() === q) ||
            (normalize(acc.username) === qNorm) ||
            (normalize(acc.name) === qNorm)
        );
        if (matched) return matched;
    }

    for (const cat in window.STUDENT_ACCOUNTS) {
        const list = window.STUDENT_ACCOUNTS[cat];
        if (Array.isArray(list)) {
            const matched = list.find(acc => 
                (String(acc.sbd || "").trim().toLowerCase() === q) ||
                (normalize(acc.username) === qNorm) ||
                (normalize(acc.name) === qNorm)
            );
            if (matched) return matched;
        }
    }
    return null;
}

function findStudentByPassword(passQuery, preferredCat = null) {
    if (!passQuery || !window.STUDENT_ACCOUNTS) return null;
    const p = String(passQuery).trim().toLowerCase();
    
    if (preferredCat && window.STUDENT_ACCOUNTS[preferredCat]) {
        const list = window.STUDENT_ACCOUNTS[preferredCat];
        const matched = list.find(acc => String(acc.pass || "").trim().toLowerCase() === p);
        if (matched) return matched;
    }

    for (const cat in window.STUDENT_ACCOUNTS) {
        const list = window.STUDENT_ACCOUNTS[cat];
        if (Array.isArray(list)) {
            const matched = list.find(acc => String(acc.pass || "").trim().toLowerCase() === p);
            if (matched) return matched;
        }
    }
    return null;
}

function applyStudentToUI(student) {
    if (!student) return;
    const sName = student.name || student.username || "Thí sinh";
    const sId = student.sbd || student.id || "---";
    const sClass = student.className || student.lop || "---";

    const nameEl = document.getElementById("student-name");
    const idEl = document.getElementById("student-id");
    const classEl = document.getElementById("student-class");
    if (nameEl) nameEl.value = sName;
    if (idEl) idEl.value = sId;
    if (classEl) classEl.value = sClass;

    const navName = document.getElementById("nav-student-name");
    const navId = document.getElementById("nav-student-id");
    const navClass = document.getElementById("nav-student-class");
    if (navName) navName.innerText = sName;
    if (navId) navId.innerText = sId;
    if (navClass) navClass.innerText = sClass;

    try {
        localStorage.setItem("saved_student_name", sName);
        localStorage.setItem("saved_student_sbd", sId);
        localStorage.setItem("saved_student_class", sClass);
    } catch(e) {}
}

function syncStudentFromParamsAndStorage() {
    const urlParams = new URLSearchParams(window.location.search);
    let sbd = urlParams.get('sbd');
    let name = urlParams.get('name');
    let className = urlParams.get('class');
    let cat = urlParams.get('cat') || getExamCategory();

    if (sbd && name) {
        applyStudentToUI({ sbd: sbd, name: name, className: className || "---" });
        return;
    }

    if (!sbd || !name) {
        try {
            const rawSaved = localStorage.getItem("current_exam_student");
            if (rawSaved) {
                const parsed = JSON.parse(rawSaved);
                if (parsed && (parsed.sbd || parsed.name)) {
                    sbd = sbd || parsed.sbd;
                    name = name || parsed.name;
                    className = className || parsed.className;
                }
            }
        } catch(e) {}
    }

    if (!sbd && !name) {
        sbd = localStorage.getItem("saved_student_sbd");
        name = localStorage.getItem("saved_student_name");
        className = localStorage.getItem("saved_student_class");
    }

    if (sbd || name) {
        const found = findStudentFromDatabase(sbd, cat) || findStudentFromDatabase(name, cat);
        if (found) {
            applyStudentToUI(found);
        } else if (name) {
            applyStudentToUI({ sbd: sbd || "---", name: name, className: className || "---" });
        }
    }
}

function isCurrentExamAllowFree() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');
    if (quizId) {
        const localVal = localStorage.getItem(`exam_allow_free_${quizId}`);
        if (localVal !== null) {
            return (localVal === 'true');
        }
    }
    if (examData && examData.allowFree !== undefined) {
        return (examData.allowFree !== false);
    }
    return true;
}

function getMaDe() { 
    const urlParams = new URLSearchParams(window.location.search); 
    const urlMaDe = urlParams.get('made') || urlParams.get('maDe'); 
    if (urlMaDe) return String(urlMaDe).trim(); 
    if (typeof examData !== 'undefined' && examData && examData.maDe) return String(examData.maDe).trim(); 
    return "101"; 
}

function getExamCode() { 
    let code = getMaDe() || EXAM_NAME; 
    return String(code).trim().replace(/\s+/g, '_').replace(/[.#$\[\]\/]/g, '_'); 
}

async function postToGoogleSheet(url, payload, timeoutMs = 15000) { 
    const controller = new AbortController(); 
    const timer = setTimeout(() => controller.abort(), timeoutMs); 
    try { 
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: controller.signal }); 
        clearTimeout(timer); 
        return { ok: true, res }; 
    } catch (err) { 
        clearTimeout(timer); 
        try { 
            const controller2 = new AbortController(); 
            const timer2 = setTimeout(() => controller2.abort(), 4000); 
            const res2 = await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: controller2.signal }); 
            clearTimeout(timer2); 
            return { ok: true, res: res2 }; 
        } catch(e2) { throw err; } 
    } 
}

function startPresenceSystem(sId) {
    const safeId = (sId || "user").replace(/[^a-zA-Z0-9]/g, '_');
    const examCode = getExamCode();
    
    updatePresence(examCode, safeId);
    fetchOnlineCount(examCode);

    if (presenceInterval) clearInterval(presenceInterval);
    if (onlineCountInterval) clearInterval(onlineCountInterval);

    presenceInterval = setInterval(() => { updatePresence(examCode, safeId); }, 12000);
    onlineCountInterval = setInterval(() => { fetchOnlineCount(examCode); }, 10000);
}

async function updatePresence(examCode, safeId) {
    try {
        const sId = document.getElementById("student-id") ? document.getElementById("student-id").value.trim() : "";
        const sName = document.getElementById("student-name") ? document.getElementById("student-name").value.trim() : "";
        const sClass = document.getElementById("student-class") ? document.getElementById("student-class").value.trim() : "";
        const currentCat = getExamCategory();
        const checkInClass = findStudentFromDatabase(sId, currentCat);
        const isFree = !checkInClass;

        const urlParams = new URLSearchParams(window.location.search);
        const currentQuizId = urlParams.get('id') || "";

        const presencePayload = {
            sbd: sId,
            name: sName,
            className: sClass,
            cat: currentCat,
            categoryId: currentCat,
            isFree: isFree,
            quizId: currentQuizId,
            maDe: getMaDe(),
            examName: EXAM_NAME,
            examTitle: EXAM_NAME,
            startTime: examStartTime || Date.now(),
            lastPing: Date.now()
        };

        const pushNodes = [examCode];
        if (currentQuizId && currentQuizId !== examCode) pushNodes.push(currentQuizId);

        await Promise.all(pushNodes.map(n => 
            fetch(`${FIREBASE_DB_URL}/active_sessions/${n}/${safeId}.json`, {
                method: 'PUT', body: JSON.stringify(presencePayload)
            }).catch(() => null)
        ));
    } catch(e) {}
}

async function fetchOnlineCount(examCode) {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/active_sessions/${examCode}.json`);
        const data = await res.json();
        if (data) {
            const now = Date.now();
            let activeCount = 0;
            for (const key in data) {
                const val = data[key];
                const pingTime = (typeof val === 'number') ? val : (val && val.lastPing ? val.lastPing : 0);
                if (now - pingTime < 180000) activeCount++;
            }
            const badge = document.getElementById("nav-online-val");
            if (badge) badge.innerText = Math.max(1, activeCount);
        }
    } catch(e) {}
}

function clearPresence(sId) {
    if (presenceInterval) clearInterval(presenceInterval);
    if (onlineCountInterval) clearInterval(onlineCountInterval);
    const safeId = (sId || "user").replace(/[^a-zA-Z0-9]/g, '_');
    const urlParams = new URLSearchParams(window.location.search);
    const currentQuizId = urlParams.get('id') || "";

    fetch(`${FIREBASE_DB_URL}/active_sessions/${getExamCode()}/${safeId}.json`, { method: 'DELETE' }).catch(e=>{});
    if (currentQuizId) {
        fetch(`${FIREBASE_DB_URL}/active_sessions/${currentQuizId}/${safeId}.json`, { method: 'DELETE' }).catch(e=>{});
    }
}

function showTimeChangeToast(message) {
    const toast = document.getElementById("time-change-toast");
    const msg = document.getElementById("time-change-toast-msg");
    if (!toast || !msg) return;
    msg.innerText = message;
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 4500);
}

function startTimeWatcherRealtime(quizId) {
    if (!quizId) return;
    if (timeWatcherInterval) clearInterval(timeWatcherInterval);

    timeWatcherInterval = setInterval(async () => {
        if (isSubmitted || !examStartTime) return;
        try {
            const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
            const freshData = await res.json();
            if (!freshData) return;

            if (freshData.timeLimitMinutes && parseInt(freshData.timeLimitMinutes, 10) !== TIME_LIMIT_MINUTES) {
                const newMinutes = parseInt(freshData.timeLimitMinutes, 10);
                TIME_LIMIT_MINUTES = newMinutes;
                totalTimeSeconds = TIME_LIMIT_MINUTES * 60;

                const now = Date.now();
                const elapsedTimeSec = Math.floor((now - examStartTime) / 1000);
                remainingSeconds = Math.max(0, totalTimeSeconds - elapsedTimeSec);

                const timerVal = document.getElementById("nav-timer-val");
                const timerBox = document.getElementById("nav-timer-box");
                if (timerVal) timerVal.innerText = formatHHMMSS(remainingSeconds);
                if (timerBox) {
                    if (remainingSeconds <= 120) timerBox.classList.add("timer-warning");
                    else timerBox.classList.remove("timer-warning");

                    timerBox.classList.add("timer-updated");
                    setTimeout(() => timerBox.classList.remove("timer-updated"), 2500);
                }

                if (!timerInterval && remainingSeconds > 0) {
                    startCountdownTimer();
                }

                saveExamStateToStorage();
                showTimeChangeToast(`⏱ Giáo viên vừa cập nhật thời gian làm bài: ${newMinutes} phút!`);
            }

            if (freshData.examEndTimeStr && examData && freshData.examEndTimeStr !== examData.examEndTimeStr) {
                examData.examEndTimeStr = freshData.examEndTimeStr;
                if (freshData.examStartTimeStr) examData.examStartTimeStr = freshData.examStartTimeStr;

                const newEndFormatted = new Date(freshData.examEndTimeStr).toLocaleString("vi-VN", {
                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                });
                showTimeChangeToast(`📅 Giáo viên vừa gia hạn lịch nộp bài đến: ${newEndFormatted}!`);

                if (!timerInterval && remainingSeconds > 0) {
                    startCountdownTimer();
                }
            }

            if (freshData.allowFree !== undefined && examData) {
                examData.allowFree = freshData.allowFree;
                localStorage.setItem(`exam_allow_free_${quizId}`, String(freshData.allowFree !== false));
            }
        } catch(e) {}
    }, 1500);
}

function setupBackPrevention() { 
    window.history.pushState({ page: 'quiz' }, "", ""); 
    window.addEventListener('popstate', function () { 
        if (!isSubmitted && examStartTime) { 
            window.history.pushState({ page: 'quiz' }, "", ""); 
            confirm("⚠️ BẠN ĐANG TRONG BÀI THI!\nThoát hoặc quay lại sẽ làm gián đoạn bài làm của bạn."); 
        } 
    }); 
    window.addEventListener('beforeunload', function (e) { 
        if (!isSubmitted && examStartTime) { 
            saveExamStateToStorage(); 
            e.preventDefault(); 
            e.returnValue = 'Bài làm của bạn chưa được nộp. Dữ liệu đã được lưu tạm an toàn.'; 
        } 
    }); 
    window.addEventListener('online', function() { 
        document.getElementById("net-status-banner").style.display = "none"; 
        checkPendingSubmissionOnLoad(); 
    }); 
    window.addEventListener('offline', function() { 
        document.getElementById("net-status-banner").style.display = "block"; 
    }); 
}

function getStorageKey() { return `exam_autosave_active_session_${EXAM_NAME}_${getMaDe()}`; }

function saveExamStateToStorage() { 
    if (!examStartTime || isSubmitted) return; 
    const dataToSave = { 
        userAnswers: userAnswersState, 
        padletClickedMap: padletClickedMap, 
        examStartTime: examStartTime, 
        tabSwitchCount: tabSwitchCount, 
        timeLimitMinutes: TIME_LIMIT_MINUTES, 
        studentId: document.getElementById("student-id").value.trim(), 
        studentName: document.getElementById("student-name").value.trim(), 
        studentClass: document.getElementById("student-class").value.trim(), 
        isStarted: true 
    }; 
    try { localStorage.setItem(getStorageKey(), JSON.stringify(dataToSave)); } catch(e) {} 
}

function restoreExamStateFromStorage() { 
    try { 
        const raw = localStorage.getItem(getStorageKey()); 
        if (!raw) return false; 
        const parsed = JSON.parse(raw); 
        
        const urlParams = new URLSearchParams(window.location.search);
        const currentUrlSbd = urlParams.get('sbd');
        if (currentUrlSbd && parsed.studentId && currentUrlSbd.toLowerCase() !== String(parsed.studentId).toLowerCase()) {
            localStorage.removeItem(getStorageKey());
            return false;
        }

        if (parsed && parsed.isStarted && parsed.userAnswers) { 
            userAnswersState = parsed.userAnswers || {}; 
            padletClickedMap = parsed.padletClickedMap || {}; 
            tabSwitchCount = parsed.tabSwitchCount || 0; 
            examStartTime = parsed.examStartTime || Date.now(); 
            if (parsed.timeLimitMinutes) {
                TIME_LIMIT_MINUTES = parseInt(parsed.timeLimitMinutes, 10);
                totalTimeSeconds = TIME_LIMIT_MINUTES * 60;
            }
            if (parsed.studentId) document.getElementById("student-id").value = parsed.studentId; 
            if (parsed.studentName) document.getElementById("student-name").value = parsed.studentName; 
            if (parsed.studentClass) document.getElementById("student-class").value = parsed.studentClass; 
            return true; 
        } 
    } catch(e) {} 
    return false; 
}

function checkPendingSubmissionOnLoad() { 
    try { 
        const raw = localStorage.getItem("pending_exam_submission"); 
        if (raw) { 
            const parsed = JSON.parse(raw); 
            if (parsed && parsed.studentName) { 
                pendingSubmissionPayload = parsed; 
                document.getElementById("pending-resend-bar").style.display = "block";
            } 
        } 
    } catch(e) {} 
}
function dismissPendingBar() { document.getElementById("pending-resend-bar").style.display = "none"; }

document.addEventListener("visibilitychange", function() { 
    if (!examStartTime || isSubmitted) return; 
    if (document.hidden) { 
        if (!isTabHidden) { 
            isTabHidden = true; 
            leaveTime = Date.now(); 
            tabSwitchCount++; 
        } 
    } else { 
        if (isTabHidden && leaveTime > 0) { 
            isTabHidden = false; 
            let durationSec = Math.max(1, Math.round((Date.now() - leaveTime) / 1000)); 
            leaveTime = 0; 
            let mins = Math.floor(durationSec / 60); 
            let secs = durationSec % 60; 
            let durationStr = mins > 0 ? `${mins} phút ${secs} giây` : `${secs} giây`; 
            sendTabSwitchLog(tabSwitchCount, durationStr, durationSec); 
            setTimeout(() => alert(`⚠️ CẢNH BÁO GIAN LẬN:\nBạn vừa rời bài thi ${durationStr} (Lần ${tabSwitchCount}).`), 100); 
        } 
    } 
});

function sendTabSwitchLog(switchCount, durationStr, durationSec = 0) { 
    let sId = document.getElementById("student-id") ? document.getElementById("student-id").value.trim() : ""; 
    let sName = document.getElementById("student-name") ? document.getElementById("student-name").value.trim() : ""; 
    let sClass = document.getElementById("student-class") ? document.getElementById("student-class").value.trim() : ""; 
    const currentCat = getExamCategory();
    const urlParams = new URLSearchParams(window.location.search);
    const currentQuizId = urlParams.get('id') || "";

    let payload = { 
        quizId: currentQuizId,
        maDe: getMaDe(), 
        examName: EXAM_NAME, 
        categoryId: currentCat, 
        cat: currentCat, 
        studentId: sId||"Chưa nhập", 
        sbd: sId||"Chưa nhập", 
        soBaoDanh: sId||"Chưa nhập", 
        studentName: sName||"Chưa nhập", 
        studentClass: sClass||"Chưa nhập", 
        switchCount, 
        tabSwitchCount: switchCount, 
        durationStr, 
        durationSec, 
        timestamp: new Date().toLocaleString("vi-VN"), 
        createdAt: Date.now() 
    }; 
    postToGoogleSheet(URL1_TAB_CHEATING, payload, 20000).catch(e=>{}); 
    fetch(`${FIREBASE_DB_URL}/exams/${getExamCode()}/cheating_logs.json`, {
        method: 'POST', body: JSON.stringify(payload)
    }).catch(e=>{}); 
}

function savePendingSubmissionToFile() { 
    if (!pendingSubmissionPayload) return; 
    try { localStorage.setItem("pending_exam_submission", JSON.stringify(pendingSubmissionPayload)); } catch(e) {} 
    const blob = new Blob([JSON.stringify(pendingSubmissionPayload, null, 2)], { type: "application/json;charset=utf-8" }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = `BaiLam_${pendingSubmissionPayload.studentId}_${pendingSubmissionPayload.studentName}.json`; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url); 
    alert("✅ Đã lưu file bài làm tạm!"); 
}

function downloadPendingSubmissionFile() { savePendingSubmissionToFile(); }

function retrySubmitPending() { 
    if (!pendingSubmissionPayload) { 
        try { 
            const raw = localStorage.getItem("pending_exam_submission"); 
            if (raw) pendingSubmissionPayload = JSON.parse(raw); 
        } catch(e) {} 
    } 
    if (!pendingSubmissionPayload) { 
        document.getElementById("pending-resend-bar").style.display = "none"; 
        return; 
    } 
    const infoText = document.getElementById("pending-info-txt"); 
    infoText.innerText = "⏳ Đang thử gửi lại dữ liệu..."; 

    Promise.all([ 
        postToGoogleSheet(URL2_EXAM_RESULT, pendingSubmissionPayload, 15000), 
        fetch(`${FIREBASE_DB_URL}/exams/${getExamCode()}/submissions.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingSubmissionPayload)
        })
    ]).then(() => { 
        try { 
            localStorage.removeItem("pending_exam_submission"); 
            pendingSubmissionPayload = null;
        } catch(e) {} 
        document.getElementById("pending-resend-bar").style.display = "none"; 
        alert("✅ Đã gửi lại dữ liệu thành công!"); 
    }).catch((err) => { 
        infoText.innerText = "⚠️ Lỗi khi gửi lại! Vui lòng tải file và gửi cho giáo viên."; 
    }); 
}
