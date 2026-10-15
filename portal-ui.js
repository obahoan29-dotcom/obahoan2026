// =========================================================
// FILE: portal-ui.js
// QUẢN LÝ GIAO DIỆN CHÍNH, BẢNG MÀU NỐI LIỀN, CARD & BÀI BÁO DÂN TRÍ
// =========================================================

let activeDayThemCatId = null;
let activeChinhKhoaRow1CatId = null;
let activeChinhKhoaRow2CatId = null;
let activeDantriCatId = null;

let currentActiveArticleItem = null;
let currentActiveArticleCatId = "nhac-nho";
let currentTargetAvatarItemId = null;
let currentTargetAvatarCatId = "nhac-nho";

const categoryExpandedState = {};

// 4 LINK PADLET CHUẨN ĐÚNG THỨ TỰ TỪ CÁC ĐỀ THI
const DEFAULT_PADLET_LINKS = [
    {
        id: "padlet_11a",
        firebaseId: "padlet_11a",
        categoryId: "tu-luan-padlet",
        title: "11A nộp tự luận Padlet",
        date: "16/09/2026 - 10:00",
        timestamp: 1773630004,
        url: "https://padlet.com/obahoan29/11a-nop-tu-luan-padlet-160926-s023me0a6si1mqhqpnb4",
        badgeText: "HOT",
        isDoc: true,
        avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png"
    },
    {
        id: "padlet_11c",
        firebaseId: "padlet_11c",
        categoryId: "tu-luan-padlet",
        title: "11C nộp tự luận Padlet",
        date: "16/09/2026 - 10:00",
        timestamp: 1773630003,
        url: "https://padlet.com/obahoan29/11c-nop-tu-luan-padlet-160926-s023me1v17byc9z8qj13",
        badgeText: "HOT",
        isDoc: true,
        avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png"
    },
    {
        id: "padlet_10p",
        firebaseId: "padlet_10p",
        categoryId: "tu-luan-padlet",
        title: "10P nộp tự luận Padlet",
        date: "16/09/2026 - 10:00",
        timestamp: 1773630002,
        url: "https://padlet.com/obahoan29/10p-nop-tu-luan-tu-05-09-2026-s023mdx0qopg0az79ix0",
        badgeText: "HOT",
        isDoc: true,
        avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png"
    },
    {
        id: "padlet_11e",
        firebaseId: "padlet_11e",
        categoryId: "tu-luan-padlet",
        title: "11E nộp tự luận Padlet",
        date: "16/09/2026 - 10:00",
        timestamp: 1773630001,
        url: "https://padlet.com/obahoan42/nop-tu-luan-11e-padlet-s024j7r2sdb80rqmahq7",
        badgeText: "HOT",
        isDoc: true,
        avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png"
    }
];

document.addEventListener("DOMContentLoaded", async function() {
    initBannerAndAvatars();
    if (typeof initTableSettings === "function") initTableSettings();
    if (typeof initAvatarGrid === "function") initAvatarGrid();
    if (typeof checkAdminSessionValidity === "function") checkAdminSessionValidity();

    // Khởi tạo trước 4 link padlet để hiển thị tức thì
    const padletCat = CHINH_KHOA_CATEGORIES.find(c => c.id === "tu-luan-padlet");
    if (padletCat) padletCat.links = [...DEFAULT_PADLET_LINKS];

    refreshAllViews();
    await loadDataFromFirebase();
    if (typeof initSiteVisitTracker === "function") initSiteVisitTracker();
});

