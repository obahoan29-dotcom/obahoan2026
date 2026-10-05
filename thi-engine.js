// =========================================================
// FILE: thi-engine.js
// BỘ MÁY ĐIỀU HÀNH BÀI THI: XÁO ĐỀ, HIỂN THỊ CÂU HỎI,
// TÍNH ĐIỂM, ĐỒNG HỒ ĐẾM NGƯỢC, PALETTE & REVIEW LỜI GIẢI
// ĐÃ SỬA TRIỆT ĐỂ: BẮT BUỘC FIREBASE XÁC NHẬN NỘP THÀNH CÔNG
// MỚI ĐƯỢC PHÉP HIỂN THỊ ĐIỂM TRÊN MÀN HÌNH HỌC SINH
// =========================================================
let hasInitExamEngine = false;
// [ĐÃ SỬA LỖI] Đưa hàm này lên đầu file để đảm bảo luôn tồn tại, chống lỗi "not defined"
async function requestWakeLock() {
try {
if ('wakeLock' in navigator) {
await navigator.wakeLock.request('screen');
}
} catch (err) {}
}
function formatQuestionText(text) {
if (!text) return "";
return text.replace(/(^|[^:])//\s*([^\r\n<]+)/g, function(match, prefix, content) {
return prefix + '<span style="color: #78350f; font-weight: 800;">// ' + content.trim() + '</span>';
});
}
async function initExamEngine() {
if (hasInitExamEngine) return;
hasInitExamEngine = true;
code
Code
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

if (isAutostart) {
    updateLoadingText("Đang kết nối phòng thi và tải đề...");
}

const failsafeTimer = setTimeout(() => {
    const gl = document.getElementById('global-loading');
    if (gl && gl.style.display !== 'none') {
        hideLoading();
        showError("Kết nối chậm", "Máy chủ phản hồi chậm hoặc mạng Internet 4G/Wifi bị gián đoạn. Vui lòng kiểm tra lại mạng và tải lại trang!");
    }
}, 8500);

try {
    const controller = new AbortController();
    const fetchTimer = setTimeout(() => controller.abort(), 7500);

    const response = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, { signal: controller.signal });
    clearTimeout(fetchTimer);
    clearTimeout(failsafeTimer);

    examData = await response.json();
    
    if (!examData) {
        throw new Error("Mã đề thi không tồn tại trên hệ thống!");
    }
    
    // --- XỬ LÝ CHẾ ĐỘ XEM ĐỀ GỐC (REVIEW) ---
    if (urlParams.get('review') === "1") {
        if (examData.allowReviewOriginal !== true) {
            hideLoading();
            showError("Bị Khóa", "Giáo viên đã tắt tính năng xem đáp án gốc của đề thi này.");
            return;
        }
        // Thiết lập giả trạng thái đã nộp bài
        isSubmitted = true;
        totalQuestionsCount = examData.questions ? examData.questions.length : 0;
        
        // Render luôn trang Review
        document.getElementById("top-navbar").style.display = "none";
        document.getElementById("quiz-content").style.display = "none";
        document.getElementById("login-box").style.display = "none";
        document.getElementById("student-card").style.display = "none";
        document.getElementById("waiting-room-card").style.display = "none";
        
        // Gọi hàm render riêng cho Xem Đề Gốc
        renderOriginalReviewScreen();
        hideLoading();
        return; // Dừng, không chạy vào logic thi
    }
    // ----------------------------------------------------------

    if (examData.allowFree !== undefined) {
        safeLocal.setItem(`exam_allow_free_${quizId}`, String(examData.allowFree !== false));
    }

    fetchExamQuestions(isAutostart);
    if (typeof setupBackPrevention === 'function') setupBackPrevention();
    
    requestWakeLock(); // Hàm đã được bảo vệ ở đầu file
    
    if (typeof checkPendingSubmissionOnLoad === 'function') checkPendingSubmissionOnLoad();
    
    await checkSessionStatus(isAutostart);
    
    if (typeof startTimeWatcherRealtime === 'function') startTimeWatcherRealtime(quizId);
} catch (error) {
    clearTimeout(failsafeTimer);
    hideLoading();
    showError("Lỗi tải đề thi", error.name === 'AbortError' 
        ? "Mạng Internet của bạn bị chập chờn, đã hết thời gian chờ máy chủ. Vui lòng bấm làm mới (F5) trang lại!" 
        : error.message);
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
code
Code
let p1 = data.questions.filter(q => q.type === "multiple_choice");
let p2 = data.questions.filter(q => q.type === "true_false");
let p3 = data.questions.filter(q => q.type === "short_answer");
let p4 = data.questions.filter(q => q.type === "essay" || q.type === "essay_answer");

p1 = shuffleArray(p1);
p2 = shuffleArray(p2);
p3 = shuffleArray(p3);
p4 = shuffleArray(p4);

p1.forEach(q => {
    if (q.options && q.options.length > 0 && q.correct !== undefined) {
        let correctText = q.options[q.correct];
        q.options = shuffleArray(q.options);
        q.correct = q.options.indexOf(correctText);
    }
});

data.questions = [...p1, ...p2, ...p3, ...p4];
}
function trackPadletClick(qId) { padletClickedMap[qId] = true; saveExamStateToStorage(); }
function toggleSubPadlet(qId) {
const el = document.getElementById(sub-padlet-dropdown-${qId});
if (el) {
el.style.display = (el.style.display === "none" || el.style.display === "") ? "flex" : "none";
}
}
function resetToFreshLoginScreen() {
safeLocal.removeItem(getStorageKey());
safeLocal.removeItem(shuffled_exam_${getExamCode()});
safeLocal.removeItem("saved_student_sbd");
safeLocal.removeItem("saved_student_name");
safeLocal.removeItem("saved_student_class");
safeLocal.removeItem("current_exam_student");
safeLocal.setItem("last_submission_cleared", "true");
code
Code
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
code
Code
// 1. Kiểm tra nhập liệu
if (!sId || !sName || !sClass) {
    if (!isAutostart) alert("⚠️ Vui lòng nhập đầy đủ Số báo danh, Họ và tên, Lớp!");
    return;
}

// 2. Xác định thí sinh tự do hay trong lớp
const currentCat = typeof getExamCategory === 'function' ? getExamCategory() : "them-11";
const checkInClass = typeof findStudentFromDatabase === 'function' ? findStudentFromDatabase(sId, currentCat) : null;
const isFree = !checkInClass;

// 3. Nếu là tự do, kiểm tra xem đề có khóa tự do không
if (isFree) {
    const allowFree = typeof isCurrentExamAllowFree === 'function' ? isCurrentExamAllowFree() : true;
    if (!allowFree) {
        alert("⛔ Đề thi này không cho phép thí sinh tự do tham gia!\nVui lòng kiểm tra lại thông tin đăng nhập.");
        return;
    }
}

// 4. Bắt đầu đẩy lên hệ thống qua thi-service.js
if (typeof executeStartExamAPI === 'function') {
    await executeStartExamAPI(sId, sName, sClass, isFree);
} else {
    console.error("Lỗi: Không tìm thấy hàm executeStartExamAPI trong thi-service.js");
}
}
async function checkSessionStatus(isAutostart = false) {
if (typeof syncStudentFromParamsAndStorage === 'function') syncStudentFromParamsAndStorage();
code
Code
const hideLoading = () => {
    const gl = document.getElementById('global-loading');
    if (gl) gl.style.display = 'none';
};

if (restoreExamStateFromStorage()) { 
    const elapsedTimeSec = Math.floor((Date.now() - examStartTime) / 1000); 
    const timeRemaining = totalTimeSeconds - elapsedTimeSec; 
    if (timeRemaining > 0) { 
        const sName = document.getElementById("student-name").value.trim() || "Thí sinh"; 
        const sId = document.getElementById("student-id").value.trim() || "---"; 
        const sClass = document.getElementById("student-class").value.trim() || "---"; 
        
        const navName = document.getElementById("nav-student-name");
        const navId = document.getElementById("nav-student-id");
        const navClass = document.getElementById("nav-student-class");
        const navExamCode = document.getElementById("nav-exam-code-text");

        if (navName) navName.innerText = sName; 
        if (navId) navId.innerText = sId; 
        if (navClass) navClass.innerText = sClass; 
        if (navExamCode && typeof getMaDe === 'function') navExamCode.innerText = `Đề: ${getMaDe()}`; 
        
        const loginBox = document.getElementById("login-box");
        const studentCard = document.getElementById("student-card");
        const waitCard = document.getElementById("waiting-room-card");
        const topNav = document.getElementById("top-navbar");
        const quizContent = document.getElementById("quiz-content");

        if (loginBox) loginBox.style.display = "none"; 
        if (studentCard) studentCard.style.display = "none"; 
        if (waitCard) waitCard.style.display = "none"; 
        if (topNav) topNav.style.display = "block"; 
        if (quizContent) quizContent.style.display = "block"; 
        
        hideLoading();
        remainingSeconds = timeRemaining; 
        reapplySavedAnswers(); 
        updateProgress(); 
        startCountdownTimer(); 
        if (typeof startPresenceSystem === 'function') startPresenceSystem(sId);
        return; 
    } 
}

if (isAutostart) {
    const sId = document.getElementById("student-id").value.trim();
    const sName = document.getElementById("student-name").value.trim();
    if (sId && sName) {
        const loginBox = document.getElementById("login-box");
        const studentCard = document.getElementById("student-card");
        if (loginBox) loginBox.style.display = "none";
        if (studentCard) studentCard.style.display = "none";
        await startExamAction(true);
        hideLoading();
        return;
    }
}

hideLoading();
}
function fetchExamQuestions(isAutostart = false) {
try {
if (typeof examData === 'undefined' || !examData) { showError("Lỗi", "Không tìm thấy dữ liệu đề thi!"); return; }
code
Code
if (examData.title) { 
        if (typeof EXAM_NAME !== 'undefined') EXAM_NAME = examData.title; 
        const bannerTitle = document.getElementById("banner-title");
        if (bannerTitle) bannerTitle.innerText = examData.title; 
        const examTitleEl = document.getElementById("res-exam-title");
        if (examTitleEl) examTitleEl.innerText = examData.title;
    } 
    
    const navExamCode = document.getElementById("nav-exam-code-text");
    if (navExamCode && typeof getMaDe === 'function') navExamCode.innerText = `Đề: ${getMaDe()}`; 
    
    if (examData.password !== undefined && typeof EXAM_PASSWORD !== 'undefined') EXAM_PASSWORD = String(examData.password).trim(); 
    
    if (examData.timeLimitMinutes !== undefined && examData.timeLimitMinutes !== "") { 
        if (typeof TIME_LIMIT_MINUTES !== 'undefined') TIME_LIMIT_MINUTES = parseInt(examData.timeLimitMinutes, 10); 
        totalTimeSeconds = parseInt(examData.timeLimitMinutes, 10) * 60; 
        remainingSeconds = totalTimeSeconds; 
    } 
    
    if (examData.examStartTimeStr && examData.examEndTimeStr) { 
        const st = new Date(examData.examStartTimeStr).toLocaleString("vi-VN"); 
        const et = new Date(examData.examEndTimeStr).toLocaleString("vi-VN"); 
        const noticeEl = document.getElementById("exam-time-notice"); 
        if (noticeEl) {
            noticeEl.innerText = `⏱ Mở từ: ${st} - Đến: ${et}`; 
            noticeEl.style.display = "block"; 
        }
    } 
    
    let shuffleKey = "shuffled_exam";
    if (typeof getExamCode === 'function') shuffleKey = `shuffled_exam_${getExamCode()}`;

    let shouldShuffle = (examData.isShuffled !== false); 

    if (shouldShuffle) {
        const cachedShuffle = safeLocal.getItem(shuffleKey);
        if (cachedShuffle) {
            examData.questions = JSON.parse(cachedShuffle);
        } else {
            shuffleExamData(examData);
            safeLocal.setItem(shuffleKey, JSON.stringify(examData.questions));
        }
    } else {
        safeLocal.removeItem(shuffleKey);
    }

    const loginBox = document.getElementById("login-box");
    const studentCard = document.getElementById("student-card");

    if (!isAutostart) {
        if (typeof EXAM_PASSWORD !== 'undefined' && EXAM_PASSWORD !== "") {
            if (loginBox) loginBox.style.display = "block"; 
        } else {
            if (studentCard) studentCard.style.display = "block"; 
        }
    } else {
        if (loginBox) loginBox.style.display = "none";
        if (studentCard) studentCard.style.display = "none";
    }
    
    renderQuizLayout(examData.questions || [], examData.images || {}); 
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise().catch(() => {});
    }
} catch (err) { showError("Lỗi", err.message); }
}
function showError(title, msg) {
const loginBox = document.getElementById("login-box");
const studentCard = document.getElementById("student-card");
const errCard = document.getElementById("error-card");
const errTitle = document.getElementById("error-title");
const errMsg = document.getElementById("error-msg");
code
Code
if (loginBox) loginBox.style.display = "none"; 
if (studentCard) studentCard.style.display = "none"; 
if (errTitle) errTitle.innerText = title; 
if (errMsg) errMsg.innerHTML = msg; 
if (errCard) errCard.style.display = "block";
}
function checkPassword() {
const passInput = document.getElementById("exam-pass-input");
if (!passInput) return;
const val = passInput.value.trim();
if (!val) {
alert("⚠️ Vui lòng nhập mật khẩu hoặc mã học sinh!");
return;
}
code
Code
const currentCat = typeof getExamCategory === 'function' ? getExamCategory() : null;
const matchedStudent = typeof findStudentFromDatabase === 'function' 
    ? (findStudentFromDatabase(val, currentCat) || findStudentByPassword(val, currentCat)) 
    : null;

const loginBox = document.getElementById("login-box");
const studentCard = document.getElementById("student-card");

if (matchedStudent) {
    if (typeof applyStudentToUI === 'function') applyStudentToUI(matchedStudent);
    if (loginBox) loginBox.style.display = "none";
    startExamAction();
    return;
}

if (typeof EXAM_PASSWORD !== 'undefined' && EXAM_PASSWORD !== "" && val === EXAM_PASSWORD) { 
    if (loginBox) loginBox.style.display = "none"; 
    if (studentCard) studentCard.style.display = "block"; 
    if (typeof syncStudentFromParamsAndStorage === 'function') syncStudentFromParamsAndStorage();
} else { 
    alert("❌ Mật khẩu bài thi không đúng hoặc không tìm thấy tài khoản học sinh tương ứng!"); 
}
}
function renderQuizLayout(questions, imageMap) {
const container = document.getElementById('dynamic-questions-container');
if (!container) return;
container.innerHTML = '';
code
Code
const p1List = questions.filter(q => q.type === "multiple_choice"); 
const p2List = questions.filter(q => q.type === "true_false"); 
const p3List = questions.filter(q => q.type === "short_answer"); 
const p4List = questions.filter(q => q.type === "essay" || q.type === "essay_answer"); 
totalQuestionsCount = questions.length; 
let displayIndex = 1; 
let html = ""; 

function buildImgHtml(imgUrl) {
    if (!imgUrl) return "";
    return `<div class="quiz-img-container"><img src="${imgUrl}" class="quiz-img" referrerpolicy="no-referrer" loading="lazy" alt="Hình minh họa"></div>`;
}

function buildPart4RowHtml(qId) {
    return `
    <div class="part4-row-container"> 
        <div class="part4-left-col"> 
            <input type="text" class="short-input-box" id="q${qId}-input" placeholder="Nhập đáp số của bạn..." oninput="onShortInputChange(${qId})"> 
        </div> 
        <div class="part4-right-col"> 
            <button type="button" class="btn-photo-trigger" onclick="toggleSubPadlet(${qId})"> 
                📷 Chụp ảnh tự luận ▾ 
            </button> 
            <div id="sub-padlet-dropdown-${qId}" class="sub-padlet-dropdown"> 
                <a href="https://padlet.com/obahoan29/11a-nop-tu-luan-padlet-160926-s023me0a6si1mqhqpnb4" target="_blank" rel="noopener noreferrer" class="btn-padlet-opt" onclick="trackPadletClick(${qId})"> 
                    📌 11A nộp padlet 
                </a> 
                <a href="https://padlet.com/obahoan29/11c-nop-tu-luan-padlet-160926-s023me1v17byc9z8qj13" target="_blank" rel="noopener noreferrer" class="btn-padlet-opt" onclick="trackPadletClick(${qId})"> 
                    📌 11C nộp Padlet 
                </a> 
                <a href="https://padlet.com/obahoan29/10p-nop-tu-luan-tu-05-09-2026-s023mdx0qopg0az79ix0" target="_blank" rel="noopener noreferrer" class="btn-padlet-opt" onclick="trackPadletClick(${qId})"> 
                    📌 10P nộp Padlet 
                </a> 
            </div> 
        </div> 
    </div>`;
}

if (p1List.length > 0) { 
    html += `<div class="exam-section-banner"><div class="section-icon">📑</div><div class="section-text"><h3>PHẦN 1. TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN</h3><p>Chọn duy nhất 01 phương án đúng trong các phương án A, B, C, D</p></div></div>`; 
    p1List.forEach(q => { 
        if (typeof questionDataMap !== 'undefined') questionDataMap[q.id] = q; 
        const letters = ["A", "B", "C", "D"]; 
        if (typeof ANSWER_KEY !== 'undefined') ANSWER_KEY[`q${q.id}`] = letters[q.correct]; 
        const imgUrl = (q.imageKey && imageMap[q.imageKey]) ? imageMap[q.imageKey] : (q.imageUrl || ""); 
        const imgHTML = buildImgHtml(imgUrl); 
        html += `<div class="question-card" id="q-card-${q.id}"> <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div> ${imgHTML} <div class="options-list grid-2"> ${q.options.map((opt, oIdx) => `<label class="opt-label" id="opt-box-${q.id}-${letters[oIdx]}" onclick="selectOption(${q.id}, '${letters[oIdx]}')"> <input type="radio" name="q${q.id}" value="${letters[oIdx]}"> <span class="opt-circle">${letters[oIdx]}</span> <span class="opt-text">${opt}</span> </label>`).join('')} </div> </div>`; 
        displayIndex++; 
    }); 
} 

if (p2List.length > 0) { 
    html += `<div class="exam-section-banner" style="background: linear-gradient(135deg, #7c3aed, #4f46e5);"><div class="section-icon">⚖️</div><div class="section-text"><h3>PHẦN 2. TRẮC NGHIỆM ĐÚNG SAI</h3><p>Thí sinh chọn Đúng hoặc Sai cho từng mệnh đề a), b), c), d)</p></div></div>`; 
    p2List.forEach(q => { 
        if (typeof questionDataMap !== 'undefined') questionDataMap[q.id] = q; 
        const imgUrl = (q.imageKey && imageMap[q.imageKey]) ? imageMap[q.imageKey] : (q.imageUrl || ""); 
        const imgHTML = buildImgHtml(imgUrl); 
        let rows = ""; 
        q.statements.forEach((st) => { 
            const subKey = `q${q.id}_${st.id}`; 
            if (typeof ANSWER_KEY !== 'undefined') ANSWER_KEY[subKey] = st.correct ? "Đúng" : "Sai"; 
            rows += `<tr><td><b>${st.id})</b> ${st.statement}</td> <td width="70" align="center"><input type="radio" name="${subKey}" value="Đúng" onchange="onStatementChange('${subKey}')"></td> <td width="70" align="center"><input type="radio" name="${subKey}" value="Sai" onchange="onStatementChange('${subKey}')"></td></tr>`; 
        }); 
        html += `<div class="question-card" id="q-card-${q.id}"> <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div> ${imgHTML} <div class="tf-table-box"> <table class="tf-table"><thead><tr><th>Mệnh đề</th><th>Đúng</th><th>Sai</th></tr></thead><tbody>${rows}</tbody></table> </div> </div>`; 
        displayIndex++; 
    }); 
} 

if (p3List.length > 0) { 
    html += `<div class="exam-section-banner" style="background: linear-gradient(135deg, #0d9488, #059669);"><div class="section-icon">✍️</div><div class="section-text"><h3>PHẦN 3. TRẢ LỜI NGẮN</h3><p>Nhập đáp số chính xác vào ô trống</p></div></div>`; 
    p3List.forEach(q => { 
        if (typeof questionDataMap !== 'undefined') questionDataMap[q.id] = q; 
        if (typeof ANSWER_KEY !== 'undefined') ANSWER_KEY[`q${q.id}`] = q.correctAnswer; 
        const imgUrl = (q.imageKey && imageMap[q.imageKey]) ? imageMap[q.imageKey] : (q.imageUrl || ""); 
        const imgHTML = buildImgHtml(imgUrl); 
        html += `
        <div class="question-card" id="q-card-${q.id}"> 
            <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div> 
            ${imgHTML} 
            ${buildPart4RowHtml(q.id)}
        </div>`; 
        displayIndex++; 
    }); 
} 

if (p4List.length > 0) { 
    html += `<div class="exam-section-banner" style="background: linear-gradient(135deg, #ea580c, #c2410c);"> 
        <div class="section-icon">📝</div> 
        <div class="section-text"> 
            <h3>PHẦN 4. TỰ LUẬN ĐIỀN ĐÁP ÁN VÀ NỘP BÀI LÀM</h3> 
            <p>Điền đáp số VÀ chụp ảnh bài làm tự luận nộp qua đường dẫn Padlet của lớp</p> 
        </div> 
    </div>`; 
    p4List.forEach(q => { 
        if (typeof questionDataMap !== 'undefined') questionDataMap[q.id] = q; 
        if (typeof ANSWER_KEY !== 'undefined') ANSWER_KEY[`q${q.id}`] = q.correctAnswer || ""; 
        const imgUrl = (q.imageKey && imageMap[q.imageKey]) ? imageMap[q.imageKey] : (q.imageUrl || ""); 
        const imgHTML = buildImgHtml(imgUrl); 
        html += `
        <div class="question-card" id="q-card-${q.id}"> 
            <div class="q-header"> 
                <div class="q-num-badge">${displayIndex}</div> 
                <div class="q-content-text">${formatQuestionText(q.question)}</div> 
            </div> 
            ${imgHTML} 
            ${buildPart4RowHtml(q.id)}
        </div>`; 
        displayIndex++; 
    }); 
} 
container.innerHTML = html; 
renderQuestionPalette(questions); 
setupScrollObserver(); 
updateProgress();
}
function renderQuestionPalette(questions) {
const container = document.getElementById('q-nav-scroll-container');
if (!container) return;
let html = "";
let idx = 1;
questions.forEach(q => {
html += <div class="q-circle" id="q-nav-btn-${q.id}" onclick="scrollToQuestion(${q.id})" title="Câu ${idx}">${idx}</div>;
idx++;
});
container.innerHTML = html;
}
function scrollQPalette(offset) {
const container = document.getElementById("q-nav-scroll-container");
if (container) container.scrollBy({ left: offset, behavior: 'smooth' });
}
function scrollToQuestion(qId) {
const target = document.getElementById(q-card-${qId});
if (target) {
const headerOffset = window.innerWidth <= 640 ? 72 : 82;
const elementPosition = target.getBoundingClientRect().top;
const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
window.scrollTo({ top: offsetPosition, behavior: "smooth" });
highlightActiveCircle(qId);
}
}
function highlightActiveCircle(qId) {
if (currentActiveQId === qId) return;
if (currentActiveQId) {
const prev = document.getElementById(q-nav-btn-${currentActiveQId});
if (prev) prev.classList.remove('active');
}
currentActiveQId = qId;
const curr = document.getElementById(q-nav-btn-${qId});
if (curr) {
curr.classList.add('active');
const scrollContainer = document.getElementById("q-nav-scroll-container");
if (scrollContainer) {
const containerWidth = scrollContainer.offsetWidth;
const btnLeft = curr.offsetLeft;
const btnWidth = curr.offsetWidth;
scrollContainer.scrollTo({
left: btnLeft - (containerWidth / 2) + (btnWidth / 2),
behavior: 'smooth'
});
}
}
}
function setupScrollObserver() {
if (window._qCardObserver) {
window._qCardObserver.disconnect();
}
const options = { root: null, rootMargin: '-85px 0px -50% 0px', threshold: 0.1 };
window._qCardObserver = new IntersectionObserver((entries) => {
let bestEntry = null;
entries.forEach(entry => {
if (entry.isIntersecting) {
if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
bestEntry = entry;
}
}
});
if (bestEntry && bestEntry.target) {
const id = bestEntry.target.id.replace('q-card-', '');
highlightActiveCircle(id);
}
}, options);
document.querySelectorAll('.question-card').forEach(card => window._qCardObserver.observe(card));
}
function selectOption(qId, letter) {
if (isSubmitted) return;
const letters = ["A", "B", "C", "D"];
letters.forEach(l => {
const el = document.getElementById(opt-box-${qId}-${l});
if (el) el.classList.remove('selected');
});
const current = document.getElementById(opt-box-${qId}-${letter});
if (current) current.classList.add('selected');
const radio = document.querySelector(input[name="q${qId}"][value="${letter}"]);
if (radio) radio.checked = true;
if (typeof userAnswersState !== 'undefined') userAnswersState[q${qId}] = letter;
updateProgress();
saveExamStateToStorage();
}
function onStatementChange(subKey) {
if (isSubmitted) return;
const selected = document.querySelector(input[name="${subKey}"]:checked);
if (selected && typeof userAnswersState !== 'undefined') userAnswersState[subKey] = selected.value;
updateProgress();
saveExamStateToStorage();
}
function onShortInputChange(qId) {
if (isSubmitted) return;
const val = document.getElementById(q${qId}-input).value.trim();
if (typeof userAnswersState !== 'undefined') {
if (val) userAnswersState[q${qId}] = val;
else delete userAnswersState[q${qId}];
}
updateProgress();
saveExamStateToStorage();
}
function updateProgress() {
if (!examData || !examData.questions || typeof userAnswersState === 'undefined') return 0;
let answeredCount = 0;
examData.questions.forEach(q => {
const navBtn = document.getElementById(q-nav-btn-${q.id});
let status = "unanswered";
if (q.type === "multiple_choice") {
if (userAnswersState[q${q.id}]) { answeredCount++; status = "answered"; }
} else if (q.type === "true_false") {
let doneCount = 0;
q.statements.forEach(st => {
if (userAnswersState[q${q.id}_${st.id}]) doneCount++;
});
if (doneCount === q.statements.length) { answeredCount++; status = "answered"; }
else if (doneCount > 0) { status = "partial"; }
} else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") {
if (userAnswersState[q${q.id}]) { answeredCount++; status = "answered"; }
}
if (navBtn) {
navBtn.classList.remove("answered", "partial");
if (status === "answered") navBtn.classList.add("answered");
else if (status === "partial") navBtn.classList.add("partial");
}
});
const progressValEl = document.getElementById("nav-progress-val");
if (progressValEl) progressValEl.innerText = ${answeredCount}/${totalQuestionsCount};
return answeredCount;
}
function startWaitingCountdown(startTimeMs, sId, sName, sClass) {
const countdownEl = document.getElementById("waiting-countdown");
if (!countdownEl) return;
if (waitingInterval) clearInterval(waitingInterval);
waitingInterval = setInterval(async () => {
const diff = startTimeMs - Date.now();
if (diff <= 0) {
clearInterval(waitingInterval);
countdownEl.innerText = "00:00:00";
if (typeof executeStartExamAPI === 'function') await executeStartExamAPI(sId, sName, sClass, false);
} else {
const h = Math.floor(diff / 3600000);
const m = Math.floor((diff % 3600000) / 60000);
const s = Math.floor((diff % 60000) / 1000);
countdownEl.innerText = ${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s};
}
}, 1000);
}
function reapplySavedAnswers() {
if (typeof userAnswersState === 'undefined') return;
Object.keys(userAnswersState).forEach(key => {
const val = userAnswersState[key];
if (key.includes('_')) {
const r = document.querySelector(input[name="${key}"][value="${val}"]);
if (r) r.checked = true;
} else if (document.getElementById(${key}-input)) {
document.getElementById(${key}-input).value = val;
} else {
const qId = key.replace('q', '');
selectOption(qId, val);
}
});
}
function formatHHMMSS(totalSecs) {
const h = Math.floor(totalSecs / 3600);
const m = Math.floor((totalSecs % 3600) / 60);
const s = totalSecs % 60;
return ${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s};
}
function startCountdownTimer() {
const timerVal = document.getElementById("nav-timer-val");
const timerBox = document.getElementById("nav-timer-box");
if (timerInterval) clearInterval(timerInterval);
code
Code
timerInterval = setInterval(() => { 
    const now = Date.now(); 

    let currentEndTimeMs = Infinity; 
    if (typeof examData !== 'undefined' && examData && examData.examEndTimeStr) { 
        let t = new Date(examData.examEndTimeStr).getTime();
        if (!isNaN(t)) currentEndTimeMs = t;
    } 

    if (now >= currentEndTimeMs) { 
        clearInterval(timerInterval); 
        timerInterval = null;
        if (timerVal) timerVal.innerText = "00:00:00"; 
        alert("⛔ Đã hết thời gian cho phép của đợt thi! Hệ thống tự động thu bài."); 
        executeSubmitExam(true); 
        return; 
    } 

    const elapsedTimeSec = Math.floor((now - examStartTime) / 1000); 
    remainingSeconds = totalTimeSeconds - elapsedTimeSec; 
    if (remainingSeconds <= 0) { 
        clearInterval(timerInterval); 
        timerInterval = null;
        if (timerVal) timerVal.innerText = "00:00:00"; 
        alert("⏰ Đã hết thời gian làm bài! Hệ thống tự động thu bài."); 
        executeSubmitExam(true); 
        return; 
    } 
    if (timerVal) timerVal.innerText = formatHHMMSS(remainingSeconds); 
    if (timerBox) {
        if (remainingSeconds <= 120) timerBox.classList.add("timer-warning"); 
        else timerBox.classList.remove("timer-warning");
    }
}, 1000);
}
function showSubmitConfirmModal() {
if (isSubmitted) return;
const answered = updateProgress();
const unanswered = totalQuestionsCount - answered;
code
Code
const remainEl = document.getElementById("modal-remain-time");
const countEl = document.getElementById("modal-answered-count");
const warnBox = document.getElementById("modal-unanswered-warning");
const normalView = document.getElementById("modal-normal-submit-view");
const progView = document.getElementById("modal-submitting-progress-view");
const actionsCont = document.getElementById("modal-actions-container");
const modal = document.getElementById("submit-confirm-modal");

if (remainEl) remainEl.innerText = formatHHMMSS(Math.max(0, remainingSeconds)); 
if (countEl) countEl.innerText = `${answered}/${totalQuestionsCount}`; 

if (warnBox) {
    if (unanswered > 0) { 
        warnBox.style.display = "block"; 
        warnBox.innerText = `⚠️ Còn ${unanswered} câu chưa làm!`; 
    } else { 
        warnBox.style.display = "none"; 
    }
}
 
if (normalView) normalView.style.display = "block";
if (progView) progView.style.display = "none";
if (actionsCont) {
    actionsCont.innerHTML = `
        <div class="modal-btn-row">
            <button type="button" class="btn-modal-cancel" onclick="closeSubmitConfirmModal()">Tiếp tục làm</button>
            <button type="button" class="btn-modal-confirm" onclick="executeSubmitExam()">✓ Nộp bài</button>
        </div>
    `;
}
if (modal) modal.style.display = "flex";
}
function closeSubmitConfirmModal() {
const modal = document.getElementById("submit-confirm-modal");
if (modal) modal.style.display = "none";
}
async function executeSubmitExam(isForceSubmit = false) {
if (isSubmitted) return;
code
Code
const confirmModal = document.getElementById("submit-confirm-modal");
const normalView = document.getElementById("modal-normal-submit-view");
const progressView = document.getElementById("modal-submitting-progress-view");
const actionsBox = document.getElementById("modal-actions-container");

if (confirmModal) confirmModal.style.display = "flex";
if (normalView) normalView.style.display = "none";

if (progressView) {
    progressView.innerHTML = `
        <div class="spinner" style="width:38px; height:38px; margin:0 auto 12px auto; border-top-color:#f97316;"></div>
        <div style="font-weight:900; color:#0284c7; font-size:1.1rem;" id="submit-progress-text">⏳ Đang nộp bài thi...</div>
        <div style="font-size:0.9rem; color:#64748b; margin-top:6px; font-weight:600;">Vui lòng giữ kết nối để bảo lưu bài thi thành công 100%.</div>
    `;
    progressView.style.display = "block";
}
if (actionsBox) actionsBox.innerHTML = "";

const idInput = document.getElementById("student-id");
const nameInput = document.getElementById("student-name");
const classInput = document.getElementById("student-class");

const sId = idInput ? idInput.value.trim() : ""; 
const sName = nameInput ? nameInput.value.trim() : ""; 
const sClass = classInput ? classInput.value.trim() : ""; 

const currentCat = typeof getExamCategory === 'function' ? getExamCategory() : "them-11";
const urlParams = new URLSearchParams(window.location.search);
const currentQuizId = urlParams.get('id') || "";

const isClassAcc = typeof findStudentFromDatabase === 'function' ? !!findStudentFromDatabase(sId, currentCat) : false;
const isFreeStudent = !isClassAcc;

const durationSec = examStartTime ? Math.round((Date.now() - examStartTime) / 1000) : 0; 
const spentMins = Math.floor(durationSec / 60); 
const spentSecs = durationSec % 60; 
const completionTimeStr = `${spentMins} phút ${spentSecs} giây`; 

let correctCount = 0; 
let wrongCount = 0; 
let totalRawScore = 0; 
let maxTotalScore = 0; 
let dataDetails = []; 

if (examData && examData.questions) {
    examData.questions.forEach(q => { 
        maxTotalScore += 1.0; 
        if (q.type === "multiple_choice") { 
            const userVal = (typeof userAnswersState !== 'undefined') ? (userAnswersState[`q${q.id}`] || "Chưa chọn") : "Chưa chọn"; 
            const correctVal = (typeof ANSWER_KEY !== 'undefined') ? ANSWER_KEY[`q${q.id}`] : null; 
            if (userVal === correctVal && correctVal) { 
                correctCount++; 
                totalRawScore += 1.0; 
                dataDetails.push(`${q.id}-${userVal} [ĐÚNG]`); 
            } else { 
                wrongCount++; 
                dataDetails.push(`${q.id}-${userVal} [SAI: ${correctVal || ""}]`); 
            } 
        } else if (q.type === "true_false") { 
            let cSt = 0; 
            q.statements.forEach(st => { 
                const sub = `q${q.id}_${st.id}`; 
                const uVal = (typeof userAnswersState !== 'undefined') ? (userAnswersState[sub] || "Chưa chọn") : "Chưa chọn"; 
                const cVal = (typeof ANSWER_KEY !== 'undefined') ? ANSWER_KEY[sub] : null; 
                if (uVal === cVal && cVal) { 
                    cSt++; 
                    dataDetails.push(`${q.id}${st.id}-${uVal} [ĐÚNG]`); 
                } else { 
                    dataDetails.push(`${q.id}${st.id}-${uVal} [SAI]`); 
                } 
            }); 
            let qScore = 0; 
            if (cSt === 1) qScore = 0.1; 
            else if (cSt === 2) qScore = 0.25; 
            else if (cSt === 3) qScore = 0.5; 
            else if (cSt === 4) qScore = 1.0; 
            totalRawScore += qScore; 
            if (cSt === 4) correctCount++; 
            else wrongCount++; 
        } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") { 
            const uVal = (typeof userAnswersState !== 'undefined') ? (userAnswersState[`q${q.id}`] || "").replace(',', '.') : ""; 
            const cVal = (typeof ANSWER_KEY !== 'undefined') ? String(ANSWER_KEY[`q${q.id}`] || "").replace(',', '.') : ""; 
            const isRight = (uVal.trim() === cVal.trim()) || (cVal !== "" && Number(uVal) === Number(cVal) && uVal !== ""); 
            if (isRight) { 
                correctCount++; 
                totalRawScore += 1.0; 
                dataDetails.push(`${q.id}-${uVal} [ĐÚNG]`); 
            } else { 
                wrongCount++; 
                dataDetails.push(`${q.id}-${uVal || "Trống"} [SAI: ${cVal}]`); 
            } 
        } 
    }); 
}

