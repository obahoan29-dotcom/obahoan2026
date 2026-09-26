// =========================================================
// QUẢN TRỊ VIÊN, ĐĂNG ĐỀ, TÀI LIỆU, BADGES & LOGIN HỌC SINH
// =========================================================
let currentEditingTimeQuizId = null;
let currentEditingTimeMode = null; // 'minutes' hoặc 'schedule'

function initAvatarGrid() {
    const grid = document.getElementById("avatar-grid");
    if (!grid) return;
    grid.innerHTML = "";
    selectedAvatarUrl = PRESET_AVATARS[0];
    PRESET_AVATARS.forEach((url, index) => {
        let img = document.createElement("img");
        img.src = url;
        img.className = "avatar-option " + (index === 0 ? "selected" : "");
        img.onclick = () => {
            document.querySelectorAll(".avatar-option").forEach(el => el.classList.remove("selected"));
            img.classList.add("selected");
            selectedAvatarUrl = url;
        };
        grid.appendChild(img);
    });
}

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

function checkAdminSessionValidity() {
    try {
        const logged = localStorage.getItem("adminLoggedInSession");
        const expiresAt = localStorage.getItem("admin_expires_at");
        if (logged === "true" && expiresAt) {
            const expTime = parseInt(expiresAt, 10);
            if (Date.now() < expTime) {
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

function checkAdminPassword() {
    const pass = document.getElementById("admin-pass-input").value;
    if (pass === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;

        const durationVal = document.getElementById("admin-expiry-select") ? document.getElementById("admin-expiry-select").value : "1d";
        const durationMs = parseExpiryDurationMs(durationVal);
        const expiresAt = Date.now() + durationMs;

        try {
            localStorage.setItem("adminLoggedInSession", "true");
            localStorage.setItem("admin_expires_at", String(expiresAt));
            localStorage.setItem("admin_duration_choice", durationVal);
            sessionStorage.setItem("adminLoggedInSession", "true");
        } catch(e) {}

        document.getElementById("auth-container").classList.remove("show");
        document.getElementById("admin-popover-panel").classList.add("show");
        document.getElementById("gear-btn").classList.add("active-gear");
        document.getElementById("admin-pass-input").value = "";
        refreshAllViews();
    } else {
        alert("❌ Sai mật khẩu!");
    }
}

function logoutAdmin(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    isAdminLoggedIn = false;
    try {
        localStorage.removeItem("adminLoggedInSession");
        localStorage.removeItem("admin_expires_at");
        sessionStorage.removeItem("adminLoggedInSession");
    } catch(e) {}
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

function refreshAllViews() {
    renderReminderSection();
    renderDayThemNavBar();
    renderChinhKhoaNavBar();
    renderKhoTaiLieu();
}

function switchAdminTab(tabName) {
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

async function loadDynamicLinksFromFirebase() {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/custom_links.json`);
        const data = await res.json();
        if (!data) return;

        for (const categoryId in data) {
            const linksObj = data[categoryId];
            let targetCategory = DAY_THEM_CATEGORIES.find(c => c.id === categoryId) || 
                                 CHINH_KHOA_CATEGORIES.find(c => c.id === categoryId) ||
                                 (KHO_TAI_LIEU_FOLDER.id === categoryId ? KHO_TAI_LIEU_FOLDER : null) ||
                                 (REMINDER_CATEGORY.id === categoryId ? REMINDER_CATEGORY : null);
            
            if (targetCategory) {
                let items = [];
                for (const linkId in linksObj) {
                    let item = linksObj[linkId];
                    item.firebaseId = linkId;
                    item.categoryId = categoryId;
                    if (!item.timestamp) item.timestamp = parseDateString(item.date); 
                    items.push(item);
                }
                
                targetCategory.links.forEach(link => {
                    if (!link.timestamp) link.timestamp = parseDateString(link.date);
                    link.categoryId = categoryId;
                    if (!link.firebaseId) link.firebaseId = link.id;
                });

                let existingIds = new Set(items.map(i => i.firebaseId));
                let uniqueStatic = targetCategory.links.filter(l => !existingIds.has(l.firebaseId));
                let allLinks = items.concat(uniqueStatic);

                allLinks.sort((a, b) => {
                    if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
                    return (a.title || "").localeCompare(b.title || "");
                });
                
                targetCategory.links = allLinks;
            }
        }
    } catch (e) { console.error("Lỗi tải link Firebase", e); }
}

function processUpload() {
    const fileInput = document.getElementById("admin-file-upload");
    const category = document.getElementById("admin-category-select").value;
    const btn = document.getElementById("btn-create-quiz");

    if (fileInput.files.length === 0) { alert("Vui lòng chọn file questions.js!"); return; }

    const file = fileInput.files[0];
    const reader = new FileReader();
    btn.innerText = "⏳ Đang xử lý..."; btn.disabled = true;

    reader.onload = async function(e) {
        let content = e.target.result;
        content = content.replace(/(const|let|var)\s+examData\s*=\s*/, '').trim();
        if (content.endsWith(';')) content = content.slice(0, -1);

        try {
            const parsedData = new Function("return " + content)();
            if (!parsedData.title || !parsedData.questions) throw new Error("File không đúng cấu trúc.");

            parsedData.isShuffled = true;
            parsedData.allowFreeStudent = true; // Mặc định cho phép tự do thi
            const quizId = "quiz_" + Date.now();
            await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, { method: 'PUT', body: JSON.stringify(parsedData) });

            const now = new Date();
            const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
            
            const linkData = { 
                title: parsedData.title, 
                date: dateStr, 
                url: `./thi.html?id=${quizId}&cat=${encodeURIComponent(category)}`, 
                badgeText: "HOT", 
                isHot: true, 
                isDoc: false, 
                avatar: selectedAvatarUrl, 
                timestamp: Date.now(), 
                isShuffled: true,
                allowFreeStudent: true,
                categoryId: category 
            };

            await fetch(`${FIREBASE_DB_URL}/custom_links/${category}/${quizId}.json`, { method: 'PUT', body: JSON.stringify(linkData) });

            alert("✨ Tạo đề thi thành công!");
            window.location.reload(); 
        } catch (err) { alert("❌ Lỗi: " + err.message); } 
        finally { btn.innerText = "✨ Đăng đề thi"; btn.disabled = false; }
    };
    reader.readAsText(file);
}

async function processAddDocument() {
    const titleInput = document.getElementById("admin-doc-title").value.trim();
    const urlInput = document.getElementById("admin-doc-url").value.trim();
    const category = document.getElementById("admin-category-select").value;
    const btn = document.getElementById("btn-create-doc");

    if (!titleInput || !urlInput) { alert("⚠️ Vui lòng nhập đủ tên tài liệu và đường link!"); return; }

    btn.innerText = "⏳ Đang đăng..."; btn.disabled = true;

    try {
        const docId = "doc_" + Date.now();
        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        
        const linkData = { 
            title: titleInput, date: dateStr, url: urlInput, 
            badgeText: "NONE", isHot: false, isDoc: true, 
            avatar: selectedAvatarUrl, timestamp: Date.now(),
            categoryId: category
        };

        await fetch(`${FIREBASE_DB_URL}/custom_links/${category}/${docId}.json`, { method: 'PUT', body: JSON.stringify(linkData) });
        alert("📤 Đăng tài liệu thành công!");
        window.location.reload(); 
    } catch (err) { alert("❌ Lỗi: " + err.message); } 
    finally { btn.innerText = "📤 Đăng tài liệu"; btn.disabled = false; }
}

async function deleteItem(categoryId, itemId, event) {
    event.preventDefault(); event.stopPropagation();
    if(!confirm("⚠️ Bạn có chắc chắn muốn XÓA vĩnh viễn mục này không?")) return;
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'DELETE' });
        if(itemId.startsWith('quiz_')) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'DELETE' });
        }
        window.location.reload();
    } catch(e) { alert("Lỗi khi xóa!"); }
}

async function renameItem(categoryId, itemId, isDoc, currentTitle, event) {
    event.preventDefault(); event.stopPropagation();
    let newTitle = prompt("✏️ Nhập tên mới:", currentTitle);
    if (newTitle !== null && newTitle.trim() !== "" && newTitle.trim() !== currentTitle) {
        try {
            await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ title: newTitle.trim() }) });
            if (!isDoc && itemId.startsWith('quiz_')) {
                await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ title: newTitle.trim() }) });
            }
            window.location.reload();
        } catch(e) { alert("Lỗi khi sửa tên!"); }
    }
}

async function moveItemOrder(categoryId, currentId, direction, event) {
    event.preventDefault(); event.stopPropagation();
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}.json`);
        const data = await res.json();
        if(!data) return;

        let arr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        arr.forEach(item => { if(!item.timestamp) item.timestamp = parseDateString(item.date); });
        
        arr.sort((a, b) => {
            if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
            return (a.title || "").localeCompare(b.title || "");
        });

        const currentIndex = arr.findIndex(item => item.id === currentId);
        if (currentIndex === -1) return;

        let targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex >= 0 && targetIndex < arr.length) {
            let currentItem = arr[currentIndex];
            let targetItem = arr[targetIndex];
            
            let tCurrent = currentItem.timestamp;
            let tTarget = targetItem.timestamp;

            if (tCurrent === tTarget) {
                tTarget = tCurrent + (direction === 'up' ? 10 : -10);
            }

            await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${currentItem.id}.json`, { 
                method: 'PATCH', body: JSON.stringify({ timestamp: tTarget }) 
            });
            await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${targetItem.id}.json`, { 
                method: 'PATCH', body: JSON.stringify({ timestamp: tCurrent }) 
            });
            
            window.location.reload();
        } else {
            alert(direction === 'up' ? "Mục này đã ở trên cùng!" : "Mục này đã ở dưới cùng!");
        }
    } catch(e) { alert("Lỗi khi đổi thứ tự!"); }
}

function openMoveModal(oldCategory, quizId, stringifiedData, event) {
    event.preventDefault(); event.stopPropagation();
    currentMoveData = { oldCategory, quizId, quizData: JSON.parse(decodeURIComponent(stringifiedData)) };
    document.getElementById("move-category-select").value = oldCategory;
    document.getElementById("move-modal").style.display = "flex";
}
function closeMoveModal() { document.getElementById("move-modal").style.display = "none"; }

async function confirmMoveQuiz() {
    const newCategory = document.getElementById("move-category-select").value;
    if(newCategory === currentMoveData.oldCategory) { alert("Đã nằm ở mục này rồi!"); return; }
    try {
        let itemUrl = currentMoveData.quizData.url || "";
        try {
            if (itemUrl.includes("thi.html")) {
                let u = new URL(itemUrl, window.location.href);
                u.searchParams.set("cat", newCategory);
                itemUrl = u.pathname + u.search + u.hash;
            }
        } catch(e) {}

        let updatedData = { ...currentMoveData.quizData, categoryId: newCategory, url: itemUrl };
        await fetch(`${FIREBASE_DB_URL}/custom_links/${newCategory}/${currentMoveData.quizId}.json`, { method: 'PUT', body: JSON.stringify(updatedData) });
        await fetch(`${FIREBASE_DB_URL}/custom_links/${currentMoveData.oldCategory}/${currentMoveData.quizId}.json`, { method: 'DELETE' });
        window.location.reload();
    } catch(e) { alert("Lỗi khi chuyển!"); }
}

function openCopyModal(sourceCategory, itemId, stringifiedData, event) {
    event.preventDefault(); event.stopPropagation();
    currentCopyData = { sourceCategory, itemId, itemData: JSON.parse(decodeURIComponent(stringifiedData)) };
    document.getElementById("copy-category-select").value = sourceCategory;
    document.getElementById("copy-modal").style.display = "flex";
}
function closeCopyModal() { document.getElementById("copy-modal").style.display = "none"; }

async function confirmCopyItem() {
    const destCategory = document.getElementById("copy-category-select").value;
    try {
        const newItemId = (currentCopyData.itemData.isDoc ? "doc_" : "quiz_") + Date.now();
        let itemUrl = currentCopyData.itemData.url || "";
        try {
            if (itemUrl.includes("thi.html")) {
                let u = new URL(itemUrl, window.location.href);
                u.searchParams.set("cat", destCategory);
                itemUrl = u.pathname + u.search + u.hash;
            }
        } catch(e) {}

        const copyData = { 
            ...currentCopyData.itemData, 
            categoryId: destCategory, 
            url: itemUrl,
            timestamp: Date.now() 
        }; 
        await fetch(`${FIREBASE_DB_URL}/custom_links/${destCategory}/${newItemId}.json`, { 
            method: 'PUT', body: JSON.stringify(copyData) 
        });
        alert("📋 Đã sao chép sang mục mới thành công!");
        window.location.reload();
    } catch(e) { alert("Lỗi khi sao chép!"); }
}

function extractQuizIdFromItem(item) {
    if (item.firebaseId && item.firebaseId.startsWith('quiz_')) return item.firebaseId;
    if (item.url && item.url.includes("?id=")) {
        try {
            let u = new URL(item.url, window.location.href);
            return u.searchParams.get("id");
        } catch(e) {}
    }
    return null;
}

function toLocalDatetimeString(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return "";
    const pad = (n) => String(n).padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
}

async function openEditMinutesModal(quizId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    currentEditingTimeQuizId = quizId;
    currentEditingTimeMode = 'minutes';

    document.getElementById("exam-time-modal-title").innerText = "⏱ Đổi thời lượng làm bài";
    document.getElementById("modal-time-minutes-group").style.display = "block";
    document.getElementById("modal-time-schedule-group").style.display = "none";
    document.getElementById("edit-time-limit").value = "";

    try {
        const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
        const qData = await res.json();
        if (qData && qData.timeLimitMinutes !== undefined) {
            document.getElementById("edit-time-limit").value = qData.timeLimitMinutes;
        }
    } catch(e) {}

    document.getElementById("exam-time-modal").style.display = "flex";
}

async function openEditScheduleModal(quizId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    currentEditingTimeQuizId = quizId;
    currentEditingTimeMode = 'schedule';

    document.getElementById("exam-time-modal-title").innerText = "📅 Gia hạn khung giờ làm bài";
    document.getElementById("modal-time-minutes-group").style.display = "none";
    document.getElementById("modal-time-schedule-group").style.display = "block";

    const startInput = document.getElementById("edit-start-time");
    const endInput = document.getElementById("edit-end-time");
    startInput.value = "";
    endInput.value = "";

    try {
        const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
        const qData = await res.json();
        if (qData) {
            if (qData.examStartTimeStr) {
                startInput.value = toLocalDatetimeString(new Date(qData.examStartTimeStr));
            }
            if (qData.examEndTimeStr) {
                endInput.value = toLocalDatetimeString(new Date(qData.examEndTimeStr));
            }
        }
    } catch(e) {}

    document.getElementById("exam-time-modal").style.display = "flex";
}

function closeExamTimeModal() {
    document.getElementById("exam-time-modal").style.display = "none";
    currentEditingTimeQuizId = null;
    currentEditingTimeMode = null;
}

async function saveExamTimeConfig() {
    if (!currentEditingTimeQuizId) return;
    const btn = document.getElementById("btn-save-exam-time");
    btn.innerText = "⏳ Đang lưu..."; btn.disabled = true;

    try {
        let payload = {};
        if (currentEditingTimeMode === 'minutes') {
            const mins = parseInt(document.getElementById("edit-time-limit").value, 10);
            if (isNaN(mins) || mins <= 0) {
                alert("⚠️ Vui lòng nhập số phút hợp lệ (> 0)!");
                btn.innerText = "Lưu cấu hình"; btn.disabled = false;
                return;
            }
            payload.timeLimitMinutes = mins;
        } else if (currentEditingTimeMode === 'schedule') {
            const startVal = document.getElementById("edit-start-time").value;
            const endVal = document.getElementById("edit-end-time").value;
            if (startVal) payload.examStartTimeStr = startVal;
            if (endVal) payload.examEndTimeStr = endVal;
        }

        await fetch(`${FIREBASE_DB_URL}/quizzes/${currentEditingTimeQuizId}.json`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        alert("✅ Đã cập nhật thời gian đề thi thành công!");
        closeExamTimeModal();
    } catch(e) {
        alert("❌ Lỗi khi lưu cấu hình thời gian: " + e.message);
    } finally {
        btn.innerText = "Lưu cấu hình"; btn.disabled = false;
    }
}

// BẬT / TẮT THÍ SINH TỰ DO THI TRÊN THẺ ĐỀ THI
async function toggleFreeStudentAllowed(categoryId, itemId, isChecked, event) {
    event.stopPropagation();
    try {
        let payload = { allowFreeStudent: isChecked };
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: 'PATCH', body: JSON.stringify(payload)
        });
        
        let quizId = itemId.startsWith('quiz_') ? itemId : null;
        if (!quizId) {
            let cat = DAY_THEM_CATEGORIES.find(c => c.id === categoryId) || CHINH_KHOA_CATEGORIES.find(c => c.id === categoryId);
            if (cat) {
                let it = cat.links.find(l => l.firebaseId === itemId || l.id === itemId);
                if (it) quizId = extractQuizIdFromItem(it);
            }
        }
        if (quizId) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, {
                method: 'PATCH', body: JSON.stringify(payload)
            });
        }

        const wrap = event.target.closest('.free-student-toggle-wrap');
        if (wrap) {
            const statusEl = wrap.querySelector('.free-toggle-status');
            if (statusEl) {
                statusEl.textContent = isChecked ? 'BẬT' : 'TẮT';
                statusEl.className = `free-toggle-status ${isChecked ? 'st-on' : 'st-off'}`;
            }
        }
    } catch(e) { alert("❌ Lỗi đổi trạng thái thi tự do!"); }
}

