// =========================================================
// FILE: app-main.js
// BỘ MÁY ĐIỀU HÀNH GIAO DIỆN CHÍNH & MỤC NHẮC NHỞ QUAN TRỌNG
// TỐI ƯU HÓA BĂNG THÔNG: Bỏ tải quizzes.json, chỉ fetch exam_configs siêu nhẹ
// =========================================================

const safeLocal = {
    getItem(k) { try { return localStorage.getItem(k); } catch(e) { return null; } },
    setItem(k, v) { try { localStorage.setItem(k, v); } catch(e) {} },
    removeItem(k) { try { localStorage.removeItem(k); } catch(e) {} }
};

const safeSession = {
    getItem(k) { try { return sessionStorage.getItem(k); } catch(e) { return null; } },
    setItem(k, v) { try { sessionStorage.setItem(k, v); } catch(e) {} },
    removeItem(k) { try { localStorage.removeItem(k); } catch(e) {} }
};

let activeDayThemCatId = null;
let activeChinhKhoaRow1CatId = null;
let activeChinhKhoaRow2CatId = null;
let activeDantriCatId = null;

let currentActiveArticleItem = null;
let currentActiveArticleCatId = "nhac-nho";
let currentTargetAvatarItemId = null;
let currentTargetAvatarCatId = "nhac-nho";

const categoryExpandedState = {};

let siteVisitStatsCache = {
    todayCount: 0, yesterdayCount: 0, weekCount: 0, totalCount: 0,
    hourlyCounts: Array(24).fill(0), dailyCounts: []
};

const PRESET_20_AVATARS = [
    "https://i.ibb.co/HTPxzDtT/khung-long-bao-chua.jpg", "https://cdn-icons-png.flaticon.com/512/3755/3755251.png",
    "https://cdn-icons-png.flaticon.com/512/3062/3062279.png", "https://cdn-icons-png.flaticon.com/512/4144/4144683.png",
    "https://cdn-icons-png.flaticon.com/512/4144/4144672.png", "https://cdn-icons-png.flaticon.com/512/2996/2996841.png",
    "https://cdn-icons-png.flaticon.com/512/10061/10061805.png", "https://cdn-icons-png.flaticon.com/512/9308/9308006.png",
    "https://cdn-icons-png.flaticon.com/512/9068/9068641.png", "https://cdn-icons-png.flaticon.com/512/9181/9181285.png",
    "https://cdn-icons-png.flaticon.com/512/3074/3074058.png", "https://cdn-icons-png.flaticon.com/512/4243/4243003.png",
    "https://cdn-icons-png.flaticon.com/512/3135/3135810.png", "https://cdn-icons-png.flaticon.com/512/4144/4144724.png",
    "https://cdn-icons-png.flaticon.com/512/4144/4144773.png", "https://cdn-icons-png.flaticon.com/512/4762/4762295.png",
    "https://cdn-icons-png.flaticon.com/512/6168/6168641.png", "https://cdn-icons-png.flaticon.com/512/3253/3253258.png",
    "https://cdn-icons-png.flaticon.com/512/2275/2275069.png", "https://cdn-icons-png.flaticon.com/512/4006/4006511.png"
];

