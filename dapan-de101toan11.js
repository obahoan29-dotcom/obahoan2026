const dapanData = {
    maDe: "DE101TOAN11",
    answers: {
        // ==================== PHẦN I. TRẮC NGHIỆM ĐƠN ====================
        // Ghi số index 0,1,2,3 tương ứng A,B,C,D hoặc ghi thẳng "A", "B", "C", "D"
        "1": { correct: 3, explanation: "Ta có: $\\dfrac{\\pi}{24} = \\dfrac{180^\\circ}{24} = 7,5^\\circ = 7^\\circ 30'$." },
        "2": { correct: 2, explanation: "Công thức cộng của hàm số tang là: $\\tan(a + b) = \\dfrac{\\tan a + \\tan b}{1 - \\tan a \\tan b}$." },
        "3": { correct: 3, explanation: "Hàm số $y = \\cot x = \\dfrac{\\cos x}{\\sin x}$ xác định khi $\\sin x \\ne 0 \\Leftrightarrow x \\ne k\\pi \\ (k \\in \\mathbb{Z})$." },
        "4": { correct: 2, explanation: "Giá trị đại diện của nhóm $[30; 40)$ là $\\dfrac{30 + 40}{2} = 35$." },
        "5": { correct: 1, explanation: "Ta có: $\\dfrac{u_3}{u_8} = \\dfrac{u_1 q^2}{u_1 q^7} = \\dfrac{1}{q^5} = 243 = 3^5 \\Rightarrow q^5 = \\left(\\dfrac{1}{3}\\right)^5 \\Rightarrow q = \\dfrac{1}{3}$. Do đó: $u_9 = u_1 \\cdot q^8 = 12 \\cdot \\left(\\dfrac{1}{3}\\right)^8 = \\dfrac{12}{6561} = \\dfrac{4}{2187}$." },
        "6": { correct: 2, explanation: "Thay $n = 3$ vào công thức ta được $u_3 = \\dfrac{3 + 1}{3} = \\dfrac{4}{3}$." },
        "7": { correct: 3, explanation: "$\\cos x = -\\dfrac{1}{2} = \\cos\\dfrac{2\\pi}{3} \\Leftrightarrow x = \\pm \\dfrac{2\\pi}{3} + k2\\pi \\ (k \\in \\mathbb{Z})$." },
        "8": { correct: 1, explanation: "Cỡ mẫu $n = 20$. Ta có $\\dfrac{n}{2} = 10$. Tần số tích lũy của nhóm [5; 7) là 2, của nhóm [7; 9) là $2 + 7 = 9 < 10$, của nhóm [9; 11) là $9 + 7 = 16 \\ge 10$. Vậy nhóm chứa trung vị là $[9; 11)$." },
        "9": { correct: 1, explanation: "Quan hệ giữa điểm và mặt phẳng dùng kí hiệu thuộc ($\\in$) hoặc không thuộc ($\\notin$). Vì điểm $A$ nằm trên $(P)$ nên $A \\in (P)$." },
        "10": { correct: 2, explanation: "Vì $x \\in \\left(-\\dfrac{\\pi}{2}; 0\\right)$ nên $\\sin x < 0 \\Rightarrow \\sin x = -\\sqrt{1 - \\cos^2 x} = -\\sqrt{1 - \\dfrac{16}{25}} = -\\dfrac{3}{5}$. Do đó $\\sin 2x = 2\\sin x \\cos x = 2\\left(-\\dfrac{3}{5}\\right)\\left(\\dfrac{4}{5}\\right) = -\\dfrac{24}{25}$." },
        "11": { correct: 2, explanation: "Ta có $u_8 = u_1 + 7d \\Leftrightarrow 26 = \\dfrac{1}{3} + 7d \\Leftrightarrow 7d = \\dfrac{77}{3} \\Leftrightarrow d = \\dfrac{11}{3}$." },
        "12": { correct: 1, explanation: "Vì $\\dfrac{\\pi}{2} < \\alpha < \\pi$ nên $\\cos\\alpha < 0$. Suy ra $\\cos\\alpha = -\\sqrt{1 - \\sin^2\\alpha} = -\\sqrt{1 - \\dfrac{16}{25}} = -\\dfrac{3}{5}$." },
        "13": { correct: 0, explanation: "Hai đường thẳng đồng phẳng và không có điểm chung là hai đường thẳng song song." },
        "14": { correct: 0, explanation: "Hàm số $y = \\cos x$ thỏa mãn $\\cos(-x) = \\cos x$ với mọi $x \\in \\mathbb{R}$ nên là hàm số chẵn." },
        "15": { correct: 0, explanation: "$\\cos x = -\\dfrac{1}{2} = \\cos\\dfrac{2\\pi}{3} \\Leftrightarrow x = \\pm \\dfrac{2\\pi}{3} + k2\\pi \\ (k \\in \\mathbb{Z})$." },
        "16": { correct: 2, explanation: "Dãy số $1; -3; -7; -11; -15$ có hiệu hai số hạng liên tiếp không đổi: $(-3) - 1 = (-7) - (-3) = (-11) - (-7) = -4$ nên là cấp số cộng có $u_1 = 1, d = -4$." },
        "17": { correct: 1, explanation: "Trong tam giác $SAC$, $O$ là trung điểm $AC$ và $M$ là trung điểm $SA$ nên $OM$ là đường trung bình, suy ra $OM \\parallel SC$. Vì $SC \\subset (SBC)$ và $OM \\not\\subset (SBC)$ nên $OM \\parallel (SBC)$." },
        "18": { correct: 1, explanation: "$S$ là điểm chung thứ nhất. Vì $M \\in BC \\subset (SBC)$ nên $M$ là điểm chung thứ hai. Vậy giao tuyến là $SM$." },
        "19": { correct: 0, explanation: "Hàm số $y = \\sin(\\omega x)$ có chu kì $T = \\dfrac{2\\pi}{|\\omega|} = \\dfrac{2\\pi}{2} = \\pi$." },
        "20": { correct: 1, explanation: "Ta có: $108^\\circ = 108 \\cdot \\dfrac{\\pi}{180} = \\dfrac{3\\pi}{5}$ rad." },
        "21": { correct: 1, explanation: "Dãy $-1; -2; -4; -8$ có tỉ số giữa số hạng sau và số hạng trước là hằng số: $\\dfrac{-2}{-1} = \\dfrac{-4}{-2} = \\dfrac{-8}{-4} = 2$ nên là cấp số nhân." },
        "22": { correct: 3, explanation: "Ta có: $S_{10} = u_1 \\dfrac{1 - q^{10}}{1 - q} = 4 \\cdot \\dfrac{1 - (-3)^{10}}{1 - (-3)} = 4 \\cdot \\dfrac{1 - 59049}{4} = -59048$." },
        "23": { correct: 2, explanation: "Theo công thức cộng lượng giác: $\\cos(a + b) = \\cos a \\cos b - \\sin a \\sin b$." },
        "24": { correct: 0, explanation: "Cỡ mẫu $n = 10 + 9 + 10 + 3 + 2 = 34$. Ta có $\\dfrac{n}{4} = 8,5$. Do $m_1 = 10 > 8,5$ nên nhóm chứa $Q_1$ là nhóm 1: $[1; 3,5)$. Khi đó $Q_1 = 1 + \\dfrac{8,5 - 0}{10} \\cdot (3,5 - 1) = 1 + 0,85 \\cdot 2,5 = 3,125 = \\dfrac{25}{8}$." },
        "25": { correct: 3, explanation: "$\\tan x = \\dfrac{1}{\\sqrt{3}} = \\tan\\dfrac{\\pi}{6} \\Leftrightarrow x = \\dfrac{\\pi}{6} + k\\pi \\ (k \\in \\mathbb{Z})$." },
        "26": { correct: 2, explanation: "Áp dụng công thức: $S_7 = \\dfrac{7}{2}[2u_1 + 6d] = \\dfrac{7}{2}[2(13) + 6(15)] = \\dfrac{7}{2}(26 + 90) = 406$." },
        "27": { correct: 1, explanation: "Công sai: $d = u_9 - u_8 = -3 - (-10) = 7$." },
        "28": { correct: 1, explanation: "Khi $a$ thuộc góc phần tư thứ II thì $\\sin a > 0, \\cos a < 0, \\tan a < 0, \\cot a < 0$." },
        "29": { correct: 3, explanation: "Công thức nhân đôi: $\\sin 2a = 2\\sin a \\cos a$." },
        "30": { correct: 0, explanation: "$S$ là điểm chung thứ nhất. Trong đáy $ABCD$, $AC \\cap BD = O \\Rightarrow O$ là điểm chung thứ hai. Vậy giao tuyến là $SO$." },
        "31": { correct: 0, explanation: "Chu vi bánh xe là $C = \\pi d = 100\\pi\\text{ cm}$. Khi quay 5 vòng quãng đường đi được là $s = 5C = 500\\pi\\text{ cm}$." },
        "32": { correct: 1, explanation: "Ta có $1 + \\tan^2\\alpha = \\dfrac{1}{\\cos^2\\alpha} \\Rightarrow \\cos^2\\alpha = \\dfrac{1}{1 + 5} = \\dfrac{1}{6}$. Do $\\pi < \\alpha < \\dfrac{3\\pi}{2}$ (góc phần tư thứ III) nên $\\cos\\alpha < 0 \\Rightarrow \\cos\\alpha = -\\dfrac{1}{\\sqrt{6}} = -\\dfrac{\\sqrt{6}}{6}$." },
        "33": { correct: 0, explanation: "Trong mặt phẳng $(SBD)$, $OM$ cắt $SD$. Mà $O \\in AC \\subset (ACM)$ và $M \\in (ACM)$ nên $OM \\subset (ACM)$. Do đó giao điểm của $SD$ và $(ACM)$ chính là giao điểm của $SD$ và $OM$." },
        "34": { correct: 2, explanation: "$\\sin\\left(\\dfrac{2x}{3} - \\dfrac{\\pi}{3}\\right) = 0 \\Leftrightarrow \\dfrac{2x}{3} - \\dfrac{\\pi}{3} = k\\pi \\Leftrightarrow \\dfrac{2x}{3} = \\dfrac{\\pi}{3} + k\\pi \\Leftrightarrow x = \\dfrac{\\pi}{2} + \\dfrac{k3\\pi}{2} \\ (k \\in \\mathbb{Z})$." },
        "35": { correct: 3, explanation: "$2\\cos x = -1 \\Leftrightarrow \\cos x = -\\dfrac{1}{2} = \\cos\\dfrac{2\\pi}{3} \\Leftrightarrow x = \\pm \\dfrac{2\\pi}{3} + k2\\pi \\ (k \\in \\mathbb{Z})$." },

        // ==================== PHẦN II. ĐÚNG SAI ====================
        "36": {
            statements: { "a": true, "b": false, "c": false, "d": true },
            explanation: "a) $u_n = u_1 + (n - 1)d = -3 + 2(n - 1) = 2n - 5$ (Đúng).\nb) $u_{100} = 2(100) - 5 = 195 \\ne 190$ (Sai).\nc) $S_{100} = \\dfrac{100}{2}[2(-3) + 99(2)] = 50(192) = 9600 \\ne 9350$ (Sai).\nd) Các số hạng chẵn lập thành cấp số cộng gồm 50 số hạng với số hạng đầu $u_2 = -1$, công sai $d' = 2d = 4$. Tổng $= \\dfrac{50}{2}[2(-1) + 49(4)] = 25(194) = 4850$ (Đúng)."
        },
        "37": {
            statements: { "a": false, "b": true, "c": false, "d": true },
            explanation: "a) $\\bar{x} = \\dfrac{8,5 \\cdot 5 + 8,7 \\cdot 12 + 8,9 \\cdot 25 + 9,1 \\cdot 44 + 9,3 \\cdot 14}{100} = \\dfrac{900}{100} = 9,0\\text{ m} \\ne 8,9$ (Sai).\nb) Có đúng 5 nhóm số liệu (Đúng).\nc) $Q_1 = 8,864$, $Q_3 = 9,15 \\Rightarrow \\Delta_Q = Q_3 - Q_1 = 0,286 \\ne 2,06$ (Sai).\nd) Nhóm [9,0; 9,2) có giá trị đại diện là 9,1m có tần số lớn nhất là 44 (Đúng)."
        },
        "38": {
            statements: { "a": true, "b": true, "c": false, "d": true },
            explanation: "a) $u_n = 3n - 1$. Nhóm 1 (11 số): tổng = 484; nhóm 2 (21 số): tổng = 2499; nhóm 3 (21 số): tổng = 4389. Tổng $S = 484 + 2499 + 4389 = 7372$ (Đúng).\nb) $S_n = \\dfrac{n(3n+1)}{2} = 610 \\Leftrightarrow 3n^2 + n - 1220 = 0 \\Leftrightarrow n = 20 \\in [18; 22]$ (Đúng).\nc) $u_n = 3n - 1 = 152 \\Leftrightarrow 3n = 153 \\Leftrightarrow n = 51 \\notin [45; 50]$ (Sai).\nd) $u_n = 2 + (n - 1)3 = 3n - 1$ (Đúng)."
        },
        "39": {
            statements: { "a": true, "b": true, "c": false, "d": false },
            explanation: "a) Do $\\dfrac{3\\pi}{2} < \\alpha < 2\\pi$ nên $\\cos\\alpha > 0$ (Đúng).\nb) $\\cos\\alpha = \\sqrt{1 - \\sin^2\\alpha} = \\dfrac{5}{13}$ (Đúng).\nc) $\\tan\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha} = -\\dfrac{12}{5} \\ne \\dfrac{12}{5}$ (Sai).\nd) $\\cos\\left(\\dfrac{\\pi}{3} - \\alpha\\right) = \\cos\\dfrac{\\pi}{3}\\cos\\alpha + \\sin\\dfrac{\\pi}{3}\\sin\\alpha = \\dfrac{1}{2}\\cdot\\dfrac{5}{13} + \\dfrac{\\sqrt{3}}{2}\\left(-\\dfrac{12}{13}\\right) = \\dfrac{5 - 12\\sqrt{3}}{26} \\ne \\dfrac{5 - \\sqrt{3}}{26}$ (Sai)."
        },
        "40": {
            statements: { "a": false, "b": false, "c": true, "d": true },
            explanation: "a) Giao tuyến của $(SBC)$ và $(SAD)$ là đường thẳng qua $S$ song song với $BC$. Kẻ $d$ qua $S$ song song với $BC$ cắt $KE$ tại $H$. Ta tính được tỉ số $\\dfrac{HE}{HK} = \\dfrac{2}{3} \\approx 0,67 \\ne 0,76$ (Sai).\nb) $\\dfrac{SK}{SB} = \\dfrac{1}{2} \\ne \\dfrac{1}{3} = \\dfrac{SE}{SC}$ nên $KE$ không song song với $BC$ (Sai).\nc) Do $E \\in SC \\subset (SCD)$ nên $E \\in (SCD)$ (Đúng).\nd) Vì $BC \\parallel AD$ và $AD \\subset (SAD), BC \\not\\subset (SAD)$ nên $BC \\parallel (SAD)$ (Đúng)."
        },
        "41": {
            statements: { "a": true, "b": false, "c": true, "d": false },
            explanation: "a) $SA$ và $CD$ không đồng phẳng nên chéo nhau (Đúng).\nb) Hai cạnh bên $AD$ và $BC$ của hình thang cắt nhau nên $AD$ cắt $(SBC)$ (Sai).\nc) Hai mặt phẳng lần lượt chứa hai đường thẳng song song $AB$ và $CD$ có điểm chung $S$ nên giao tuyến đi qua $S$ và song song với $AB, CD$ (Đúng).\nd) $HK = \\dfrac{2}{3}DC$. Để $ABKH$ là hình bình hành thì $HK = AB \\Leftrightarrow \\dfrac{2}{3}DC = AB \\Leftrightarrow DC = \\dfrac{3}{2}AB \\ne 3AB$ (Sai)."
        },

        // ==================== PHẦN III. TRẢ LỜI NGẮN ====================
        "42": { correctAnswer: "14", explanation: "$u_5 = u_1 q^4 \\Rightarrow -27 = u_1 (-3)^4 = 81u_1 \\Rightarrow u_1 = -\\dfrac{1}{3}$. Ta có: $u_n = -\\dfrac{1}{3} (-3)^{n-1} = 531441 = 3^{12} \\Leftrightarrow (-3)^{n-1} = -3^{13} = (-3)^{13} \\Rightarrow n - 1 = 13 \\Rightarrow n = 14$." },
        "43": { correctAnswer: "0.8", explanation: "Vì $0 < \\alpha < \\dfrac{\\pi}{2}$ nên $\\sin\\alpha > 0$. Ta có: $\\sin\\alpha = \\sqrt{1 - \\cos^2\\alpha} = \\sqrt{1 - \\dfrac{9}{25}} = \\dfrac{4}{5} = 0.8$." },
        "44": { correctAnswer: "202", explanation: "Số tiền sau 2 tháng: $A = 200(1 + 0,005)^2 = 200(1,005)^2 = 202,005 \\approx 202$ triệu đồng." },
        "45": { correctAnswer: "24.8", explanation: "Giá trị đại diện các nhóm lần lượt là: $18,3; 21,3; 24,3; 27,3; 30,3$. Tổng số tháng $n = 12$. $\\bar{x} = \\dfrac{18,3 \\cdot 2 + 21,3 \\cdot 3 + 24,3 \\cdot 2 + 27,3 \\cdot 1 + 30,3 \\cdot 4}{12} = \\dfrac{297,6}{12} = 24,8^\\circ\\text{C}$." },
        "46": { correctAnswer: "4", explanation: "Từ hệ: $u_6 = 26 - 10 = 16$. Ta có $u_6 - u_4 = 2d \\Leftrightarrow 16 - 10 = 2d \\Rightarrow d = 3$. Lại có $u_4 = u_1 + 3d \\Rightarrow 10 = u_1 + 3(3) \\Rightarrow u_1 = 1$. Vậy $u_1 + d = 1 + 3 = 4$." },
        "47": { correctAnswer: "250", explanation: "$\\cos 3x = -\\cos 2x = \\cos(\\pi - 2x) \\Leftrightarrow x = \\dfrac{\\pi + k2\\pi}{5}$ hoặc $x = -\\pi + k2\\pi$. Tập nghiệm thứ hai là tập con của tập nghiệm thứ nhất (ứng với các nghiệm lẻ). Xét $x = \\dfrac{(2k+1)\\pi}{5} \\in (-50\\pi; 50\\pi) \\Leftrightarrow -250 < 2k + 1 < 250 \\Leftrightarrow -125,5 < k < 124,5 \\Rightarrow k \\in \\{-125; \\dots; 124\\}$. Có tất cả 250 nghiệm." },
        "48": { correctAnswer: "25", explanation: "Số cây là cấp số cộng có $u_1 = 12, d = 3, n = 20$. Tổng số cây: $S_{20} = \\dfrac{20}{2}[2(12) + 19(3)] = 10(24 + 57) = 810$ cây. Chi phí mỗi cây: $\\dfrac{20250000}{810} = 25000$ đồng = 25 nghìn đồng." },
        "49": { correctAnswer: "45.7", explanation: "Doanh thu các tháng 7 đến 12 tạo thành cấp số nhân với số hạng đầu $u_7 = 3,5 \\cdot 1,08$ và công bội $q = 1,08$. Tổng 6 tháng cuối: $S = u_7 \\dfrac{q^6 - 1}{q - 1} = 3,5 \\cdot 1,08 \\cdot \\dfrac{1,08^6 - 1}{0,08} \\approx 27,73$ tỷ đồng. Tổng doanh thu cả năm: $18 + 27,73 \\approx 45,7$ tỷ đồng." },
        "50": { correctAnswer: "15", explanation: "Mức phạt là cấp số cộng có $u_1 = 4000, d = 1000$. Tổng phạt sau $n$ ngày: $S_n = \\dfrac{n}{2}[2(4000) + (n - 1)1000] = 500n^2 + 3500n \\le 165000 \\Leftrightarrow n^2 + 7n - 330 \\le 0 \\Leftrightarrow (n - 15)(n + 22) \\le 0 \\Rightarrow n \\le 15$. Vậy tối đa 15 ngày." },
        "51": { correctAnswer: "7", explanation: "Kéo dài $MN$ cắt $AD$ tại $E$. Do $N$ là trung điểm $CD$ và $MN \\parallel BD$ nên $D$ là trung điểm $AE \\Rightarrow \\dfrac{EA}{ED} = 3$. Trong $(SAD)$, $EP$ cắt $SA$ tại $I$. Áp dụng định lý Menelaus cho $\\triangle SAD$ với cát tuyến $E, I, P$: $\\dfrac{IS}{IA} \\cdot \\dfrac{EA}{ED} \\cdot \\dfrac{PD}{PS} = 1 \\Rightarrow \\dfrac{IS}{IA} \\cdot 3 \\cdot 1 = 1 \\Rightarrow \\dfrac{IS}{IA} = \\dfrac{1}{3}$. Do đó $a = 1, b = 3 \\Rightarrow a + 2b = 1 + 2(3) = 7$." },
        "52": { correctAnswer: "45", explanation: "Vận tốc $v = 12\\text{ km/h} = \\dfrac{10}{3}\\text{ m/s}$. Quãng đường đi được trong 21s: $s = \\dfrac{10}{3} \\cdot 21 = 70\\text{ m}$. Chu vi bánh xe: $C = \\pi d = 0,5\\pi\\text{ m}$. Số vòng quay: $N = \\dfrac{70}{0,5\\pi} = \\dfrac{140}{\\pi} \\approx 44,56 \\approx 45$ vòng." },
        "53": { correctAnswer: "199", explanation: "Hệ tương đương: $\\begin{cases} (u_1 + d) - (u_1 + 2d) + (u_1 + 4d) = 7 \\\\ u_1 + (u_1 + 5d) = 12 \\end{cases} \\Leftrightarrow \\begin{cases} u_1 + 3d = 7 \\\\ 2u_1 + 5d = 12 \\end{cases} \\Leftrightarrow \\begin{cases} u_1 = 1 \\\\ d = 2 \\end{cases}$. Số hạng thứ 100: $u_{100} = u_1 + 99d = 1 + 99(2) = 199$." },

        // ==================== PHẦN IV. TỰ LUẬN ====================
        "54": { correctAnswer: "32(1 - (1/2)^100)", explanation: "Diện tích $S_1 = 4^2 = 16$. Hình vuông tiếp theo có cạnh bằng $\\sqrt{2^2 + 2^2} = 2\\sqrt{2} \\Rightarrow S_2 = 8 = \\dfrac{1}{2}S_1$. Dãy $(S_n)$ là cấp số nhân có $S_1 = 16, q = \\dfrac{1}{2}$. Tổng 100 số hạng: $S = S_1 \\cdot \\dfrac{1 - q^{100}}{1 - q} = 16 \\cdot \\dfrac{1 - (1/2)^{100}}{1/2} = 32\\left(1 - \\dfrac{1}{2^{100}}\\right)$." },
        "55": { correctAnswer: "4", explanation: "$8,6\\cos\\left(8t + \\dfrac{\\pi}{2}\\right) = 4,3 \\Leftrightarrow \\cos\\left(8t + \\dfrac{\\pi}{2}\\right) = \\dfrac{1}{2} = \\cos\\dfrac{\\pi}{3} \\Leftrightarrow 8t + \\dfrac{\\pi}{2} = \\pm \\dfrac{\\pi}{3} + k2\\pi$.\n- Nhánh 1: $t = -\\dfrac{\\pi}{48} + \\dfrac{k\\pi}{4}$. Do $t \\in (0; 2) \\Rightarrow k \\in \\{1; 2\\}$ (cho 2 nghiệm).\n- Nhánh 2: $t = -\\dfrac{5\\pi}{48} + \\dfrac{k\\pi}{4}$. Do $t \\in (0; 2) \\Rightarrow k \\in \\{1; 2\\}$ (cho 2 nghiệm).\nTổng cộng có 4 thời điểm." },
        "56": { correctAnswer: "256", explanation: "Tốc độ quay: $10 / 5 = 2$ vòng/giây. Trong 1 phút (60 giây), bánh xe quay được: $2 \\cdot 60 = 120$ vòng. Chu vi bánh xe là $C = \\pi d = 3,14 \\cdot 0,68 = 2,1352\\text{ m}$. Quãng đường đi được: $s = 120 \\cdot 2,1352 = 256,224\\text{ m} \\approx 256\\text{ m}$." },
        "57": { correctAnswer: "171", explanation: "Thành phố có nhiều giờ ánh sáng nhất khi hàm sin đạt giá trị lớn nhất bằng 1: $\\sin\\left[\\dfrac{\\pi}{182}(t - 80)\\right] = 1 \\Leftrightarrow \\dfrac{\\pi}{182}(t - 80) = \\dfrac{\\pi}{2} + k2\\pi \\Leftrightarrow t - 80 = 91 + 364k \\Leftrightarrow t = 171 + 364k$. Vì $0 < t \\le 365$, ta chọn $k = 0 \\Rightarrow t = 171$." },
        "58": { correctAnswer: "4", explanation: "Trong mặt phẳng $(SAC)$, $AN$ cắt $SO$ tại trọng tâm $I$ của $\\triangle SAC$, nên $\\vec{OI} = \\dfrac{1}{3}\\vec{OS}$. Gọi $E = MC \\cap BD \\Rightarrow \\vec{OE} = \\dfrac{1}{3}\\vec{OB}$. Trong $(SMC)$, $MN$ cắt $SE$ tại $J$, theo định lý Menelaus ta được $\\vec{OJ} = \\dfrac{1}{4}\\vec{OB} + \\dfrac{1}{4}\\vec{OS}$. Suy ra $\\vec{BJ} = \\dfrac{3}{4}\\vec{BI}$, tức là ba điểm $B, J, I$ thẳng hàng với $J$ nằm giữa $B, I$ và $BJ = \\dfrac{3}{4}BI \\Rightarrow IJ = \\dfrac{1}{4}IB \\Rightarrow \\dfrac{IB}{IJ} = 4$." },
        "59": { correctAnswer: "5", explanation: "Vì $I, J$ lần lượt là trung điểm của $AD, AC$ nên $IJ \\parallel CD$. Mặt phẳng $(GIJ)$ chứa $IJ \\parallel CD$ nên giao tuyến của $(GIJ)$ với $(BCD)$ là đường thẳng qua $G$ song song với $CD$, cắt $BC, BD$ lần lượt tại $M$ và $N$. Do $MN \\parallel CD$, theo định lý Ta-lét trong tam giác $BCD$: $\\dfrac{BM}{BC} = \\dfrac{BG}{BK} = \\dfrac{2}{3}$ (với $K$ là trung điểm $CD$). Do đó $a = 2, b = 3 \\Rightarrow a + b = 2 + 3 = 5$." }
    }
};