// =========================================================
// LOGIC ĐĂNG NHẬP THI HỌC SINH THEO TỪNG LỚP
// =========================================================
function switchStudentLoginMode(mode) {
    if (mode === 'free' && activeStudentLogin.allowFreeStudent === false) {
        alert("⛔ Bài thi này hiện đã bị giáo viên TẮT quyền tham gia của Thí sinh tự do!");
        return;
    }

    activeStudentLogin.currentMode = mode;
    const tabClass = document.getElementById("tab-st-class");
    const tabFree = document.getElementById("tab-st-free");
    const boxClass = document.getElementById("st-login-mode-class");
    const boxFree = document.getElementById("st-login-mode-free");
    const errBox = document.getElementById("st-login-error");
    const iconEl = document.getElementById("st-modal-icon");

    errBox.style.display = "none";
    errBox.innerText = "";

    if (mode === 'free') {
        tabClass.classList.remove("active");
        tabFree.classList.add("active");
        boxClass.style.display = "none";
        boxFree.style.display = "block";
        iconEl.innerText = "🎯";
        document.getElementById("st-modal-main-title").innerText = `Thí Sinh Tự Do Vào Thi - ${getCategoryDisplayName(activeStudentLogin.categoryId)}`;
        setTimeout(() => { document.getElementById("st-free-name-input").focus(); }, 100);
    } else {
        tabFree.classList.remove("active");
        tabClass.classList.add("active");
        boxFree.style.display = "none";
        boxClass.style.display = "block";
        iconEl.innerText = "🔐";
        
        const cTitle = getCategoryDisplayName(activeStudentLogin.categoryId);
        document.getElementById("st-modal-main-title").innerText = `Đăng Nhập Làm Bài - ${cTitle}`;
        setTimeout(() => { document.getElementById("st-username-input").focus(); }, 100);
    }
}