const score10Scale = Math.round(((totalRawScore / (maxTotalScore || 1)) * 10) * 10) / 10; 
const currentTabCount = typeof tabSwitchCount !== 'undefined' ? tabSwitchCount : 0;
dataDetails.push(`Tab Switch: ${currentTabCount}`); 

const payload = { 
    quizId: currentQuizId,
    maDe: typeof getMaDe === 'function' ? getMaDe() : "101", 
    completionTime: completionTimeStr, 
    examName: typeof EXAM_NAME !== 'undefined' ? EXAM_NAME : "", 
    examTitle: typeof EXAM_NAME !== 'undefined' ? EXAM_NAME : "", 
    categoryId: currentCat,
    cat: currentCat,
    studentId: sId, 
    sbd: sId, 
    studentName: sName, 
    studentClass: sClass, 
    className: sClass,
    isFree: isFreeStudent,
    rawScore: Math.round(totalRawScore * 100) / 100, 
    score10: score10Scale, 
    tabSwitchCount: `${currentTabCount} lần`, 
    dataString: dataDetails.join(" | "), 
    calcMetrics: { correctCount, wrongCount, spentMins, completionTimeStr, score10Scale }, 
    timestamp: new Date().toLocaleString("vi-VN"), 
    createdAt: Date.now() 
}; 

