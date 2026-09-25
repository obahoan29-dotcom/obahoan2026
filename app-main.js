// ==========================================
// CẤU HÌNH HỆ THỐNG VÀ DỮ LIỆU TĨNH
// ==========================================
const ADMIN_PASSWORD = "Hopan130384";
const FIREBASE_DB_URL = "https://hethongthitracnghiem-518c5-default-rtdb.asia-southeast1.firebasedatabase.app";

let isAdminLoggedIn = false;
let selectedAvatarUrl = "";
let currentMoveData = { oldCategory: null, quizId: null, quizData: null };
let currentCopyData = { sourceCategory: null, itemId: null, itemData: null };

let activeStudentLogin = {
    targetUrl: "",
    examTitle: "",
    categoryId: "them-11",
    currentMode: "class"
};

// Cấu hình cài đặt Trung Thu mặc định
let midAutumnConfig = {
    enabled: true,
    scale: 1.0,
    opacity: 0.88
};

const PRESET_AVATARS = [
    "https://i.ibb.co/HTPxzDtT/khung-long-bao-chua.jpg", "https://cdn-icons-png.flaticon.com/512/3755/3755251.png",
    "https://cdn-icons-png.flaticon.com/512/3062/3062279.png", "https://cdn-icons-png.flaticon.com/512/4144/4144683.png",
    "https://cdn-icons-png.flaticon.com/512/4144/4144672.png", "https://cdn-icons-png.flaticon.com/512/2996/2996841.png",
    "https://cdn-icons-png.flaticon.com/512/10061/10061805.png", "https://cdn-icons-png.flaticon.com/512/9308/9308006.png",
    "https://cdn-icons-png.flaticon.com/512/9068/9068641.png", "https://cdn-icons-png.flaticon.com/512/9181/9181285.png",
    "https://cdn-icons-png.flaticon.com/512/3074/3074058.png", "https://cdn-icons-png.flaticon.com/512/4243/4243003.png",
    "https://cdn-icons-png.flaticon.com/512/3135/3135810.png", "https://cdn-icons-png.flaticon.com/512/4144/4144724.png",
    "https://cdn-icons-png.flaticon.com/512/4144/4144773.png", "https://cdn-icons-png.flaticon.com/512/4762/4762295.png",
    "https://cdn-icons-png.flaticon.com/512/6168/6168641.png", "https://cdn-icons-png.flaticon.com/512/3253/3253258.png",
    "https://cdn-icons-png.flaticon.com/512/2275/2275069.png", "https://cdn-icons-png.flaticon.com/512/4006/4006511.png",
    "https://cdn-icons-png.flaticon.com/512/3358/3358327.png", "https://cdn-icons-png.flaticon.com/512/10061/10061732.png",
    "https://cdn-icons-png.flaticon.com/512/4539/4539472.png", "https://cdn-icons-png.flaticon.com/512/3081/3081371.png",
    "https://cdn-icons-png.flaticon.com/512/864/864685.png", "https://cdn-icons-png.flaticon.com/512/3143/3143657.png",
    "https://cdn-icons-png.flaticon.com/512/2072/2072138.png", "https://cdn-icons-png.flaticon.com/512/4207/4207253.png",
    "https://cdn-icons-png.flaticon.com/512/1048/1048953.png", "https://cdn-icons-png.flaticon.com/512/3135/3135768.png"
];

const TOP_BANNER_URL = "https://files.catbox.moe/cf5o9u.jpg"; 
const WEB_AVATAR_URL = "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150";
const BOTTOM_BANNER_URL = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1000";

const DANTRI_NAV_CATEGORIES = [
    { id: "vui-vui", title: "🤣 Vui<br>vui", subTitle: "🎉 Thư giãn & Bản tin vui vẻ học đường", news: [ { tag: "GIẢI TRÍ", title: "Góc thư giãn: Những câu nói bất hủ của học sinh trong giờ kiểm tra Toán", date: "22/08/2026 - 10:00", url: "https://dantri.com.vn" }, { tag: "CƯỜI MẮT", title: "Chuyện lạ lớp học: Khi thầy giáo ra đề toán bằng thơ lục bát cực chất", date: "21/08/2026 - 18:20", url: "https://dantri.com.vn" }, { tag: "MEME MATH", title: "Tổng hợp Meme Toán học giúp xả stress cực hiệu quả cho các sĩ tử 2026", date: "20/08/2026 - 15:30", url: "https://dantri.com.vn" } ] },
    { id: "thoi-su", title: "🔴 Thời<br>sự", subTitle: "📢 Thời sự & Sự kiện giáo dục nổi bật", news: [ { tag: "MỚI NHẤT", title: "Bộ GD&ĐT ban hành hướng dẫn cấu trúc đề thi Tốt nghiệp THPT 2026", date: "22/08/2026 - 08:30", url: "https://dantri.com.vn" }, { tag: "THỜI SỰ", title: "Lịch kiểm tra đánh giá năng lực định kỳ học kỳ 1 trên toàn tỉnh", date: "21/08/2026 - 14:15", url: "https://dantri.com.vn" }, { tag: "SỰ KIỆN", title: "Tăng cường ứng dụng công nghệ thông tin và AI trong tự học Toán", date: "20/08/2026 - 10:00", url: "https://dantri.com.vn" } ] },
    { id: "giao-duc", title: "🏫 Giáo<br>đục", subTitle: "📚 Bản tin giáo dục & Trường học", news: [ { tag: "TIÊU ĐIỂM", title: "Phụ huynh chuẩn bị SGK và tài liệu ôn thi đầu năm học", date: "22/08/2026 - 07:45", url: "https://dantri.com.vn/giao-duc.htm" } ] },
    { id: "the-thao", title: "⚽ Thể<br>thao", subTitle: "🏆 Thể thao trong nước & Quốc tế", news: [ { tag: "BÓNG ĐÁ", title: "Tổng hợp các giải thể thao học sinh, sinh viên toàn quốc", date: "22/08/2026 - 10:15", url: "https://dantri.com.vn/the-thao.htm" } ] },
    { id: "me-xe", title: "🚗 Mê<br>xe", subTitle: "🚘 Thế giới xe & Công nghệ bốn bánh", news: [ { tag: "ĐÁNH GIÁ", title: "Phân tích các dòng xe gia đình 5 chỗ", date: "22/08/2026 - 08:20", url: "https://dantri.com.vn/o-to-xe-may.htm" } ] },
    { id: "the-gioi", title: "🌍 Thế<br>giới", subTitle: "🌐 Tin thế giới - Quân sự - Phân tích", news: [ { tag: "QUÂN SỰ", title: "Cập nhật diễn biến thời sự quốc tế", date: "22/08/2026 - 09:10", url: "https://dantri.com.vn/the-thao.htm" } ] },
    { id: "suc-khoe", title: "🩺 Sức<br>khỏe", subTitle: "💊 Bản tin sức khỏe", news: [ { tag: "TƯ VẤN", title: "Bí quyết giữ gìn sức khỏe mùa thi", date: "22/08/2026 - 09:00", url: "https://dantri.com.vn/suc-khoe.htm" } ] },
    { id: "du-lich", title: "✈️ Du<br>lịch", subTitle: "🏔️ Khám phá & Trải nghiệm du lịch", news: [ { tag: "KHÁM PHÁ", title: "Gợi ý các điểm du lịch ngoại khóa", date: "22/08/2026 - 08:00", url: "https://dantri.com.vn/du-lich.htm" } ] }
];

let REMINDER_CATEGORY = {
    id: "nhac-nho",
    links: [
        { 
            id: "rem_1", firebaseId: "rem_1", categoryId: "nhac-nho",
            title: "Lưu ý quan trọng: Các em nộp tự luận Padlet phải đúng mẫu, ví dụ 11A25 ĐẠT, ở phần Subject ghi rõ 11a25-220926-đạt", 
            date: "05/08/2026 - 15:00", url: "#", badgeText: "HOT", isDoc: true, 
            avatar: "https://cdn-icons-png.flaticon.com/512/3602/3602145.png" 
        }
    ]
};