async function openStudentLoginModal(targetUrl, examTitle, categoryId, itemData = null) {
    activeStudentLogin = { 
        targetUrl: targetUrl, 
        examTitle: examTitle, 
        categoryId: categoryId || "them-10", 
        currentMode: "class",
        allowFreeStudent: (itemData && itemData.allowFreeStudent !== false)
    };
    
    document.getElementById("st-modal-exam-name").innerText = examTitle || "Bài kiểm tra trực tuyến";
    document.getElementById("st-username-input").value = "";
    document.getElementById("st-password-input").value = "";
    document.getElementById("st-free-name-input").value = "";
    document.getElementById("st-free-class-input").value = "";
    document.getElementById("st-free-sbd-input").value = "";
    
    const timeBox = document.getElementById("st-modal-time-box");
    if (timeBox) timeBox.innerText = "⏳ Đang kiểm tra khung thời gian thi...";

    const errBox = document.getElementById("st-login-error");
    errBox.style.display = "none";
    errBox.innerText = "";
    
    switchStudentLoginMode('class');
    document.getElementById("student-login-modal").style.display = "flex";

    let quizId = null;
    try {
        let u = new URL(targetUrl, window.location.href);
        quizId = u.searchParams.get("id");
    } catch(e) {}

    if (quizId) {
        try {
            const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
            const qData = await res.json();
            if (qData) {
                if (qData.allowFreeStudent !== undefined) {
                    activeStudentLogin.allowFreeStudent = (qData.allowFreeStudent !== false);
                }

                const tabFree = document.getElementById("tab-st-free");
                if (tabFree) {
                    if (activeStudentLogin.allowFreeStudent === false) {
                        tabFree.title = "Đã bị giáo viên khóa thi tự do";
                        tabFree.style.opacity = "0.5";
                    } else {
                        tabFree.title = "";
                        tabFree.style.opacity = "1";
                    }
                }

                if (timeBox) {
                    let parts = [];
                    if (qData.timeLimitMinutes) {
                        parts.push(`⏱ Thời gian làm: <b>${qData.timeLimitMinutes} phút</b>`);
                    }
                    if (qData.examStartTimeStr && qData.examEndTimeStr) {
                        const st = new Date(qData.examStartTimeStr).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
                        const et = new Date(qData.examEndTimeStr).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
                        parts.push(`📅 Khung giờ: <b>${st}</b> đến <b>${et}</b>`);
                    } else if (qData.examEndTimeStr) {
                        const et = new Date(qData.examEndTimeStr).toLocaleString("vi-VN");
                        parts.push(`📅 Hạn cuối: <b>${et}</b>`);
                    }
                    
                    if (activeStudentLogin.allowFreeStudent === false) {
                        parts.push(`<span style="color:#dc2626; font-weight:800;">🔒 Tự do thi: ĐÃ TẮT</span>`);
                    }
                    timeBox.innerHTML = parts.length > 0 ? parts.join("<br>") : "⏱ Thời gian làm bài theo quy định của giáo viên";
                }
            }
        } catch(e) {
            if (timeBox) timeBox.innerText = "⏱ Thời gian làm bài theo quy định của giáo viên";
        }
    } else {
        if (timeBox) timeBox.innerText = "⏱ Thời gian làm bài theo quy định của giáo viên";
    }
}

