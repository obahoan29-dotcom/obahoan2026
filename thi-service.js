// =========================================================
// FILE: thi-service.js
// QUẢN LÝ KẾT NỐI MẠNG, FIREBASE REALTIME, PRESENCE, 
// THEO DÕI ĐỔI THỜI GIAN, GIÁM SÁT TAB GIAN LẬN & HÀNG ĐỢI NỘP BÀI
// ĐÃ SỬA TRIỆT ĐỂ: KHÔNG TỰ ĐỘNG MATCH ĐỔI TÊN HỌC SINH KHÁC
// TỐI ƯU HÓA: ĐẢM BẢO 100% KẾT NỐI FIREBASE THÀNH CÔNG MỚI CHO VÀO THI
// =========================================================

const URL1_TAB_CHEATING = "https://script.google.com/macros/s/AKfycbzAPaLBO8gjPdbzrXOhvChUMzBHsnrhIMbJQIsDhqFtNfsW2Rf1Dki-bYJf-YCM-CCU/exec";
const URL2_EXAM_RESULT  = "https://script.google.com/macros/s/AKfycbx4ezz_9YOZKt9-idYUKz8N1dXg-LeIG-_UknLYKBVZJpxCJRx3yNHwfdWEQp-yhOISog/exec";
const FIREBASE_DB_URL   = "https://hethongthitracnghiem-518c5-default-rtdb.asia-southeast1.firebasedatabase.app";

// BỘ ĐỆM BẢO VỆ LƯU TRỮ TRÊN IPHONE (SAFARI PRIVATE BROWSING / IN-APP WEBVIEW)
const safeLocal = {
    getItem(k) { try { return localStorage.getItem(k); } catch(e) { return null; } },
    setItem(k, v) { try { localStorage.setItem(k, v); } catch(e) {} },
    removeItem(k) { try { localStorage.removeItem(k); } catch(e) {} }
};

let examData = null;
let EXAM_NAME = "ĐỀ THI TRẮC NGHIỆM";
let EXAM_PASSWORD = ""; 
let TIME_LIMIT_MINUTES = 45;  

let ANSWER_KEY = {};
let tabSwitchCount = 0;
let leaveTime = 0;
let isTabHidden = false;
let timerInterval = null;
let waitingInterval = null;
let timeWatcherInterval = null; 

let isSubmitted = false;
let examStartTime = null;
let totalTimeSeconds = 45 * 60;
let remainingSeconds = 45 * 60;

let totalQuestionsCount = 0;
let userAnswersState = {}; 
let padletClickedMap = {}; 
let questionDataMap = {};
let currentActiveQId = null;

let pendingSubmissionPayload = null;
let presenceInterval = null;
let onlineCountInterval = null;

// =========================================================
// HÀM FETCH SIÊU CẤP: TỰ ĐỘNG THỬ LẠI NẾU RỚT MẠNG
// =========================================================
async function fetchWithRetry(url, options, maxRetries = 3, timeoutMs = 6000) {
    for (let i = 0; i < maxRetries; i++) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            if (res.ok) return res;
        } catch (err) {
            clearTimeout(id);
            if (i === maxRetries - 1) throw err;
            // Chờ 1 khoảng thời gian nhỏ trước khi thử lại (Exponential backoff)
            await new Promise(r => setTimeout(r, 1000 * (i + 1))); 
        }
    }
    throw new Error("Không thể kết nối tới máy chủ sau nhiều lần thử.");
}

function getExamCategory() {
    const urlParams = new URLSearchParams(window.location.search);
    let cat = urlParams.get('cat');
    if (cat) return cat;
    try {
        const raw = safeLocal.getItem("current_exam_student");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.categoryId) return parsed.categoryId;
        }
    } catch(e) {}
    return "them-11";
}

function findStudentFromDatabase(query, preferredCat = null) {
    if (!query || !window.STUDENT_ACCOUNTS) return null;
    const q = String(query).trim().toLowerCase();

    if (preferredCat && window.STUDENT_ACCOUNTS[preferredCat]) {
        const list = window.STUDENT_ACCOUNTS[preferredCat];
        const matched = list.find(acc => 
            (acc.sbd && String(acc.sbd).trim().toLowerCase() === q) ||
            (acc.username && String(acc.username).trim().toLowerCase() === q) ||
            (acc.name && String(acc.name).trim().toLowerCase() === q)
        );
        if (matched) return matched;
    }

    return null;
}