function toDirectGoogleDriveImageUrl(url) {
    if (!url) return "";
    let cleanUrl = String(url).trim();
    let m = cleanUrl.match(/(?:file\/d\/|id=|open\?id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (m && m[1]) return `https://lh3.googleusercontent.com/d/${m[1]}`;
    return cleanUrl;
}

document.addEventListener("DOMContentLoaded", async function() {
    initBannerAndAvatars();
    if (typeof initTableSettings === "function") initTableSettings();
    if (typeof initAvatarGrid === "function") initAvatarGrid();
    if (typeof checkAdminSessionValidity === "function") checkAdminSessionValidity();

    refreshAllViews();
    await loadDataFromFirebase();
    initSiteVisitTracker();
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

// TỐI ƯU HÓA: BỎ TẢI TOÀN BỘ KHO ĐỀ THI Ở TRANG CHỦ
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
                    id: k, firebaseId: k, ...customLinksData["nhac-nho"][k], categoryId: "nhac-nho"
                }));
                if (rLinks.length > 0) REMINDER_CATEGORY.links = sortLinksNewestFirst(rLinks);
            }

            [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES].forEach(cat => {
                if (customLinksData[cat.id]) {
                    let list = Object.keys(customLinksData[cat.id]).map(k => ({
                        id: k, firebaseId: k, ...customLinksData[cat.id][k], categoryId: cat.id
                    }));
                    cat.links = sortLinksNewestFirst(list);
                } else if (cat.links) {
                    cat.links = sortLinksNewestFirst(cat.links);
                }
            });

            if (customLinksData["kho-tai-lieu"]) {
                let list = Object.keys(customLinksData["kho-tai-lieu"]).map(k => ({
                    id: k, firebaseId: k, ...customLinksData["kho-tai-lieu"][k], categoryId: "kho-tai-lieu"
                }));
                KHO_TAI_LIEU_FOLDER.links = sortLinksNewestFirst(list);
            }
        }

        // CHỈ TẢI THÔNG SỐ CONFIG (GIỜ ĐÓNG MỞ) CỦA CÁC ĐỀ THI ĐANG HIỂN THỊ
        const activeQuizIds = new Set();
        [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES].forEach(cat => {
            if (cat.links) {
                cat.links.forEach(l => {
                    if (!l.isDoc) {
                        const qId = extractQuizIdFromItem(l);
                        if (qId) activeQuizIds.add(qId);
                    }
                });
            }
        });

        // Fetch song song file config cực nhẹ (0.1KB/file) thay vì nguyên đề
        await Promise.all(Array.from(activeQuizIds).map(async (qId) => {
            try {
                const cfgRes = await fetch(`${FIREBASE_DB_URL}/exam_configs/${qId}.json`);
                if (cfgRes.ok) {
                    const cfg = await cfgRes.json();
                    if (cfg) {
                        [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES].forEach(cat => {
                            (cat.links || []).forEach(l => {
                                if (extractQuizIdFromItem(l) === qId) {
                                    if (cfg.timeLimitMinutes) l.timeLimitMinutes = cfg.timeLimitMinutes;
                                    if (cfg.examStartTimeStr) l.examStartTimeStr = cfg.examStartTimeStr;
                                    if (cfg.examEndTimeStr) l.examEndTimeStr = cfg.examEndTimeStr;
                                    if (cfg.allowFree !== undefined) l.allowFree = cfg.allowFree;
                                    if (cfg.resultMode !== undefined) l.resultMode = cfg.resultMode;
                                    if (cfg.allowReviewOriginal !== undefined) l.allowReviewOriginal = cfg.allowReviewOriginal;
                                    if (cfg.showOnlineCount !== undefined) l.showOnlineCount = cfg.showOnlineCount;
                                }
                            });
                        });
                    }
                }
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
    if (activeDantriCatId === catId) activeDantriCatId = null;
    else activeDantriCatId = catId;
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
    let newTitle = prompt("✏️ Nhập tiêu đề mới cho khối Nhắc nhở quan trọng:", REMINDER_SECTION_TITLE);
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

function renderReminderSection() {
    const container = document.getElementById("reminder-container");
    const titleEl = document.getElementById("reminder-section-title-text");
    const editHeadBtn = document.getElementById("btn-edit-reminder-head");

    if (titleEl) titleEl.innerText = REMINDER_SECTION_TITLE || "📌 Nhắc nhở quan trọng";
    if (editHeadBtn) editHeadBtn.style.display = isAdminLoggedIn ? "inline-flex" : "none";

    if (!container) return;
    container.innerHTML = "";

    const links = sortLinksNewestFirst(REMINDER_CATEGORY.links || []);
    renderLinksWithFold(container, links, "nhac-nho", 2);
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

    const firstTwo = sortedLinks.slice(0, visibleLimit);
    firstTwo.forEach(item => {
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
        toggleBtn.style.border = "1.5px dashed #0284c7";
        toggleBtn.style.background = "#f0f9ff";
        toggleBtn.style.color = "#0369a1";
        toggleBtn.style.fontWeight = "800";
        toggleBtn.style.fontSize = "13px";
        toggleBtn.style.cursor = "pointer";
        toggleBtn.style.transition = "all 0.2s ease";

        toggleBtn.innerHTML = isExpanded 
            ? `▲ Thu gọn lại (${remainingCount} mục)` 
            : `▼ Ấn vào đây để xem tiếp ${remainingCount} mục còn lại`;

        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            categoryExpandedState[categoryId] = !categoryExpandedState[categoryId];
            const nowExpanded = categoryExpandedState[categoryId];
            hiddenBox.style.display = nowExpanded ? "flex" : "none";
            toggleBtn.innerHTML = nowExpanded 
                ? `▲ Thu gọn lại (${remainingCount} mục)` 
                : `▼ Ấn vào đây để xem tiếp ${remainingCount} mục còn lại`;
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
        btn.className = "dantri-nav-btn" + (isActive ? " active" : "");
        btn.innerHTML = `<span>${cat.title}</span> <span class="caret-icon">${isActive ? "▲" : "▼"}</span>`;
        btn.onclick = () => {
            activeDayThemCatId = (activeDayThemCatId === cat.id) ? null : cat.id;
            renderDayThemSection();
        };
        bar.appendChild(btn);
    });

    list.innerHTML = "";
    if (!activeDayThemCatId) { panel.classList.remove("show"); return; }

    const activeCat = DAY_THEM_CATEGORIES.find(c => c.id === activeDayThemCatId);
    if (activeCat && activeCat.links && activeCat.links.length > 0) {
        renderLinksWithFold(list, activeCat.links, activeCat.id, 2);
        panel.classList.add("show");
    } else {
        list.innerHTML = `<div class="empty-folder">Chưa có bài kiểm tra nào trong mục này.</div>`;
        panel.classList.add("show");
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
                renderLinksWithFold(row1List, activeCat1.links, activeCat1.id, 2);
                row1Panel.classList.add("show");
            } else {
                row1List.innerHTML = `<div class="empty-folder">Chưa có bài tập cho lớp này.</div>`;
                row1Panel.classList.add("show");
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
                renderLinksWithFold(row2List, activeCat2.links, activeCat2.id, 2);
                row2Panel.classList.add("show");
            } else {
                row2List.innerHTML = `<div class="empty-folder">Chưa có nội dung trong chuyên mục này.</div>`;
                row2Panel.classList.add("show");
            }
        }
    }
}

function renderKhoTaiLieuSection() {
    const container = document.getElementById("kho-tai-lieu-container");
    if (!container) return;

    container.innerHTML = `
        <details class="folder-section" open>
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

// HÀM LẤY NGÀY GIỜ HIỂN THỊ CHUẨN XÁC DƯỚI TIÊU ĐỀ
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

// TEST THỬ ĐỀ CHO ADMIN
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
    window.open(`./thi.html?id=${quizId}&cat=${encodeURIComponent(targetCat)}&sbd=Trying&name=Obahoan29&class=42&autostart=1`, "_blank");
}

function buildCardHtmlString(item, categoryId) {
    const isDoc = item.isDoc;
    const itemId = item.id || item.firebaseId || `item_${Date.now()}`;
    const quizId = extractQuizIdFromItem(item) || itemId;
    const badge = item.badgeText || (item.isHot ? "HOT" : "NONE");
    const avatar = toDirectGoogleDriveImageUrl(item.avatar) || PRESET_20_AVATARS[0];
    const encodedData = encodeURIComponent(JSON.stringify(item));
    const isAllowFree = (item.allowFree !== false);
    const showOnlineCount = (item.showOnlineCount !== false);
    const isReminder = (categoryId === "nhac-nho");
    
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
            <button type="button" class="btn-test-exam-admin" onclick="testExamAsAdmin('${quizId}', '${categoryId}', event)" title="Test thử đề thi ngay lập tức" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: 1px solid #38bdf8; padding: 4px 9px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 4px rgba(2, 132, 199, 0.25); text-decoration: none; transition: 0.15s; white-space: nowrap;" onmouseover="this.style.filter='brightness(1.12)'; this.style.transform='translateY(-1px)';" onmouseout="this.style.filter='none'; this.style.transform='none';">
                🚀 View đề
            </button>
        `;
    }

    let reviewBtnHtml = "";
    if (!isDoc && item.allowReviewOriginal) {
        reviewBtnHtml = `
            <a href="thi.html?id=${quizId}&review=1" target="_blank" onclick="event.stopPropagation()" style="display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:800; color:#059669; background:#ecfdf5; border:1px solid #a7f3d0; padding:4px 8px; border-radius:6px; text-decoration:none; box-shadow:0 1px 3px rgba(5,150,105,0.15); transition: 0.15s; white-space: nowrap;" onmouseover="this.style.background='#d1fae5'" onmouseout="this.style.background='#ecfdf5'">
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

// CÔNG TẮC BẬT TẮT SĨ SỐ PHÒNG THI
async function handleShowOnlineCountToggleChange(categoryId, itemId, quizId, isChecked, event) {
    if (event) event.stopPropagation();
    
    const txt = document.getElementById(`online-status-txt-${itemId}`);
    if (txt) {
        txt.innerText = isChecked ? 'HIỆN' : 'ẨN';
        txt.className = `free-toggle-status ${isChecked ? 'st-on' : 'st-off'}`;
        txt.style.color = isChecked ? '#0284c7' : '';
    }
    
    const slider = document.querySelector(`#online-toggle-${itemId} ~ .slider-toggle`);
    if (slider) {
        slider.style.backgroundColor = isChecked ? '#0284c7' : '#cbd5e1';
    }

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

// =========================================================
// QUẢN LÝ AVATAR: 20 AVATAR MẪU, ĐỔI CỠ VÀ TẢI TỪ MÁY TÍNH
// =========================================================

function openItemAvatarPicker(itemId, event) {
    if (!isAdminLoggedIn) return;
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const targetPop = document.getElementById(`avatar-popover-${itemId}`);
    const isAlreadyOpen = targetPop && targetPop.classList.contains("show");

    document.querySelectorAll(".avatar-selection-popover.show").forEach(p => p.classList.remove("show"));
    document.querySelectorAll(".exam-card.has-active-popover").forEach(c => c.classList.remove("has-active-popover"));

    if (targetPop && !isAlreadyOpen) {
        targetPop.classList.add("show");
        const card = document.getElementById(`card-${itemId}`);
        if (card) card.classList.add("has-active-popover");
    }
}

function closeAvatarPopover(itemId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const pop = document.getElementById(`avatar-popover-${itemId}`);
    if (pop) pop.classList.remove("show");
    const card = document.getElementById(`card-${itemId}`);
    if (card) card.classList.remove("has-active-popover");
}

async function selectItemAvatar(categoryId, itemId, avatarUrl, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    closeAvatarPopover(itemId, event);

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar: avatarUrl })
        });
        window.location.reload();
    } catch(e) { alert("❌ Lỗi khi đổi avatar: " + e.message); }
}

