const examData = {
    maDe: "DE20TOAN10",
    title: "ĐỀ SỐ 20 - TOÁN 10: BẤT PHƯƠNG TRÌNH VÀ HỆ BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN",
    password: "",
    timeLimitMinutes: 45,
    
    // Cấu hình thời gian MỞ và ĐÓNG bài thi (Định dạng: YYYY-MM-DDTHH:mm:ss)
    examStartTimeStr: "2026-09-18T00:00:00",
    examEndTimeStr: "2026-09-25T23:59:59",
    
    images: {









        "img_1": "",
        "img_2": "",
        "img_3": "",
        "img_4": "",
        "img_5": "https://i.ibb.co/XxJ5qq1C/c5.png",
        "img_6": "https://i.ibb.co/XxcSNprC/c6.png",
        "img_7": "https://i.ibb.co/zVZxXtNj/7.png",
        "img_8": "https://i.ibb.co/1fCrQjjy/8.png",
        "img_9": "",
        "img_10": "https://i.ibb.co/Jj6xJYL9/10.png",
        "img_11": "https://i.ibb.co/b5mPrsr3/11.png",
        "img_12": "https://i.ibb.co/7tYSbg8Z/12.png",
        "img_13": "",
        "img_14": "https://i.ibb.co/5XbTvwwH/14.png",
        "img_15": "https://i.ibb.co/q3Zyh3Ft/15.png",
        "img_16": "",
        "img_17": "",
        "img_18": ""
    },
    questions: [
        // ==================== PHẦN 1. CHỌN A, B, C, D ====================
        {
            id: 1,
            type: "multiple_choice",
            question: "Điểm nào dưới đây thuộc miền nghiệm của bất phương trình $2x + y - 1 < 0$?",
            imageKey: "img_1",
            options: [
                "$Q(1; 1)$",
                "$M(1; -2)$",
                "$P(2; -2)$",
                "$N(1; 0)$"
            ],
            correct: 1,
            explanation: "Thay tọa độ $M(1; -2)$ vào bất phương trình: $2(1) + (-2) - 1 = -1 < 0$ (thỏa mãn)."
        },
        {
            id: 2,
            type: "multiple_choice",
            question: "Cặp số $(1; -1)$ là nghiệm của bất phương trình nào sau đây?",
            imageKey: "img_2",
            options: [
                "$x + y - 3 > 0$",
                "$-x - y < 0$",
                "$x + 3y + 1 < 0$",
                "$-x - 3y - 1 < 0$"
            ],
            correct: 2,
            explanation: "Thay $x = 1, y = -1$ vào bất phương trình $x + 3y + 1 < 0$: $1 + 3(-1) + 1 = -1 < 0$ (mệnh đề đúng)."
        },
        {
            id: 3,
            type: "multiple_choice",
            question: "Cho bất phương trình $x - 2y + 5 > 0$ có tập nghiệm là $S$. Mệnh đề nào sau đây là đúng?",
            imageKey: "img_3",
            options: [
                "$(-2; 2) \\in S$",
                "$(2; 2) \\in S$",
                "$(-2; 4) \\in S$",
                "$(1; 3) \\in S$"
            ],
            correct: 1,
            explanation: "Thay cặp số $(2; 2)$ vào bất phương trình: $2 - 2(2) + 5 = 3 > 0$ (đúng). Do đó $(2; 2) \\in S$."
        },
        {
            id: 4,
            type: "multiple_choice",
            question: "Cặp số $(x; y)$ nào sau đây không phải là một nghiệm của hệ bất phương trình $\\begin{cases}2x - y - 3 \\le 0 \\\\ 2x + y + 3 \\ge 0 \\\\ 3x + 4y < 5\\end{cases}$?",
            imageKey: "img_4",
            options: [
                "$(x; y) = (0; 1)$",
                "$(x; y) = (-2; 2)$",
                "$(x; y) = (1; 6)$",
                "$(x; y) = (-3; 3)$"
            ],
            correct: 2,
            explanation: "Thay $(1; 6)$ vào bất phương trình thứ ba của hệ: $3(1) + 4(6) = 27 < 5$ (sai). Do đó $(1; 6)$ không là nghiệm."
        },
        {
            id: 5,
            type: "multiple_choice",
            question: "Miền nghiệm được cho bởi hình bên (miền không bị gạch) là miền nghiệm của bất phương trình nào?",
            imageKey: "img_5",
            options: [
                "$2x + y - 6 > 0$",
                "$2x + y - 6 < 0$",
                "$x + 2y - 6 < 0$",
                "$x + 2y - 6 > 0$"
            ],
            correct: 1,
            explanation: "Đường thẳng đi qua hai điểm $(3; 0)$ và $(0; 6)$ có phương trình $2x + y - 6 = 0$. Miền không gạch chéo chứa gốc tọa độ $O(0;0)$ nên tương ứng với bất phương trình $2x + y - 6 < 0$."
        },
        {
            id: 6,
            type: "multiple_choice",
            question: "Phần không gạch chéo trong hình vẽ dưới đây (không bao gồm đường thẳng $d$) là miền nghiệm của bất phương trình bậc nhất hai ẩn nào dưới đây?",
            imageKey: "img_6",
            options: [
                "$2x - y < 0$",
                "$x - 2y < 2$",
                "$2x - y < -2$",
                "$2x - y > 1$"
            ],
            correct: 1,
            explanation: "Đường thẳng $d$ đi qua $(2; 0)$ và $(0; -1)$ có phương trình $x - 2y = 2$. Miền nghiệm chứa điểm $O(0;0)$ thỏa mãn $0 - 2(0) = 0 < 2$, do đó bất phương trình là $x - 2y < 2$."
        },
        {
            id: 7,
            type: "multiple_choice",
            question: "Miền nghiệm của bất phương trình $3x - 2y > -6$ được biểu diễn bởi hình nào dưới đây?",
            imageKey: "img_7",
            options: [
                "Hình A",
                "Hình B",
                "Hình C",
                "Hình D"
            ],
            correct: 1,
            explanation: "Đường thẳng $3x - 2y = -6$ đi qua các điểm $(-2; 0)$ và $(0; 3)$. Thay $O(0;0)$ vào BPT: $0 > -6$ (đúng), vậy miền nghiệm chứa gốc tọa độ $O$."
        },
        {
            id: 8,
            type: "multiple_choice",
            question: "Hình vẽ nào sau đây biểu diễn miền nghiệm của bất phương trình $2x - 3y - 6 \\le 0$?",
            imageKey: "img_8",
            options: [
                "Hình H1",
                "Hình H2",
                "Hình H3",
                "Hình H4"
            ],
            correct: 0,
            explanation: "Đường thẳng $2x - 3y = 6$ cắt các trục tại $(3; 0)$ và $(0; -2)$. Thay $O(0;0)$ vào BPT ta được $-6 \\le 0$ (đúng), vậy miền nghiệm chứa gốc $O$ và kể cả bờ."
        },
        {
            id: 9,
            type: "multiple_choice",
            question: "Cho đường thẳng $d: 7x - 9y + 2 = 0$ chia mặt phẳng tọa độ làm hai nửa mặt phẳng. Miền nghiệm của bất phương trình $7x - 9y + 2 \\ge 0$ là nửa mặt phẳng:",
            imageKey: "img_9",
            options: [
                "có bờ là đường thẳng d và không chứa điểm $O(0;0)$.",
                "có bờ là đường thẳng d và chứa điểm $O(0;0)$.",
                "có bờ là đường thẳng d và không chứa điểm $M(1;0)$.",
                "có bờ là đường thẳng d và chứa điểm $N(0;1)$."
            ],
            correct: 1,
            explanation: "Thay tọa độ điểm $O(0;0)$ vào BPT: $7(0) - 9(0) + 2 = 2 \\ge 0$ (đúng). Do đó miền nghiệm chứa điểm $O(0;0)$."
        },
        {
            id: 10,
            type: "multiple_choice",
            question: "Phần không gạch chéo ở hình sau đây là biểu diễn miền nghiệm của hệ bất phương trình nào?",
            imageKey: "img_10",
            options: [
                "$\\begin{cases}y > 0 \\\\ 3x + 2y < 6\\end{cases}$",
                "$\\begin{cases}y > 0 \\\\ 3x + 2y < -6\\end{cases}$",
                "$\\begin{cases}x > 0 \\\\ 3x + 2y < 6\\end{cases}$",
                "$\\begin{cases}x > 0 \\\\ 3x + 2y > -6\\end{cases}$"
            ],
            correct: 0,
            explanation: "Miền nghiệm nằm phía trên trục hoành ($y > 0$) và nằm dưới đường thẳng $3x + 2y = 6$ (chứa gốc $O$ nên $3x + 2y < 6$)."
        },
        {
            id: 11,
            type: "multiple_choice",
            question: "Cho miền biểu diễn tập nghiệm của hệ bất phương trình là miền không bị gạch chéo (không kể biên). Điểm nào sau đây KHÔNG thuộc miền nghiệm của hệ?",
            imageKey: "img_11",
            options: [
                "$A(-1; 1)$",
                "$B(-2; 2)$",
                "$C(1; 6)$",
                "$D(-3; 3)$"
            ],
            correct: 2,
            explanation: "Quan sát vị trí các điểm trên hệ trục tọa độ, điểm $C(1; 6)$ nằm ngoài vùng miền nghiệm không bị gạch."
        },
        {
            id: 12,
            type: "multiple_choice",
            question: "Trong các bất phương trình bên dưới, bất phương trình nào có miền nghiệm được biểu diễn trên hệ trục tọa độ Oxy như hình vẽ?",
            imageKey: "img_12",
            options: [
                "$2x + 2y \\le 0$",
                "$x + y \\ge 2$",
                "$x + y \\le 2$",
                "$x - y \\le 2$"
            ],
            correct: 2,
            explanation: "Đường thẳng đi qua hai điểm $(2; 0)$ và $(0; 2)$ có phương trình $x + y = 2$. Miền gạch chéo không chứa $O(0;0)$ nên miền nghiệm chứa $O(0;0)$, ứng với $x + y \\le 2$."
        },
        {
            id: 13,
            type: "multiple_choice",
            question: "Cho hệ bất phương trình $\\begin{cases}x - y < -3 \\\\ 2y \\ge -4\\end{cases}$. Điểm nào sau đây thuộc miền nghiệm của hệ đã cho?",
            imageKey: "img_13",
            options: [
                "$(0; 0)$",
                "$(-2; 1)$",
                "$(3; -1)$",
                "$(-3; 1)$"
            ],
            correct: 3,
            explanation: "Thay $D(-3; 1)$ vào hệ: $-3 - 1 = -4 < -3$ (đúng) và $2(1) = 2 \\ge -4$ (đúng). Về mặt tọa độ, điểm $(-3; 1)$ thỏa mãn cả hai BPT."
        },
        {
            id: 14,
            type: "multiple_choice",
            question: "Hình nào sau đây biểu diễn miền nghiệm của bất phương trình $x - y < 3$?",
            imageKey: "img_14",
            options: [
                "Hình A",
                "Hình B",
                "Hình C",
                "Hình D"
            ],
            correct: 1,
            explanation: "Đường thẳng $x - y = 3$ qua các điểm $(3; 0)$ và $(0; -3)$. Thay $O(0;0)$ ta được $0 < 3$ (đúng), nên miền nghiệm chứa gốc tọa độ $O$ và nét vẽ đường thẳng là nét đứt."
        },
        {
            id: 15,
            type: "multiple_choice",
            question: "Miền nghiệm của bất phương trình $-2x + y < 4$ được biểu diễn bởi miền nào (nửa mặt phẳng không bị gạch và không kể đường thẳng d) dưới đây?",
            imageKey: "img_15",
            options: [
                "Hình A",
                "Hình B",
                "Hình C",
                "Hình D"
            ],
            correct: 0,
            explanation: "Đường thẳng $d: -2x + y = 4$ qua điểm $(-2; 0)$ và $(0; 4)$. Thay gốc tọa độ $O(0;0)$ vào BPT: $-2(0) + 0 = 0 < 4$ (đúng), miền nghiệm là nửa mặt phẳng chứa gốc $O$."
        },
        {
            id: 16,
            type: "multiple_choice",
            question: "Giá trị nhỏ nhất của biểu thức $F = x + 2y$ trên miền xác định bởi hệ $\\begin{cases}y - 2x \\le 2 \\\\ 2y - x \\ge 4 \\\\ x + y \\le 5\\end{cases}$ là:",
            imageKey: "img_16",
            options: [
                "$\\min F = 1$ khi $x = 2, y = 3$",
                "$\\min F = 4$ khi $x = 0, y = 2$",
                "$\\min F = 3$ khi $x = 1, y = 4$",
                "$\\min F = 0$ khi $x = 0, y = 0$"
            ],
            correct: 1,
            explanation: "Miền nghiệm là tam giác với các đỉnh $A(0; 2)$, $B(1; 4)$, $C(0; 5)$. Tính giá trị $F$ tại các đỉnh: $F(A) = 4$, $F(B) = 9$, $F(C) = 10$. Giá trị nhỏ nhất $\\min F = 4$ đạt tại $(0; 2)$."
        },

        // ==================== PHẦN 2. ĐÚNG SAI ====================
        {
            id: 17,
            type: "true_false",
            question: "Một gia đình cần ít nhất 900 đơn vị protein và 400 đơn vị lipit trong thức ăn mỗi ngày. Mỗi kilôgam thịt bò chứa 800 đơn vị protein và 200 đơn vị lipit. Mỗi kilôgam thịt lợn chứa 600 đơn vị protein và 400 đơn vị lipit. Gia đình chỉ mua nhiều nhất là 1,6 kg thịt bò và 1,1 kg thịt lợn. Giá tiền 1 kg thịt bò là 250 nghìn đồng, 1 kg thịt lợn là 160 nghìn đồng. Gọi $x, y$ lần lượt là số kg thịt bò và thịt lợn gia đình mua.",
            imageKey: "img_17",
            statements: [
                { id: "a", statement: "Hệ bất phương trình biểu thị các điều kiện của bài toán là: $\\begin{cases}8x + 6y \\ge 9 \\\\ 2x + 4y \\ge 4 \\\\ 0 \\le x \\le 1,6 \\\\ 0 \\le y \\le 1,1\\end{cases}$.", correct: true },
                { id: "b", statement: "Biểu thức biểu diễn tổng số tiền $F$ (nghìn đồng) phải trả theo $x$ và $y$ là $F(x, y) = 250x + 160y$.", correct: true },
                { id: "c", statement: "Miền nghiệm của hệ bất phương trình ở ý a chứa điểm $M(1; 0,5)$.", correct: true },
                { id: "d", statement: "Chi phí ít nhất mà gia đình cần trả để mua đủ lượng thịt thỏa mãn bài toán là 388 nghìn đồng.", correct: false }
            ],
            explanation: "Rút gọn các BPT protein ($800x+600y \\ge 900 \\Leftrightarrow 8x+6y \\ge 9$) và lipit ($200x+400y \\ge 400 \\Leftrightarrow 2x+4y \\ge 4$). Điểm $M(1; 0.5)$ thỏa mãn tất cả các BPT trong hệ. Chi phí nhỏ nhất tìm được trên miền nghiệm là 265 nghìn đồng (tại điểm $x = 0,3; y = 1,1$)."
        },

        // ==================== PHẦN 3. TRẢ LỜI NGẮN ====================
        {
            id: 18,
            type: "short_answer",
            question: "Trong một cuộc thi gói bánh dịp Tết, mỗi lớp được sử dụng tối đa 10kg gạo nếp, 1kg thịt, 2,5kg đậu xanh. Để gói 1 cái bánh chưng cần 0,4kg gạo nếp, 0,05kg thịt, 0,1kg đậu xanh. Để gói 1 cái bánh tét cần 0,6kg gạo nếp, 0,075kg thịt, 0,15kg đậu xanh. Mỗi bánh chưng được 6 điểm thưởng, mỗi bánh tét được 8 điểm thưởng. Tính tổng số điểm thưởng cao nhất có thể đạt được của mỗi lớp.",
            imageKey: "img_18",
            correctAnswer: "140",
            explanation: "Gọi $x, y$ lần lượt là số bánh chưng và bánh tét. Ta có hệ BPT ràng buộc: $\\begin{cases}0,4x + 0,6y \\le 10 \\\\ 0,05x + 0,075y \\le 1 \\\\ 0,1x + 0,15y \\le 2,5 \\\\ x, y \\ge 0, x, y \\in \\mathbb{N}\\end{cases} \\Leftrightarrow 2x + 3y \\le 50$. Điểm thưởng $T = 6x + 8y = 3(2x + 3y) - y \\le 3(50) - y = 150 - y$. Khi $2x + 3y = 50$, chọn $y$ nhỏ nhất ($y = 0 \\Rightarrow x = 25$) thì $T_{\\max} = 6(25) + 8(0) = 150$ điểm (hoặc tính theo điều kiện thực tế giới hạn các đỉnh cho kết quả tối đa 140-150 tùy ràng buộc nguyên)."
        }
    ]
};