function findStudentByPassword(passQuery, preferredCat = null) {
    if (!passQuery || !window.STUDENT_ACCOUNTS) return null;
    const p = String(passQuery).trim().toLowerCase();
    
    if (preferredCat && window.STUDENT_ACCOUNTS[preferredCat]) {
        const list = window.STUDENT_ACCOUNTS[preferredCat];
        const matched = list.find(acc => String(acc.pass).trim().toLowerCase() === p);
        if (matched) return matched;
    }

    return null;
}

function applyStudentToUI(student) {
    if (!student) return;
    const sName = student.name || student.username || "Thí sinh";
    const sId = student.sbd || student.id || "---";
    const sClass = student.className || student.lop || "---";

    const nameEl = document.getElementById("student-name");
    const idEl = document.getElementById("student-id");
    const classEl = document.getElementById("student-class");
    if (nameEl) nameEl.value = sName;
    if (idEl) idEl.value = sId;
    if (classEl) classEl.value = sClass;

    const navName = document.getElementById("nav-student-name");
    const navId = document.getElementById("nav-student-id");
    const navClass = document.getElementById("nav-student-class");
    if (navName) navName.innerText = sName;
    if (navId) navId.innerText = sId;
    if (navClass) navClass.innerText = sClass;

    safeLocal.setItem("saved_student_name", sName);
    safeLocal.setItem("saved_student_sbd", sId);
    safeLocal.setItem("saved_student_class", sClass);
}

function syncStudentFromParamsAndStorage() {
    const urlParams = new URLSearchParams(window.location.search);
    let sbd = urlParams.get('sbd');
    let name = urlParams.get('name');
    let className = urlParams.get('class');

    if (name && name.trim()) {
        applyStudentToUI({
            sbd: sbd ? sbd.trim() : "---",
            name: name.trim(),
            className: className ? className.trim() : "---"
        });
        return;
    }

    try {
        const rawSaved = safeLocal.getItem("current_exam_student");
        if (rawSaved) {
            const parsed = JSON.parse(rawSaved);
            if (parsed && parsed.name && parsed.name.trim()) {
                applyStudentToUI({
                    sbd: parsed.sbd ? parsed.sbd.trim() : "---",
                    name: parsed.name.trim(),
                    className: parsed.className ? parsed.className.trim() : "---"
                });
                return;
            }
        }
    } catch(e) {}

    sbd = safeLocal.getItem("saved_student_sbd");
    name = safeLocal.getItem("saved_student_name");
    className = safeLocal.getItem("saved_student_class");

    if (name && name.trim()) {
        applyStudentToUI({
            sbd: sbd ? sbd.trim() : "---",
            name: name.trim(),
            className: className ? className.trim() : "---"
        });
    }
}

function isCurrentExamAllowFree() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');
    if (quizId) {
        const localVal = safeLocal.getItem(`exam_allow_free_${quizId}`);
        if (localVal !== null) {
            return (localVal === 'true');
        }
    }
    if (examData && examData.allowFree !== undefined) {
        return (examData.allowFree !== false);
    }
    return true;
}

function getMaDe() { 
    const urlParams = new URLSearchParams(window.location.search); 
    const urlMaDe = urlParams.get('made') || urlParams.get('maDe'); 
    if (urlMaDe) return String(urlMaDe).trim(); 
    if (typeof examData !== 'undefined' && examData && examData.maDe) return String(examData.maDe).trim(); 
    return "101"; 
}

function getExamCode() { 
    let code = getMaDe() || EXAM_NAME; 
    return String(code).trim().replace(/\s+/g, '_').replace(/[.#$\[\]\/]/g, '_'); 
}

async function postToGoogleSheet(url, payload, timeoutMs = 15000) { 
    const controller = new AbortController(); 
    const timer = setTimeout(() => controller.abort(), timeoutMs); 
    try { 
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: controller.signal }); 
        clearTimeout(timer); 
        return { ok: true, res }; 
    } catch (err) { 
        clearTimeout(timer); 
        try { 
            const controller2 = new AbortController(); 
            const timer2 = setTimeout(() => controller2.abort(), 4000); 
            const res2 = await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: controller2.signal }); 
            clearTimeout(timer2); 
            return { ok: true, res: res2 }; 
        } catch(e2) { throw err; } 
    } 
}