function initBannerAndAvatars() {
    const topImg = document.getElementById("top-banner-img");
    const avatarImg = document.getElementById("web-avatar-img");
    const botImg = document.getElementById("bottom-banner-img");

    if (topImg) {
        topImg.src = TOP_BANNER_URL || "https://files.catbox.moe/cf5o9u.jpg";
        topImg.onerror = function() { this.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200"; };
    }
    if (avatarImg) {
        avatarImg.src = WEB_AVATAR_URL || "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150";
        avatarImg.onerror = function() { this.src = "https://cdn-icons-png.flaticon.com/512/3135/3135768.png"; };
    }
    if (botImg) {
        botImg.src = BOTTOM_BANNER_URL || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1000";
        botImg.onerror = function() { this.src = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1000"; };
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
        const [linksRes, metaRes] = await Promise.all([
            fetch(`${FIREBASE_DB_URL}/custom_links.json`).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/site_meta.json`).catch(() => null)
        ]);

        let customLinksData = linksRes && linksRes.ok ? await linksRes.json() : null;
        let siteMetaData = metaRes && metaRes.ok ? await metaRes.json() : null;

        if (siteMetaData && siteMetaData.reminderTitle) {
            REMINDER_SECTION_TITLE = siteMetaData.reminderTitle;
        }

        if (customLinksData && typeof customLinksData === "object") {
            if (customLinksData["nhac-nho"]) {
                const rLinks = Object.keys(customLinksData["nhac-nho"]).map(k => ({
                    id: k, firebaseId: k, ...customLinksData["nhac-nho"][k], categoryId: "nhac-nho", isDoc: true
                })).filter(l => l && l.title && l.title !== "undefined");
                if (rLinks.length > 0) REMINDER_CATEGORY.links = sortLinksNewestFirst(rLinks);
            }

            [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES].forEach(cat => {
                // Bảo vệ riêng cho mục Nộp tự luận Padlet
                if (cat.id === "tu-luan-padlet") {
                    let customPadlet = [];
                    if (customLinksData[cat.id]) {
                        customPadlet = Object.keys(customLinksData[cat.id]).map(k => ({
                            id: k, firebaseId: k, ...customLinksData[cat.id][k], categoryId: cat.id
                        })).filter(l => l && l.title && l.title !== "undefined" && String(l.title).trim() !== "");
                    }
                    cat.links = customPadlet.length > 0 ? sortLinksNewestFirst(customPadlet) : [...DEFAULT_PADLET_LINKS];
                    return;
                }

                if (customLinksData[cat.id]) {
                    let list = Object.keys(customLinksData[cat.id]).map(k => ({
                        id: k, firebaseId: k, ...customLinksData[cat.id][k], categoryId: cat.id
                    })).filter(l => l && l.title && l.title !== "undefined" && String(l.title).trim() !== "");
                    cat.links = sortLinksNewestFirst(list);
                } else if (cat.links) {
                    cat.links = sortLinksNewestFirst(cat.links);
                }
            });

            if (customLinksData["kho-tai-lieu"]) {
                let list = Object.keys(customLinksData["kho-tai-lieu"]).map(k => ({
                    id: k, firebaseId: k, ...customLinksData["kho-tai-lieu"][k], categoryId: "kho-tai-lieu"
                })).filter(l => l && l.title && l.title !== "undefined");
                KHO_TAI_LIEU_FOLDER.links = sortLinksNewestFirst(list);
            }
        }

        const activeQuizIds = new Set();
        [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES, KHO_TAI_LIEU_FOLDER].forEach(cat => {
            if (cat.links) {
                cat.links.forEach(l => {
                    if (!l.isDoc) {
                        const qId = extractQuizIdFromItem(l);
                        if (qId) activeQuizIds.add(qId);
                    }
                });
            }
        });

        await Promise.all(Array.from(activeQuizIds).map(async (qId) => {
            try {
                const [qRes, cfgRes] = await Promise.all([
                    fetch(`${FIREBASE_DB_URL}/quizzes/${qId}.json`).catch(() => null),
                    fetch(`${FIREBASE_DB_URL}/exam_configs/${qId}.json`).catch(() => null)
                ]);

                const qData = qRes && qRes.ok ? await qRes.json().catch(() => null) : null;
                const cfg = cfgRes && cfgRes.ok ? await cfgRes.json().catch(() => null) : null;

                const allCats = [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES, KHO_TAI_LIEU_FOLDER];
                allCats.forEach(cat => {
                    (cat.links || []).forEach(l => {
                        if (extractQuizIdFromItem(l) === qId) {
                            if (qData) {
                                if (qData.timeLimitMinutes !== undefined && qData.timeLimitMinutes !== "") {
                                    l.timeLimitMinutes = qData.timeLimitMinutes;
                                }
                                if (qData.examStartTimeStr) l.examStartTimeStr = qData.examStartTimeStr;
                                if (qData.examEndTimeStr) l.examEndTimeStr = qData.examEndTimeStr;
                                if (qData.allowFree !== undefined) l.allowFree = qData.allowFree;
                                if (qData.resultMode !== undefined) l.resultMode = qData.resultMode;
                                if (qData.allowReviewOriginal !== undefined) l.allowReviewOriginal = qData.allowReviewOriginal;
                                if (qData.showOnlineCount !== undefined) l.showOnlineCount = qData.showOnlineCount;
                                if (qData.maDe) l.maDe = qData.maDe;
                            }

                            if (cfg) {
                                if (cfg.timeLimitMinutes !== undefined && cfg.timeLimitMinutes !== "") {
                                    l.timeLimitMinutes = cfg.timeLimitMinutes;
                                }
                                if (cfg.examStartTimeStr) l.examStartTimeStr = cfg.examStartTimeStr;
                                if (cfg.examEndTimeStr) l.examEndTimeStr = cfg.examEndTimeStr;
                                if (cfg.allowFree !== undefined) l.allowFree = cfg.allowFree;
                                if (cfg.resultMode !== undefined) l.resultMode = cfg.resultMode;
                                if (cfg.allowReviewOriginal !== undefined) l.allowReviewOriginal = cfg.allowReviewOriginal;
                                if (cfg.showOnlineCount !== undefined) l.showOnlineCount = cfg.showOnlineCount;
                            }
                        }
                    });
                });
            } catch(e) {}
        }));

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
    activeDantriCatId = (activeDantriCatId === catId) ? null : catId;
    renderDantriNav();
}

function renderDantriDropdown() {
    const panel = document.getElementById("dantri-dropdown-panel");
    const subTitle = document.getElementById("dantri-sub-title");
    const list = document.getElementById("dantri-news-list");
    if (!panel || !list) return;

    if (!activeDantriCatId) { panel.classList.remove("show"); return; }
    const cat = DANTRI_NAV_CATEGORIES.find(c => c.id === activeDantriCatId);
    if (!cat) { panel.classList.remove("show"); return; }

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

async function editReminderSectionTitle(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    let newTitle = prompt("✏️ Nhập tiêu đề mới cho khối Bản tin thường ngày:", REMINDER_SECTION_TITLE);
    if (newTitle !== null && newTitle.trim() !== "" && newTitle.trim() !== REMINDER_SECTION_TITLE) {
        REMINDER_SECTION_TITLE = newTitle.trim();
        const titleEl = document.getElementById("reminder-section-title-text");
        if (titleEl) titleEl.innerText = REMINDER_SECTION_TITLE;

        try {
            await fetch(`${FIREBASE_DB_URL}/site_meta.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reminderTitle: REMINDER_SECTION_TITLE })
            });
        } catch(e) { console.error("Lỗi lưu tiêu đề nhắc nhở:", e); }
    }
}