async function changeAvatarSize(categoryId, itemId, sizePx, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarSize: sizePx })
        });
        window.location.reload();
    } catch(e) { alert("❌ Lỗi khi đổi cỡ avatar: " + e.message); }
}

function triggerItemAvatarUploadPC(categoryId, itemId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    currentTargetAvatarItemId = itemId;
    currentTargetAvatarCatId = categoryId;
    const fileInput = document.getElementById("reminder-custom-avatar-input");
    if (fileInput) { fileInput.value = ""; fileInput.click(); }
}

async function handleReminderCustomAvatarUploaded(fileInput) {
    if (!fileInput.files || fileInput.files.length === 0 || !currentTargetAvatarItemId) return;
    const file = fileInput.files[0];
    const itemId = currentTargetAvatarItemId;
    const categoryId = currentTargetAvatarCatId || "nhac-nho";

    if (!GOOGLE_DRIVE_UPLOAD_GAS_URL || GOOGLE_DRIVE_UPLOAD_GAS_URL.includes("DÁN_URL")) {
        alert("⚠️ Bạn chưa cấu hình GOOGLE_DRIVE_UPLOAD_GAS_URL trong app-config.js!");
        return;
    }

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
                const directImgUrl = toDirectGoogleDriveImageUrl(result.fileUrl);
                await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar: directImgUrl })
                });
                alert("🎉 Đã tải ảnh avatar từ máy tính lên Google Drive và cập nhật thành công!");
                window.location.reload();
            } else { throw new Error(result.message || "Lỗi tải ảnh lên Google Drive!"); }
        } catch(err) { alert("❌ Lỗi upload ảnh avatar: " + err.message); }
    };
    reader.readAsDataURL(file);
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

    const payload = {
        title: titleVal, articleTitle: titleVal, author: authorVal, articleTime: timeVal,
        date: cardDateStr, timestamp: currentActiveArticleItem.timestamp || Date.now(),
        sapo: sapoVal, articleImg: directImgVal, articleImgCaption: captionVal, articleBody: bodyVal
    };

    try {
        const itemId = currentActiveArticleItem.id || currentActiveArticleItem.firebaseId;
        await fetch(`${FIREBASE_DB_URL}/custom_links/${currentActiveArticleCatId}/${itemId}.json`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        Object.assign(currentActiveArticleItem, payload);
        alert("🎉 Đã lưu bài viết theo phong cách báo Dân trí thành công!");
        window.location.reload();
    } catch(e) {
        alert("❌ Lỗi khi lưu bài viết: " + e.message);
        btn.disabled = false; btn.innerText = "💾 Lưu bài viết lên hệ thống";
    }
}