// =========================================================
// HÀM START EXAM: BẮT BUỘC 100% GHI DANH SÁCH THÀNH CÔNG MỚI CHO VÀO THI
// =========================================================
async function executeStartExamAPI(sId, sName, sClass, isFreeStudent = false) { 
    const currentCat = getExamCategory();
    const urlParams = new URLSearchParams(window.location.search);
    const currentQuizId = urlParams.get('id') || "";
    const examCode = getExamCode();
    const startBtn = document.getElementById("btn-start-exam");

    if (startBtn) {
        startBtn.disabled = true;
        startBtn.innerText = "⏳ Đang kết nối máy chủ thi...";
    }

    const safeId = (sId || "user").replace(/[^a-zA-Z0-9]/g, '_');
    const presencePayload = {
        sbd: sId,
        name: sName,
        className: sClass,
        cat: currentCat,
        categoryId: currentCat,
        isFree: isFreeStudent,
        quizId: currentQuizId,
        maDe: getMaDe(),
        examName: EXAM_NAME,
        examTitle: EXAM_NAME,
        startTime: Date.now(),
        lastPing: Date.now()
    };

    let logPayload = { 
        quizId: currentQuizId,
        maDe: getMaDe(), 
        examName: EXAM_NAME, 
        categoryId: currentCat,
        cat: currentCat,
        studentId: sId, 
        sbd: sId, 
        soBaoDanh: sId, 
        studentName: sName, 
        studentClass: sClass, 
        switchCount: 0, 
        tabSwitchCount: 0, 
        durationStr: "Bắt đầu", 
        durationSec: 0, 
        timestamp: new Date().toLocaleString("vi-VN"), 
        createdAt: Date.now() 
    }; 

    let isFirebaseConfirmed = false;

    try {
        // Sử dụng hàm fetchWithRetry siêu cấp để đảm bảo ghi thành công, nếu thất bại thử lại tối đa 3 lần
        const primaryRes = await fetchWithRetry(`${FIREBASE_DB_URL}/active_sessions/${examCode}/${safeId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(presencePayload)
        }, 3, 5000); // Thử 3 lần, mỗi lần chờ max 5 giây

        if (primaryRes && primaryRes.ok) {
            isFirebaseConfirmed = true;
            
            // Lặng lẽ ghi đệm vào các Node liên quan (Không cần await để tăng tốc độ)
            const pushNodes = [];
            if (currentQuizId && currentQuizId !== examCode) pushNodes.push(currentQuizId);
            let numMatch = (EXAM_NAME || "").match(/(?:đề|de)\s*(?:số|so)?\s*(\d+)/i);
            if (numMatch) {
                pushNodes.push(numMatch[1]);
                pushNodes.push("DE" + numMatch[1]);
            }
            pushNodes.forEach(n => {
                fetch(`${FIREBASE_DB_URL}/active_sessions/${n}/${safeId}.json`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(presencePayload)
                }).catch(() => null);
            });

            // Lặng lẽ ghi log bắt đầu thi
            fetch(`${FIREBASE_DB_URL}/exams/${examCode}/cheating_logs.json`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(logPayload)
            }).catch(() => null);
        }
    } catch(e) {
        console.warn("Lỗi kết nối Firebase khi bắt đầu bài thi:", e);
    }

    // NẾU SAU 3 LẦN THỬ MÀ VẪN THẤT BẠI -> CHẶN ĐỨNG KHÔNG CHO VÀO THI
    if (!isFirebaseConfirmed) {
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerText = "Vào Làm Bài";
        }
        document.getElementById("student-card").style.display = "block";
        const waitingCard = document.getElementById("waiting-room-card");
        if (waitingCard) waitingCard.style.display = "none";

        try {
            const u = new URL(window.location.href);
            if (u.searchParams.has('autostart')) {
                u.searchParams.delete('autostart');
                window.history.replaceState({}, '', u.toString());
            }
        } catch(e) {}

        alert("⚠️ CHƯA THỂ MỞ ĐỀ THI!\n\nMáy chủ thi (Firebase) chưa phản hồi xác nhận do mạng Internet của bạn bị chập chờn hoặc gián đoạn.\n\nVui lòng kiểm tra lại kết nối mạng 4G/Wifi và bấm nút 'Vào Làm Bài' lại để hệ thống bảo đảm quyền lợi của bạn!");
        return;
    }

    // Async đẩy lên Google Sheets, không cần await để chặn luồng
    postToGoogleSheet(URL1_TAB_CHEATING, logPayload, 15000).catch(e=>{});

    // CHỈ CHẠY ĐẾN ĐÂY NẾU FIREBASE ĐÃ GHI THÀNH CÔNG 100%
    document.getElementById("nav-student-name").innerText = sName; 
    document.getElementById("nav-student-id").innerText = sId; 
    document.getElementById("nav-student-class").innerText = sClass; 
    document.getElementById("nav-exam-code-text").innerText = `Đề: ${getMaDe()}`; 
    
    document.getElementById("student-card").style.display = "none"; 
    const waitingCard = document.getElementById("waiting-room-card"); 
    if (waitingCard) waitingCard.style.display = "none"; 
    
    document.getElementById("top-navbar").style.display = "block"; 
    document.getElementById("quiz-content").style.display = "block"; 
    
    if (!examStartTime) { 
        examStartTime = Date.now(); 
        saveExamStateToStorage(); 
    } 
    
    updateProgress(); 
    startCountdownTimer(); 
    startPresenceSystem(sId);

    if (startBtn) {
        startBtn.disabled = false;
        startBtn.innerText = "Vào Làm Bài";
    }
}

function startPresenceSystem(sId) {
    const safeId = (sId || "user").replace(/[^a-zA-Z0-9]/g, '_');
    const examCode = getExamCode();
    
    updatePresence(examCode, safeId);
    fetchOnlineCount(examCode);

    if (presenceInterval) clearInterval(presenceInterval);
    if (onlineCountInterval) clearInterval(onlineCountInterval);

    presenceInterval = setInterval(() => { updatePresence(examCode, safeId); }, 15000);
    onlineCountInterval = setInterval(() => { fetchOnlineCount(examCode); }, 15000);
}

async function updatePresence(examCode, safeId) {
    try {
        const sId = document.getElementById("student-id") ? document.getElementById("student-id").value.trim() : "";
        const sName = document.getElementById("student-name") ? document.getElementById("student-name").value.trim() : "";
        const sClass = document.getElementById("student-class") ? document.getElementById("student-class").value.trim() : "";
        const currentCat = getExamCategory();
        const checkInClass = findStudentFromDatabase(sId, currentCat);
        const isFree = !checkInClass;

        const urlParams = new URLSearchParams(window.location.search);
        const currentQuizId = urlParams.get('id') || "";

        const presencePayload = {
            sbd: sId,
            name: sName,
            className: sClass,
            cat: currentCat,
            categoryId: currentCat,
            isFree: isFree,
            quizId: currentQuizId,
            maDe: getMaDe(),
            examName: EXAM_NAME,
            examTitle: EXAM_NAME,
            startTime: examStartTime || Date.now(),
            lastPing: Date.now()
        };

        const pushNodes = [examCode];
        if (currentQuizId && currentQuizId !== examCode) pushNodes.push(currentQuizId);
        
        await Promise.all(pushNodes.map(n => 
            fetch(`${FIREBASE_DB_URL}/active_sessions/${n}/${safeId}.json`, {
                method: 'PUT', body: JSON.stringify(presencePayload)
            }).catch(() => null)
        ));
    } catch(e) {}
}

async function fetchOnlineCount(examCode) {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/active_sessions/${examCode}.json`);
        const data = await res.json();
        if (data) {
            const now = Date.now();
            let activeCount = 0;
            for (const key in data) {
                const val = data[key];
                const pingTime = (typeof val === 'number') ? val : (val && val.lastPing ? val.lastPing : 0);
                if (now - pingTime < 180000) activeCount++;
            }
            const badge = document.getElementById("nav-online-val");
            if (badge) badge.innerText = Math.max(1, activeCount);
        }
    } catch(e) {}
}