// HÀM TẠO VÀ SOẠN THẢO BÀI VIẾT MỚI VÀO BẢN TIN THƯỜNG NGÀY
function addNewReminderArticle(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const newItemId = "rem_" + Date.now();
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} - ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newItem = {
        id: newItemId,
        firebaseId: newItemId,
        categoryId: "nhac-nho",
        title: "",
        articleTitle: "",
        author: "Thầy Hoan",
        articleTime: formatDantriDateTime(now),
        date: dateStr,
        timestamp: Date.now(),
        badgeText: "MỚI",
        isHot: false,
        isDoc: true,
        avatar: PRESET_20_AVATARS[0],
        sapo: "",
        articleImg: "",
        articleImgCaption: "",
        articleBody: "",
        url: "#"
    };

    openDantriArticleModal(newItem, "nhac-nho", event, true);
}

function renderReminderSection() {
    const container = document.getElementById("reminder-container");
    const titleEl = document.getElementById("reminder-section-title-text");
    const editHeadBtn = document.getElementById("btn-edit-reminder-head");

    if (titleEl) titleEl.innerText = REMINDER_SECTION_TITLE || "📌 Bản tin thường ngày";
    if (editHeadBtn) editHeadBtn.style.display = isAdminLoggedIn ? "inline-flex" : "none";

    // Tự động gắn nút Đăng bài mới cạnh nút Sửa tiêu đề khi Admin đăng nhập
    const headerRow = document.querySelector(".reminder-header-row-box");
    if (headerRow) {
        let addBtn = document.getElementById("btn-add-reminder-post");
        if (!addBtn) {
            addBtn = document.createElement("button");
            addBtn.type = "button";
            addBtn.id = "btn-add-reminder-post";
            addBtn.className = "btn-edit-reminder-head";
            addBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
            addBtn.style.color = "#ffffff";
            addBtn.style.borderColor = "#10b981";
            addBtn.style.marginRight = "6px";
            addBtn.title = "Viết và đăng thêm bài viết mới vào Bản tin thường ngày";
            addBtn.onclick = (e) => addNewReminderArticle(e);

            if (editHeadBtn && editHeadBtn.parentNode) {
                editHeadBtn.parentNode.insertBefore(addBtn, editHeadBtn);
            } else {
                headerRow.appendChild(addBtn);
            }
        }
        addBtn.innerHTML = "➕ Đăng bài mới";
        addBtn.style.display = isAdminLoggedIn ? "inline-flex" : "none";
    }

    if (!container) return;
    container.innerHTML = "";

    const links = sortLinksNewestFirst(REMINDER_CATEGORY.links || []);
    // Bản tin thường ngày: Chỉ hiển thị 1 bài mới nhất (limit = 1)
    renderLinksWithFold(container, links, "nhac-nho", 1);
}

