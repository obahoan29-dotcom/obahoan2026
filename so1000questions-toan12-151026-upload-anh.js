const examData = {
    maDe: "THPT1000_PHANBOICHAU_TOAN12_GHK1_1108",
    title: "ĐỀ1000 THI GIỮA HỌC KỲ I NĂM HỌC 2026-2027 TOÁN 12 - THPT PHAN BỘI CHÂU HÀ NỘI - MÃ ĐỀ: 1108",
    password: "",
    timeLimitMinutes: 90,
    
    // Cấu hình thời gian mở và đóng bài thi
    examStartTimeStr: "2026-10-15T00:00:00",
    examEndTimeStr: "2026-10-20T23:59:00",
    
    // Kho ảnh của đề: các key tương ứng với imageKey trong questions
    // Các ảnh đã có link từ đề gốc được giữ nguyên, các ảnh còn lại để trống "" để hỗ trợ dán ảnh trực tiếp
    images: {
        // THPT Phan Bội Châu, Phần 1 Câu 1: Đồ thị hàm phân thức bậc 2 trên bậc 1
        "pbc_p1_c1": "https://i.ibb.co/xK8vNzLw/pbcp1c1.png",
        
        // THPT Phan Bội Châu, Phần 1 Câu 3: Bảng biến thiên hàm số f(x) trên [-5; 7)
        "pbc_p1_c3": "",
        
        // THPT Phan Bội Châu, Phần 1 Câu 4: Đồ thị hàm bậc 4 trùng phương
        "pbc_p1_c4": "",
        
        // THPT Phan Bội Châu, Phần 1 Câu 6: Bảng biến thiên hàm bậc bốn
        "pbc_p1_c6": "https://i.ibb.co/bgqdDtRw/pbcp1c6.png",
        
        // THPT Phan Bội Châu, Phần 1 Câu 10: Bảng biến thiên hàm bậc ba
        "pbc_p1_c10": "https://i.ibb.co/cKbbv9jJ/pbcp1c10.png",
        
        // THPT Phan Bội Châu, Phần 1 Câu 11: Đồ thị hàm bậc ba ax^3+bx^2+cx+d
        "pbc_p1_c11": "https://i.ibb.co/DPXPTyhM/pbcp1c11.png",
        
        // THPT Phan Bội Châu, Phần 1 Câu 12: Đồ thị hàm nhất biến (4 hình lựa chọn)
        "pbc_p1_c12": "https://i.ibb.co/yc6D1GQw/pbcp1c12.png",
        
        // THPT Phan Bội Châu, Phần 2 Câu 2: Khung cửa sổ bán nguyệt kết hợp chữ nhật
        "pbc_p2_c2": "",
        
        // THPT Phan Bội Châu, Phần 2 Câu 3: Bình nước hình hộp và quả cầu sắt
        "pbc_p2_c3": "https://i.ibb.co/4ZD8pggs/pbcp2c3.png",
        
        // THPT Phan Bội Châu, Phần 3 Câu 1: Hình lập phương chứa 9 phần khối cầu
        "pbc_p3_c1": "",
        
        // THPT Phan Bội Châu, Phần 3 Câu 3: Hình chữ nhật ABCD, đường tròn (C) và dải LED
        "pbc_p3_c3": "",
        
        // THPT Phan Bội Châu, Phần 3 Câu 6: Cắt gấp bìa tạo hình chóp tứ giác đều
        "pbc_p3_c6": ""
    },
    
    questions: [
        // ============================================================================================
        // PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (12 CÂU)
        // ============================================================================================

        // THPT Phan Bội Châu, phần 1 câu 1
        {
            id: 1,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 1\nĐường cong dưới đây là đồ thị của hàm số nào?",
            imageKey: "pbc_p1_c1",
            options: [
                "$y = \\frac{x^2 - 3x + 6}{x - 1}$.",
                "$y = \\frac{2x + 3}{x - 1}$.",
                "$y = \\frac{x^2 - x + 3}{x - 1}$.",
                "$y = -x^3 + x^2 - 2x + 1$."
            ],
            correct: 0,
            explanation: "Đồ thị có tiệm cận đứng $x = 1$, tiệm cận xiên $y = x - 2$ (đi qua $(0; -2)$ và $(2; 0)$). Xét hàm số $y = \\frac{x^2 - 3x + 6}{x - 1} = x - 2 + \\frac{4}{x - 1}$ có tiệm cận xiên là $y = x - 2$, điểm cực đại $(-1; -5)$ và điểm cực tiểu $(3; 3)$, hoàn toàn trùng khớp với hình vẽ."
        },

        // THPT Phan Bội Châu, phần 1 câu 2
        {
            id: 2,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 2\nPhương trình đường thẳng đi qua hai điểm cực trị của đồ thị hàm số $y = \\frac{x^2 - 3x + 6}{x - 2}$ là",
            imageKey: "",
            options: [
                "$y = 2x - 3$.",
                "$y = -2x + 3$.",
                "$y = 2x + 3$.",
                "$y = x - 1$."
            ],
            correct: 0,
            explanation: "Đường thẳng đi qua hai điểm cực trị của đồ thị hàm phân thức $y = \\frac{u(x)}{v(x)}$ có phương trình $y = \\frac{u'(x)}{v'(x)} = \\frac{2x - 3}{1} = 2x - 3$."
        },

        // THPT Phan Bội Châu, phần 1 câu 3
        {
            id: 3,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 3\nCho hàm số $y = f(x)$ có bảng biến thiên trên nửa khoảng $[-5; 7)$ như sau:\nMệnh đề nào dưới đây đúng?",
            imageKey: "pbc_p1_c3",
            options: [
                "$\\min_{[-5; 7)} f(x) = 6$.",
                "$\\max_{[-5; 7)} f(x) = 9$.",
                "$\\min_{[-5; 7)} f(x) = 2$.",
                "$\\max_{[-5; 7)} f(x) = 6$."
            ],
            correct: 2,
            explanation: "Dựa vào bảng biến thiên, trên nửa khoảng $[-5; 7)$, hàm số đạt giá trị nhỏ nhất tại $x = 1$ với $\\min_{[-5; 7)} f(x) = 2$. Hàm số không đạt giá trị lớn nhất vì $\\lim_{x \\to 7^-} f(x) = 9$ nhưng điểm $x = 7$ không thuộc tập xác định."
        },

        // THPT Phan Bội Châu, phần 1 câu 4
        {
            id: 4,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 4\nCho hàm số bậc bốn $y = f(x)$ có đồ thị là đường cong trong hình bên. Số nghiệm của phương trình $f'(x) = -\\frac{1}{2}$ là",
            imageKey: "pbc_p1_c4",
            options: [
                "$3$.",
                "$2$.",
                "$x = 1$.",
                "$4$."
            ],
            correct: 0,
            explanation: "Từ đồ thị hàm số bậc bốn trùng phương, hàm số có điểm cực đại $(0; -1)$ và hai điểm cực tiểu $(-1; -2), (1; -2)$. Suy ra $f(x) = x^4 - 2x^2 - 1$. Khi đó $f'(x) = 4x^3 - 4x$. Phương trình $f'(x) = -\\frac{1}{2} \\Leftrightarrow 8x^3 - 8x + 1 = 0$. Xét hàm số $g(x) = 8x^3 - 8x + 1$ có $g(-2) < 0, g(0) > 0, g(0.5) < 0, g(2) > 0$, do đó phương trình có đúng 3 nghiệm thực phân biệt."
        },

        // THPT Phan Bội Châu, phần 1 câu 5
        {
            id: 5,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 5\nGiá trị lớn nhất của hàm số $f(x) = -x^3 + 3x$ trên đoạn $[0; 2]$ bằng",
            imageKey: "",
            options: [
                "$0$.",
                "$-2$.",
                "$4$.",
                "$2$."
            ],
            correct: 3,
            explanation: "$f'(x) = -3x^2 + 3 = 0 \\Leftrightarrow x = 1 \\in [0; 2]$. Ta có $f(0) = 0, f(1) = 2, f(2) = -2$. Do đó giá trị lớn nhất của hàm số trên đoạn $[0; 2]$ bằng $2$."
        },

        // THPT Phan Bội Châu, phần 1 câu 6
        {
            id: 6,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 6\nCho hàm số $y = f(x)$ có bảng biến thiên như sau. Hàm số đã cho nghịch biến trên khoảng nào dưới đây?",
            imageKey: "pbc_p1_c6",
            options: [
                "$(-2; 0)$.",
                "$(-\\infty; -2)$.",
                "$(0; +\\infty)$.",
                "$(-1; 1)$."
            ],
            correct: 1,
            explanation: "Từ bảng biến thiên, đạo hàm $y' < 0$ trên các khoảng $(-\\infty; -2)$ và $(0; 2)$. Do đó hàm số nghịch biến trên khoảng $(-\\infty; -2)$."
        },

        // THPT Phan Bội Châu, phần 1 câu 7
        {
            id: 7,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 7\nSố đường tiệm cận của đồ thị hàm số $y = \\frac{2x - 1}{x + 1}$ là",
            imageKey: "",
            options: [
                "$1$.",
                "$3$.",
                "$2$.",
                "$4$."
            ],
            correct: 2,
            explanation: "Đồ thị hàm số có đúng 1 tiệm cận đứng là đường thẳng $x = -1$ và 1 tiệm cận ngang là đường thẳng $y = 2$, vậy có tổng cộng 2 đường tiệm cận."
        },

        // THPT Phan Bội Châu, phần 1 câu 8
        {
            id: 8,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 8\nToạ độ tâm đối xứng $I$ của đồ thị hàm số $y = \\frac{3x - 1}{2x + 3}$ là",
            imageKey: "",
            options: [
                "$I\\left(-\\frac{3}{2}; \\frac{3}{2}\\right)$.",
                "$I\\left(-\\frac{1}{3}; \\frac{3}{2}\\right)$.",
                "$I(1; 3)$.",
                "$I\\left(\\frac{3}{2}; -\\frac{3}{2}\\right)$."
            ],
            correct: 0,
            explanation: "Đồ thị hàm số có tiệm cận đứng $x = -\\frac{3}{2}$ và tiệm cận ngang $y = \\frac{3}{2}$. Tâm đối xứng là giao điểm của hai tiệm cận $I\\left(-\\frac{3}{2}; \\frac{3}{2}\\right)$."
        },

        // THPT Phan Bội Châu, phần 1 câu 9
        {
            id: 9,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 9\nHàm số $y = x + \\frac{4}{x}$ nghịch biến trên khoảng",
            imageKey: "",
            options: [
                "$(-2; 2)$.",
                "$(-2; 0)$.",
                "$(-\\infty; -2)$.",
                "$(2; +\\infty)$."
            ],
            correct: 1,
            explanation: "Ta có $y' = 1 - \\frac{4}{x^2} = \\frac{x^2 - 4}{x^2} < 0 \\Leftrightarrow x \\in (-2; 0) \\cup (0; 2)$. Do đó hàm số nghịch biến trên khoảng $(-2; 0)$."
        },

        // THPT Phan Bội Châu, phần 1 câu 10
        {
            id: 10,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 10\nCho hàm số $y = f(x)$ có bảng biến thiên như sau. Giá trị cực tiểu của hàm số đã cho bằng",
            imageKey: "pbc_p1_c10",
            options: [
                "$-2$.",
                "$-1$.",
                "$1$.",
                "$2$."
            ],
            correct: 0,
            explanation: "Từ bảng biến thiên, hàm số đạt cực tiểu tại điểm $x = 2$ và giá trị cực tiểu tương ứng là $y_{CT} = -2$."
        },

        // THPT Phan Bội Châu, phần 1 câu 11
        {
            id: 11,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 11\nCho hàm số $y = ax^3 + bx^2 + cx + d$ có đồ thị như hình vẽ bên. Mệnh đề nào sau đây đúng?",
            imageKey: "pbc_p1_c11",
            options: [
                "$a > 0; b < 0; c < 0; d > 0$.",
                "$a < 0; b > 0; c < 0; d < 0$.",
                "$a < 0; b < 0; c > 0; d < 0$.",
                "$a < 0; b > 0; c > 0; d < 0$."
            ],
            correct: 3,
            explanation: "Nhánh phải đồ thị đi xuống $\\Rightarrow a < 0$. Đồ thị cắt trục tung tại điểm có tung độ âm $\\Rightarrow d < 0$. Hai điểm cực trị nằm về hai phía trục tung nên $x_1 x_2 = \\frac{c}{3a} < 0 \\Rightarrow c > 0$. Điểm uốn nằm bên phải trục tung nên $x_1 + x_2 = -\\frac{2b}{3a} > 0 \\Rightarrow b > 0$. Do đó $a < 0; b > 0; c > 0; d < 0$."
        },

        // THPT Phan Bội Châu, phần 1 câu 12
        {
            id: 12,
            type: "multiple_choice",
            question: "// THPT Phan Bội Châu, phần 1 câu 12\nHàm số $y = \\frac{2 + 2x}{2 + x}$ có đồ thị là hình vẽ nào sau đây? Hãy chọn câu trả lời đúng.",
            imageKey: "pbc_p1_c12",
            options: [
                "Hình A.",
                "Hình B.",
                "Hình C.",
                "Hình D."
            ],
            correct: 2,
            explanation: "Hàm số $y = \\frac{2x + 2}{x + 2}$ có tiệm cận đứng $x = -2$, tiệm cận ngang $y = 2$, đạo hàm $y' = \\frac{2}{(x + 2)^2} > 0$ (đồng biến) và cắt trục tung tại $(0; 1)$, trục hoành tại $(-1; 0)$. Đồ thị tương ứng là Hình C."
        },

        // ============================================================================================
        // PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI (4 CÂU)
        // ============================================================================================

        // THPT Phan Bội Châu, phần 2 câu 1
        {
            id: 13,
            type: "true_false",
            question: "// THPT Phan Bội Châu, phần 2 câu 1\nMột công ty có sản xuất một loại sản phẩm với chi phí để sản xuất một loại sản phẩm là 600 nghìn đồng và bán ra mỗi sản phẩm là 900 nghìn đồng. Biết rằng số lượng sản phẩm bán ra tăng theo số tiền chi cho quảng cáo là $n(x) = a + b.\\ln(1 + x)$ (sản phẩm), trong đó $x$ là số tiền chi cho quảng cáo tính theo đơn vị triệu đồng. Khi không chi cho quảng cáo thì sẽ bán được 400 sản phẩm, khi chi cho quảng cáo $(e^3 - 1)$ triệu đồng thì bán được 750 sản phẩm. Số tiền quảng cáo luôn đảm bảo số lượng sản phẩm bán được là một số nguyên.",
            imageKey: "",
            statements: [
                { id: "a", statement: "Lợi nhuận lớn nhất là 210 triệu đồng (kết quả làm tròn đến hàng đơn vị).", correct: true },
                { id: "b", statement: "Lợi nhuận thu được là $120 + 50\\ln(1 + x) - x$ (triệu đồng).", correct: false },
                { id: "c", statement: "$a + 6b = 1100$.", correct: true },
                { id: "d", statement: "Lợi nhuận thu được lớn nhất khi ta sử dụng số tiền cho quảng cáo là 34 triệu đồng.", correct: true }
            ],
            explanation: "Khi $x = 0 \\Rightarrow a = 400$. Khi $x = e^3 - 1 \\Rightarrow a + 3b = 750 \\Rightarrow b = \\frac{350}{3}$.\n- Ý c: $a + 6b = 400 + 6\\left(\\frac{350}{3}\\right) = 1100$. Đúng.\n- Lãi trên mỗi sản phẩm là $900 - 600 = 300$ nghìn đồng = $0.3$ triệu đồng. Hàm lợi nhuận là: $L(x) = 0.3(a + b\\ln(1+x)) - x = 120 + 35\\ln(1+x) - x$. Do đó ý b sai.\n- Ta có $L'(x) = \\frac{35}{1+x} - 1 = 0 \\Leftrightarrow x = 34$ triệu đồng. Lợi nhuận lớn nhất đạt tại $x = 34$ triệu đồng. Do đó ý d đúng.\n- $L(34) = 120 + 35\\ln(35) - 34 \\approx 210.44 \\approx 210$ triệu đồng. Do đó ý a đúng."
        },

        // THPT Phan Bội Châu, phần 2 câu 2
        {
            id: 14,
            type: "true_false",
            question: "// THPT Phan Bội Châu, phần 2 câu 2\nĐể làm một cửa sổ dạng một hình bán nguyệt và một hình chữ nhật ghép lại như hình vẽ bên dưới, người ta dùng 8 m dây thép để làm các đường viền. Gọi $x, y$ là độ dài cạnh của khung hình chữ nhật.",
            imageKey: "pbc_p2_c2",
            statements: [
                { id: "a", statement: "Giá trị của $y$ tính theo $x$ là $4 - \\frac{x(4 + \\pi)}{4}$.", correct: true },
                { id: "b", statement: "Khi diện tích của cửa sổ lớn nhất thì $y = \\frac{16}{8 + \\pi}$.", correct: true },
                { id: "c", statement: "Diện tích của cửa sổ là $S = 4x - x^2$.", correct: false },
                { id: "d", statement: "Chiều dài dây để uốn ra hình bán nguyệt là $\\frac{\\pi x}{2}$.", correct: true }
            ],
            explanation: "Khung cửa sổ gồm đáy hình chữ nhật ($x$), hai cạnh bên ($2y$), cạnh đỉnh chia đôi ($x$) và cung bán nguyệt bán kính $R = \\frac{x}{2}$ có độ dài $\\frac{\\pi x}{2}$.\n- Ý d: Chiều dài dây làm cung bán nguyệt là $\\pi R = \\frac{\\pi x}{2}$. Đúng.\n- Tổng chiều dài dây: $2x + 2y + \\frac{\\pi x}{2} = 8 \\Rightarrow y = 4 - \\frac{x(4+\\pi)}{4}$. Do đó ý a đúng.\n- Diện tích cửa sổ: $S = xy + \\frac{1}{2}\\pi\\left(\\frac{x}{2}\\right)^2 = x\\left(4 - \\frac{(4+\\pi)x}{4}\\right) + \\frac{\\pi x^2}{8} = 4x - \\frac{8+\\pi}{8}x^2 \\ne 4x - x^2$. Do đó ý c sai.\n- $S'(x) = 4 - \\frac{8+\\pi}{4}x = 0 \\Leftrightarrow x = \\frac{16}{8+\\pi} \\Rightarrow y = 4 - \\frac{4+\\pi}{4}\\cdot\\frac{16}{8+\\pi} = \\frac{16}{8+\\pi}$. Do đó ý b đúng."
        },

        // THPT Phan Bội Châu, phần 2 câu 3
        {
            id: 15,
            type: "true_false",
            question: "// THPT Phan Bội Châu, phần 2 câu 3\nMột cái bình có dạng hình hộp chữ nhật với đáy là hình vuông cạnh $50\\text{ (cm)}$, cạnh bên bằng $80\\text{ (cm)}$ và bên trong đặt một quả cầu sắt có bán kính bằng $20\\text{ (cm)}$. Ban đầu bình không chứa nước. Ta tiến hành dùng một vòi nước cho chảy vào bình với lưu lượng không đổi bằng $x\\text{ (cm}^3\\text{/phút)}$. Biết rằng sau khoảng thời gian 120 phút thì nước trong bình đầy. Chọn gốc thời gian là lúc bắt đầu cho nước chảy vào bình.",
            imageKey: "pbc_p2_c3",
            statements: [
                { id: "a", statement: "Thời gian để nước chảy vào bình đủ để ngập hết quả cầu là 48 phút.", correct: true },
                { id: "b", statement: "Sau 24 phút đầu tiên thì mực nước trong bình có chiều cao là 20 (cm) (kết quả làm tròn đến hàng đơn vị).", correct: true },
                { id: "c", statement: "$x = 1387\\text{ (cm}^3\\text{/phút)}$ (kết quả làm tròn đến hàng đơn vị).", correct: true },
                { id: "d", statement: "Thể tích quả cầu sắt là $33150\\text{ cm}^3$ (kết quả làm tròn đến hàng đơn vị).", correct: false }
            ],
            explanation: "Thể tích bình $V_{binh} = 50^2 \\cdot 80 = 200000\\text{ cm}^3$.\n- Thể tích quả cầu sắt $V_{cau} = \\frac{4}{3}\\pi \\cdot 20^3 \\approx 33510.32\\text{ cm}^3 \\ne 33150\\text{ cm}^3$. Do đó ý d sai.\n- Lượng nước đầy bình: $200000 - 33510.32 = 166489.68\\text{ cm}^3$. Lưu lượng $x = \\frac{166489.68}{120} \\approx 1387\\text{ cm}^3$/phút. Do đó ý c đúng.\n- Để ngập hết quả cầu, chiều cao nước là $40\\text{ cm}$. Thể tích nước cần là $50^2 \\cdot 40 - 33510.32 = 66489.68\\text{ cm}^3$. Thời gian cần là $\\frac{66489.68}{1387.41} \\approx 48$ phút. Do đó ý a đúng.\n- Khi chiều cao nước là $20\\text{ cm}$ (ngập nửa quả cầu), thể tích nước là $50^2 \\cdot 20 - \\frac{33510.32}{2} = 33244.84\\text{ cm}^3$. Thời gian chảy là $\\frac{33244.84}{1387.41} \\approx 24$ phút. Do đó ý b đúng."
        },

        // THPT Phan Bội Châu, phần 2 câu 4
        {
            id: 16,
            type: "true_false",
            question: "// THPT Phan Bội Châu, phần 2 câu 4\nCho hàm số $y = \\frac{x^2 - x + 1}{-x + 1}$.",
            imageKey: "",
            statements: [
                { id: "a", statement: "Tâm đối xứng của đồ thị hàm số là $I(1; -1)$.", correct: true },
                { id: "b", statement: "Hàm số đồng biến trên khoảng $(0; 2)$.", correct: false },
                { id: "c", statement: "Đồ thị hàm số có điểm cực tiểu là $A(0; 1)$.", correct: true },
                { id: "d", statement: "Giá trị lớn nhất của hàm số trên khoảng $(1; +\\infty)$ bằng $-3$.", correct: true }
            ],
            explanation: "Ta có $y = -x - \\frac{1}{x - 1}$.\n- TCĐ $x = 1$, TCX $y = -x$. Giao điểm của hai tiệm cận là $I(1; -1)$, chính là tâm đối xứng. Do đó ý a đúng.\n- $y' = \\frac{-x^2 + 2x}{(x - 1)^2}$. Hàm số không xác định tại $x = 1 \\in (0; 2)$ nên không thể đồng biến trên $(0; 2)$. Do đó ý b sai.\n- $y' = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Qua $x = 0$, $y'$ đổi dấu từ $-$ sang $+$, $y(0) = 1$, do đó $A(0; 1)$ là điểm cực tiểu của đồ thị hàm số. Do đó ý c đúng.\n- Trên $(1; +\\infty)$, hàm số đạt cực đại tại $x = 2$ với $y(2) = -3$. Vì hàm số liên tục trên khoảng này nên GTLN trên $(1; +\\infty)$ bằng $-3$. Do đó ý d đúng."
        },

        // ============================================================================================
        // PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (6 CÂU)
        // ============================================================================================

        // THPT Phan Bội Châu, phần 3 câu 1
        {
            id: 17,
            type: "short_answer",
            question: "// THPT Phan Bội Châu, phần 3 câu 1\nMinh hoạ hình vẽ bên, ở bên trong hình lập phương cạnh 1, có 8 phần hình cầu $O_i\\ (i = 1,2,3,\\dots,8)$ có tâm là các đỉnh của hình lập phương và có bán kính bằng nhau. Có thêm một hình cầu $O_0$ có tâm là tâm của hình lập phương. Biết $O_0$ tiếp xúc với mỗi $O_i\\ (i = 1,2,3,\\dots,8)$. Khi đó giá trị nhỏ nhất của tổng thể tích 9 phần nói trên bằng bao nhiêu? (không làm tròn các kết quả trung gian, chỉ làm tròn kết quả đến hàng phần trăm).",
            imageKey: "pbc_p3_c1",
            correctAnswer: "0.68",
            explanation: "Khoảng cách từ tâm lập phương đến mỗi đỉnh là $d = \\frac{\\sqrt{3}}{2}$. Gọi bán kính các hình cầu đỉnh là $R$, khi đó bán kính hình cầu tâm $O_0$ là $r = \\frac{\\sqrt{3}}{2} - R$.\nTổng thể tích 9 phần nằm trong hình lập phương là:\n$V = 8\\left(\\frac{1}{8}\\cdot \\frac{4}{3}\\pi R^3\\right) + \\frac{4}{3}\\pi r^3 = \\frac{4}{3}\\pi\\left[ R^3 + \\left(\\frac{\\sqrt{3}}{2} - R\\right)^3 \\right]$.\nĐặt $k = \\frac{\\sqrt{3}}{2}$, biểu thức $R^3 + (k - R)^3 = k(3R^2 - 3kR + k^2)$ đạt giá trị nhỏ nhất khi $R = \\frac{k}{2} = \\frac{\\sqrt{3}}{4}$.\nKhi đó $V_{min} = \\frac{4}{3}\\pi \\cdot 2\\left(\\frac{\\sqrt{3}}{4}\\right)^3 = \\frac{\\sqrt{3}\\pi}{8} \\approx 0.68017 \\approx 0.68$."
        },

        // THPT Phan Bội Châu, phần 3 câu 2
        {
            id: 18,
            type: "short_answer",
            question: "// THPT Phan Bội Châu, phần 3 câu 2\nBiết giá trị nhỏ nhất của hàm số $f(x) = 2\\cos^3 x - \\cos 2x$ trên đoạn $\\left[-\\frac{\\pi}{3}; \\frac{\\pi}{3}\\right]$ là $\\frac{a}{b}$ với $a, b \\in \\mathbb{N}$ và $\\frac{a}{b}$ tối giản. Khi đó tích $P = a.b$ bằng bao nhiêu?",
            imageKey: "",
            correctAnswer: "513",
            explanation: "Ta có $f(x) = 2\\cos^3 x - 2\\cos^2 x + 1$. Đặt $t = \\cos x$, với $x \\in \\left[-\\frac{\\pi}{3}; \\frac{\\pi}{3}\\right] \\Rightarrow t \\in \\left[\\frac{1}{2}; 1\\right]$.\nXét $g(t) = 2t^3 - 2t^2 + 1$ trên $\\left[\\frac{1}{2}; 1\\right]$.\n$g'(t) = 6t^2 - 4t = 0 \\Leftrightarrow t = \\frac{2}{3}$ (nhận) hoặc $t = 0$ (loại).\n$g\\left(\\frac{1}{2}\\right) = \\frac{3}{4};\\ g\\left(\\frac{2}{3}\\right) = \\frac{19}{27};\\ g(1) = 1$.\nDo đó giá trị nhỏ nhất là $\\frac{19}{27} \\Rightarrow a = 19, b = 27$.\nVậy $P = a \\cdot b = 19 \\cdot 27 = 513$."
        },

        // THPT Phan Bội Châu, phần 3 câu 3
        {
            id: 19,
            type: "short_answer",
            question: "// THPT Phan Bội Châu, phần 3 câu 3\nCho hình chữ nhật $ABCD$ có một cạnh nằm trên trục hoành và hai đỉnh $A(0; 0), C(6; 4)$. Gọi $H$ là trung điểm của đoạn thẳng $AC$. Đường tròn $(C)$ có tâm $I(3; 1)$ và đi qua $H$. Người ta muốn thiết kế một dải LED bắt đầu từ điểm $A$ và kết thúc tại $C$. Dải LED có hình dạng một phần của đồ thị hàm bậc ba $f(x) = ax^3 + bx^2 + cx + d$. Biết dải LED tiếp xúc với đường tròn $(C)$ tại $H$, tính $27a + 3b + c + 9d$.",
            imageKey: "pbc_p3_c3",
            correctAnswer: "2",
            explanation: "Tọa độ trung điểm $AC$ là $H(3; 2)$.\nVectơ $\\vec{IH} = (0; 1)$, suy ra tiếp tuyến của đường tròn $(C)$ tại $H$ là đường thẳng nằm ngang $y = 2$ (hệ số góc $k = 0$).\nDo đồ thị $y = f(x)$ tiếp xúc với $(C)$ tại $H(3; 2)$, đi qua $A(0; 0)$ và $C(6; 4)$, ta có hệ điều kiện:\n1) $f(0) = 0 \\Rightarrow d = 0$.\n2) $f(3) = 27a + 9b + 3c = 2$.\n3) $f'(3) = 27a + 6b + c = 0$.\n4) $f(6) = 216a + 36b + 6c = 4$.\nGiải hệ phương trình ta được: $a = \\frac{2}{27};\\ b = -\\frac{2}{3};\\ c = 2;\\ d = 0$.\nVậy $27a + 3b + c + 9d = 27\\left(\\frac{2}{27}\\right) + 3\\left(-\\frac{2}{3}\\right) + 2 + 0 = 2 - 2 + 2 = 2$."
        },

        // THPT Phan Bội Châu, phần 3 câu 4
        {
            id: 20,
            type: "short_answer",
            question: "// THPT Phan Bội Châu, phần 3 câu 4\nMột con cá bơi ngược dòng nước với khoảng cách là 300 km. Vận tốc dòng nước là 6 (km/h). Nếu vận tốc bơi của cá khi nước đứng yên là $v$ (km/h) thì năng lượng tiêu hao của cá trong $t$ giờ được cho bởi công thức $E(v) = cv^3 t$ (trong đó $c$ là hằng số dương, $E$ được tính bằng đơn vị Jun). Cá bơi ngược dòng quãng đường 300 km trên trong khoảng thời gian $t$ với vận tốc bằng bao nhiêu để năng lượng tiêu hao là thấp nhất?",
            imageKey: "",
            correctAnswer: "9",
            explanation: "Vận tốc thực tế của cá khi bơi ngược dòng là $v - 6$ ($v > 6$).\nThời gian bơi hết 300 km là $t = \\frac{300}{v - 6}$.\nNăng lượng tiêu hao: $E(v) = 300c \\cdot \\frac{v^3}{v - 6}$.\nXét hàm số $g(v) = \\frac{v^3}{v - 6}$ với $v > 6$.\n$g'(v) = \\frac{2v^2(v - 9)}{(v - 6)^2} = 0 \\Leftrightarrow v = 9$.\nHàm số đạt giá trị nhỏ nhất tại $v = 9$ (km/h)."
        },

        // THPT Phan Bội Châu, phần 3 câu 5
        {
            id: 21,
            type: "short_answer",
            question: "// THPT Phan Bội Châu, phần 3 câu 5\nMột vệ tinh rời quỹ đạo Trái Đất theo đường cong $y = \\frac{3x^2 - x + 5}{x - 1}\\ (x > 1,\\text{ đơn vị km})$. Có 2 chùm tia laser tham chiếu được phóng dọc theo hai đường tiệm cận của quỹ đạo này. Các kỹ sư nhận thấy, cho dù vệ tinh $M$ bay đến đâu trên quỹ đạo, tích khoảng cách từ $M$ đến hai chùm tia laser luôn là một hằng số an toàn $C$. Tính giá trị của $\\frac{10}{7}C^2$?",
            imageKey: "",
            correctAnswer: "7",
            explanation: "Ta có $y = 3x + 2 + \\frac{7}{x - 1}$.\nHai đường tiệm cận của quỹ đạo là $\\Delta_1: x - 1 = 0$ và $\\Delta_2: 3x - y + 2 = 0$.\nVới mọi điểm $M(x_0; y_0)$ thuộc đồ thị ($x_0 > 1$):\n$d(M, \\Delta_1) = x_0 - 1$.\n$d(M, \\Delta_2) = \\frac{|3x_0 - y_0 + 2|}{\\sqrt{3^2 + (-1)^2}} = \\frac{\\frac{7}{x_0 - 1}}{\\sqrt{10}}$.\nTích khoảng cách: $C = d(M, \\Delta_1) \\cdot d(M, \\Delta_2) = \\frac{7}{\\sqrt{10}}$.\nVậy $\\frac{10}{7} C^2 = \\frac{10}{7} \\cdot \\left(\\frac{7}{\\sqrt{10}}\\right)^2 = \\frac{10}{7} \\cdot \\frac{49}{10} = 7$."
        },

        // THPT Phan Bội Châu, phần 3 câu 6
        {
            id: 22,
            type: "short_answer",
            question: "// THPT Phan Bội Châu, phần 3 câu 6\nTừ một tấm bìa mỏng hình vuông cạnh 6 dm, cắt bỏ bốn tam giác cân bằng nhau có cạnh đáy là cạnh của hình vuông ban đầu và đỉnh là đỉnh của một hình vuông nhỏ phía trong rồi gấp lên, ghép lại tạo thành một khối chóp tứ giác đều như hình sau. Thể tích của khối chóp có giá trị lớn nhất bằng bao nhiêu decimet khối (Kết quả làm tròn đến hàng phần chục).",
            imageKey: "pbc_p3_c6",
            correctAnswer: "7.3",
            explanation: "Gọi $x$ ($0 < x < 3$) là khoảng cách từ tâm hình vuông đến đỉnh của hình vuông nhỏ.\nKhi đó đáy khối chóp là hình vuông có đường chéo $2x$, cạnh đáy $b = x\\sqrt{2} \\Rightarrow S_{day} = 2x^2$.\nCạnh bên khối chóp có độ dài bình phương $s^2 = (3 - x)^2 + 3^2 = x^2 - 6x + 18$.\nChiều cao của khối chóp là $h = \\sqrt{s^2 - x^2} = \\sqrt{18 - 6x} = \\sqrt{6(3 - x)}$.\nThể tích khối chóp: $V = \\frac{1}{3} S_{day} \\cdot h = \\frac{2}{3} x^2 \\sqrt{6(3 - x)}$.\nXét $f(x) = x^4 (3 - x)$ trên $(0; 3) \\Rightarrow f'(x) = x^3(12 - 5x) = 0 \\Leftrightarrow x = 2.4$.\nKhi đó $V_{max} = \\frac{2}{3} (2.4)^2 \\sqrt{6(3 - 2.4)} = 3.84 \\sqrt{3.6} \\approx 7.286 \\approx 7.3\\text{ dm}^3$."
        }
    ]
};