function clearPresence(sId) {
    if (presenceInterval) clearInterval(presenceInterval);
    if (onlineCountInterval) clearInterval(onlineCountInterval);
    const safeId = (sId || "user").replace(/[^a-zA-Z0-9]/g, '_');
    const urlParams = new URLSearchParams(window.location.search);
    const currentQuizId = urlParams.get('id') || "";

    fetch(`${FIREBASE_DB_URL}/active_sessions/${getExamCode()}/${safeId}.json`, { method: 'DELETE' }).catch(e=>{});
    if (currentQuizId) {
        fetch(`${FIREBASE_DB_URL}/active_sessions/${currentQuizId}/${safeId}.json`, { method: 'DELETE' }).catch(e=>{});
    }
}

function showTimeChangeToast(message) {
    const toast = document.getElementById("time-change-toast");
    const msg = document.getElementById("time-change-toast-msg");
    if (!toast || !msg) return;
    msg.innerText = message;
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 4500);
}

function startTimeWatcherRealtime(quizId) {
    if (!quizId) return;
    if (timeWatcherInterval) clearInterval(timeWatcherInterval);

    timeWatcherInterval = setInterval(async () => {
        if (isSubmitted || !examStartTime) return;
        try {
            const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
            const freshData = await res.json();
            if (!freshData) return;

            if (freshData.timeLimitMinutes && parseInt(freshData.timeLimitMinutes, 10) !== TIME_LIMIT_MINUTES) {
                const newMinutes = parseInt(freshData.timeLimitMinutes, 10);
                TIME_LIMIT_MINUTES = newMinutes;
                totalTimeSeconds = TIME_LIMIT_MINUTES * 60;

                const now = Date.now();
                const elapsedTimeSec = Math.floor((now - examStartTime) / 1000);
                remainingSeconds = Math.max(0, totalTimeSeconds - elapsedTimeSec);

                const timerVal = document.getElementById("nav-timer-val");
                const timerBox = document.getElementById("nav-timer-box");
                if (timerVal) timerVal.innerText = formatHHMMSS(remainingSeconds);
                if (timerBox) {
                    if (remainingSeconds <= 120) timerBox.classList.add("timer-warning");
                    else timerBox.classList.remove("timer-warning");

                    timerBox.classList.add("timer-updated");
                    setTimeout(() => timerBox.classList.remove("timer-updated"), 2500);
                }

                if (!timerInterval && remainingSeconds > 0) {
                    startCountdownTimer();
                }

                saveExamStateToStorage();
                showTimeChangeToast(`⏱ Giáo viên vừa cập nhật thời gian làm bài: ${newMinutes} phút!`);
            }

            if (freshData.examEndTimeStr && examData && freshData.examEndTimeStr !== examData.examEndTimeStr) {
                examData.examEndTimeStr = freshData.examEndTimeStr;
                if (freshData.examStartTimeStr) examData.examStartTimeStr = freshData.examStartTimeStr;

                const newEndFormatted = new Date(freshData.examEndTimeStr).toLocaleString("vi-VN", {
                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                });
                showTimeChangeToast(`📅 Giáo viên vừa gia hạn lịch nộp bài đến: ${newEndFormatted}!`);

                if (!timerInterval && remainingSeconds > 0) {
                    startCountdownTimer();
                }
            }

            if (freshData.allowFree !== undefined && examData) {
                examData.allowFree = freshData.allowFree;
                safeLocal.setItem(`exam_allow_free_${quizId}`, String(freshData.allowFree !== false));
            }
            
            // --- CHÈN THÊM ĐOẠN NÀY ĐỂ ĐỒNG BỘ REALTIME CHẾ ĐỘ ĐIỂM ---
            if (freshData.resultMode !== undefined && examData) {
                examData.resultMode = freshData.resultMode;
            }
            if (freshData.allowReviewOriginal !== undefined && examData) {
                examData.allowReviewOriginal = freshData.allowReviewOriginal;
            }
            // ---------------------------------------------------------
        } catch(e) {}
    }, 15000); 
}

