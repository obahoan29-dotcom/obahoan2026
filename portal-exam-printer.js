// =========================================================
// FILE: portal-exam-printer.js
// BỘ MÁY XUẤT ĐỀ THI CHUẨN ĐẸP (PDF VÀ WORD) ĐẦY ĐỦ CÂU HỎI VÀ HÌNH VẼ
// =========================================================

function toggleExamExportMenu(itemId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const menu = document.getElementById(`export-menu-${itemId}`);
    if (!menu) return;
    const isShown = menu.classList.contains("show");
    
    document.querySelectorAll(".exam-export-menu.show").forEach(m => m.classList.remove("show"));
    document.querySelectorAll(".exam-card.has-active-export").forEach(c => c.classList.remove("has-active-export"));

    if (!isShown) {
        menu.classList.add("show");
        const card = document.getElementById(`card-${itemId}`);
        if (card) card.classList.add("has-active-export");
    }
}

function getEffectiveImageUrlForExport(q, imageMap) {
    if (!q) return "";
    if (!imageMap || typeof imageMap !== 'object') imageMap = {};
    if (q.imageUrl && String(q.imageUrl).trim() !== "") return q.imageUrl.trim();
    if (q.imageKey && imageMap[q.imageKey] && String(imageMap[q.imageKey]).trim() !== "") return imageMap[q.imageKey].trim();
    const possibleKeys = [
        `img_q_${q.id}`, `q${q.id}`, `${q.id}`,
        `dh_p1_c${q.id}`, `hy_p1_c${q.id}`, `pbc_p1_c${q.id}`, `dethem_p3_c${q.id}`
    ];
    for (let k of possibleKeys) {
        if (imageMap[k] && String(imageMap[k]).trim() !== "") {
            return imageMap[k].trim();
        }
    }
    return "";
}

async function fetchFullExamData(quizId) {
    if (!quizId) return null;
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.questions) return data;
        }
    } catch(e) {}
    if (typeof examData !== 'undefined' && examData && examData.questions) {
        return examData;
    }
    return null;
}

async function handleExportExamAction(categoryId, itemId, format, includeKey, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    document.querySelectorAll(".exam-export-menu.show").forEach(m => m.classList.remove("show"));
    document.querySelectorAll(".exam-card.has-active-export").forEach(c => c.classList.remove("has-active-export"));

    let targetItem = null;
    const allCats = [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES, KHO_TAI_LIEU_FOLDER];
    for (const c of allCats) {
        if (c.links) {
            const found = c.links.find(l => (l.firebaseId === itemId || l.id === itemId));
            if (found) { targetItem = found; break; }
        }
    }

    const effectiveQuizId = targetItem ? (extractQuizIdFromItem(targetItem) || targetItem.id || itemId) : itemId;
    const statusToast = (msg) => {
        if (typeof showTimeChangeToast === "function") showTimeChangeToast(msg);
        else alert(msg);
    };

    statusToast("⏳ Đang tải toàn bộ câu hỏi và chuẩn bị xuất đề...");

    try {
        const data = await fetchFullExamData(effectiveQuizId);
        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error("Không thể tải cấu trúc đề thi hoặc đề thi chưa có câu hỏi!");
        }

        const title = data.title || (targetItem ? targetItem.title : "ĐỀ THI TRẮC NGHIỆM");
        const maDe = data.maDe || "101";
        const timeLimit = data.timeLimitMinutes || (targetItem ? targetItem.timeLimitMinutes : 90) || 90;

        if (format === 'pdf') {
            exportExamToPDF(data, title, maDe, timeLimit, includeKey);
        } else if (format === 'word') {
            exportExamToWord(data, title, maDe, timeLimit, includeKey);
        }
    } catch(err) {
        alert("❌ Lỗi xuất đề thi: " + err.message);
    }
}