let DAY_THEM_CATEGORIES = [
    { id: "them-10", title: "📐 Thêm 10", links: [ { id: "them10_1", firebaseId: "them10_1", categoryId: "them-10", title: "ĐỀ SỐ 20 - TOÁN 10: BẤT PHƯƠNG TRÌNH VÀ HỆ BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN", date: "23/09/2026 - 02:58", url: "https://so18toan10chuong1taphop150926.vercel.app/", badgeText: "HOT", isDoc: false, avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135768.png" } ] },
    { id: "them-11", title: "✍️ Thêm 11", links: [ { id: "them11_1", firebaseId: "them11_1", categoryId: "them-11", title: "ĐỀ 150 - TOÁN 14: BẤT PHƯƠNG TRÌNH VÀ HỆ BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN", date: "23/09/2026 - 03:00", url: "https://so98toan11c1luonggiac160926.vercel.app/", badgeText: "HOT", isDoc: false, avatar: "https://cdn-icons-png.flaticon.com/512/3062/3062279.png" } ] },
    { id: "them-12", title: "🎓 Thêm 12", links: [ { id: "them12_1", firebaseId: "them12_1", categoryId: "them-12", title: "so170toan12onthihk1180926", date: "18/09/2026 - 17:00", url: "https://so170toan12onthihk1180926.vercel.app/", badgeText: "HOT", isDoc: false, avatar: "https://i.ibb.co/HTPxzDtT/khung-long-bao-chua.jpg" } ] }
];

let CHINH_KHOA_CATEGORIES = [
    { id: "lop-11a", title: "🏫 Lớp 11A", row: 1, links: [ { id: "lop11a_1", firebaseId: "lop11a_1", categoryId: "lop-11a", title: "1 https://so158b-030826-toan12-ktrahk1", date: "05/08/2026 - 23:24", url: "https://so158b-030826-toan12-ktrahk1.vercel.app/", badgeText: "HOT", isDoc: false, avatar: "https://files.catbox.moe/ge1of8.png" } ] },
    { id: "lop-11c", title: "🏫 Lớp 11C", row: 1, links: [] },
    { id: "lop-10p", title: "🏫 Lớp 10P", row: 1, links: [] },
    { 
        id: "hsg-toan-11", title: "🏆 HSG Toán 11", isGold: true, row: 2, visibleCount: 2, 
        links: [
            { id: "hsg11_1", firebaseId: "hsg11_1", categoryId: "hsg-toan-11", title: "Chuyên đề Bồi dưỡng HSG Toán 11 - Bài toán 01", date: "20/09/2026 - 08:30", url: "https://hethongthitracnghiem-518c5.web.app/", badgeText: "HOT", isDoc: true, avatar: "https://cdn-icons-png.flaticon.com/512/3358/3358327.png" }
        ] 
    },
    { 
        id: "tu-luan-padlet", title: "💜 Nộp tự luận Padlet", isPurple: true, row: 2, visibleCount: 5, 
        links: [ 
            { id: "padlet_1", firebaseId: "padlet_1", categoryId: "tu-luan-padlet", title: "11A chụp tự luận Padlet", date: "16/09/2026 - 10:00", url: "https://padlet.com/obahoan29/11a-nop-tu-luan-padlet-160926-s023me0a6si1mqhqpnb4", badgeText: "HOT", isDoc: false, avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png" },
            { id: "padlet_2", firebaseId: "padlet_2", categoryId: "tu-luan-padlet", title: "11C chụp tự luận Padlet", date: "16/09/2026 - 10:00", url: "https://padlet.com/obahoan29/11c-nop-tu-luan-padlet-160926-s023me1v17byc9z8qj13", badgeText: "HOT", isDoc: false, avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png" },
            { id: "padlet_3", firebaseId: "padlet_3", categoryId: "tu-luan-padlet", title: "10P chụp tự luận Padlet", date: "05/09/2026 - 08:00", url: "https://padlet.com/obahoan29/10p-nop-tu-luan-tu-05-09-2026-s023mdx0qopg0az79ix0", badgeText: "HOT", isDoc: false, avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png" }
        ] 
    }
];

const KHO_TAI_LIEU_FOLDER = { 
    id: "kho-tai-lieu", 
    folderName: "Kho tài liệu PDF, Word, Ảnh...", 
    folderAvatar: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png", 
    links: [ { id: "doc_1", firebaseId: "doc_1", categoryId: "kho-tai-lieu", title: "so 140-de-cuoi-hoc-ky-2-toan-11.pdf", date: "06/08/2026 - 02:30", url: "https://drive.google.com/", badgeText: "NONE", isDoc: true, avatar: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200" } ] 
};

const NEWS_DATA = [
    { title: "Lịch kiểm tra định kỳ môn Toán tuần tới các em chú ý ôn tập kỹ.", date: "04/08/2026 - 08:00", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300", url: "#" },
    { title: "Xem đáp án và điểm bài kiểm tra của em", date: "03/08/2026 - 12:00", image: "https://files.catbox.moe/jum4by.png", url: "#" }
];

// =========================================================
// HỆ THỐNG CẤU HÌNH & ĐIỀU KHIỂN TRANG TRÍ TẾT TRUNG THU
// =========================================================

function applyMidAutumnStyles() {
    const leftEl = document.getElementById("mid-autumn-left-badge");
    const rightEl = document.getElementById("mid-autumn-right-badge");

    document.documentElement.style.setProperty("--midautumn-scale", midAutumnConfig.scale);
    document.documentElement.style.setProperty("--midautumn-opacity", midAutumnConfig.opacity);

    const isVisible = midAutumnConfig.enabled !== false;

    if (leftEl) {
        if (!leftEl.dataset.dismissed) {
            leftEl.style.display = isVisible ? "flex" : "none";
        }
    }
    if (rightEl) {
        if (!rightEl.dataset.dismissed) {
            rightEl.style.display = isVisible ? "flex" : "none";
        }
    }

    // Cập nhật giao diện điều khiển trong bánh răng nếu đang mở
    const toggleEl = document.getElementById("admin-midautumn-toggle");
    const sliderSize = document.getElementById("slider-midautumn-size");
    const sliderOpacity = document.getElementById("slider-midautumn-opacity");
    const lblSize = document.getElementById("lbl-midautumn-size");
    const lblOpacity = document.getElementById("lbl-midautumn-opacity");

    if (toggleEl) toggleEl.checked = isVisible;
    if (sliderSize) sliderSize.value = Math.round(midAutumnConfig.scale * 100);
    if (sliderOpacity) sliderOpacity.value = Math.round(midAutumnConfig.opacity * 100);
    if (lblSize) lblSize.innerText = Math.round(midAutumnConfig.scale * 100) + "%";

    if (lblOpacity) {
        let opVal = Math.round(midAutumnConfig.opacity * 100);
        let note = "Đậm nét";
        if (opVal <= 40) note = "Rất trong";
        else if (opVal <= 70) note = "Khá trong";
        else if (opVal <= 90) note = "Hơi trong";
        lblOpacity.innerText = `${opVal}% (${note})`;
    }
}

async function initMidAutumnSettings() {
    try {
        const saved = localStorage.getItem("mid_autumn_settings");
        if (saved) {
            midAutumnConfig = { ...midAutumnConfig, ...JSON.parse(saved) };
        }
    } catch(e) {}

    applyMidAutumnStyles();

    try {
        const res = await fetch(`${FIREBASE_DB_URL}/system_settings/mid_autumn.json`);
        const fbData = await res.json();
        if (fbData && typeof fbData === 'object') {
            midAutumnConfig = { ...midAutumnConfig, ...fbData };
            localStorage.setItem("mid_autumn_settings", JSON.stringify(midAutumnConfig));
            applyMidAutumnStyles();
        }
    } catch(e) {}
}

async function saveMidAutumnConfig() {
    try {
        localStorage.setItem("mid_autumn_settings", JSON.stringify(midAutumnConfig));
    } catch(e) {}

    if (isAdminLoggedIn) {
        try {
            await fetch(`${FIREBASE_DB_URL}/system_settings/mid_autumn.json`, {
                method: 'PUT',
                body: JSON.stringify(midAutumnConfig)
            });
        } catch(e) {}
    }
}

function toggleMidAutumnDecor(isChecked) {
    midAutumnConfig.enabled = isChecked;
    const leftEl = document.getElementById("mid-autumn-left-badge");
    const rightEl = document.getElementById("mid-autumn-right-badge");
    if (leftEl) delete leftEl.dataset.dismissed;
    if (rightEl) delete rightEl.dataset.dismissed;

    applyMidAutumnStyles();
    saveMidAutumnConfig();
}

function changeMidAutumnSize(val) {
    const scale = parseInt(val, 10) / 100;
    midAutumnConfig.scale = scale;
    applyMidAutumnStyles();
    saveMidAutumnConfig();
}

function changeMidAutumnOpacity(val) {
    const opacity = parseInt(val, 10) / 100;
    midAutumnConfig.opacity = opacity;
    applyMidAutumnStyles();
    saveMidAutumnConfig();
}

function dismissMidAutumnBadge(side, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const targetId = side === 'left' ? 'mid-autumn-left-badge' : 'mid-autumn-right-badge';
    const el = document.getElementById(targetId);
    if (el) {
        el.style.transition = 'all 0.25s ease';
        el.style.opacity = '0';
        el.style.transform = (side === 'left' ? 'translateX(-30px)' : 'translateX(30px)') + ' scale(0.7)';
        setTimeout(() => {
            el.style.display = 'none';
            el.dataset.dismissed = 'true';
        }, 250);
    }
}

// =========================================================
// QUẢN TRỊ VIÊN, ĐĂNG ĐỀ, TÀI LIỆU, BADGES & LOGIN HỌC SINH
// =========================================================
function initAvatarGrid() {
    const grid = document.getElementById("avatar-grid");
    if (!grid) return;
    grid.innerHTML = "";
    selectedAvatarUrl = PRESET_AVATARS[0];
    PRESET_AVATARS.forEach((url, index) => {
        let img = document.createElement("img");
        img.src = url;
        img.className = "avatar-option " + (index === 0 ? "selected" : "");
        img.onclick = () => {
            document.querySelectorAll(".avatar-option").forEach(el => el.classList.remove("selected"));
            img.classList.add("selected");
            selectedAvatarUrl = url;
        };
        grid.appendChild(img);
    });
}

function togglePasswordVisibility() {
    const input = document.getElementById("admin-pass-input");
    const btn = document.getElementById("eye-toggle-btn");
    if (input.type === "password") {
        input.type = "text";
        btn.innerText = "🙈"; btn.title = "Ẩn";
    } else {
        input.type = "password";
        btn.innerText = "👁️"; btn.title = "Hiện";
    }
}

function toggleAdminPanel(e) {
    if (e) e.stopPropagation();
    const authContainer = document.getElementById("auth-container");
    const panel = document.getElementById("admin-popover-panel");
    const gear = document.getElementById("gear-btn");

    if (checkAdminSessionValidity()) {
        if (panel.classList.contains("show")) { closeAdminPanel(); } 
        else { 
            applyMidAutumnStyles();
            panel.classList.add("show"); 
            gear.classList.add("active-gear"); 
        }
    } else {
        authContainer.classList.toggle("show");
        if (authContainer.classList.contains("show")) document.getElementById("admin-pass-input").focus();
    }
}

function handleEnter(e) { if (e.key === 'Enter') checkAdminPassword(); }

function parseExpiryDurationMs(val) {
    switch (val) {
        case '1h': return 1 * 60 * 60 * 1000;
        case '2h': return 2 * 60 * 60 * 1000;
        case '4h': return 4 * 60 * 60 * 1000;
        case '8h': return 8 * 60 * 60 * 1000;
        case '1d': return 24 * 60 * 60 * 1000;
        case '3d': return 3 * 24 * 60 * 60 * 1000;
        case '7d': return 7 * 24 * 60 * 60 * 1000;
        case '30d': return 30 * 24 * 60 * 60 * 1000;
        default: return 24 * 60 * 60 * 1000;
    }
}

function checkAdminSessionValidity() {
    try {
        const logged = localStorage.getItem("adminLoggedInSession");
        const expiresAt = localStorage.getItem("admin_expires_at");
        if (logged === "true" && expiresAt) {
            const expTime = parseInt(expiresAt, 10);
            if (Date.now() < expTime) {
                isAdminLoggedIn = true;
                return true;
            } else {
                logoutAdmin();
            }
        }
    } catch(e) {}
    isAdminLoggedIn = false;
    return false;
}

function checkAdminPassword() {
    const pass = document.getElementById("admin-pass-input").value;
    if (pass === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;

        const durationVal = document.getElementById("admin-expiry-select") ? document.getElementById("admin-expiry-select").value : "1d";
        const durationMs = parseExpiryDurationMs(durationVal);
        const expiresAt = Date.now() + durationMs;

        try {
            localStorage.setItem("adminLoggedInSession", "true");
            localStorage.setItem("admin_expires_at", String(expiresAt));
            localStorage.setItem("admin_duration_choice", durationVal);
            sessionStorage.setItem("adminLoggedInSession", "true");
        } catch(e) {}

        document.getElementById("auth-container").classList.remove("show");
        applyMidAutumnStyles();
        document.getElementById("admin-popover-panel").classList.add("show");
        document.getElementById("gear-btn").classList.add("active-gear");
        document.getElementById("admin-pass-input").value = "";
        refreshAllViews();
    } else {
        alert("❌ Sai mật khẩu!");
    }
}

function logoutAdmin(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    isAdminLoggedIn = false;
    try {
        localStorage.removeItem("adminLoggedInSession");
        localStorage.removeItem("admin_expires_at");
        sessionStorage.removeItem("adminLoggedInSession");
    } catch(e) {}
    closeAdminPanel();
    const gear = document.getElementById("gear-btn");
    if (gear) gear.classList.remove("active-gear");
    refreshAllViews();
    alert("🔒 Đã khóa quyền quản trị thành công!");
}

function closeAdminPanel() {
    const panel = document.getElementById("admin-popover-panel");
    const gear = document.getElementById("gear-btn");
    if (panel) panel.classList.remove("show");
    if (gear && !isAdminLoggedIn) gear.classList.remove("active-gear");
}

function refreshAllViews() {
    renderReminderSection();
    renderDayThemNavBar();
    renderChinhKhoaNavBar();
    renderKhoTaiLieu();
}

function switchAdminTab(tabName) {
    document.getElementById("tab-btn-quiz").classList.remove("active");
    document.getElementById("tab-btn-doc").classList.remove("active");
    document.getElementById("admin-tab-quiz").style.display = "none";
    document.getElementById("admin-tab-doc").style.display = "none";

    if(tabName === 'quiz') {
        document.getElementById("tab-btn-quiz").classList.add("active");
        document.getElementById("admin-tab-quiz").style.display = "block";
    } else {
        document.getElementById("tab-btn-doc").classList.add("active");
        document.getElementById("admin-tab-doc").style.display = "block";
    }
}

async function loadDynamicLinksFromFirebase() {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/custom_links.json`);
        const data = await res.json();
        if (!data) return;

        for (const categoryId in data) {
            const linksObj = data[categoryId];
            let targetCategory = DAY_THEM_CATEGORIES.find(c => c.id === categoryId) || 
                                 CHINH_KHOA_CATEGORIES.find(c => c.id === categoryId) ||
                                 (KHO_TAI_LIEU_FOLDER.id === categoryId ? KHO_TAI_LIEU_FOLDER : null) ||
                                 (REMINDER_CATEGORY.id === categoryId ? REMINDER_CATEGORY : null);
            
            if (targetCategory) {
                let items = [];
                for (const linkId in linksObj) {
                    let item = linksObj[linkId];
                    item.firebaseId = linkId;
                    item.categoryId = categoryId;
                    if (!item.timestamp) item.timestamp = parseDateString(item.date); 
                    items.push(item);
                }
                
                targetCategory.links.forEach(link => {
                    if (!link.timestamp) link.timestamp = parseDateString(link.date);
                    link.categoryId = categoryId;
                    if (!link.firebaseId) link.firebaseId = link.id;
                });

                let existingIds = new Set(items.map(i => i.firebaseId));
                let uniqueStatic = targetCategory.links.filter(l => !existingIds.has(l.firebaseId));
                let allLinks = items.concat(uniqueStatic);

                allLinks.sort((a, b) => {
                    if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
                    return (a.title || "").localeCompare(b.title || "");
                });
                
                targetCategory.links = allLinks;
            }
        }
    } catch (e) { console.error("Lỗi tải link Firebase", e); }
}

function processUpload() {
    const fileInput = document.getElementById("admin-file-upload");
    const category = document.getElementById("admin-category-select").value;
    const btn = document.getElementById("btn-create-quiz");

    if (fileInput.files.length === 0) { alert("Vui lòng chọn file questions.js!"); return; }

    const file = fileInput.files[0];
    const reader = new FileReader();
    btn.innerText = "⏳ Đang xử lý..."; btn.disabled = true;

    reader.onload = async function(e) {
        let content = e.target.result;
        content = content.replace(/(const|let|var)\s+examData\s*=\s*/, '').trim();
        if (content.endsWith(';')) content = content.slice(0, -1);

        try {
            const parsedData = new Function("return " + content)();
            if (!parsedData.title || !parsedData.questions) throw new Error("File không đúng cấu trúc.");

            parsedData.isShuffled = true;
            const quizId = "quiz_" + Date.now();
            await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, { method: 'PUT', body: JSON.stringify(parsedData) });

            const now = new Date();
            const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
            
            const linkData = { 
                title: parsedData.title, 
                date: dateStr, 
                url: `./thi.html?id=${quizId}&cat=${encodeURIComponent(category)}`, 
                badgeText: "HOT", 
                isHot: true, 
                isDoc: false, 
                avatar: selectedAvatarUrl, 
                timestamp: Date.now(), 
                isShuffled: true,
                categoryId: category 
            };

            await fetch(`${FIREBASE_DB_URL}/custom_links/${category}/${quizId}.json`, { method: 'PUT', body: JSON.stringify(linkData) });

            alert("✨ Tạo đề thi thành công!");
            window.location.reload(); 
        } catch (err) { alert("❌ Lỗi: " + err.message); } 
        finally { btn.innerText = "✨ Đăng đề thi"; btn.disabled = false; }
    };
    reader.readAsText(file);
}

async function processAddDocument() {
    const titleInput = document.getElementById("admin-doc-title").value.trim();
    const urlInput = document.getElementById("admin-doc-url").value.trim();
    const category = document.getElementById("admin-category-select").value;
    const btn = document.getElementById("btn-create-doc");

    if (!titleInput || !urlInput) { alert("⚠️ Vui lòng nhập đủ tên tài liệu và đường link!"); return; }

    btn.innerText = "⏳ Đang đăng..."; btn.disabled = true;

    try {
        const docId = "doc_" + Date.now();
        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        
        const linkData = { 
            title: titleInput, date: dateStr, url: urlInput, 
            badgeText: "NONE", isHot: false, isDoc: true, 
            avatar: selectedAvatarUrl, timestamp: Date.now(),
            categoryId: category
        };

        await fetch(`${FIREBASE_DB_URL}/custom_links/${category}/${docId}.json`, { method: 'PUT', body: JSON.stringify(linkData) });
        alert("📤 Đăng tài liệu thành công!");
        window.location.reload(); 
    } catch (err) { alert("❌ Lỗi: " + err.message); } 
    finally { btn.innerText = "📤 Đăng tài liệu"; btn.disabled = false; }
}

async function deleteItem(categoryId, itemId, event) {
    event.preventDefault(); event.stopPropagation();
    if(!confirm("⚠️ Bạn có chắc chắn muốn XÓA vĩnh viễn mục này không?")) return;
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'DELETE' });
        if(itemId.startsWith('quiz_')) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'DELETE' });
        }
        window.location.reload();
    } catch(e) { alert("Lỗi khi xóa!"); }
}

async function renameItem(categoryId, itemId, isDoc, currentTitle, event) {
    event.preventDefault(); event.stopPropagation();
    let newTitle = prompt("✏️ Nhập tên mới:", currentTitle);
    if (newTitle !== null && newTitle.trim() !== "" && newTitle.trim() !== currentTitle) {
        try {
            await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ title: newTitle.trim() }) });
            if (!isDoc && itemId.startsWith('quiz_')) {
                await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ title: newTitle.trim() }) });
            }
            window.location.reload();
        } catch(e) { alert("Lỗi khi sửa tên!"); }
    }
}

async function moveItemOrder(categoryId, currentId, direction, event) {
    event.preventDefault(); event.stopPropagation();
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}.json`);
        const data = await res.json();
        if(!data) return;

        let arr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        arr.forEach(item => { if(!item.timestamp) item.timestamp = parseDateString(item.date); });
        
        arr.sort((a, b) => {
            if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
            return (a.title || "").localeCompare(b.title || "");
        });

        const currentIndex = arr.findIndex(item => item.id === currentId);
        if (currentIndex === -1) return;

        let targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex >= 0 && targetIndex < arr.length) {
            let currentItem = arr[currentIndex];
            let targetItem = arr[targetIndex];
            
            let tCurrent = currentItem.timestamp;
            let tTarget = targetItem.timestamp;

            if (tCurrent === tTarget) {
                tTarget = tCurrent + (direction === 'up' ? 10 : -10);
            }

            await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${currentItem.id}.json`, { 
                method: 'PATCH', body: JSON.stringify({ timestamp: tTarget }) 
            });
            await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${targetItem.id}.json`, { 
                method: 'PATCH', body: JSON.stringify({ timestamp: tCurrent }) 
            });
            
            window.location.reload();
        } else {
            alert(direction === 'up' ? "Mục này đã ở trên cùng!" : "Mục này đã ở dưới cùng!");
        }
    } catch(e) { alert("Lỗi khi đổi thứ tự!"); }
}

function openMoveModal(oldCategory, quizId, stringifiedData, event) {
    event.preventDefault(); event.stopPropagation();
    currentMoveData = { oldCategory, quizId, quizData: JSON.parse(decodeURIComponent(stringifiedData)) };
    document.getElementById("move-category-select").value = oldCategory;
    document.getElementById("move-modal").style.display = "flex";
}
function closeMoveModal() { document.getElementById("move-modal").style.display = "none"; }

async function confirmMoveQuiz() {
    const newCategory = document.getElementById("move-category-select").value;
    if(newCategory === currentMoveData.oldCategory) { alert("Đã nằm ở mục này rồi!"); return; }
    try {
        let itemUrl = currentMoveData.quizData.url || "";
        try {
            if (itemUrl.includes("thi.html")) {
                let u = new URL(itemUrl, window.location.href);
                u.searchParams.set("cat", newCategory);
                itemUrl = u.pathname + u.search + u.hash;
            }
        } catch(e) {}

        let updatedData = { ...currentMoveData.quizData, categoryId: newCategory, url: itemUrl };
        await fetch(`${FIREBASE_DB_URL}/custom_links/${newCategory}/${currentMoveData.quizId}.json`, { method: 'PUT', body: JSON.stringify(updatedData) });
        await fetch(`${FIREBASE_DB_URL}/custom_links/${currentMoveData.oldCategory}/${currentMoveData.quizId}.json`, { method: 'DELETE' });
        window.location.reload();
    } catch(e) { alert("Lỗi khi chuyển!"); }
}

function openCopyModal(sourceCategory, itemId, stringifiedData, event) {
    event.preventDefault(); event.stopPropagation();
    currentCopyData = { sourceCategory, itemId, itemData: JSON.parse(decodeURIComponent(stringifiedData)) };
    document.getElementById("copy-category-select").value = sourceCategory;
    document.getElementById("copy-modal").style.display = "flex";
}
function closeCopyModal() { document.getElementById("copy-modal").style.display = "none"; }

async function confirmCopyItem() {
    const destCategory = document.getElementById("copy-category-select").value;
    try {
        const newItemId = (currentCopyData.itemData.isDoc ? "doc_" : "quiz_") + Date.now();
        let itemUrl = currentCopyData.itemData.url || "";
        try {
            if (itemUrl.includes("thi.html")) {
                let u = new URL(itemUrl, window.location.href);
                u.searchParams.set("cat", destCategory);
                itemUrl = u.pathname + u.search + u.hash;
            }
        } catch(e) {}

        const copyData = { 
            ...currentCopyData.itemData, 
            categoryId: destCategory, 
            url: itemUrl,
            timestamp: Date.now() 
        }; 
        await fetch(`${FIREBASE_DB_URL}/custom_links/${destCategory}/${newItemId}.json`, { 
            method: 'PUT', body: JSON.stringify(copyData) 
        });
        alert("📋 Đã sao chép sang mục mới thành công!");
        window.location.reload();
    } catch(e) { alert("Lỗi khi sao chép!"); }
}

// =========================================================
// LOGIC ĐĂNG NHẬP THI HỌC SINH THEO TỪNG LỚP
// =========================================================
function switchStudentLoginMode(mode) {
    activeStudentLogin.currentMode = mode;
    const tabClass = document.getElementById("tab-st-class");
    const tabFree = document.getElementById("tab-st-free");
    const boxClass = document.getElementById("st-login-mode-class");
    const boxFree = document.getElementById("st-login-mode-free");
    const errBox = document.getElementById("st-login-error");
    const iconEl = document.getElementById("st-modal-icon");

    errBox.style.display = "none";
    errBox.innerText = "";

    if (mode === 'free') {
        tabClass.classList.remove("active");
        tabFree.classList.add("active");
        boxClass.style.display = "none";
        boxFree.style.display = "block";
        iconEl.innerText = "🎯";
        document.getElementById("st-modal-main-title").innerText = `Thí Sinh Tự Do Vào Thi - ${getCategoryDisplayName(activeStudentLogin.categoryId)}`;
        setTimeout(() => { document.getElementById("st-free-name-input").focus(); }, 100);
    } else {
        tabFree.classList.remove("active");
        tabClass.classList.add("active");
        boxFree.style.display = "none";
        boxClass.style.display = "block";
        iconEl.innerText = "🔐";
        
        const cTitle = getCategoryDisplayName(activeStudentLogin.categoryId);
        document.getElementById("st-modal-main-title").innerText = `Đăng Nhập Làm Bài - ${cTitle}`;
        setTimeout(() => { document.getElementById("st-username-input").focus(); }, 100);
    }
}

function openStudentLoginModal(targetUrl, examTitle, categoryId) {
    activeStudentLogin = { 
        targetUrl: targetUrl, 
        examTitle: examTitle, 
        categoryId: categoryId || "them-10", 
        currentMode: "class" 
    };
    
    document.getElementById("st-modal-exam-name").innerText = examTitle || "Bài kiểm tra trực tuyến";
    document.getElementById("st-username-input").value = "";
    document.getElementById("st-password-input").value = "";
    document.getElementById("st-free-name-input").value = "";
    document.getElementById("st-free-class-input").value = "";
    document.getElementById("st-free-sbd-input").value = "";
    
    const errBox = document.getElementById("st-login-error");
    errBox.style.display = "none";
    errBox.innerText = "";
    
    switchStudentLoginMode('class');
    document.getElementById("student-login-modal").style.display = "flex";
}

function closeStudentLoginModal() {
    document.getElementById("student-login-modal").style.display = "none";
}

function toggleStudentPassVisibility() {
    const input = document.getElementById("st-password-input");
    const btn = document.getElementById("st-eye-btn");
    if (input.type === "password") {
        input.type = "text";
        btn.innerText = "🙈";
    } else {
        input.type = "password";
        btn.innerText = "👁️";
    }
}

function submitStudentLogin() {
    const errBox = document.getElementById("st-login-error");
    const btn = document.getElementById("st-submit-btn");
    const currentTargetCat = activeStudentLogin.categoryId;

    if (activeStudentLogin.currentMode === 'free') {
        const freeName = document.getElementById("st-free-name-input").value.trim();
        const freeClass = document.getElementById("st-free-class-input").value.trim();
        const freeSbd = document.getElementById("st-free-sbd-input").value.trim();

        if (!freeName || !freeClass || !freeSbd) {
            errBox.innerText = "⚠️ Vui lòng nhập đầy đủ Họ tên, Lớp và Số báo danh!";
            errBox.style.display = "block";
            return;
        }

        errBox.style.display = "none";
        const freePayload = {
            sbd: freeSbd, 
            name: freeName, 
            className: freeClass,
            username: "free_" + freeSbd, 
            isFreeStudent: true,
            categoryId: currentTargetCat
        };

        try {
            localStorage.setItem("current_exam_student", JSON.stringify(freePayload));
            sessionStorage.setItem("current_exam_student", JSON.stringify(freePayload));
            localStorage.setItem("saved_student_sbd", freeSbd);
            localStorage.setItem("saved_student_name", freeName);
            localStorage.setItem("saved_student_class", freeClass);
        } catch(e) {}

        let urlObj;
        try {
            urlObj = new URL(activeStudentLogin.targetUrl, window.location.href);
        } catch(e) {
            urlObj = new URL(window.location.origin + "/" + activeStudentLogin.targetUrl);
        }
        urlObj.searchParams.set('sbd', freeSbd);
        urlObj.searchParams.set('name', freeName);
        urlObj.searchParams.set('class', freeClass);
        urlObj.searchParams.set('cat', currentTargetCat);
        urlObj.searchParams.set('autostart', '1');

        const finalRedirectUrl = urlObj.pathname + urlObj.search + urlObj.hash;

        btn.innerHTML = "🎉 Thí sinh tự do vào thi...";
        btn.style.background = "#10b981";

        setTimeout(() => {
            closeStudentLoginModal();
            window.location.href = finalRedirectUrl;
            btn.innerHTML = "Vào thi 🚀";
            btn.style.background = "";
        }, 400);
        return;
    }

    const uVal = document.getElementById("st-username-input").value.trim();
    const pVal = document.getElementById("st-password-input").value.trim();

    if (!uVal || !pVal) {
        errBox.innerText = "⚠️ Vui lòng nhập đầy đủ Tên đăng nhập (hoặc SBD) và Mật khẩu!";
        errBox.style.display = "block";
        return;
    }

    const catId = activeStudentLogin.categoryId;
    const accounts = getAccountsForCategory(catId);

    if (!accounts || accounts.length === 0) {
        errBox.innerText = `⚠️ Không tìm thấy cơ sở dữ liệu của lớp "${getCategoryDisplayName(catId)}"!`;
        errBox.style.display = "block";
        return;
    }

    const matched = accounts.find(acc => 
        ((acc.username && acc.username.trim().toLowerCase() === uVal.toLowerCase()) ||
         (acc.sbd && String(acc.sbd).trim().toLowerCase() === uVal.toLowerCase()) ||
         (acc.name && acc.name.trim().toLowerCase() === uVal.toLowerCase())) &&
        (String(acc.pass).trim() === pVal)
    );

    if (matched) {
        errBox.style.display = "none";
        const studentPayload = {
            sbd: matched.sbd, 
            name: matched.name || matched.username, 
            className: matched.className,
            username: matched.username, 
            stt: matched.stt,
            categoryId: catId
        };
        
        try {
            localStorage.setItem("current_exam_student", JSON.stringify(studentPayload));
            sessionStorage.setItem("current_exam_student", JSON.stringify(studentPayload));
            localStorage.setItem("saved_student_sbd", matched.sbd);
            localStorage.setItem("saved_student_name", matched.name || matched.username);
            localStorage.setItem("saved_student_class", matched.className);
        } catch(e) {}

        let urlObj;
        try {
            urlObj = new URL(activeStudentLogin.targetUrl, window.location.href);
        } catch(e) {
            urlObj = new URL(window.location.origin + "/" + activeStudentLogin.targetUrl);
        }
        urlObj.searchParams.set('sbd', matched.sbd);
        urlObj.searchParams.set('name', matched.name || matched.username);
        urlObj.searchParams.set('class', matched.className);
        urlObj.searchParams.set('cat', catId);
        urlObj.searchParams.set('autostart', '1');

        const finalRedirectUrl = urlObj.pathname + urlObj.search + urlObj.hash;

        btn.innerHTML = "🎉 Đăng nhập thành công! Đang vào...";
        btn.style.background = "#10b981";

        setTimeout(() => {
            closeStudentLoginModal();
            window.location.href = finalRedirectUrl;
            btn.innerHTML = "Vào thi 🚀";
            btn.style.background = "";
        }, 400);
    } else {
        errBox.innerText = `❌ Sai Tên đăng nhập (hoặc SBD) hoặc Mật khẩu trong ${getCategoryDisplayName(catId)}! Vui lòng thử lại.`;
        errBox.style.display = "block";
    }
}

// =========================================================
// RENDER GIAO DIỆN THẺ ĐỀ THI & NHÃN BADGE
// =========================================================
function getBadgeClass(type) {
    switch(type) {
        case 'HOT': return 'b-hot';
        case 'NEW': return 'b-new';
        case 'MỚI': return 'b-moi';
        case 'Làm ngay': return 'b-lamngay';
        case 'WARNING': return 'b-warning';
        case 'START': return 'b-start';
        default: return '';
    }
}

function toggleBadgeMenu(wrapperEl, event) {
    event.preventDefault(); event.stopPropagation();
    const currentMenu = wrapperEl.querySelector('.badge-dropdown-menu');
    const parentCard = wrapperEl.closest('.exam-card');
    const isShown = currentMenu.classList.contains('show');

    document.querySelectorAll('.badge-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.exam-card.active-dropdown').forEach(c => c.classList.remove('active-dropdown'));

    if (!isShown) {
        currentMenu.classList.add('show');
        if(parentCard) parentCard.classList.add('active-dropdown');
    }
}

async function changeBadge(categoryId, itemId, newBadgeType, event) {
    event.preventDefault(); event.stopPropagation();

    if (!checkAdminSessionValidity()) {
        let pass = prompt("🔐 Nhập mật khẩu quản trị viên để thay đổi nhãn:");
        if (pass !== ADMIN_PASSWORD) { alert("❌ Sai mật khẩu!"); return; }
        isAdminLoggedIn = true;
        try {
            const exp = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem("adminLoggedInSession", "true");
            localStorage.setItem("admin_expires_at", String(exp));
            sessionStorage.setItem("adminLoggedInSession", "true");
        } catch(e) {}
        document.getElementById("gear-btn").classList.add("active-gear");
        refreshAllViews();
    }

    const wrapperEl = event.target.closest('.badge-wrapper');
    if (wrapperEl) {
        const badgeSpan = wrapperEl.querySelector('.badge-item');
        if (badgeSpan) {
            badgeSpan.className = `badge-item ${getBadgeClass(newBadgeType)} ${newBadgeType === 'NONE' ? 'badge-empty' : ''}`;
            badgeSpan.innerHTML = `${newBadgeType !== 'NONE' ? newBadgeType : 'Nhãn'} ▾`;
        }
        const currentMenu = wrapperEl.querySelector('.badge-dropdown-menu');
        if (currentMenu) currentMenu.classList.remove('show');
        const parentCard = wrapperEl.closest('.exam-card');
        if (parentCard) parentCard.classList.remove('active-dropdown');
    }

    try {
        let payload = { badgeText: newBadgeType, isHot: (newBadgeType === 'HOT') };
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { 
            method: 'PATCH', body: JSON.stringify(payload) 
        });
        if (itemId.startsWith('quiz_')) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { 
                method: 'PATCH', body: JSON.stringify(payload) 
            });
        }
    } catch(e) { console.error("Lỗi lưu nhãn:", e); }
}

function createExamCard(item) {
    let card = document.createElement("a"); 
    card.className = "exam-card"; 
    
    let catId = item.categoryId || "them-10";
    item.categoryId = catId;
    let itemId = item.firebaseId || item.id || ("item_" + Date.now());

    const isPadlet = (catId === "tu-luan-padlet") || (item.url && item.url.includes("padlet.com"));
    const LOGIN_CLASSES = ["them-10", "them-11", "them-12", "lop-11a", "lop-11c", "lop-10p"];
    const requiresLogin = !item.isDoc && !isPadlet && LOGIN_CLASSES.includes(catId);

    if (requiresLogin) {
        card.href = "javascript:void(0);";
        card.onclick = function(e) {
            e.preventDefault();
            openStudentLoginModal(item.url, item.title, catId);
        };
    } else {
        card.href = item.url; 
        card.target = "_blank";
    }
    
    let leftResultBtnHtml = "";
    if (isAdminLoggedIn && !item.isDoc && !isPadlet) {
        let copyItem = { ...item, categoryId: catId };
        leftResultBtnHtml = `
        <button type="button" class="btn-view-results-left" onclick="openExamResultModal(${JSON.stringify(copyItem).replace(/"/g, '&quot;')}, event)" title="Xem bảng điểm và chi tiết bài làm của học sinh">
            📊 Kết quả thi
        </button>`;
    }

    let thumbHtml = item.avatar ? `<div class="exam-thumb-box"><img src="${item.avatar}" class="exam-thumb" alt="Avatar"></div>` : '';
    let currentBadge = item.badgeText || (item.isHot ? 'HOT' : 'NONE');

    let badgeDisplay = currentBadge !== 'NONE' 
        ? `<span class="badge-item ${getBadgeClass(currentBadge)}">${currentBadge} ▾</span>`
        : `<span class="badge-item badge-empty" title="Thêm nhãn">Nhãn ▾</span>`;

    let badgeWrapperHtml = `
        <div class="badge-wrapper" onclick="toggleBadgeMenu(this, event)">
            ${badgeDisplay}
            <div class="badge-dropdown-menu">
                <div class="b-item-btn b-hot" onclick="changeBadge('${catId}', '${itemId}', 'HOT', event)">HOT</div>
                <div class="b-item-btn b-new" onclick="changeBadge('${catId}', '${itemId}', 'NEW', event)">NEW</div>
                <div class="b-item-btn b-moi" onclick="changeBadge('${catId}', '${itemId}', 'MỚI', event)">MỚI</div>
                <div class="b-item-btn b-lamngay" onclick="changeBadge('${catId}', '${itemId}', 'Làm ngay', event)">Làm ngay</div>
                <div class="b-item-btn b-warning" onclick="changeBadge('${catId}', '${itemId}', 'WARNING', event)">WARNING</div>
                <div class="b-item-btn b-start" onclick="changeBadge('${catId}', '${itemId}', 'START', event)">START</div>
                <div class="b-item-btn b-none-btn" onclick="changeBadge('${catId}', '${itemId}', 'NONE', event)">Để trắng</div>
            </div>
        </div>
    `;

    let adminTools = ""; 
    let arrowHtml = `<div class="arrow">&#8250;</div>`;
    
    if (isAdminLoggedIn && item.firebaseId) {
        arrowHtml = "";
        let cleanData = { title: item.title, date: item.date, url: item.url, badgeText: currentBadge, isHot: (currentBadge==='HOT'), isDoc: item.isDoc, avatar: item.avatar, timestamp: item.timestamp, isShuffled: item.isShuffled, categoryId: catId };
        let strData = encodeURIComponent(JSON.stringify(cleanData));
        let escapedTitle = (item.title || "").replace(/'/g, "\\'"); 
        let isDocFlag = item.isDoc ? 'true' : 'false';
        
        let shuffleToggleHtml = "";
        if (!item.isDoc && item.firebaseId.startsWith('quiz_')) {
            let isChecked = item.isShuffled !== false;
            shuffleToggleHtml = `
            <div style="display:flex; align-items:center; background: rgba(255,255,255,0.85); padding: 2px 6px; border-radius: 12px; border: 1px solid #cbd5e1; margin-right: 4px;" title="Gạt phải: BẬT Đảo đề | Gạt trái: TẮT Đảo đề">
                <span class="shuffle-label">🔀</span>
                <label class="switch-toggle" onclick="event.stopPropagation();">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleShuffle('${catId}', '${itemId}', this.checked, event)">
                    <span class="slider-toggle"></span>
                </label>
            </div>`;
        }
        
        adminTools = `
        <div class="admin-link-tools" onclick="event.preventDefault(); event.stopPropagation();">
            ${shuffleToggleHtml}
            <button class="tool-btn tool-btn-edit" onclick="renameItem('${catId}', '${itemId}', ${isDocFlag}, '${escapedTitle}', event)" title="Sửa tên">✏️</button>
            <button class="tool-btn tool-btn-copy" onclick="openCopyModal('${catId}', '${itemId}', '${strData}', event)" title="Sao chép sang mục khác">📋</button>
            <button class="tool-btn tool-btn-move" onclick="openMoveModal('${catId}', '${itemId}', '${strData}', event)" title="Chuyển mục">🔄</button>
            <button class="tool-btn tool-btn-up" onclick="moveItemOrder('${catId}', '${itemId}', 'up', event)" title="Lên trên">⬆️</button>
            <button class="tool-btn tool-btn-down" onclick="moveItemOrder('${catId}', '${itemId}', 'down', event)" title="Xuống dưới">⬇️</button>
            <button class="tool-btn tool-btn-delete" onclick="deleteItem('${catId}', '${itemId}', event)" title="Xóa">🗑️</button>
        </div>`;
    }

    let docBadgeHtml = item.isDoc ? `<span class="badge-doc">TÀI LIỆU</span>` : '';

    card.innerHTML = `
        ${leftResultBtnHtml}
        ${thumbHtml}
        <div class="exam-info">
            <div class="exam-header-row">
                ${badgeWrapperHtml}
                ${docBadgeHtml}
                <div class="exam-title-text" title="${item.title}">${item.title}</div>
            </div>
            <div class="exam-date">🕒 ${item.date}</div>
        </div>
        ${adminTools}
        ${arrowHtml}
    `;
    return card;
}

async function toggleShuffle(categoryId, itemId, isChecked, event) {
    event.stopPropagation();
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ isShuffled: isChecked }) });
        await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ isShuffled: isChecked }) });
    } catch(e) { alert("❌ Lỗi đổi trạng thái đảo đề!"); }
}

