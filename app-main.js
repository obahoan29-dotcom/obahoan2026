// =========================================================
// FILE: app-main.js
// BỘ MÁY ĐIỀU HÀNH GIAO DIỆN CHÍNH: NẠP BANNER, HIỂN THỊ DANH MỤC,
// NẠP DỮ LIỆU FIREBASE, RENDER THẺ ĐỀ THI & ĐĂNG NHẬP HỌC SINH
// ĐÃ CẬP NHẬT:
// 1. BÀI ĐĂNG MỚI NHẤT LUÔN ĐỨNG Ở DÒNG ĐẦU TIÊN CỦA MỖI LỚP
// 2. MẶC ĐỊNH MỌI LỚP KHI MỞ TRANG ĐỀU CO LẠI, BẤM VÀO MỚI XÒE RA
// 3. GIỮ NGUYÊN HIỂN THỊ THỜI GIAN & KHUNG GIỜ LÀM BÀI TRỰC QUAN
// =========================================================

// Mặc định ban đầu để null: TẤT CẢ CÁC LỚP ĐỀU Ở TRẠNG THÁI CO LẠI
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

    // Render bộ khung giao diện ban đầu (mọi lớp đều co lại)
    refreshAllViews();

    // Đồng bộ dữ liệu mới nhất từ Firebase
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

// HÀM SẮP XẾP: ĐẢM BẢO BÀI ĐĂNG MỚI NHẤT LUÔN Ở VỊ TRÍ ĐẦU TIÊN
function sortLinksNewestFirst(linksArray) {
    if (!Array.isArray(linksArray)) return [];
    return linksArray.sort((a, b) => {
        let tA = a.timestamp || parseDateString(a.date) || 0;
        let tB = b.timestamp || parseDateString(b.date) || 0;
        if (tB !== tA) return tB - tA; // Lớn hơn (mới hơn) lên trước
        return (a.title || "").localeCompare(b.title || "");
    });
}