safeLocal.setItem("pending_exam_submission", JSON.stringify(payload)); 
if (typeof pendingSubmissionPayload !== 'undefined') pendingSubmissionPayload = payload; 

const examCode = typeof getExamCode === 'function' ? getExamCode() : "";
let firebaseConfirmed = false;

try {
    if (typeof fetchWithRetry === 'function') {
        const res = await fetchWithRetry(`${typeof FIREBASE_DB_URL !== 'undefined' ? FIREBASE_DB_URL : ""}/exams/${examCode}/submissions.json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }, 4, 8000);

        if (res && res.ok) {
            const resJson = await res.json();
            if (resJson && resJson.name) {
                firebaseConfirmed = true;
            }
        }
    }
} catch(err) {
    console.warn("Nộp bài Firebase thất bại sau nhiều lần thử:", err);
}

if (!firebaseConfirmed) {
    if (progressView) {
        progressView.innerHTML = `
            <div style="font-size:40px; margin-bottom:10px;">📶❌</div>
            <div style="font-weight:900; color:#ef4444; font-size:1.1rem;">LỖI MẠNG! CHƯA THỂ NỘP BÀI</div>
            <div style="font-size:0.9rem; color:#475569; margin-top:6px; font-weight:600; line-height: 1.4;">
                Hệ thống không thể kết nối tới máy chủ. Điểm của bạn CHƯA được ghi nhận.<br>
                Vui lòng kiểm tra lại 4G/Wifi và bấm thử lại!
            </div>
        `;
    }
    if (actionsBox) {
        actionsBox.innerHTML = `
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button type="button" onclick="executeSubmitExam(${isForceSubmit})" style="flex:1; padding:10px; background:#0284c7; color:#fff; border:none; border-radius:10px; font-weight:800; cursor:pointer;">🔄 Thử gửi lại</button>
                <button type="button" onclick="if(typeof downloadPendingSubmissionFile === 'function') downloadPendingSubmissionFile()" style="flex:1; padding:10px; background:#0d9488; color:#fff; border:none; border-radius:10px; font-weight:800; cursor:pointer;">💾 Tải file dự phòng</button>
            </div>
        `;
        actionsBox.style.display = "block";
    }
    return; 
}

if (typeof postToGoogleSheet === 'function') {
    postToGoogleSheet(typeof URL2_EXAM_RESULT !== 'undefined' ? URL2_EXAM_RESULT : "", payload, 15000).catch(e => null);
}

if (typeof clearPresence === 'function') {
    clearPresence(sId);
}

if (typeof timerInterval !== 'undefined' && timerInterval) clearInterval(timerInterval); 
if (typeof timeWatcherInterval !== 'undefined' && timeWatcherInterval) clearInterval(timeWatcherInterval);

safeLocal.removeItem("pending_exam_submission");
if (typeof getStorageKey === 'function') safeLocal.removeItem(getStorageKey()); 
if (typeof getExamCode === 'function') safeLocal.removeItem(`shuffled_exam_${getExamCode()}`); 
safeLocal.removeItem("saved_student_sbd");
safeLocal.removeItem("saved_student_name");
safeLocal.removeItem("saved_student_class");
safeLocal.removeItem("current_exam_student");
safeLocal.setItem("last_submission_cleared", "true");

isSubmitted = true; 
if (confirmModal) confirmModal.style.display = "none"; 

renderResultSummaryScreen(correctCount, wrongCount, spentMins, completionTimeStr, score10Scale);
}
function renderResultSummaryScreen(correct, wrong, spentMins, spentTimeStr, finalScore) {
const topNav = document.getElementById("top-navbar");
const quizContent = document.getElementById("quiz-content");
const resView = document.getElementById("result-view-container");
code
Code
if (topNav) topNav.style.display = "none"; 
if (quizContent) quizContent.style.display = "none"; 
if (resView) resView.style.display = "block"; 

const resExamTitle = document.getElementById("res-exam-title");
if (resExamTitle) {
    resExamTitle.innerText = (typeof EXAM_NAME !== 'undefined' ? EXAM_NAME : "BÀI THI TRẮC NGHIỆM");
}

const sName = document.getElementById("student-name") ? document.getElementById("student-name").value.trim() : "Thí sinh";
const sClass = document.getElementById("student-class") ? document.getElementById("student-class").value.trim() : "---";
const sId = document.getElementById("student-id") ? document.getElementById("student-id").value.trim() : "---";

const overviewEl = document.getElementById("res-score-overview");
const correctEl = document.getElementById("res-stat-correct");
const wrongEl = document.getElementById("res-stat-wrong");
const timeEl = document.getElementById("res-stat-time");

const resUserName = document.getElementById("res-user-name");
const resUserClass = document.getElementById("res-user-class");
const resUserId = document.getElementById("res-user-id");
const resSpentTime = document.getElementById("res-spent-time");

if (overviewEl && typeof totalQuestionsCount !== 'undefined') overviewEl.innerText = `Đúng ${correct}/${totalQuestionsCount} câu (${finalScore} điểm)`; 
if (correctEl) correctEl.innerText = correct; 
if (wrongEl) wrongEl.innerText = wrong; 
if (timeEl) timeEl.innerText = spentMins; 
if (resUserName) resUserName.innerText = sName; 
if (resUserClass) resUserClass.innerText = sClass; 
if (resUserId) resUserId.innerText = sId; 
if (resSpentTime) resSpentTime.innerText = spentTimeStr; 

// =========================================================
// XỬ LÝ 3 CHẾ ĐỘ HIỂN THỊ KẾT QUẢ TỪ QUẢN TRỊ VIÊN
// =========================================================
const resultMode = (examData && examData.resultMode) ? examData.resultMode : "show_all";

const scoreOverviewEl = document.getElementById("res-score-overview");
const statsCardsEl = document.querySelector(".stats-cards-grid");
const reviewBannerEl = document.querySelector(".review-banner");
const reviewBodyEl = document.getElementById("review-container-body");

const oldMsg = document.getElementById("res-success-msg");
if (oldMsg) oldMsg.remove();

if (resultMode === "hide_all") {
    if (scoreOverviewEl) scoreOverviewEl.style.display = "none";
    if (statsCardsEl) statsCardsEl.style.display = "none";
    if (reviewBannerEl) reviewBannerEl.style.display = "none";
    if (reviewBodyEl) reviewBodyEl.style.display = "none";

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
    const summaryCard = document.querySelector(".result-summary-card");
    const userDetails = document.querySelector(".user-details-grid");
    if (summaryCard && userDetails) summaryCard.insertBefore(successMsg, userDetails);
    
} else if (resultMode === "score_only") {
    if (scoreOverviewEl) scoreOverviewEl.style.display = "block";
    if (statsCardsEl) statsCardsEl.style.display = "grid";
    if (reviewBannerEl) reviewBannerEl.style.display = "none";
    if (reviewBodyEl) reviewBodyEl.style.display = "none";

    const successMsg = document.createElement("div");
    successMsg.id = "res-success-msg";
    successMsg.innerHTML = `
        <p style="color: #b45309; font-weight: 600; font-size: 0.95rem; line-height: 1.5; background: #fffbeb; padding: 10px; border-radius: 10px; border: 1px dashed #fcd34d; margin-bottom: 16px;">
            🔒 Giáo viên đã tạm khóa tính năng xem lại bài làm chi tiết để đảm bảo công bằng. Bạn chỉ có thể xem điểm tổng quát lúc này.
        </p>
    `;
    const summaryCard = document.querySelector(".result-summary-card");
    const userDetails = document.querySelector(".user-details-grid");
    if (summaryCard && userDetails) summaryCard.insertBefore(successMsg, userDetails);

} else {
    if (scoreOverviewEl) scoreOverviewEl.style.display = "block";
    if (statsCardsEl) statsCardsEl.style.display = "grid";
    if (reviewBannerEl) reviewBannerEl.style.display = "flex";
    if (reviewBodyEl) reviewBodyEl.style.display = "block";

    let revHTML = ""; 
    let idx = 1; 
    
    function buildRevImgHtml(imgUrl) {
        if (!imgUrl) return "";
        return `<div class="quiz-img-container"><img src="${imgUrl}" class="quiz-img" referrerpolicy="no-referrer" loading="lazy" alt="Hình minh họa"></div>`;
    }

    if (examData && examData.questions) {
        examData.questions.forEach(q => { 
            const imgUrl = (q.imageKey && examData.images && examData.images[q.imageKey]) ? examData.images[q.imageKey] : (q.imageUrl || ""); 
            const imgTag = buildRevImgHtml(imgUrl); 
            const explainText = q.explanation ? `<div class="explanation-box">💡 <b>Lời giải chi tiết:</b> ${q.explanation}</div>` : ""; 
            
            if (q.type === "multiple_choice") { 
                const letters = ["A", "B", "C", "D"]; 
                const uAns = (typeof userAnswersState !== 'undefined') ? userAnswersState[`q${q.id}`] : null; 
                const cAns = (typeof ANSWER_KEY !== 'undefined') ? ANSWER_KEY[`q${q.id}`] : null; 
                
                let optsHtml = "";
                if (q.options) {
                    optsHtml = q.options.map((opt, oIdx) => { 
                        const L = letters[oIdx]; 
                        let cls = ""; let icon = ""; 
                        if (L === cAns) { cls = "is-correct"; icon = " ✓"; } 
                        else if (L === uAns && uAns !== cAns) { cls = "is-wrong"; icon = " ✗"; } 
                        return `<div class="opt-label ${cls}"><span class="opt-circle">${L}</span><span class="opt-text">${opt} <b>${icon}</b></span></div>`; 
                    }).join('');
                }

                revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge" style="background:${uAns===cAns?'#22c55e':'#ef4444'}">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="options-list grid-2">${optsHtml}</div>${explainText}</div>`; 
            } else if (q.type === "true_false") { 
                let rows = ""; 
                if (q.statements) {
                    q.statements.forEach(st => { 
                        const sub = `q${q.id}_${st.id}`; 
                        const uVal = (typeof userAnswersState !== 'undefined') ? (userAnswersState[sub] || "Chưa chọn") : "Chưa chọn"; 
                        const cVal = (typeof ANSWER_KEY !== 'undefined') ? ANSWER_KEY[sub] : null; 
                        const ok = (uVal === cVal); 
                        rows += `<tr><td><b>${st.id})</b> ${st.statement}</td><td align="center">${uVal==="Đúng"?(ok?"🟢 Đúng":"🔴 Đúng (Sai)"):""}</td><td align="center">${uVal==="Sai"?(ok?"🟢 Sai":"🔴 Sai (Sai)"):""}</td><td align="center"><b>${cVal || ""}</b></td></tr>`; 
                    }); 
                }
                revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="tf-table-box"><table class="tf-table"><thead><tr><th>Mệnh đề</th><th>Bạn chọn</th><th>Đ.Á Đúng</th></tr></thead><tbody>${rows}</tbody></table></div>${explainText}</div>`; 
            } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") { 
                const uVal = (typeof userAnswersState !== 'undefined') ? (userAnswersState[`q${q.id}`] || "(Để trống)") : "(Để trống)"; 
                const cVal = (typeof ANSWER_KEY !== 'undefined') ? ANSWER_KEY[`q${q.id}`] : ""; 
                revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div style="margin-top:14px; font-size:1.05rem; font-weight:600;"><div>Tr.lời của bạn: <b>${uVal}</b></div><div style="color:#15803d; font-weight:800; margin-top:6px;">Đáp án đúng / tham khảo: ${cVal || ""}</div></div>${explainText}</div>`; 
            } 
            idx++; 
        }); 
    }
    if (reviewBodyEl) reviewBodyEl.innerHTML = revHTML; 
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise().catch(() => {});
    }
}

