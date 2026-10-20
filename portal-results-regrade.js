// =========================================================
// FILE: portal-results-regrade.js
// CHẤM LẠI TOÀN BỘ BÀI THI (KỂ CẢ HỌC SINH ĐANG LÀM DỞ BẢN NHÁP)
// =========================================================

function closeResultModal(triggerHistoryBack = true) {
    stopAutoRefreshResult();
    if (typeof stopRealtimeSubmissionsListener === 'function') stopRealtimeSubmissionsListener();
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
    }, 12000); 
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
    _regradeFileParsedAnswers = null; 
    dropdown.style.display = "block";
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
            preview.innerHTML = `✅ Đã đọc thành công <b>${file.name}</b> (tìm thấy <b>${count}</b> câu đáp án). Bấm nút bên dưới để chấm lại!`;
        }
    } catch(err) {
        _regradeFileParsedAnswers = null;
        if (preview) {
            preview.style.display = "block"; preview.style.color = "#dc2626"; preview.style.borderColor = "#fca5a5"; preview.style.background = "#fef2f2";
            preview.innerText = "❌ Lỗi đọc file: " + err.message;
        }
    }
}

// BỘ MÁY CHẤM LẠI ĐA NĂNG: TÍNH LẠI CẢ BÀI ĐÃ NỘP LẪN HỌC SINH ĐANG LÀM BÀI DỞ
async function processRegradeWithAnswers() {
    const btn = document.getElementById("btn-confirm-regrade");
    const currentItem = currentExamResultData.item;
    if (!currentItem) { alert("⚠️ Không xác định được đề thi đang xem!"); return; }

    let quizId = extractQuizIdFromItem(currentItem);
    if (!quizId) { alert("⚠️ Đề thi này không liên kết với ID quiz trên Firebase!"); return; }

    btn.disabled = true; btn.innerText = "⏳ Đang nạp đề gốc & dữ liệu...";

    try {
        const qRes = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
        let quizObj = await qRes.json();
        if (!quizObj || !quizObj.questions) { throw new Error("Không tìm thấy cấu trúc câu hỏi của đề thi trên máy chủ!"); }

        // Nếu Thầy có tải file đáp án mới lên, cập nhật vào đề gốc
        if (_regradeFileParsedAnswers) {
            quizObj = mergeQuestionsAndAnswers(quizObj, _regradeFileParsedAnswers);
            await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, { method: 'PATCH', body: JSON.stringify({ questions: quizObj.questions }) });
        }

        const newAnswerKey = {}; const letters = ["A", "B", "C", "D"];
        quizObj.questions.forEach(q => {
            if (q.type === "multiple_choice") {
                if (q.correct !== undefined) { newAnswerKey[`q${q.id}`] = (typeof q.correct === 'number') ? letters[q.correct] : String(q.correct).trim().toUpperCase(); }
            } else if (q.type === "true_false") {
                if (q.statements) { q.statements.forEach(st => { newAnswerKey[`q${q.id}_${st.id}`] = (st.correct === true || String(st.correct).toLowerCase() === 'đúng' || String(st.correct).toLowerCase() === 'true') ? "Đúng" : "Sai"; }); }
            } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") {
                if (q.correctAnswer !== undefined) { newAnswerKey[`q${q.id}`] = String(q.correctAnswer).trim(); }
            }
        });

        const scoringConfig = quizObj.scoringConfig || (currentItem && currentItem.scoringConfig) || { mode: 'option1' };

        btn.innerText = "⏳ Đang tải toàn bộ bài nộp & bản nháp...";

        // 1. Quét bài nộp chính thức ở cả /quizzes/${quizId}/submissions VÀ /exams/${code}/submissions
        const candidateCodes = getExamCandidateCodes(quizObj.title || currentItem.title || "", quizObj.maDe || "", quizId);
        let allSubmissionsToUpdate = [];

        // Quét node chuẩn nhất
        try {
            const qSubRes = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/submissions.json`);
            if (qSubRes.ok) {
                const qSubJson = await qSubRes.json();
                if (qSubJson && typeof qSubJson === 'object') {
                    for (let sKey in qSubJson) {
                        if (qSubJson[sKey]) {
                            qSubJson[sKey]._isQuizNode = true;
                            qSubJson[sKey]._subId = sKey;
                            allSubmissionsToUpdate.push(qSubJson[sKey]);
                        }
                    }
                }
            }
        } catch(e) {}

        // Quét thêm các node exams phụ
        for (const code of candidateCodes) {
            try {
                const sRes = await fetch(`${FIREBASE_DB_URL}/exams/${code}/submissions.json`);
                if (sRes.ok) {
                    const sJson = await sRes.json();
                    if (sJson && typeof sJson === 'object') {
                        for (let subId in sJson) {
                            let subObj = sJson[subId];
                            if (subObj && typeof subObj === 'object') {
                                const exists = allSubmissionsToUpdate.some(item => (item.sbd && item.sbd === subObj.sbd) || item._subId === subId);
                                if (!exists) {
                                    subObj._nodeCode = code;
                                    subObj._subId = subId;
                                    allSubmissionsToUpdate.push(subObj);
                                }
                            }
                        }
                    }
                }
            } catch(e) {}
        }

        // 2. Quét cả các bản nháp của HỌC SINH ĐANG LÀM BÀI DỞ DANG (/live_drafts)
        let liveDraftsToRegrade = [];
        try {
            const draftsRes = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/live_drafts.json`);
            if (draftsRes.ok) {
                const draftsJson = await draftsRes.json();
                if (draftsJson && typeof draftsJson === 'object') {
                    for (let dKey in draftsJson) {
                        if (draftsJson[dKey] && draftsJson[dKey].userAnswers) {
                            draftsJson[dKey]._draftKey = dKey;
                            liveDraftsToRegrade.push(draftsJson[dKey]);
                        }
                    }
                }
            }
        } catch(e) {}

        if (allSubmissionsToUpdate.length === 0 && liveDraftsToRegrade.length === 0) {
            alert("ℹ️ Đã cập nhật đáp án vào đề thi thành công! Chưa có bài làm hoặc bản nháp nào của học sinh cần chấm lại.");
            closeRegradeModal(); btn.disabled = false; btn.innerText = "🚀 Chấm lại ngay";
            await refreshCurrentExamResults(); return;
        }

        btn.innerText = `⏳ Đang chấm lại ${allSubmissionsToUpdate.length} bài nộp & ${liveDraftsToRegrade.length} em đang làm...`;
        let updatedCount = 0;

        // CHẤM LẠI CÁC BÀI ĐÃ NỘP CHÍNH THỨC
        const regradeSubmissionTasks = allSubmissionsToUpdate.map(async (sub) => {
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

            const scoreRes = calculateExamScoreWithConfig(quizObj.questions, userAnswersMap, newAnswerKey, scoringConfig);
            const { correctCount, wrongCount, totalRawScore, maxTotalScore, finalScore, maxScale, dataDetails } = scoreRes;
            const originalTab = parseInt(sub.tabSwitchCount, 10) || extractTabCountFromDataString(sub.dataString) || 0;
            dataDetails.push(`Tab Switch: ${originalTab}`);

            const patchPayload = {
                score10: finalScore,
                rawScore: Math.round(totalRawScore * 100) / 100,
                maxScale: maxScale,
                correctCount: correctCount,
                wrongCount: wrongCount,
                dataString: dataDetails.join(" | "),
                calcMetrics: { ...(sub.calcMetrics || {}), correctCount, wrongCount, score10Scale: finalScore, maxScale },
                regradedAt: Date.now()
            };

            const writePromises = [];
            writePromises.push(fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/submissions/${sub._subId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patchPayload)
            }));

            if (sub._nodeCode) {
                writePromises.push(fetch(`${FIREBASE_DB_URL}/exams/${sub._nodeCode}/submissions/${sub._subId}.json`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patchPayload)
                }));
            }

            try {
                await Promise.all(writePromises);
                updatedCount++;
            } catch(e) {}
        });

        // CHẤM LẠI CHO CẢ HỌC SINH ĐANG LÀM BÀI DỞ DANG (CẬP NHẬT TRỰC TIẾP VÀO LIVE_DRAFT)
        const regradeDraftTasks = liveDraftsToRegrade.map(async (draft) => {
            const draftAnswers = draft.userAnswers || {};
            const draftScore = calculateExamScoreWithConfig(quizObj.questions, draftAnswers, newAnswerKey, scoringConfig);

            const patchDraft = {
                temporaryScore10: draftScore.finalScore,
                temporaryCorrect: draftScore.correctCount,
                regradedAt: Date.now()
            };

            try {
                await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/live_drafts/${draft._draftKey}.json`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patchDraft)
                });
                updatedCount++;
            } catch(e) {}
        });

        await Promise.all([...regradeSubmissionTasks, ...regradeDraftTasks]);
        
        alert(`🎉 CHẤM LẠI THÀNH CÔNG!\n\n- Đã cập nhật đáp án và biểu điểm chuẩn xác.\n- Đã tính lại và đồng bộ thành công cho ${updatedCount} lượt bài làm (bao gồm cả các em đã nộp bài và các em đang làm bài dở).`);
        closeRegradeModal(); 
        await refreshCurrentExamResults();
    } catch(err) {
        alert("❌ Lỗi trong quá trình chấm lại: " + err.message);
    } finally { 
        btn.disabled = false; btn.innerText = "🚀 Chấm lại ngay"; 
    }
}

function triggerUploadBackupJson(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const fileInput = document.getElementById("input-upload-backup-json");
    if (fileInput) { fileInput.value = ""; fileInput.click(); }
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

        const currentItem = currentExamResultData.item;
        const currentQuizId = (currentItem && extractQuizIdFromItem(currentItem)) || payload.quizId || "exam";
        const cleanSbd = (studentId || "user").replace(/[^a-zA-Z0-9]/g, '_');

        payload.createdAt = payload.createdAt || Date.now();
        payload.timestamp = payload.timestamp || formatDateTimeFull(payload.createdAt);
        payload.studentName = studentName;
        payload.studentId = studentId;
        payload.sbd = studentId;
        payload.studentClass = studentClass;
        payload.className = studentClass;
        payload.categoryId = payload.categoryId || payload.cat || currentExamResultData.categoryId || "them-11";
        payload.cat = payload.categoryId;
        payload.quizId = currentQuizId;

        // Lưu đồng bộ vào cả 2 node chính trên Firebase
        await Promise.all([
            fetch(`${FIREBASE_DB_URL}/quizzes/${currentQuizId}/submissions/${cleanSbd}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }),
            fetch(`${FIREBASE_DB_URL}/exams/${currentQuizId}/submissions/${cleanSbd}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
        ]);

        alert(`🎉 NẠP BÀI THÀNH CÔNG!\n\n- Thí sinh: ${studentName}\n- SBD: ${studentId} | Lớp: ${studentClass}\n- Điểm: ${payload.score10 ?? '---'}đ\n\nBài thi đã được ghi nhận ngay vào bảng kết quả!`);
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
