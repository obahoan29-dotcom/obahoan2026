// =========================================================
// FILE: app-config.js
// CẤU HÌNH HỆ THỐNG VÀ DỮ LIỆU TĨNH DÙNG CHUNG
// =========================================================

let ADMIN_PASSWORD_HASH = "4711bcbd6fbf382356a6370e814daaf87ed27a425979dca143f8c94722a8a328";

const FIREBASE_DB_URL = "https://obahoan40hethongthitracnghiem-default-rtdb.asia-southeast1.firebasedatabase.app";
const GOOGLE_DRIVE_UPLOAD_GAS_URL = "https://script.google.com/macros/s/AKfycbxrNBRAAeTohrANj3w9_hd9FLBrxZCF0M0PmN290ul0Wrz4zon4-lqYdPOZ7liuePMCgw/exec";

// ĐƯỜNG DẪN GOOGLE APPS SCRIPT UPLOAD BÀI TỰ LUẬN HỌC SINH VÀO GOOGLE DRIVE 5TB
const GOOGLE_DRIVE_TULUAN_GAS_URL = "https://script.google.com/macros/s/AKfycbxj0Y9ZWOuW9jKBLQIdCCHafFv1sfycC4Ub1CIpVV0CfwtXbSmAwjTU3npoBCxME2yWiw/exec";

// KEY API IMGBB DÙNG ĐỂ TỰ ĐỘNG UPLOAD ẢNH CÂU HỎI SIÊU TỐC
const IMGBB_API_KEY = "548b05b895acef8ad88e645fd274c574"; 

// Link Zalo và Messenger để học sinh gửi bài làm dự phòng khi rớt mạng
const TEACHER_ZALO_LINK = "https://zalo.me/0972952128";
const TEACHER_MESSENGER_LINK = "https://m.me/?locale=vi_VN";

let REMINDER_SECTION_TITLE = "📌 Nhắc nhở quan trọng";
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

const PRESET_20_AVATARS = PRESET_AVATARS.slice(0, 20);

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
            title: "Lưu ý quan trọng: Các em nộp bài tự luận trực tiếp bằng nút 'Nộp tự luận' trên đề thi để lưu thẳng vào Google Drive của Thầy.", 
            date: "05/08/2026 - 15:00", url: "#", badgeText: "HOT", isDoc: true, 
            avatar: "https://cdn-icons-png.flaticon.com/512/3602/3602145.png" 
        }
    ]
};

let DAY_THEM_CATEGORIES = [
    { id: "them-10", title: "📐 Thêm 10", links: [] },
    { id: "them-11", title: "✍️ Thêm 11", links: [] },
    { id: "them-12", title: "🎓 Thêm 12", links: [] }
];

let CHINH_KHOA_CATEGORIES = [
    { id: "lop-11a", title: "🏫 Lớp 11A", row: 1, links: [] },
    { id: "lop-11c", title: "🏫 Lớp 11C", row: 1, links: [] },
    { id: "lop-10p", title: "🏫 Lớp 10P", row: 1, links: [] },
    { id: "lop-11e", title: "🏫 Lớp 11E", row: 2, links: [] },
    { id: "hsg-toan-11", title: "🏆 HSG Toán 11", isGold: true, row: 2, links: [] },
    { 
        id: "tu-luan-padlet", title: "📁 Nộp tự luận Drive", isPurple: true, row: 2, 
        links: [ 
            { id: "tuluan_11a", firebaseId: "tuluan_11a", categoryId: "tu-luan-padlet", title: "11A nộp bài tự luận Google Drive", date: "16/09/2026 - 10:00", url: "#", badgeText: "HOT", isDoc: true, avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png" },
            { id: "tuluan_11c", firebaseId: "tuluan_11c", categoryId: "tu-luan-padlet", title: "11C nộp bài tự luận Google Drive", date: "16/09/2026 - 10:00", url: "#", badgeText: "HOT", isDoc: true, avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png" },
            { id: "tuluan_10p", firebaseId: "tuluan_10p", categoryId: "tu-luan-padlet", title: "10P nộp bài tự luận Google Drive", date: "05/09/2026 - 08:00", url: "#", badgeText: "HOT", isDoc: true, avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png" },
            { id: "tuluan_11e", firebaseId: "tuluan_11e", categoryId: "tu-luan-padlet", title: "11E nộp bài tự luận Google Drive", date: "16/09/2026 - 10:00", url: "#", badgeText: "HOT", isDoc: true, avatar: "https://cdn-icons-png.flaticon.com/512/3074/3074058.png" }
        ] 
    }
];

const KHO_TAI_LIEU_FOLDER = { 
    id: "kho-tai-lieu", 
    folderName: "Kho tài liệu PDF, Word, Ảnh...", 
    folderAvatar: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png", 
    links: [] 
};

const NEWS_DATA = [
    { title: "Lịch kiểm tra định kỳ môn Toán tuần tới các em chú ý ôn tập kỹ.", date: "04/08/2026 - 08:00", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300", url: "#" },
    { title: "Xem đáp án và điểm bài kiểm tra của em", date: "03/08/2026 - 12:00", image: "https://files.catbox.moe/jum4by.png", url: "#" }
];
