// =========================================================
// FILE: portal-results-regrade.js
// CHẤM LẠI BÀI THI, TỰ ĐỘNG LÀM MỚI & NẠP FILE JSON DỰ PHÒNG
// =========================================================

function closeResultModal(triggerHistoryBack = true) {
    stopAutoRefreshResult();
    const modal = document.getElementById("result-fullscreen-modal");
    if (modal) modal.style.display = "none";
    closeRegradeModal();
    if (triggerHistoryBack && window.location.hash.startsWith("#bang-ket-qua")) { window.history.back(); }
}

function startAutoRefreshResult() {
    stopAutoRefreshResult();
    if (!isAutoRefreshEnabled) return;
    autoRefreshTimer = setInterval(async () => {
        const modal = document.getElementById("result-fullscreen-modal");
        if (modal && modal.style.display === "flex" && currentExamResultData.item) {
            await fetchAndRenderExamResults(currentExamResultData.item, true);
        }
    }, 15000); 
}

function stopAutoRefreshResult() {
    if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
}

function toggleAutoRefresh(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    isAutoRefreshEnabled = !isAutoRefreshEnabled;
    const btn = document.getElementById("btn-toggle-autorefresh");
    if (isAutoRefreshEnabled) {
        if (btn) { btn.innerHTML = "🟢 Tự động: BẬT"; btn.style.color = "#38bdf8"; btn.style.borderColor = "#38bdf8"; }
        startAutoRefreshResult();
    } else {
        if (btn) { btn.innerHTML = "⚪ Tự động: TẮT"; btn.style.color = "#94a3b8"; btn.style.borderColor = "#64748b"; }
        stopAutoRefreshResult();
    }
}

function openRegradeModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const dropdown = document.getElementById("regrade-inline-dropdown");
    const preview = document.getElementById("regrade-file-preview-status");
    const fileInput = document.getElementById("regrade-answer-file");

    if (!dropdown) return;
    if (dropdown.style.display === "block") { dropdown.style.display = "none"; return; }

    if (fileInput) fileInput.value = "";
    if (preview) { preview.style.display = "none"; preview.innerText = ""; }
    _regradeFileParsedAnswers = null; dropdown.style.display = "block";
}

function closeRegradeModal(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById("regrade-inline-dropdown");
    if (dropdown) dropdown.style.display = "none";
    _regradeFileParsedAnswers = null;
}

async function previewRegradeFile(input) {
    const preview = document.getElementById("regrade-file-preview-status");
    if (!input.files || input.files.length === 0) {
        if (preview) preview.style.display = "none";
        _regradeFileParsedAnswers = null; return;
    }
    const file = input.files[0];
    try {
        const text = await readFileAsTextAsync(file); const parsed = parseScriptOrJson(text);
        if (!parsed) throw new Error("Không thể phân tích file! Vui lòng kiểm tra định dạng.");
        const answersMap = parsed.answers || parsed.dapan || parsed;
        const count = Object.keys(answersMap).length;
        if (count === 0) throw new Error("File không chứa trường answers / dapan hợp lệ!");

        _regradeFileParsedAnswers = parsed;
        if (preview) {
            preview.style.display = "block"; preview.style.color = "#0369a1"; preview.style.borderColor = "#bae6fd"; preview.style.background = "#f0f9ff";
            preview.innerHTML = `✅ Đã đọc thành công <b>${file.name}</b> (tìm thấy <b>${count}</b> câu đáp án). Sẵn sàng chấm lại!`;
        }
    } catch(err) {
        _regradeFileParsedAnswers = null;
        if (preview) {
            preview.style.display = "block"; preview.style.color = "#dc2626"; preview.style.borderColor = "#fca5a5"; preview.style.background = "#fef2f2";
            preview.innerText = "❌ Lỗi đọc file: " + err.message;
        }
    }
}