// ==========================================
// MODAL ĐĂNG NHẬP LÀM BÀI CHO HỌC SINH
// ==========================================
function openStudentLoginModal(item, categoryId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const targetCatId = categoryId || item.categoryId || "them-11";
    activeStudentLogin.targetUrl = item.url || "";
    activeStudentLogin.examTitle = item.title || "Bài kiểm tra";
    activeStudentLogin.categoryId = targetCatId;
    activeStudentLogin.currentMode = "class";
    activeStudentLogin.item = item;

    const modal = document.getElementById("student-login-modal");
    const nameEl = document.getElementById("st-modal-exam-name");
    const timeBox = document.getElementById("st-modal-time-box");
    const errBox = document.getElementById("st-login-error");
    const mainTitleEl = document.getElementById("st-modal-main-title");

    const catName = getCategoryDisplayName(targetCatId);
    if (mainTitleEl) mainTitleEl.innerText = `Đăng Nhập Làm Bài Thi: ${catName}`;
    if (nameEl) nameEl.innerText = item.title;
    if (errBox) { errBox.style.display = "none"; errBox.innerText = ""; }

    if (timeBox) { timeBox.innerHTML = buildTimeBoxHtml(item.timeLimitMinutes, item.examStartTimeStr, item.examEndTimeStr, item.date || getItemDisplayDate(item)); }

    const userIn = document.getElementById("st-username-input");
    const passIn = document.getElementById("st-password-input");
    const fNameIn = document.getElementById("st-free-name-input");
    const fClassIn = document.getElementById("st-free-class-input");
    const fSbdIn = document.getElementById("st-free-sbd-input");

    if (userIn) userIn.value = "";
    if (passIn) { passIn.value = ""; passIn.type = "password"; }
    if (fNameIn) fNameIn.value = "";
    if (fClassIn) fClassIn.value = "";
    if (fSbdIn) fSbdIn.value = "";

    const eyeBtn = document.getElementById("st-eye-btn");
    if (eyeBtn) eyeBtn.innerText = "👁️";

    safeLocal.removeItem("saved_student_sbd");
    safeLocal.removeItem("saved_student_name");
    safeLocal.removeItem("saved_student_class");
    safeLocal.removeItem("current_exam_student");

    const allowFree = (item.allowFree !== false);
    const tabFree = document.getElementById("tab-st-free");
    if (tabFree) {
        if (!allowFree) {
            tabFree.disabled = true; tabFree.classList.add("disabled"); tabFree.title = "Đề thi này chỉ dành cho học sinh trong danh sách lớp";
        } else {
            tabFree.disabled = false; tabFree.classList.remove("disabled"); tabFree.title = "";
        }
    }

    switchStudentLoginMode("class");
    if (modal) modal.style.display = "flex";
}