function renderLinkListToContainer(linksArray, containerElement, customVisibleCount = 2) {
    containerElement.innerHTML = "";
    if (!linksArray || linksArray.length === 0) {
        containerElement.innerHTML = `<div class="empty-folder">Chưa có bài tập nào trong mục này...</div>`; return;
    }

    const maxVisible = customVisibleCount;
    const visibleLinks = linksArray.slice(0, maxVisible);
    const hiddenLinks = linksArray.slice(maxVisible);

    visibleLinks.forEach(item => containerElement.appendChild(createExamCard(item)));

    if (hiddenLinks.length > 0) {
        let hiddenContainer = document.createElement("div");
        hiddenContainer.className = "hidden-links-container"; hiddenContainer.style.display = "none";
        hiddenLinks.forEach(item => hiddenContainer.appendChild(createExamCard(item)));

        let toggleBtn = document.createElement("button");
        toggleBtn.className = "load-more-btn";
        toggleBtn.innerHTML = `⬇ Xem thêm ${hiddenLinks.length} bài cũ hơn...`;
        toggleBtn.onclick = function(e) {
            e.stopPropagation(); 
            if (hiddenContainer.style.display === "none") { hiddenContainer.style.display = "flex"; toggleBtn.innerHTML = `⬆ Thu gọn bớt`; } 
            else { hiddenContainer.style.display = "none"; toggleBtn.innerHTML = `⬇ Xem thêm ${hiddenLinks.length} bài cũ hơn...`; }
        };
        containerElement.appendChild(toggleBtn); containerElement.appendChild(hiddenContainer);
    }
}

