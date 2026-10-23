// =========================================================
// FILE: portal-auth.js
// QUẢN TRỊ VIÊN XÁC THỰC & HỌC SINH ĐĂNG NHẬP THI
// =========================================================

function checkAdminSessionValidity() {
    try {
        const logged = safeLocal.getItem("adminLoggedInSession");
        const expiresAt = safeLocal.getItem("admin_expires_at");
        if (logged === "true" && expiresAt) {
            if (Date.now() < parseInt(expiresAt, 10)) {
                isAdminLoggedIn = true;
                return true;
            } else {
                logoutAdmin();
            }
        }
    } catch(e) {}
    isAdminLoggedIn = false;
    return false;
}

function parseExpiryDurationMs(val) {
    switch (val) {
        case '1h': return 1 * 60 * 60 * 1000;
        case '2h': return 2 * 60 * 60 * 1000;
        case '4h': return 4 * 60 * 60 * 1000;
        case '8h': return 8 * 60 * 60 * 1000;
        case '1d': return 24 * 60 * 60 * 1000;
        case '3d': return 3 * 24 * 60 * 60 * 1000;
        case '7d': return 7 * 24 * 60 * 60 * 1000;
        case '30d': return 30 * 24 * 60 * 60 * 1000;
        default: return 24 * 60 * 60 * 1000;
    }
}

async function checkAdminPassword() {
    const inputEl = document.getElementById("admin-pass-input");
    const rawPass = (inputEl ? inputEl.value : "").trim();

    if (!rawPass) {
        alert("⚠️ Vui lòng nhập mật khẩu quản trị!");
        return;
    }

    const inputHash = await sha256Hash(rawPass);
    let isMatched = (typeof ADMIN_PASSWORD_HASH === "string" && ADMIN_PASSWORD_HASH.length === 64 && inputHash.toLowerCase() === ADMIN_PASSWORD_HASH.toLowerCase());

    if (isMatched) {
        isAdminLoggedIn = true;
        const durationVal = document.getElementById("admin-expiry-select") ? document.getElementById("admin-expiry-select").value : "1d";
        const durationMs = parseExpiryDurationMs(durationVal);
        const expiresAt = Date.now() + durationMs;

        safeLocal.setItem("adminLoggedInSession", "true");
        safeLocal.setItem("admin_expires_at", String(expiresAt));
        safeLocal.setItem("admin_duration_choice", durationVal);
        safeSession.setItem("adminLoggedInSession", "true");

        document.getElementById("auth-container").classList.remove("show");
        document.getElementById("admin-popover-panel").classList.add("show");
        document.getElementById("gear-btn").classList.add("active-gear");
        inputEl.value = "";
        refreshAllViews();
    } else {
        alert("❌ Sai mật khẩu quản trị viên!");
    }
}

function logoutAdmin(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    isAdminLoggedIn = false;
    safeLocal.removeItem("adminLoggedInSession");
    safeLocal.removeItem("admin_expires_at");
    safeSession.removeItem("adminLoggedInSession");
    closeAdminPanel();
    const gear = document.getElementById("gear-btn");
    if (gear) gear.classList.remove("active-gear");
    refreshAllViews();
    alert("🔒 Đã khóa quyền quản trị thành công!");
}

function closeAdminPanel() {
    const panel = document.getElementById("admin-popover-panel");
    const gear = document.getElementById("gear-btn");
    if (panel) panel.classList.remove("show");
    if (gear && !isAdminLoggedIn) gear.classList.remove("active-gear");
}

function toggleAdminPanel(e) {
    if (e) e.stopPropagation();
    const authContainer = document.getElementById("auth-container");
    const panel = document.getElementById("admin-popover-panel");
    const gear = document.getElementById("gear-btn");

    if (checkAdminSessionValidity()) {
        if (panel.classList.contains("show")) { closeAdminPanel(); } 
        else { panel.classList.add("show"); gear.classList.add("active-gear"); }
    } else {
        authContainer.classList.toggle("show");
        if (authContainer.classList.contains("show")) document.getElementById("admin-pass-input").focus();
    }
}

function handleEnter(e) { if (e.key === 'Enter') checkAdminPassword(); }