function closeStudentLoginModal() {
    document.getElementById("student-login-modal").style.display = "none";
}

function toggleStudentPassVisibility() {
    const input = document.getElementById("st-password-input");
    const btn = document.getElementById("st-eye-btn");
    if (input.type === "password") {
        input.type = "text";
        btn.innerText = "🙈";
    } else {
        input.type = "password";
        btn.innerText = "👁️";
    }
}

function submitStudentLogin() {
    const errBox = document.getElementById("st-login-error");
    const btn = document.getElementById("st-submit-btn");
    const currentTargetCat = activeStudentLogin.categoryId;

    if (activeStudentLogin.currentMode === 'free') {
        if (activeStudentLogin.allowFreeStudent === false) {
            errBox.innerText = "⛔ Giáo viên đã TẮT quyền tham gia của Thí sinh tự do đối với đề thi này!";
            errBox.style.display = "block";
            return;
        }

        const freeName = document.getElementById("st-free-name-input").value.trim();
        const freeClass = document.getElementById("st-free-class-input").value.trim();
        const freeSbd = document.getElementById("st-free-sbd-input").value.trim();

        if (!freeName || !freeClass || !freeSbd) {
            errBox.innerText = "⚠️ Vui lòng nhập đầy đủ Họ tên, Lớp và Số báo danh!";
            errBox.style.display = "block";
            return;
        }

        errBox.style.display = "none";
        const freePayload = {
            sbd: freeSbd, 
            name: freeName, 
            className: freeClass,
            username: "free_" + freeSbd, 
            isFreeStudent: true,
            categoryId: currentTargetCat
        };

        try {
            localStorage.setItem("current_exam_student", JSON.stringify(freePayload));
            sessionStorage.setItem("current_exam_student", JSON.stringify(freePayload));
            localStorage.setItem("saved_student_sbd", freeSbd);
            localStorage.setItem("saved_student_name", freeName);
            localStorage.setItem("saved_student_class", freeClass);
        } catch(e) {}

        let urlObj;
        try {
            urlObj = new URL(activeStudentLogin.targetUrl, window.location.href);
        } catch(e) {
            urlObj = new URL(window.location.origin + "/" + activeStudentLogin.targetUrl);
        }
        urlObj.searchParams.set('sbd', freeSbd);
        urlObj.searchParams.set('name', freeName);
        urlObj.searchParams.set('class', freeClass);
        urlObj.searchParams.set('cat', currentTargetCat);
        urlObj.searchParams.set('autostart', '1');

        const finalRedirectUrl = urlObj.pathname + urlObj.search + urlObj.hash;

        btn.innerHTML = "🎉 Thí sinh tự do vào thi...";
        btn.style.background = "#10b981";

        setTimeout(() => {
            closeStudentLoginModal();
            window.location.href = finalRedirectUrl;
            btn.innerHTML = "Vào thi 🚀";
            btn.style.background = "";
        }, 400);
        return;
    }

    const uVal = document.getElementById("st-username-input").value.trim();
    const pVal = document.getElementById("st-password-input").value.trim();

    if (!uVal || !pVal) {
        errBox.innerText = "⚠️ Vui lòng nhập đầy đủ Tên đăng nhập (hoặc SBD) và Mật khẩu!";
        errBox.style.display = "block";
        return;
    }

    const catId = activeStudentLogin.categoryId;
    const accounts = getAccountsForCategory(catId);

    if (!accounts || accounts.length === 0) {
        errBox.innerText = `⚠️ Không tìm thấy cơ sở dữ liệu của lớp "${getCategoryDisplayName(catId)}"!`;
        errBox.style.display = "block";
        return;
    }

    const matched = accounts.find(acc => 
        ((acc.username && acc.username.trim().toLowerCase() === uVal.toLowerCase()) ||
         (acc.sbd && String(acc.sbd).trim().toLowerCase() === uVal.toLowerCase()) ||
         (acc.name && acc.name.trim().toLowerCase() === uVal.toLowerCase())) &&
        (String(acc.pass).trim() === pVal)
    );

    if (matched) {
        errBox.style.display = "none";
        const studentPayload = {
            sbd: matched.sbd, 
            name: matched.name || matched.username, 
            className: matched.className,
            username: matched.username, 
            stt: matched.stt,
            categoryId: catId
        };
        
        try {
            localStorage.setItem("current_exam_student", JSON.stringify(studentPayload));
            sessionStorage.setItem("current_exam_student", JSON.stringify(studentPayload));
            localStorage.setItem("saved_student_sbd", matched.sbd);
            localStorage.setItem("saved_student_name", matched.name || matched.username);
            localStorage.setItem("saved_student_class", matched.className);
        } catch(e) {}

        let urlObj;
        try {
            urlObj = new URL(activeStudentLogin.targetUrl, window.location.href);
        } catch(e) {
            urlObj = new URL(window.location.origin + "/" + activeStudentLogin.targetUrl);
        }
        urlObj.searchParams.set('sbd', matched.sbd);
        urlObj.searchParams.set('name', matched.name || matched.username);
        urlObj.searchParams.set('class', matched.className);
        urlObj.searchParams.set('cat', catId);
        urlObj.searchParams.set('autostart', '1');

        const finalRedirectUrl = urlObj.pathname + urlObj.search + urlObj.hash;

        btn.innerHTML = "🎉 Đăng nhập thành công! Đang vào...";
        btn.style.background = "#10b981";

        setTimeout(() => {
            closeStudentLoginModal();
            window.location.href = finalRedirectUrl;
            btn.innerHTML = "Vào thi 🚀";
            btn.style.background = "";
        }, 400);
    } else {
        errBox.innerText = `❌ Sai Tên đăng nhập (hoặc SBD) hoặc Mật khẩu trong ${getCategoryDisplayName(catId)}! Vui lòng thử lại.`;
        errBox.style.display = "block";
    }
}