function renderLinksWithFold(container, links, categoryId, visibleLimit = 2) {
    if (!container) return;
    container.innerHTML = "";

    if (!links || links.length === 0) {
        container.innerHTML = `<div class="empty-folder">Chưa có bài tập hoặc tài liệu nào trong mục này.</div>`;
        return;
    }

    const sortedLinks = sortLinksNewestFirst(links);
    const total = sortedLinks.length;
    const isReminder = (categoryId === "nhac-nho");

    const firstPortion = sortedLinks.slice(0, visibleLimit);
    firstPortion.forEach(item => {
        container.appendChild(createItemCardElement(item, categoryId));
    });

    if (total > visibleLimit) {
        const remainingCount = total - visibleLimit;
        const remainingLinks = sortedLinks.slice(visibleLimit);
        const isExpanded = !!categoryExpandedState[categoryId];

        const foldWrapper = document.createElement("div");
        foldWrapper.className = "category-fold-wrapper";
        foldWrapper.style.width = "100%";

        const hiddenBox = document.createElement("div");
        hiddenBox.id = `fold-hidden-box-${categoryId}`;
        hiddenBox.className = "category-hidden-links";
        hiddenBox.style.display = isExpanded ? "flex" : "none";
        hiddenBox.style.flexDirection = "column";
        hiddenBox.style.gap = "8px";
        hiddenBox.style.marginTop = "8px";
        hiddenBox.style.width = "100%";

        remainingLinks.forEach(item => {
            hiddenBox.appendChild(createItemCardElement(item, categoryId));
        });

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.id = `fold-btn-${categoryId}`;
        toggleBtn.className = "load-more-btn category-expand-toggle-btn";
        toggleBtn.style.display = "flex";
        toggleBtn.style.alignItems = "center";
        toggleBtn.style.justifyContent = "center";
        toggleBtn.style.gap = "6px";
        toggleBtn.style.margin = "8px 0 0 0";
        toggleBtn.style.padding = "9px 14px";
        toggleBtn.style.borderRadius = "12px";
        toggleBtn.style.fontWeight = "800";
        toggleBtn.style.fontSize = "13px";
        toggleBtn.style.cursor = "pointer";
        toggleBtn.style.transition = "all 0.15s ease";

        if (isReminder) {
            toggleBtn.innerHTML = isExpanded 
                ? `▲ Thu gọn bài viết (${remainingCount} bài)` 
                : `▼ Xem tiếp ${remainingCount} bài viết cũ hơn`;
        } else {
            toggleBtn.innerHTML = isExpanded 
                ? `▲ Thu gọn lại (${remainingCount} mục)` 
                : `▼ Ấn vào đây để xem tiếp ${remainingCount} mục còn lại`;
        }

        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            categoryExpandedState[categoryId] = !categoryExpandedState[categoryId];
            const nowExpanded = categoryExpandedState[categoryId];
            hiddenBox.style.display = nowExpanded ? "flex" : "none";
            if (isReminder) {
                toggleBtn.innerHTML = nowExpanded 
                    ? `▲ Thu gọn bài viết (${remainingCount} bài)` 
                    : `▼ Xem tiếp ${remainingCount} bài viết cũ hơn`;
            } else {
                toggleBtn.innerHTML = nowExpanded 
                    ? `▲ Thu gọn lại (${remainingCount} mục)` 
                    : `▼ Ấn vào đây để xem tiếp ${remainingCount} mục còn lại`;
            }
        };

        foldWrapper.appendChild(hiddenBox);
        foldWrapper.appendChild(toggleBtn);
        container.appendChild(foldWrapper);
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
        btn.className = `dantri-nav-btn cat-btn-${cat.id}` + (isActive ? " active" : "");
        btn.innerHTML = `<span>${cat.title}</span> <span class="caret-icon">${isActive ? "▲" : "▼"}</span>`;
        btn.onclick = () => {
            activeDayThemCatId = (activeDayThemCatId === cat.id) ? null : cat.id;
            renderDayThemSection();
        };
        bar.appendChild(btn);
    });

    list.innerHTML = "";
    if (!activeDayThemCatId) { 
        panel.className = "dantri-dropdown-panel";
        return; 
    }

    const activeCat = DAY_THEM_CATEGORIES.find(c => c.id === activeDayThemCatId);
    panel.className = `dantri-dropdown-panel show cat-theme-${activeDayThemCatId}`;

    if (activeCat && activeCat.links && activeCat.links.length > 0) {
        renderLinksWithFold(list, activeCat.links, activeCat.id, 2);
    } else {
        list.innerHTML = `<div class="empty-folder">Chưa có bài kiểm tra nào trong mục này.</div>`;
    }
}