function setupBackPrevention() { 
    window.history.pushState({ page: 'quiz' }, "", ""); 
    window.addEventListener('popstate', function () { 
        if (!isSubmitted && examStartTime) { 
            window.history.pushState({ page: 'quiz' }, "", ""); 
            confirm("⚠️ BẠN ĐANG TRONG BÀI THI!\nThoát hoặc quay lại sẽ làm gián đoạn bài làm của bạn."); 
        } 
    }); 
    window.addEventListener('beforeunload', function (e) { 
        if (!isSubmitted && examStartTime) { 
            saveExamStateToStorage(); 
            e.preventDefault(); 
            e.returnValue = 'Bài làm của bạn chưa được nộp. Dữ liệu đã được lưu tạm an toàn.'; 
        } 
    }); 
    window.addEventListener('online', function() { 
        document.getElementById("net-status-banner").style.display = "none"; 
        checkPendingSubmissionOnLoad(); 
    }); 
    window.addEventListener('offline', function() { 
        document.getElementById("net-status-banner").style.display = "block"; 
    }); 
}

function getStorageKey() { return `exam_autosave_active_session_${EXAM_NAME}_${getMaDe()}`; }

function saveExamStateToStorage() { 
    if (!examStartTime || isSubmitted) return; 
    const dataToSave = { 
        userAnswers: userAnswersState, 
        padletClickedMap: padletClickedMap, 
        examStartTime: examStartTime, 
        tabSwitchCount: tabSwitchCount, 
        timeLimitMinutes: TIME_LIMIT_MINUTES, 
        studentId: document.getElementById("student-id").value.trim(), 
        studentName: document.getElementById("student-name").value.trim(), 
        studentClass: document.getElementById("student-class").value.trim(), 
        isStarted: true 
    }; 
    safeLocal.setItem(getStorageKey(), JSON.stringify(dataToSave)); 
}