async function processRegradeWithAnswers() {
    const btn = document.getElementById("btn-confirm-regrade");
    const fileInput = document.getElementById("regrade-answer-file");

    if (!_regradeFileParsedAnswers) {
        if (fileInput && fileInput.files.length > 0) { await previewRegradeFile(fileInput); }
        if (!_regradeFileParsedAnswers) { alert("⚠️ Vui lòng chọn file đáp án đã sửa hợp lệ trước khi bắt đầu!"); return; }
    }

    const currentItem = currentExamResultData.item;
    if (!currentItem) { alert("⚠️ Không xác định được đề thi đang xem!"); return; }

    let quizId = extractQuizIdFromItem(currentItem);
    if (!quizId) { alert("⚠️ Đề thi này không liên kết với cơ sở dữ liệu câu hỏi quiz trực tuyến!"); return; }

    btn.disabled = true; btn.innerText = "⏳ Đang nạp đề gốc...";

    try {
        const qRes = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
        let quizObj = await qRes.json();
        if (!quizObj || !quizObj.questions) { throw new Error("Không tìm thấy cấu trúc câu hỏi của đề thi trên máy chủ!"); }

        quizObj = mergeQuestionsAndAnswers(quizObj, _regradeFileParsedAnswers);
        await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, { method: 'PATCH', body: JSON.stringify({ questions: quizObj.questions }) });

        const newAnswerKey = {}; const letters = ["A", "B", "C", "D"];
        quizObj.questions.forEach(q => {
            if (q.type === "multiple_choice") {
                if (q.correct !== undefined) { newAnswerKey[`q${q.id}`] = (typeof q.correct === 'number') ? letters[q.correct] : String(q.correct).trim().toUpperCase(); }
            } else if (q.type === "true_false") {
                if (q.statements) { q.statements.forEach(st => { newAnswerKey[`q${q.id}_${st.id}`] = st.correct ? "Đúng" : "Sai"; }); }
            } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") {
                if (q.correctAnswer !== undefined) { newAnswerKey[`q${q.id}`] = String(q.correctAnswer).trim(); }
            }
        });

        btn.innerText = "⏳ Đang tải bài làm...";
        const examTitle = quizObj.title || currentItem.title || "";
        const candidateCodes = getExamCandidateCodes(examTitle, quizObj.maDe || "", quizId);
        let allSubmissionsToUpdate = [];

        for (const code of candidateCodes) {
            try {
                const sRes = await fetch(`${FIREBASE_DB_URL}/exams/${code}/submissions.json`);
                if (sRes.ok) {
                    const sJson = await sRes.json();
                    if (sJson && typeof sJson === 'object') {
                        for (let subId in sJson) {
                            let subObj = sJson[subId];
                            if (subObj && typeof subObj === 'object') { subObj._nodeCode = code; subObj._subId = subId; allSubmissionsToUpdate.push(subObj); }
                        }
                    }
                }
            } catch(e) {}
        }

        if (allSubmissionsToUpdate.length === 0) {
            alert("ℹ️ Đã cập nhật đáp án mới vào đề thi thành công! Chưa có bài làm nào của học sinh cần tính lại điểm.");
            closeRegradeModal(); btn.disabled = false; btn.innerText = "🚀 Chấm lại ngay";
            await refreshCurrentExamResults(); return;
        }

        btn.innerText = `⏳ Đang chấm lại ${allSubmissionsToUpdate.length} bài...`;
        let updatedCount = 0;

        const regradeTasks = allSubmissionsToUpdate.map(async (sub) => {
            const userAnswersMap = {};
            if (sub.dataString) {
                const parts = sub.dataString.split(/\s*\|\s*/);
                parts.forEach(part => {
                    let m = part.match(/^(\d+)([a-zA-Z]?)\s*-\s*(.*?)\s*\[(?:ĐÚNG|SAI.*?)]$/i);
                    if (m) {
                        let qNum = m[1]; let subPart = m[2]; let ansVal = m[3].trim();
                        if (subPart) { userAnswersMap[`q${qNum}_${subPart}`] = ansVal; } else { userAnswersMap[`q${qNum}`] = ansVal; }
                    }
                });
            }
            if (sub.userAnswers && typeof sub.userAnswers === 'object') { Object.assign(userAnswersMap, sub.userAnswers); }

            let correctCount = 0; let wrongCount = 0; let totalRawScore = 0; let maxTotalScore = 0; let dataDetails = [];

            quizObj.questions.forEach(q => {
                maxTotalScore += 1.0;
                if (q.type === "multiple_choice") {
                    const userVal = userAnswersMap[`q${q.id}`] || "Chưa chọn"; const correctVal = newAnswerKey[`q${q.id}`];
                    if (correctVal && userVal.toUpperCase() === correctVal.toUpperCase()) {
                        correctCount++; totalRawScore += 1.0; dataDetails.push(`${q.id}-${userVal} [ĐÚNG]`);
                    } else {
                        wrongCount++; dataDetails.push(`${q.id}-${userVal} [SAI: ${correctVal || "---"}]`);
                    }
                } else if (q.type === "true_false") {
                    let cSt = 0;
                    (q.statements || []).forEach(st => {
                        const subKey = `q${q.id}_${st.id}`; const uVal = userAnswersMap[subKey] || "Chưa chọn"; const cVal = newAnswerKey[subKey];
                        if (cVal && uVal === cVal) { cSt++; dataDetails.push(`${q.id}${st.id}-${uVal} [ĐÚNG]`); } 
                        else { dataDetails.push(`${q.id}${st.id}-${uVal} [SAI]`); }
                    });
                    let qScore = 0;
                    if (cSt === 1) qScore = 0.1; else if (cSt === 2) qScore = 0.25; else if (cSt === 3) qScore = 0.5; else if (cSt === 4) qScore = 1.0;
                    totalRawScore += qScore;
                    if (cSt === (q.statements ? q.statements.length : 4)) correctCount++; else wrongCount++;
                } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") {
                    const uVal = String(userAnswersMap[`q${q.id}`] || "").trim().replace(',', '.'); const cVal = String(newAnswerKey[`q${q.id}`] || "").trim().replace(',', '.');
                    const isRight = (uVal !== "" && cVal !== "" && (uVal === cVal || Number(uVal) === Number(cVal)));
                    if (isRight) {
                        correctCount++; totalRawScore += 1.0; dataDetails.push(`${q.id}-${uVal} [ĐÚNG]`);
                    } else {
                        wrongCount++; dataDetails.push(`${q.id}-${uVal || "Trống"} [SAI: ${cVal || "---"}]`);
                    }
                }
            });

            const score10Scale = Math.round(((totalRawScore / (maxTotalScore || 1)) * 10) * 10) / 10;
            const originalTab = parseInt(sub.tabSwitchCount, 10) || extractTabCountFromDataString(sub.dataString) || 0;
            dataDetails.push(`Tab Switch: ${originalTab}`);

            const patchPayload = {
                score10: score10Scale, rawScore: Math.round(totalRawScore * 100) / 100, correctCount: correctCount,
                dataString: dataDetails.join(" | "),
                calcMetrics: { ...(sub.calcMetrics || {}), correctCount: correctCount, wrongCount: wrongCount, score10Scale: score10Scale },
                regradedAt: Date.now()
            };

            try { await fetch(`${FIREBASE_DB_URL}/exams/${sub._nodeCode}/submissions/${sub._subId}.json`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patchPayload) }); updatedCount++; } catch(e) {}
        });

        await Promise.all(regradeTasks);
        alert(`🎉 CHẤM LẠI THÀNH CÔNG!\n\n- Đã cập nhật đáp án mới vào đề thi gốc.\n- Đã tính lại điểm và cập nhật đồng bộ ${updatedCount} bài làm của học sinh.`);
        closeRegradeModal(); await refreshCurrentExamResults();
    } catch(err) {
        alert("❌ Lỗi trong quá trình chấm lại: " + err.message);
    } finally { btn.disabled = false; btn.innerText = "🚀 Chấm lại ngay"; }
}