function buildExamDocumentHtml(data, examTitle, maDe, timeLimit, includeKey, isForWord = false) {
    const questions = data.questions || [];
    const images = data.images || {};

    const p1List = questions.filter(q => q.type === "multiple_choice");
    const p2List = questions.filter(q => q.type === "true_false");
    const p3List = questions.filter(q => q.type === "short_answer");
    const p4List = questions.filter(q => q.type === "essay" || q.type === "essay_answer");

    let questionGlobalIdx = 1;
    let htmlContent = "";

    if (p1List.length > 0) {
        htmlContent += `
        <div class="part-header-box">
            <b>PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.</b> Thí sinh trả lời từ câu ${questionGlobalIdx} đến câu ${questionGlobalIdx + p1List.length - 1}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
        </div>`;
        p1List.forEach(q => {
            const imgUrl = getEffectiveImageUrlForExport(q, images);
            const imgHtml = imgUrl ? `
                <div class="doc-img-container">
                    <img src="${imgUrl}" class="doc-q-img" alt="Hình minh họa câu ${questionGlobalIdx}">
                </div>` : "";

            const letters = ["A", "B", "C", "D"];
            let maxOptLen = Math.max(...(q.options || []).map(o => String(o).length));
            let optLayoutClass = maxOptLen > 55 ? "opt-grid-1" : (maxOptLen > 24 ? "opt-grid-2" : "opt-grid-4");

            const optsHtml = (q.options || []).map((opt, oIdx) => {
                const L = letters[oIdx];
                const isCorrect = (includeKey && q.correct !== undefined && q.correct === oIdx);
                return `
                <div class="doc-option-item ${isCorrect ? 'correct-highlight' : ''}">
                    <b>${L}.</b> <span>${opt}</span> ${isCorrect ? '<b class="key-mark">✓</b>' : ''}
                </div>`;
            }).join('');

            const explainHtml = (includeKey && q.explanation) ? `
                <div class="doc-explanation-box">
                    💡 <b>Hướng dẫn giải:</b> ${q.explanation}
                </div>` : "";

            htmlContent += `
            <div class="doc-question-card">
                <div class="doc-q-title">
                    <b>Câu ${questionGlobalIdx}.</b> ${q.question}
                </div>
                ${imgHtml}
                <div class="doc-options-wrapper ${optLayoutClass}">
                    ${optsHtml}
                </div>
                ${explainHtml}
            </div>`;
            questionGlobalIdx++;
        });
    }

    if (p2List.length > 0) {
        htmlContent += `
        <div class="part-header-box">
            <b>PHẦN II. Câu trắc nghiệm đúng sai.</b> Thí sinh trả lời từ câu ${questionGlobalIdx} đến câu ${questionGlobalIdx + p2List.length - 1}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
        </div>`;
        p2List.forEach(q => {
            const imgUrl = getEffectiveImageUrlForExport(q, images);
            const imgHtml = imgUrl ? `
                <div class="doc-img-container">
                    <img src="${imgUrl}" class="doc-q-img" alt="Hình minh họa câu ${questionGlobalIdx}">
                </div>` : "";

            let stRowsHtml = (q.statements || []).map(st => {
                let keyStr = "";
                if (includeKey && st.correct !== undefined) {
                    keyStr = st.correct ? `<span class="tf-badge tf-true">ĐÚNG</span>` : `<span class="tf-badge tf-false">SAI</span>`;
                }
                return `
                <div class="doc-statement-row">
                    <span class="st-letter"><b>${st.id})</b></span>
                    <span class="st-content">${st.statement}</span>
                    ${keyStr ? `<span class="st-key-box">${keyStr}</span>` : `<span class="st-blank-box">[&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]</span>`}
                </div>`;
            }).join('');

            const explainHtml = (includeKey && q.explanation) ? `
                <div class="doc-explanation-box">
                    💡 <b>Hướng dẫn giải:</b> ${q.explanation}
                </div>` : "";

            htmlContent += `
            <div class="doc-question-card">
                <div class="doc-q-title">
                    <b>Câu ${questionGlobalIdx}.</b> ${q.question}
                </div>
                ${imgHtml}
                <div class="doc-statements-list">
                    ${stRowsHtml}
                </div>
                ${explainHtml}
            </div>`;
            questionGlobalIdx++;
        });
    }

    if (p3List.length > 0) {
        htmlContent += `
        <div class="part-header-box">
            <b>PHẦN III. Câu trắc nghiệm trả lời ngắn.</b> Thí sinh trả lời từ câu ${questionGlobalIdx} đến câu ${questionGlobalIdx + p3List.length - 1}.
        </div>`;
        p3List.forEach(q => {
            const imgUrl = getEffectiveImageUrlForExport(q, images);
            const imgHtml = imgUrl ? `
                <div class="doc-img-container">
                    <img src="${imgUrl}" class="doc-q-img" alt="Hình minh họa câu ${questionGlobalIdx}">
                </div>` : "";

            const answerBoxHtml = (includeKey && q.correctAnswer !== undefined) 
                ? `<div class="doc-short-answer-line"><b>Đáp số:</b> <span class="correct-short-ans">${q.correctAnswer}</span></div>` 
                : `<div class="doc-short-answer-line"><b>Đáp số:</b> ........................................................................................</div>`;

            const explainHtml = (includeKey && q.explanation) ? `
                <div class="doc-explanation-box">
                    💡 <b>Hướng dẫn giải:</b> ${q.explanation}
                </div>` : "";

            htmlContent += `
            <div class="doc-question-card">
                <div class="doc-q-title">
                    <b>Câu ${questionGlobalIdx}.</b> ${q.question}
                </div>
                ${imgHtml}
                ${answerBoxHtml}
                ${explainHtml}
            </div>`;
            questionGlobalIdx++;
        });
    }

    if (p4List.length > 0) {
        htmlContent += `
        <div class="part-header-box">
            <b>PHẦN IV. Tự luận điền kết quả & Trình bày bài làm.</b> Thí sinh trả lời từ câu ${questionGlobalIdx} đến câu ${questionGlobalIdx + p4List.length - 1}.
        </div>`;
        p4List.forEach(q => {
            const imgUrl = getEffectiveImageUrlForExport(q, images);
            const imgHtml = imgUrl ? `
                <div class="doc-img-container">
                    <img src="${imgUrl}" class="doc-q-img" alt="Hình minh họa câu ${questionGlobalIdx}">
                </div>` : "";

            const answerBoxHtml = (includeKey && q.correctAnswer !== undefined) 
                ? `<div class="doc-short-answer-line"><b>Kết quả:</b> <span class="correct-short-ans">${q.correctAnswer}</span></div>` 
                : `<div class="doc-short-answer-line"><b>Kết quả:</b> ........................................................................................</div>`;

            const explainHtml = (includeKey && q.explanation) ? `
                <div class="doc-explanation-box">
                    💡 <b>Lời giải chi tiết:</b> ${q.explanation}
                </div>` : "";

            htmlContent += `
            <div class="doc-question-card">
                <div class="doc-q-title">
                    <b>Câu ${questionGlobalIdx}.</b> ${q.question}
                </div>
                ${imgHtml}
                ${answerBoxHtml}
                ${explainHtml}
            </div>`;
            questionGlobalIdx++;
        });
    }

    let summaryKeyTableHtml = "";
    if (includeKey) {
        let cellsP1 = "";
        const letters = ["A", "B", "C", "D"];
        p1List.forEach((q, idx) => {
            const ans = (q.correct !== undefined) ? letters[q.correct] : "--";
            cellsP1 += `<td><b>${idx + 1}</b></td><td>${ans}</td>`;
            if ((idx + 1) % 10 === 0 && (idx + 1) < p1List.length) cellsP1 += `</tr><tr>`;
        });

        summaryKeyTableHtml = `
        <div class="doc-summary-key-section">
            <h3 style="text-align:center; color:#0369a1; margin:16px 0 8px 0; text-transform:uppercase;">
                BẢNG ĐÁP ÁN TỔNG HỢP - MÃ ĐỀ ${maDe}
            </h3>
            ${p1List.length > 0 ? `
            <div style="margin-bottom:12px;">
                <b>Phần I (Trắc nghiệm 4 lựa chọn):</b>
                <table class="doc-key-table">
                    <tr>${cellsP1}</tr>
                </table>
            </div>` : ''}
        </div>`;
    }

    return `
    <div class="exam-doc-page">
        <table class="exam-doc-header-table">
            <tr>
                <td style="width: 48%; text-align: center; vertical-align: top;">
                    <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
                    <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">TRƯỜNG THPT CHUYÊN & CLC</div>
                    <div style="font-size: 10pt; font-style: italic;">(Đề thi gồm có ${questions.length} câu)</div>
                </td>
                <td style="width: 52%; text-align: center; vertical-align: top;">
                    <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">KỲ THI KHẢO SÁT CHẤT LƯỢNG HỌC KỲ</div>
                    <div style="font-size: 11pt; font-weight: bold; color: #b91c1c; text-transform: uppercase;">MÔN: TOÁN HỌC</div>
                    <div style="font-size: 10pt; font-weight: bold;">Thời gian làm bài: ${timeLimit} phút</div>
                </td>
            </tr>
        </table>

        <div class="exam-doc-banner-title">
            <h2>${examTitle}</h2>
            <div class="exam-doc-made-badge">MÃ ĐỀ THI: ${maDe}</div>
        </div>

        <div class="exam-student-info-box">
            <span>Họ và tên thí sinh: ....................................................................................................</span>
            <span style="float: right;">Số báo danh: ............................. Lớp: .................</span>
            <div style="clear: both;"></div>
        </div>

        <div class="exam-questions-content">
            ${htmlContent}
        </div>

        <div style="text-align: center; margin: 24px 0 16px 0; font-weight: bold; font-style: italic;">
            ---------- HẾT ----------
        </div>

        ${summaryKeyTableHtml}
    </div>`;
}