// =========================================================
// RENDER GIAO DIỆN THẺ ĐỀ THI & NHÃN BADGE
// =========================================================
function getBadgeClass(type) {
    switch(type) {
        case 'HOT': return 'b-hot';
        case 'NEW': return 'b-new';
        case 'MỚI': return 'b-moi';
        case 'Làm ngay': return 'b-lamngay';
        case 'WARNING': return 'b-warning';
        case 'START': return 'b-start';
        default: return '';
    }
}

function toggleBadgeMenu(wrapperEl, event) {
    event.preventDefault(); event.stopPropagation();
    const currentMenu = wrapperEl.querySelector('.badge-dropdown-menu');
    const parentCard = wrapperEl.closest('.exam-card');
    const isShown = currentMenu.classList.contains('show');

    document.querySelectorAll('.badge-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.exam-card.active-dropdown').forEach(c => c.classList.remove('active-dropdown'));

    if (!isShown) {
        currentMenu.classList.add('show');
        if(parentCard) parentCard.classList.add('active-dropdown');
    }
}

async function changeBadge(categoryId, itemId, newBadgeType, event) {
    event.preventDefault(); event.stopPropagation();

    if (!checkAdminSessionValidity()) {
        let pass = prompt("🔐 Nhập mật khẩu quản trị viên để thay đổi nhãn:");
        if (pass !== ADMIN_PASSWORD) { alert("❌ Sai mật khẩu!"); return; }
        isAdminLoggedIn = true;
        try {
            const exp = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem("adminLoggedInSession", "true");
            localStorage.setItem("admin_expires_at", String(exp));
            sessionStorage.setItem("adminLoggedInSession", "true");
        } catch(e) {}
        document.getElementById("gear-btn").classList.add("active-gear");
        refreshAllViews();
    }

    const wrapperEl = event.target.closest('.badge-wrapper');
    if (wrapperEl) {
        const badgeSpan = wrapperEl.querySelector('.badge-item');
        if (badgeSpan) {
            badgeSpan.className = `badge-item ${getBadgeClass(newBadgeType)} ${newBadgeType === 'NONE' ? 'badge-empty' : ''}`;
            badgeSpan.innerHTML = `${newBadgeType !== 'NONE' ? newBadgeType : 'Nhãn'} ▾`;
        }
        const currentMenu = wrapperEl.querySelector('.badge-dropdown-menu');
        if (currentMenu) currentMenu.classList.remove('show');
        const parentCard = wrapperEl.closest('.exam-card');
        if (parentCard) parentCard.classList.remove('active-dropdown');
    }

    try {
        let payload = { badgeText: newBadgeType, isHot: (newBadgeType === 'HOT') };
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { 
            method: 'PATCH', body: JSON.stringify(payload) 
        });
        if (itemId.startsWith('quiz_')) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { 
                method: 'PATCH', body: JSON.stringify(payload) 
            });
        }
    } catch(e) { console.error("Lỗi lưu nhãn:", e); }
}