let activeDanTriId = null; 
let activeDayThemId = null;
let activeChinhKhoaRow1Id = null; 
let activeChinhKhoaRow2Id = null;

function renderDanTriNavBar() {
    const navBar = document.getElementById("dantri-nav-bar"); 
    if (!navBar) return;
    navBar.innerHTML = "";
    DANTRI_NAV_CATEGORIES.forEach(cat => {
        let btn = document.createElement("button"); btn.className = "dantri-nav-btn";
        btn.innerHTML = `<div style="display:inline-flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">${cat.title}</div><span class="caret-icon">&#9660;</span>`;
        
        btn.onclick = function() {
            const panel = document.getElementById("dantri-dropdown-panel"); 
            const subTitle = document.getElementById("dantri-sub-title"); 
            const newsList = document.getElementById("dantri-news-list");
            navBar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));

            if (activeDanTriId === cat.id) { panel.classList.remove("show"); activeDanTriId = null; } 
            else {
                activeDanTriId = cat.id; btn.classList.add("active"); subTitle.innerHTML = cat.subTitle; newsList.innerHTML = "";
                cat.news.forEach(item => {
                    let card = document.createElement("a"); card.href = item.url; card.target = "_blank";
                    card.style.cssText = "display:flex; align-items:flex-start; gap:12px; padding:10px 12px; background:rgba(255,255,255,0.9); border-radius:12px; border:1px solid #e2e8f0; text-decoration:none; color:inherit; transition:all 0.25s;";
                    let tagBg = item.tag === "GIẢI TRÍ" || item.tag === "CƯỜI MẮT" || item.tag === "MEME MATH" ? "background:#fef3c7; color:#b45309;" : "background:#dcfce7; color:#15803d;";
                    card.innerHTML = `<span style="font-size:11px; font-weight:800; padding:3px 7px; border-radius:5px; ${tagBg} white-space:nowrap; margin-top:2px;">${item.tag}</span><div style="flex:1; min-width:0;"><div style="font-size:14px; font-weight:700; color:#0f172a; line-height:1.35; margin-bottom:3px;">${item.title}</div><div style="font-size:11.5px; color:#64748b; font-weight:600;">🕒 ${item.date}</div></div>`;
                    newsList.appendChild(card);
                });
                panel.classList.add("show"); btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        };
        navBar.appendChild(btn);
    });
}

