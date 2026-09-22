/**
 * MODULE 5: ĐĂNG NHẬP THI HỌC SINH (THEO LỚP & TỰ DO)
 */
window.STUDENT_AUTH = {
    openStudentLoginModal(targetUrl, examTitle, categoryId) {
        APP_STATE.activeStudentLogin = { targetUrl, examTitle, categoryId, currentMode: "class" };
        document.getElementById("st-modal-exam-name").innerText = examTitle || "Bài kiểm tra trực tuyến";
        document.getElementById("st-username-input").value = "";
        document.getElementById("st-password-input").value = "";
        document.getElementById("st-free-name-input").value = "";
        document.getElementById("st-free-class-input").value = "";
        document.getElementById("st-free-sbd-input").value = "";
        
        const errBox = document.getElementById("st-login-error");
        errBox.style.display = "none";
        errBox.innerText = "";
        
        this.switchStudentLoginMode('class');
        document.getElementById("student-login-modal").style.display = "flex";
    },

    closeStudentLoginModal() {
        document.getElementById("student-login-modal").style.display = "none";
    },

    switchStudentLoginMode(mode) {
        APP_STATE.activeStudentLogin.currentMode = mode;
        const tabClass = document.getElementById("tab-st-class");
        const tabFree = document.getElementById("tab-st-free");
        const boxClass = document.getElementById("st-login-mode-class");
        const boxFree = document.getElementById("st-login-mode-free");
        const errBox = document.getElementById("st-login-error");
        const iconEl = document.getElementById("st-modal-icon");

        errBox.style.display = "none";

        if (mode === 'free') {
            tabClass.classList.remove("active");
            tabFree.classList.add("active");
            boxClass.style.display = "none";
            boxFree.style.display = "block";
            iconEl.innerText = "🎯";
            document.getElementById("st-modal-main-title").innerText = "Thí Sinh Tự Do Vào Thi";
            setTimeout(() => { document.getElementById("st-free-name-input").focus(); }, 100);
        } else {
            tabFree.classList.remove("active");
            tabClass.classList.add("active");
            boxFree.style.display = "none";
            boxClass.style.display = "block";
            iconEl.innerText = "🔐";
            document.getElementById("st-modal-main-title").innerText = "Đăng Nhập Làm Bài Thi";
            setTimeout(() => { document.getElementById("st-username-input").focus(); }, 100);
        }
    },

    toggleStudentPassVisibility() {
        const input = document.getElementById("st-password-input");
        const btn = document.getElementById("st-eye-btn");
        if (input.type === "password") {
            input.type = "text";
            btn.innerText = "🙈";
        } else {
            input.type = "password";
            btn.innerText = "👁️";
        }
    },

    submitStudentLogin() {
        const errBox = document.getElementById("st-login-error");
        const btn = document.getElementById("st-submit-btn");

        if (APP_STATE.activeStudentLogin.currentMode === 'free') {
            const freeName = document.getElementById("st-free-name-input").value.trim();
            const freeClass = document.getElementById("st-free-class-input").value.trim();
            const freeSbd = document.getElementById("st-free-sbd-input").value.trim();

            if (!freeName || !freeClass || !freeSbd) {
                errBox.innerText = "⚠️ Vui lòng nhập đầy đủ Họ tên, Lớp và Số báo danh!";
                errBox.style.display = "block";
                return;
            }

            const freePayload = { sbd: freeSbd, name: freeName, className: freeClass, username: "free_" + freeSbd, isFreeStudent: true };
            try {
                localStorage.setItem("current_exam_student", JSON.stringify(freePayload));
                sessionStorage.setItem("current_exam_student", JSON.stringify(freePayload));
                localStorage.setItem("saved_student_sbd", freeSbd);
                localStorage.setItem("saved_student_name", freeName);
                localStorage.setItem("saved_student_class", freeClass);
            } catch(e) {}

            let targetUrl = APP_STATE.activeStudentLogin.targetUrl;
            let joinChar = targetUrl.includes('?') ? '&' : '?';
            const finalRedirectUrl = `${targetUrl}${joinChar}sbd=${encodeURIComponent(freeSbd)}&name=${encodeURIComponent(freeName)}&class=${encodeURIComponent(freeClass)}&autostart=1`;

            btn.innerHTML = "🎉 Thí sinh tự do vào thi...";
            btn.style.background = "#10b981";

            setTimeout(() => {
                this.closeStudentLoginModal();
                window.open(finalRedirectUrl, "_blank");
                btn.innerHTML = "Vào thi 🚀";
                btn.style.background = "";
            }, 500);
            return;
        }

        const uVal = document.getElementById("st-username-input").value.trim();
        const pVal = document.getElementById("st-password-input").value.trim();

        if (!uVal || !pVal) {
            errBox.innerText = "⚠️ Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!";
            errBox.style.display = "block";
            return;
        }

        const catId = APP_STATE.activeStudentLogin.categoryId;
        let accounts = (window.STUDENT_ACCOUNTS && window.STUDENT_ACCOUNTS[catId]) ? window.STUDENT_ACCOUNTS[catId] : [];

        if (!accounts || accounts.length === 0) {
            errBox.innerText = `⚠️ Chưa có dữ liệu tài khoản lớp (${catId})!`;
            errBox.style.display = "block";
            return;
        }

        const matched = accounts.find(acc => 
            ((acc.username && acc.username.trim().toLowerCase() === uVal.toLowerCase()) || 
             (acc.sbd && acc.sbd.trim().toLowerCase() === uVal.toLowerCase()) || 
             (acc.name && acc.name.trim().toLowerCase() === uVal.toLowerCase())) &&
            (String(acc.pass).trim() === pVal)
        );

        if (matched) {
            errBox.style.display = "none";
            const studentPayload = { sbd: matched.sbd, name: matched.name, className: matched.className, username: matched.username, stt: matched.stt };
            
            try {
                localStorage.setItem("current_exam_student", JSON.stringify(studentPayload));
                sessionStorage.setItem("current_exam_student", JSON.stringify(studentPayload));
                localStorage.setItem("saved_student_sbd", matched.sbd);
                localStorage.setItem("saved_student_name", matched.name);
                localStorage.setItem("saved_student_class", matched.className);
            } catch(e) {}

            let targetUrl = APP_STATE.activeStudentLogin.targetUrl;
            let joinChar = targetUrl.includes('?') ? '&' : '?';
            const finalRedirectUrl = `${targetUrl}${joinChar}sbd=${encodeURIComponent(matched.sbd)}&name=${encodeURIComponent(matched.name)}&class=${encodeURIComponent(matched.className)}&autostart=1`;

            btn.innerHTML = "🎉 Thành công! Đang vào...";
            btn.style.background = "#10b981";

            setTimeout(() => {
                this.closeStudentLoginModal();
                window.open(finalRedirectUrl, "_blank");
                btn.innerHTML = "Vào thi 🚀";
                btn.style.background = "";
            }, 600);
        } else {
            errBox.innerText = "❌ Sai Tên đăng nhập hoặc Mật khẩu! Vui lòng thử lại.";
            errBox.style.display = "block";
        }
    }
};

function openStudentLoginModal(url, title, catId) { STUDENT_AUTH.openStudentLoginModal(url, title, catId); }
function closeStudentLoginModal() { STUDENT_AUTH.closeStudentLoginModal(); }
function switchStudentLoginMode(m) { STUDENT_AUTH.switchStudentLoginMode(m); }
function toggleStudentPassVisibility() { STUDENT_AUTH.toggleStudentPassVisibility(); }
function submitStudentLogin() { STUDENT_AUTH.submitStudentLogin(); }
```