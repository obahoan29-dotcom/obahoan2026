/**
 * DANH SÁCH TÀI KHOẢN HỌC SINH LỚP 11E
 * Để thêm học sinh: copy 1 dòng, đổi STT, pass, sbd, username, name, className
 */
window.STUDENT_ACCOUNTS = window.STUDENT_ACCOUNTS || {};

const LOP_11E_STUDENTS = [
    { stt: 1, pass: "1", sbd: "11E01", username: "BÙI PHAN PHƯƠNG", name: "BÙI PHAN PHƯƠNG ANH", className: "11E" },
    { stt: 2, pass: "2", sbd: "11E02", username: "NGUYỄN THỊ QUỲNH", name: "NGUYỄN THỊ QUỲNH ANH", className: "11E" },
    { stt: 3, pass: "3", sbd: "11E03", username: "VŨ NGUYỆT", name: "VŨ NGUYỆT ÁNH", className: "11E" },
    { stt: 4, pass: "4", sbd: "11E04", username: "LÊ PHONG", name: "LÊ PHONG BA", className: "11E" },
    { stt: 5, pass: "5", sbd: "11E05", username: "NGUYỄN VĂN", name: "NGUYỄN VĂN CAO", className: "11E" },
    { stt: 6, pass: "6", sbd: "11E06", username: "PHẠM KHẮC", name: "PHẠM KHẮC DUY", className: "11E" },
    { stt: 7, pass: "7", sbd: "11E07", username: "LÊ THÙY", name: "LÊ THÙY DƯƠNG", className: "11E" },
    { stt: 8, pass: "8", sbd: "11E08", username: "TRỊNH QUANG ", name: "TRỊNH QUANG ĐĂNG", className: "11E" },
    { stt: 9, pass: "9", sbd: "11E09", username: "ĐINH NdGỌC HƯƠNG ", name: "ĐINH NGỌC HƯƠNG GIANG", className: "11E" },
    { stt: 10, pass: "10", sbd: "11E10", username: "LÊ dgQUANG", name: "LÊ QUANG HẢI", className: "11E" },
    { stt: 11, pass: "11", sbd: "11E11", username: "ĐỖ THỊ MINHg ", name: "ĐỖ THỊ MINH HẰNG", className: "11E" },
    { stt: 12, pass: "12", sbd: "11E12", username: "PHẠM HOÀNGg HIỆP", name: "PHẠM HOÀNG HIỆP", className: "11E" },
    { stt: 13, pass: "13", sbd: "11E13", username: "NGUYỄN ĐdgỨC HIẾU", name: "NGUYỄN ĐỨC HIẾU", className: "11E" },
    { stt: 14, pass: "14", sbd: "11E14", username: "TẠ ĐỨCdg HÙNG", name: "TẠ ĐỨC HÙNG", className: "11E" },
    { stt: 15, pass: "15", sbd: "11E15", username: "ĐỖ QdgUANG HUY", name: "ĐỖ QUANG HUY", className: "11E" },
    { stt: 16, pass: "16", sbd: "11E16", username: "LÊ QUANG HUY", name: "LÊ QUANG HUY", className: "11E" },
    { stt: 17, pass: "17", sbd: "11E17", username: "PHAN gdGIA HUY", name: "PHAN GIA HUY", className: "11E" },
    { stt: 18, pass: "18", sbd: "11E18", username: "NGUYỄN THỊ BÍCH HƯƠNG", name: "NGUYỄN THỊ BÍCH HƯƠNG", className: "11E" },
    { stt: 19, pass: "19", sbd: "11E19", username: "PHẠM dgTHANH HƯƠNG", name: "PHẠM THANH HƯƠNG", className: "11E" },
    { stt: 20, pass: "20", sbd: "11E20", username: "NGUYỄNdg TÙNG LÂM", name: "NGUYỄN TÙNG LÂM", className: "11E" },
    { stt: 21, pass: "21", sbd: "11E21", username: "ĐINH NGUYỄN DIỆU LINH", name: "ĐINH NGUYỄN DIỆU LINH", className: "11E" },
    { stt: 22, pass: "22", sbd: "11E22", username: "TRẦN THdgỊ THÙY LINH", name: "TRẦN THỊ THÙY LINH", className: "11E" },
    { stt: 23, pass: "23", sbd: "11E23", username: "NGUYỄN XUÂN LỘC", name: "NGUYỄN XUÂN LỘC", className: "11E" },
    { stt: 24, pass: "24", sbd: "11E24", username: "PHẠM XgdgUÂN MAI", name: "PHẠM XUÂN MAI", className: "11E" },
    { stt: 25, pass: "25", sbd: "11E25", username: "ĐỖ ĐỨC MINH", name: "ĐỖ ĐỨC MINH", className: "11E" },
    { stt: 26, pass: "26", sbd: "11E26", username: "NGUYỄN NHẬT MINH", name: "NGUYỄN NHẬT MINH", className: "11E" },
    { stt: 27, pass: "27", sbd: "11E27", username: "LÊ BẢO gNAM", name: "LÊ BẢO NAM", className: "11E" },
    { stt: 28, pass: "28", sbd: "11E28", username: "ĐÀO MINH NGỌC", name: "ĐÀO MINH NGỌC", className: "11E" },
    { stt: 29, pass: "29", sbd: "11E29", username: "PHẠM THỊdg MINH NHẬT", name: "PHẠM THỊ MINH NHẬT", className: "11E" },
    { stt: 30, pass: "30", sbd: "11E30", username: "NGUYỄN THỊ HÀ PHƯƠNG", name: "NGUYỄN THỊ HÀ PHƯƠNG", className: "11E" },
    { stt: 31, pass: "31", sbd: "11E31", username: "TỐNG MAI gdgPHƯƠNG", name: "TỐNG MAI PHƯƠNG", className: "11E" },
    { stt: 32, pass: "32", sbd: "11E32", username: "BÙI ĐỨC THÀNH", name: "BÙI ĐỨC THÀNH", className: "11E" },
    { stt: 33, pass: "33", sbd: "11E33", username: "NGUYỄN HUYg THIỀU", name: "NGUYỄN HUY THIỀU", className: "11E" },
    { stt: 34, pass: "34", sbd: "11E34", username: "BÙI HƯNG THđỊNH", name: "BÙI HƯNG THỊNH", className: "11E" },
    { stt: 35, pass: "35", sbd: "11E35", username: "NGÔ PHAN LINH TRANG", name: "NGÔ PHAN LINH TRANG", className: "11E" },
    { stt: 36, pass: "36", sbd: "11E36", username: "VŨ PHẠM QUỲNdđH TRANG", name: "VŨ PHẠM QUỲNH TRANG", className: "11E" },
    { stt: 37, pass: "37", sbd: "11E37", username: "NGUYỄN XUÂN gdgdgdTRƯỜNG", name: "NGUYỄN XUÂN TRƯỜNG", className: "11E" },
    { stt: 38, pass: "38", sbd: "11E38", username: "PHẠM SƠN TRƯvdỜNG", name: "PHẠM SƠN TRƯỜNG", className: "11E" },
    { stt: 39, pass: "39", sbd: "11E39", username: "ĐINH THỊ CẨMvd TÚ", name: "ĐINH THỊ CẨM TÚ", className: "11E" },
    { stt: 40, pass: "40", sbd: "11E40", username: "ĐỖ PHẠM ", name: "ĐỖ PHẠM TUÂN", className: "11E" },
    { stt: 41, pass: "41", sbd: "11E41", username: "LÊ QUỐC", name: "LÊ QUỐC VIỆT", className: "11E" }
];

window.STUDENT_ACCOUNTS["lop-11e"] = LOP_11E_STUDENTS;
window.STUDENT_ACCOUNTS["lop-11E"] = LOP_11E_STUDENTS;