// =========================================================
// FILE: thi-engine.js
// BỘ MÁY ĐIỀU HÀNH BÀI THI: XÁO ĐỀ, HIỂN THỊ CÂU HỎI,
// TÍNH ĐIỂM, ĐỒNG HỒ ĐẾM NGƯỢC, PALETTE & REVIEW LỜI GIẢI
// ĐÃ SỬA TRIỆT ĐỂ: BỘ ĐỆM TIMEOUT CHỐNG TRẮNG MÀN HÌNH TRÊN IPHONE
// ĐÃ TỐI ƯU CƠ CHẾ XÁC NHẬN GHI DỮ LIỆU FIREBASE TRƯỚC KHI MỞ ĐỀ
// =========================================================

let hasInitExamEngine = false;

async function initExamEngine() {
    if (hasInitExamEngine) return;
    hasInitExamEngine = true;

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    const hideLoading = () => {
        const gl = document.getElementById('global-loading');
        if (gl) gl.style.display = 'none';
    };

    if (!quizId) {
        hideLoading();
        showError("Lỗi đường dẫn", "Không tìm thấy mã đề thi (thiếu tham số ?id=...)");
        return;
    }

    // CƠ CHẾ PHÒNG THỦ: NẾU MẠNG QUÁ NGHẼN/TREO TRÊN IPHONE, TỰ BỎ LỚP CHỜ SAU 8 GIÂY
    const failsafeTimer = setTimeout(() => {
        const gl = document.getElementById('global-loading');
        if (gl && gl.style.display !== 'none') {
            hideLoading();
            showError("Kết nối chậm", "Máy chủ phản hồi chậm hoặc mạng Internet 4G/Wifi bị gián đoạn. Vui lòng kiểm tra lại mạng và tải lại trang!");
        }
    }, 8000);

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
        
        if (examData.allowFree !== undefined) {
            safeLocal.setItem(`exam_allow_free_${quizId}`, String(examData.allowFree !== false));
        }

        hideLoading();
        
        fetchExamQuestions();
        setupBackPrevention();
        requestWakeLock();
        checkPendingSubmissionOnLoad();
        checkSessionStatus();
        startTimeWatcherRealtime(quizId);

        const sbdInput = document.getElementById("student-id");
        if (sbdInput) {
            sbdInput.addEventListener("input", function() {
                const matched = findStudentFromDatabase(this.value, getExamCategory());
                if (matched) {
                    applyStudentToUI(matched);
                }
            });
        }
    } catch (error) {
        clearTimeout(failsafeTimer);
        hideLoading();
        showError("Lỗi tải đề thi", error.name === 'AbortError' 
            ? "Mạng Internet của bạn bị chập chờn, đã hết thời gian chờ máy chủ. Vui lòng bấm làm mới (F5) trang lại!" 
            : error.message);
    }
}

// Khởi chạy an toàn ngay khi DOM sẵn sàng hoặc khi cửa sổ load xong
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
    const el = document.getElementById(`sub-padlet-dropdown-${qId}`); 
    if (el) { 
        el.style.display = (el.style.display === "none" || el.style.display === "") ? "flex" : "none"; 
    } 
}

function resetToFreshLoginScreen() { 
    safeLocal.removeItem(getStorageKey()); 
    safeLocal.removeItem(`shuffled_exam_${getExamCode()}`);
    safeLocal.removeItem("saved_student_sbd");
    safeLocal.removeItem("saved_student_name");
    safeLocal.removeItem("saved_student_class");
    safeLocal.removeItem("current_exam_student");
    safeLocal.setItem("last_submission_cleared", "true");

    const sName = document.getElementById("student-name");
    const sId = document.getElementById("student-id");
    const sClass = document.getElementById("student-class");
    if (sName) sName.value = "";
    if (sId) sId.value = "";
    if (sClass) sClass.value = "";

    window.location.reload(); 
}

function checkSessionStatus() { 
    syncStudentFromParamsAndStorage();

    if (restoreExamStateFromStorage()) { 
        const elapsedTimeSec = Math.floor((Date.now() - examStartTime) / 1000); 
        const timeRemaining = totalTimeSeconds - elapsedTimeSec; 
        if (timeRemaining > 0) { 
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
            remainingSeconds = timeRemaining; 
            reapplySavedAnswers(); 
            updateProgress(); 
            startCountdownTimer(); 
            startPresenceSystem(sId);
            return; 
        } 
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === "1") {
        const sId = document.getElementById("student-id").value.trim();
        const sName = document.getElementById("student-name").value.trim();
        const sClass = document.getElementById("student-class").value.trim();
        if (sId && sName) {
            document.getElementById("login-box").style.display = "none";
            startExamAction();
        }
    }
}

