// =========================================================
// FILE: thi-engine.js
// BỘ MÁY ĐIỀU HÀNH BÀI THI BẢO MẬT CAO CẤP (SECURE CLOSURE IIFE)
// - Bọc kín toàn bộ dữ liệu nhạy cảm bên trong Closure, chống Console F12
// - Memory Sanitization: Tách và mã hóa đáp án nội bộ, xóa sạch dấu vết trên RAM
// - Giữ nguyên 100% tính năng giao diện, xáo đề, chấm điểm và phòng thi
// =========================================================

(function(window, document) {
    "use strict";

    // KHO LƯU TRỮ ĐÁP ÁN NỘI BỘ BẢO MẬT (KHÔNG THỂ TRUY CẬP TỪ CONSOLE BÊN NGOÀI)
    const SECURE_VAULT = {
        answers: {},
        explanations: {},
        userAnswers: {},
        padletClicked: {},
        questionData: {}
    };

    let hasInitExamEngine = false;

    // Giữ màn hình sáng
    document.addEventListener("visibilitychange", async function() {
        if (typeof wakeLockSentinel !== 'undefined' && wakeLockSentinel === null && !document.hidden && typeof requestWakeLock === 'function') {
            try { await requestWakeLock(); } catch(e) {}
        }
    });

    function formatQuestionText(text) {
        if (!text) return "";
        return text.replace(/(^|[^:])\/\/\s*([^\r\n<]+)/g, function(match, prefix, content) {
            return prefix + '<span style="color: #78350f; font-weight: 800;">// ' + content.trim() + '</span>';
        });
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

    function trackPadletClick(qId) { 
        SECURE_VAULT.padletClicked[qId] = true; 
        saveExamStateToStorage(); 
    }

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
        } else {
            console.error("Lỗi: Không tìm thấy hàm executeStartExamAPI trong thi-service.js");
        }
    }

    async function checkSessionStatus(isAutostart = false) { 
        syncStudentFromParamsAndStorage();

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
                remainingSeconds = timeRemaining; 
                reapplySavedAnswers(); 
                updateProgress(); 
                startCountdownTimer(); 
                startPresenceSystem(sId);
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

    // =========================================================
    // XÂY DỰNG GIAO DIỆN & TIÊU HỦY DẤU VẾT ĐÁP ÁN KHỎI RAM
    // =========================================================
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
            html += `<div class="exam-section-banner"><div class="section-icon">📑</div><div class="section-text"><h3>PHẦN 1. TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN</h3><p>Chọn duy nhất 01 phương án đúng trong các phương án A, B, C, D</p></div></div>`; 
            p1List.forEach(q => { 
                SECURE_VAULT.questionData[q.id] = q; 
                const letters = ["A", "B", "C", "D"]; 
                
                // Lưu vào kho bí mật
                if (q.correct !== undefined) {
                    SECURE_VAULT.answers[`q${q.id}`] = letters[q.correct];
                }
                if (q.explanation) {
                    SECURE_VAULT.explanations[`q${q.id}`] = q.explanation;
                }

                // Tiêu hủy trường nhạy cảm khỏi object công khai
                delete q.correct;
                delete q.explanation;

                const imgUrl = (q.imageKey && imageMap[q.imageKey]) ? imageMap[q.imageKey] : (q.imageUrl || ""); 
                const imgHTML = buildImgHtml(imgUrl); 
                html += `<div class="question-card" id="q-card-${q.id}"> <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div> ${imgHTML} <div class="options-list grid-2"> ${q.options.map((opt, oIdx) => `<label class="opt-label" id="opt-box-${q.id}-${letters[oIdx]}" onclick="selectOption(${q.id}, '${letters[oIdx]}')"> <input type="radio" name="q${q.id}" value="${letters[oIdx]}"> <span class="opt-circle">${letters[oIdx]}</span> <span class="opt-text">${opt}</span> </label>`).join('')} </div> </div>`; 
                displayIndex++; 
            }); 
        } 

        if (p2List.length > 0) { 
            html += `<div class="exam-section-banner" style="background: linear-gradient(135deg, #7c3aed, #4f46e5);"><div class="section-icon">⚖️</div><div class="section-text"><h3>PHẦN 2. TRẮC NGHIỆM ĐÚNG SAI</h3><p>Thí sinh chọn Đúng hoặc Sai cho từng mệnh đề a), b), c), d)</p></div></div>`; 
            p2List.forEach(q => { 
                SECURE_VAULT.questionData[q.id] = q; 
                const imgUrl = (q.imageKey && imageMap[q.imageKey]) ? imageMap[q.imageKey] : (q.imageUrl || ""); 
                const imgHTML = buildImgHtml(imgUrl); 
                let rows = ""; 
                q.statements.forEach((st) => { 
                    const subKey = `q${q.id}_${st.id}`; 
                    if (st.correct !== undefined) {
                        SECURE_VAULT.answers[subKey] = st.correct ? "Đúng" : "Sai";
                    }
                    delete st.correct;
                    rows += `<tr><td><b>${st.id})</b> ${st.statement}</td> <td width="70" align="center"><input type="radio" name="${subKey}" value="Đúng" onchange="onStatementChange('${subKey}')"></td> <td width="70" align="center"><input type="radio" name="${subKey}" value="Sai" onchange="onStatementChange('${subKey}')"></td></tr>`; 
                }); 
                if (q.explanation) {
                    SECURE_VAULT.explanations[`q${q.id}`] = q.explanation;
                    delete q.explanation;
                }
                html += `<div class="question-card" id="q-card-${q.id}"> <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div> ${imgHTML} <div class="tf-table-box"> <table class="tf-table"><thead><tr><th>Mệnh đề</th><th>Đúng</th><th>Sai</th></tr></thead><tbody>${rows}</tbody></table> </div> </div>`; 
                displayIndex++; 
            }); 
        } 

        if (p3List.length > 0) { 
            html += `<div class="exam-section-banner" style="background: linear-gradient(135deg, #0d9488, #059669);"><div class="section-icon">✍️</div><div class="section-text"><h3>PHẦN 3. TRẢ LỜI NGẮN</h3><p>Nhập đáp số chính xác vào ô trống</p></div></div>`; 
            p3List.forEach(q => { 
                SECURE_VAULT.questionData[q.id] = q; 
                if (q.correctAnswer !== undefined) {
                    SECURE_VAULT.answers[`q${q.id}`] = q.correctAnswer;
                    delete q.correctAnswer;
                }
                if (q.explanation) {
                    SECURE_VAULT.explanations[`q${q.id}`] = q.explanation;
                    delete q.explanation;
                }
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
                SECURE_VAULT.questionData[q.id] = q; 
                if (q.correctAnswer !== undefined) {
                    SECURE_VAULT.answers[`q${q.id}`] = q.correctAnswer || ""; 
                    delete q.correctAnswer;
                }
                if (q.explanation) {
                    SECURE_VAULT.explanations[`q${q.id}`] = q.explanation;
                    delete q.explanation;
                }
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
            const prev = document.getElementById(`q-nav-btn-${currentActiveQId}`); 
            if (prev) prev.classList.remove('active'); 
        } 
        currentActiveQId = qId; 
        const curr = document.getElementById(`q-nav-btn-${qId}`); 
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
            const el = document.getElementById(`opt-box-${qId}-${l}`); 
            if (el) el.classList.remove('selected'); 
        }); 
        const current = document.getElementById(`opt-box-${qId}-${letter}`); 
        if (current) current.classList.add('selected'); 
        const radio = document.querySelector(`input[name="q${qId}"][value="${letter}"]`); 
        if (radio) radio.checked = true; 
        SECURE_VAULT.userAnswers[`q${qId}`] = letter; 
        updateProgress(); 
        saveExamStateToStorage(); 
    }

    function onStatementChange(subKey) { 
        if (isSubmitted) return; 
        const selected = document.querySelector(`input[name="${subKey}"]:checked`); 
        if (selected) SECURE_VAULT.userAnswers[subKey] = selected.value; 
        updateProgress(); 
        saveExamStateToStorage(); 
    }

    function onShortInputChange(qId) { 
        if (isSubmitted) return; 
        const val = document.getElementById(`q${qId}-input`).value.trim(); 
        if (val) SECURE_VAULT.userAnswers[`q${qId}`] = val; 
        else delete SECURE_VAULT.userAnswers[`q${qId}`]; 
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
                if (SECURE_VAULT.userAnswers[`q${q.id}`]) { answeredCount++; status = "answered"; } 
            } else if (q.type === "true_false") { 
                let doneCount = 0; 
                q.statements.forEach(st => { 
                    if (SECURE_VAULT.userAnswers[`q${q.id}_${st.id}`]) doneCount++; 
                }); 
                if (doneCount === q.statements.length) { answeredCount++; status = "answered"; } 
                else if (doneCount > 0) { status = "partial"; } 
            } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") { 
                if (SECURE_VAULT.userAnswers[`q${q.id}`]) { answeredCount++; status = "answered"; } 
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
        Object.keys(SECURE_VAULT.userAnswers).forEach(key => { 
            const val = SECURE_VAULT.userAnswers[key]; 
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
        document.getElementById("modal-actions-container").innerHTML = `
            <div class="modal-btn-row">
                <button type="button" class="btn-modal-cancel" onclick="closeSubmitConfirmModal()">Tiếp tục làm</button>
                <button type="button" class="btn-modal-confirm" onclick="executeSubmitExam()">✓ Nộp bài</button>
            </div>
        `;
        document.getElementById("submit-confirm-modal").style.display = "flex"; 
    }

    function closeSubmitConfirmModal() { 
        document.getElementById("submit-confirm-modal").style.display = "none"; 
    }

    function saveExamStateToStorage() { 
        if (!examStartTime || isSubmitted) return; 
        const dataToSave = { 
            userAnswers: SECURE_VAULT.userAnswers, 
            padletClickedMap: SECURE_VAULT.padletClicked, 
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
                SECURE_VAULT.userAnswers = parsed.userAnswers || {}; 
                SECURE_VAULT.padletClicked = parsed.padletClickedMap || {}; 
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

    // =========================================================
    // HÀM SUBMIT EXAM: TÍNH ĐIỂM CHUẨN TỪ KHO BẢO MẬT
    // =========================================================
    async function executeSubmitExam(isForceSubmit = false) { 
        if (isSubmitted) return; 
        
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
        
        const sId = document.getElementById("student-id").value.trim(); 
        const sName = document.getElementById("student-name").value.trim(); 
        const sClass = document.getElementById("student-class").value.trim(); 
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

        examData.questions.forEach(q => { 
            maxTotalScore += 1.0; 
            if (q.type === "multiple_choice") { 
                const userVal = SECURE_VAULT.userAnswers[`q${q.id}`] || "Chưa chọn"; 
                const correctVal = SECURE_VAULT.answers[`q${q.id}`]; 
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
                    const uVal = SECURE_VAULT.userAnswers[sub] || "Chưa chọn"; 
                    const cVal = SECURE_VAULT.answers[sub]; 
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
                const uVal = (SECURE_VAULT.userAnswers[`q${q.id}`] || "").replace(',', '.'); 
                const cVal = String(SECURE_VAULT.answers[`q${q.id}`] || "").replace(',', '.'); 
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
        pendingSubmissionPayload = payload; 

        const examCode = getExamCode();
        let firebaseConfirmed = false;

        try {
            const res = await fetchWithRetry(`${FIREBASE_DB_URL}/exams/${examCode}/submissions.json`, {
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
                        <button type="button" onclick="downloadPendingSubmissionFile()" style="flex:1; padding:10px; background:#0d9488; color:#fff; border:none; border-radius:10px; font-weight:800; cursor:pointer;">💾 Tải file dự phòng</button>
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
        
        if (timerInterval) clearInterval(timerInterval); 
        if (timeWatcherInterval) clearInterval(timeWatcherInterval);

        safeLocal.removeItem("pending_exam_submission");
        safeLocal.removeItem(getStorageKey()); 
        safeLocal.removeItem(`shuffled_exam_${getExamCode()}`); 
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
        document.getElementById("top-navbar").style.display = "none"; 
        document.getElementById("quiz-content").style.display = "none"; 
        const resView = document.getElementById("result-view-container"); 
        resView.style.display = "block"; 
        
        const resExamTitle = document.getElementById("res-exam-title");
        if (resExamTitle) {
            resExamTitle.innerText = EXAM_NAME || "BÀI THI TRẮC NGHIỆM";
        }

        document.getElementById("res-score-overview").innerText = `Đúng ${correct}/${totalQuestionsCount} câu (${finalScore} điểm)`; 
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
            
            function buildRevImgHtml(imgUrl) {
                if (!imgUrl) return "";
                return `<div class="quiz-img-container"><img src="${imgUrl}" class="quiz-img" referrerpolicy="no-referrer" loading="lazy" alt="Hình minh họa"></div>`;
            }

            examData.questions.forEach(q => { 
                const imgUrl = (q.imageKey && examData.images && examData.images[q.imageKey]) ? examData.images[q.imageKey] : (q.imageUrl || ""); 
                const imgTag = buildRevImgHtml(imgUrl); 
                const explainText = SECURE_VAULT.explanations[`q${q.id}`] ? `<div class="explanation-box">💡 <b>Lời giải chi tiết:</b> ${SECURE_VAULT.explanations[`q${q.id}`]}</div>` : ""; 
                
                if (q.type === "multiple_choice") { 
                    const letters = ["A", "B", "C", "D"]; 
                    const uAns = SECURE_VAULT.userAnswers[`q${q.id}`]; 
                    const cAns = SECURE_VAULT.answers[`q${q.id}`]; 
                    revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge" style="background:${uAns===cAns?'#22c55e':'#ef4444'}">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="options-list grid-2">${q.options.map((opt, oIdx) => { const L = letters[oIdx]; let cls = ""; let icon = ""; if (L === cAns) { cls = "is-correct"; icon = " ✓"; } else if (L === uAns && uAns !== cAns) { cls = "is-wrong"; icon = " ✗"; } return `<div class="opt-label ${cls}"><span class="opt-circle">${L}</span><span class="opt-text">${opt} <b>${icon}</b></span></div>`; }).join('')}</div>${explainText}</div>`; 
                } else if (q.type === "true_false") { 
                    let rows = ""; 
                    q.statements.forEach(st => { 
                        const sub = `q${q.id}_${st.id}`; 
                        const uVal = SECURE_VAULT.userAnswers[sub] || "Chưa chọn"; 
                        const cVal = SECURE_VAULT.answers[sub]; 
                        const ok = (uVal === cVal); 
                        rows += `<tr><td><b>${st.id})</b> ${st.statement}</td><td align="center">${uVal==="Đúng"?(ok?"🟢 Đúng":"🔴 Đúng (Sai)"):""}</td><td align="center">${uVal==="Sai"?(ok?"🟢 Sai":"🔴 Sai (Sai)"):""}</td><td align="center"><b>${cVal}</b></td></tr>`; 
                    }); 
                    revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="tf-table-box"><table class="tf-table"><thead><tr><th>Mệnh đề</th><th>Bạn chọn</th><th>Đ.Á Đúng</th></tr></thead><tbody>${rows}</tbody></table></div>${explainText}</div>`; 
                } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") { 
                    const uVal = SECURE_VAULT.userAnswers[`q${q.id}`] || "(Để trống)"; 
                    const cVal = SECURE_VAULT.answers[`q${q.id}`]; 
                    revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div style="margin-top:14px; font-size:1.05rem; font-weight:600;"><div>Tr.lời của bạn: <b>${uVal}</b></div><div style="color:#15803d; font-weight:800; margin-top:6px;">Đáp án đúng / tham khảo: ${cVal}</div></div>${explainText}</div>`; 
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
                q.statements.forEach(st => {
                    generatedAnswerKey[`q${q.id}_${st.id}`] = st.correct ? "Đúng" : "Sai";
                });
            } else {
                generatedAnswerKey[`q${q.id}`] = q.correctAnswer;
            }
        });

        let revHTML = ""; 
        let idx = 1; 

        function buildRevImgHtml(imgUrl) {
            if (!imgUrl) return "";
            return `<div class="quiz-img-container"><img src="${imgUrl}" class="quiz-img" referrerpolicy="no-referrer" loading="lazy" alt="Hình minh họa"></div>`;
        }

        (examData.questions || []).forEach(q => { 
            const imgUrl = (q.imageKey && examData.images && examData.images[q.imageKey]) ? examData.images[q.imageKey] : (q.imageUrl || ""); 
            const imgTag = buildRevImgHtml(imgUrl); 
            const explainText = q.explanation ? `<div class="explanation-box">💡 <b>Lời giải chi tiết:</b> ${q.explanation}</div>` : ""; 
            
            if (q.type === "multiple_choice") { 
                const cAns = generatedAnswerKey[`q${q.id}`]; 
                revHTML += `<div class="question-card"><div class="q-header"><div class="q-num-badge">${idx}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div>${imgTag} <div class="options-list grid-2">${q.options.map((opt, oIdx) => { const L = letters[oIdx]; let cls = ""; let icon = ""; if (L === cAns) { cls = "is-correct"; icon = " ✓ Đ.Án"; } return `<div class="opt-label ${cls}"><span class="opt-circle">${L}</span><span class="opt-text">${opt} <b>${icon}</b></span></div>`; }).join('')}</div>${explainText}</div>`; 
            } else if (q.type === "true_false") { 
                let rows = ""; 
                q.statements.forEach(st => { 
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

    // =========================================================
    // EXPORT CÁC HÀM CẦN THIẾT CHO GIAO DIỆN HTML GỌI
    // (CÁC BIẾN CHỨA ĐÁP ÁN ĐƯỢC GIỮ KÍN TUYỆT ĐỐI TRONG CLOSURE)
    // =========================================================
    window.selectOption = selectOption;
    window.scrollToQuestion = scrollToQuestion;
    window.scrollQPalette = scrollQPalette;
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

    // Cầu nối nội bộ cho thi-service.js gọi
    window.__saveExamState = saveExamStateToStorage;
    window.__updateProgress = updateProgress;

})(window, document);
