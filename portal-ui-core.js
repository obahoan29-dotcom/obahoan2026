// =========================================================
// FILE: portal-ui-core.js
// QUẢN LÝ GIAO DIỆN CHÍNH, KHỞI TẠO, MENU DÂN TRÍ & THU GỌN
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

    const padletCat = CHINH_KHOA_CATEGORIES.find(c => c.id === "tu-luan-padlet");
    if (padletCat) padletCat.links = [...DEFAULT_PADLET_LINKS];

    try {
        const rawCachedLinks = safeLocal.getItem("cached_custom_links");
        if (rawCachedLinks) {
            applyCustomLinksToCategories(JSON.parse(rawCachedLinks));
        }
    } catch(e) {}

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

function applyCustomLinksToCategories(customLinksData) {
    if (!customLinksData || typeof customLinksData !== "object") return;

    if (customLinksData["nhac-nho"]) {
        const rLinks = Object.keys(customLinksData["nhac-nho"]).map(k => ({
            id: k, firebaseId: k, ...customLinksData["nhac-nho"][k], categoryId: "nhac-nho", isDoc: true
        })).filter(l => l && l.title && l.title !== "undefined");
        if (rLinks.length > 0) REMINDER_CATEGORY.links = sortLinksNewestFirst(rLinks);
    }

    [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES].forEach(cat => {
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
            try {
                safeLocal.setItem("cached_custom_links", JSON.stringify(customLinksData));
            } catch(e) {}

            applyCustomLinksToCategories(customLinksData);
            refreshAllViews();
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

        if (activeQuizIds.size > 0) {
            let hasConfigUpdates = false;
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
                                    if (qData.allowExportExam !== undefined) l.allowExportExam = qData.allowExportExam;
                                    if (qData.maDe) l.maDe = qData.maDe;
                                    hasConfigUpdates = true;
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
                                    if (cfg.allowExportExam !== undefined) l.allowExportExam = cfg.allowExportExam;
                                    hasConfigUpdates = true;
                                }
                            }
                        });
                    });
                } catch(e) {}
            }));

            if (hasConfigUpdates) {
                refreshAllViews();
            }
        }
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