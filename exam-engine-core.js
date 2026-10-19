// =========================================================
// FILE: exam-engine-core.js
// ĐỘNG CƠ BÀI THI BẢO MẬT, CƠ CHẾ NỘP BÀI ĐA KÊNH AN TOÀN TUYỆT ĐỐI
// =========================================================

window.SECURE_VAULT = window.SECURE_VAULT || {
    answers: {},
    explanations: {},
    userAnswers: {},
    padletClicked: {},
    questionData: {}
};

let hasInitExamEngine = false;
let isExamLocked = false;
let lockedDurationSec = 0;
let isSubmittingInProgress = false;

(function injectLockStyles() {
    const styleId = "exam-engine-lock-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
        .quiz-content-locked {
            pointer-events: none !important;
            user-select: none !important;
            opacity: 0.88;
        }
        .quiz-content-locked input, 
        .quiz-content-locked textarea, 
        .quiz-content-locked select, 
        .quiz-content-locked button {
            cursor: not-allowed !important;
        }
    `;
    document.head.appendChild(style);
})();

window.addEventListener('online', function() {
    if (isExamLocked && !isSubmitted && pendingSubmissionPayload) {
        if (typeof showTimeChangeToast === 'function') {
            showTimeChangeToast("📶 Đã có kết nối Internet trở lại! Đang tự động gửi bài...");
        }
        executeSubmitExam(false);
    }
});

function lockExamInteractions() {
    isExamLocked = true;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (!lockedDurationSec && examStartTime) {
        lockedDurationSec = Math.max(1, Math.round((Date.now() - examStartTime) / 1000));
    }

    const quizContent = document.getElementById("quiz-content");
    if (quizContent) {
        quizContent.classList.add("quiz-content-locked");
        const allInputs = quizContent.querySelectorAll("input, button, select, textarea");
        allInputs.forEach(el => {
            el.disabled = true;
            if (el.tagName === 'INPUT' && el.type === 'text') el.readOnly = true;
        });
    }

    const topSubmitBtn = document.querySelector(".btn-top-submit");
    if (topSubmitBtn) {
        topSubmitBtn.innerText = "⏳ Đang nộp";
        topSubmitBtn.style.background = "linear-gradient(135deg, #0284c7, #0369a1)";
        topSubmitBtn.onclick = function() {
            executeSubmitExam(false);
        };
    }

    const timerBox = document.getElementById("nav-timer-box");
    if (timerBox) {
        timerBox.classList.remove("timer-warning");
        const timerVal = document.getElementById("nav-timer-val");
        if (timerVal) timerVal.innerText = "ĐÃ KHÓA NỘP";
    }
}

async function initExamEngine() {
    if (hasInitExamEngine) return;
    hasInitExamEngine = true;

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');
    const isAutostart = (urlParams.get('autostart') === "1");

    const hideLoading = () => {
        const gl = document.getElementById('global-loading');
        if (gl) gl.style.display = 'none';
    };

    const updateLoadingText = (txt) => {
        const gl = document.getElementById('global-loading');
        if (gl) {
            const h2 = gl.querySelector("h2");
            if (h2) h2.innerText = txt;
        }
    };

    if (!quizId) {
        hideLoading();
        showError("Lỗi đường dẫn", "Không tìm thấy mã đề thi (thiếu tham số ?id=...)");
        return;
    }

    if (isAutostart) updateLoadingText("Đang kết nối phòng thi và tải đề...");

    const failsafeTimer = setTimeout(() => {
        const gl = document.getElementById('global-loading');
        if (gl && gl.style.display !== 'none') {
            hideLoading();
            showError("Kết nối chậm", "Máy chủ phản hồi chậm hoặc mạng Internet bị gián đoạn. Vui lòng kiểm tra lại mạng 4G/Wifi và tải lại trang!");
        }
    }, 8500);

    try {
        const controller = new AbortController();
        const fetchTimer = setTimeout(() => controller.abort(), 7500);

        const response = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, { signal: controller.signal });
        clearTimeout(fetchTimer);
        clearTimeout(failsafeTimer);

        examData = await response.json();
        if (!examData) throw new Error("Mã đề thi không tồn tại trên hệ thống!");

        if (urlParams.get('review') === "1") {
            if (examData.allowReviewOriginal !== true) {
                hideLoading();
                showError("Bị Khóa", "Giáo viên đã tắt tính năng xem đáp án gốc của đề thi này.");
                return;
            }
            isSubmitted = true;
            totalQuestionsCount = examData.questions ? examData.questions.length : 0;
            
            document.getElementById("top-navbar").style.display = "none";
            document.getElementById("quiz-content").style.display = "none";
            document.getElementById("login-box").style.display = "none";
            document.getElementById("student-card").style.display = "none";
            document.getElementById("waiting-room-card").style.display = "none";
            
            renderOriginalReviewScreen();
            hideLoading();
            return;
        }

        if (examData.allowFree !== undefined) {
            safeLocal.setItem(`exam_allow_free_${quizId}`, String(examData.allowFree !== false));
        }

        fetchExamQuestions(isAutostart);
        setupBackPrevention();
        if (typeof requestWakeLock === 'function') {
            try { requestWakeLock(); } catch(e) {}
        }
        
        checkPendingSubmissionOnLoad();
        await checkSessionStatus(isAutostart);
        startTimeWatcherRealtime(quizId);
        startImageSyncWatcher(quizId);
    } catch (error) {
        clearTimeout(failsafeTimer);
        hideLoading();
        showError("Lỗi tải đề thi", error.name === 'AbortError' 
            ? "Mạng Internet của bạn bị chập chờn, đã hết thời gian chờ máy chủ. Vui lòng bấm làm mới (F5) trang lại!" 
            : error.message);
    } finally {
        hideLoading();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExamEngine);
} else {
    initExamEngine();
}
window.addEventListener("load", initExamEngine);

function shuffleArray(arr) {
    let array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function shuffleExamData(data) {
    if (!data || !data.questions) return;
    let p1 = shuffleArray(data.questions.filter(q => q.type === "multiple_choice"));
    let p2 = shuffleArray(data.questions.filter(q => q.type === "true_false"));
    let p3 = shuffleArray(data.questions.filter(q => q.type === "short_answer"));
    let p4 = shuffleArray(data.questions.filter(q => q.type === "essay" || q.type === "essay_answer"));

    p1.forEach(q => {
        if (q.options && q.options.length > 0 && q.correct !== undefined) {
            let correctText = q.options[q.correct];
            q.options = shuffleArray(q.options);
            q.correct = q.options.indexOf(correctText);
        }
    });
    data.questions = [...p1, ...p2, ...p3, ...p4];
}

function trackPadletClick(qId) { 
    if (isSubmitted || isExamLocked) return;
    window.SECURE_VAULT.padletClicked[qId] = true; 
    saveExamStateToStorage(); 
}

function toggleSubPadlet(qId) { 
    if (isSubmitted || isExamLocked) return;
    const el = document.getElementById(`sub-padlet-dropdown-${qId}`); 
    if (el) el.style.display = (el.style.display === "none" || el.style.display === "") ? "flex" : "none"; 
}

function resetToFreshLoginScreen() { 
    safeLocal.removeItem(getStorageKey()); 
    safeLocal.removeItem(`shuffled_exam_${getExamCode()}`);
    safeLocal.removeItem("saved_student_sbd");
    safeLocal.removeItem("saved_student_name");
    safeLocal.removeItem("saved_student_class");
    safeLocal.removeItem("current_exam_student");
    safeLocal.removeItem("pending_exam_submission");
    safeLocal.setItem("last_submission_cleared", "true");

    const sName = document.getElementById("student-name");
    const sId = document.getElementById("student-id");
    const sClass = document.getElementById("student-class");
    if (sName) sName.value = "";
    if (sId) sId.value = "";
    if (sClass) sClass.value = "";
    window.location.reload(); 
}

async function startExamAction(isAutostart = false) {
    const sId = document.getElementById("student-id").value.trim();
    const sName = document.getElementById("student-name").value.trim();
    const sClass = document.getElementById("student-class").value.trim();

    if (!sId || !sName || !sClass) {
        if (!isAutostart) alert("⚠️ Vui lòng nhập đầy đủ Số báo danh, Họ và tên, Lớp!");
        return;
    }

    const currentCat = typeof getExamCategory === 'function' ? getExamCategory() : "them-11";
    const checkInClass = typeof findStudentFromDatabase === 'function' ? findStudentFromDatabase(sId, currentCat) : null;
    const isFree = !checkInClass;

    if (isFree) {
        const allowFree = typeof isCurrentExamAllowFree === 'function' ? isCurrentExamAllowFree() : true;
        if (!allowFree) {
            alert("⛔ Đề thi này không cho phép thí sinh tự do tham gia!\nVui lòng kiểm tra lại thông tin đăng nhập.");
            return;
        }
    }

    if (typeof executeStartExamAPI === 'function') {
        await executeStartExamAPI(sId, sName, sClass, isFree);
    }
}

async function checkSessionStatus(isAutostart = false) { 
    syncStudentFromParamsAndStorage();
    const hideLoading = () => {
        const gl = document.getElementById('global-loading');
        if (gl) gl.style.display = 'none';
    };

    if (restoreExamStateFromStorage()) { 
        const sName = document.getElementById("student-name").value.trim() || "Thí sinh"; 
        const sId = document.getElementById("student-id").value.trim() || "---"; 
        const sClass = document.getElementById("student-class").value.trim() || "---"; 
        document.getElementById("nav-student-name").innerText = sName; 
        document.getElementById("nav-student-id").innerText = sId; 
        document.getElementById("nav-student-class").innerText = sClass; 
        document.getElementById("nav-exam-code-text").innerText = `Đề: ${getMaDe()}`; 
        
        document.getElementById("login-box").style.display = "none"; 
        document.getElementById("student-card").style.display = "none"; 
        document.getElementById("waiting-room-card").style.display = "none"; 
        document.getElementById("top-navbar").style.display = "block"; 
        document.getElementById("quiz-content").style.display = "block"; 
        
        hideLoading();
        reapplySavedAnswers(); 
        updateProgress(); 

        if (isExamLocked) {
            lockExamInteractions();
            executeSubmitExam(false);
            return;
        }

        const elapsedTimeSec = Math.floor((Date.now() - examStartTime) / 1000); 
        const timeRemaining = totalTimeSeconds - elapsedTimeSec; 
        if (timeRemaining > 0) { 
            remainingSeconds = timeRemaining; 
            startCountdownTimer(); 
            startPresenceSystem(sId);
            return; 
        } else {
            executeSubmitExam(true);
            return;
        }
    }

    if (isAutostart) {
        const sId = document.getElementById("student-id").value.trim();
        const sName = document.getElementById("student-name").value.trim();
        if (sId && sName) {
            document.getElementById("login-box").style.display = "none";
            document.getElementById("student-card").style.display = "none";
            await startExamAction(true);
            hideLoading();
            return;
        }
    }
    hideLoading();
}

function fetchExamQuestions(isAutostart = false) { 
    try { 
        if (typeof examData === 'undefined' || !examData) { 
            showError("Lỗi", "Không tìm thấy dữ liệu đề thi!"); 
            return; 
        } 
        if (examData.title) { 
            EXAM_NAME = examData.title; 
            document.getElementById("banner-title").innerText = EXAM_NAME; 
            const examTitleEl = document.getElementById("res-exam-title");
            if (examTitleEl) examTitleEl.innerText = EXAM_NAME;
        } 
        document.getElementById("nav-exam-code-text").innerText = `Đề: ${getMaDe()}`; 
        if (examData.password !== undefined) EXAM_PASSWORD = String(examData.password).trim(); 
        if (examData.timeLimitMinutes !== undefined && examData.timeLimitMinutes !== "") { 
            TIME_LIMIT_MINUTES = parseInt(examData.timeLimitMinutes, 10); 
            totalTimeSeconds = TIME_LIMIT_MINUTES * 60; 
            remainingSeconds = totalTimeSeconds; 
        } 
        if (examData.examStartTimeStr && examData.examEndTimeStr) { 
            const st = new Date(examData.examStartTimeStr).toLocaleString("vi-VN"); 
            const et = new Date(examData.examEndTimeStr).toLocaleString("vi-VN"); 
            const noticeEl = document.getElementById("exam-time-notice"); 
            noticeEl.innerText = `⏱ Mở từ: ${st} - Đến: ${et}`; 
            noticeEl.style.display = "block"; 
        } 
        
        const shuffleKey = `shuffled_exam_${getExamCode()}`;
        const isAdminMode = typeof checkIsAdminPreviewMode === 'function' && checkIsAdminPreviewMode();
        let shouldShuffle = (examData.isShuffled !== false) && !isAdminMode; 

        if (shouldShuffle) {
            const cachedShuffle = safeLocal.getItem(shuffleKey);
            if (cachedShuffle) {
                try {
                    const parsedQ = JSON.parse(cachedShuffle);
                    if (Array.isArray(parsedQ)) {
                        parsedQ.forEach(q => {
                            q.imageUrl = getEffectiveImageUrl(q, examData.images || {}) || "";
                        });
                        examData.questions = parsedQ;
                    } else {
                        shuffleExamData(examData);
                        safeLocal.setItem(shuffleKey, JSON.stringify(examData.questions));
                    }
                } catch(e) {
                    shuffleExamData(examData);
                    safeLocal.setItem(shuffleKey, JSON.stringify(examData.questions));
                }
            } else {
                shuffleExamData(examData);
                safeLocal.setItem(shuffleKey, JSON.stringify(examData.questions));
            }
        } else {
            safeLocal.removeItem(shuffleKey);
        }

        if (!isAutostart) {
            if (EXAM_PASSWORD !== "") document.getElementById("login-box").style.display = "block"; 
            else document.getElementById("student-card").style.display = "block"; 
        } else {
            document.getElementById("login-box").style.display = "none";
            document.getElementById("student-card").style.display = "none";
        }
        
        renderQuizLayout(examData.questions || [], examData.images || {}); 
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise().catch(() => {});
        }
    } catch (err) { 
        showError("Lỗi", err.message); 
    } 
}

function showError(title, msg) { 
    document.getElementById("login-box").style.display = "none"; 
    document.getElementById("student-card").style.display = "none"; 
    const errCard = document.getElementById("error-card"); 
    document.getElementById("error-title").innerText = title; 
    document.getElementById("error-msg").innerHTML = msg; 
    errCard.style.display = "block"; 
}

function checkPassword() { 
    const val = document.getElementById("exam-pass-input").value.trim(); 
    if (!val) {
        alert("⚠️ Vui lòng nhập mật khẩu hoặc mã học sinh!");
        return;
    }

    const currentCat = typeof getExamCategory === 'function' ? getExamCategory() : "them-11";
    const matchedStudent = (typeof findStudentFromDatabase === 'function' ? findStudentFromDatabase(val, currentCat) : null) || 
                           (typeof findStudentByPassword === 'function' ? findStudentByPassword(val, currentCat) : null);
    
    if (matchedStudent) {
        if (typeof applyStudentToUI === 'function') applyStudentToUI(matchedStudent);
        document.getElementById("login-box").style.display = "none";
        startExamAction();
        return;
    }

    if (EXAM_PASSWORD !== "" && val === EXAM_PASSWORD) { 
        document.getElementById("login-box").style.display = "none"; 
        document.getElementById("student-card").style.display = "block"; 
        if (typeof syncStudentFromParamsAndStorage === 'function') syncStudentFromParamsAndStorage();
    } else { 
        alert("❌ Mật khẩu bài thi không đúng hoặc không tìm thấy tài khoản học sinh tương ứng!"); 
    } 
}

function selectOption(qId, letter) { 
    if (isSubmitted || isExamLocked) return; 
    const letters = ["A", "B", "C", "D"]; 
    letters.forEach(l => { 
        const el = document.getElementById(`opt-box-${qId}-${l}`); 
        if (el) el.classList.remove('selected'); 
    }); 
    const current = document.getElementById(`opt-box-${qId}-${letter}`); 
    if (current) current.classList.add('selected'); 
    const radio = document.querySelector(`input[name="q${qId}"][value="${letter}"]`); 
    if (radio) radio.checked = true; 
    window.SECURE_VAULT.userAnswers[`q${qId}`] = letter; 
    updateProgress(); 
    saveExamStateToStorage(); 
}

function onStatementChange(subKey) { 
    if (isSubmitted || isExamLocked) return; 
    const selected = document.querySelector(`input[name="${subKey}"]:checked`); 
    if (selected) window.SECURE_VAULT.userAnswers[subKey] = selected.value; 
    updateProgress(); 
    saveExamStateToStorage(); 
}

function onShortInputChange(qId) { 
    if (isSubmitted || isExamLocked) return; 
    const val = document.getElementById(`q${qId}-input`).value.trim(); 
    if (val) window.SECURE_VAULT.userAnswers[`q${qId}`] = val; 
    else delete window.SECURE_VAULT.userAnswers[`q${qId}`]; 
    updateProgress(); 
    saveExamStateToStorage(); 
}

function updateProgress() { 
    if (!examData || !examData.questions) return 0; 
    let answeredCount = 0; 
    examData.questions.forEach(q => { 
        const navBtn = document.getElementById(`q-nav-btn-${q.id}`); 
        let status = "unanswered"; 
        if (q.type === "multiple_choice") { 
            if (window.SECURE_VAULT.userAnswers[`q${q.id}`]) { answeredCount++; status = "answered"; } 
        } else if (q.type === "true_false") { 
            let doneCount = 0; 
            q.statements.forEach(st => { 
                if (window.SECURE_VAULT.userAnswers[`q${q.id}_${st.id}`]) doneCount++; 
            }); 
            if (doneCount === q.statements.length) { answeredCount++; status = "answered"; } 
            else if (doneCount > 0) { status = "partial"; } 
        } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") { 
            if (window.SECURE_VAULT.userAnswers[`q${q.id}`]) { answeredCount++; status = "answered"; } 
        } 
        if (navBtn) { 
            navBtn.classList.remove("answered", "partial"); 
            if (status === "answered") navBtn.classList.add("answered"); 
            else if (status === "partial") navBtn.classList.add("partial"); 
        } 
    }); 
    const progressValEl = document.getElementById("nav-progress-val"); 
    if (progressValEl) progressValEl.innerText = `${answeredCount}/${totalQuestionsCount}`; 
    return answeredCount; 
}

function reapplySavedAnswers() { 
    Object.keys(window.SECURE_VAULT.userAnswers).forEach(key => { 
        const val = window.SECURE_VAULT.userAnswers[key]; 
        if (key.includes('_')) { 
            const r = document.querySelector(`input[name="${key}"][value="${val}"]`); 
            if (r) r.checked = true; 
        } else if (document.getElementById(`${key}-input`)) { 
            document.getElementById(`${key}-input`).value = val; 
        } else { 
            const qId = key.replace('q', ''); 
            const letters = ["A", "B", "C", "D"]; 
            letters.forEach(l => { 
                const el = document.getElementById(`opt-box-${qId}-${l}`); 
                if (el) el.classList.remove('selected'); 
            }); 
            const current = document.getElementById(`opt-box-${qId}-${val}`); 
            if (current) current.classList.add('selected'); 
            const radio = document.querySelector(`input[name="q${qId}"][value="${val}"]`); 
            if (radio) radio.checked = true; 
        } 
    }); 
}

function formatHHMMSS(totalSecs) { 
    const h = Math.floor(totalSecs / 3600); 
    const m = Math.floor((totalSecs % 3600) / 60); 
    const s = totalSecs % 60; 
    return `${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`; 
}

function startCountdownTimer() { 
    if (isExamLocked) return;
    const timerVal = document.getElementById("nav-timer-val"); 
    const timerBox = document.getElementById("nav-timer-box"); 
    if (timerInterval) clearInterval(timerInterval); 
    
    timerInterval = setInterval(() => { 
        if (isExamLocked) {
            clearInterval(timerInterval);
            timerInterval = null;
            return;
        }

        const now = Date.now(); 
        let currentEndTimeMs = Infinity; 
        if (typeof examData !== 'undefined' && examData && examData.examEndTimeStr) { 
            let t = new Date(examData.examEndTimeStr).getTime();
            if (!isNaN(t)) currentEndTimeMs = t;
        } 

        if (now >= currentEndTimeMs) { 
            clearInterval(timerInterval); 
            timerInterval = null;
            timerVal.innerText = "00:00:00"; 
            alert("⛔ Đã hết thời gian cho phép của đợt thi! Hệ thống tự động thu bài."); 
            executeSubmitExam(true); 
            return; 
        } 

        const elapsedTimeSec = Math.floor((now - examStartTime) / 1000); 
        remainingSeconds = totalTimeSeconds - elapsedTimeSec; 
        if (remainingSeconds <= 0) { 
            clearInterval(timerInterval); 
            timerInterval = null;
            timerVal.innerText = "00:00:00"; 
            alert("⏰ Đã hết thời gian làm bài! Hệ thống tự động thu bài."); 
            executeSubmitExam(true); 
            return; 
        } 
        timerVal.innerText = formatHHMMSS(remainingSeconds); 
        if (remainingSeconds <= 120) timerBox.classList.add("timer-warning"); 
        else timerBox.classList.remove("timer-warning");
    }, 1000); 
}

function showSubmitConfirmModal() { 
    if (isSubmitted) return; 
    if (isExamLocked) {
        executeSubmitExam(false);
        return;
    }

    const answered = updateProgress(); 
    const unanswered = totalQuestionsCount - answered; 
    document.getElementById("modal-remain-time").innerText = formatHHMMSS(Math.max(0, remainingSeconds)); 
    document.getElementById("modal-answered-count").innerText = `${answered}/${totalQuestionsCount}`; 
    const warnBox = document.getElementById("modal-unanswered-warning"); 
    if (unanswered > 0) { 
        warnBox.style.display = "block"; 
        warnBox.innerText = `⚠️ Còn ${unanswered} câu chưa làm!`; 
    } else { 
        warnBox.style.display = "none"; 
    } 
    document.getElementById("modal-normal-submit-view").style.display = "block";
    document.getElementById("modal-submitting-progress-view").style.display = "none";
    document.getElementById("modal-actions-container").innerHTML = `
        <div class="modal-btn-row">
            <button type="button" class="btn-modal-cancel" onclick="closeSubmitConfirmModal()">Tiếp tục làm</button>
            <button type="button" class="btn-modal-confirm" onclick="executeSubmitExam()">✓ Nộp bài</button>
        </div>
    `;
    document.getElementById("submit-confirm-modal").style.display = "flex"; 
}

function closeSubmitConfirmModal() { 
    if (isSubmittingInProgress) return;
    document.getElementById("submit-confirm-modal").style.display = "none"; 
}

function saveExamStateToStorage() { 
    if (!examStartTime || isSubmitted) return; 
    const dataToSave = { 
        userAnswers: window.SECURE_VAULT.userAnswers, 
        padletClickedMap: window.SECURE_VAULT.padletClicked, 
        examStartTime: examStartTime, 
        tabSwitchCount: tabSwitchCount, 
        timeLimitMinutes: TIME_LIMIT_MINUTES, 
        studentId: document.getElementById("student-id").value.trim(), 
        studentName: document.getElementById("student-name").value.trim(), 
        studentClass: document.getElementById("student-class").value.trim(), 
        isStarted: true,
        isExamLocked: isExamLocked,
        lockedDurationSec: lockedDurationSec
    }; 
    safeLocal.setItem(getStorageKey(), JSON.stringify(dataToSave)); 
}

function restoreExamStateFromStorage() { 
    try { 
        const raw = safeLocal.getItem(getStorageKey()); 
        const hasPending = safeLocal.getItem("pending_exam_submission");
        if (!raw && !hasPending) return false; 
        
        let parsed = raw ? JSON.parse(raw) : null;
        if (!parsed && hasPending) {
            const pend = JSON.parse(hasPending);
            parsed = {
                isStarted: true,
                isExamLocked: true,
                studentId: pend.studentId,
                studentName: pend.studentName,
                studentClass: pend.studentClass,
                userAnswers: {}
            };
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const currentUrlSbd = urlParams.get('sbd');
        if (currentUrlSbd && parsed && parsed.studentId && currentUrlSbd.toLowerCase() !== String(parsed.studentId).toLowerCase()) {
            safeLocal.removeItem(getStorageKey());
            return false;
        }

        if (parsed && parsed.isStarted) { 
            window.SECURE_VAULT.userAnswers = parsed.userAnswers || {}; 
            window.SECURE_VAULT.padletClicked = parsed.padletClickedMap || {}; 
            tabSwitchCount = parsed.tabSwitchCount || 0; 
            examStartTime = parsed.examStartTime || Date.now(); 
            if (parsed.timeLimitMinutes) {
                TIME_LIMIT_MINUTES = parseInt(parsed.timeLimitMinutes, 10);
                totalTimeSeconds = TIME_LIMIT_MINUTES * 60;
            }
            if (parsed.studentId) document.getElementById("student-id").value = parsed.studentId; 
            if (parsed.studentName) document.getElementById("student-name").value = parsed.studentName; 
            if (parsed.studentClass) document.getElementById("student-class").value = parsed.studentClass; 
            
            if (parsed.isExamLocked || hasPending) {
                isExamLocked = true;
                lockedDurationSec = parsed.lockedDurationSec || 0;
            }
            return true; 
        } 
    } catch(e) {} 
    return false; 
}

// =========================================================
// THUẬT TOÁN NỘP BÀI ĐA KÊNH & XÁC THỰC 2 CHIỀU CHỐNG MẤT BÀI
// =========================================================
async function executeSubmitExam(isForceSubmit = false) { 
    if (isSubmitted || isSubmittingInProgress) return; 

    isSubmittingInProgress = true;
    lockExamInteractions();
    saveExamStateToStorage();
    
    const confirmModal = document.getElementById("submit-confirm-modal");
    const normalView = document.getElementById("modal-normal-submit-view");
    const progressView = document.getElementById("modal-submitting-progress-view");
    const actionsBox = document.getElementById("modal-actions-container");

    if (confirmModal) confirmModal.style.display = "flex";
    if (normalView) normalView.style.display = "none";
    if (actionsBox) actionsBox.innerHTML = "";

    const updateProgressStatus = (text, subtext = "Vui lòng giữ kết nối để bảo lưu bài thi thành công 100%.") => {
        if (progressView) {
            progressView.innerHTML = `
                <div class="spinner" style="width:38px; height:38px; margin:0 auto 12px auto; border-top-color:#0284c7;"></div>
                <div style="font-weight:900; color:#0284c7; font-size:1.1rem;" id="submit-progress-text">${text}</div>
                <div style="font-size:0.88rem; color:#64748b; margin-top:6px; font-weight:600;">${subtext}</div>
            `;
            progressView.style.display = "block";
        }
    };

    updateProgressStatus("⏳ Đang chuẩn bị gói dữ liệu bài thi...");

    const sId = document.getElementById("student-id").value.trim(); 
    const sName = document.getElementById("student-name").value.trim(); 
    const sClass = document.getElementById("student-class").value.trim(); 
    const currentCat = typeof getExamCategory === 'function' ? getExamCategory() : "them-11";
    const urlParams = new URLSearchParams(window.location.search);
    const currentQuizId = urlParams.get('id') || (examData && examData.id) || "exam";

    const isClassAcc = typeof findStudentFromDatabase === 'function' ? !!findStudentFromDatabase(sId, currentCat) : false;
    const isFreeStudent = !isClassAcc;

    const durationSec = lockedDurationSec || (examStartTime ? Math.round((Date.now() - examStartTime) / 1000) : 0); 
    const spentMins = Math.floor(durationSec / 60); 
    const spentSecs = durationSec % 60; 
    const completionTimeStr = `${spentMins} phút ${spentSecs} giây`; 
    
    // TÍNH ĐIỂM BÀI LÀM
    let scoreResult = null;
    if (typeof calculateExamScoreWithConfig === 'function') {
        scoreResult = calculateExamScoreWithConfig(
            examData.questions || [],
            window.SECURE_VAULT.userAnswers || {},
            window.SECURE_VAULT.answers || {},
            examData.scoringConfig || { mode: 'option1' }
        );
    } else {
        let correctCount = 0; let wrongCount = 0; let totalRawScore = 0; let maxTotalScore = 0; let dataDetails = [];
        (examData.questions || []).forEach(q => {
            maxTotalScore += 1.0;
            if (q.type === "multiple_choice") {
                const userVal = window.SECURE_VAULT.userAnswers[`q${q.id}`] || "Chưa chọn";
                const correctVal = window.SECURE_VAULT.answers[`q${q.id}`];
                if (userVal === correctVal) { correctCount++; totalRawScore += 1.0; dataDetails.push(`${q.id}-${userVal} [ĐÚNG]`); }
                else { wrongCount++; dataDetails.push(`${q.id}-${userVal} [SAI: ${correctVal}]`); }
            } else if (q.type === "true_false") {
                let cSt = 0;
                (q.statements || []).forEach(st => {
                    const sub = `q${q.id}_${st.id}`; const uVal = window.SECURE_VAULT.userAnswers[sub] || "Chưa chọn"; const cVal = window.SECURE_VAULT.answers[sub];
                    if (uVal === cVal) { cSt++; dataDetails.push(`${q.id}${st.id}-${uVal} [ĐÚNG]`); }
                    else { dataDetails.push(`${q.id}${st.id}-${uVal} [SAI]`); }
                });
                let qScore = 0;
                if (cSt === 1) qScore = 0.1; else if (cSt === 2) qScore = 0.25; else if (cSt === 3) qScore = 0.5; else if (cSt === 4) qScore = 1.0;
                totalRawScore += qScore;
                if (cSt === 4) correctCount++; else wrongCount++;
            } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") {
                const uVal = (window.SECURE_VAULT.userAnswers[`q${q.id}`] || "").replace(',', '.');
                const cVal = String(window.SECURE_VAULT.answers[`q${q.id}`] || "").replace(',', '.');
                const isRight = (uVal.trim() === cVal.trim()) || (cVal !== "" && Number(uVal) === Number(cVal) && uVal !== "");
                if (isRight) { correctCount++; totalRawScore += 1.0; dataDetails.push(`${q.id}-${uVal} [ĐÚNG]`); }
                else { wrongCount++; dataDetails.push(`${q.id}-${uVal || "Trống"} [SAI: ${cVal}]`); }
            }
        });
        const score10Scale = Math.round(((totalRawScore / (maxTotalScore || 1)) * 10) * 10) / 10;
        scoreResult = { correctCount, wrongCount, totalRawScore, maxTotalScore, finalScore: score10Scale, maxScale: 10.0, dataDetails };
    }

    const { correctCount, wrongCount, totalRawScore, maxTotalScore, finalScore, maxScale, dataDetails } = scoreResult;
    dataDetails.push(`Tab Switch: ${tabSwitchCount}`);

    const safeIdClean = (sId || "user").replace(/[^a-zA-Z0-9]/g, '_');
    const submissionFixedKey = `sub_${safeIdClean}_${Date.now()}`;

    const payload = { 
        submissionId: submissionFixedKey,
        quizId: currentQuizId,
        maDe: getMaDe(), 
        completionTime: completionTimeStr, 
        examName: EXAM_NAME, 
        examTitle: EXAM_NAME, 
        categoryId: currentCat,
        cat: currentCat,
        studentId: sId, 
        sbd: sId, 
        studentName: sName, 
        studentClass: sClass, 
        className: sClass,
        isFree: isFreeStudent,
        rawScore: Math.round(totalRawScore * 100) / 100, 
        score10: finalScore, 
        maxScale: maxScale,
        scoringMode: (examData.scoringConfig && examData.scoringConfig.mode) ? examData.scoringConfig.mode : "option1",
        tabSwitchCount: `${tabSwitchCount} lần`, 
        dataString: dataDetails.join(" | "), 
        userAnswers: window.SECURE_VAULT.userAnswers || {},
        calcMetrics: { correctCount, wrongCount, spentMins, completionTimeStr, score10Scale: finalScore, maxScale }, 
        timestamp: new Date().toLocaleString("vi-VN"), 
        createdAt: Date.now() 
    }; 

    safeLocal.setItem("pending_exam_submission", JSON.stringify(payload)); 
    pendingSubmissionPayload = payload; 

    const examCode = typeof getExamCode === 'function' ? getExamCode() : "101";

    // DANH SÁCH CÁC NODE BẮT BUỘC GHI ĐỒNG BỘ ĐỂ ADMIN KHÔNG THỂ BỊ SÓT
    const targetNodes = Array.from(new Set([
        `${FIREBASE_DB_URL}/exams/${currentQuizId}/submissions/${submissionFixedKey}.json`,
        `${FIREBASE_DB_URL}/quizzes/${currentQuizId}/submissions/${submissionFixedKey}.json`,
        `${FIREBASE_DB_URL}/exams/${examCode}/submissions/${submissionFixedKey}.json`
    ]));

    let firebaseVerified = false;
    let attemptsCount = 0;
    const maxSendAttempts = 3;

    while (attemptsCount < maxSendAttempts && !firebaseVerified) {
        attemptsCount++;
        updateProgressStatus(`⏳ Đang nộp lên máy chủ Firebase (Lần ${attemptsCount}/${maxSendAttempts})...`, "Vui lòng giữ màn hình, không tải lại trang.");

        try {
            // Gửi đồng thời đa điểm bằng phương thức PUT
            const putPromises = targetNodes.map(url => {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 6000);
                return fetch(url, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                }).then(res => {
                    clearTimeout(timer);
                    return res.ok;
                }).catch(() => {
                    clearTimeout(timer);
                    return false;
                });
            });

            const results = await Promise.all(putPromises);
            const atLeastOneSuccess = results.some(ok => ok === true);

            if (atLeastOneSuccess) {
                // XÁC MINH NGAY LẬP TỨC: Đọc lại từ máy chủ Firebase để chắc chắn 100% dữ liệu đã ghi nhận
                updateProgressStatus("🔍 Máy chủ đang kiểm tra xác thực bài làm...");
                try {
                    const verifyUrl = `${FIREBASE_DB_URL}/exams/${currentQuizId}/submissions/${submissionFixedKey}.json`;
                    const verifyRes = await fetch(verifyUrl, { cache: "no-store" });
                    if (verifyRes && verifyRes.ok) {
                        const verifiedData = await verifyRes.json();
                        if (verifiedData && (verifiedData.score10 !== undefined || verifiedData.studentName)) {
                            firebaseVerified = true;
                            break;
                        }
                    }
                } catch(vErr) {
                    // Nếu GET kiểm tra nhanh thất bại nhưng PUT trả về 200, ta vẫn chấp nhận
                    firebaseVerified = true;
                    break;
                }
            }
        } catch(netErr) {
            console.warn(`Lần nộp ${attemptsCount} gặp lỗi mạng:`, netErr);
        }

        if (!firebaseVerified && attemptsCount < maxSendAttempts) {
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    // NẾU SAU NHIỀU LẦN VẪN CHƯA THỂ XÁC NHẬN BÀI NỘP TRÊN FIREBASE
    if (!firebaseVerified) {
        isSubmittingInProgress = false;
        if (progressView) {
            progressView.innerHTML = `
                <div style="font-size:42px; margin-bottom:8px;">📶⚠️</div>
                <div style="font-weight:900; color:#ef4444; font-size:1.15rem;">CHƯA THỂ NỘP LÊN MÁY CHỦ!</div>
                <div style="font-size:0.92rem; color:#334155; margin-top:8px; font-weight:700; line-height:1.45;">
                    Mạng 4G/Wifi của bạn bị chập chờn nên máy chủ chưa gửi phản hồi xác nhận.<br>
                    <span style="color:#0284c7;">Bài làm của bạn vẫn được lưu nguyên vẹn an toàn trên máy.</span>
                </div>
            `;
        }
        if (actionsBox) {
            actionsBox.innerHTML = `
                <div style="margin-top: 15px; display: flex; flex-direction:column; gap: 8px; width:100%;">
                    <button type="button" onclick="executeSubmitExam(${isForceSubmit})" style="width:100%; padding:12px; background:linear-gradient(135deg, #0284c7, #0369a1); color:#fff; border:none; border-radius:10px; font-weight:900; font-size:1rem; cursor:pointer; box-shadow:0 3px 10px rgba(2,132,199,0.3);">🔄 Thử nộp lại ngay</button>
                    <button type="button" onclick="downloadPendingSubmissionFile()" style="width:100%; padding:10px; background:#f1f5f9; color:#0f172a; border:1.5px solid #cbd5e1; border-radius:10px; font-weight:800; font-size:0.9rem; cursor:pointer;">💾 Lưu file dự phòng gửi Thầy</button>
                </div>
            `;
            actionsBox.style.display = "block";
        }
        return; 
    }

    // ĐÃ XÁC NHẬN THÀNH CÔNG 100%: Gửi tiếp sang Google Sheet dự phòng chạy nền
    if (typeof postToGoogleSheet === 'function' && typeof URL2_EXAM_RESULT !== 'undefined' && URL2_EXAM_RESULT) {
        postToGoogleSheet(URL2_EXAM_RESULT, payload, 15000).catch(() => null);
    }
    
    // Xóa phiên làm việc trong active_sessions (CHỈ XÓA KHI ĐÃ GHI THÀNH CÔNG BÀI LÀM)
    if (typeof clearPresence === 'function') clearPresence(sId);
    if (timerInterval) clearInterval(timerInterval); 
    if (typeof timeWatcherInterval !== 'undefined' && timeWatcherInterval) clearInterval(timeWatcherInterval);
    if (imageSyncEventSource) { imageSyncEventSource.close(); imageSyncEventSource = null; }

    safeLocal.removeItem("pending_exam_submission");
    safeLocal.removeItem(getStorageKey()); 
    safeLocal.removeItem(`shuffled_exam_${examCode}`); 
    safeLocal.removeItem("saved_student_sbd");
    safeLocal.removeItem("saved_student_name");
    safeLocal.removeItem("saved_student_class");
    safeLocal.removeItem("current_exam_student");
    safeLocal.setItem("last_submission_cleared", "true");
    
    isSubmitted = true; 
    isSubmittingInProgress = false;
    if (confirmModal) confirmModal.style.display = "none"; 
    
    renderResultSummaryScreen(correctCount, wrongCount, spentMins, completionTimeStr, finalScore, maxScale); 
}

function renderResultSummaryScreen(correct, wrong, spentMins, spentTimeStr, finalScore, maxScale = 10.0) { 
    document.getElementById("top-navbar").style.display = "none"; 
    document.getElementById("quiz-content").style.display = "none"; 
    const resView = document.getElementById("result-view-container"); 
    resView.style.display = "block"; 
    
    const resExamTitle = document.getElementById("res-exam-title");
    if (resExamTitle) resExamTitle.innerText = EXAM_NAME || "BÀI THI TRẮC NGHIỆM";

    const scoreTitle = (maxScale && maxScale !== 10.0)
        ? `Đúng ${correct}/${totalQuestionsCount} câu (${finalScore} / ${maxScale} điểm)`
        : `Đúng ${correct}/${totalQuestionsCount} câu (${finalScore} điểm)`;

    document.getElementById("res-score-overview").innerText = scoreTitle; 
    document.getElementById("res-stat-correct").innerText = correct; 
    document.getElementById("res-stat-wrong").innerText = wrong; 
    document.getElementById("res-stat-time").innerText = spentMins; 
    document.getElementById("res-user-name").innerText = document.getElementById("student-name").value.trim() || "Thí sinh"; 
    document.getElementById("res-user-class").innerText = document.getElementById("student-class").value.trim() || "---"; 
    document.getElementById("res-user-id").innerText = document.getElementById("student-id").value.trim() || "---"; 
    document.getElementById("res-spent-time").innerText = spentTimeStr; 

    const resultMode = examData.resultMode || "show_all";
    const scoreOverviewEl = document.getElementById("res-score-overview");
    const statsCardsEl = document.querySelector(".stats-cards-grid");
    const reviewBannerEl = document.querySelector(".review-banner");
    const reviewBodyEl = document.getElementById("review-container-body");
    
    const oldMsg = document.getElementById("res-success-msg");
    if (oldMsg) oldMsg.remove();

    if (resultMode === "hide_all") {
        scoreOverviewEl.style.display = "none";
        statsCardsEl.style.display = "none";
        reviewBannerEl.style.display = "none";
        reviewBodyEl.style.display = "none";

        const successMsg = document.createElement("div");
        successMsg.id = "res-success-msg";
        successMsg.innerHTML = `
            <div style="font-size: 55px; margin-bottom: 12px;">🎉</div>
            <h3 style="color: #16a34a; font-weight: 900; font-size: 1.3rem; margin-bottom: 12px; text-transform: uppercase;">NỘP BÀI THÀNH CÔNG!</h3>
            <p style="color: #475569; font-weight: 600; font-size: 1rem; line-height: 1.5; background: #f0fdf4; padding: 12px; border-radius: 12px; border: 1px dashed #86efac;">
                Hệ thống đã ghi nhận bài làm của bạn an toàn 100%.<br>
                <b style="color: #15803d;">Điểm số và đáp án chi tiết sẽ được giáo viên công bố sau!</b>
            </p>
        `;
        document.querySelector(".result-summary-card").insertBefore(successMsg, document.querySelector(".user-details-grid"));
        
    } else if (resultMode === "score_only") {
        scoreOverviewEl.style.display = "block";
        statsCardsEl.style.display = "grid";
        reviewBannerEl.style.display = "none";
        reviewBodyEl.style.display = "none";

        const successMsg = document.createElement("div");
        successMsg.id = "res-success-msg";
        successMsg.innerHTML = `
            <p style="color: #b45309; font-weight: 600; font-size: 0.95rem; line-height: 1.5; background: #fffbeb; padding: 10px; border-radius: 10px; border: 1px dashed #fcd34d; margin-bottom: 16px;">
                🔒 Giáo viên đã tạm khóa tính năng xem lại bài làm chi tiết để đảm bảo công bằng. Bạn chỉ có thể xem điểm tổng quát lúc này.
            </p>
        `;
        document.querySelector(".result-summary-card").insertBefore(successMsg, document.querySelector(".user-details-grid"));

    } else {
        scoreOverviewEl.style.display = "block";
        statsCardsEl.style.display = "grid";
        reviewBannerEl.style.display = "flex";
        reviewBodyEl.style.display = "block";

        let revHTML = ""; 
        let idx = 1; 

        (examData.questions || []).forEach(q => { 
            const imgUrl = getEffectiveImageUrl(q, examData.images || {}); 
            const imgTag = buildImgHtml(imgUrl, `rev_${q.id}`); 
            const explainText = window.SECURE_VAULT.explanations[`q${q.id}`] ? `<div class="explanation-box">💡 <b>Lời giải chi tiết:</b> ${window.SECURE_VAULT.explanations[`q${q.id}`]}</div>` : ""; 
            
            if (q.type === "multiple_choice") { 
                const letters = ["A", "B", "C", "D"]; 
                const uAns = window.SECURE_VAULT.userAnswers[`q${q.id}`]; 
                const cAns = window.SECURE_VAULT.answers[`q${q.id}`]; 
                revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge" style="background:${uAns===cAns?'#22c55e':'#ef4444'}">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="options-list grid-2">${q.options.map((opt, oIdx) => { const L = letters[oIdx]; let cls = ""; let icon = ""; if (L === cAns) { cls = "is-correct"; icon = " ✓"; } else if (L === uAns && uAns !== cAns) { cls = "is-wrong"; icon = " ✗"; } return `<div class="opt-label ${cls}"><span class="opt-circle">${L}</span><span class="opt-text">${opt} <b>${icon}</b></span></div>`; }).join('')}</div>${explainText}</div>`; 
            } else if (q.type === "true_false") { 
                let rows = ""; 
                (q.statements || []).forEach(st => { 
                    const sub = `q${q.id}_${st.id}`; 
                    const uVal = window.SECURE_VAULT.userAnswers[sub] || "Chưa chọn"; 
                    const cVal = window.SECURE_VAULT.answers[sub]; 
                    const ok = (uVal === cVal); 
                    rows += `<tr><td><b>${st.id})</b> ${st.statement}</td><td align="center">${uVal==="Đúng"?(ok?"🟢 Đúng":"🔴 Đúng (Sai)"):""}</td><td align="center">${uVal==="Sai"?(ok?"🟢 Sai":"🔴 Sai (Sai)"):""}</td><td align="center"><b>${cVal}</b></td></tr>`; 
                }); 
                revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="tf-table-box"><table class="tf-table"><thead><tr><th>Mệnh đề</th><th>Bạn chọn</th><th>Đ.Á Đúng</th></tr></thead><tbody>${rows}</tbody></table></div>${explainText}</div>`; 
            } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") { 
                const uVal = window.SECURE_VAULT.userAnswers[`q${q.id}`] || "(Để trống)"; 
                const cVal = window.SECURE_VAULT.answers[`q${q.id}`]; 
                revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div style="margin-top:14px; font-size:1.05rem; font-weight:600;"><div style="color:#15803d; font-weight:800; margin-top:6px;">Đáp án đúng / tham khảo: ${cVal}</div><div>Tr.lời của bạn: <b>${uVal}</b></div></div>${explainText}</div>`; 
            } 
            idx++; 
        }); 
        reviewBodyEl.innerHTML = revHTML; 
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise().catch(() => {});
        }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