function createExamCard(item) {
    let card = document.createElement("a"); 
    card.className = "exam-card"; 
    
    let catId = item.categoryId || "them-10";
    item.categoryId = catId;
    let itemId = item.firebaseId || item.id || ("item_" + Date.now());

    const isPadlet = (catId === "tu-luan-padlet") || (item.url && item.url.includes("padlet.com"));
    const LOGIN_CLASSES = ["them-10", "them-11", "them-12", "lop-11a", "lop-11c", "lop-10p"];
    const requiresLogin = !item.isDoc && !isPadlet && LOGIN_CLASSES.includes(catId);

    if (requiresLogin) {
        card.href = "javascript:void(0);";
        card.onclick = function(e) {
            e.preventDefault();
            openStudentLoginModal(item.url, item.title, catId, item);
        };
    } else {
        card.href = item.url; 
        card.target = "_blank";
    }
    
    // CỤM NÚT QUẢN TRỊ TRÁI: CÔNG TẮC TỰ DO + KẾT QUẢ THI + ĐỔI PHÚT + GIA HẠN LỊCH
    let leftResultBtnHtml = "";
    if (isAdminLoggedIn && !item.isDoc && !isPadlet) {
        let copyItem = { ...item, categoryId: catId };
        let linkedQuizId = extractQuizIdFromItem(item);
        let subTimeButtonsHtml = "";
        let isFreeAllowed = (item.allowFreeStudent !== false);

        if (linkedQuizId) {
            subTimeButtonsHtml = `
            <div class="left-sub-btns-row" onclick="event.preventDefault(); event.stopPropagation();">
                <button type="button" class="btn-time-sub-action btn-time-sub-minutes" onclick="openEditMinutesModal('${linkedQuizId}', event)" title="Thay đổi thời lượng làm bài (phút)">
                    ⏱ Đổi phút
                </button>
                <button type="button" class="btn-time-sub-action btn-time-sub-schedule" onclick="openEditScheduleModal('${linkedQuizId}', event)" title="Gia hạn khung ngày giờ làm bài">
                    📅 Gia hạn lịch
                </button>
            </div>`;
        }

        leftResultBtnHtml = `
        <div class="left-admin-actions-col">
            <!-- NÚT GẠT TẮT/MỞ THÍ SINH TỰ DO THI -->
            <div class="free-student-toggle-wrap" onclick="event.preventDefault(); event.stopPropagation();" title="Gạt phải: BẬT cho phép Thí sinh tự do thi | Gạt trái: TẮT thi tự do">
                <span class="free-toggle-lbl">🎯 Tự do:</span>
                <label class="switch-toggle mini-switch">
                    <input type="checkbox" ${isFreeAllowed ? 'checked' : ''} onchange="toggleFreeStudentAllowed('${catId}', '${itemId}', this.checked, event)">
                    <span class="slider-toggle"></span>
                </label>
                <span class="free-toggle-status ${isFreeAllowed ? 'st-on' : 'st-off'}">${isFreeAllowed ? 'BẬT' : 'TẮT'}</span>
            </div>

            <!-- NÚT KẾT QUẢ THI -->
            <button type="button" class="btn-view-results-left" onclick="openExamResultModal(${JSON.stringify(copyItem).replace(/"/g, '&quot;')}, event)" title="Xem bảng điểm và chi tiết bài làm của học sinh">
                📊 Kết quả thi
            </button>
            ${subTimeButtonsHtml}
        </div>`;
    }

    let thumbHtml = item.avatar ? `<div class="exam-thumb-box"><img src="${item.avatar}" class="exam-thumb" alt="Avatar"></div>` : '';
    let currentBadge = item.badgeText || (item.isHot ? 'HOT' : 'NONE');

    let badgeDisplay = currentBadge !== 'NONE' 
        ? `<span class="badge-item ${getBadgeClass(currentBadge)}">${currentBadge} ▾</span>`
        : `<span class="badge-item badge-empty" title="Thêm nhãn">Nhãn ▾</span>`;

    let badgeWrapperHtml = `
        <div class="badge-wrapper" onclick="toggleBadgeMenu(this, event)">
            ${badgeDisplay}
            <div class="badge-dropdown-menu">
                <div class="b-item-btn b-hot" onclick="changeBadge('${catId}', '${itemId}', 'HOT', event)">HOT</div>
                <div class="b-item-btn b-new" onclick="changeBadge('${catId}', '${itemId}', 'NEW', event)">NEW</div>
                <div class="b-item-btn b-moi" onclick="changeBadge('${catId}', '${itemId}', 'MỚI', event)">MỚI</div>
                <div class="b-item-btn b-lamngay" onclick="changeBadge('${catId}', '${itemId}', 'Làm ngay', event)">Làm ngay</div>
                <div class="b-item-btn b-warning" onclick="changeBadge('${catId}', '${itemId}', 'WARNING', event)">WARNING</div>
                <div class="b-item-btn b-start" onclick="changeBadge('${catId}', '${itemId}', 'START', event)">START</div>
                <div class="b-item-btn b-none-btn" onclick="changeBadge('${catId}', '${itemId}', 'NONE', event)">Để trắng</div>
            </div>
        </div>
    `;

    let adminTools = ""; 
    let arrowHtml = `<div class="arrow">&#8250;</div>`;
    
    if (isAdminLoggedIn && item.firebaseId) {
        arrowHtml = "";
        let cleanData = { title: item.title, date: item.date, url: item.url, badgeText: currentBadge, isHot: (currentBadge==='HOT'), isDoc: item.isDoc, avatar: item.avatar, timestamp: item.timestamp, isShuffled: item.isShuffled, allowFreeStudent: item.allowFreeStudent, categoryId: catId };
        let strData = encodeURIComponent(JSON.stringify(cleanData));
        let escapedTitle = (item.title || "").replace(/'/g, "\\'"); 
        let isDocFlag = item.isDoc ? 'true' : 'false';
        
        let shuffleToggleHtml = "";
        if (!item.isDoc && item.firebaseId.startsWith('quiz_')) {
            let isChecked = item.isShuffled !== false;
            shuffleToggleHtml = `
            <div style="display:flex; align-items:center; background: rgba(255,255,255,0.85); padding: 2px 6px; border-radius: 12px; border: 1px solid #cbd5e1; margin-right: 4px;" title="Gạt phải: BẬT Đảo đề | Gạt trái: TẮT Đảo đề">
                <span class="shuffle-label">🔀</span>
                <label class="switch-toggle" onclick="event.stopPropagation();">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleShuffle('${catId}', '${itemId}', this.checked, event)">
                    <span class="slider-toggle"></span>
                </label>
            </div>`;
        }
        
        adminTools = `
        <div class="admin-link-tools" onclick="event.preventDefault(); event.stopPropagation();">
            ${shuffleToggleHtml}
            <button class="tool-btn tool-btn-edit" onclick="renameItem('${catId}', '${itemId}', ${isDocFlag}, '${escapedTitle}', event)" title="Sửa tên">✏️</button>
            <button class="tool-btn tool-btn-copy" onclick="openCopyModal('${catId}', '${itemId}', '${strData}', event)" title="Sao chép sang mục khác">📋</button>
            <button class="tool-btn tool-btn-move" onclick="openMoveModal('${catId}', '${itemId}', '${strData}', event)" title="Chuyển mục">🔄</button>
            <button class="tool-btn tool-btn-up" onclick="moveItemOrder('${catId}', '${itemId}', 'up', event)" title="Lên trên">⬆️</button>
            <button class="tool-btn tool-btn-down" onclick="moveItemOrder('${catId}', '${itemId}', 'down', event)" title="Xuống dưới">⬇️</button>
            <button class="tool-btn tool-btn-delete" onclick="deleteItem('${catId}', '${itemId}', event)" title="Xóa">🗑️</button>
        </div>`;
    }

    let docBadgeHtml = item.isDoc ? `<span class="badge-doc">TÀI LIỆU</span>` : '';

    card.innerHTML = `
        ${leftResultBtnHtml}
        ${thumbHtml}
        <div class="exam-info">
            <div class="exam-header-row">
                ${badgeWrapperHtml}
                ${docBadgeHtml}
                <div class="exam-title-text" title="${item.title}">${item.title}</div>
            </div>
            <div class="exam-date">🕒 ${item.date}</div>
        </div>
        ${adminTools}
        ${arrowHtml}
    `;
    return card;
}

async function toggleShuffle(categoryId, itemId, isChecked, event) {
    event.stopPropagation();
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ isShuffled: isChecked }) });
        await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ isShuffled: isChecked }) });
    } catch(e) { alert("❌ Lỗi đổi trạng thái đảo đề!"); }
}