window.scrollTo({ top: 0, behavior: 'smooth' });
}
// HÀM HIỂN THỊ ĐÁP ÁN GỐC DÀNH CHO NÚT "XEM GIẢI CHI TIẾT" TỪ TRANG CHỦ
function renderOriginalReviewScreen() {
const resView = document.getElementById("result-view-container");
if (resView) resView.style.display = "block";
code
Code
// Ẩn bảng điểm vì đây chỉ là xem giải gốc
const summaryCard = document.querySelector(".result-summary-card");
if (summaryCard) summaryCard.style.display = "none";

const reviewBannerEl = document.querySelector(".review-banner");
const reviewBodyEl = document.getElementById("review-container-body");

if (reviewBannerEl) {
    reviewBannerEl.style.display = "flex";
    reviewBannerEl.innerHTML = `<span>📖</span> TÀI LIỆU ĐỀ THI GỐC & LỜI GIẢI CHI TIẾT`;
    reviewBannerEl.style.background = "linear-gradient(135deg, #059669, #047857)";
}

// Dựng Answer Key chuẩn từ dữ liệu gốc
let generatedAnswerKey = {};
const letters = ["A", "B", "C", "D"]; 
if (examData && examData.questions) {
    examData.questions.forEach(q => {
        if (q.type === "multiple_choice") {
            generatedAnswerKey[`q${q.id}`] = typeof q.correct === 'number' ? letters[q.correct] : q.correct;
        } else if (q.type === "true_false") {
            if (q.statements) {
                q.statements.forEach(st => {
                    generatedAnswerKey[`q${q.id}_${st.id}`] = st.correct ? "Đúng" : "Sai";
                });
            }
        } else {
            generatedAnswerKey[`q${q.id}`] = q.correctAnswer;
        }
    });
}

let revHTML = ""; 
let idx = 1; 

function buildRevImgHtml(imgUrl) {
    if (!imgUrl) return "";
    return `<div class="quiz-img-container"><img src="${imgUrl}" class="quiz-img" referrerpolicy="no-referrer" loading="lazy" alt="Hình minh họa"></div>`;
}

if (examData && examData.questions) {
    examData.questions.forEach(q => { 
        const imgUrl = (q.imageKey && examData.images && examData.images[q.imageKey]) ? examData.images[q.imageKey] : (q.imageUrl || ""); 
        const imgTag = buildRevImgHtml(imgUrl); 
        const explainText = q.explanation ? `<div class="explanation-box">💡 <b>Lời giải chi tiết:</b> ${q.explanation}</div>` : ""; 
        
        if (q.type === "multiple_choice") { 
            const cAns = generatedAnswerKey[`q${q.id}`]; 
            
            let optsHtml = "";
            if (q.options) {
                optsHtml = q.options.map((opt, oIdx) => { 
                    const L = letters[oIdx]; 
                    let cls = ""; let icon = ""; 
                    if (L === cAns) { cls = "is-correct"; icon = " ✓ Đ.Án"; } 
                    return `<div class="opt-label ${cls}"><span class="opt-circle">${L}</span><span class="opt-text">${opt} <b>${icon}</b></span></div>`; 
                }).join('');
            }

            revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="options-list grid-2">${optsHtml}</div>${explainText}</div>`; 
        } else if (q.type === "true_false") { 
            let rows = ""; 
            if (q.statements) {
                q.statements.forEach(st => { 
                    const sub = `q${q.id}_${st.id}`; 
                    const cVal = generatedAnswerKey[sub]; 
                    rows += `<tr><td><b>${st.id})</b> ${st.statement}</td><td align="center" style="color:#15803d; font-weight:800;">${cVal || ""}</td></tr>`; 
                }); 
            }
            revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="tf-table-box"><table class="tf-table"><thead><tr><th>Mệnh đề</th><th>Đáp án gốc</th></tr></thead><tbody>${rows}</tbody></table></div>${explainText}</div>`; 
        } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") { 
            const cVal = generatedAnswerKey[`q${q.id}`]; 
            revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div style="margin-top:14px; font-size:1.05rem; font-weight:600;"><div style="color:#15803d; font-weight:800; margin-top:6px;">Đáp án chuẩn: ${cVal || ""}</div></div>${explainText}</div>`; 
        } 
        idx++; 
    }); 
}

if (reviewBodyEl) reviewBodyEl.innerHTML = revHTML; 
if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise().catch(() => {});
}