function exportExamToPDF(data, examTitle, maDe, timeLimit, includeKey) {
    const printableHtml = buildExamDocumentHtml(data, examTitle, maDe, timeLimit, includeKey, false);
    const win = window.open("", "_blank");
    if (!win) {
        alert("⚠️ Trình duyệt đã chặn cửa sổ bật lên (Pop-up). Vui lòng cho phép mở pop-up để xuất PDF!");
        return;
    }

    win.document.open();
    win.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>${examTitle} - Mã đề ${maDe}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <script>
            window.MathJax = {
                tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']] },
                svg: { scale: 1.05, fontCache: 'global' }
            };
        </script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
        <style>
            @page { size: A4; margin: 15mm; }
            *, *::before, *::after { box-sizing: border-box; }
            body { font-family: 'Be Vietnam Pro', 'Times New Roman', serif; font-size: 11pt; line-height: 1.45; color: #000; background: #fff; margin: 0; padding: 10px; }
            .exam-doc-header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border-bottom: 1.5px solid #000; padding-bottom: 6px; }
            .exam-doc-banner-title { text-align: center; margin: 8px 0 10px 0; }
            .exam-doc-banner-title h2 { margin: 0; font-size: 13.5pt; font-weight: 900; text-transform: uppercase; color: #000; }
            .exam-doc-made-badge { display: inline-block; border: 1.5px solid #000; padding: 2px 10px; font-weight: 800; font-size: 10.5pt; border-radius: 4px; margin-top: 4px; }
            .exam-student-info-box { border: 1px dashed #000; padding: 7px 12px; border-radius: 6px; margin-bottom: 14px; font-size: 10.5pt; }
            .part-header-box { background: #f1f5f9; border-left: 4.5px solid #0284c7; padding: 6px 10px; font-size: 11pt; font-weight: 600; margin: 14px 0 10px 0; page-break-after: avoid; break-after: avoid; }
            .doc-question-card { margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid; text-align: justify; }
            .doc-q-title { font-size: 11pt; line-height: 1.45; }
            .doc-img-container { text-align: center; margin: 8px 0; page-break-inside: avoid; }
            .doc-q-img { max-width: 90%; max-height: 250px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 6px; }
            .doc-options-wrapper { display: grid; gap: 5px 14px; margin-top: 6px; }
            .opt-grid-4 { grid-template-columns: repeat(4, 1fr); }
            .opt-grid-2 { grid-template-columns: repeat(2, 1fr); }
            .opt-grid-1 { grid-template-columns: 1fr; }
            .doc-option-item { font-size: 10.8pt; padding: 2px 0; }
            .doc-statements-list { margin-top: 6px; display: flex; flex-direction: column; gap: 5px; }
            .doc-statement-row { display: flex; align-items: baseline; gap: 6px; font-size: 10.8pt; }
            .st-letter { flex-shrink: 0; min-width: 22px; }
            .st-content { flex: 1; }
            .st-blank-box { flex-shrink: 0; font-family: monospace; color: #475569; }
            .tf-badge { font-weight: 800; font-size: 9.5pt; padding: 1px 7px; border-radius: 4px; border: 1px solid #000; }
            .tf-true { background: #dcfce7; color: #15803d; }
            .tf-false { background: #fee2e2; color: #b91c1c; }
            .correct-highlight { color: #15803d; font-weight: 700; }
            .key-mark { color: #16a34a; font-weight: 900; margin-left: 4px; }
            .doc-short-answer-line { margin-top: 6px; font-size: 10.8pt; }
            .correct-short-ans { font-weight: 900; color: #15803d; background: #dcfce7; padding: 1px 8px; border-radius: 4px; }
            .doc-explanation-box { background: #fffbeb; border-left: 3.5px solid #f59e0b; padding: 6px 10px; font-size: 10.2pt; margin-top: 6px; color: #78350f; page-break-inside: avoid; }
            .doc-key-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10pt; text-align: center; }
            .doc-key-table td { border: 1px solid #000; padding: 4px 6px; }
            .no-print-bar { position: fixed; bottom: 12px; right: 12px; z-index: 999999; display: flex; gap: 8px; }
            .btn-print-now { background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 10px 18px; border-radius: 20px; font-size: 13.5px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); }
            @media print { .no-print-bar { display: none !important; } body { padding: 0; } }
        </style>
    </head>
    <body>
        <div class="no-print-bar"><button class="btn-print-now" onclick="window.print()">🖨️ In ra giấy / Lưu PDF (Ctrl + P)</button></div>
        ${printableHtml}
        <script>
            window.addEventListener('load', function() {
                var checkMathJax = setInterval(function() {
                    if (window.MathJax && window.MathJax.typesetPromise) {
                        clearInterval(checkMathJax);
                        window.MathJax.typesetPromise().then(function() {
                            setTimeout(function() { window.print(); }, 800);
                        }).catch(function() { setTimeout(function() { window.print(); }, 800); });
                    }
                }, 200);
                setTimeout(function() { clearInterval(checkMathJax); }, 6000);
            });
        <\/script>
    </body>
    </html>`);
    win.document.close();
}

function exportExamToWord(data, examTitle, maDe, timeLimit, includeKey) {
    const wordInnerHtml = buildExamDocumentHtml(data, examTitle, maDe, timeLimit, includeKey, true);

    const wordCompleteHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset='utf-8'><title>${examTitle}</title>
        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
        <style>
            @page Section1 { size: 21.0cm 29.7cm; margin: 2.0cm 1.5cm; }
            div.Section1 { page: Section1; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.35; color: #000; }
            .exam-doc-header-table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
            .exam-doc-header-table td { border: none; padding: 2pt; font-family: 'Times New Roman', serif; }
            .exam-doc-banner-title { text-align: center; margin: 10pt 0; }
            .exam-doc-banner-title h2 { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0; }
            .exam-doc-made-badge { display: inline-block; border: 1pt solid #000; padding: 2pt 8pt; font-weight: bold; font-size: 11pt; margin-top: 4pt; }
            .exam-student-info-box { border: 1pt dashed #000; padding: 6pt 10pt; margin-bottom: 14pt; }
            .part-header-box { background: #e2e8f0; padding: 6pt; font-weight: bold; margin: 12pt 0 8pt 0; }
            .doc-question-card { margin-bottom: 10pt; text-align: justify; }
            .doc-q-title { font-weight: normal; margin-bottom: 4pt; }
            .doc-img-container { text-align: center; margin: 8pt 0; }
            .doc-q-img { max-width: 420px; height: auto; }
            .doc-options-wrapper { margin-top: 4pt; }
            .doc-option-item { margin-bottom: 3pt; }
            .doc-statement-row { margin-bottom: 3pt; }
            .correct-highlight { color: #15803d; font-weight: bold; }
            .doc-explanation-box { background: #fefce8; border-left: 3pt solid #ca8a04; padding: 5pt 8pt; margin-top: 4pt; color: #713f12; font-size: 11pt; }
            .doc-key-table { width: 100%; border-collapse: collapse; text-align: center; margin-top: 8pt; }
            .doc-key-table td { border: 1pt solid #000; padding: 4pt; font-size: 10pt; }
        </style>
    </head>
    <body>
        <div class="Section1">
            ${wordInnerHtml}
        </div>
    </body>
    </html>
    `;

    const blob = new Blob(['\ufeff', wordCompleteHtml], {
        type: 'application/msword;charset=utf-8'
    });

    const safeTitle = (examTitle || "De_Thi").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const fileName = `${safeTitle}_MaDe_${maDe}${includeKey ? '_CoDapAn' : ''}.doc`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}