function renderLinkListToContainer(linksArray, containerElement, customVisibleCount = 2) {
    containerElement.innerHTML = "";
    if (!linksArray || linksArray.length === 0) {
        containerElement.innerHTML = `<div class="empty-folder">Chưa có bài tập nào trong mục này...</div>`; return;
    }

    const maxVisible = customVisibleCount;
    const visibleLinks = linksArray.slice(0, maxVisible);
    const hiddenLinks = linksArray.slice(maxVisible);

    visibleLinks.forEach(item => containerElement.appendChild(createExamCard(item)));

    if (hiddenLinks.length > 0) {
        let hiddenContainer = document.createElement("div");
        hiddenContainer.className = "hidden-links-container"; hiddenContainer.style.display = "none";
        hiddenLinks.forEach(item => hiddenContainer.appendChild(createExamCard(item)));

        let toggleBtn = document.createElement("button");
        toggleBtn.className = "load-more-btn";
        toggleBtn.innerHTML = `⬇ Xem thêm ${hiddenLinks.length} bài cũ hơn...`;
        toggleBtn.onclick = function(e) {
            e.stopPropagation(); 
            if (hiddenContainer.style.display === "none") { hiddenContainer.style.display = "flex"; toggleBtn.innerHTML = `⬆ Thu gọn bớt`; } 
            else { hiddenContainer.style.display = "none"; toggleBtn.innerHTML = `⬇ Xem thêm ${hiddenLinks.length} bài cũ hơn...`; }
        };
        containerElement.appendChild(toggleBtn); containerElement.appendChild(hiddenContainer);
    }
}

let activeDanTriId = null; 
let activeDayThemId = null;
let activeChinhKhoaRow1Id = null; 
let activeChinhKhoaRow2Id = null;

function renderDanTriNavBar() {
    const navBar = document.getElementById("dantri-nav-bar"); 
    if (!navBar) return;
    navBar.innerHTML = "";
    DANTRI_NAV_CATEGORIES.forEach(cat => {
        let btn = document.createElement("button"); btn.className = "dantri-nav-btn";
        btn.innerHTML = `<div style="display:inline-flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">${cat.title}</div><span class="caret-icon">&#9660;</span>`;
        
        btn.onclick = function() {
            const panel = document.getElementById("dantri-dropdown-panel"); 
            const subTitle = document.getElementById("dantri-sub-title"); 
            const newsList = document.getElementById("dantri-news-list");
            navBar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));

            if (activeDanTriId === cat.id) { panel.classList.remove("show"); activeDanTriId = null; } 
            else {
                activeDanTriId = cat.id; btn.classList.add("active"); subTitle.innerHTML = cat.subTitle; newsList.innerHTML = "";
                cat.news.forEach(item => {
                    let card = document.createElement("a"); card.href = item.url; card.target = "_blank";
                    card.style.cssText = "display:flex; align-items:flex-start; gap:12px; padding:10px 12px; background:rgba(255,255,255,0.9); border-radius:12px; border:1px solid #e2e8f0; text-decoration:none; color:inherit; transition:all 0.25s;";
                    let tagBg = item.tag === "GIẢI TRÍ" || item.tag === "CƯỜI MẮT" || item.tag === "MEME MATH" ? "background:#fef3c7; color:#b45309;" : "background:#dcfce7; color:#15803d;";
                    card.innerHTML = `<span style="font-size:11px; font-weight:800; padding:3px 7px; border-radius:5px; ${tagBg} white-space:nowrap; margin-top:2px;">${item.tag}</span><div style="flex:1; min-width:0;"><div style="font-size:14px; font-weight:700; color:#0f172a; line-height:1.35; margin-bottom:3px;">${item.title}</div><div style="font-size:11.5px; color:#64748b; font-weight:600;">🕒 ${item.date}</div></div>`;
                    newsList.appendChild(card);
                });
                panel.classList.add("show"); btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        };
        navBar.appendChild(btn);
    });
}

function renderDayThemNavBar() {
    const navBar = document.getElementById("daythem-nav-bar"); 
    const panel = document.getElementById("daythem-dropdown-panel"); 
    const container = document.getElementById("daythem-links-container"); 
    if (!navBar) return;
    navBar.innerHTML = "";
    
    DAY_THEM_CATEGORIES.forEach(cat => {
        let btn = document.createElement("button"); 
        btn.className = "dantri-nav-btn"; 
        btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
        if (activeDayThemId === cat.id) btn.classList.add("active");
        
        btn.onclick = function() {
            navBar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
            if (activeDayThemId === cat.id) { 
                panel.classList.remove("show"); 
                activeDayThemId = null; 
            } else { 
                activeDayThemId = cat.id; 
                btn.classList.add("active"); 
                renderLinkListToContainer(cat.links, container, cat.visibleCount || 2); 
                panel.classList.add("show"); 
            }
        };
        navBar.appendChild(btn);
    });

    if (activeDayThemId) { 
        let activeCat = DAY_THEM_CATEGORIES.find(c => c.id === activeDayThemId); 
        if (activeCat) {
            renderLinkListToContainer(activeCat.links, container, activeCat.visibleCount || 2);
            panel.classList.add("show");
        }
    }
}

