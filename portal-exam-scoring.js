// =========================================================
// FILE: portal-exam-scoring.js
// QUẢN LÝ BIỂU ĐIỂM ĐỀ THI, LIVE PREVIEW & TÍNH ĐIỂM ĐỒNG BỘ
// =========================================================

let currentScoringQuizId = null;
let currentScoringQuizData = null;

(function injectScoringModalStyles() {
    const styleId = "exam-scoring-modal-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
        .btn-time-sub-score {
            background: #ecfdf5 !important;
            color: #047857 !important;
            border: 1px solid #6ee7b7 !important;
        }
        .btn-time-sub-score:hover {
            background: #10b981 !important;
            color: #ffffff !important;
        }
        .scoring-modal-card {
            max-width: 540px !important;
            width: min(540px, calc(100vw - 24px)) !important;
            padding: 22px !important;
            border-radius: 20px !important;
            text-align: left !important;
        }
        .scoring-q-count-banner {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            border-radius: 12px;
            margin-bottom: 14px;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
        }
        .scoring-q-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 8px;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            font-weight: 800;
            color: #0f172a;
        }
        .scoring-option-card {
            border: 1.5px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px 14px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #ffffff;
        }
        .scoring-option-card:hover {
            border-color: #38bdf8;
            background: #f0f9ff;
        }
        .scoring-option-card.selected {
            border-color: #0284c7;
            background: #f0f9ff;
            box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
        }
        .scoring-option-header {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 900;
            font-size: 13.5px;
            color: #0f172a;
        }
        .scoring-option-header input[type="radio"] {
            width: 17px;
            height: 17px;
            accent-color: #0284c7;
            cursor: pointer;
            margin: 0;
        }
        .scoring-option-desc {
            font-size: 11.5px;
            color: #64748b;
            font-weight: 600;
            margin-top: 4px;
            line-height: 1.45;
            padding-left: 27px;
        }
        .scoring-inputs-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
            padding-left: 27px;
        }
        @media (max-width: 480px) {
            .scoring-inputs-grid { grid-template-columns: 1fr; }
        }
        .scoring-part-box {
            background: #ffffff;
            border: 1.5px solid #cbd5e1;
            border-radius: 10px;
            padding: 8px 10px;
        }
        .scoring-part-label {
            font-size: 11.5px;
            font-weight: 800;
            color: #334155;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .scoring-part-input {
            width: 100%;
            padding: 6px 10px;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            font-weight: 800;
            font-size: 13.5px;
            outline: none;
            color: #0f172a;
            box-sizing: border-box;
        }
        .scoring-part-input:focus { border-color: #0284c7; }
        .scoring-part-hint {
            font-size: 10.5px;
            font-weight: 700;
            color: #0284c7;
            margin-top: 4px;
            line-height: 1.35;
            white-space: pre-line;
        }
        .scoring-total-box {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 1.5px solid #86efac;
            border-radius: 12px;
            padding: 10px 14px;
            margin-top: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .scoring-total-title { font-size: 13px; font-weight: 800; color: #166534; }
        .scoring-total-val { font-size: 18px; font-weight: 900; color: #15803d; }
    `;
    document.head.appendChild(style);
})();

function ensureScoringModalInDOM() {
    if (document.getElementById("exam-scoring-modal")) return;
    const modalDiv = document.createElement("div");
    modalDiv.className = "move-modal-overlay";
    modalDiv.id = "exam-scoring-modal";
    modalDiv.innerHTML = `
    <div class="move-modal-box scoring-modal-card">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 10px;">
            <h4 style="margin:0; font-size: 16px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                <span>🎯</span> Cấu Hình Biểu Điểm Đề Thi
            </h4>
            <button type="button" onclick="closeGradingScaleModal()" style="background:none; border:none; font-size:18px; font-weight:900; color:#94a3b8; cursor:pointer;">✕</button>
        </div>

        <div style="font-size: 12.5px; font-weight: 700; color: #0284c7; margin-bottom: 8px;" id="scoring-modal-exam-title">
            📑 Đang nạp đề thi...
        </div>

        <div class="scoring-q-count-banner" id="scoring-q-count-banner">
            <span>Cấu trúc câu:</span>
            <span class="scoring-q-badge" id="badge-count-p1">P1: -- câu</span>
            <span class="scoring-q-badge" id="badge-count-p2">P2: -- câu</span>
            <span class="scoring-q-badge" id="badge-count-p3">P3: -- câu</span>
            <span class="scoring-q-badge" id="badge-count-p4">P4: -- câu</span>
            <span class="scoring-q-badge" style="background:#e0f2fe; color:#0369a1; border-color:#7dd3fc;" id="badge-count-total">Tổng: -- câu</span>
        </div>

        <!-- LỰA CHỌN 1 -->
        <div class="scoring-option-card" id="card-scoring-opt1" onclick="handleScoringModeChange('option1')">
            <div class="scoring-option-header">
                <input type="radio" name="scoring-mode" id="scoring-mode-opt1" value="option1" checked onchange="handleScoringModeChange('option1')">
                <label for="scoring-mode-opt1" style="cursor:pointer;">Lựa chọn 1: Mỗi câu 1 điểm (Quy đổi thang 10)</label>
            </div>
            <div class="scoring-option-desc">
                Tất cả các câu P1, P3, P4 đúng được 1 điểm. Riêng mỗi câu P2 (Đúng/Sai): đúng 1 ý = <b>0.1đ</b>, 2 ý = <b>0.25đ</b>, 3 ý = <b>0.5đ</b>, 4 ý = <b>1.0đ</b>. Điểm cuối cùng quy về thang 10: <code>(Tổng điểm / Tổng câu) × 10</code>.
            </div>
        </div>

        <!-- LỰA CHỌN 3: MẪU BỘ GD&ĐT -->
        <div class="scoring-option-card" id="card-scoring-opt3" onclick="handleScoringModeChange('option3')">
            <div class="scoring-option-header">
                <input type="radio" name="scoring-mode" id="scoring-mode-opt3" value="option3" onchange="handleScoringModeChange('option3')">
                <label for="scoring-mode-opt3" style="cursor:pointer;">Lựa chọn 3: Mẫu chuẩn Bộ GD&ĐT (3 - 4 - 3 - 0)</label>
            </div>
            <div class="scoring-option-desc">
                Định dạng cấu trúc chuẩn: <b>Phần 1: 3.0đ</b> (0.25đ/câu) • <b>Phần 2: 4.0đ</b> (1.0đ/câu: 0.1 - 0.25 - 0.5 - 1.0) • <b>Phần 3: 3.0đ</b> (0.5đ/câu) • <b>Phần 4: 0đ</b>. Tổng tròn <b>10.0 điểm</b>.
            </div>
        </div>

        <!-- LỰA CHỌN 2: TỰ NHẬP -->
        <div class="scoring-option-card" id="card-scoring-opt2" onclick="handleScoringModeChange('option2')">
            <div class="scoring-option-header">
                <input type="radio" name="scoring-mode" id="scoring-mode-opt2" value="option2" onchange="handleScoringModeChange('option2')">
                <label for="scoring-mode-opt2" style="cursor:pointer;">Lựa chọn 2: Tự nhập điểm theo từng phần (Tổng P1 + P2 + P3 + P4)</label>
            </div>
            <div class="scoring-option-desc">
                Tự nhập điểm cho từng phần. Hệ thống tự động chia đều cho số câu. Trong P2: 1 ý = 10%, 2 ý = 25%, 3 ý = 50%, 4 ý = 100% điểm của 1 câu. Tổng điểm là tổng 4 phần, <b>có thể lớn hơn 10</b>.
            </div>

            <div class="scoring-inputs-grid" id="scoring-inputs-custom-view" style="display:none;">
                <div class="scoring-part-box">
                    <div class="scoring-part-label"><span>Phần 1 (Trắc nghiệm 4 Đ.Á):</span></div>
                    <input type="number" step="0.05" min="0" max="100" class="scoring-part-input" id="score-input-p1" placeholder="Nhập điểm..." oninput="updateScoringPreview()">
                    <div class="scoring-part-hint" id="hint-p1">-- đ/câu</div>
                </div>

                <div class="scoring-part-box">
                    <div class="scoring-part-label"><span>Phần 2 (Đúng / Sai):</span></div>
                    <input type="number" step="0.05" min="0" max="100" class="scoring-part-input" id="score-input-p2" placeholder="Nhập điểm..." oninput="updateScoringPreview()">
                    <div class="scoring-part-hint" id="hint-p2">-- đ/câu</div>
                </div>

                <div class="scoring-part-box">
                    <div class="scoring-part-label"><span>Phần 3 (Trả lời ngắn):</span></div>
                    <input type="number" step="0.05" min="0" max="100" class="scoring-part-input" id="score-input-p3" placeholder="Nhập điểm..." oninput="updateScoringPreview()">
                    <div class="scoring-part-hint" id="hint-p3">-- đ/câu</div>
                </div>

                <div class="scoring-part-box">
                    <div class="scoring-part-label"><span>Phần 4 (Tự luận / Điền kết quả):</span></div>
                    <input type="number" step="0.05" min="0" max="100" class="scoring-part-input" id="score-input-p4" placeholder="Nhập điểm..." oninput="updateScoringPreview()">
                    <div class="scoring-part-hint" id="hint-p4">-- đ/câu</div>
                </div>
            </div>

            <div class="scoring-total-box" id="scoring-total-box" style="display:none;">
                <span class="scoring-total-title">🎯 TỔNG ĐIỂM TỐI ĐA CỦA ĐỀ THI:</span>
                <span class="scoring-total-val" id="scoring-total-preview-val">10.0 điểm</span>
            </div>
        </div>

        <div class="move-btn-row" style="margin-top: 14px;">
            <button type="button" class="move-btn-cancel" onclick="closeGradingScaleModal()">Hủy</button>
            <button type="button" class="move-btn-submit" id="btn-save-grading-scale" onclick="saveGradingScaleConfig()" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">💾 Lưu Biểu Điểm</button>
        </div>
    </div>`;
    document.body.appendChild(modalDiv);
}

function countQuestionsByPart(questions) {
    if (!Array.isArray(questions)) return { p1: 0, p2: 0, p3: 0, p4: 0, total: 0 };
    let p1 = questions.filter(q => q && q.type === "multiple_choice").length;
    let p2 = questions.filter(q => q && q.type === "true_false").length;
    let p3 = questions.filter(q => q && q.type === "short_answer").length;
    let p4 = questions.filter(q => q && (q.type === "essay" || q.type === "essay_answer")).length;
    return { p1, p2, p3, p4, total: questions.length };
}

async function openGradingScaleModal(quizId, categoryId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    ensureScoringModalInDOM();
    currentScoringQuizId = quizId;

    const modal = document.getElementById("exam-scoring-modal");
    const titleEl = document.getElementById("scoring-modal-exam-title");
    if (titleEl) titleEl.innerText = "⏳ Đang tải thông tin cấu trúc đề thi...";
    if (modal) modal.style.display = "flex";

    try {
        const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
        currentScoringQuizData = await res.json();

        if (!currentScoringQuizData || !currentScoringQuizData.questions) {
            throw new Error("Không thể tải cấu trúc câu hỏi của đề thi!");
        }

        if (titleEl) titleEl.innerText = `📑 Đề: ${currentScoringQuizData.title || quizId}`;

        const counts = countQuestionsByPart(currentScoringQuizData.questions);
        const b1 = document.getElementById("badge-count-p1");
        const b2 = document.getElementById("badge-count-p2");
        const b3 = document.getElementById("badge-count-p3");
        const b4 = document.getElementById("badge-count-p4");
        const bTot = document.getElementById("badge-count-total");

        if (b1) b1.innerText = `P1: ${counts.p1} câu`;
        if (b2) b2.innerText = `P2: ${counts.p2} câu`;
        if (b3) b3.innerText = `P3: ${counts.p3} câu`;
        if (b4) b4.innerText = `P4: ${counts.p4} câu`;
        if (bTot) bTot.innerText = `Tổng: ${counts.total} câu`;

        const cfg = currentScoringQuizData.scoringConfig || { mode: 'option1' };
        const mode = cfg.mode || 'option1';

        document.getElementById("score-input-p1").value = cfg.p1Total !== undefined ? cfg.p1Total : 3.0;
        document.getElementById("score-input-p2").value = cfg.p2Total !== undefined ? cfg.p2Total : 4.0;
        document.getElementById("score-input-p3").value = cfg.p3Total !== undefined ? cfg.p3Total : 3.0;
        document.getElementById("score-input-p4").value = cfg.p4Total !== undefined ? cfg.p4Total : 0;

        handleScoringModeChange(mode);
        updateScoringPreview();
    } catch(err) {
        alert("❌ Lỗi tải đề thi: " + err.message);
        closeGradingScaleModal();
    }
}

function closeGradingScaleModal() {
    const modal = document.getElementById("exam-scoring-modal");
    if (modal) modal.style.display = "none";
    currentScoringQuizId = null;
    currentScoringQuizData = null;
}

function handleScoringModeChange(mode) {
    const rOpt1 = document.getElementById("scoring-mode-opt1");
    const rOpt2 = document.getElementById("scoring-mode-opt2");
    const rOpt3 = document.getElementById("scoring-mode-opt3");

    const cOpt1 = document.getElementById("card-scoring-opt1");
    const cOpt2 = document.getElementById("card-scoring-opt2");
    const cOpt3 = document.getElementById("card-scoring-opt3");

    if (rOpt1) rOpt1.checked = (mode === 'option1');
    if (rOpt2) rOpt2.checked = (mode === 'option2');
    if (rOpt3) rOpt3.checked = (mode === 'option3');

    if (cOpt1) cOpt1.classList.toggle("selected", mode === 'option1');
    if (cOpt2) cOpt2.classList.toggle("selected", mode === 'option2');
    if (cOpt3) cOpt3.classList.toggle("selected", mode === 'option3');

    const customInputsView = document.getElementById("scoring-inputs-custom-view");
    const totalBox = document.getElementById("scoring-total-box");

    if (mode === 'option1') {
        if (customInputsView) customInputsView.style.display = "none";
        if (totalBox) totalBox.style.display = "none";
    } else if (mode === 'option3') {
        if (customInputsView) customInputsView.style.display = "grid";
        if (totalBox) totalBox.style.display = "flex";
        document.getElementById("score-input-p1").value = 3.0;
        document.getElementById("score-input-p2").value = 4.0;
        document.getElementById("score-input-p3").value = 3.0;
        document.getElementById("score-input-p4").value = 0;
        updateScoringPreview();
    } else {
        if (customInputsView) customInputsView.style.display = "grid";
        if (totalBox) totalBox.style.display = "flex";
        updateScoringPreview();
    }
}

function updateScoringPreview() {
    if (!currentScoringQuizData || !currentScoringQuizData.questions) return;
    const counts = countQuestionsByPart(currentScoringQuizData.questions);

    const p1Val = parseFloat(document.getElementById("score-input-p1").value) || 0;
    const p2Val = parseFloat(document.getElementById("score-input-p2").value) || 0;
    const p3Val = parseFloat(document.getElementById("score-input-p3").value) || 0;
    const p4Val = parseFloat(document.getElementById("score-input-p4").value) || 0;

    const h1 = document.getElementById("hint-p1");
    const h2 = document.getElementById("hint-p2");
    const h3 = document.getElementById("hint-p3");
    const h4 = document.getElementById("hint-p4");

    const p1PerQ = counts.p1 > 0 ? (p1Val / counts.p1) : 0;
    const p2PerQ = counts.p2 > 0 ? (p2Val / counts.p2) : 0;
    const p3PerQ = counts.p3 > 0 ? (p3Val / counts.p3) : 0;
    const p4PerQ = counts.p4 > 0 ? (p4Val / counts.p4) : 0;

    const round3 = n => (Math.round(n * 1000) / 1000);

    if (h1) h1.innerText = counts.p1 > 0 ? `💡 ${counts.p1} câu ➔ ${round3(p1PerQ)} đ/câu` : "Đề không có câu P1";

    if (h2) {
        if (counts.p2 > 0) {
            const sc1 = round3(p2PerQ * 0.1);
            const sc2 = round3(p2PerQ * 0.25);
            const sc3 = round3(p2PerQ * 0.5);
            const sc4 = round3(p2PerQ * 1.0);
            h2.innerText = `💡 ${counts.p2} câu ➔ ${round3(p2PerQ)} đ/câu\n(1 ý = ${sc1}đ | 2 ý = ${sc2}đ | 3 ý = ${sc3}đ | 4 ý = ${sc4}đ)`;
        } else {
            h2.innerText = "Đề không có câu P2";
        }
    }

    if (h3) h3.innerText = counts.p3 > 0 ? `💡 ${counts.p3} câu ➔ ${round3(p3PerQ)} đ/câu` : "Đề không có câu P3";
    if (h4) h4.innerText = counts.p4 > 0 ? `💡 ${counts.p4} câu ➔ ${round3(p4PerQ)} đ/câu` : "Đề không có câu P4";

    const totalSum = round3(p1Val + p2Val + p3Val + p4Val);
    const totalPreviewEl = document.getElementById("scoring-total-preview-val");
    if (totalPreviewEl) totalPreviewEl.innerText = `${totalSum} điểm`;
}

async function saveGradingScaleConfig() {
    if (!currentScoringQuizId) return;
    const btn = document.getElementById("btn-save-grading-scale");
    btn.disabled = true; btn.innerText = "⏳ Đang lưu...";

    const selectedRadio = document.querySelector('input[name="scoring-mode"]:checked');
    const mode = selectedRadio ? selectedRadio.value : 'option1';

    const p1Val = parseFloat(document.getElementById("score-input-p1").value) || 0;
    const p2Val = parseFloat(document.getElementById("score-input-p2").value) || 0;
    const p3Val = parseFloat(document.getElementById("score-input-p3").value) || 0;
    const p4Val = parseFloat(document.getElementById("score-input-p4").value) || 0;

    const scoringPayload = {
        mode: mode,
        p1Total: p1Val,
        p2Total: p2Val,
        p3Total: p3Val,
        p4Total: p4Val,
        totalMaxScore: (mode === 'option1') ? 10.0 : (Math.round((p1Val + p2Val + p3Val + p4Val) * 100) / 100),
        updatedAt: Date.now()
    };

    try {
        await Promise.all([
            fetch(`${FIREBASE_DB_URL}/quizzes/${currentScoringQuizId}/scoringConfig.json`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scoringPayload)
            }),
            fetch(`${FIREBASE_DB_URL}/exam_configs/${currentScoringQuizId}/scoringConfig.json`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scoringPayload)
            })
        ]);

        if (typeof DAY_THEM_CATEGORIES !== 'undefined' && typeof CHINH_KHOA_CATEGORIES !== 'undefined') {
            for (let cat of [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES]) {
                if (cat.links) {
                    let match = cat.links.find(l => (l.firebaseId === currentScoringQuizId || l.id === currentScoringQuizId));
                    if (match) {
                        match.scoringConfig = scoringPayload;
                        fetch(`${FIREBASE_DB_URL}/custom_links/${cat.id}/${currentScoringQuizId}/scoringConfig.json`, {
                            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scoringPayload)
                        }).catch(() => null);
                    }
                }
            }
        }

        alert("🎯 ĐÃ LƯU BIỂU ĐIỂM THÀNH CÔNG!\n\n- Bài thi nộp từ giờ sẽ được chấm tự động theo biểu điểm này.\n- Đối với các bài đã nộp trước đó, bạn chỉ cần vào Bảng kết quả và bấm '⚖️ Chấm lại bài' để đồng bộ điểm mới!");
        closeGradingScaleModal();
    } catch(e) {
        alert("❌ Lỗi khi lưu biểu điểm: " + e.message);
    } finally {
        btn.disabled = false; btn.innerText = "💾 Lưu Biểu Điểm";
    }
}

// =========================================================
// HÀM TÍNH ĐIỂM DÙNG CHUNG TOÀN HỆ THỐNG
// =========================================================
function calculateExamScoreWithConfig(questions, userAnswers, answerVault, scoringConfig) {
    const cfg = scoringConfig || { mode: "option1" };
    const mode = cfg.mode || "option1";
    const counts = countQuestionsByPart(questions);

    const isOption1 = (mode === "option1");
    let p1PerQ = 1.0;
    let p2PerQ = 1.0;
    let p3PerQ = 1.0;
    let p4PerQ = 1.0;

    if (!isOption1) {
        const p1Tot = (cfg.p1Total !== undefined) ? Number(cfg.p1Total) : (mode === "option3" ? 3.0 : 3.0);
        const p2Tot = (cfg.p2Total !== undefined) ? Number(cfg.p2Total) : (mode === "option3" ? 4.0 : 4.0);
        const p3Tot = (cfg.p3Total !== undefined) ? Number(cfg.p3Total) : (mode === "option3" ? 3.0 : 3.0);
        const p4Tot = (cfg.p4Total !== undefined) ? Number(cfg.p4Total) : 0;

        p1PerQ = counts.p1 > 0 ? (p1Tot / counts.p1) : 0;
        p2PerQ = counts.p2 > 0 ? (p2Tot / counts.p2) : 0;
        p3PerQ = counts.p3 > 0 ? (p3Tot / counts.p3) : 0;
        p4PerQ = counts.p4 > 0 ? (p4Tot / counts.p4) : 0;
    }

    let correctCount = 0;
    let wrongCount = 0;
    let totalScore = 0;
    let maxScoreOfExam = 0;
    let dataDetails = [];

    questions.forEach(q => {
        if (q.type === "multiple_choice") {
            maxScoreOfExam += isOption1 ? 1.0 : p1PerQ;
            const uVal = userAnswers[`q${q.id}`] || "Chưa chọn";
            const cVal = answerVault[`q${q.id}`];
            if (cVal && String(uVal).trim().toUpperCase() === String(cVal).trim().toUpperCase()) {
                correctCount++;
                totalScore += isOption1 ? 1.0 : p1PerQ;
                dataDetails.push(`${q.id}-${uVal} [ĐÚNG]`);
            } else {
                wrongCount++;
                dataDetails.push(`${q.id}-${uVal} [SAI: ${cVal || "---"}]`);
            }
        } else if (q.type === "true_false") {
            maxScoreOfExam += isOption1 ? 1.0 : p2PerQ;
            let cSt = 0;
            (q.statements || []).forEach(st => {
                const subKey = `q${q.id}_${st.id}`;
                const uVal = userAnswers[subKey] || "Chưa chọn";
                const cVal = answerVault[subKey];
                if (cVal && uVal === cVal) {
                    cSt++;
                    dataDetails.push(`${q.id}${st.id}-${uVal} [ĐÚNG]`);
                } else {
                    dataDetails.push(`${q.id}${st.id}-${uVal} [SAI]`);
                }
            });

            let qScore = 0;
            if (isOption1) {
                if (cSt === 1) qScore = 0.1;
                else if (cSt === 2) qScore = 0.25;
                else if (cSt === 3) qScore = 0.5;
                else if (cSt === 4) qScore = 1.0;
            } else {
                if (cSt === 1) qScore = 0.1 * p2PerQ;
                else if (cSt === 2) qScore = 0.25 * p2PerQ;
                else if (cSt === 3) qScore = 0.5 * p2PerQ;
                else if (cSt === 4) qScore = 1.0 * p2PerQ;
            }

            totalScore += qScore;
            if (cSt === (q.statements ? q.statements.length : 4)) correctCount++;
            else wrongCount++;
        } else if (q.type === "short_answer") {
            maxScoreOfExam += isOption1 ? 1.0 : p3PerQ;
            const uVal = String(userAnswers[`q${q.id}`] || "").trim().replace(',', '.');
            const cVal = String(answerVault[`q${q.id}`] || "").trim().replace(',', '.');
            const isRight = (uVal !== "" && cVal !== "" && (uVal === cVal || Number(uVal) === Number(cVal)));
            if (isRight) {
                correctCount++;
                totalScore += isOption1 ? 1.0 : p3PerQ;
                dataDetails.push(`${q.id}-${uVal} [ĐÚNG]`);
            } else {
                wrongCount++;
                dataDetails.push(`${q.id}-${uVal || "Trống"} [SAI: ${cVal || "---"}]`);
            }
        } else if (q.type === "essay" || q.type === "essay_answer") {
            maxScoreOfExam += isOption1 ? 1.0 : p4PerQ;
            const uVal = String(userAnswers[`q${q.id}`] || "").trim().replace(',', '.');
            const cVal = String(answerVault[`q${q.id}`] || "").trim().replace(',', '.');
            const isRight = (uVal !== "" && cVal !== "" && (uVal === cVal || Number(uVal) === Number(cVal)));
            if (isRight) {
                correctCount++;
                totalScore += isOption1 ? 1.0 : p4PerQ;
                dataDetails.push(`${q.id}-${uVal} [ĐÚNG]`);
            } else {
                wrongCount++;
                dataDetails.push(`${q.id}-${uVal || "Trống"} [SAI: ${cVal || "---"}]`);
            }
        }
    });

    let finalScore = 0;
    if (isOption1) {
        finalScore = Math.round(((totalScore / (maxScoreOfExam || 1)) * 10) * 10) / 10;
    } else {
        finalScore = Math.round(totalScore * 100) / 100;
    }

    return {
        correctCount,
        wrongCount,
        totalRawScore: Math.round(totalScore * 100) / 100,
        maxTotalScore: Math.round(maxScoreOfExam * 100) / 100,
        finalScore: finalScore,
        maxScale: isOption1 ? 10.0 : (Math.round(maxScoreOfExam * 100) / 100),
        dataDetails
    };
}

window.openGradingScaleModal = openGradingScaleModal;
window.closeGradingScaleModal = closeGradingScaleModal;
window.handleScoringModeChange = handleScoringModeChange;
window.updateScoringPreview = updateScoringPreview;
window.saveGradingScaleConfig = saveGradingScaleConfig;
window.calculateExamScoreWithConfig = calculateExamScoreWithConfig;