function togglePasswordVisibility() {
    const input = document.getElementById("admin-pass-input");
    const btn = document.getElementById("eye-toggle-btn");
    if (input.type === "password") {
        input.type = "text";
        btn.innerText = "🙈"; btn.title = "Ẩn";
    } else {
        input.type = "password";
        btn.innerText = "👁️"; btn.title = "Hiện";
    }
}

// MODAL ĐĂNG NHẬP PHÒNG THI DÀNH CHO HỌC SINH
function openStudentLoginModal(item, categoryId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const targetCatId = categoryId || item.categoryId || "them-11";
    activeStudentLogin.targetUrl = item.url || "";
    activeStudentLogin.examTitle = item.title || "Bài kiểm tra";
    activeStudentLogin.categoryId = targetCatId;
    activeStudentLogin.currentMode = "class";
    activeStudentLogin.item = item;

    const modal = document.getElementById("student-login-modal");
    const nameEl = document.getElementById("st-modal-exam-name");
    const timeBox = document.getElementById("st-modal-time-box");
    const errBox = document.getElementById("st-login-error");
    const mainTitleEl = document.getElementById("st-modal-main-title");

    const catName = getCategoryDisplayName(targetCatId);
    if (mainTitleEl) mainTitleEl.innerText = `Đăng Nhập Làm Bài Thi: ${catName}`;
    if (nameEl) nameEl.innerText = item.title;
    if (errBox) { errBox.style.display = "none"; errBox.innerText = ""; }

    if (timeBox) { timeBox.innerHTML = buildTimeBoxHtml(item.timeLimitMinutes, item.examStartTimeStr, item.examEndTimeStr, item.date || getItemDisplayDate(item)); }

    const userIn = document.getElementById("st-username-input");
    const passIn = document.getElementById("st-password-input");
    const fNameIn = document.getElementById("st-free-name-input");
    const fClassIn = document.getElementById("st-free-class-input");
    const fSbdIn = document.getElementById("st-free-sbd-input");

    if (userIn) userIn.value = "";
    if (passIn) { passIn.value = ""; passIn.type = "password"; }
    if (fNameIn) fNameIn.value = "";
    if (fClassIn) fClassIn.value = "";
    if (fSbdIn) fSbdIn.value = "";

    const eyeBtn = document.getElementById("st-eye-btn");
    if (eyeBtn) eyeBtn.innerText = "👁️";

    safeLocal.removeItem("saved_student_sbd");
    safeLocal.removeItem("saved_student_name");
    safeLocal.removeItem("saved_student_class");
    safeLocal.removeItem("current_exam_student");

    const allowFree = (item.allowFree !== false);
    const tabFree = document.getElementById("tab-st-free");
    if (tabFree) {
        if (!allowFree) {
            tabFree.disabled = true; tabFree.classList.add("disabled"); tabFree.title = "Đề thi này chỉ dành cho học sinh trong danh sách lớp";
        } else {
            tabFree.disabled = false; tabFree.classList.remove("disabled"); tabFree.title = "";
        }
    }

    switchStudentLoginMode("class");
    if (modal) modal.style.display = "flex";
}

function closeStudentLoginModal() {
    const modal = document.getElementById("student-login-modal");
    if (modal) modal.style.display = "none";
    const errBox = document.getElementById("st-login-error");
    if (errBox) { errBox.style.display = "none"; errBox.innerText = ""; }
}

function switchStudentLoginMode(mode) {
    activeStudentLogin.currentMode = mode;
    const tabClass = document.getElementById("tab-st-class");
    const tabFree = document.getElementById("tab-st-free");
    const viewClass = document.getElementById("st-login-mode-class");
    const viewFree = document.getElementById("st-login-mode-free");
    const errBox = document.getElementById("st-login-error");

    if (errBox) { errBox.style.display = "none"; errBox.innerText = ""; }

    if (mode === "free") {
        if (activeStudentLogin.item && activeStudentLogin.item.allowFree === false) { alert("⛔ Đề thi này không cho phép thí sinh tự do tham gia!"); return; }
        if (tabClass) tabClass.classList.remove("active");
        if (tabFree) tabFree.classList.add("active");
        if (viewClass) viewClass.style.display = "none";
        if (viewFree) viewFree.style.display = "block";
    } else {
        if (tabClass) tabClass.classList.add("active");
        if (tabFree) tabFree.classList.remove("active");
        if (viewClass) viewClass.style.display = "block";
        if (viewFree) viewFree.style.display = "none";
    }
}