function fetchExamQuestions() { 
    try { 
        if (typeof examData === 'undefined' || !examData) { showError("Lỗi", "Không tìm thấy dữ liệu đề thi!"); return; } 
        if (examData.title) { EXAM_NAME = examData.title; document.getElementById("banner-title").innerText = EXAM_NAME; } 
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

        if (EXAM_PASSWORD !== "") document.getElementById("login-box").style.display = "block"; 
        else document.getElementById("student-card").style.display = "block"; 
        
        renderQuizLayout(examData.questions || [], examData.images || {}); 
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise().catch(() => {});
        }
    } catch (err) { showError("Lỗi", err.message); } 
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

    const currentCat = getExamCategory();
    const matchedStudent = findStudentFromDatabase(val, currentCat) || findStudentByPassword(val, currentCat);
    if (matchedStudent) {
        applyStudentToUI(matchedStudent);
        document.getElementById("login-box").style.display = "none";
        startExamAction();
        return;
    }

    if (EXAM_PASSWORD !== "" && val === EXAM_PASSWORD) { 
        document.getElementById("login-box").style.display = "none"; 
        document.getElementById("student-card").style.display = "block"; 
        syncStudentFromParamsAndStorage();
    } else { 
        alert("❌ Mật khẩu bài thi không đúng hoặc không tìm thấy tài khoản học sinh tương ứng!"); 
    } 
}

function renderQuizLayout(questions, imageMap) { 
    const container = document.getElementById('dynamic-questions-container'); 
    container.innerHTML = ''; 
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
        html += `<div class="exam-section-banner"><div class="section-icon">📑</div><div class="section-text"><h3>P.1 TRẮC NGHIỆM NHIỀU LỰA CHỌN</h3></div></div>`; 
        p1List.forEach(q => { 
            questionDataMap[q.id] = q; 
            const letters = ["A", "B", "C", "D"]; 
            ANSWER_KEY[`q${q.id}`] = letters[q.correct]; 
            const imgUrl = (q.imageKey && imageMap[q.imageKey]) ? imageMap[q.imageKey] : (q.imageUrl || ""); 
            const imgHTML = buildImgHtml(imgUrl); 
            html += `<div class="question-card" id="q-card-${q.id}"> <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${q.question}</div></div> ${imgHTML} <div class="options-list grid-2"> ${q.options.map((opt, oIdx) => `<label class="opt-label" id="opt-box-${q.id}-${letters[oIdx]}" onclick="selectOption(${q.id}, '${letters[oIdx]}')"> <input type="radio" name="q${q.id}" value="${letters[oIdx]}"> <span class="opt-circle">${letters[oIdx]}</span> <span class="opt-text">${opt}</span> </label>`).join('')} </div> </div>`; 
            displayIndex++; 
        }); 
    } 

    if (p2List.length > 0) { 
        html += `<div class="exam-section-banner" style="background: linear-gradient(135deg, #7c3aed, #4f46e5);"><div class="section-icon">⚖️</div><div class="section-text"><h3>P.2 TRẮC NGHIỆM ĐÚNG SAI</h3></div></div>`; 
        p2List.forEach(q => { 
            questionDataMap[q.id] = q; 
            const imgUrl = (q.imageKey && imageMap[q.imageKey]) ? imageMap[q.imageKey] : (q.imageUrl || ""); 
            const imgHTML = buildImgHtml(imgUrl); 
            let rows = ""; 
            q.statements.forEach((st) => { 
                const subKey = `q${q.id}_${st.id}`; 
                ANSWER_KEY[subKey] = st.correct ? "Đúng" : "Sai"; 
                rows += `<tr><td><b>${st.id})</b> ${st.statement}</td> <td width="60" align="center"><input type="radio" name="${subKey}" value="Đúng" onchange="onStatementChange('${subKey}')"></td> <td width="60" align="center"><input type="radio" name="${subKey}" value="Sai" onchange="onStatementChange('${subKey}')"></td></tr>`; 
            }); 
            html += `<div class="question-card" id="q-card-${q.id}"> <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${q.question}</div></div> ${imgHTML} <div class="tf-table-box"> <table class="tf-table"><thead><tr><th>Mệnh đề</th><th>Đúng</th><th>Sai</th></tr></thead><tbody>${rows}</tbody></table> </div> </div>`; 
            displayIndex++; 
        }); 
    } 

    if (p3List.length > 0) { 
        html += `<div class="exam-section-banner" style="background: linear-gradient(135deg, #0d9488, #059669);"><div class="section-icon">✍️</div><div class="section-text"><h3>P.3 TRẢ LỜI NGẮN</h3></div></div>`; 
        p3List.forEach(q => { 
            questionDataMap[q.id] = q; 
            ANSWER_KEY[`q${q.id}`] = q.correctAnswer; 
            const imgUrl = (q.imageKey && imageMap[q.imageKey]) ? imageMap[q.imageKey] : (q.imageUrl || ""); 
            const imgHTML = buildImgHtml(imgUrl); 
            html += `
            <div class="question-card" id="q-card-${q.id}"> 
                <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${q.question}</div></div> 
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
            questionDataMap[q.id] = q; 
            ANSWER_KEY[`q${q.id}`] = q.correctAnswer || ""; 
            const imgUrl = (q.imageKey && imageMap[q.imageKey]) ? imageMap[q.imageKey] : (q.imageUrl || ""); 
            const imgHTML = buildImgHtml(imgUrl); 
            html += `
            <div class="question-card" id="q-card-${q.id}"> 
                <div class="q-header"> 
                    <div class="q-num-badge">${displayIndex}</div> 
                    <div class="q-content-text">${q.question}</div> 
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
        html += `<div class="q-circle" id="q-nav-btn-${q.id}" onclick="scrollToQuestion(${q.id})" title="Câu ${idx}">${idx}</div>`; 
        idx++; 
    }); 
    container.innerHTML = html; 
}