function restoreExamStateFromStorage() { 
    try { 
        const raw = safeLocal.getItem(getStorageKey()); 
        if (!raw) return false; 
        const parsed = JSON.parse(raw); 
        
        const urlParams = new URLSearchParams(window.location.search);
        const currentUrlSbd = urlParams.get('sbd');
        if (currentUrlSbd && parsed.studentId && currentUrlSbd.toLowerCase() !== String(parsed.studentId).toLowerCase()) {
            safeLocal.removeItem(getStorageKey());
            return false;
        }

        if (parsed && parsed.isStarted && parsed.userAnswers) { 
            userAnswersState = parsed.userAnswers || {}; 
            padletClickedMap = parsed.padletClickedMap || {}; 
            tabSwitchCount = parsed.tabSwitchCount || 0; 
            examStartTime = parsed.examStartTime || Date.now(); 
            if (parsed.timeLimitMinutes) {
                TIME_LIMIT_MINUTES = parseInt(parsed.timeLimitMinutes, 10);
                totalTimeSeconds = TIME_LIMIT_MINUTES * 60;
            }
            if (parsed.studentId) document.getElementById("student-id").value = parsed.studentId; 
            if (parsed.studentName) document.getElementById("student-name").value = parsed.studentName; 
            if (parsed.studentClass) document.getElementById("student-class").value = parsed.studentClass; 
            return true; 
        } 
    } catch(e) {} 
    return false; 
}

function checkPendingSubmissionOnLoad() { 
    try { 
        const raw = safeLocal.getItem("pending_exam_submission"); 
        if (raw) { 
            const parsed = JSON.parse(raw); 
            if (parsed && parsed.studentName) { 
                pendingSubmissionPayload = parsed; 
                document.getElementById("pending-resend-bar").style.display = "block";
            } 
        } 
    } catch(e) {} 
}
function dismissPendingBar() { document.getElementById("pending-resend-bar").style.display = "none"; }

