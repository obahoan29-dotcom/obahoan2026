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
    categoryId: "",
    currentMode: "class"
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
    { id: "them-10", title: "📐 Thêm 10", links: [ { id: "them10_1", firebaseId: "them10_1", categoryId: "them-10", title: "so18toan10chuong1taphop150926", date: "15/09/2026 - 13:00", url: "https://so18toan10chuong1taphop150926.vercel.app/", badgeText: "HOT", isDoc: false, avatar: "https://i.ibb.co/HTPxzDtT/khung-long-bao-chua.jpg" } ] },
    { id: "them-11", title: "✍️ Thêm 11", links: [ { id: "them11_1", firebaseId: "them11_1", categoryId: "them-11", title: "so98toan11c1luonggiac160926", date: "16/09/2026 - 15:35", url: "https://so98toan11c1luonggiac160926.vercel.app/", badgeText: "NONE", isDoc: false, avatar: "https://i.ibb.co/HTPxzDtT/khung-long-bao-chua.jpg" } ] },
    { id: "them-12", title: "🎓 Thêm 12", links: [ { id: "them12_1", firebaseId: "them12_1", categoryId: "them-12", title: "so170toan12onthihk1180926", date: "18/09/2026 - 17:00", url: "https://so170toan12onthihk1180926.vercel.app/", badgeText: "HOT", isDoc: false, avatar: "https://i.ibb.co/HTPxzDtT/khung-long-bao-chua.jpg" } ] }
];

let CHINH_KHOA_CATEGORIES = [
    { id: "lop-11a", title: "🏫 Lớp 11A", row: 1, links: [ { id: "lop11a_1", firebaseId: "lop11a_1", categoryId: "lop-11a", title: "1 https://so158b-030826-toan12-ktrahk1", date: "05/08/2026 - 23:24", url: "https://so158b-030826-toan12-ktrahk1.vercel.app/", badgeText: "HOT", isDoc: false, avatar: "https://files.catbox.moe/ge1of8.png" } ] },
    { id: "lop-11c", title: "🏫 Lớp 11C", row: 1, links: [] },
    { id: "lop-10p", title: "🏫 Lớp 10P", row: 1, links: [] },
    { 
        id: "hsg-toan-11", title: "🏆 HSG Toán 11", isGold: true, row: 2, visibleCount: 2, 
        links: [
            { id: "hsg11_1", firebaseId: "hsg11_1", categoryId: "hsg-toan-11", title: "Chuyên đề Bồi dưỡng HSG Toán 11 - Bài toán 01", date: "20/09/2026 - 08:30", url: "https://hethongthitracnghiem-518c5.web.app/", badgeText: "HOT", isDoc: true, avatar: "https://cdn-icons-png.flaticon.com/512/3358/3358327.png" },
            { id: "hsg11_2", firebaseId: "hsg11_2", categoryId: "hsg-toan-11", title: "Chuyên đề Bồi dưỡng HSG Toán 11 - Bài toán 02", date: "19/09/2026 - 15:00", url: "https://hethongthitracnghiem-518c5.web.app/", badgeText: "NONE", isDoc: true, avatar: "https://cdn-icons-png.flaticon.com/512/3358/3358327.png" },
            { id: "hsg11_3", firebaseId: "hsg11_3", categoryId: "hsg-toan-11", title: "Chuyên đề Bồi dưỡng HSG Toán 11 - Bài toán 03 (Đề rèn luyện)", date: "18/09/2026 - 19:30", url: "https://hethongthitracnghiem-518c5.web.app/", badgeText: "NONE", isDoc: true, avatar: "https://cdn-icons-png.flaticon.com/512/3358/3358327.png" }
        ] 
    },
    { 
        id: "tu-luan-padlet", title: "💜 Nộp tự luận Padlet", isPurple: true, row: 2, visibleCount: 5, 
        links: [ 
            { id: "padlet_1", firebaseId: "padlet_1", categoryId: "tu-luan-padlet", title: "11A chụp tự luận Padlet", date: "16/09/2026 - 10:00", url: "https://padlet.com/obahoan29/11a-nop-tu-luan-padlet-160926-s023me0a6si1mqhqpnb4", badgeText: "HOT", isDoc: false, avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png" },
            { id: "padlet_2", firebaseId: "padlet_2", categoryId: "tu-luan-padlet", title: "11C chụp tự luận Padlet", date: "16/09/2026 - 10:00", url: "https://padlet.com/obahoan29/11a-nop-tu-luan-padlet-160926-s023me0a6si1mqhqpnb4", badgeText: "HOT", isDoc: false, avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png" },
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

function parseDateString(dateStr) {
    if (!dateStr) return 0;
    try {
        let parts = String(dateStr).split(' - ');
        let dParts = parts[0].split('/');
        let tParts = parts[1] ? parts[1].split(':') : ['00', '00'];
        return new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1]).getTime();
    } catch(e) { return 0; }
}

function cleanExamCodeKey(code) {
    return String(code || "").trim().replace(/\s+/g, '_').replace(/[.#$\[\]\/]/g, '_');
}

function normalizeName(str) {
    if (!str) return "";
    return String(str).toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

function stripHtml(html) {
    let tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}
```