function scrollQPalette(offset) { 
    const container = document.getElementById("q-nav-scroll-container"); 
    if (container) container.scrollBy({ left: offset, behavior: 'smooth' }); 
}

function scrollToQuestion(qId) { 
    const target = document.getElementById(`q-card-${qId}`); 
    if (target) { 
        const headerOffset = 110; 
        const elementPosition = target.getBoundingClientRect().top; 
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset; 
        window.scrollTo({ top: offsetPosition, behavior: "smooth" }); 
        highlightActiveCircle(qId); 
    } 
}

function highlightActiveCircle(qId) { 
    if (currentActiveQId) { 
        const prev = document.getElementById(`q-nav-btn-${currentActiveQId}`); 
        if (prev) prev.classList.remove('active'); 
    } 
    currentActiveQId = qId; 
    const curr = document.getElementById(`q-nav-btn-${qId}`); 
    if (curr) { 
        curr.classList.add('active'); 
        curr.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); 
    } 
}

function setupScrollObserver() { 
    const options = { root: null, rootMargin: '-110px 0px -60% 0px', threshold: 0.1 }; 
    const observer = new IntersectionObserver((entries) => { 
        entries.forEach(entry => { 
            if (entry.isIntersecting) { 
                const id = entry.target.id.replace('q-card-', ''); 
                highlightActiveCircle(id); 
            } 
        }); 
    }, options); 
    document.querySelectorAll('.question-card').forEach(card => observer.observe(card)); 
}

function selectOption(qId, letter) { 
    if (isSubmitted) return; 
    const letters = ["A", "B", "C", "D"]; 
    letters.forEach(l => { 
        const el = document.getElementById(`opt-box-${qId}-${l}`); 
        if (el) el.classList.remove('selected'); 
    }); 
    const current = document.getElementById(`opt-box-${qId}-${letter}`); 
    if (current) current.classList.add('selected'); 
    const radio = document.querySelector(`input[name="q${qId}"][value="${letter}"]`); 
    if (radio) radio.checked = true; 
    userAnswersState[`q${qId}`] = letter; 
    updateProgress(); 
    saveExamStateToStorage(); 
}

function onStatementChange(subKey) { 
    if (isSubmitted) return; 
    const selected = document.querySelector(`input[name="${subKey}"]:checked`); 
    if (selected) userAnswersState[subKey] = selected.value; 
    updateProgress(); 
    saveExamStateToStorage(); 
}

