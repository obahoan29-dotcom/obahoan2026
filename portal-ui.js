// =========================================================
// FILE: portal-ui.js
// QUẢN LÝ GIAO DIỆN CHÍNH, BẢNG MÀU NỐI LIỀN, CARD, BÀI BÁO DÂN TRÍ
// & BỘ MÁY XUẤT ĐỀ THI CHUẨN ĐẸP (PDF & WORD) ĐẦY ĐỦ CÂU HỎI VÀ HÌNH VẼ
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

    // Nạp ngay dữ liệu từ cache cục bộ (nếu có) để Kho tài liệu & đề thi mở ra lập tức trong 0s
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

// =========================================================================
// BỘ ĐIỀU KHIỂN XUẤT ĐỀ THI (PDF & WORD) CHUẨN ĐẸP ĐẦY ĐỦ CÂU HỎI VÀ HÌNH VẼ
// =========================================================================

function toggleExamExportMenu(itemId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const menu = document.getElementById(`export-menu-${itemId}`);
    if (!menu) return;
    const isShown = menu.classList.contains("show");
    
    document.querySelectorAll(".exam-export-menu.show").forEach(m => m.classList.remove("show"));
    document.querySelectorAll(".exam-card.has-active-export").forEach(c => c.classList.remove("has-active-export"));

    if (!isShown) {
        menu.classList.add("show");
        const card = document.getElementById(`card-${itemId}`);
        if (card) card.classList.add("has-active-export");
    }
}

function getEffectiveImageUrlForExport(q, imageMap) {
    if (!q) return "";
    if (!imageMap || typeof imageMap !== 'object') imageMap = {};
    if (q.imageUrl && String(q.imageUrl).trim() !== "") return q.imageUrl.trim();
    if (q.imageKey && imageMap[q.imageKey] && String(imageMap[q.imageKey]).trim() !== "") return imageMap[q.imageKey].trim();
    const possibleKeys = [
        `img_q_${q.id}`, `q${q.id}`, `${q.id}`,
        `dh_p1_c${q.id}`, `hy_p1_c${q.id}`, `pbc_p1_c${q.id}`, `dethem_p3_c${q.id}`
    ];
    for (let k of possibleKeys) {
        if (imageMap[k] && String(imageMap[k]).trim() !== "") {
            return imageMap[k].trim();
        }
    }
    return "";
}

async function fetchFullExamData(quizId) {
    if (!quizId) return null;
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.questions) return data;
        }
    } catch(e) {}
    if (typeof examData !== 'undefined' && examData && examData.questions) {
        return examData;
    }
    return null;
}

async function handleExportExamAction(categoryId, itemId, format, includeKey, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    document.querySelectorAll(".exam-export-menu.show").forEach(m => m.classList.remove("show"));
    document.querySelectorAll(".exam-card.has-active-export").forEach(c => c.classList.remove("has-active-export"));

    let targetItem = null;
    const allCats = [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES, KHO_TAI_LIEU_FOLDER];
    for (const c of allCats) {
        if (c.links) {
            const found = c.links.find(l => (l.firebaseId === itemId || l.id === itemId));
            if (found) { targetItem = found; break; }
        }
    }

    const effectiveQuizId = targetItem ? (extractQuizIdFromItem(targetItem) || targetItem.id || itemId) : itemId;
    const statusToast = (msg) => {
        if (typeof showTimeChangeToast === "function") showTimeChangeToast(msg);
        else alert(msg);
    };

    statusToast("⏳ Đang tải toàn bộ câu hỏi và chuẩn bị xuất đề...");

    try {
        const data = await fetchFullExamData(effectiveQuizId);
        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error("Không thể tải cấu trúc đề thi hoặc đề thi chưa có câu hỏi!");
        }

        const title = data.title || (targetItem ? targetItem.title : "ĐỀ THI TRẮC NGHIỆM");
        const maDe = data.maDe || "101";
        const timeLimit = data.timeLimitMinutes || (targetItem ? targetItem.timeLimitMinutes : 90) || 90;

        if (format === 'pdf') {
            exportExamToPDF(data, title, maDe, timeLimit, includeKey);
        } else if (format === 'word') {
            exportExamToWord(data, title, maDe, timeLimit, includeKey);
        }
    } catch(err) {
        alert("❌ Lỗi xuất đề thi: " + err.message);
    }
}