document.addEventListener("visibilitychange", function() { 
    if (!examStartTime || isSubmitted) return; 
    if (document.hidden) { 
        if (!isTabHidden) { 
            isTabHidden = true; 
            leaveTime = Date.now(); 
            tabSwitchCount++; 
        } 
    } else { 
        if (isTabHidden && leaveTime > 0) { 
            isTabHidden = false; 
            let durationSec = Math.max(1, Math.round((Date.now() - leaveTime) / 1000)); 
            leaveTime = 0; 
            let mins = Math.floor(durationSec / 60); 
            let secs = durationSec % 60; 
            let durationStr = mins > 0 ? `${mins} phút ${secs} giây` : `${secs} giây`; 
            sendTabSwitchLog(tabSwitchCount, durationStr, durationSec); 
            setTimeout(() => alert(`⚠️ CẢNH BÁO GIAN LẬN:\nBạn vừa rời bài thi ${durationStr} (Lần ${tabSwitchCount}).`), 100); 
        } 
    } 
});

function sendTabSwitchLog(switchCount, durationStr, durationSec = 0) { 
    let sId = document.getElementById("student-id") ? document.getElementById("student-id").value.trim() : ""; 
    let sName = document.getElementById("student-name") ? document.getElementById("student-name").value.trim() : ""; 
    let sClass = document.getElementById("student-class") ? document.getElementById("student-class").value.trim() : ""; 
    const currentCat = getExamCategory();
    const urlParams = new URLSearchParams(window.location.search);
    const currentQuizId = urlParams.get('id') || "";

    let payload = { 
        quizId: currentQuizId,
        maDe: getMaDe(), 
        examName: EXAM_NAME, 
        categoryId: currentCat, 
        cat: currentCat, 
        studentId: sId||"Chưa nhập", 
        sbd: sId||"Chưa nhập", 
        soBaoDanh: sId||"Chưa nhập", 
        studentName: sName||"Chưa nhập", 
        studentClass: sClass||"Chưa nhập", 
        switchCount, 
        tabSwitchCount: switchCount, 
        durationStr, 
        durationSec, 
        timestamp: new Date().toLocaleString("vi-VN"), 
        createdAt: Date.now() 
    }; 
    postToGoogleSheet(URL1_TAB_CHEATING, payload, 20000).catch(e=>{}); 
    fetch(`${FIREBASE_DB_URL}/exams/${getExamCode()}/cheating_logs.json`, {
        method: 'POST', body: JSON.stringify(payload)
    }).catch(e=>{}); 
}

function savePendingSubmissionToFile() { 
    if (!pendingSubmissionPayload) return; 
    safeLocal.setItem("pending_exam_submission", JSON.stringify(pendingSubmissionPayload)); 
    const blob = new Blob([JSON.stringify(pendingSubmissionPayload, null, 2)], { type: "application/json;charset=utf-8" }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = `BaiLam_${pendingSubmissionPayload.studentId}_${pendingSubmissionPayload.studentName}.json`; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url); 
    alert("✅ Đã lưu file bài làm tạm!"); 
}

function downloadPendingSubmissionFile() { savePendingSubmissionToFile(); }

function retrySubmitPending() { 
    if (!pendingSubmissionPayload) { 
        try { 
            const raw = safeLocal.getItem("pending_exam_submission"); 
            if (raw) pendingSubmissionPayload = JSON.parse(raw); 
        } catch(e) {} 
    } 
    if (!pendingSubmissionPayload) { 
        document.getElementById("pending-resend-bar").style.display = "none"; 
        return; 
    } 
    const infoText = document.getElementById("pending-info-txt"); 
    infoText.innerText = "⏳ Đang thử gửi lại dữ liệu..."; 

    Promise.all([ 
        postToGoogleSheet(URL2_EXAM_RESULT, pendingSubmissionPayload, 15000), 
        fetch(`${FIREBASE_DB_URL}/exams/${getExamCode()}/submissions.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingSubmissionPayload)
        })
    ]).then(() => { 
        safeLocal.removeItem("pending_exam_submission"); 
        pendingSubmissionPayload = null;
        document.getElementById("pending-resend-bar").style.display = "none"; 
        alert("✅ Đã gửi lại dữ liệu thành công!"); 
    }).catch((err) => { 
        infoText.innerText = "⚠️ Lỗi khi gửi lại! Vui lòng tải file và gửi cho giáo viên."; 
    }); 
}