function renderChinhKhoaSection() {
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
            btn.className = `dantri-nav-btn cat-btn-${cat.id}` + (isActive ? " active" : "");
            btn.innerHTML = `<span>${cat.title}</span> <span class="caret-icon">${isActive ? "▲" : "▼"}</span>`;
            btn.onclick = () => {
                activeChinhKhoaRow1CatId = (activeChinhKhoaRow1CatId === cat.id) ? null : cat.id;
                renderChinhKhoaSection();
            };
            row1Bar.appendChild(btn);
        });

        row1List.innerHTML = "";
        if (!activeChinhKhoaRow1CatId) {
            row1Panel.className = "dantri-dropdown-panel";
        } else {
            const activeCat1 = row1Cats.find(c => c.id === activeChinhKhoaRow1CatId);
            row1Panel.className = `dantri-dropdown-panel show cat-theme-${activeChinhKhoaRow1CatId}`;
            if (activeCat1 && activeCat1.links && activeCat1.links.length > 0) {
                renderLinksWithFold(row1List, activeCat1.links, activeCat1.id, 2);
            } else {
                row1List.innerHTML = `<div class="empty-folder">Chưa có bài tập cho lớp này.</div>`;
            }
        }
    }

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
            let customCls = ` cat-btn-${cat.id}`;
            if (cat.id === "lop-11e") customCls += " lop11e-btn";
            else if (cat.isGold) customCls += " hsg-gold-btn";
            else if (cat.isPurple) customCls += " padlet-purple-btn";

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
            row2Panel.className = "dantri-dropdown-panel";
        } else {
            const activeCat2 = row2Cats.find(c => c.id === activeChinhKhoaRow2CatId);
            row2Panel.className = `dantri-dropdown-panel show cat-theme-${activeChinhKhoaRow2CatId}`;
            if (activeCat2 && activeCat2.links && activeCat2.links.length > 0) {
                renderLinksWithFold(row2List, activeCat2.links, activeCat2.id, 2);
            } else {
                row2List.innerHTML = `<div class="empty-folder">Chưa có nội dung trong chuyên mục này.</div>`;
            }
        }
    }
}