function cleanLatexForWord(text) {
    if (!text) return "";
    return text.replace(/\$/g, "");
}

function buildExamDocumentHtml(data, examTitle, maDe, timeLimit, includeKey, isForWord = false) {
    const questions = data.questions || [];
    const images = data.images || {};

    const p1List = questions.filter(q => q.type === "multiple_choice");
    const p2List = questions.filter(q => q.type === "true_false");
    const p3List = questions.filter(q => q.type === "short_answer");
    const p4List = questions.filter(q => q.type === "essay" || q.type === "essay_answer");

    let questionGlobalIdx = 1;
    let htmlContent = "";

    // 1. PHẦN I
    if (p1List.length > 0) {
        htmlContent += `
        <div class="part-header-box">
            <b>PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.</b> Thí sinh trả lời từ câu ${questionGlobalIdx} đến câu ${questionGlobalIdx + p1List.length - 1}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
        </div>`;
        p1List.forEach(q => {
            const imgUrl = getEffectiveImageUrlForExport(q, images);
            const imgHtml = imgUrl ? `
                <div class="doc-img-container">
                    <img src="${imgUrl}" class="doc-q-img" alt="Hình minh họa câu ${questionGlobalIdx}">
                </div>` : "";

            const letters = ["A", "B", "C", "D"];
            let maxOptLen = Math.max(...(q.options || []).map(o => String(o).length));
            let optLayoutClass = maxOptLen > 55 ? "opt-grid-1" : (maxOptLen > 24 ? "opt-grid-2" : "opt-grid-4");

            const optsHtml = (q.options || []).map((opt, oIdx) => {
                const L = letters[oIdx];
                const isCorrect = (includeKey && q.correct !== undefined && q.correct === oIdx);
                return `
                <div class="doc-option-item ${isCorrect ? 'correct-highlight' : ''}">
                    <b>${L}.</b> <span>${opt}</span> ${isCorrect ? '<b class="key-mark">✓</b>' : ''}
                </div>`;
            }).join('');

            const explainHtml = (includeKey && q.explanation) ? `
                <div class="doc-explanation-box">
                    💡 <b>Hướng dẫn giải:</b> ${q.explanation}
                </div>` : "";

            htmlContent += `
            <div class="doc-question-card">
                <div class="doc-q-title">
                    <b>Câu ${questionGlobalIdx}.</b> ${q.question}
                </div>
                ${imgHtml}
                <div class="doc-options-wrapper ${optLayoutClass}">
                    ${optsHtml}
                </div>
                ${explainHtml}
            </div>`;
            questionGlobalIdx++;
        });
    }

    // 2. PHẦN II
    if (p2List.length > 0) {
        htmlContent += `
        <div class="part-header-box">
            <b>PHẦN II. Câu trắc nghiệm đúng sai.</b> Thí sinh trả lời từ câu ${questionGlobalIdx} đến câu ${questionGlobalIdx + p2List.length - 1}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
        </div>`;
        p2List.forEach(q => {
            const imgUrl = getEffectiveImageUrlForExport(q, images);
            const imgHtml = imgUrl ? `
                <div class="doc-img-container">
                    <img src="${imgUrl}" class="doc-q-img" alt="Hình minh họa câu ${questionGlobalIdx}">
                </div>` : "";

            let stRowsHtml = (q.statements || []).map(st => {
                let keyStr = "";
                if (includeKey && st.correct !== undefined) {
                    keyStr = st.correct ? `<span class="tf-badge tf-true">ĐÚNG</span>` : `<span class="tf-badge tf-false">SAI</span>`;
                }
                return `
                <div class="doc-statement-row">
                    <span class="st-letter"><b>${st.id})</b></span>
                    <span class="st-content">${st.statement}</span>
                    ${keyStr ? `<span class="st-key-box">${keyStr}</span>` : `<span class="st-blank-box">[&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]</span>`}
                </div>`;
            }).join('');

            const explainHtml = (includeKey && q.explanation) ? `
                <div class="doc-explanation-box">
                    💡 <b>Hướng dẫn giải:</b> ${q.explanation}
                </div>` : "";

            htmlContent += `
            <div class="doc-question-card">
                <div class="doc-q-title">
                    <b>Câu ${questionGlobalIdx}.</b> ${q.question}
                </div>
                ${imgHtml}
                <div class="doc-statements-list">
                    ${stRowsHtml}
                </div>
                ${explainHtml}
            </div>`;
            questionGlobalIdx++;
        });
    }

    // 3. PHẦN III
    if (p3List.length > 0) {
        htmlContent += `
        <div class="part-header-box">
            <b>PHẦN III. Câu trắc nghiệm trả lời ngắn.</b> Thí sinh trả lời từ câu ${questionGlobalIdx} đến câu ${questionGlobalIdx + p3List.length - 1}.
        </div>`;
        p3List.forEach(q => {
            const imgUrl = getEffectiveImageUrlForExport(q, images);
            const imgHtml = imgUrl ? `
                <div class="doc-img-container">
                    <img src="${imgUrl}" class="doc-q-img" alt="Hình minh họa câu ${questionGlobalIdx}">
                </div>` : "";

            const answerBoxHtml = (includeKey && q.correctAnswer !== undefined) 
                ? `<div class="doc-short-answer-line"><b>Đáp số:</b> <span class="correct-short-ans">${q.correctAnswer}</span></div>` 
                : `<div class="doc-short-answer-line"><b>Đáp số:</b> ........................................................................................</div>`;

            const explainHtml = (includeKey && q.explanation) ? `
                <div class="doc-explanation-box">
                    💡 <b>Hướng dẫn giải:</b> ${q.explanation}
                </div>` : "";

            htmlContent += `
            <div class="doc-question-card">
                <div class="doc-q-title">
                    <b>Câu ${questionGlobalIdx}.</b> ${q.question}
                </div>
                ${imgHtml}
                ${answerBoxHtml}
                ${explainHtml}
            </div>`;
            questionGlobalIdx++;
        });
    }

    // 4. PHẦN IV (NẾU CÓ)
    if (p4List.length > 0) {
        htmlContent += `
        <div class="part-header-box">
            <b>PHẦN IV. Tự luận điền kết quả & Trình bày bài làm.</b> Thí sinh trả lời từ câu ${questionGlobalIdx} đến câu ${questionGlobalIdx + p4List.length - 1}.
        </div>`;
        p4List.forEach(q => {
            const imgUrl = getEffectiveImageUrlForExport(q, images);
            const imgHtml = imgUrl ? `
                <div class="doc-img-container">
                    <img src="${imgUrl}" class="doc-q-img" alt="Hình minh họa câu ${questionGlobalIdx}">
                </div>` : "";

            const answerBoxHtml = (includeKey && q.correctAnswer !== undefined) 
                ? `<div class="doc-short-answer-line"><b>Kết quả:</b> <span class="correct-short-ans">${q.correctAnswer}</span></div>` 
                : `<div class="doc-short-answer-line"><b>Kết quả:</b> ........................................................................................</div>`;

            const explainHtml = (includeKey && q.explanation) ? `
                <div class="doc-explanation-box">
                    💡 <b>Lời giải chi tiết:</b> ${q.explanation}
                </div>` : "";

            htmlContent += `
            <div class="doc-question-card">
                <div class="doc-q-title">
                    <b>Câu ${questionGlobalIdx}.</b> ${q.question}
                </div>
                ${imgHtml}
                ${answerBoxHtml}
                ${explainHtml}
            </div>`;
            questionGlobalIdx++;
        });
    }

    // 5. BẢNG TỔNG HỢP ĐÁP ÁN NHANH (NẾU CHỌN KÈM ĐÁP ÁN)
    let summaryKeyTableHtml = "";
    if (includeKey) {
        let cellsP1 = "";
        const letters = ["A", "B", "C", "D"];
        p1List.forEach((q, idx) => {
            const ans = (q.correct !== undefined) ? letters[q.correct] : "--";
            cellsP1 += `<td><b>${idx + 1}</b></td><td>${ans}</td>`;
            if ((idx + 1) % 10 === 0 && (idx + 1) < p1List.length) cellsP1 += `</tr><tr>`;
        });

        summaryKeyTableHtml = `
        <div class="doc-summary-key-section">
            <h3 style="text-align:center; color:#0369a1; margin:16px 0 8px 0; text-transform:uppercase;">
                BẢNG ĐÁP ÁN TỔNG HỢP - MÃ ĐỀ ${maDe}
            </h3>
            ${p1List.length > 0 ? `
            <div style="margin-bottom:12px;">
                <b>Phần I (Trắc nghiệm 4 lựa chọn):</b>
                <table class="doc-key-table">
                    <tr>${cellsP1}</tr>
                </table>
            </div>` : ''}
        </div>`;
    }

    return `
    <div class="exam-doc-page">
        <!-- HEADER ĐỀ THI CHUẨN BỘ GIÁO DỤC -->
        <table class="exam-doc-header-table">
            <tr>
                <td style="width: 48%; text-align: center; vertical-align: top;">
                    <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
                    <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">TRƯỜNG THPT CHUYÊN & CLC</div>
                    <div style="font-size: 10pt; font-style: italic;">(Đề thi gồm có ${questions.length} câu)</div>
                </td>
                <td style="width: 52%; text-align: center; vertical-align: top;">
                    <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">KỲ THI KHẢO SÁT CHẤT LƯỢNG HỌC KỲ</div>
                    <div style="font-size: 11pt; font-weight: bold; color: #b91c1c; text-transform: uppercase;">MÔN: TOÁN HỌC</div>
                    <div style="font-size: 10pt; font-weight: bold;">Thời gian làm bài: ${timeLimit} phút</div>
                </td>
            </tr>
        </table>

        <div class="exam-doc-banner-title">
            <h2>${examTitle}</h2>
            <div class="exam-doc-made-badge">MÃ ĐỀ THI: ${maDe}</div>
        </div>

        <div class="exam-student-info-box">
            <span>Họ và tên thí sinh: ....................................................................................................</span>
            <span style="float: right;">Số báo danh: ............................. Lớp: .................</span>
            <div style="clear: both;"></div>
        </div>

        <!-- NỘI DUNG CÂU HỎI -->
        <div class="exam-questions-content">
            ${htmlContent}
        </div>

        <div style="text-align: center; margin: 24px 0 16px 0; font-weight: bold; font-style: italic;">
            ---------- HẾT ----------
        </div>

        ${summaryKeyTableHtml}
    </div>`;
}