function closeStudentLoginModal() {
    const modal = document.getElementById("student-login-modal");
    if (modal) modal.style.display = "none";
    const errBox = document.getElementById("st-login-error");
    if (errBox) { errBox.style.display = "none"; errBox.innerText = ""; }
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
        if (activeStudentLogin.item && activeStudentLogin.item.allowFree === false) { alert("⛔ Đề thi này không cho phép thí sinh tự do tham gia!"); return; }
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
    if (passIn.type === "password") { passIn.type = "text"; if (eyeBtn) eyeBtn.innerText = "🙈"; } 
    else { passIn.type = "password"; if (eyeBtn) eyeBtn.innerText = "👁️"; }
}

function submitStudentLogin() {
    const errBox = document.getElementById("st-login-error");
    const showErr = (msg) => {
        if (errBox) { errBox.innerText = msg; errBox.style.display = "block"; } else { alert(msg); }
    };

    let targetUrl = activeStudentLogin.targetUrl;
    if (!targetUrl) { showErr("❌ Không tìm thấy đường dẫn đề thi!"); return; }

    let finalSbd = ""; let finalName = ""; let finalClass = "";
    const activeCat = activeStudentLogin.categoryId || "them-11";

    if (activeStudentLogin.currentMode === "class") {
        const usernameVal = (document.getElementById("st-username-input").value || "").trim();
        const passVal = (document.getElementById("st-password-input").value || "").trim();

        if (!usernameVal || !passVal) { showErr("⚠️ Vui lòng nhập đầy đủ Tên đăng nhập (hoặc SBD) và Mật khẩu!"); return; }

        const accounts = getAccountsForCategory(activeCat);
        const normUser = normalizeName(usernameVal);
        const matched = accounts.find(acc => {
            const accSbd = String(acc.sbd || "").trim().toLowerCase();
            const accUser = normalizeName(acc.username);
            const accName = normalizeName(acc.name);
            const passOk = String(acc.pass || "").trim() === passVal;
            const isUserMatch = (accSbd === usernameVal.toLowerCase()) || (normUser && (accUser === normUser || accName === normUser));
            return isUserMatch && passOk;
        });

        if (!matched) { showErr("❌ Tên đăng nhập hoặc mật khẩu không chính xác cho lớp này!"); return; }
        finalSbd = matched.sbd; finalName = matched.name || matched.username; finalClass = matched.className || "Lớp học";
    } else {
        if (activeStudentLogin.item && activeStudentLogin.item.allowFree === false) { showErr("⛔ Giáo viên đã tắt chế độ thi tự do đối với đề thi này!"); return; }
        finalName = (document.getElementById("st-free-name-input").value || "").trim();
        finalClass = (document.getElementById("st-free-class-input").value || "").trim();
        finalSbd = (document.getElementById("st-free-sbd-input").value || "").trim();
        if (!finalName || !finalClass || !finalSbd) { showErr("⚠️ Vui lòng nhập đầy đủ Họ tên, Lớp và SBD tự do!"); return; }
    }

    safeLocal.removeItem("last_submission_cleared"); safeLocal.removeItem("saved_student_sbd");
    safeLocal.removeItem("saved_student_name"); safeLocal.removeItem("saved_student_class");
    safeLocal.setItem("current_exam_student", JSON.stringify({ sbd: finalSbd, name: finalName, className: finalClass, categoryId: activeCat }));

    try {
        let u = new URL(targetUrl, window.location.href);
        u.searchParams.set("cat", activeCat); u.searchParams.set("sbd", finalSbd); u.searchParams.set("name", finalName);
        u.searchParams.set("class", finalClass); u.searchParams.set("autostart", "1"); window.location.href = u.toString();
    } catch (e) {
        window.location.href = `${targetUrl}&cat=${encodeURIComponent(activeCat)}&sbd=${encodeURIComponent(finalSbd)}&name=${encodeURIComponent(finalName)}&class=${encodeURIComponent(finalClass)}&autostart=1`;
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

// =========================================================
// THỐNG KÊ LƯỢT TRUY CẬP WEBSITE
// =========================================================

function getVNDateKey(d = new Date()) {
    const tzOffset = 7 * 60; const localTime = d.getTime(); const localOffset = d.getTimezoneOffset() * 60000;
    const vnTime = new Date(localTime + localOffset + (tzOffset * 60000));
    const pad = n => String(n).padStart(2, '0');
    return `${vnTime.getFullYear()}-${pad(vnTime.getMonth() + 1)}-${pad(vnTime.getDate())}`;
}

function getVNHour(d = new Date()) {
    const tzOffset = 7 * 60; const localTime = d.getTime(); const localOffset = d.getTimezoneOffset() * 60000;
    const vnTime = new Date(localTime + localOffset + (tzOffset * 60000));
    return vnTime.getHours();
}

function formatVNDateDisplay(dateStr) {
    if (!dateStr) return ""; let parts = String(dateStr).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`; return dateStr;
}

function getDayOfWeekVN(dateStr) {
    if (!dateStr) return "Ngày"; const d = new Date(dateStr + "T00:00:00+07:00"); const day = d.getDay();
    const names = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    return names[day] || "Ngày";
}

async function initSiteVisitTracker() {
    const todayKey = getVNDateKey(); const currentHour = getVNHour();
    const sessionKey = `site_visit_logged_${todayKey}`;
    const isLoggedThisSession = safeSession.getItem(sessionKey);
    if (!isLoggedThisSession) { safeSession.setItem(sessionKey, "true"); await recordSiteVisit(todayKey, currentHour); }
    await fetchAndRenderVisitStats(true);
}

async function recordSiteVisit(todayKey, hour) {
    try {
        const hourStr = String(hour).padStart(2, '0');
        const dayRes = await fetch(`${FIREBASE_DB_URL}/site_visits/days/${todayKey}.json`).catch(() => null);
        let dayData = (dayRes && dayRes.ok) ? await dayRes.json() : null;
        if (!dayData || typeof dayData !== 'object') { dayData = { total: 0, hours: {} }; }
        if (!dayData.hours) dayData.hours = {};
        dayData.total = (parseInt(dayData.total, 10) || 0) + 1;
        dayData.hours[hourStr] = (parseInt(dayData.hours[hourStr], 10) || 0) + 1;
        const sumRes = await fetch(`${FIREBASE_DB_URL}/site_visits/summary/allTimeTotal.json`).catch(() => null);
        let allTime = (sumRes && sumRes.ok) ? await sumRes.json() : 0;
        allTime = (parseInt(allTime, 10) || 0) + 1;
        await Promise.all([
            fetch(`${FIREBASE_DB_URL}/site_visits/days/${todayKey}.json`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dayData) }).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/site_visits/summary.json`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ allTimeTotal: allTime, lastUpdated: Date.now() }) }).catch(() => null)
        ]);
    } catch(e) { console.warn("Lỗi ghi nhận lượt truy cập:", e); }
}