function toggleStudentPassVisibility() {
    const passIn = document.getElementById("st-password-input");
    const eyeBtn = document.getElementById("st-eye-btn");
    if (!passIn) return;
    if (passIn.type === "password") { passIn.type = "text"; if (eyeBtn) eyeBtn.innerText = "🙈"; } 
    else { passIn.type = "password"; if (eyeBtn) eyeBtn.innerText = "👁️"; }
}

function submitStudentLogin() {
    const errBox = document.getElementById("st-login-error");
    const showErr = (msg) => {
        if (errBox) { errBox.innerText = msg; errBox.style.display = "block"; } else { alert(msg); }
    };

    let targetUrl = activeStudentLogin.targetUrl;
    if (!targetUrl) { showErr("❌ Không tìm thấy đường dẫn đề thi!"); return; }

    let finalSbd = ""; let finalName = ""; let finalClass = "";
    const activeCat = activeStudentLogin.categoryId || "them-11";

    if (activeStudentLogin.currentMode === "class") {
        const usernameVal = (document.getElementById("st-username-input").value || "").trim();
        const passVal = (document.getElementById("st-password-input").value || "").trim();

        if (!usernameVal || !passVal) { showErr("⚠️ Vui lòng nhập đầy đủ Tên đăng nhập (hoặc SBD) và Mật khẩu!"); return; }

        const accounts = getAccountsForCategory(activeCat);
        const normUser = normalizeName(usernameVal);
        const matched = accounts.find(acc => {
            const accSbd = String(acc.sbd || "").trim().toLowerCase();
            const accUser = normalizeName(acc.username);
            const accName = normalizeName(acc.name);
            const passOk = String(acc.pass || "").trim() === passVal;
            const isUserMatch = (accSbd === usernameVal.toLowerCase()) || (normUser && (accUser === normUser || accName === normUser));
            return isUserMatch && passOk;
        });

        if (!matched) { showErr("❌ Tên đăng nhập hoặc mật khẩu không chính xác cho lớp này!"); return; }
        finalSbd = matched.sbd; finalName = matched.name || matched.username; finalClass = matched.className || "Lớp học";
    } else {
        if (activeStudentLogin.item && activeStudentLogin.item.allowFree === false) { showErr("⛔ Giáo viên đã tắt chế độ thi tự do đối với đề thi này!"); return; }
        finalName = (document.getElementById("st-free-name-input").value || "").trim();
        finalClass = (document.getElementById("st-free-class-input").value || "").trim();
        finalSbd = (document.getElementById("st-free-sbd-input").value || "").trim();
        if (!finalName || !finalClass || !finalSbd) { showErr("⚠️ Vui lòng nhập đầy đủ Họ tên, Lớp và SBD tự do!"); return; }
    }

    safeLocal.removeItem("last_submission_cleared"); safeLocal.removeItem("saved_student_sbd");
    safeLocal.removeItem("saved_student_name"); safeLocal.removeItem("saved_student_class");
    safeLocal.setItem("current_exam_student", JSON.stringify({ sbd: finalSbd, name: finalName, className: finalClass, categoryId: activeCat }));

    try {
        let u = new URL(targetUrl, window.location.href);
        u.searchParams.set("cat", activeCat); u.searchParams.set("sbd", finalSbd); u.searchParams.set("name", finalName);
        u.searchParams.set("class", finalClass); u.searchParams.set("autostart", "1"); window.location.href = u.toString();
    } catch (e) {
        window.location.href = `${targetUrl}&cat=${encodeURIComponent(activeCat)}&sbd=${encodeURIComponent(finalSbd)}&name=${encodeURIComponent(finalName)}&class=${encodeURIComponent(finalClass)}&autostart=1`;
    }
}