function renderDayThemNavBar() {
    const navBar = document.getElementById("daythem-nav-bar"); 
    const panel = document.getElementById("daythem-dropdown-panel"); 
    const container = document.getElementById("daythem-links-container"); 
    if (!navBar) return;
    navBar.innerHTML = "";
    
    DAY_THEM_CATEGORIES.forEach(cat => {
        let btn = document.createElement("button"); 
        btn.className = "dantri-nav-btn"; 
        btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
        if (activeDayThemId === cat.id) btn.classList.add("active");
        
        btn.onclick = function() {
            navBar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
            if (activeDayThemId === cat.id) { 
                panel.classList.remove("show"); 
                activeDayThemId = null; 
            } else { 
                activeDayThemId = cat.id; 
                btn.classList.add("active"); 
                renderLinkListToContainer(cat.links, container, cat.visibleCount || 2); 
                panel.classList.add("show"); 
            }
        };
        navBar.appendChild(btn);
    });

    if (activeDayThemId) { 
        let activeCat = DAY_THEM_CATEGORIES.find(c => c.id === activeDayThemId); 
        if (activeCat) {
            renderLinkListToContainer(activeCat.links, container, activeCat.visibleCount || 2);
            panel.classList.add("show");
        }
    }
}

function renderChinhKhoaNavBar() {
    const row1Bar = document.getElementById("chinhkhoa-row1-bar");
    const row1Panel = document.getElementById("chinhkhoa-row1-dropdown");
    const row1Links = document.getElementById("chinhkhoa-row1-links");

    const row2Bar = document.getElementById("chinhkhoa-row2-bar");
    const row2Panel = document.getElementById("chinhkhoa-row2-dropdown");
    const row2Links = document.getElementById("chinhkhoa-row2-links");

    if (!row1Bar || !row2Bar) return;

    row1Bar.innerHTML = "";
    row2Bar.innerHTML = "";

    const row1Categories = CHINH_KHOA_CATEGORIES.filter(c => c.row === 1);
    row1Categories.forEach(cat => {
        let btn = document.createElement("button");
        btn.className = "dantri-nav-btn";
        btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
        if (activeChinhKhoaRow1Id === cat.id) btn.classList.add("active");

        btn.onclick = function() {
            row1Bar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
            if (activeChinhKhoaRow1Id === cat.id) {
                row1Panel.classList.remove("show");
                activeChinhKhoaRow1Id = null;
            } else {
                activeChinhKhoaRow1Id = cat.id;
                btn.classList.add("active");
                renderLinkListToContainer(cat.links, row1Links, cat.visibleCount || 2);
                row1Panel.classList.add("show"); 
            }
        };
        row1Bar.appendChild(btn);
    });

    const row2Categories = CHINH_KHOA_CATEGORIES.filter(c => c.row === 2);
    row2Categories.forEach(cat => {
        let btn = document.createElement("button");
        if (cat.isGold) btn.className = "dantri-nav-btn hsg-gold-btn";
        else if (cat.isPurple) btn.className = "dantri-nav-btn padlet-purple-btn";
        else btn.className = "dantri-nav-btn";

        btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
        if (activeChinhKhoaRow2Id === cat.id) btn.classList.add("active");

        btn.onclick = function() {
            row2Bar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
            if (activeChinhKhoaRow2Id === cat.id) {
                row2Panel.classList.remove("show");
                activeChinhKhoaRow2Id = null;
            } else {
                activeChinhKhoaRow2Id = cat.id;
                btn.classList.add("active");
                renderLinkListToContainer(cat.links, row2Links, cat.visibleCount || 2);
                row2Panel.classList.add("show"); 
            }
        };
        row2Bar.appendChild(btn);
    });

    if (activeChinhKhoaRow1Id) {
        let cat1 = row1Categories.find(c => c.id === activeChinhKhoaRow1Id);
        if (cat1) renderLinkListToContainer(cat1.links, row1Links, cat1.visibleCount || 2);
    }
    if (activeChinhKhoaRow2Id) {
        let cat2 = row2Categories.find(c => c.id === activeChinhKhoaRow2Id);
        if (cat2) renderLinkListToContainer(cat2.links, row2Links, cat2.visibleCount || 2);
    }
}