async function fetchAndRenderVisitStats(isSilent = false) {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/site_visits.json`);
        const data = (res && res.ok) ? await res.json() : null;
        const todayKey = getVNDateKey(); const yesterdayObj = new Date(Date.now() - 24 * 3600 * 1000); const yesterdayKey = getVNDateKey(yesterdayObj);
        let todayCount = 0; let yesterdayCount = 0; let weekCount = 0; let allTimeTotal = 0;
        let hourlyCounts = Array(24).fill(0); let dailyCounts = [];

        if (data && typeof data === 'object') {
            const daysObj = data.days || {};
            if (daysObj[todayKey]) {
                todayCount = parseInt(daysObj[todayKey].total, 10) || 0;
                if (daysObj[todayKey].hours) { for (let h = 0; h < 24; h++) { const hStr = String(h).padStart(2, '0'); hourlyCounts[h] = parseInt(daysObj[todayKey].hours[hStr], 10) || 0; } }
            }
            if (daysObj[yesterdayKey]) { yesterdayCount = parseInt(daysObj[yesterdayKey].total, 10) || 0; }
            for (let i = 6; i >= 0; i--) {
                const targetD = new Date(Date.now() - i * 24 * 3600 * 1000); const dKey = getVNDateKey(targetD);
                const count = daysObj[dKey] ? (parseInt(daysObj[dKey].total, 10) || 0) : 0;
                weekCount += count;
                dailyCounts.push({ dateKey: dKey, isToday: (i === 0), dayLabel: (i === 0) ? "Hôm nay" : getDayOfWeekVN(dKey), dateDisplay: formatVNDateDisplay(dKey), count: count });
            }
            allTimeTotal = (data.summary && data.summary.allTimeTotal) ? parseInt(data.summary.allTimeTotal, 10) : weekCount;
        }
        if (allTimeTotal < weekCount) allTimeTotal = weekCount;
        siteVisitStatsCache = { todayCount, yesterdayCount, weekCount, totalCount: allTimeTotal, hourlyCounts, dailyCounts };

        const badgeNumber = document.getElementById("visit-today-count"); if (badgeNumber) badgeNumber.innerText = todayCount.toLocaleString("vi-VN");
        const kpiToday = document.getElementById("kpi-visit-today"); const kpiYest = document.getElementById("kpi-visit-yesterday"); const kpiWeek = document.getElementById("kpi-visit-7days"); const kpiTotal = document.getElementById("kpi-visit-alltime");
        if (kpiToday) kpiToday.innerText = todayCount.toLocaleString("vi-VN");
        if (kpiYest) kpiYest.innerText = yesterdayCount.toLocaleString("vi-VN");
        if (kpiWeek) kpiWeek.innerText = weekCount.toLocaleString("vi-VN");
        if (kpiTotal) kpiTotal.innerText = allTimeTotal.toLocaleString("vi-VN");

        const currentHour = getVNHour(); const curBadge = document.getElementById("current-hour-badge");
        if (curBadge) curBadge.innerText = `Hiện tại: ${currentHour}:00 - ${currentHour}:59`;
        renderHourlyBars(hourlyCounts, currentHour); renderWeeklyBars(dailyCounts);
    } catch(e) { if (!isSilent) console.warn("Lỗi nạp thống kê lượt truy cập:", e); }
}

function renderHourlyBars(hourlyCounts, currentHour) {
    const container = document.getElementById("hourly-bars-container"); if (!container) return; container.innerHTML = "";
    const maxVal = Math.max(1, ...hourlyCounts);
    hourlyCounts.forEach((cnt, hour) => {
        const isCur = (hour === currentHour); const percent = Math.max(4, Math.round((cnt / maxVal) * 100));
        const col = document.createElement("div"); col.className = `hourly-bar-col ${isCur ? 'is-current' : ''}`; col.title = `Khung giờ ${hour}:00 - ${hour}:59: ${cnt} lượt truy cập`;
        col.innerHTML = `<div class="hourly-bar-val">${cnt > 0 ? cnt : ''}</div><div class="hourly-bar-track"><div class="hourly-bar-fill" style="height: ${percent}%;"></div></div><div class="hourly-bar-hour">${hour}h</div>`;
        container.appendChild(col);
    });
    setTimeout(() => { const curEl = container.querySelector(".hourly-bar-col.is-current"); if (curEl) curEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }, 150);
}

function renderWeeklyBars(dailyList) {
    const container = document.getElementById("weekly-bars-container"); if (!container) return; container.innerHTML = "";
    const maxVal = Math.max(1, ...dailyList.map(d => d.count));
    dailyList.forEach(item => {
        const percent = Math.max(3, Math.round((item.count / maxVal) * 100));
        const row = document.createElement("div"); row.className = `weekly-row-item ${item.isToday ? 'is-today' : ''}`;
        row.innerHTML = `<div class="weekly-row-day ${item.isToday ? 'is-today' : ''}">${item.dayLabel} <span style="font-size:10.5px; opacity:0.8;">(${item.dateDisplay})</span></div><div class="weekly-row-bar-wrap"><div class="weekly-row-bar-fill" style="width: ${percent}%;"></div></div><div class="weekly-row-count">${item.count} lượt</div>`;
        container.appendChild(row);
    });
}

function toggleVisitStatsModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const modal = document.getElementById("visit-stats-modal"); if (!modal) return;
    if (modal.style.display === "flex") { modal.style.display = "none"; } else { modal.style.display = "flex"; fetchAndRenderVisitStats(false); }
}

function closeVisitStatsModal(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById("visit-stats-modal"); if (modal) modal.style.display = "none";
}

function switchVisitStatsTab(tabName) {
    const btnHours = document.getElementById("tab-btn-hours"); const btnWeek = document.getElementById("tab-btn-week");
    const viewHours = document.getElementById("visit-tab-content-hours"); const viewWeek = document.getElementById("visit-tab-content-week");
    if (tabName === 'hours') {
        if (btnHours) btnHours.classList.add("active"); if (btnWeek) btnWeek.classList.remove("active");
        if (viewHours) viewHours.style.display = "block"; if (viewWeek) viewWeek.style.display = "none";
    } else {
        if (btnHours) btnHours.classList.remove("active"); if (btnWeek) btnWeek.classList.add("active");
        if (viewHours) viewHours.style.display = "none"; if (viewWeek) viewWeek.style.display = "block";
    }
}

async function refreshVisitStatsData() {
    const btn = document.querySelector(".btn-refresh-visits");
    if (btn) { btn.innerText = "⏳ Đang tải..."; btn.disabled = true; }
    await fetchAndRenderVisitStats(false);
    if (btn) { btn.innerText = "🔄 Cập nhật"; btn.disabled = false; }
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
