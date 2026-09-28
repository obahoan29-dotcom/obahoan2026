const examData = {
    maDe: "DE101TOAN11",
    title: "ĐỀ 101 GIỮA HỌC KỲ I MÔN TOÁN LỚP 11",
    password: "",
    timeLimitMinutes: 45,
    
    // Cấu hình thời gian MỞ và ĐÓNG bài thi (Định dạng: YYYY-MM-DDTHH:mm:ss)
    examStartTimeStr: "2026-09-26T00:00:00",
    examEndTimeStr: "2026-09-28T23:30:00",
    
    images: {
        "img_1": "",
        "img_2": "",
        "img_3": "",
        "img_4": "https://i.ibb.co/ynLtTD8w/c4.png",
        "img_5": "",
        "img_6": "",
        "img_7": "",
        "img_8": "https://i.ibb.co/MxnCkM5F/c8.png",
        "img_9": "https://i.ibb.co/gLvxDVyB/c9.png",
        "img_10": "",
        "img_11": "",
        "img_12": "",
        "img_13": "",
        "img_14": "",
        "img_15": "",
        "img_16": "",
        "img_17": "",
        "img_18": "",
        "img_19": "",
        "img_20": "",
        "img_21": "",
        "img_22": "",
        "img_23": "",
        "img_24": "https://i.ibb.co/cS7hx20t/c24.png",
        "img_25": "",
        "img_26": "",
        "img_27": "",
        "img_28": "",
        "img_29": "",
        "img_30": "",
        "img_31": "",
        "img_32": "",
        "img_33": "",
        "img_34": "",
        "img_35": "",
        "img_36": "",
        "img_37": "https://i.ibb.co/wZctyDQN/c37.png",
        "img_38": "",
        "img_39": "",
        "img_40": "",
        "img_41": "",
        "img_42": "",
        "img_43": "",
        "img_44": "",
        "img_45": "https://i.ibb.co/Q33CkWTg/c45.png",
        "img_46": "",
        "img_47": "",
        "img_48": "",
        "img_49": "",
        "img_50": "",
        "img_51": "",
        "img_52": "",
        "img_53": "",
        "img_54": "",
        "img_55": "https://i.ibb.co/hxRC9RvJ/c55.png",
        "img_56": "",
        "img_57": "",
        "img_58": "",
        "img_59": ""
    },
    questions: [
        // ==================== PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN ====================
        {
            id: 1,
            type: "multiple_choice",
            question: "Góc có số đo $\\dfrac{\\pi}{24}$ đổi sang độ là:",
            imageKey: "img_1",
            options: [
                "$8^\\circ$",
                "$8^\\circ 30'$",
                "$7^\\circ$",
                "$7^\\circ 30'$"
            ]
        },
        {
            id: 2,
            type: "multiple_choice",
            question: "Trong các công thức sau, công thức nào đúng?",
            imageKey: "img_2",
            options: [
                "$\\tan(a - b) = \\dfrac{\\tan a + \\tan b}{1 - \\tan a \\tan b}$",
                "$\\tan(a - b) = \\tan a - \\tan b$",
                "$\\tan(a + b) = \\dfrac{\\tan a + \\tan b}{1 - \\tan a \\tan b}$",
                "$\\tan(a + b) = \\tan a + \\tan b$"
            ]
        },
        {
            id: 3,
            type: "multiple_choice",
            question: "Tập xác định của hàm số $y = \\cot x$ là:",
            imageKey: "img_3",
            options: [
                "$\\mathbb{R} \\setminus \\left\\{\\dfrac{\\pi}{2} + k\\pi, k \\in \\mathbb{Z}\\right\\}$",
                "$\\mathbb{R} \\setminus \\{k2\\pi, k \\in \\mathbb{Z}\\}$",
                "$\\mathbb{R} \\setminus \\left\\{\\dfrac{\\pi}{2} + k2\\pi, k \\in \\mathbb{Z}\\right\\}$",
                "$\\mathbb{R} \\setminus \\{k\\pi, k \\in \\mathbb{Z}\\}$"
            ]
        },
        {
            id: 4,
            type: "multiple_choice",
            question: "Số lượng khách hàng nữ mua bảo hiểm nhân thọ trong một ngày được thống kê trong bảng tần số ghép nhóm sau:\n- [20; 30): 3\n- [30; 40): 9\n- [40; 50): 6\n- [50; 60): 4\n- [60; 70): 2\nGiá trị đại diện của nhóm $[30; 40)$ là:",
            imageKey: "img_4",
            options: [
                "40",
                "9",
                "35",
                "30"
            ]
        },
        {
            id: 5,
            type: "multiple_choice",
            question: "Cho cấp số nhân $(u_n)$, biết $u_1 = 12$, $\\dfrac{u_3}{u_8} = 243$. Tìm $u_9$.",
            imageKey: "img_5",
            options: [
                "$u_9 = \\dfrac{4}{6563}$",
                "$u_9 = \\dfrac{4}{2187}$",
                "$u_9 = 78732$",
                "$u_9 = \\dfrac{2}{2187}$"
            ]
        },
        {
            id: 6,
            type: "multiple_choice",
            question: "Cho dãy số $(u_n)$ với $u_n = \\dfrac{n + 1}{n}$. Tính $u_3$.",
            imageKey: "img_6",
            options: [
                "$\\dfrac{5}{4}$",
                "$5$",
                "$\\dfrac{4}{3}$",
                "$\\dfrac{6}{5}$"
            ]
        },
        {
            id: 7,
            type: "multiple_choice",
            question: "Nghiệm của phương trình $\\cos x = -\\dfrac{1}{2}$ là",
            imageKey: "img_7",
            options: [
                "$x = \\pm \\dfrac{\\pi}{6} + k2\\pi$",
                "$x = \\pm \\dfrac{\\pi}{3} + k2\\pi$",
                "$x = \\pm \\dfrac{\\pi}{6} + k\\pi$",
                "$x = \\pm \\dfrac{2\\pi}{3} + k2\\pi$"
            ]
        },
        {
            id: 8,
            type: "multiple_choice",
            question: "Doanh thu bán hàng trong 20 ngày được lựa chọn ngẫu nhiên của một cửa hàng được ghi lại ở bảng sau (đơn vị: triệu đồng):\n- [5; 7): 2 ngày\n- [7; 9): 7 ngày\n- [9; 11): 7 ngày\n- [11; 13): 3 ngày\n- [13; 15): 1 ngày\nNhóm chứa trung vị là",
            imageKey: "img_8",
            options: [
                "$[7; 9)$",
                "$[9; 11)$",
                "$[13; 15)$",
                "$[11; 13)$"
            ]
        },
        {
            id: 9,
            type: "multiple_choice",
            question: "Cho hai điểm $A, B$ và mặt phẳng $(P)$ như hình vẽ (điểm $A$ thuộc $(P)$, điểm $B$ nằm ngoài $(P)$). Khẳng định nào sau đây đúng?",
            imageKey: "img_9",
            options: [
                "$A \\subset (P)$",
                "$A \\in (P)$",
                "$B \\in (P)$",
                "$B \\not\\subset (P)$"
            ]
        },
        {
            id: 10,
            type: "multiple_choice",
            question: "Cho $\\cos x = \\dfrac{4}{5}, x \\in \\left(-\\dfrac{\\pi}{2}; 0\\right)$. Giá trị của $\\sin 2x$ là",
            imageKey: "img_10",
            options: [
                "$\\dfrac{1}{5}$",
                "$\\dfrac{24}{25}$",
                "$-\\dfrac{24}{25}$",
                "$-\\dfrac{1}{5}$"
            ]
        },
        {
            id: 11,
            type: "multiple_choice",
            question: "Cho một cấp số cộng $(u_n)$ có $u_1 = \\dfrac{1}{3}, u_8 = 26$. Tìm công sai $d$.",
            imageKey: "img_11",
            options: [
                "$d = \\dfrac{3}{10}$",
                "$d = \\dfrac{10}{3}$",
                "$d = \\dfrac{11}{3}$",
                "$d = \\dfrac{3}{11}$"
            ]
        },
        {
            id: 12,
            type: "multiple_choice",
            question: "Cho $\\sin\\alpha = \\dfrac{4}{5}$ và $\\dfrac{\\pi}{2} < \\alpha < \\pi$. Tính $\\cos\\alpha$.",
            imageKey: "img_12",
            options: [
                "$\\dfrac{3}{5}$",
                "$-\\dfrac{3}{5}$",
                "$-\\dfrac{1}{5}$",
                "$\\dfrac{1}{5}$"
            ]
        },
        {
            id: 13,
            type: "multiple_choice",
            question: "Cho hai đường thẳng phân biệt không có điểm chung cùng nằm trong một mặt phẳng thì hai đường thẳng đó",
            imageKey: "img_13",
            options: [
                "song song",
                "chéo nhau",
                "cắt nhau",
                "trùng nhau"
            ]
        },
        {
            id: 14,
            type: "multiple_choice",
            question: "Hàm số nào dưới đây là hàm số chẵn?",
            imageKey: "img_14",
            options: [
                "$y = \\cos x$",
                "$y = \\tan x$",
                "$y = \\cot x$",
                "$y = \\sin x$"
            ]
        },
        {
            id: 15,
            type: "multiple_choice",
            question: "Tập nghiệm của phương trình $\\cos x = -\\dfrac{1}{2}$ là",
            imageKey: "img_15",
            options: [
                "$\\left\\{\\pm \\dfrac{2\\pi}{3} + k2\\pi, k \\in \\mathbb{Z}\\right\\}$",
                "$\\left\\{\\dfrac{\\pi}{3} + k2\\pi, k \\in \\mathbb{Z}\\right\\}$",
                "$\\left\\{\\pm \\dfrac{\\pi}{3} + k2\\pi, k \\in \\mathbb{Z}\\right\\}$",
                "$\\left\\{\\pm \\dfrac{\\pi}{6} + k2\\pi, k \\in \\mathbb{Z}\\right\\}$"
            ]
        },
        {
            id: 16,
            type: "multiple_choice",
            question: "Trong các dãy số sau, dãy số nào là một cấp số cộng?",
            imageKey: "img_16",
            options: [
                "$1; -2; -4; -6; -8$",
                "$1; -3; -5; -7; -9$",
                "$1; -3; -7; -11; -15$",
                "$1; -3; -6; -9; -12$"
            ]
        },
        {
            id: 17,
            type: "multiple_choice",
            question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành tâm $O$. Gọi $M$ là trung điểm của $SA$. Mệnh đề nào sau đây đúng?",
            imageKey: "img_17",
            options: [
                "$OM \\parallel (SAB)$",
                "$OM \\parallel (SBC)$",
                "$OM \\parallel (SAC)$",
                "$OM \\parallel (SAD)$"
            ]
        },
        {
            id: 18,
            type: "multiple_choice",
            question: "Cho hình chóp $S.ABC$. Gọi $M$ là một điểm thuộc cạnh $BC$ ($M$ không trùng với $B$ và $C$). Giao tuyến của hai mặt phẳng $(SAM)$ và $(SBC)$ là đường thẳng:",
            imageKey: "img_18",
            options: [
                "$AM$",
                "$SM$",
                "$AC$",
                "$SA$"
            ]
        },
        {
            id: 19,
            type: "multiple_choice",
            question: "Hàm số $y = 3\\sin 2x$ tuần hoàn với chu kì là:",
            imageKey: "img_19",
            options: [
                "$T = \\pi$",
                "$T = 6\\pi$",
                "$T = 2\\pi$",
                "$T = 3\\pi$"
            ]
        },
        {
            id: 20,
            type: "multiple_choice",
            question: "Góc có số đo $108^\\circ$ đổi ra rađian là:",
            imageKey: "img_20",
            options: [
                "$\\dfrac{\\pi}{4}$",
                "$\\dfrac{3\\pi}{5}$",
                "$\\dfrac{\\pi}{10}$",
                "$\\dfrac{3\\pi}{2}$"
            ]
        },
        {
            id: 21,
            type: "multiple_choice",
            question: "Trong các dãy số sau, dãy nào là một cấp số nhân?",
            imageKey: "img_21",
            options: [
                "$8; 16; 32; 65$",
                "$-1; -2; -4; -8$",
                "$1; -2; 11; -24$",
                "$4; 6; 8; 10$"
            ]
        },
        {
            id: 22,
            type: "multiple_choice",
            question: "Cho cấp số nhân $(u_n)$ có số hạng đầu $u_1 = 4$ và công bội $q = -3$. Tính $S = u_1 + u_2 + \\dots + u_{10}$.",
            imageKey: "img_22",
            options: [
                "$S = 59050$",
                "$S = -118100$",
                "$S = 118098$",
                "$S = -59048$"
            ]
        },
        {
            id: 23,
            type: "multiple_choice",
            question: "Cho $a, b$ là các góc lượng giác. Tìm khẳng định đúng trong các khẳng định sau.",
            imageKey: "img_23",
            options: [
                "$\\sin(a - b) = \\sin a - \\sin b$",
                "$\\cos(a + b) = \\cos a \\cos b + \\sin a \\sin b$",
                "$\\cos(a + b) = \\cos a \\cos b - \\sin a \\sin b$",
                "$\\tan(a + b) = \\tan a + \\tan b$"
            ]
        },
        {
            id: 24,
            type: "multiple_choice",
            question: "Cho mẫu số liệu ghép nhóm về điểm số và số học sinh như sau:\n- [1; 3,5): 10\n- [3,5; 6): 9\n- [6; 8,5): 10\n- [8,5; 11): 3\n- [11; 13,5): 2\nTìm tứ phân vị thứ nhất $Q_1$ của mẫu số liệu ghép nhóm đã cho.",
            imageKey: "img_24",
            options: [
                "$\\dfrac{25}{8}$",
                "$\\dfrac{37}{12}$",
                "$\\dfrac{61}{8}$",
                "$\\dfrac{49}{9}$"
            ]
        },
        {
            id: 25,
            type: "multiple_choice",
            question: "Giải phương trình $\\tan x = \\dfrac{1}{\\sqrt{3}}$.",
            imageKey: "img_25",
            options: [
                "$x = \\dfrac{\\pi}{6} + k2\\pi, k \\in \\mathbb{Z}$",
                "$x = \\pm \\dfrac{\\pi}{6} + k\\pi, k \\in \\mathbb{Z}$",
                "$x = \\dfrac{5\\pi}{6} + k\\pi, k \\in \\mathbb{Z}$",
                "$x = \\dfrac{\\pi}{6} + k\\pi, k \\in \\mathbb{Z}$"
            ]
        },
        {
            id: 26,
            type: "multiple_choice",
            question: "Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 13$ và công sai $d = 15$. Tính tổng của 7 số hạng đầu tiên của cấp số cộng $(u_n)$.",
            imageKey: "img_26",
            options: [
                "$S_7 = 322$",
                "$S_7 = 112$",
                "$S_7 = 406$",
                "$S_7 = \\dfrac{721}{2}$"
            ]
        },
        {
            id: 27,
            type: "multiple_choice",
            question: "Cho cấp số cộng $(u_n)$ có $u_8 = -10$ và $u_9 = -3$. Công sai $d$ của cấp số cộng đã cho là:",
            imageKey: "img_27",
            options: [
                "$14$",
                "$7$",
                "$\\dfrac{3}{10}$",
                "$-13$"
            ]
        },
        {
            id: 28,
            type: "multiple_choice",
            question: "Cho $\\dfrac{\\pi}{2} < a < \\pi$. Khẳng định nào sau đây đúng?",
            imageKey: "img_28",
            options: [
                "$\\sin a < 0$",
                "$\\cos a < 0$",
                "$\\cot a > 0$",
                "$\\tan a > 0$"
            ]
        },
        {
            id: 29,
            type: "multiple_choice",
            question: "Trong các đẳng thức sau, đẳng thức nào đúng?",
            imageKey: "img_29",
            options: [
                "$\\sin 2a = \\dfrac{1}{2}\\sin a \\cos a$",
                "$\\sin 2a = \\cos^2 a - \\sin^2 a$",
                "$\\sin 2a = \\sin a \\cos a$",
                "$\\sin 2a = 2\\sin a \\cos a$"
            ]
        },
        {
            id: 30,
            type: "multiple_choice",
            question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình thang với đáy lớn $AD$. Gọi $O$ là giao điểm của $AC$ và $BD$. Tìm giao tuyến của hai mặt phẳng $(SAC)$ và $(SBD)$.",
            imageKey: "img_30",
            options: [
                "$SO$",
                "$AC$",
                "$SD$",
                "$SA$"
            ]
        },
        {
            id: 31,
            type: "multiple_choice",
            question: "Bánh xe đạp có đường kính $100\\text{ cm}$. Một người quay bánh xe 5 vòng quanh trục thì quãng đường đi được là:",
            imageKey: "img_31",
            options: [
                "$500\\pi\\text{ (cm)}$",
                "$250\\pi\\text{ (cm)}$",
                "$200\\pi\\text{ (cm)}$",
                "$1000\\pi\\text{ (cm)}$"
            ]
        },
        {
            id: 32,
            type: "multiple_choice",
            question: "Cho $\\tan\\alpha = \\sqrt{5}$ với $\\pi < \\alpha < \\dfrac{3\\pi}{2}$. Khi đó $\\cos\\alpha$ bằng:",
            imageKey: "img_32",
            options: [
                "$\\sqrt{6}$",
                "$-\\dfrac{\\sqrt{6}}{6}$",
                "$\\dfrac{1}{6}$",
                "$\\dfrac{\\sqrt{6}}{6}$"
            ]
        },
        {
            id: 33,
            type: "multiple_choice",
            question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành tâm $O$. Lấy điểm $M$ nằm trên cạnh $SB$ sao cho $SB = 4SM$. Giao điểm của đường thẳng $SD$ và mặt phẳng $(ACM)$ nằm trên đường thẳng nào sau đây?",
            imageKey: "img_33",
            options: [
                "$OM$",
                "$CM$",
                "$AM$",
                "$AC$"
            ]
        },
        {
            id: 34,
            type: "multiple_choice",
            question: "Phương trình $\\sin\\left(\\dfrac{2x}{3} - \\dfrac{\\pi}{3}\\right) = 0$ có các nghiệm là:",
            imageKey: "img_34",
            options: [
                "$x = k\\pi \\ (k \\in \\mathbb{Z})$",
                "$x = \\dfrac{2\\pi}{3} + \\dfrac{k3\\pi}{2} \\ (k \\in \\mathbb{Z})$",
                "$x = \\dfrac{\\pi}{2} + \\dfrac{k3\\pi}{2} \\ (k \\in \\mathbb{Z})$",
                "$x = \\dfrac{\\pi}{3} + k\\pi \\ (k \\in \\mathbb{Z})$"
            ]
        },
        {
            id: 35,
            type: "multiple_choice",
            question: "Giải phương trình $2\\cos x = -1$ được nghiệm là:",
            imageKey: "img_35",
            options: [
                "$\\left\\{\\dfrac{\\pi}{3} + \\dfrac{k\\pi}{2}, k \\in \\mathbb{Z}\\right\\}$",
                "$\\left\\{\\dfrac{\\pi}{3} + k\\pi, k \\in \\mathbb{Z}\\right\\}$",
                "$\\left\\{-\\dfrac{\\pi}{3} + \\dfrac{k\\pi}{3}, k \\in \\mathbb{Z}\\right\\}$",
                "$\\left\\{\\pm \\dfrac{2\\pi}{3} + k2\\pi, k \\in \\mathbb{Z}\\right\\}$"
            ]
        },

        // ==================== PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI ====================
        {
            id: 36,
            type: "true_false",
            question: "Cho cấp số cộng $(u_n)$ với $u_1 = -3$ và công sai $d = 2$. Xét tính đúng sai của mỗi phát biểu sau:",
            imageKey: "img_36",
            statements: [
                { id: "a", statement: "Số hạng tổng quát của cấp số cộng đã cho là $u_n = 2n - 5; \\forall n \\in \\mathbb{N}^*$." },
                { id: "b", statement: "Số 190 là số hạng thứ 100 của cấp số cộng đã cho." },
                { id: "c", statement: "Tổng của 100 số hạng đầu tiên của cấp số cộng $(u_n)$ là $S_{100} = 9350$." },
                { id: "d", statement: "Cấp số cộng $(u_n)$ có: $u_2 + u_4 + u_6 + \\dots + u_{100} = 4850$." }
            ]
        },
        {
            id: 37,
            type: "true_false",
            question: "Kết quả đo chiều cao (đơn vị: mét) của 100 cây keo 3 năm tuổi tại một nông trường được cho ở bảng sau:\n- [8,4; 8,6): 5 cây\n- [8,6; 8,8): 12 cây\n- [8,8; 9,0): 25 cây\n- [9,0; 9,2): 44 cây\n- [9,2; 9,4): 14 cây",
            imageKey: "img_37",
            statements: [
                { id: "a", statement: "Số trung bình của mẫu số liệu ghép nhóm là $\\bar{x} = 8,9\\text{ (m)}$." },
                { id: "b", statement: "Mẫu số liệu ghép nhóm trên có 5 nhóm số liệu." },
                { id: "c", statement: "Hiệu giữa tứ phân vị thứ ba và tứ phân vị thứ nhất bằng 2,06." },
                { id: "d", statement: "Số cây keo có chiều cao khoảng $9,1\\text{ (m)}$ là nhiều nhất." }
            ]
        },
        {
            id: 38,
            type: "true_false",
            question: "Cho cấp số cộng $(u_n)$ biết số hạng đầu $u_1 = 2$ và công sai $d = 3$. Các mệnh đề sau đúng hay sai?",
            imageKey: "img_38",
            statements: [
                { id: "a", statement: "Đặt $S = (u_{10} + \\dots + u_{20}) + (u_{30} + \\dots + u_{50}) + (u_{60} + \\dots + u_{80})$. Khi đó $S = 7372$." },
                { id: "b", statement: "Số 610 là tổng của $n$ số hạng đầu của cấp số cộng $(u_n)$. Khi đó $n \\in [18; 22]$." },
                { id: "c", statement: "Số 152 là số hạng thứ $n$ của cấp số cộng $(u_n)$. Khi đó $n \\in [45; 50]$." },
                { id: "d", statement: "Số hạng tổng quát của cấp số cộng là $u_n = -1 + 3n$." }
            ]
        },
        {
            id: 39,
            type: "true_false",
            question: "Cho biết $\\sin\\alpha = -\\dfrac{12}{13},\\ \\left(\\dfrac{3\\pi}{2} < \\alpha < 2\\pi\\right)$. Xét tính đúng sai của các phát biểu sau:",
            imageKey: "img_39",
            statements: [
                { id: "a", statement: "$\\cos\\alpha > 0$." },
                { id: "b", statement: "$\\cos\\alpha = \\dfrac{5}{13}$." },
                { id: "c", statement: "$\\tan\\alpha = \\dfrac{12}{5}$." },
                { id: "d", statement: "$\\cos\\left(\\dfrac{\\pi}{3} - \\alpha\\right) = \\dfrac{5 - \\sqrt{3}}{26}$." }
            ]
        },
        {
            id: 40,
            type: "true_false",
            question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành, $K$ là trung điểm cạnh $SB$. Gọi $E$ là điểm trên $SC$ sao cho $\\dfrac{SE}{SC} = \\dfrac{1}{3}$, gọi $H$ là giao điểm của $KE$ và $(SAD)$.",
            imageKey: "img_40",
            statements: [
                { id: "a", statement: "Tỉ số $\\dfrac{HE}{HK} = 0,76$." },
                { id: "b", statement: "Ta chứng minh được $KE \\parallel BC$." },
                { id: "c", statement: "Điểm $E$ nằm trên mặt phẳng $(SCD)$." },
                { id: "d", statement: "Ta chứng minh được $mp(SAD) \\parallel BC$." }
            ]
        },
        {
            id: 41,
            type: "true_false",
            question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình thang đáy lớn $DC$. Gọi $M$ là trọng tâm tam giác $SCD$. Các mệnh đề sau đúng hay sai?",
            imageKey: "img_41",
            statements: [
                { id: "a", statement: "Hai đường thẳng $SA$ và $CD$ là hai đường thẳng chéo nhau." },
                { id: "b", statement: "$AD \\parallel (SBC)$." },
                { id: "c", statement: "Giao tuyến của 2 mặt phẳng $(SAB)$ và $(SDC)$ là đường thẳng đi qua điểm $S$ và song song với hai đường thẳng $AB, CD$." },
                { id: "d", statement: "Mặt phẳng $(MAB)$ giao $(SCD)$ theo giao tuyến $HK$ ($H \\in SD, K \\in SC$) đi qua $M$, song song với $DC$. Tứ giác $ABKH$ là hình bình hành khi và chỉ khi $DC = 3AB$." }
            ]
        },

        // ==================== PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN ====================
        {
            id: 42,
            type: "short_answer",
            question: "Cho cấp số nhân $(u_n)$ có $q = -3, u_5 = -27$. Số $531441$ là số hạng thứ mấy của cấp số nhân $(u_n)$?",
            imageKey: "img_42"
        },
        {
            id: 43,
            type: "short_answer",
            question: "Cho biết $\\cos\\alpha = \\dfrac{3}{5}, 0 < \\alpha < \\dfrac{\\pi}{2}$. Giá trị $\\sin\\alpha$ bằng bao nhiêu? (kết quả để 1 số thập phân sau phẩy)",
            imageKey: "img_43"
        },
        {
            id: 44,
            type: "short_answer",
            question: "Chị Nụ gửi tiết kiệm 200 triệu đồng với lãi suất 0,5% một tháng. Biết rằng nếu không rút tiền ra khỏi ngân hàng thì cứ sau mỗi tháng, số tiền lãi sẽ được nhập vào vốn ban đầu. Hỏi số tiền chị Nụ nhận được sau hai tháng là bao nhiêu triệu đồng? (làm tròn kết quả đến hàng đơn vị)",
            imageKey: "img_44"
        },
        {
            id: 45,
            type: "short_answer",
            question: "Bảng 9 biểu diễn mẫu số liệu ghép nhóm về nhiệt độ không khí trung bình các tháng năm 2011 tại Hà Nội (đơn vị: $^\\circ\\text{C}$):\n- [16,8; 19,8): 2\n- [19,8; 22,8): 3\n- [22,8; 25,8): 2\n- [25,8; 28,8): 1\n- [28,8; 31,8): 4\nSố trung bình cộng của mẫu số liệu đó bằng bao nhiêu (làm tròn kết quả đến hàng phần mười)?",
            imageKey: "img_45"
        },
        {
            id: 46,
            type: "short_answer",
            question: "Tính tổng của số hạng đầu $u_1$ và công sai $d$ của cấp số cộng $(u_n)$ biết rằng: $\\begin{cases} u_4 = 10 \\\\ u_4 + u_6 = 26 \\end{cases}$",
            imageKey: "img_46"
        },
        {
            id: 47,
            type: "short_answer",
            question: "Tìm số nghiệm thuộc khoảng $(-50\\pi; 50\\pi)$ của phương trình $\\cos 3x + \\cos 2x = 0$.",
            imageKey: "img_47"
        },
        {
            id: 48,
            type: "short_answer",
            question: "Một công viên mới trồng cây theo dãy hình vòng cung. Dãy thứ nhất có 12 cây, dãy thứ hai có 15 cây, dãy thứ ba có 18 cây, … cứ như thế, mỗi dãy sau nhiều hơn dãy trước 3 cây. Tổng cộng công viên có 20 dãy cây. Nếu chi phí trồng mỗi cây là như nhau và tổng chi phí để trồng toàn bộ cây là 20,25 triệu đồng thì chi phí trồng mỗi cây là bao nhiêu nghìn đồng?",
            imageKey: "img_48"
        },
        {
            id: 49,
            type: "short_answer",
            question: "Một chuỗi quầy cà phê báo cáo: tổng doanh thu 6 tháng đầu năm đạt 18 tỷ đồng, trong đó tháng 6 đạt 3,5 tỷ đồng. Để đạt kế hoạch cả năm, công ty đặt chỉ tiêu: từ tháng 7 trở đi mỗi tháng doanh thu phải tăng 8% so với tháng liền trước. Hỏi: theo chỉ tiêu này thì doanh thu cả năm của chuỗi cà phê đạt được là bao nhiêu tỷ đồng? (Làm tròn đến 1 chữ số thập phân).",
            imageKey: "img_49"
        },
        {
            id: 50,
            type: "short_answer",
            question: "Mỗi ngày một công ty xây dựng chậm tiến độ thi công cầu thì sẽ bị phạt. Mức phạt bắt đầu là 4000 (USD) cho ngày đầu tiên và sẽ tăng thêm 1000 (USD) cho mỗi ngày tiếp theo. Dựa trên ngân sách của mình, công ty có khả năng trả tối đa 165.000 (USD) tiền phạt. Tìm số ngày tối đa mà công ty có thể trì hoãn.",
            imageKey: "img_50"
        },
        {
            id: 51,
            type: "short_answer",
            question: "Cho hình chóp $S.ABCD$ có $ABCD$ là hình bình hành. Gọi $M, N, P$ lần lượt là trung điểm của $BC, CD, SD$. Gọi $I$ là giao điểm của đường thẳng $SA$ và $(MNP)$. Biết tỷ số $\\dfrac{IS}{IA} = \\dfrac{a}{b}$, với $\\dfrac{a}{b}$ là phân số tối giản và $a, b \\in \\mathbb{N}^*$. Giá trị $a + 2b$ bằng bao nhiêu?",
            imageKey: "img_51"
        },
        {
            id: 52,
            type: "short_answer",
            question: "Một bánh xe đạp có đường kính $50\\text{ cm}$ (kể cả lốp). Nếu chạy với vận tốc $12\\text{ km/h}$ thì trong 21s bánh xe quay được bao nhiêu vòng (làm tròn đến hàng đơn vị)?",
            imageKey: "img_52"
        },
        {
            id: 53,
            type: "short_answer",
            question: "Cho cấp số cộng $(u_n)$ thỏa mãn: $\\begin{cases} u_2 - u_3 + u_5 = 7 \\\\ u_1 + u_6 = 12 \\end{cases}$. Tìm số hạng thứ 100 của cấp số cộng trên.",
            imageKey: "img_53"
        },

        // ==================== PHẦN IV. TỰ LUẬN ====================
        {
            id: 54,
            type: "essay",
            question: "Cho hình vuông $ABCD$ có cạnh bằng 4 và có diện tích $S_1$. Nối 4 trung điểm $A_1, B_1, C_1, D_1$ theo thứ tự của 4 cạnh $AB, BC, CD, DA$ ta được hình vuông thứ hai có diện tích $S_2$. Tiếp tục làm như thế, ta được hình vuông thứ ba có diện tích $S_3, \\dots$ và cứ tiếp tục như thế, ta tính được các hình vuông lần lượt có diện tích $S_4, S_5, \\dots, S_{100}$. Tính tổng $S = S_1 + S_2 + S_3 + \\dots + S_{100}$.",
            imageKey: "img_54"
        },
        {
            id: 55,
            type: "essay",
            question: "Một vật $M$ được gắn vào đầu lò xo và dao động quanh vị trí cân bằng $I$, biết rằng $O$ là hình chiếu vuông góc của $I$ trên trục $Ox$, toạ độ điểm $M$ trên $Ox$ tại thời điểm $t$ (giây) là đại lượng $s$ (đơn vị: $\\text{cm}$) được tính bởi công thức $s = 8,6\\cos\\left(8t + \\dfrac{\\pi}{2}\\right)$. Tại mấy thời điểm trong khoảng 2 giây đầu tiên thì $s = 4,3\\text{ cm}$?",
            imageKey: "img_55"
        },
        {
            id: 56,
            type: "essay",
            question: "Bánh xe của người đi xe đạp quay được 10 vòng trong 5 giây. Tính độ dài quãng đường mà người đi xe đã đi được trong 1 phút (đơn vị tính bằng mét và làm tròn kết quả đến hàng đơn vị, lấy $\\pi = 3,14$), biết rằng đường kính của bánh xe đạp là $0,68\\text{ m}$.",
            imageKey: "img_56"
        },
        {
            id: 57,
            type: "essay",
            question: "Số giờ có ánh sáng của một thành phố trong ngày thứ $t$ của một năm không nhuận được cho bởi hàm số: $s(t) = 3\\sin\\left[\\dfrac{\\pi}{182}(t - 80)\\right] + 12$, $t \\in \\mathbb{Z}$ và $0 < t \\le 365$. Vào ngày thứ mấy trong năm thì thành phố đó có nhiều giờ ánh sáng nhất?",
            imageKey: "img_57"
        },
        {
            id: 58,
            type: "essay",
            question: "Cho hình chóp $S.ABCD$ đáy $ABCD$ là hình bình hành. $M, N, K$ lần lượt là trung điểm của $AB, SC$ và $SD$. $I$ là giao điểm của $AN$ và $(SBD)$. $J$ là giao điểm của $MN$ với $(SBD)$. Tính tỉ số $\\dfrac{IB}{IJ}$? (kết quả để 1 chữ số sau dấu phẩy).",
            imageKey: "img_58"
        },
        {
            id: 59,
            type: "essay",
            question: "Cho tứ diện $ABCD$ có $CD = 6$. Gọi $I, J$ lần lượt là trung điểm của $AD$ và $AC$, $G$ là trọng tâm của tam giác $BCD$. Biết $(GIJ)$ cắt $BC, BD$ lần lượt tại $M$ và $N$. Khi đó $\\dfrac{BM}{BC} = \\dfrac{a}{b}$ với $\\dfrac{a}{b}$ là phân số tối giản, $a, b \\in \\mathbb{Z}; b \\ne 0$. Tính $a + b$.",
            imageKey: "img_59"
        }
    ]
};