function renderKhoTaiLieu() {
    const container = document.getElementById("kho-tai-lieu-container"); 
    if (!container) return;
    container.innerHTML = "";
    let details = document.createElement("details"); details.className = "folder-section";
    let summary = document.createElement("summary"); summary.className = "folder-header";
    summary.innerHTML = `<img src="${KHO_TAI_LIEU_FOLDER.folderAvatar}" class="folder-avatar" alt="Folder Icon"><h2 class="folder-title">${KHO_TAI_LIEU_FOLDER.folderName}</h2><span class="folder-arrow">&#9658;</span>`;
    details.appendChild(summary);
    let listDiv = document.createElement("div"); listDiv.className = "link-list"; renderLinkListToContainer(KHO_TAI_LIEU_FOLDER.links, listDiv, 3);
    details.appendChild(listDiv); container.appendChild(details);
}

function renderReminderSection() {
    const container = document.getElementById("reminder-container"); 
    if (!container) return;
    container.innerHTML = "";
    renderLinkListToContainer(REMINDER_CATEGORY.links, container, 5);
}

function renderNewsSection() {
    const container = document.getElementById("news-container"); 
    if (!container) return;
    container.innerHTML = "";
    NEWS_DATA.forEach(item => {
        let newsCard = document.createElement("a"); newsCard.href = item.url; newsCard.className = "news-item"; newsCard.target = "_blank";
        let imgHtml = item.image ? `<div class="news-img-box"><img src="${item.image}" class="news-img" alt="Illustration"></div>` : '';
        newsCard.innerHTML = `<div class="news-content"><div class="news-title">${item.title}</div><div class="news-date">🕒 ${item.date}</div></div>${imgHtml}`;
        container.appendChild(newsCard);
    });
}