function renderKhoTaiLieuSection() {
    const container = document.getElementById("kho-tai-lieu-container");
    if (!container) return;

    container.innerHTML = `
        <details class="folder-section cat-theme-kho-tai-lieu" open>
            <summary class="folder-header">
                <img src="${KHO_TAI_LIEU_FOLDER.folderAvatar}" class="folder-avatar" alt="Kho tài liệu">
                <h3 class="folder-title">${KHO_TAI_LIEU_FOLDER.folderName}</h3>
                <span class="folder-arrow">▶</span>
            </summary>
            <div class="link-list" id="kho-tai-lieu-links-list"></div>
        </details>
    `;

    const subList = document.getElementById("kho-tai-lieu-links-list");
    if (subList) {
        renderLinksWithFold(subList, KHO_TAI_LIEU_FOLDER.links || [], "kho-tai-lieu", 2);
    }
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
    // Nhắc nhở / Bản tin luôn được đảm bảo là tài liệu bài viết (isDoc: true), tránh hiện nhầm các nút thi cử
    const isDoc = isReminder || item.isDoc;
    const itemId = item.id || item.firebaseId || `item_${Date.now()}`;
    const quizId = extractQuizIdFromItem(item) || itemId;
    const badge = item.badgeText || (item.isHot ? "HOT" : "NONE");
    const avatar = toDirectGoogleDriveImageUrl(item.avatar) || PRESET_20_AVATARS[0];
    const encodedData = encodeURIComponent(JSON.stringify(item));
    const isAllowFree = (item.allowFree !== false);
    const showOnlineCount = (item.showOnlineCount !== false);
    
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

    let bottomActionButtonsHtml = "";
    if (viewTestBtnHtml || reviewBtnHtml) {
        bottomActionButtonsHtml = `
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                ${viewTestBtnHtml}
                ${reviewBtnHtml}
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

                        <div class="left-sub-btns-row">
                            <button type="button" class="btn-time-sub-action btn-time-sub-minutes" onclick="openEditMinutesModal('${quizId}', event)" title="Đổi số phút làm bài">
                                ⏱ Đổi phút
                            </button>
                            <button type="button" class="btn-time-sub-action btn-time-sub-schedule" onclick="openEditScheduleModal('${quizId}', event)" title="Gia hạn thời gian đóng/mở đề">
                                📅 Gia hạn
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
            event.target.closest('.btn-test-exam-admin')) {
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

function formatDantriDateTime(d = new Date()) {
    const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    const dayName = days[d.getDay()] || "Hôm nay";
    const pad = n => String(n).padStart(2, '0');
    return `${dayName}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderArticleViewContent(item) {
    if (!item) return;
    const viewTitle = document.getElementById("article-view-title");
    const viewAuthor = document.getElementById("article-view-author");
    const viewTime = document.getElementById("article-view-time");
    const viewSapo = document.getElementById("article-view-sapo");
    const viewImgBox = document.getElementById("article-view-img-box");
    const viewImg = document.getElementById("article-view-img");
    const viewCaption = document.getElementById("article-view-caption");
    const viewBody = document.getElementById("article-view-body");

    const titleText = item.articleTitle || item.title || "Lưu ý quan trọng";
    const authorText = item.author || "Thầy Hoan";
    const timeText = item.articleTime || formatDantriDateTime(new Date(item.timestamp || Date.now()));
    const sapoText = item.sapo || `(Dân trí) - Thông báo quan trọng gửi tới toàn thể học sinh: "${titleText}".`;

    let bodyText = item.articleBody || "";
    if (!bodyText.trim()) bodyText = `Chào các em học sinh!\n\nĐây là thông báo quan trọng từ thầy giáo về nội dung: "${titleText}". Các em hãy chú ý theo dõi và thực hiện nghiêm túc theo đúng kế hoạch.`;

    if (viewTitle) viewTitle.innerText = titleText;
    if (viewAuthor) viewAuthor.innerText = authorText;
    if (viewTime) viewTime.innerText = timeText;
    if (viewSapo) viewSapo.innerText = sapoText;
    if (viewBody) viewBody.innerText = bodyText;

    const rawImg = item.articleImg || item.articleImage || "";
    if (rawImg && rawImg.trim() !== "") {
        const directUrl = toDirectGoogleDriveImageUrl(rawImg);
        if (viewImg) {
            viewImg.src = directUrl;
            viewImg.onerror = function() {
                let m = rawImg.match(/(?:file\/d\/|id=|open\?id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
                if (m && m[1] && !this.dataset.triedThumb) {
                    this.dataset.triedThumb = "true";
                    this.src = `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200`;
                }
            };
        }
        if (viewCaption) viewCaption.innerText = item.articleImgCaption || "Ảnh đại diện bài viết";
        if (viewImgBox) viewImgBox.style.display = "block";
    } else {
        if (viewImgBox) viewImgBox.style.display = "none";
    }

    let attachBox = document.getElementById("article-view-attach-box");
    if (!attachBox && viewBody) {
        attachBox = document.createElement("div");
        attachBox.id = "article-view-attach-box";
        attachBox.className = "dantri-attach-box";
        viewBody.parentNode.insertBefore(attachBox, viewBody.nextSibling);
    }
    if (attachBox) {
        if (item.url && item.url !== "#" && !item.url.includes("thi.html")) {
            attachBox.innerHTML = `<a href="${item.url}" target="_blank" class="btn-open-attach">📎 Bấm vào đây để mở tài liệu / link đính kèm</a>`;
            attachBox.style.display = "block";
        } else { attachBox.style.display = "none"; }
    }
}

function openDantriArticleModal(item, categoryId, event, startWithEdit = false) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    currentActiveArticleItem = item;
    currentActiveArticleCatId = categoryId || "nhac-nho";
    const modal = document.getElementById("dantri-article-modal");
    const editToggleBtn = document.getElementById("btn-toggle-article-edit");
    if (editToggleBtn) editToggleBtn.style.display = isAdminLoggedIn ? "inline-block" : "none";
    renderArticleViewContent(item);
    if (startWithEdit && isAdminLoggedIn) setArticleEditMode(true);
    else setArticleEditMode(false);
    if (modal) modal.style.display = "flex";
}

function closeArticleModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const modal = document.getElementById("dantri-article-modal");
    if (modal) modal.style.display = "none";
    setArticleEditMode(false);
}

function toggleArticleEditMode(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const editModeDiv = document.getElementById("dantri-article-edit-mode");
    const isCurrentlyEditing = (editModeDiv && editModeDiv.style.display === "block");

    if (isCurrentlyEditing) {
        if (currentActiveArticleItem) {
            currentActiveArticleItem.articleTitle = document.getElementById("edit-article-title")?.value.trim() || currentActiveArticleItem.title;
            currentActiveArticleItem.title = currentActiveArticleItem.articleTitle;
            currentActiveArticleItem.author = document.getElementById("edit-article-author")?.value.trim() || "Thầy Hoan";
            currentActiveArticleItem.sapo = document.getElementById("edit-article-sapo")?.value.trim() || "";
            currentActiveArticleItem.articleImg = document.getElementById("edit-article-img-url")?.value.trim() || "";
            currentActiveArticleItem.articleImgCaption = document.getElementById("edit-article-img-caption")?.value.trim() || "";
            currentActiveArticleItem.articleBody = document.getElementById("edit-article-body")?.value.trim() || "";
        }
        renderArticleViewContent(currentActiveArticleItem);
        setArticleEditMode(false);
    } else { setArticleEditMode(true); }
}

function setArticleEditMode(isEdit) {
    const viewDiv = document.getElementById("dantri-article-view-mode");
    const editDiv = document.getElementById("dantri-article-edit-mode");
    const toggleBtn = document.getElementById("btn-toggle-article-edit");
    const previewImgBox = document.getElementById("article-edit-preview-box");
    const previewImg = document.getElementById("article-edit-preview-img");

    if (isEdit) {
        if (viewDiv) viewDiv.style.display = "none";
        if (editDiv) editDiv.style.display = "block";
        if (toggleBtn) toggleBtn.innerText = "👁️ Xem bài viết";

        const item = currentActiveArticleItem || {};
        document.getElementById("edit-article-title").value = item.articleTitle || item.title || "";
        document.getElementById("edit-article-author").value = item.author || "Thầy Hoan";
        document.getElementById("edit-article-time").value = item.articleTime || formatDantriDateTime(new Date(item.timestamp || Date.now()));
        document.getElementById("edit-article-sapo").value = item.sapo || "";
        document.getElementById("edit-article-img-url").value = item.articleImg || "";
        document.getElementById("edit-article-img-caption").value = item.articleImgCaption || "";
        document.getElementById("edit-article-body").value = item.articleBody || "";

        if (item.articleImg && previewImgBox && previewImg) {
            previewImg.src = toDirectGoogleDriveImageUrl(item.articleImg);
            previewImgBox.style.display = "block";
        } else if (previewImgBox) { previewImgBox.style.display = "none"; }
    } else {
        if (viewDiv) viewDiv.style.display = "block";
        if (editDiv) editDiv.style.display = "none";
        if (toggleBtn) toggleBtn.innerText = "✏️ Chỉnh sửa";
    }
}

function cancelArticleEdit(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    setArticleEditMode(false);
}

async function uploadArticleImageToDrive(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const statusBox = document.getElementById("article-img-upload-status");
    const urlInput = document.getElementById("edit-article-img-url");
    const previewBox = document.getElementById("article-edit-preview-box");
    const previewImg = document.getElementById("article-edit-preview-img");

    if (!GOOGLE_DRIVE_UPLOAD_GAS_URL || GOOGLE_DRIVE_UPLOAD_GAS_URL.includes("DÁN_URL")) {
        alert("⚠️ Bạn chưa cấu hình GOOGLE_DRIVE_UPLOAD_GAS_URL trong app-config.js!"); return;
    }

    if (statusBox) { statusBox.style.display = "block"; statusBox.innerText = `⏳ Đang đọc và tải ảnh "${file.name}" lên Google Drive...`; }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            let base64Data = e.target.result.split(',')[1];
            let mimeType = file.type || "image/jpeg";
            const res = await fetch(GOOGLE_DRIVE_UPLOAD_GAS_URL, {
                method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ filename: file.name, mimeType: mimeType, base64: base64Data })
            });
            const result = await res.json();
            if (result.status === "success" && result.fileUrl) {
                const directUrl = toDirectGoogleDriveImageUrl(result.fileUrl);
                if (urlInput) urlInput.value = directUrl;
                if (previewBox && previewImg) { previewImg.src = directUrl; previewBox.style.display = "block"; }
                if (statusBox) statusBox.innerText = "✅ Tải ảnh lên Google Drive thành công! Ảnh đã sẵn sàng hiển thị.";
            } else { throw new Error(result.message || "Máy chủ Drive không trả về URL"); }
        } catch(err) {
            if (statusBox) statusBox.innerText = "❌ Lỗi: " + err.message;
            alert("Lỗi upload ảnh lên Google Drive: " + err.message);
        }
    };
    reader.readAsDataURL(file);
}