function triggerUploadBackupJson(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const fileInput = document.getElementById("input-upload-backup-json");
    if (fileInput) {
        fileInput.value = "";
        fileInput.click();
    }
}

function readFileTextInternalAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = err => reject(err);
        reader.readAsText(file);
    });
}

async function handleBackupJsonFileInput(inputEl) {
    if (!inputEl.files || inputEl.files.length === 0) return;
    const file = inputEl.files[0];

    const btn = document.getElementById("btn-upload-json-backup");
    let oldBtnText = "📥 Upload JSON nộp sót";
    if (btn) {
        oldBtnText = btn.innerHTML;
        btn.innerHTML = "⏳ Đang nạp...";
        btn.style.opacity = "0.7";
        btn.style.pointerEvents = "none";
    }

    try {
        const fileContent = await readFileTextInternalAsync(file);
        let payload = null;
        try {
            payload = JSON.parse(fileContent);
        } catch (jsonErr) {
            throw new Error("File được chọn không đúng định dạng JSON hợp lệ!");
        }

        if (!payload || typeof payload !== 'object') {
            throw new Error("Nội dung file JSON trống hoặc không hợp lệ!");
        }

        const studentName = payload.studentName || payload.name || "Học sinh";
        const studentId = payload.studentId || payload.sbd || "---";
        const studentClass = payload.studentClass || payload.className || "Tự do";

        if (!payload.dataString && payload.score10 === undefined && !payload.calcMetrics) {
            throw new Error("File JSON này không chứa dữ liệu câu trả lời hoặc điểm số của bài làm!");
        }

        const currentItem = currentExamResultData.item;
        const currentTitle = (currentItem && currentItem.title) ? currentItem.title : "";
        const fileExamTitle = payload.examName || payload.examTitle || "";

        if (currentTitle && fileExamTitle) {
            const normCur = normalizeName(currentTitle);
            const normFile = normalizeName(fileExamTitle);
            if (normCur && normFile && normCur !== normFile && !normCur.includes(normFile) && !normFile.includes(normCur)) {
                const confirmDiff = confirm(`⚠️ CẢNH BÁO ĐỀ THI KHÁC NHAU:\n\n- Đề đang xem: "${currentTitle}"\n- Đề trong file: "${fileExamTitle}"\n\nBạn có CHẮC CHẮN muốn nạp bài làm của "${studentName}" (${studentId}) vào bảng kết quả của đề đang xem không?`);
                if (!confirmDiff) return;
            }
        }

        let targetCode = cleanExamCodeKey(payload.maDe);
        if (!targetCode && currentItem) targetCode = cleanExamCodeKey(currentItem.maDe || currentItem.title);
        if (!targetCode && payload.quizId) targetCode = cleanExamCodeKey(payload.quizId);
        if (!targetCode) targetCode = "101";

        payload.createdAt = payload.createdAt || Date.now();
        payload.timestamp = payload.timestamp || formatDateTimeFull(payload.createdAt);
        payload.studentName = studentName;
        payload.studentId = studentId;
        payload.sbd = studentId;
        payload.studentClass = studentClass;
        payload.className = studentClass;
        payload.categoryId = payload.categoryId || payload.cat || currentExamResultData.categoryId || "them-11";
        payload.cat = payload.categoryId;

        const uploadUrl = `${FIREBASE_DB_URL}/exams/${targetCode}/submissions.json`;
        const fbRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!fbRes.ok) throw new Error(`Máy chủ Firebase phản hồi mã lỗi HTTP ${fbRes.status}`);

        alert(`🎉 NẠP BÀI THÀNH CÔNG!\n\n- Thí sinh: ${studentName}\n- SBD: ${studentId} | Lớp: ${studentClass}\n- Điểm: ${payload.score10 ?? '---'}đ\n\nBài thi đã được ghi nhận vào hệ thống và sẽ xuất hiện ngay trong bảng kết quả!`);
        await refreshCurrentExamResults();

    } catch (err) {
        alert("❌ Lỗi khi nạp bài JSON: " + err.message);
    } finally {
        if (btn) {
            btn.innerHTML = oldBtnText;
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        }
        inputEl.value = "";
    }
}

window.addEventListener("popstate", function(event) {
    const resModal = document.getElementById("result-fullscreen-modal");
    if (!resModal || resModal.style.display !== "flex") return;
    const hash = window.location.hash;
    if (hash === "#bang-ket-qua/thong-ke") showDetailedStatsUI(); 
    else if (hash === "#bang-ket-qua") showMainResultTableUI(); 
    else closeResultModal(false);
});