document.addEventListener("click", function(e) {
    const panel = document.getElementById("admin-popover-panel");
    const gear = document.getElementById("gear-btn");
    const authContainer = document.getElementById("auth-container");
    const moveModal = document.getElementById("move-modal");
    const copyModal = document.getElementById("copy-modal");
    const studentModal = document.getElementById("student-login-modal");
    const resModal = document.getElementById("result-fullscreen-modal");
    const examPickerMenu = document.getElementById("exam-picker-dropdown-list");
    const tableSettingsWrapper = document.getElementById("table-settings-wrapper");

    if (panel && panel.classList.contains("show")) {
        if (!panel.contains(e.target) && !gear.contains(e.target) && (!moveModal || !moveModal.contains(e.target)) && (!copyModal || !copyModal.contains(e.target)) && (!studentModal || !studentModal.contains(e.target)) && (!resModal || !resModal.contains(e.target))) {
            closeAdminPanel();
        }
    }
    if (authContainer && authContainer.classList.contains("show")) {
        if (!authContainer.contains(e.target) && !gear.contains(e.target)) {
            authContainer.classList.remove("show");
        }
    }

    if (!e.target.closest('.badge-wrapper')) {
        document.querySelectorAll('.badge-dropdown-menu.show').forEach(m => m.classList.remove('show'));
        document.querySelectorAll('.exam-card.active-dropdown').forEach(c => c.classList.remove('active-dropdown'));
    }

    if (examPickerMenu && examPickerMenu.classList.contains("show")) {
        if (!e.target.closest('.exam-picker-wrapper')) examPickerMenu.classList.remove("show");
    }

    if (!e.target.closest('.td-attempt-cell-wrap')) {
        document.querySelectorAll('.attempt-dropdown-menu.show').forEach(m => m.classList.remove('show'));
        document.querySelectorAll('.btn-attempt-trigger.active').forEach(b => b.classList.remove('active'));
    }

    if (tableSettingsWrapper && !tableSettingsWrapper.contains(e.target)) {
        closeTableSettingsPopover();
    }
});