function onShortInputChange(qId) { 
    if (isSubmitted) return; 
    const val = document.getElementById(`q${qId}-input`).value.trim(); 
    if (val) userAnswersState[`q${qId}`] = val; 
    else delete userAnswersState[`q${qId}`]; 
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
            if (userAnswersState[`q${q.id}`]) { answeredCount++; status = "answered"; } 
        } else if (q.type === "true_false") { 
            let doneCount = 0; 
            q.statements.forEach(st => { 
                if (userAnswersState[`q${q.id}_${st.id}`]) doneCount++; 
            }); 
            if (doneCount === q.statements.length) { answeredCount++; status = "answered"; } 
            else if (doneCount > 0) { status = "partial"; } 
        } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") { 
            if (userAnswersState[`q${q.id}`]) { answeredCount++; status = "answered"; } 
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

async function startExamAction() { 
    let sId = document.getElementById("student-id").value.trim(); 
    let sName = document.getElementById("student-name").value.trim(); 
    let sClass = document.getElementById("student-class").value.trim(); 
    
    const currentCat = getExamCategory();
    const matchedClassAcc = findStudentFromDatabase(sId, currentCat) || findStudentFromDatabase(sName, currentCat);

    if (!sName && sId && matchedClassAcc) {
        applyStudentToUI(matchedClassAcc);
        sId = matchedClassAcc.sbd;
        sName = matchedClassAcc.name;
        sClass = matchedClassAcc.className;
    }

    if (!sId || !sName || !sClass) { 
        document.getElementById("student-card").style.display = "block";
        alert("⚠️ Vui lòng nhập đầy đủ SBD, Họ tên, Lớp!"); 
        return; 
    } 
    
    const isFreeStudent = !matchedClassAcc;
    const allowFree = isCurrentExamAllowFree();

    if (isFreeStudent && !allowFree) {
        alert("⛔ GIÁO VIÊN ĐÃ TẮT CHẾ ĐỘ THI TỰ DO!\nĐề thi này hiện chỉ dành riêng cho học sinh chính thức có tên trong danh sách lớp.");
        document.getElementById("student-card").style.display = "block";
        return;
    }

    const now = Date.now(); 
    let startTimeMs = 0; 
    let endTimeMs = Infinity; 
    if (typeof examData !== 'undefined' && examData) { 
        if (examData.examStartTimeStr) {
            let t = new Date(examData.examStartTimeStr).getTime();
            if (!isNaN(t)) startTimeMs = t;
        } 
        if (examData.examEndTimeStr) {
            let t = new Date(examData.examEndTimeStr).getTime();
            if (!isNaN(t)) endTimeMs = t;
        } 
    } 
    
    if (now > endTimeMs) { alert("⛔ BÀI THI ĐÃ ĐÓNG!\nThời gian được phép làm bài đã kết thúc."); return; } 
    if (now < startTimeMs) { 
        document.getElementById("student-card").style.display = "none"; 
        document.getElementById("waiting-room-card").style.display = "block"; 
        startWaitingCountdown(startTimeMs, sId, sName, sClass); 
        return; 
    } 
    
    await executeStartExamAPI(sId, sName, sClass, isFreeStudent); 
}

function startWaitingCountdown(startTimeMs, sId, sName, sClass) { 
    const countdownEl = document.getElementById("waiting-countdown"); 
    if (waitingInterval) clearInterval(waitingInterval); 
    waitingInterval = setInterval(async () => { 
        const diff = startTimeMs - Date.now(); 
        if (diff <= 0) { 
            clearInterval(waitingInterval); 
            countdownEl.innerText = "00:00:00"; 
            await executeStartExamAPI(sId, sName, sClass, false); 
        } else { 
            const h = Math.floor(diff / 3600000); 
            const m = Math.floor((diff % 3600000) / 60000); 
            const s = Math.floor((diff % 60000) / 1000); 
            countdownEl.innerText = `${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`; 
        } 
    }, 1000); 
}

