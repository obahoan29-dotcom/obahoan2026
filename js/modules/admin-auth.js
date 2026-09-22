/**
 * MODULE 4: XÁC THỰC VÀ ĐIỀU KHIỂN MENU QUẢN TRỊ VIÊN
 */
window.ADMIN_AUTH = {
    init() {
        if (sessionStorage.getItem("adminLoggedInSession") === "true") { 
            APP_STATE.isAdminLoggedIn = true; 
            const gear = document.getElementById("gear-btn");
            if (gear) gear.classList.add("active-gear");
        }
    },

    checkAdminPassword() {
        const passInput = document.getElementById("admin-pass-input");
        const pass = passInput.value;
        if (pass === APP_CONFIG.ADMIN_PASSWORD) {
            APP_STATE.isAdminLoggedIn = true;
            sessionStorage.setItem("adminLoggedInSession", "true");
            document.getElementById("auth-container").classList.remove("show");
            document.getElementById("admin-popover-panel").classList.add("show");
            document.getElementById("gear-btn").classList.add("active-gear");
            passInput.value = "";
            UI_RENDER.refreshAllViews();
        } else {
            alert("❌ Sai mật khẩu quản trị!");
        }
    },

    togglePasswordVisibility() {
        const input = document.getElementById("admin-pass-input");
        const btn = document.getElementById("eye-toggle-btn");
        if (input.type === "password") {
            input.type = "text";
            btn.innerText = "🙈"; btn.title = "Ẩn";
        } else {
            input.type = "password";
            btn.innerText = "👁️"; btn.title = "Hiện";
        }
    },

    toggleAdminPanel(e) {
        if (e) e.stopPropagation();
        const authContainer = document.getElementById("auth-container");
        const panel = document.getElementById("admin-popover-panel");
        const gear = document.getElementById("gear-btn");

        if (APP_STATE.isAdminLoggedIn) {
            if (panel.classList.contains("show")) { this.closeAdminPanel(); } 
            else { panel.classList.add("show"); gear.classList.add("active-gear"); }
        } else {
            authContainer.classList.toggle("show");
            if (authContainer.classList.contains("show")) document.getElementById("admin-pass-input").focus();
        }
    },

    closeAdminPanel() {
        document.getElementById("admin-popover-panel").classList.remove("show");
        document.getElementById("gear-btn").classList.remove("active-gear");
    },

    switchAdminTab(tabName) {
        document.getElementById("tab-btn-quiz").classList.remove("active");
        document.getElementById("tab-btn-doc").classList.remove("active");
        document.getElementById("admin-tab-quiz").style.display = "none";
        document.getElementById("admin-tab-doc").style.display = "none";

        if(tabName === 'quiz') {
            document.getElementById("tab-btn-quiz").classList.add("active");
            document.getElementById("admin-tab-quiz").style.display = "block";
        } else {
            document.getElementById("tab-btn-doc").classList.add("active");
            document.getElementById("admin-tab-doc").style.display = "block";
        }
    }
};

function checkAdminPassword() { ADMIN_AUTH.checkAdminPassword(); }
function togglePasswordVisibility() { ADMIN_AUTH.togglePasswordVisibility(); }
function toggleAdminPanel(e) { ADMIN_AUTH.toggleAdminPanel(e); }
function closeAdminPanel() { ADMIN_AUTH.closeAdminPanel(); }
function switchAdminTab(t) { ADMIN_AUTH.switchAdminTab(t); }
function handleEnter(e) { if (e.key === 'Enter') checkAdminPassword(); }
```