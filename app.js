/**
 * MAIN CONTROLLER: KẾT NỐI TẤT CẢ CÁC MODULE VÀ KHỞI ĐỘNG KHI MỞ TRANG WEB
 */
window.onload = async function() {
    ADMIN_AUTH.init();

    document.getElementById("top-banner-img").src = APP_CONFIG.TOP_BANNER_URL;
    document.getElementById("web-avatar-img").src = APP_CONFIG.WEB_AVATAR_URL;
    document.getElementById("bottom-banner-img").src = APP_CONFIG.BOTTOM_BANNER_URL;
    
    // Nạp danh sách avatar chọn
    const grid = document.getElementById("avatar-grid");
    grid.innerHTML = "";
    APP_STATE.selectedAvatarUrl = APP_CONFIG.PRESET_AVATARS[0];
    APP_CONFIG.PRESET_AVATARS.forEach((url, index) => {
        let img = document.createElement("img");
        img.src = url;
        img.className = "avatar-option " + (index === 0 ? "selected" : "");
        img.onclick = () => {
            document.querySelectorAll(".avatar-option").forEach(el => el.classList.remove("selected"));
            img.classList.add("selected");
            APP_STATE.selectedAvatarUrl = url;
        };
        grid.appendChild(img);
    });

    // Tải dữ liệu Firebase
    await API_SERVICE.loadDynamicLinks();

    // Dựng giao diện
    UI_RENDER.renderDanTriNavBar();
    UI_RENDER.renderReminderSection();
    UI_RENDER.renderDayThemNavBar();
    UI_RENDER.renderChinhKhoaNavBar();
    UI_RENDER.renderKhoTaiLieu();
    UI_RENDER.renderNewsSection();
};

// Đóng mở popover khi click ngoài màn hình
document.addEventListener("click", function(e) {
    const panel = document.getElementById("admin-popover-panel");
    const gear = document.getElementById("gear-btn");
    const authContainer = document.getElementById("auth-container");
    const examPickerMenu = document.getElementById("exam-picker-dropdown-list");

    if (panel && panel.classList.contains("show")) {
        if (!panel.contains(e.target) && !gear.contains(e.target)) ADMIN_AUTH.closeAdminPanel();
    }
    if (authContainer && authContainer.classList.contains("show")) {
        if (!authContainer.contains(e.target) && !gear.contains(e.target)) authContainer.classList.remove("show");
    }
    if (!e.target.closest('.badge-wrapper')) {
        document.querySelectorAll('.badge-dropdown-menu.show').forEach(m => m.classList.remove('show'));
        document.querySelectorAll('.exam-card.active-dropdown').forEach(c => c.classList.remove('active-dropdown'));
    }
    if (examPickerMenu && examPickerMenu.classList.contains("show")) {
        if (!e.target.closest('.exam-picker-wrapper')) examPickerMenu.classList.remove("show");
    }
    if (!e.target.closest('.td-attempt-cell-wrap')) {
        document.querySelectorAll('.attempt-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    }
});
```