// BẮT BUỘC FIREBASE PHẢN HỒI GHI DỮ LIỆU THÀNH CÔNG RỒI MỚI MỞ ĐỀ
// ĐÃ NÂNG CẤP KIỂM TRA CHẶT CHẼ DỮ LIỆU JSON PHẢN HỒI TỪ FIREBASE
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Tối đa 5s cho mạng yếu

        const pushNodes = [examCode];
        if (currentQuizId && currentQuizId !== examCode) pushNodes.push(currentQuizId);
        let numMatch = (EXAM_NAME || "").match(/(?:đề|de)\s*(?:số|so)?\s*(\d+)/i);
        if (numMatch) {
            pushNodes.push(numMatch[1]);
            pushNodes.push("DE" + numMatch[1]);
            pushNodes.push("DE" + numMatch[1] + "TOAN11");
        }

        const primarySessionTask = fetch(`${FIREBASE_DB_URL}/active_sessions/${examCode}/${safeId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(presencePayload),
            signal: controller.signal
        });

        const otherTasks = [];
        pushNodes.forEach(n => {
            if (n !== examCode) {
                otherTasks.push(
                    fetch(`${FIREBASE_DB_URL}/active_sessions/${n}/${safeId}.json`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(presencePayload),
                        signal: controller.signal
                    }).catch(() => null)
                );
            }
        });

        otherTasks.push(
            fetch(`${FIREBASE_DB_URL}/exams/${examCode}/cheating_logs.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logPayload),
                signal: controller.signal
            }).catch(() => null)
        );

        const [primaryRes] = await Promise.all([primarySessionTask, ...otherTasks]);
        clearTimeout(timeoutId);

        // KIỂM TRA CHẶT CHẼ PHẢN HỒI THÀNH CÔNG VÀ JSON TRẢ VỀ TỪ FIREBASE
        if (primaryRes && primaryRes.ok) {
            const resData = await primaryRes.json().catch(() => null);
            if (resData && !resData.error && resData.sbd) {
                isFirebaseConfirmed = true;
            }
        }
    } catch(e) {
        console.warn("Lỗi kết nối Firebase khi bắt đầu bài thi:", e);
    }

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

        alert("⚠️ CHƯA THỂ MỞ ĐỀ THI!\n\nMáy chủ thi (Firebase) chưa phản hồi xác nhận ghi danh sách do mạng Internet của bạn bị chập chờn hoặc gián đoạn.\n\nVui lòng kiểm tra lại kết nối mạng và bấm nút 'Vào Làm Bài' lại để hệ thống bảo lưu kết quả chuẩn xác!");
        return;
    }

    postToGoogleSheet(URL1_TAB_CHEATING, logPayload, 15000).catch(e=>{});

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