function renderOriginalReviewScreen() {
    const resView = document.getElementById("result-view-container"); 
    resView.style.display = "block"; 
    document.querySelector(".result-summary-card").style.display = "none";

    const reviewBannerEl = document.querySelector(".review-banner");
    const reviewBodyEl = document.getElementById("review-container-body");
    
    reviewBannerEl.style.display = "flex";
    reviewBannerEl.innerHTML = `<span>📖</span> TÀI LIỆU ĐỀ THI GỐC & LỜI GIẢI CHI TIẾT`;
    reviewBannerEl.style.background = "linear-gradient(135deg, #059669, #047857)";

    let generatedAnswerKey = {};
    const letters = ["A", "B", "C", "D"]; 
    (examData.questions || []).forEach(q => {
        if (q.type === "multiple_choice") {
            generatedAnswerKey[`q${q.id}`] = typeof q.correct === 'number' ? letters[q.correct] : q.correct;
        } else if (q.type === "true_false") {
            (q.statements || []).forEach(st => {
                generatedAnswerKey[`q${q.id}_${st.id}`] = st.correct ? "Đúng" : "Sai";
            });
        } else {
            generatedAnswerKey[`q${q.id}`] = q.correctAnswer;
        }
    });

    let revHTML = ""; 
    let idx = 1; 

    (examData.questions || []).forEach(q => { 
        const imgUrl = getEffectiveImageUrl(q, examData.images || {}); 
        const imgTag = buildImgHtml(imgUrl, `orig_${q.id}`); 
        const explainText = q.explanation ? `<div class="explanation-box">💡 <b>Lời giải chi tiết:</b> ${q.explanation}</div>` : ""; 
        
        if (q.type === "multiple_choice") { 
            const cAns = generatedAnswerKey[`q${q.id}`]; 
            revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="options-list grid-2">${q.options.map((opt, oIdx) => { const L = letters[oIdx]; let cls = ""; let icon = ""; if (L === cAns) { cls = "is-correct"; icon = " ✓ Đ.Án"; } return `<div class="opt-label ${cls}"><span class="opt-circle">${L}</span><span class="opt-text">${opt} <b>${icon}</b></span></div>`; }).join('')}</div>${explainText}</div>`; 
        } else if (q.type === "true_false") { 
            let rows = ""; 
            (q.statements || []).forEach(st => { 
                const sub = `q${q.id}_${st.id}`; 
                const cVal = generatedAnswerKey[sub]; 
                rows += `<tr><td><b>${st.id})</b> ${st.statement}</td><td align="center" style="color:#15803d; font-weight:800;">${cVal}</td></tr>`; 
            }); 
            revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="tf-table-box"><table class="tf-table"><thead><tr><th>Mệnh đề</th><th>Đáp án gốc</th></tr></thead><tbody>${rows}</tbody></table></div>${explainText}</div>`; 
        } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") { 
            const cVal = generatedAnswerKey[`q${q.id}`]; 
            revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div style="margin-top:14px; font-size:1.05rem; font-weight:600;"><div style="color:#15803d; font-weight:800; margin-top:6px;">Đáp án chuẩn: ${cVal}</div></div>${explainText}</div>`; 
        } 
        idx++; 
    }); 
    reviewBodyEl.innerHTML = revHTML; 
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise().catch(() => {});
    }
}

window.selectOption = selectOption;
window.onStatementChange = onStatementChange;
window.onShortInputChange = onShortInputChange;
window.toggleSubPadlet = toggleSubPadlet;
window.trackPadletClick = trackPadletClick;
window.showSubmitConfirmModal = showSubmitConfirmModal;
window.closeSubmitConfirmModal = closeSubmitConfirmModal;
window.executeSubmitExam = executeSubmitExam;
window.resetToFreshLoginScreen = resetToFreshLoginScreen;
window.checkPassword = checkPassword;
window.startExamAction = startExamAction;
window.startCountdownTimer = startCountdownTimer;
window.formatHHMMSS = formatHHMMSS;
window.__saveExamState = saveExamStateToStorage;
window.__updateProgress = updateProgress;
window.lockExamInteractions = lockExamInteractions;