// Đồng bộ danh sách liên kết từ Firebase Realtime Database
async function loadDataFromFirebase() {
    try {
        const [linksRes, quizzesRes] = await Promise.all([
            fetch(`${FIREBASE_DB_URL}/custom_links.json`).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/quizzes.json`).catch(() => null)
        ]);

        let customLinksData = linksRes && linksRes.ok ? await linksRes.json() : null;
        let quizzesData = quizzesRes && quizzesRes.ok ? await quizzesRes.json() : null;

        if (customLinksData && typeof customLinksData === "object") {
            // Cập nhật Nhắc nhở
            if (customLinksData["nhac-nho"]) {
                const rLinks = Object.keys(customLinksData["nhac-nho"]).map(k => ({
                    id: k,
                    firebaseId: k,
                    ...customLinksData["nhac-nho"][k]
                }));
                if (rLinks.length > 0) REMINDER_CATEGORY.links = sortLinksNewestFirst(rLinks);
            }

            // Cập nhật Dạy thêm (sắp xếp mới nhất lên đầu)
            DAY_THEM_CATEGORIES.forEach(cat => {
                if (customLinksData[cat.id]) {
                    let list = Object.keys(customLinksData[cat.id]).map(k => ({
                        id: k,
                        firebaseId: k,
                        categoryId: cat.id,
                        ...customLinksData[cat.id][k]
                    }));
                    cat.links = sortLinksNewestFirst(list);
                } else if (cat.links) {
                    cat.links = sortLinksNewestFirst(cat.links);
                }
            });

            // Cập nhật Chính khóa (sắp xếp mới nhất lên đầu)
            CHINH_KHOA_CATEGORIES.forEach(cat => {
                if (customLinksData[cat.id]) {
                    let list = Object.keys(customLinksData[cat.id]).map(k => ({
                        id: k,
                        firebaseId: k,
                        categoryId: cat.id,
                        ...customLinksData[cat.id][k]
                    }));
                    cat.links = sortLinksNewestFirst(list);
                } else if (cat.links) {
                    cat.links = sortLinksNewestFirst(cat.links);
                }
            });

            // Cập nhật Kho tài liệu
            if (customLinksData["kho-tai-lieu"]) {
                let list = Object.keys(customLinksData["kho-tai-lieu"]).map(k => ({
                    id: k,
                    firebaseId: k,
                    categoryId: "kho-tai-lieu",
                    ...customLinksData["kho-tai-lieu"][k]
                }));
                KHO_TAI_LIEU_FOLDER.links = sortLinksNewestFirst(list);
            } else if (KHO_TAI_LIEU_FOLDER.links) {
                KHO_TAI_LIEU_FOLDER.links = sortLinksNewestFirst(KHO_TAI_LIEU_FOLDER.links);
            }
        }

        // Đồng bộ thời gian thi thực tế từ quizzes
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

// Cập nhật lại toàn bộ giao diện trang chủ
function refreshAllViews() {
    renderDantriNav();
    renderReminderSection();
    renderDayThemSection();
    renderChinhKhoaSection();
    renderKhoTaiLieuSection();
    renderNewsSection();

    // Cập nhật icon bánh răng admin
    const gear = document.getElementById("gear-btn");
    if (gear) {
        if (isAdminLoggedIn) gear.classList.add("active-gear");
        else gear.classList.remove("active-gear");
    }
}

// ==========================================
// RENDER THANH MENU DÂN TRÍ / THỜI SỰ
// ==========================================
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
    if (activeDantriCatId === catId) {
        activeDantriCatId = null;
    } else {
        activeDantriCatId = catId;
    }
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

// ==========================================
// RENDER KHỐI NHẮC NHỞ QUAN TRỌNG
// ==========================================
function renderReminderSection() {
    const container = document.getElementById("reminder-container");
    if (!container) return;
    container.innerHTML = "";

    const links = sortLinksNewestFirst(REMINDER_CATEGORY.links || []);
    links.forEach(item => {
        container.appendChild(createItemCardElement(item, "nhac-nho"));
    });
}

// ==========================================
// RENDER CÁC LỚP DẠY THÊM (MẶC ĐỊNH CO LẠI)
// ==========================================
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
            if (activeDayThemCatId === cat.id) {
                // Đang mở -> Bấm lại thì thu lại
                activeDayThemCatId = null;
            } else {
                // Bấm mở lớp tương ứng
                activeDayThemCatId = cat.id;
            }
            renderDayThemSection();
        };
        bar.appendChild(btn);
    });

    list.innerHTML = "";

    if (!activeDayThemCatId) {
        // Mặc định co lại
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

// ==========================================
// RENDER CÁC LỚP CHÍNH KHÓA (MẶC ĐỊNH CO LẠI)
// ==========================================
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
                if (activeChinhKhoaRow1CatId === cat.id) {
                    activeChinhKhoaRow1CatId = null;
                } else {
                    activeChinhKhoaRow1CatId = cat.id;
                }
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
                if (activeChinhKhoaRow2CatId === cat.id) {
                    activeChinhKhoaRow2CatId = null;
                } else {
                    activeChinhKhoaRow2CatId = cat.id;
                }
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
                row2List.innerHTML = `<div class="empty-folder">Chưa có nội dung trong chuyên mục này.</div>`;
                row2Panel.classList.add("show");
            }
        }
    }
}

// ==========================================
// RENDER KHO TÀI LIỆU
// ==========================================
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

// ==========================================
// RENDER BẢNG TIN & DẶN DÒ TỪ THẦY GIÁO
// ==========================================
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

// ==========================================
// HÀM TẠO CARD ĐỀ THI / TÀI LIỆU (DOM & HTML)
// ==========================================
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

    // Khung giờ và thời lượng làm bài để lộ ra trực quan y như ảnh giao diện
    let timeBoxHtml = "";
    if (!isDoc && (categoryId.includes("them") || categoryId.includes("lop") || categoryId.includes("hsg"))) {
        timeBoxHtml = `
            <div class="st-modal-time-box" style="margin: 6px 0 0 0; padding: 6px 10px; font-size: 11.5px; text-align: left;">
                ${buildTimeBoxHtml(item.timeLimitMinutes, item.examStartTimeStr, item.examEndTimeStr, item.date)}
            </div>
        `;
    }

    // Giao diện khi QUẢN TRỊ VIÊN ĐĂNG NHẬP
    if (isAdminLoggedIn) {
        return `
        <div class="exam-card admin-card-mode" id="card-${itemId}">
            <div class="admin-card-top-row">
                <div class="left-admin-actions-col">
                    ${!isDoc ? `
                        <div class="free-student-toggle-wrap" onclick="toggleAllowFreeExam('${categoryId}', '${itemId}', event)" title="Bật/Tắt chế độ thí sinh tự do">
                            <span class="free-toggle-lbl">Tự do:</span>
                            <label class="mini-switch" onclick="event.stopPropagation()">
                                <input type="checkbox" id="free-toggle-${itemId}" ${isAllowFree ? "checked" : ""} onchange="toggleAllowFreeExam('${categoryId}', '${itemId}', event)">
                                <span class="slider-toggle"></span>
                            </label>
                            <span class="free-toggle-status ${isAllowFree ? 'st-on' : 'st-off'}" id="free-status-txt-${itemId}">
                                ${isAllowFree ? 'BẬT' : 'TẮT'}
                            </span>
                        </div>

                        <button type="button" class="btn-view-results-left" onclick="openExamResultModal(${JSON.stringify(item).replace(/"/g, '&quot;')}, event)" title="Xem bảng điểm và nhật ký thi">
                            📊 Kết quả
                        </button>

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

    // Giao diện khi HỌC SINH XEM BÌNH THƯỜNG
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

// Xử lý khi bấm vào thẻ bài kiểm tra / tài liệu
function handleCardClick(categoryId, itemId, isDoc, rawUrl, stringifiedData, event) {
    if (event) {
        if (event.target.closest('.mini-switch') || event.target.closest('.admin-link-tools') || event.target.closest('.badge-wrapper')) {
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
    activeStudentLogin.categoryId = categoryId || "them-11";
    activeStudentLogin.currentMode = "class";
    activeStudentLogin.item = item;

    const modal = document.getElementById("student-login-modal");
    const nameEl = document.getElementById("st-modal-exam-name");
    const timeBox = document.getElementById("st-modal-time-box");
    const errBox = document.getElementById("st-login-error");

    if (nameEl) nameEl.innerText = item.title;
    if (errBox) { errBox.style.display = "none"; errBox.innerText = ""; }

    if (timeBox) {
        timeBox.innerHTML = buildTimeBoxHtml(item.timeLimitMinutes, item.examStartTimeStr, item.examEndTimeStr, item.date);
    }

    const savedSbd = localStorage.getItem("saved_student_sbd") || "";
    const savedName = localStorage.getItem("saved_student_name") || "";
    const savedClass = localStorage.getItem("saved_student_class") || "";

    const userIn = document.getElementById("st-username-input");
    const passIn = document.getElementById("st-password-input");
    if (userIn) userIn.value = savedSbd || savedName;
    if (passIn) passIn.value = "";

    const fNameIn = document.getElementById("st-free-name-input");
    const fClassIn = document.getElementById("st-free-class-input");
    const fSbdIn = document.getElementById("st-free-sbd-input");
    if (fNameIn) fNameIn.value = savedName;
    if (fClassIn) fClassIn.value = savedClass;
    if (fSbdIn) fSbdIn.value = savedSbd;

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

function submitStudentLogin() {
    const errBox = document.getElementById("st-login-error");
    const showErr = (msg) => {
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

    if (activeStudentLogin.currentMode === "class") {
        const usernameVal = (document.getElementById("st-username-input").value || "").trim();
        const passVal = (document.getElementById("st-password-input").value || "").trim();

        if (!usernameVal || !passVal) {
            showErr("⚠️ Vui lòng nhập đầy đủ Tên đăng nhập (hoặc SBD) và Mật khẩu!");
            return;
        }

        const accounts = getAccountsForCategory(activeStudentLogin.categoryId);
        const normUser = normalizeName(usernameVal);
        const matched = accounts.find(acc => {
            const accSbd = String(acc.sbd || "").trim().toLowerCase();
            const accUser = normalizeName(acc.username);
            const accName = normalizeName(acc.name);
            const passOk = String(acc.pass || "").trim() === passVal;

            const isUserMatch = (accSbd === usernameVal.toLowerCase()) || (normUser && (accUser === normUser || accName === normUser));
            return isUserMatch && passOk;
        });

        if (!matched) {
            showErr("❌ Tên đăng nhập hoặc mật khẩu không chính xác cho lớp này!");
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

    try {
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

// ==========================================
// THAO TÁC BADGE NHANH CHO ADMIN
// ==========================================
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