function renderChinhKhoaNavBar() {
    const row1Bar = document.getElementById("chinhkhoa-row1-bar");
    const row1Panel = document.getElementById("chinhkhoa-row1-dropdown");
    const row1Links = document.getElementById("chinhkhoa-row1-links");

    const row2Bar = document.getElementById("chinhkhoa-row2-bar");
    const row2Panel = document.getElementById("chinhkhoa-row2-dropdown");
    const row2Links = document.getElementById("chinhkhoa-row2-links");

    if (!row1Bar || !row2Bar) return;

    row1Bar.innerHTML = "";
    row2Bar.innerHTML = "";

    const row1Categories = CHINH_KHOA_CATEGORIES.filter(c => c.row === 1);
    row1Categories.forEach(cat => {
        let btn = document.createElement("button");
        btn.className = "dantri-nav-btn";
        btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
        if (activeChinhKhoaRow1Id === cat.id) btn.classList.add("active");

        btn.onclick = function() {
            row1Bar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
            if (activeChinhKhoaRow1Id === cat.id) {
                row1Panel.classList.remove("show");
                activeChinhKhoaRow1Id = null;
            } else {
                activeChinhKhoaRow1Id = cat.id;
                btn.classList.add("active");
                renderLinkListToContainer(cat.links, row1Links, cat.visibleCount || 2);
                row1Panel.classList.add("show"); 
            }
        };
        row1Bar.appendChild(btn);
    });

    const row2Categories = CHINH_KHOA_CATEGORIES.filter(c => c.row === 2);
    row2Categories.forEach(cat => {
        let btn = document.createElement("button");
        if (cat.isGold) btn.className = "dantri-nav-btn hsg-gold-btn";
        else if (cat.isPurple) btn.className = "dantri-nav-btn padlet-purple-btn";
        else btn.className = "dantri-nav-btn";

        btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
        if (activeChinhKhoaRow2Id === cat.id) btn.classList.add("active");

        btn.onclick = function() {
            row2Bar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
            if (activeChinhKhoaRow2Id === cat.id) {
                row2Panel.classList.remove("show");
                activeChinhKhoaRow2Id = null;
            } else {
                activeChinhKhoaRow2Id = cat.id;
                btn.classList.add("active");
                renderLinkListToContainer(cat.links, row2Links, cat.visibleCount || 2);
                row2Panel.classList.add("show"); 
            }
        };
        row2Bar.appendChild(btn);
    });

    if (activeChinhKhoaRow1Id) {
        let cat1 = row1Categories.find(c => c.id === activeChinhKhoaRow1Id);
        if (cat1) renderLinkListToContainer(cat1.links, row1Links, cat1.visibleCount || 2);
    }
    if (activeChinhKhoaRow2Id) {
        let cat2 = row2Categories.find(c => c.id === activeChinhKhoaRow2Id);
        if (cat2) renderLinkListToContainer(cat2.links, row2Links, cat2.visibleCount || 2);
    }
}

function renderKhoTaiLieu() {
    const container = document.getElementById("kho-tai-lieu-container"); 
    if (!container) return;
    container.innerHTML = "";
    let details = document.createElement("details"); details.className = "folder-section";
    let summary = document.createElement("summary"); summary.className = "folder-header";
    summary.innerHTML = `<img src="${KHO_TAI_LIEU_FOLDER.folderAvatar}" class="folder-avatar" alt="Folder Icon"><h2 class="folder-title">${KHO_TAI_LIEU_FOLDER.folderName}</h2><span class="folder-arrow">&#9658;</span>`;
    details.appendChild(summary);
    let listDiv = document.createElement("div"); listDiv.className = "link-list"; renderLinkListToContainer(KHO_TAI_LIEU_FOLDER.links, listDiv, 3);
    details.appendChild(listDiv); container.appendChild(details);
}

function renderReminderSection() {
    const container = document.getElementById("reminder-container"); 
    if (!container) return;
    container.innerHTML = "";
    renderLinkListToContainer(REMINDER_CATEGORY.links, container, 5);
}

function renderNewsSection() {
    const container = document.getElementById("news-container"); 
    if (!container) return;
    container.innerHTML = "";
    NEWS_DATA.forEach(item => {
        let newsCard = document.createElement("a"); newsCard.href = item.url; newsCard.className = "news-item"; newsCard.target = "_blank";
        let imgHtml = item.image ? `<div class="news-img-box"><img src="${item.image}" class="news-img" alt="Illustration"></div>` : '';
        newsCard.innerHTML = `<div class="news-content"><div class="news-title">${item.title}</div><div class="news-date">🕒 ${item.date}</div></div>${imgHtml}`;
        container.appendChild(newsCard);
    });
}

document.addEventListener("click", function(e) {
    const panel = document.getElementById("admin-popover-panel");
    const gear = document.getElementById("gear-btn");
    const authContainer = document.getElementById("auth-container");
    const moveModal = document.getElementById("move-modal");
    const copyModal = document.getElementById("copy-modal");
    const examTimeModal = document.getElementById("exam-time-modal");
    const studentModal = document.getElementById("student-login-modal");
    const resModal = document.getElementById("result-fullscreen-modal");
    const examPickerMenu = document.getElementById("exam-picker-dropdown-list");
    const tableSettingsWrapper = document.getElementById("table-settings-wrapper");

    if (panel && panel.classList.contains("show")) {
        if (!panel.contains(e.target) && !gear.contains(e.target) && (!moveModal || !moveModal.contains(e.target)) && (!copyModal || !copyModal.contains(e.target)) && (!examTimeModal || !examTimeModal.contains(e.target)) && (!studentModal || !studentModal.contains(e.target)) && (!resModal || !resModal.contains(e.target))) {
            closeAdminPanel();
        }
    }
    if (authContainer && authContainer.classList.contains("show")) {
        if (!authContainer.contains(e.target) && !gear.contains(e.target)) {
            authContainer.classList.remove("show");
        }
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
        document.querySelectorAll('.btn-attempt-trigger.active').forEach(b => b.classList.remove('active'));
    }

    if (tableSettingsWrapper && !tableSettingsWrapper.contains(e.target)) {
        closeTableSettingsPopover();
    }
});

// KHỞI CHẠY TRANG CHỦ VÀ GẮN SỰ KIỆN PHÍM ENTER
window.onload = async function() {
    const savedDuration = localStorage.getItem("admin_duration_choice");
    const durSelect = document.getElementById("admin-expiry-select");
    if (savedDuration && durSelect) {
        durSelect.value = savedDuration;
    }

    if (checkAdminSessionValidity()) { 
        document.getElementById("gear-btn").classList.add("active-gear");
    }

    document.getElementById("top-banner-img").src = TOP_BANNER_URL;
    document.getElementById("web-avatar-img").src = WEB_AVATAR_URL;
    document.getElementById("bottom-banner-img").src = BOTTOM_BANNER_URL;
    
    initAvatarGrid();
    initTableSettings();

    const uInput = document.getElementById("st-username-input");
    const pInput = document.getElementById("st-password-input");
    const fName = document.getElementById("st-free-name-input");
    const fClass = document.getElementById("st-free-class-input");
    const fSbd = document.getElementById("st-free-sbd-input");

    if (uInput) uInput.addEventListener("keypress", function(e) { if(e.key === 'Enter') pInput.focus(); });
    if (pInput) pInput.addEventListener("keypress", function(e) { if(e.key === 'Enter') submitStudentLogin(); });
    if (fName) fName.addEventListener("keypress", function(e) { if(e.key === 'Enter') fClass.focus(); });
    if (fClass) fClass.addEventListener("keypress", function(e) { if(e.key === 'Enter') fSbd.focus(); });
    if (fSbd) fSbd.addEventListener("keypress", function(e) { if(e.key === 'Enter') submitStudentLogin(); });

    await loadDynamicLinksFromFirebase();

    renderDanTriNavBar();
    renderReminderSection();
    renderDayThemNavBar();
    renderChinhKhoaNavBar();
    renderKhoTaiLieu();
    renderNewsSection();
};
