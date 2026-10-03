const examData = {
    maDe: "DE173TOAN12",
    title: "ĐỀ 173 TOÁN 12 HÀM SỐ VÀ ỨNG DỤNG - TOẠ ĐỘ VECTƠ TRONG KHÔNG GIAN",
    password: "",
    timeLimitMinutes: 90,
    
    // Cấu hình thời gian MỞ và ĐÓNG bài thi (Định dạng: YYYY-MM-DDTHH:mm:ss)
    examStartTimeStr: "2026-09-26T00:00:00",
    examEndTimeStr: "2026-10-28T23:30:00",
    
    images: {
        "img_1": "https://i.ibb.co/gMJYMKbj/1.png",
        "img_2": "",
        "img_3": "",
        "img_4": "",
        "img_5": "https://i.ibb.co/XxYTpwVf/5.png",
        "img_6": "https://i.ibb.co/Hfg5frJy/6.png",
        "img_7": "https://i.ibb.co/0yVJc9zM/7.png",
        "img_8": "",
        "img_9": "",
        "img_10": "https://i.ibb.co/7tCMycrS/10.png",
        "img_11": "",
        "img_12": "",
        "img_13": "https://i.ibb.co/4ZrQ3DhH/13.png",
        "img_14": "https://i.ibb.co/ZzZ3HkTw/14.png",
        "img_15": "https://i.ibb.co/9mtrFsJG/15.png",
        "img_16": "",
        "img_17": "",
        "img_18": "https://i.ibb.co/HDrjNxWc/18.png",
        "img_19": "https://i.ibb.co/1YBz3mjt/19.png",
        "img_20": "",
        "img_21": "https://i.ibb.co/f5NBXtm/21.png",
        "img_22": "https://i.ibb.co/G4ZTcddV/22.png",
        "img_23": "",
        "img_24": "",
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
        "img_37": "",
        "img_38": "",
        "img_39": "https://i.ibb.co/hRMvjVd3/39.png",
        "img_40": "",
        "img_41": "",
        "img_42": "",
        "img_43": "",
        "img_44": "",
        "img_45": "https://i.ibb.co/LdCVg1h5/45.png",
        "img_46": "",
        "img_47": "",
        "img_48": "",
        "img_49": "https://i.ibb.co/n8bt5Dxk/49.png",
        "img_50": "https://i.ibb.co/KzBbcKst/50.png",
        "img_51": "",
        "img_52": "https://i.ibb.co/dwCXy6W1/52.png",
        "img_53": "",
        "img_54": ""
    },
    questions: [
        // ==================== PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN ====================
        {
            id: 1,
            type: "multiple_choice",
            question: "Cho hàm số $f(x)$ có bảng biến thiên như sau:\nHàm số đã cho đạt cực đại tại",
            imageKey: "img_1",
            options: [
                "$x = -2$",
                "$x = 2$",
                "$x = 1$",
                "$x = -1$"
            ],
            correct: 3,
            explanation: "Dựa vào bảng biến thiên, đạo hàm đổi dấu từ dương sang âm khi đi qua $x = -1$, do đó hàm số đạt cực đại tại $x = -1$."
        },
        {
            id: 2,
            type: "multiple_choice",
            question: "Giá trị nhỏ nhất của hàm số $f(x) = x^4 - 12x^2 - 4$ trên đoạn $[0; 9]$ bằng",
            imageKey: "img_2",
            options: [
                "$-39$",
                "$-40$",
                "$-36$",
                "$-4$"
            ],
            correct: 1,
            explanation: "Ta có $f'(x) = 4x^3 - 24x = 4x(x^2 - 6) = 0 \\Leftrightarrow x = 0$ hoặc $x = \\sqrt{6}$ (vì $x \\in [0; 9]$). Ta tính: $f(0) = -4$; $f(\\sqrt{6}) = -40$; $f(9) = 5585$. Vậy giá trị nhỏ nhất là $-40$."
        },
        {
            id: 3,
            type: "multiple_choice",
            question: "Cho hàm số $y = \\dfrac{-4x^2 - 2x - 5}{-x + 2}$. Đường tiệm cận xiên của hàm số là",
            imageKey: "img_3",
            options: [
                "$y = 2x + 10$",
                "$y = 4x - 10$",
                "$y = 5x + 10$",
                "$y = 4x + 10$"
            ],
            correct: 3,
            explanation: "Ta có: $y = \\dfrac{4x^2 + 2x + 5}{x - 2} = 4x + 10 + \\dfrac{25}{x - 2}$. Khi $x \\to \\pm\\infty$, $\\dfrac{25}{x - 2} \\to 0$. Vậy tiệm cận xiên là đường thẳng $y = 4x + 10$."
        },
        {
            id: 4,
            type: "multiple_choice",
            question: "Cho hình lăng trụ tam giác $ABC.A'B'C'$. Đặt $\\vec{AA'} = \\vec{a}, \\vec{AB} = \\vec{b}, \\vec{AC} = \\vec{c}, \\vec{BC} = \\vec{d}$. Trong các biểu thức véctơ sau đây, biểu thức nào đúng?",
            imageKey: "img_4",
            options: [
                "$\\vec{a} + \\vec{b} + \\vec{c} = \\vec{d}$",
                "$\\vec{a} = \\vec{b} + \\vec{c}$",
                "$\\vec{a} + \\vec{b} + \\vec{c} + \\vec{d} = \\vec{0}$",
                "$\\vec{b} - \\vec{c} + \\vec{d} = \\vec{0}$"
            ],
            correct: 3,
            explanation: "Ta có theo quy tắc tam giác: $\\vec{BC} = \\vec{AC} - \\vec{AB} \\Leftrightarrow \\vec{d} = \\vec{c} - \\vec{b} \\Leftrightarrow \\vec{b} - \\vec{c} + \\vec{d} = \\vec{0}$."
        },
        {
            id: 5,
            type: "multiple_choice",
            question: "Hàm số nào dưới đây có đồ thị là đường cong trong hình bên?",
            imageKey: "img_5",
            options: [
                "$y = \\dfrac{x + 1}{x - 1}$",
                "$y = \\dfrac{-x - 1}{x - 1}$",
                "$y = \\dfrac{-x + 1}{x + 1}$",
                "$y = \\dfrac{x - 1}{x + 1}$"
            ],
            correct: 1,
            explanation: "Đồ thị có tiệm cận đứng $x = 1$, tiệm cận ngang $y = -1$. Khi $x = 0$ thì $y = 1$. Đối chiếu các hàm số, ta thấy hàm số $y = \\dfrac{-x - 1}{x - 1}$ thỏa mãn."
        },
        {
            id: 6,
            type: "multiple_choice",
            question: "Cho hàm số $f(x)$ xác định trên $\\mathbb{R}$ và có bảng xét dấu của hàm số $f'(x)$ như sau:\nSố điểm cực tiểu của hàm số đã cho là",
            imageKey: "img_6",
            options: [
                "2",
                "3",
                "1",
                "4"
            ],
            correct: 0,
            explanation: "Đạo hàm $f'(x)$ đổi dấu từ âm sang dương khi đi qua $x = 0$ và $x = 4$. Do $f(x)$ liên tục trên $\\mathbb{R}$ nên hàm số có 2 điểm cực tiểu."
        },
        {
            id: 7,
            type: "multiple_choice",
            question: "Cho hàm số $y = f(x)$ có bảng biến thiên như sau:\nTổng số tiệm cận đứng và tiệm cận ngang của đồ thị hàm số đã cho là:",
            imageKey: "img_7",
            options: [
                "2",
                "3",
                "4",
                "1"
            ],
            correct: 1,
            explanation: "Ta có: $\\lim_{x \\to -\\infty} f(x) = 1 \\Rightarrow y = 1$ là TCN; $\\lim_{x \\to +\\infty} f(x) = 3 \\Rightarrow y = 3$ là TCN; $\\lim_{x \\to 0^-} f(x) = -\\infty \\Rightarrow x = 0$ là TCĐ. Tổng cộng có 3 đường tiệm cận."
        },
        {
            id: 8,
            type: "multiple_choice",
            question: "Một doanh nghiệp dự kiến lợi nhuận khi sản xuất $x$ sản phẩm ($0 \\le x \\le 200$) được cho bởi hàm số $y = -x^3 + 150x^2$ (đơn vị: đồng). Hỏi doanh nghiệp cần sản xuất bao nhiêu sản phẩm để đạt được lợi nhuận cao nhất?",
            imageKey: "img_8",
            options: [
                "50",
                "100",
                "75",
                "150"
            ],
            correct: 1,
            explanation: "Ta có $y' = -3x^2 + 300x = 0 \\Leftrightarrow x = 0$ hoặc $x = 100$. Vì $y''(100) = -300 < 0$ nên hàm số đạt giá trị lớn nhất tại $x = 100$."
        },
        {
            id: 9,
            type: "multiple_choice",
            question: "Cho hình chóp $S.ABC$, gọi $G$ là trọng tâm tam giác $ABC$. Chọn khẳng định đúng.",
            imageKey: "img_9",
            options: [
                "$\\vec{SA} + \\vec{SB} + \\vec{SC} = \\vec{SG}$",
                "$\\vec{GA} + \\vec{GB} + \\vec{GC} = 0$",
                "$\\vec{SA} + \\vec{SB} + \\vec{SC} = 3\\vec{SG}$",
                "$\\vec{SA} + \\vec{SB} + \\vec{SC} = 4\\vec{SG}$"
            ],
            correct: 2,
            explanation: "Vì $G$ là trọng tâm $\\triangle ABC$ nên $\\vec{GA} + \\vec{GB} + \\vec{GC} = \\vec{0}$, suy ra với điểm $S$ bất kì: $\\vec{SA} + \\vec{SB} + \\vec{SC} = 3\\vec{SG}$."
        },
        {
            id: 10,
            type: "multiple_choice",
            question: "Cho hình hộp chữ nhật $ABCD.A'B'C'D'$ có $AB = 10, AD = 16, AA' = 8$. Chọn hệ trục tọa độ $Oxyz$ có gốc $O$ trùng với $A$, các vectơ $\\vec{AB}, \\vec{AD}, \\vec{AA'}$ lần lượt cùng hướng với $\\vec{i}, \\vec{j}, \\vec{k}$. Tìm tọa độ vectơ $\\vec{A'C}$.",
            imageKey: "img_10",
            options: [
                "$\\vec{A'C} = (0; 0; -8)$",
                "$\\vec{A'C} = (-10; 0; -8)$",
                "$\\vec{A'C} = (10; -16; -8)$",
                "$\\vec{A'C} = (10; 16; -8)$"
            ],
            correct: 3,
            explanation: "Tọa độ các điểm: $A'(0; 0; 8)$ và $C(10; 16; 0)$. Suy ra $\\vec{A'C} = (10 - 0; 16 - 0; 0 - 8) = (10; 16; -8)$."
        },
        {
            id: 11,
            type: "multiple_choice",
            question: "Trong không gian với hệ trục tọa độ $Oxyz$, cho $\\vec{a} = 2\\vec{j} - \\vec{i} - 3\\vec{k}$. Tọa độ của vectơ $\\vec{a}$ là:",
            imageKey: "img_11",
            options: [
                "$\\vec{a} = (2; -3; -1)$",
                "$\\vec{a} = (-3; 2; -1)$",
                "$\\vec{a} = (2; -1; -3)$",
                "$\\vec{a} = (-1; 2; -3)$"
            ],
            correct: 3,
            explanation: "Ta có $\\vec{a} = -1\\vec{i} + 2\\vec{j} - 3\\vec{k} \\Rightarrow \\vec{a} = (-1; 2; -3)$."
        },
        {
            id: 12,
            type: "multiple_choice",
            question: "Tâm đối xứng của đồ thị hàm số $y = 2 - \\dfrac{1}{x - 1}$ là",
            imageKey: "img_12",
            options: [
                "$(2; 1)$",
                "$(1; 2)$",
                "$(1; 0)$",
                "$(-1; 2)$"
            ],
            correct: 1,
            explanation: "Hàm phân thức có TCĐ $x = 1$ và TCN $y = 2$. Giao điểm hai đường tiệm cận là tâm đối xứng $I(1; 2)$."
        },
        {
            id: 13,
            type: "multiple_choice",
            question: "Đường cong trong hình bên là đồ thị của hàm số nào?",
            imageKey: "img_13",
            options: [
                "$y = \\dfrac{-2x + 3}{x + 2}$",
                "$y = \\dfrac{2x^2 + 2x - 11}{x - 2}$",
                "$y = \\dfrac{x + 2}{x + 3}$",
                "$y = \\dfrac{2x^2 + 5x + 4}{x + 2}$"
            ],
            correct: 1,
            explanation: "Đồ thị có tiệm cận đứng $x = 2$, suy ra mẫu số phải triệt tiêu tại $x = 2$. Do đó hàm số phù hợp là $y = \\dfrac{2x^2 + 2x - 11}{x - 2}$."
        },
        {
            id: 14,
            type: "multiple_choice",
            question: "Cho hàm số $y = f(x)$ có đồ thị như hình vẽ bên. Giá trị cực đại của hàm số là",
            imageKey: "img_14",
            options: [
                "0",
                "1",
                "-4",
                "-1"
            ],
            correct: 1,
            explanation: "Dựa vào đồ thị, điểm cực đại của đồ thị hàm số là $(0; 1)$, do đó giá trị cực đại của hàm số là $y = 1$."
        },
        {
            id: 15,
            type: "multiple_choice",
            question: "Cho hàm số $y = f(x)$ có bảng biến thiên như sau:\nSố đường tiệm cận của đồ thị hàm số là",
            imageKey: "img_15",
            options: [
                "2",
                "0",
                "3",
                "1"
            ],
            correct: 2,
            explanation: "Đồ thị có 1 TCĐ là $x = 0$ (do $\\lim_{x \\to 0^-} y = -\\infty$) và 2 TCN là $y = 1$ (khi $x \\to -\\infty$) và $y = 3$ (khi $x \\to +\\infty$). Tổng cộng có 3 đường tiệm cận."
        },
        {
            id: 16,
            type: "multiple_choice",
            question: "Đồ thị hàm số $y = x^3 + 2x - 8$ cắt trục tung tại điểm có tung độ bằng",
            imageKey: "img_16",
            options: [
                "-2",
                "0",
                "-8",
                "1"
            ],
            correct: 2,
            explanation: "Giao điểm với trục tung ứng với $x = 0 \\Rightarrow y = 0^3 + 2(0) - 8 = -8$."
        },
        {
            id: 17,
            type: "multiple_choice",
            question: "Giá trị lớn nhất của hàm số $y = -3x^4 + 4x^3 + 1$ bằng",
            imageKey: "img_17",
            options: [
                "2",
                "5",
                "0",
                "11"
            ],
            correct: 0,
            explanation: "Ta có $y' = -12x^3 + 12x^2 = -12x^2(x - 1) = 0 \\Leftrightarrow x = 0$ hoặc $x = 1$. Ta có $y(0) = 1, y(1) = 2$. Do $\\lim_{x \\to \\pm\\infty} y = -\\infty$, giá trị lớn nhất của hàm số là 2 tại $x = 1$."
        },
        {
            id: 18,
            type: "multiple_choice",
            question: "Cho hàm số có đồ thị như hình bên. Tiệm cận xiên của đồ thị hàm số là",
            imageKey: "img_18",
            options: [
                "$x = -\\dfrac{1}{2}$",
                "$y = x - 2$",
                "$y = x + 2$",
                "$y = 2x - 2$"
            ],
            correct: 1,
            explanation: "Quan sát trực tiếp trên hình vẽ đồ thị, đường tiệm cận xiên có phương trình là $y = x - 2$."
        },
        {
            id: 19,
            type: "multiple_choice",
            question: "Hàm số nào sau đây có đồ thị là đường cong trong hình vẽ sau:",
            imageKey: "img_19",
            options: [
                "$y = x^3 + 3x^2 + 2$",
                "$y = x^3 + 3x^2 - 2$",
                "$y = -x^3 + 3x^2 - 2$",
                "$y = -x^3 - 3x^2 - 2$"
            ],
            correct: 1,
            explanation: "Nhánh phải đi lên nên $a > 0$. Đồ thị cắt trục tung tại $(0; -2)$. Điểm cực đại là $(-2; 2)$ và cực tiểu là $(0; -2)$. Thử hàm số $y = x^3 + 3x^2 - 2$ thỏa mãn toàn bộ tính chất."
        },
        {
            id: 20,
            type: "multiple_choice",
            question: "Tiệm cận ngang của đồ thị hàm số $y = \\dfrac{3x - 1}{x + 3}$ bằng",
            imageKey: "img_20",
            options: [
                "$x = -3$",
                "$y = -3$",
                "$x = 3$",
                "$y = 3$"
            ],
            correct: 3,
            explanation: "Ta có $\\lim_{x \\to \\pm\\infty} \\dfrac{3x - 1}{x + 3} = 3$, do đó đường tiệm cận ngang là $y = 3$."
        },
        {
            id: 21,
            type: "multiple_choice",
            question: "Cho hàm số $y = f(x)$ có đồ thị như hình vẽ. Đồ thị hàm số đã cho có bao nhiêu đường tiệm cận?",
            imageKey: "img_21",
            options: [
                "1",
                "2",
                "3",
                "0"
            ],
            correct: 2,
            explanation: "Đồ thị có 1 đường tiệm cận đứng là trục tung $x = 0$, và 2 đường tiệm cận ngang $y = 1$ và $y = -1$. Tổng số đường tiệm cận là 3."
        },
        {
            id: 22,
            type: "multiple_choice",
            question: "Cho hàm số $y = f(x)$ liên tục trên đoạn $[-2; 2]$ có đồ thị như hình vẽ. Giá trị lớn nhất của hàm số trên đoạn $[-2; 2]$ là",
            imageKey: "img_22",
            options: [
                "2",
                "3",
                "-1",
                "-2"
            ],
            correct: 1,
            explanation: "Điểm cao nhất của đồ thị trên đoạn $[-2; 2]$ có tung độ bằng 3 (tại $x = 0$). Vậy $\\max_{[-2; 2]} f(x) = 3$."
        },
        {
            id: 23,
            type: "multiple_choice",
            question: "Trong không gian $Oxyz$, cho $\\vec{a} = (-3; 2; 5)$ và $\\vec{b} = (4; -1; 2)$. Tọa độ của $\\vec{a} + 2\\vec{b}$ là",
            imageKey: "img_23",
            options: [
                "$(5; 0; 9)$",
                "$(1; 0; 7)$",
                "$(5; 4; 9)$",
                "$(-11; 4; 1)$"
            ],
            correct: 0,
            explanation: "$\\vec{a} + 2\\vec{b} = (-3 + 2 \\cdot 4; 2 + 2(-1); 5 + 2 \\cdot 2) = (5; 0; 9)$."
        },
        {
            id: 24,
            type: "multiple_choice",
            question: "Trong không gian $Oxyz$, cho hình bình hành $ABCD$ với $A(1; -2; 3), B(4; 0; -1)$ và $D(-2; 5; 2)$. Tọa độ của điểm $C$ là",
            imageKey: "img_24",
            options: [
                "$(1; 7; -2)$",
                "$(3; 3; 4)$",
                "$(-1; 7; 2)$",
                "$(1; 3; -2)$"
            ],
            correct: 0,
            explanation: "Vì $ABCD$ là hình bình hành nên $\\vec{AB} = \\vec{DC} \\Leftrightarrow C = B - A + D = (4 - 1 - 2; 0 - (-2) + 5; -1 - 3 + 2) = (1; 7; -2)$."
        },
        {
            id: 25,
            type: "multiple_choice",
            question: "Trong không gian $Oxyz$, cho $A(-2; 1; 4), B(4; 5; -2)$. Điểm $M$ thuộc đoạn $AB$ và $AM : MB = 1 : 2$. Tọa độ của $M$ là",
            imageKey: "img_25",
            options: [
                "$(2; 3; 0)$",
                "$(0; 2; 2)$",
                "$\\left(0; \\dfrac{5}{3}; 2\\right)$",
                "$\\left(0; \\dfrac{7}{3}; 2\\right)$"
            ],
            correct: 3,
            explanation: "Vì $M$ thuộc đoạn $AB$ và $AM = \\dfrac{1}{2}MB$ nên $\\vec{AM} = \\dfrac{1}{3}\\vec{AB}$. Ta có $\\vec{AB} = (6; 4; -6)$, suy ra $M = \\left(-2 + \\dfrac{6}{3}; 1 + \\dfrac{4}{3}; 4 - \\dfrac{6}{3}\\right) = \\left(0; \\dfrac{7}{3}; 2\\right)$."
        },
        {
            id: 26,
            type: "multiple_choice",
            question: "Trong không gian $Oxyz$, cho $A(1; -1; 2), B(3; 2; 5)$ và $C(5; 5; m)$. Ba điểm $A, B, C$ thẳng hàng khi",
            imageKey: "img_26",
            options: [
                "$m = 5$",
                "$m = 6$",
                "$m = 7$",
                "$m = 8$"
            ],
            correct: 3,
            explanation: "Ta có $\\vec{AB} = (2; 3; 3)$ và $\\vec{AC} = (4; 6; m - 2)$. Để $A, B, C$ thẳng hàng thì $\\dfrac{4}{2} = \\dfrac{6}{3} = \\dfrac{m - 2}{3} = 2 \\Leftrightarrow m - 2 = 6 \\Leftrightarrow m = 8$."
        },
        {
            id: 27,
            type: "multiple_choice",
            question: "Trong không gian $Oxyz$, cho $A(2; 1; -1)$ và $B(-1; 4; 2)$. Điểm $P$ thỏa mãn $\\vec{PA} + 2\\vec{PB} = \\vec{0}$. Tọa độ của $P$ là",
            imageKey: "img_27",
            options: [
                "$(0; 3; 1)$",
                "$(1; 0; 3)$",
                "$(-1; 3; 0)$",
                "$(0; 1; 3)$"
            ],
            correct: 0,
            explanation: "$\\vec{PA} + 2\\vec{PB} = \\vec{0} \\Leftrightarrow P = \\dfrac{A + 2B}{3} = \\left(\\dfrac{2 + 2(-1)}{3}; \\dfrac{1 + 2(4)}{3}; \\dfrac{-1 + 2(2)}{3}\\right) = (0; 3; 1)$."
        },
        {
            id: 28,
            type: "multiple_choice",
            question: "Trong không gian $Oxyz$, cho hình hộp $ABCD.A'B'C'D'$ với $A(1; 0; 2), B(3; -1; 4), D(-2; 5; 1)$ và $A'(4; 2; 6)$. Tọa độ của $C'$ là",
            imageKey: "img_28",
            options: [
                "$(5; 4; 9)$",
                "$(2; 6; 5)$",
                "$(3; 6; 7)$",
                "$(3; 4; 7)$"
            ],
            correct: 2,
            explanation: "Ta có $C = B + D - A = (0; 4; 3)$ và $\\vec{AA'} = (3; 2; 4)$. Suy ra $C' = C + \\vec{AA'} = (0 + 3; 4 + 2; 3 + 4) = (3; 6; 7)$."
        },
        {
            id: 29,
            type: "multiple_choice",
            question: "Trong không gian $Oxyz$, cho $\\vec{a} = (-2; 3; 1)$ và $\\vec{b} = (4; 0; -5)$. Tích vô hướng $\\vec{a} \\cdot \\vec{b}$ bằng",
            imageKey: "img_29",
            options: [
                "-3",
                "-13",
                "13",
                "3"
            ],
            correct: 1,
            explanation: "$\\vec{a} \\cdot \\vec{b} = (-2)(4) + 3(0) + 1(-5) = -8 + 0 - 5 = -13$."
        },
        {
            id: 30,
            type: "multiple_choice",
            question: "Độ dài của vectơ $\\vec{a} = (6; 2; -3)$ bằng",
            imageKey: "img_30",
            options: [
                "7",
                "$\\sqrt{41}$",
                "9",
                "$\\sqrt{50}$"
            ],
            correct: 0,
            explanation: "$|\\vec{a}| = \\sqrt{6^2 + 2^2 + (-3)^2} = \\sqrt{36 + 4 + 9} = \\sqrt{49} = 7$."
        },
        {
            id: 31,
            type: "multiple_choice",
            question: "Cho $\\vec{a} = (1; m; 2)$ và $\\vec{b} = (2; -1; 3)$. Hai vectơ $\\vec{a}, \\vec{b}$ vuông góc với nhau khi",
            imageKey: "img_31",
            options: [
                "$m = 4$",
                "$m = 6$",
                "$m = -8$",
                "$m = 8$"
            ],
            correct: 3,
            explanation: "$\\vec{a} \\perp \\vec{b} \\Leftrightarrow \\vec{a} \\cdot \\vec{b} = 0 \\Leftrightarrow 1(2) + m(-1) + 2(3) = 0 \\Leftrightarrow 8 - m = 0 \\Leftrightarrow m = 8$."
        },
        {
            id: 32,
            type: "multiple_choice",
            question: "Cho $\\vec{a} = (1; 2; 2)$ và $\\vec{b} = (2; 1; 2)$. Côsin của góc giữa $\\vec{a}$ và $\\vec{b}$ bằng",
            imageKey: "img_32",
            options: [
                "$\\dfrac{7}{9}$",
                "$\\dfrac{2}{3}$",
                "$\\dfrac{8}{9}$",
                "$\\dfrac{1}{9}$"
            ],
            correct: 2,
            explanation: "$\\cos(\\vec{a}, \\vec{b}) = \\dfrac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}| \\cdot |\\vec{b}|} = \\dfrac{1(2) + 2(1) + 2(2)}{\\sqrt{1 + 4 + 4} \\cdot \\sqrt{4 + 1 + 4}} = \\dfrac{8}{3 \\cdot 3} = \\dfrac{8}{9}$."
        },
        {
            id: 33,
            type: "multiple_choice",
            question: "Trong không gian $Oxyz$, cho $A(0; 1; 2)$ và $B(3; -1; 6)$. Khoảng cách $AB$ bằng",
            imageKey: "img_33",
            options: [
                "$\\sqrt{21}$",
                "$\\sqrt{29}$",
                "5",
                "$\\sqrt{33}$"
            ],
            correct: 1,
            explanation: "$AB = \\sqrt{(3 - 0)^2 + (-1 - 1)^2 + (6 - 2)^2} = \\sqrt{9 + 4 + 16} = \\sqrt{29}$."
        },
        {
            id: 34,
            type: "multiple_choice",
            question: "Hai cảm biến được đặt tại $A(2; -1; 4)$ và $B(8; 5; 10)$. Một bộ truyền tín hiệu được đặt tại trung điểm của $AB$. Tọa độ bộ truyền là",
            imageKey: "img_34",
            options: [
                "$(4; 2; 7)$",
                "$(5; 2; 7)$",
                "$(5; 3; 6)$",
                "$(3; 2; 5)$"
            ],
            correct: 1,
            explanation: "Tọa độ trung điểm $M$ của $AB$: $M = \\left(\\dfrac{2 + 8}{2}; \\dfrac{-1 + 5}{2}; \\dfrac{4 + 10}{2}\\right) = (5; 2; 7)$."
        },

        // ==================== PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI ====================
        {
            id: 35,
            type: "true_false",
            question: "Cho hàm số $y = -x + 2 - \\dfrac{1}{x + 1}$. Xét tính đúng sai của các khẳng định sau:",
            imageKey: "img_35",
            statements: [
                { id: "a", statement: "Hàm số nghịch biến trên khoảng $(-2; -1)$ và $(-1; 0)$.", correct: false },
                { id: "b", statement: "Giá trị cực tiểu của hàm số là $y_{CT} = 5$.", correct: true },
                { id: "c", statement: "Giá trị lớn nhất của hàm số là 1.", correct: false },
                { id: "d", statement: "Điểm $I(a; b)$ là tâm đối xứng của đồ thị hàm số, ta có $b - 2a = 5$.", correct: true }
            ],
            explanation: "a) $y' = -1 + \\dfrac{1}{(x + 1)^2} = \\dfrac{-x(x + 2)}{(x + 1)^2} > 0$ trên $(-2; -1)$ và $(-1; 0)$ nên hàm số đồng biến (Sai).\nb) Tại $x = -2$, hàm số đạt cực tiểu với $y(-2) = 5$ (Đúng).\nc) $\\lim_{x \\to -\\infty} y = +\\infty$ nên hàm số không có GTLN trên tập xác định (Sai).\nd) Giao điểm của hai tiệm cận $x = -1$ và $y = -x + 2$ là $I(-1; 3) \\Rightarrow a = -1, b = 3 \\Rightarrow b - 2a = 3 - 2(-1) = 5$ (Đúng)."
        },
        {
            id: 36,
            type: "true_false",
            question: "Cho hàm số $y = -x^3 - 3x^2 + 4$. Gọi $A, B$ là hai điểm cực trị của đồ thị hàm số.",
            imageKey: "img_36",
            statements: [
                { id: "a", statement: "Đồ thị hàm số cắt trục hoành tại ba điểm phân biệt.", correct: false },
                { id: "b", statement: "Hàm số nghịch biến trên khoảng $(-\\infty; -2)$.", correct: true },
                { id: "c", statement: "Phương trình đường thẳng $AB$ là $y = 2x + 4$.", correct: true },
                { id: "d", statement: "Giá trị nhỏ nhất của hàm số trên $[-1; 2]$ bằng 4.", correct: false }
            ],
            explanation: "a) $y = 0 \\Leftrightarrow -(x - 1)(x + 2)^2 = 0 \\Leftrightarrow x = 1$ hoặc $x = -2$. Cắt trục hoành tại đúng 2 điểm phân biệt (Sai).\nb) $y' = -3x^2 - 6x = -3x(x + 2) < 0$ với mọi $x \\in (-\\infty; -2)$ nên nghịch biến (Đúng).\nc) Cực trị là $A(-2; 0)$ và $B(0; 4) \\Rightarrow$ đường thẳng $AB$ có phương trình $y = 2x + 4$ (Đúng).\nd) Trên $[-1; 2]$ ta có $y(2) = -16$, vậy GTNN là $-16 \\ne 4$ (Sai)."
        },
        {
            id: 37,
            type: "true_false",
            question: "Xét một chất điểm chuyển động dọc theo trục $Ox$. Toạ độ của chất điểm tại thời điểm $t$ được xác định bởi hàm số $x(t) = t^3 - 6t^2 + 9t$ với $t \\ge 0$. Khi đó $x'(t)$ là vận tốc của chất điểm tại thời điểm $t$, kí hiệu $v(t)$; $v'(t)$ là gia tốc chuyển động của chất điểm tại thời điểm $t$, kí hiệu $a(t)$.",
            imageKey: "img_37",
            statements: [
                { id: "a", statement: "Hàm vận tốc là $v(t) = 3t^2 - 12t + 9$.", correct: true },
                { id: "b", statement: "Hàm gia tốc là $a(t) = 6t - 12$.", correct: true },
                { id: "c", statement: "Trong khoảng từ $t = 0$ đến $t = 2$ thì vận tốc của chất điểm tăng.", correct: false },
                { id: "d", statement: "Quãng đường chất điểm chuyển động được trong khoảng thời gian từ $0 \\le t \\le 4$ là 4.", correct: false }
            ],
            explanation: "a) $v(t) = x'(t) = 3t^2 - 12t + 9$ (Đúng).\nb) $a(t) = v'(t) = 6t - 12$ (Đúng).\nc) Trên $(0; 2)$, $a(t) = 6t - 12 < 0$ nên vận tốc giảm (Sai).\nd) Vận tốc $v(t) = 0 \\Leftrightarrow t = 1$ hoặc $t = 3$. Quãng đường: $S = |x(1) - x(0)| + |x(3) - x(1)| + |x(4) - x(3)| = 4 + 4 + 4 = 12 \\ne 4$ (Sai)."
        },
        {
            id: 38,
            type: "true_false",
            question: "Trong không gian $Oxyz$, cho hình bình hành $ABCD$. Biết $A(1; 2; -1), B(4; 1; 3), C(2; 5; 4)$. Xác định đúng sai cho các mệnh đề sau:",
            imageKey: "img_38",
            statements: [
                { id: "a", statement: "Tọa độ vectơ $\\vec{BC} = (-2; 4; 1)$.", correct: true },
                { id: "b", statement: "Tọa độ vectơ $\\vec{AB} = 3\\vec{i} - \\vec{j} + 4\\vec{k}$.", correct: true },
                { id: "c", statement: "Tọa độ điểm $D$ là $D(-1; 6; 8)$.", correct: false },
                { id: "d", statement: "Tọa độ vectơ $\\vec{AD} = \\vec{i} + 3\\vec{j} + 5\\vec{k}$.", correct: false }
            ],
            explanation: "a) $\\vec{BC} = (2 - 4; 5 - 1; 4 - 3) = (-2; 4; 1)$ (Đúng).\nb) $\\vec{AB} = (3; -1; 4) = 3\\vec{i} - \\vec{j} + 4\\vec{k}$ (Đúng).\nc) Do $ABCD$ là hình bình hành nên $\\vec{AD} = \\vec{BC} = (-2; 4; 1) \\Rightarrow D = A + \\vec{BC} = (-1; 6; 0) \\ne (-1; 6; 8)$ (Sai).\nd) $\\vec{AD} = (-2; 4; 1) = -2\\vec{i} + 4\\vec{j} + \\vec{k} \\ne \\vec{i} + 3\\vec{j} + 5\\vec{k}$ (Sai)."
        },
        {
            id: 39,
            type: "true_false",
            question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông có các cạnh bằng 1, $SAD$ là tam giác đều và nằm trong mặt phẳng vuông góc với đáy. Gọi $O, M$ và $N$ lần lượt là trung điểm của $AD, BC$ và $CD$. Thiết lập hệ trục tọa độ $Oxyz$ như hình vẽ.",
            imageKey: "img_39",
            statements: [
                { id: "a", statement: "Tọa độ các điểm $A, B$ là $A\\left(0; -\\dfrac{1}{2}; 0\\right), B\\left(1; -\\dfrac{1}{2}; 0\\right)$.", correct: true },
                { id: "b", statement: "Tọa độ các điểm $C, D$ là $C\\left(1; \\dfrac{1}{2}; 0\\right), D\\left(0; \\dfrac{1}{2}; 0\\right)$.", correct: true },
                { id: "c", statement: "Tọa độ điểm $S$ là $S\\left(0; 0; \\dfrac{\\sqrt{3}}{2}\\right)$.", correct: true },
                { id: "d", statement: "Tọa độ các điểm $M, N$ là $M(1; 0; 0), N\\left(\\dfrac{1}{2}; \\dfrac{1}{2}; 0\\right)$.", correct: true }
            ],
            explanation: "Chọn gốc tọa độ $O$ là trung điểm $AD$, trục $Ox$ hướng theo $\\vec{OM}$, trục $Oy$ hướng theo $\\vec{OD}$, trục $Oz$ hướng theo $\\vec{OS}$ (vì $SO \\perp (ABCD)$ và $SO = \\dfrac{\\sqrt{3}}{2}$).\nDo đó tọa độ các điểm:\n- $A\\left(0; -\\dfrac{1}{2}; 0\\right), D\\left(0; \\dfrac{1}{2}; 0\\right)$.\n- $B\\left(1; -\\dfrac{1}{2}; 0\\right), C\\left(1; \\dfrac{1}{2}; 0\\right)$.\n- $S\\left(0; 0; \\dfrac{\\sqrt{3}}{2}\\right)$.\n- $M(1; 0; 0)$ và $N = \\dfrac{C + D}{2} = \\left(\\dfrac{1}{2}; \\dfrac{1}{2}; 0\\right)$.\nCả 4 mệnh đề đều đúng."
        },

        // ==================== PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN ====================
        {
            id: 40,
            type: "short_answer",
            question: "Tìm giá trị nhỏ nhất của hàm số $y = -x^4 + 8x^2 - 7$ trên đoạn $[0; 3]$.",
            imageKey: "img_40",
            correctAnswer: "-16",
            explanation: "Ta có $y' = -4x^3 + 16x = -4x(x^2 - 4) = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$ trên $[0; 3]$. Các giá trị: $y(0) = -7$; $y(2) = 9$; $y(3) = -81 + 72 - 7 = -16$. Vậy giá trị nhỏ nhất là $-16$."
        },
        {
            id: 41,
            type: "short_answer",
            question: "Cho $\\vec{a} = (-2; 3; 1)$, $\\vec{b} = (4; -1; 5)$. Tính tổng ba tọa độ của vectơ $2\\vec{a} - \\vec{b}$.",
            imageKey: "img_41",
            correctAnswer: "-4",
            explanation: "Ta có $2\\vec{a} - \\vec{b} = (2(-2) - 4; 2(3) - (-1); 2(1) - 5) = (-8; 7; -3)$. Tổng ba tọa độ bằng $-8 + 7 + (-3) = -4$."
        },
        {
            id: 42,
            type: "short_answer",
            question: "Cho $\\vec{a} = (m; 1; 2)$ và $\\vec{b} = (2; -3; 1)$. Tìm $m$ để $\\vec{a} \\perp \\vec{b}$.",
            imageKey: "img_42",
            correctAnswer: "0.5",
            explanation: "$\\vec{a} \\perp \\vec{b} \\Leftrightarrow \\vec{a} \\cdot \\vec{b} = 0 \\Leftrightarrow 2m - 3 + 2 = 0 \\Leftrightarrow 2m = 1 \\Leftrightarrow m = 0,5$."
        },
        {
            id: 43,
            type: "short_answer",
            question: "Một robot đang ở vị trí $A(2; -3; 5)$ và di chuyển đến $B$ sao cho $\\vec{AB} = (6; 4; -2)$. Tính tổng ba tọa độ của điểm $B$.",
            imageKey: "img_43",
            correctAnswer: "12",
            explanation: "Tọa độ điểm $B$ là $B = A + \\vec{AB} = (2 + 6; -3 + 4; 5 - 2) = (8; 1; 3)$. Tổng ba tọa độ của $B$ là $8 + 1 + 3 = 12$."
        },
        {
            id: 44,
            type: "short_answer",
            question: "Nhà máy $A$ chuyên sản xuất một loại sản phẩm cung cấp cho nhà máy $B$. Hai nhà máy thỏa thuận rằng, hàng tháng nhà máy $A$ cung cấp cho nhà máy $B$ số lượng sản phẩm theo đơn đặt hàng của $B$ (tối đa 100 tấn sản phẩm). Nếu số lượng đặt hàng là $x$ tấn sản phẩm thì giá bán cho mỗi tấn sản phẩm là $P(x) = 45 - 0,001x^2$ (triệu đồng). Chi phí để $A$ sản xuất $x$ tấn sản phẩm trong một tháng gồm 100 triệu đồng chi phí cố định và 30 triệu đồng cho mỗi tấn sản phẩm. Nhà máy $A$ cần bán cho nhà máy $B$ bao nhiêu tấn sản phẩm mỗi tháng để lợi nhuận thu được là lớn nhất? (kết quả làm tròn đến hàng phần mười).",
            imageKey: "img_44",
            correctAnswer: "70.7",
            explanation: "Doanh thu: $R(x) = x \\cdot P(x) = 45x - 0,001x^3$. Chi phí: $C(x) = 100 + 30x$. Lợi nhuận: $L(x) = R(x) - C(x) = -0,001x^3 + 15x - 100$ ($0 \\le x \\le 100$). Đạo hàm: $L'(x) = -0,003x^2 + 15 = 0 \\Leftrightarrow x = \\sqrt{5000} = 50\\sqrt{2} \\approx 70,7$ (tấn)."
        },
        {
            id: 45,
            type: "short_answer",
            question: "Trong bài thực hành của môn huấn luyện quân sự có tình huống chiến sĩ phải bơi qua một con sông để tấn công một mục tiêu ở phía bờ bên kia sông. Biết rằng lòng sông rộng $155\\text{ m}$ và vận tốc bơi của chiến sĩ bằng nửa vận tốc chạy trên bộ. Bạn hãy cho biết chiến sĩ phải bơi bao nhiêu mét để đến được mục tiêu nhanh nhất, nếu như dòng sông là thẳng, vận tốc dòng nước bằng 0 và mục tiêu $B$ cách vị trí $H$ là $1\\text{ km}$ (làm tròn kết quả đến hàng đơn vị)?",
            imageKey: "img_45",
            correctAnswer: "179",
            explanation: "Gọi $M$ là điểm chiến sĩ bơi tới bờ bên kia, đặt $HM = x$ (m, $0 \\le x \\le 1000$). Độ dài bơi $AM = \\sqrt{155^2 + x^2}$, quãng đường chạy $MB = 1000 - x$. Gọi vận tốc chạy là $v$, vận tốc bơi là $\\dfrac{v}{2}$. Thời gian: $T(x) = \\dfrac{2\\sqrt{155^2 + x^2}}{v} + \\dfrac{1000 - x}{v}$. $T'(x) = 0 \\Leftrightarrow \\dfrac{2x}{\\sqrt{155^2 + x^2}} - 1 = 0 \\Leftrightarrow 4x^2 = 155^2 + x^2 \\Leftrightarrow x = \\dfrac{155}{\\sqrt{3}}$. Khi đó độ dài đoạn bơi là $AM = \\sqrt{155^2 + \\dfrac{155^2}{3}} = \\dfrac{310}{\\sqrt{3}} \\approx 179\\text{ m}$."
        },
        {
            id: 46,
            type: "short_answer",
            question: "Hàm số $y = -x^3 - 3x^2 + 9x$. Gọi $x_1$ là điểm cực đại của hàm số, $x_2$ là điểm cực tiểu của hàm số. Tính $T = x_1 - 3x_2$.",
            imageKey: "img_46",
            correctAnswer: "10",
            explanation: "Ta có $y' = -3x^2 - 6x + 9 = -3(x - 1)(x + 3) = 0 \\Leftrightarrow x = 1$ hoặc $x = -3$. Vì hệ số $a = -3 < 0$ nên hàm số đạt cực đại tại $x_1 = 1$, cực tiểu tại $x_2 = -3$. Do đó $T = x_1 - 3x_2 = 1 - 3(-3) = 10$."
        },
        {
            id: 47,
            type: "short_answer",
            question: "Gọi $M$ và $n$ lần lượt là giá trị lớn nhất và giá trị nhỏ nhất của hàm số $y = x^3 - 3x^2 - 9x + 35$ trên đoạn $[-4; 4]$. Tính $2M - 3n$.",
            imageKey: "img_47",
            correctAnswer: "203",
            explanation: "Ta có $y' = 3x^2 - 6x - 9 = 0 \\Leftrightarrow x = -1$ hoặc $x = 3$. Tính các giá trị: $y(-4) = -41; y(-1) = 40; y(3) = 8; y(4) = 15$. Do đó $M = 40, n = -41$. Suy ra $2M - 3n = 2(40) - 3(-41) = 80 + 123 = 203$."
        },
        {
            id: 48,
            type: "short_answer",
            question: "Biết đồ thị hàm số $y = x^3 + bx^2 + cx + d$ đi qua điểm $(2; -20)$ và có điểm cực đại $(-1; 7)$. Giá trị biểu thức $P = b - 2c + d$ bằng bao nhiêu?",
            imageKey: "img_48",
            correctAnswer: "17",
            explanation: "Hàm số đạt cực trị tại $x = -1 \\Rightarrow y'(-1) = 3(-1)^2 + 2b(-1) + c = 0 \\Leftrightarrow -2b + c = -3$. Đồ thị đi qua $(-1; 7) \\Rightarrow -1 + b - c + d = 7 \\Leftrightarrow b - c + d = 8$. Đồ thị đi qua $(2; -20) \\Rightarrow 8 + 4b + 2c + d = -20 \\Leftrightarrow 4b + 2c + d = -28$. Giải hệ phương trình ta được $b = -3, c = -9, d = 2$. Do đó $P = b - 2c + d = -3 - 2(-9) + 2 = 17$."
        },

        // ==================== PHẦN IV. TỰ LUẬN ====================
        {
            id: 49,
            type: "essay",
            question: "Cho hàm số $y = ax^3 + bx^2 + cx + d$ ($a, b, c, d \\in \\mathbb{R}$) có đồ thị là đường cong trong hình dưới đây. Có bao nhiêu số dương trong các số $a, b, c, d$?",
            imageKey: "img_49",
            correctAnswer: "3",
            explanation: "1) Nhánh cuối của đồ thị đi lên nên $a > 0$.\n2) Đồ thị cắt trục tung tại điểm có tung độ dương nên $d > 0$.\n3) Hàm số có hai điểm cực trị $x_1 < 0 < x_2$ thỏa mãn $|x_1| > x_2 \\Rightarrow x_1 + x_2 = -\\dfrac{2b}{3a} < 0 \\Rightarrow b > 0$.\n4) Hai điểm cực trị nằm về hai phía trục tung nên $x_1 x_2 = \\dfrac{c}{3a} < 0 \\Rightarrow c < 0$.\nVậy có 3 số dương là $a, b, d$."
        },
        {
            id: 50,
            type: "essay",
            question: "Cho hàm số $y = \\dfrac{ax - b}{x - 1}$ có đồ thị như hình vẽ bên. Giá trị của $a^2 - 8b$ bằng bao nhiêu?",
            imageKey: "img_50",
            correctAnswer: "17",
            explanation: "Từ đồ thị ta thấy:\n- Tiệm cận ngang $y = a = -1$.\n- Đồ thị cắt trục hoành tại điểm $(2; 0) \\Rightarrow 2a - b = 0 \\Rightarrow b = 2a = -2$.\nDo đó $a = -1, b = -2 \\Rightarrow a^2 - 8b = (-1)^2 - 8(-2) = 1 + 16 = 17$."
        },
        {
            id: 51,
            type: "essay",
            question: "Trong không gian, cho hình lập phương $ABCD.A'B'C'D'$ có cạnh bằng 3. Độ dài của vectơ $\\vec{AB} - \\vec{C'B'} + \\vec{C'C}$ bằng $a\\sqrt{b}$. Giá trị biểu thức $T = 2a + b$ bằng bao nhiêu?",
            imageKey: "img_51",
            correctAnswer: "9",
            explanation: "Ta có $\\vec{C'B'} = \\vec{CB}$, do đó $\\vec{AB} - \\vec{C'B'} + \\vec{C'C} = \\vec{AB} + \\vec{BC} + \\vec{C'C} = \\vec{AC} + \\vec{C'C}$. Vì $\\vec{AC} \\perp \\vec{C'C}$ (do $C'C \\perp (ABCD)$), nên: $|\\vec{AC} + \\vec{C'C}| = \\sqrt{AC^2 + C'C^2} = \\sqrt{(3\\sqrt{2})^2 + 3^2} = \\sqrt{18 + 9} = \\sqrt{27} = 3\\sqrt{3}$. Vậy $a = 3, b = 3 \\Rightarrow T = 2a + b = 2(3) + 3 = 9$."
        },
        {
            id: 52,
            type: "essay",
            question: "Người ta kéo vật nặng bằng một lực $\\vec{F}$ có cường độ $100\\text{ N}$ (Hình). Biểu diễn toạ độ vectơ $\\vec{F}$ trong hệ toạ độ đã cho trong hình ta được $\\vec{F} = (x; y; z)$, khi đó $x + y + z\\sqrt{3}$ bằng bao nhiêu?",
            imageKey: "img_52",
            correctAnswer: "150",
            explanation: "Theo giả thiết góc phương vị và góc nâng của vectơ lực $\\vec{F}$:\nTa có $\\vec{F} = (25\\sqrt{2}; -25\\sqrt{2}; 50\\sqrt{3})$.\nKhi đó: $x + y + z\\sqrt{3} = 25\\sqrt{2} - 25\\sqrt{2} + 50\\sqrt{3} \\cdot \\sqrt{3} = 50 \\cdot 3 = 150$."
        },
        {
            id: 53,
            type: "essay",
            question: "Người ta muốn xây một cái bể hình hộp đứng có thể tích $V = 18\\text{ m}^3$, biết đáy bể là hình chữ nhật có chiều dài gấp 3 lần chiều rộng và bể không có nắp. Hỏi cần xây bể có chiều cao $h$ bằng bao nhiêu mét để nguyên vật liệu xây dựng là ít nhất?",
            imageKey: "img_53",
            correctAnswer: "1.5",
            explanation: "Gọi chiều rộng đáy là $x$ ($x > 0$), chiều dài đáy là $3x$. Chiều cao bể là $h$. Thể tích $V = 3x^2 h = 18 \\Rightarrow h = \\dfrac{6}{x^2}$. Diện tích toàn phần (không nắp) là diện tích xây dựng: $S(x) = 3x^2 + 2(xh + 3xh) = 3x^2 + 8xh = 3x^2 + \\dfrac{48}{x}$. Đạo hàm: $S'(x) = 6x - \\dfrac{48}{x^2} = 0 \\Leftrightarrow x^3 = 8 \\Leftrightarrow x = 2\\text{ m}$. Khi đó chiều cao là $h = \\dfrac{6}{2^2} = 1,5\\text{ m}$."
        },
        {
            id: 54,
            type: "essay",
            question: "Dân số Việt Nam sau $t$ năm tính từ năm 2023 được dự đoán theo công thức $N(t) = 100 \\cdot e^{0,012t}$ (triệu người), với $0 < t \\le 50$. Biết rằng đạo hàm của hàm số $N(t)$ biểu thị tốc độ gia tăng dân số của Việt Nam (đơn vị là triệu người/năm). Sau ít nhất bao nhiêu năm thì tốc độ gia tăng dân số của Việt Nam sẽ lớn hơn 2 triệu người/năm (làm tròn kết quả đến hàng đơn vị)?",
            imageKey: "img_54",
            correctAnswer: "43",
            explanation: "Tốc độ gia tăng dân số là $N'(t) = 100 \\cdot 0,012 \\cdot e^{0,012t} = 1,2 \\cdot e^{0,012t}$. Yêu cầu bài toán: $1,2 \\cdot e^{0,012t} > 2 \\Leftrightarrow e^{0,012t} > \\dfrac{5}{3} \\Leftrightarrow 0,012t > \\ln\\left(\\dfrac{5}{3}\\right) \\approx 0,5108 \\Leftrightarrow t > \\dfrac{0,5108}{0,012} \\approx 42,57$. Làm tròn kết quả đến hàng đơn vị ta được 43 năm."
        }
    ]
};