function exportExamToPDF(data, examTitle, maDe, timeLimit, includeKey) {
    const printableHtml = buildExamDocumentHtml(data, examTitle, maDe, timeLimit, includeKey, false);
    const win = window.open("", "_blank");
    if (!win) {
        alert("⚠️ Trình duyệt đã chặn cửa sổ bật lên (Pop-up). Vui lòng cho phép mở pop-up để xuất PDF!");
        return;
    }

    win.document.open();
    win.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>${examTitle} - Mã đề ${maDe}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <script>
            window.MathJax = {
                tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']] },
                svg: { scale: 1.05, fontCache: 'global' }
            };
        </script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
        <style>
            @page {
                size: A4;
                margin: 15mm 15mm 15mm 15mm;
            }
            *, *::before, *::after { box-sizing: border-box; }
            body {
                font-family: 'Be Vietnam Pro', 'Times New Roman', serif;
                font-size: 11pt;
                line-height: 1.45;
                color: #000000;
                background: #ffffff;
                margin: 0;
                padding: 10px;
            }
            .exam-doc-header-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
                border-bottom: 1.5px solid #000;
                padding-bottom: 6px;
            }
            .exam-doc-banner-title {
                text-align: center;
                margin: 8px 0 10px 0;
            }
            .exam-doc-banner-title h2 {
                margin: 0;
                font-size: 13.5pt;
                font-weight: 900;
                text-transform: uppercase;
                color: #000;
            }
            .exam-doc-made-badge {
                display: inline-block;
                border: 1.5px solid #000;
                padding: 2px 10px;
                font-weight: 800;
                font-size: 10.5pt;
                border-radius: 4px;
                margin-top: 4px;
            }
            .exam-student-info-box {
                border: 1px dashed #000;
                padding: 7px 12px;
                border-radius: 6px;
                margin-bottom: 14px;
                font-size: 10.5pt;
            }
            .part-header-box {
                background: #f1f5f9;
                border-left: 4.5px solid #0284c7;
                padding: 6px 10px;
                font-size: 11pt;
                font-weight: 600;
                margin: 14px 0 10px 0;
                page-break-after: avoid;
                break-after: avoid;
            }
            .doc-question-card {
                margin-bottom: 12px;
                page-break-inside: avoid;
                break-inside: avoid;
                text-align: justify;
            }
            .doc-q-title {
                font-size: 11pt;
                line-height: 1.45;
            }
            .doc-img-container {
                text-align: center;
                margin: 8px 0;
                page-break-inside: avoid;
            }
            .doc-q-img {
                max-width: 90%;
                max-height: 250px;
                object-fit: contain;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
            }
            .doc-options-wrapper {
                display: grid;
                gap: 5px 14px;
                margin-top: 6px;
            }
            .opt-grid-4 { grid-template-columns: repeat(4, 1fr); }
            .opt-grid-2 { grid-template-columns: repeat(2, 1fr); }
            .opt-grid-1 { grid-template-columns: 1fr; }
            .doc-option-item {
                font-size: 10.8pt;
                padding: 2px 0;
            }
            .doc-statements-list {
                margin-top: 6px;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .doc-statement-row {
                display: flex;
                align-items: baseline;
                gap: 6px;
                font-size: 10.8pt;
            }
            .st-letter { flex-shrink: 0; min-width: 22px; }
            .st-content { flex: 1; }
            .st-blank-box { flex-shrink: 0; font-family: monospace; color: #475569; }
            .tf-badge {
                font-weight: 800;
                font-size: 9.5pt;
                padding: 1px 7px;
                border-radius: 4px;
                border: 1px solid #000;
            }
            .tf-true { background: #dcfce7; color: #15803d; }
            .tf-false { background: #fee2e2; color: #b91c1c; }
            .correct-highlight {
                color: #15803d;
                font-weight: 700;
            }
            .key-mark { color: #16a34a; font-weight: 900; margin-left: 4px; }
            .doc-short-answer-line {
                margin-top: 6px;
                font-size: 10.8pt;
            }
            .correct-short-ans {
                font-weight: 900;
                color: #15803d;
                background: #dcfce7;
                padding: 1px 8px;
                border-radius: 4px;
            }
            .doc-explanation-box {
                background: #fffbeb;
                border-left: 3.5px solid #f59e0b;
                padding: 6px 10px;
                font-size: 10.2pt;
                margin-top: 6px;
                color: #78350f;
                page-break-inside: avoid;
            }
            .doc-key-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 8px;
                font-size: 10pt;
                text-align: center;
            }
            .doc-key-table td {
                border: 1px solid #000;
                padding: 4px 6px;
            }
            .no-print-bar {
                position: fixed;
                bottom: 12px;
                right: 12px;
                z-index: 999999;
                display: flex;
                gap: 8px;
            }
            .btn-print-now {
                background: linear-gradient(135deg, #0284c7, #0369a1);
                color: #ffffff;
                border: none;
                padding: 10px 18px;
                border-radius: 20px;
                font-size: 13.5px;
                font-weight: 800;
                cursor: pointer;
                box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
            }
            @media print {
                .no-print-bar { display: none !important; }
                body { padding: 0; }
            }
        </style>
    </head>
    <body>
        <div class="no-print-bar">
            <button class="btn-print-now" onclick="window.print()">🖨️ In ra giấy / Lưu PDF (Ctrl + P)</button>
        </div>
        ${printableHtml}
        <script>
            window.addEventListener('load', function() {
                var checkMathJax = setInterval(function() {
                    if (window.MathJax && window.MathJax.typesetPromise) {
                        clearInterval(checkMathJax);
                        window.MathJax.typesetPromise().then(function() {
                            setTimeout(function() { window.print(); }, 800);
                        }).catch(function() {
                            setTimeout(function() { window.print(); }, 800);
                        });
                    }
                }, 200);
                setTimeout(function() { clearInterval(checkMathJax); }, 6000);
            });
        <\/script>
    </body>
    </html>
    `);
    win.document.close();
}

function exportExamToWord(data, examTitle, maDe, timeLimit, includeKey) {
    const wordInnerHtml = buildExamDocumentHtml(data, examTitle, maDe, timeLimit, includeKey, true);

    const wordCompleteHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset='utf-8'>
        <title>${examTitle}</title>
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
            @page Section1 {
                size: 21.0cm 29.7cm;
                margin: 2.0cm 1.5cm 2.0cm 1.5cm;
                mso-header-margin: 1.0cm;
                mso-footer-margin: 1.0cm;
                mso-paper-source: 0;
            }
            div.Section1 { page: Section1; }
            body {
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                line-height: 1.35;
                color: #000000;
            }
            .exam-doc-header-table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
            .exam-doc-header-table td { border: none; padding: 2pt; font-family: 'Times New Roman', serif; }
            .exam-doc-banner-title { text-align: center; margin: 10pt 0; }
            .exam-doc-banner-title h2 { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0; }
            .exam-doc-made-badge { display: inline-block; border: 1pt solid #000; padding: 2pt 8pt; font-weight: bold; font-size: 11pt; margin-top: 4pt; }
            .exam-student-info-box { border: 1pt dashed #000; padding: 6pt 10pt; margin-bottom: 14pt; }
            .part-header-box { background: #e2e8f0; padding: 6pt; font-weight: bold; margin: 12pt 0 8pt 0; }
            .doc-question-card { margin-bottom: 10pt; text-align: justify; }
            .doc-q-title { font-weight: normal; margin-bottom: 4pt; }
            .doc-img-container { text-align: center; margin: 8pt 0; }
            .doc-q-img { max-width: 420px; height: auto; }
            .doc-options-wrapper { margin-top: 4pt; }
            .doc-option-item { margin-bottom: 3pt; }
            .doc-statement-row { margin-bottom: 3pt; }
            .correct-highlight { color: #15803d; font-weight: bold; }
            .doc-explanation-box { background: #fefce8; border-left: 3pt solid #ca8a04; padding: 5pt 8pt; margin-top: 4pt; color: #713f12; font-size: 11pt; }
            .doc-key-table { width: 100%; border-collapse: collapse; text-align: center; margin-top: 8pt; }
            .doc-key-table td { border: 1pt solid #000; padding: 4pt; font-size: 10pt; }
        </style>
    </head>
    <body>
        <div class="Section1">
            ${wordInnerHtml}
        </div>
    </body>
    </html>
    `;

    const blob = new Blob(['\ufeff', wordCompleteHtml], {
        type: 'application/msword;charset=utf-8'
    });

    const safeTitle = (examTitle || "De_Thi").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const fileName = `${safeTitle}_MaDe_${maDe}${includeKey ? '_CoDapAn' : ''}.doc`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

// =========================================================================
// RENDER THẺ BÀI THI & BẢN TIN VỚI NÚT XUẤT ĐỀ VÀ GIAO DIỆN CHUẨN
// =========================================================================

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

    // NÚT XUẤT ĐỀ THI (PDF / WORD) CHO TỪNG ĐỀ THI TRONG MỖI LỚP
    let exportExamBtnHtml = "";
    if (!isDoc) {
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

    let bottomActionButtonsHtml = "";
    if (viewTestBtnHtml || reviewBtnHtml || exportExamBtnHtml) {
        bottomActionButtonsHtml = `
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
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
            event.target.closest('.btn-test-exam-admin') ||
            event.target.closest('.exam-export-dropdown-wrapper')) {
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