function reapplySavedAnswers() { 
    Object.keys(userAnswersState).forEach(key => { 
        const val = userAnswersState[key]; 
        if (key.includes('_')) { 
            const r = document.querySelector(`input[name="${key}"][value="${val}"]`); 
            if (r) r.checked = true; 
        } else if (document.getElementById(`${key}-input`)) { 
            document.getElementById(`${key}-input`).value = val; 
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
    return `${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`; 
}

function startCountdownTimer() { 
    const timerVal = document.getElementById("nav-timer-val"); 
    const timerBox = document.getElementById("nav-timer-box"); 
    if (timerInterval) clearInterval(timerInterval); 
    
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
    document.getElementById("modal-actions-container").style.display = "block";
    document.getElementById("submit-confirm-modal").style.display = "flex"; 
}

function closeSubmitConfirmModal() { 
    document.getElementById("submit-confirm-modal").style.display = "none"; 
}

async function executeSubmitExam(isForceSubmit = false) { 
    if (isSubmitted) return; 
    
    const confirmModal = document.getElementById("submit-confirm-modal");
    const normalView = document.getElementById("modal-normal-submit-view");
    const progressView = document.getElementById("modal-submitting-progress-view");
    const actionsBox = document.getElementById("modal-actions-container");
    const progressText = document.getElementById("submit-progress-text");

    if (confirmModal) confirmModal.style.display = "flex";
    if (normalView) normalView.style.display = "none";
    if (progressView) progressView.style.display = "block";
    if (actionsBox) actionsBox.style.display = "none";
    if (progressText) progressText.innerText = "⏳ Đang kết nối máy chủ nộp bài...";

    if (timerInterval) clearInterval(timerInterval); 
    if (timeWatcherInterval) clearInterval(timeWatcherInterval);

    const sId = document.getElementById("student-id").value.trim(); 
    const sName = document.getElementById("student-name").value.trim(); 
    const sClass = document.getElementById("student-class").value.trim(); 
    const currentCat = getExamCategory();
    const urlParams = new URLSearchParams(window.location.search);
    const currentQuizId = urlParams.get('id') || "";

    const isClassAcc = !!findStudentFromDatabase(sId, currentCat);
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

    examData.questions.forEach(q => { 
        maxTotalScore += 1.0; 
        if (q.type === "multiple_choice") { 
            const userVal = userAnswersState[`q${q.id}`] || "Chưa chọn"; 
            const correctVal = ANSWER_KEY[`q${q.id}`]; 
            if (userVal === correctVal) { 
                correctCount++; 
                totalRawScore += 1.0; 
                dataDetails.push(`${q.id}-${userVal} [ĐÚNG]`); 
            } else { 
                wrongCount++; 
                dataDetails.push(`${q.id}-${userVal} [SAI: ${correctVal}]`); 
            } 
        } else if (q.type === "true_false") { 
            let cSt = 0; 
            q.statements.forEach(st => { 
                const sub = `q${q.id}_${st.id}`; 
                const uVal = userAnswersState[sub] || "Chưa chọn"; 
                const cVal = ANSWER_KEY[sub]; 
                if (uVal === cVal) { 
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
            const uVal = (userAnswersState[`q${q.id}`] || "").replace(',', '.'); 
            const cVal = String(ANSWER_KEY[`q${q.id}`] || "").replace(',', '.'); 
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

    const score10Scale = Math.round(((totalRawScore / maxTotalScore) * 10) * 10) / 10; 
    dataDetails.push(`Tab Switch: ${tabSwitchCount}`); 

    const payload = { 
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
        score10: score10Scale, 
        tabSwitchCount: `${tabSwitchCount} lần`, 
        dataString: dataDetails.join(" | "), 
        calcMetrics: { correctCount, wrongCount, spentMins, completionTimeStr, score10Scale }, 
        timestamp: new Date().toLocaleString("vi-VN"), 
        createdAt: Date.now() 
    }; 

    safeLocal.setItem("pending_exam_submission", JSON.stringify(payload)); 
    safeLocal.setItem(`submitted_backup_${getExamCode()}_${sId}`, JSON.stringify(payload));
    pendingSubmissionPayload = payload; 

    if (progressText) progressText.innerText = "🚀 Đang gửi bài thi lên máy chủ...";

    const examCode = getExamCode();
    let firebaseConfirmed = false;

    const sendToFirebaseEndpoint = async (codeKey) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${FIREBASE_DB_URL}/exams/${codeKey}/submissions.json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
            const resJson = await res.json();
            if (resJson && resJson.name) return true;
        }
        return false;
    };

    try {
        firebaseConfirmed = await sendToFirebaseEndpoint(examCode);
    } catch(err) {
        console.warn("Lỗi gửi Firebase lần 1, thử lại ngay:", err);
        try {
            firebaseConfirmed = await sendToFirebaseEndpoint(examCode);
        } catch(e2) {}
    }

    postToGoogleSheet(URL2_EXAM_RESULT, payload, 15000).catch(e => null);
    clearPresence(sId);

    if (firebaseConfirmed) {
        safeLocal.removeItem("pending_exam_submission");
        if (progressText) progressText.innerText = "✅ Máy chủ đã xác nhận lưu bài thành công!";
    } else {
        if (progressText) progressText.innerText = "⚠️ Đã lưu trữ bài an toàn vào hàng đợi máy chủ.";
        document.getElementById("pending-resend-bar").style.display = "block";
    }

    await new Promise(r => setTimeout(r, 400));

    isSubmitted = true; 

    safeLocal.removeItem(getStorageKey()); 
    safeLocal.removeItem(`shuffled_exam_${getExamCode()}`); 
    safeLocal.removeItem("saved_student_sbd");
    safeLocal.removeItem("saved_student_name");
    safeLocal.removeItem("saved_student_class");
    safeLocal.removeItem("current_exam_student");
    safeLocal.setItem("last_submission_cleared", "true");
    
    if (confirmModal) confirmModal.style.display = "none"; 
    renderResultSummaryScreen(correctCount, wrongCount, spentMins, completionTimeStr, score10Scale); 
}

function renderResultSummaryScreen(correct, wrong, spentMins, spentTimeStr, finalScore) { 
    document.getElementById("top-navbar").style.display = "none"; 
    document.getElementById("quiz-content").style.display = "none"; 
    const resView = document.getElementById("result-view-container"); 
    resView.style.display = "block"; 
    document.getElementById("res-score-overview").innerText = `Đúng ${correct}/${totalQuestionsCount} câu (${finalScore} điểm)`; 
    document.getElementById("res-stat-correct").innerText = correct; 
    document.getElementById("res-stat-wrong").innerText = wrong; 
    document.getElementById("res-stat-time").innerText = spentMins; 
    document.getElementById("res-user-name").innerText = document.getElementById("student-name").value.trim(); 
    document.getElementById("res-user-class").innerText = document.getElementById("student-class").value.trim(); 
    document.getElementById("res-user-id").innerText = document.getElementById("student-id").value.trim(); 
    document.getElementById("res-spent-time").innerText = spentTimeStr; 
    
    let revHTML = ""; 
    let idx = 1; 
    
    function buildRevImgHtml(imgUrl) {
        if (!imgUrl) return "";
        return `<div class="quiz-img-container"><img src="${imgUrl}" class="quiz-img" referrerpolicy="no-referrer" loading="lazy" alt="Hình minh họa"></div>`;
    }

    examData.questions.forEach(q => { 
        const imgUrl = (q.imageKey && examData.images[q.imageKey]) ? examData.images[q.imageKey] : (q.imageUrl || ""); 
        const imgTag = buildRevImgHtml(imgUrl); 
        const explainText = q.explanation ? `<div class="explanation-box">💡 <b>Lời giải:</b> ${q.explanation}</div>` : ""; 
        
        if (q.type === "multiple_choice") { 
            const letters = ["A", "B", "C", "D"]; 
            const uAns = userAnswersState[`q${q.id}`]; 
            const cAns = ANSWER_KEY[`q${q.id}`]; 
            revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge" style="background:${uAns===cAns?'#22c55e':'#ef4444'}">${idx}</div><div class="q-content-text">${q.question}</div></div>${imgTag} <div class="options-list grid-2">${q.options.map((opt, oIdx) => { const L = letters[oIdx]; let cls = ""; let icon = ""; if (L === cAns) { cls = "is-correct"; icon = " ✓"; } else if (L === uAns && uAns !== cAns) { cls = "is-wrong"; icon = " ✗"; } return `<div class="opt-label ${cls}"><span class="opt-circle">${L}</span><span class="opt-text">${opt} <b>${icon}</b></span></div>`; }).join('')}</div>${explainText}</div>`; 
        } else if (q.type === "true_false") { 
            let rows = ""; 
            q.statements.forEach(st => { 
                const sub = `q${q.id}_${st.id}`; 
                const uVal = userAnswersState[sub] || "Chưa chọn"; 
                const cVal = ANSWER_KEY[sub]; 
                const ok = (uVal === cVal); 
                rows += `<tr><td><b>${st.id})</b> ${st.statement}</td><td align="center">${uVal==="Đúng"?(ok?"🟢 Đúng":"🔴 Đúng (Sai)"):""}</td><td align="center">${uVal==="Sai"?(ok?"🟢 Sai":"🔴 Sai (Sai)"):""}</td><td align="center"><b>${cVal}</b></td></tr>`; 
            }); 
            revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${q.question}</div></div>${imgTag} <div class="tf-table-box"><table class="tf-table"><thead><tr><th>Mệnh đề</th><th>Bạn chọn</th><th>Đ.Á Đúng</th></tr></thead><tbody>${rows}</tbody></table></div>${explainText}</div>`; 
        } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") { 
            const uVal = userAnswersState[`q${q.id}`] || "(Để trống)"; 
            const cVal = ANSWER_KEY[`q${q.id}`]; 
            revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${q.question}</div></div>${imgTag} <div style="margin-top:10px; font-size:0.95rem;"><div>Tr.lời của bạn: <b>${uVal}</b></div><div style="color:#15803d; font-weight:700; margin-top:6px;">Đáp án đúng / tham khảo: ${cVal}</div></div>${explainText}</div>`; 
        } 
        idx++; 
    }); 
    document.getElementById("review-container-body").innerHTML = revHTML; 
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise().catch(() => {});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}