async function saveArticleToFirebase(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!currentActiveArticleItem) return;

    const btn = document.getElementById("btn-save-article-firebase");
    const titleVal = document.getElementById("edit-article-title").value.trim();
    const authorVal = document.getElementById("edit-article-author").value.trim() || "Thầy Hoan";
    const timeVal = document.getElementById("edit-article-time").value.trim() || formatDantriDateTime(new Date());
    const sapoVal = document.getElementById("edit-article-sapo").value.trim();
    const rawImgVal = document.getElementById("edit-article-img-url").value.trim();
    const captionVal = document.getElementById("edit-article-img-caption").value.trim();
    const bodyVal = document.getElementById("edit-article-body").value.trim();

    if (!titleVal) { alert("⚠️ Vui lòng nhập tiêu đề bài viết!"); return; }

    btn.disabled = true; btn.innerText = "⏳ Đang lưu bài...";

    const directImgVal = toDirectGoogleDriveImageUrl(rawImgVal);
    let cardDateStr = "";
    let m = timeVal.match(/(\d{1,2}\/\d{1,2}\/\d{4}(?:\s*-\s*\d{1,2}:\d{2})?)/);
    if (m) cardDateStr = m[1];
    else {
        let d = new Date(); const pad = n => String(n).padStart(2, '0');
        cardDateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    const itemId = currentActiveArticleItem.id || currentActiveArticleItem.firebaseId;

    const payload = {
        title: titleVal, 
        articleTitle: titleVal, 
        author: authorVal, 
        articleTime: timeVal,
        date: cardDateStr, 
        timestamp: currentActiveArticleItem.timestamp || Date.now(),
        sapo: sapoVal, 
        articleImg: directImgVal, 
        articleImgCaption: captionVal, 
        articleBody: bodyVal,
        isDoc: true,
        badgeText: currentActiveArticleItem.badgeText || "MỚI",
        avatar: currentActiveArticleItem.avatar || PRESET_20_AVATARS[0],
        categoryId: currentActiveArticleCatId || "nhac-nho"
    };

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${currentActiveArticleCatId}/${itemId}.json`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });

        // Cập nhật bộ nhớ cục bộ
        if (currentActiveArticleCatId === "nhac-nho") {
            if (!REMINDER_CATEGORY.links) REMINDER_CATEGORY.links = [];
            const exIdx = REMINDER_CATEGORY.links.findIndex(l => l.id === itemId || l.firebaseId === itemId);
            if (exIdx !== -1) {
                REMINDER_CATEGORY.links[exIdx] = { id: itemId, firebaseId: itemId, ...payload };
            } else {
                REMINDER_CATEGORY.links.unshift({ id: itemId, firebaseId: itemId, ...payload });
            }
            REMINDER_CATEGORY.links = sortLinksNewestFirst(REMINDER_CATEGORY.links);
        }

        Object.assign(currentActiveArticleItem, payload);
        alert("🎉 Đã lưu bài viết theo phong cách báo Dân trí thành công!");
        window.location.reload();
    } catch(e) {
        alert("❌ Lỗi khi lưu bài viết: " + e.message);
        btn.disabled = false; btn.innerText = "💾 Lưu bài viết lên hệ thống";
    }
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
    const visitModal = document.getElementById("visit-stats-modal");
    if (visitModal && visitModal.style.display === "flex") { if (event.target === visitModal) { closeVisitStatsModal(); } }
    const articleModal = document.getElementById("dantri-article-modal");
    if (articleModal && articleModal.style.display === "flex") { if (event.target.id === "dantri-article-modal") { closeArticleModal(); } }
});