/*
// ============================================================================================
// BẢNG ĐÁP ÁN CHI TIẾT ĐỀ THI GIỮA KỲ 1 TOÁN 12 - THPT PHAN BỘI CHÂU (MÃ ĐỀ: 1108)
// ============================================================================================

Phần 1: Trắc nghiệm 4 lựa chọn
Câu 1: A  // THPT Phan Bội Châu, phần 1 câu 1
Câu 2: A  // THPT Phan Bội Châu, phần 1 câu 2
Câu 3: C  // THPT Phan Bội Châu, phần 1 câu 3
Câu 4: A  // THPT Phan Bội Châu, phần 1 câu 4
Câu 5: D  // THPT Phan Bội Châu, phần 1 câu 5
Câu 6: B  // THPT Phan Bội Châu, phần 1 câu 6
Câu 7: C  // THPT Phan Bội Châu, phần 1 câu 7
Câu 8: A  // THPT Phan Bội Châu, phần 1 câu 8
Câu 9: B  // THPT Phan Bội Châu, phần 1 câu 9
Câu 10: A // THPT Phan Bội Châu, phần 1 câu 10
Câu 11: D // THPT Phan Bội Châu, phần 1 câu 11
Câu 12: C // THPT Phan Bội Châu, phần 1 câu 12

Phần 2: Trắc nghiệm Đúng / Sai
Câu 1: Đ - S - Đ - Đ // THPT Phan Bội Châu, phần 2 câu 1
Câu 2: Đ - Đ - S - Đ // THPT Phan Bội Châu, phần 2 câu 2
Câu 3: Đ - Đ - Đ - S // THPT Phan Bội Châu, phần 2 câu 3
Câu 4: Đ - S - Đ - Đ // THPT Phan Bội Châu, phần 2 câu 4

Phần 3: Trả lời ngắn
Câu 1: 0.68  // THPT Phan Bội Châu, phần 3 câu 1
Câu 2: 513   // THPT Phan Bội Châu, phần 3 câu 2
Câu 3: 2     // THPT Phan Bội Châu, phần 3 câu 3
Câu 4: 9     // THPT Phan Bội Châu, phần 3 câu 4
Câu 5: 7     // THPT Phan Bội Châu, phần 3 câu 5
Câu 6: 7.3   // THPT Phan Bội Châu, phần 3 câu 6
*/