// KHỞI CHẠY TRANG CHỦ VÀ GẮN SỰ KIỆN PHÍM ENTER
window.onload = async function() {
    const savedDuration = localStorage.getItem("admin_duration_choice");
    const durSelect = document.getElementById("admin-expiry-select");
    if (savedDuration && durSelect) {
        durSelect.value = savedDuration;
    }

    if (checkAdminSessionValidity()) { 
        document.getElementById("gear-btn").classList.add("active-gear");
    }

    document.getElementById("top-banner-img").src = TOP_BANNER_URL;
    document.getElementById("web-avatar-img").src = WEB_AVATAR_URL;
    document.getElementById("bottom-banner-img").src = BOTTOM_BANNER_URL;
    
    initAvatarGrid();
    initTableSettings();
    await initMidAutumnSettings();

    const uInput = document.getElementById("st-username-input");
    const pInput = document.getElementById("st-password-input");
    const fName = document.getElementById("st-free-name-input");
    const fClass = document.getElementById("st-free-class-input");
    const fSbd = document.getElementById("st-free-sbd-input");

    if (uInput) uInput.addEventListener("keypress", function(e) { if(e.key === 'Enter') pInput.focus(); });
    if (pInput) pInput.addEventListener("keypress", function(e) { if(e.key === 'Enter') submitStudentLogin(); });
    if (fName) fName.addEventListener("keypress", function(e) { if(e.key === 'Enter') fClass.focus(); });
    if (fClass) fClass.addEventListener("keypress", function(e) { if(e.key === 'Enter') fSbd.focus(); });
    if (fSbd) fSbd.addEventListener("keypress", function(e) { if(e.key === 'Enter') submitStudentLogin(); });

    await loadDynamicLinksFromFirebase();

    renderDanTriNavBar();
    renderReminderSection();
    renderDayThemNavBar();
    renderChinhKhoaNavBar();
    renderKhoTaiLieu();
    renderNewsSection();
};
