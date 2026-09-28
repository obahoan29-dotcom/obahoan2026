// =========================================================
// FILE: app-admin.js
// QUẢN TRỊ VIÊN: BẢO MẬT, ĐĂNG ĐỀ, TÀI LIỆU, TẢI FILE GOOGLE DRIVE,
// SỬA/XÓA & THỜI GIAN LÀM BÀI
// =========================================================

let currentEditingTimeQuizId = null;
let currentEditingTimeMode = null;

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

function switchAdminTab(tabName) {
    const tabQuiz = document.getElementById("tab-btn-quiz");
    const tabDoc = document.getElementById("tab-btn-doc");
    const tabDrive = document.getElementById("tab-btn-drive");

    const contentQuiz = document.getElementById("admin-tab-quiz");
    const contentDoc = document.getElementById("admin-tab-doc");
    const contentDrive = document.getElementById("admin-tab-drive");

    if (tabQuiz) tabQuiz.classList.remove("active");
    if (tabDoc) tabDoc.classList.remove("active");
    if (tabDrive) tabDrive.classList.remove("active");

    if (contentQuiz) contentQuiz.style.display = "none";
    if (contentDoc) contentDoc.style.display = "none";
    if (contentDrive) contentDrive.style.display = "none";

    if (tabName === 'quiz') {
        if (tabQuiz) tabQuiz.classList.add("active");
        if (contentQuiz) contentQuiz.style.display = "block";
    } else if (tabName === 'drive') {
        if (tabDrive) tabDrive.classList.add("active");
        if (contentDrive) contentDrive.style.display = "block";
    } else {
        if (tabDoc) tabDoc.classList.add("active");
        if (contentDoc) contentDoc.style.display = "block";
    }
}

function autoFillDriveTitle(fileInput) {
    const titleInput = document.getElementById("admin-drive-title");
    if (fileInput.files.length > 0 && titleInput && !titleInput.value.trim()) {
        let fName = fileInput.files[0].name;
        // Bỏ đuôi mở rộng hiển thị đẹp hơn
        let cleanName = fName.replace(/\.[^/.]+$/, "");
        titleInput.value = cleanName;
    }
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
            parsedData.allowFree = true;
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
                allowFree: true,
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

// HÀM MỚI: TẢI FILE PDF / WORD LÊN GOOGLE DRIVE THÔNG QUA GAS TÀI KHOẢN MỚI
async function processUploadToGoogleDrive() {
    const fileInput = document.getElementById("admin-drive-file");
    const titleInput = document.getElementById("admin-drive-title");
    const category = document.getElementById("admin-category-select").value;
    const btn = document.getElementById("btn-upload-drive");
    const statusBox = document.getElementById("drive-upload-status");

    if (!fileInput || fileInput.files.length === 0) {
        alert("⚠️ Vui lòng chọn file PDF hoặc Word trên máy tính!");
        return;
    }

    if (!GOOGLE_DRIVE_UPLOAD_GAS_URL || GOOGLE_DRIVE_UPLOAD_GAS_URL.includes("DÁN_URL")) {
        alert("⚠️ Bạn chưa cấu hình GOOGLE_DRIVE_UPLOAD_GAS_URL trong file app-config.js!\nVui lòng dán URL Web App triển khai từ Google Apps Script vào.");
        return;
    }

    const file = fileInput.files[0];

    // Giới hạn 25MB tránh vượt quá payload của GAS
    if (file.size > 25 * 1024 * 1024) {
        alert("⚠️ Dung lượng file quá lớn (> 25MB). Vui lòng chọn file nhẹ hơn để tải mượt mà!");
        return;
    }

    let finalTitle = titleInput.value.trim();
    if (!finalTitle) {
        finalTitle = file.name;
    }

    btn.disabled = true;
    btn.innerText = "⏳ Đang chuyển đổi...";
    if (statusBox) {
        statusBox.style.display = "block";
        statusBox.innerText = `⏳ Đang đọc file "${file.name}"...`;
    }

    try {
        const reader = new FileReader();

        reader.onload = async function(e) {
            try {
                const base64Data = e.target.result;

                btn.innerText = "🚀 Đang tải lên Drive...";
                if (statusBox) statusBox.innerText = "🚀 Đang gửi file lên Google Drive...";

                const payload = {
                    filename: file.name,
                    mimeType: file.type || "application/octet-stream",
                    base64: base64Data
                };

                // Dùng text/plain để tránh preflight OPTIONS CORS của Google Apps Script
                const res = await fetch(GOOGLE_DRIVE_UPLOAD_GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();

                if (result.status === "success" && result.fileUrl) {
                    btn.innerText = "💾 Đang lưu hệ thống...";
                    if (statusBox) statusBox.innerText = "💾 Đang tạo mục liên kết trên website...";

                    const docId = "doc_" + Date.now();
                    const now = new Date();
                    const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                    
                    const linkData = { 
                        title: finalTitle, 
                        date: dateStr, 
                        url: result.fileUrl, 
                        badgeText: "MỚI", 
                        isHot: false, 
                        isDoc: true, 
                        avatar: selectedAvatarUrl, 
                        timestamp: Date.now(),
                        categoryId: category
                    };

                    await fetch(`${FIREBASE_DB_URL}/custom_links/${category}/${docId}.json`, { 
                        method: 'PUT', 
                        body: JSON.stringify(linkData) 
                    });

                    alert(`🎉 Tải file lên Google Drive thành công!\n📁 Tên: ${finalTitle}\n🔗 Đã thêm vào chuyên mục: ${getCategoryDisplayName(category)}`);
                    window.location.reload();
                } else {
                    throw new Error(result.message || "Máy chủ Google Drive không phản hồi đường dẫn file!");
                }
            } catch(uploadErr) {
                console.error("Lỗi upload Drive:", uploadErr);
                alert("❌ Lỗi khi tải file lên Google Drive: " + uploadErr.message);
                btn.disabled = false;
                btn.innerText = "📤 Tải lên Drive";
                if (statusBox) statusBox.style.display = "none";
            }
        };

        reader.readAsDataURL(file);

    } catch (err) {
        alert("❌ Lỗi đọc file: " + err.message);
        btn.disabled = false;
        btn.innerText = "📤 Tải lên Drive";
        if (statusBox) statusBox.style.display = "none";
    }
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
    finally { btn.innerText = "🔗 Đăng tài liệu"; btn.disabled = false; }
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
    const btn = document.querySelector("#copy-modal .move-btn-submit");
    if (btn) { btn.disabled = true; btn.innerText = "⏳ Đang sao chép..."; }

    try {
        const isDoc = currentCopyData.itemData.isDoc;
        const newItemId = (isDoc ? "doc_" : "quiz_") + Date.now();
        let itemUrl = currentCopyData.itemData.url || "";

        if (!isDoc) {
            let oldQuizId = extractQuizIdFromItem(currentCopyData.itemData);
            if (oldQuizId) {
                try {
                    const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${oldQuizId}.json`);
                    const quizData = await res.json();
                    if (quizData) {
                        await fetch(`${FIREBASE_DB_URL}/quizzes/${newItemId}.json`, {
                            method: 'PUT',
                            body: JSON.stringify(quizData)
                        });
                    }
                } catch(e) {
                    console.error("Lỗi nhân bản quiz:", e);
                }
            }
            itemUrl = `./thi.html?id=${newItemId}&cat=${encodeURIComponent(destCategory)}`;
        } else {
            try {
                if (itemUrl.includes("thi.html")) {
                    let u = new URL(itemUrl, window.location.href);
                    u.searchParams.set("cat", destCategory);
                    itemUrl = u.pathname + u.search + u.hash;
                }
            } catch(e) {}
        }

        const copyData = { 
            ...currentCopyData.itemData, 
            id: newItemId,
            firebaseId: newItemId,
            categoryId: destCategory, 
            url: itemUrl,
            timestamp: Date.now() 
        }; 

        await fetch(`${FIREBASE_DB_URL}/custom_links/${destCategory}/${newItemId}.json`, { 
            method: 'PUT', body: JSON.stringify(copyData) 
        });

        alert("📋 Đã sao chép sang mục mới thành công!");
        window.location.reload();
    } catch(e) { 
        alert("Lỗi khi sao chép: " + e.message); 
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = "Sao chép"; }
    }
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
            payload.timeUpdatedAt = Date.now();
        } else if (currentEditingTimeMode === 'schedule') {
            const startVal = document.getElementById("edit-start-time").value;
            const endVal = document.getElementById("edit-end-time").value;
            if (startVal) payload.examStartTimeStr = startVal;
            if (endVal) payload.examEndTimeStr = endVal;
            payload.scheduleUpdatedAt = Date.now();
        }

        await fetch(`${FIREBASE_DB_URL}/quizzes/${currentEditingTimeQuizId}.json`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        await fetch(`${FIREBASE_DB_URL}/exam_configs/${currentEditingTimeQuizId}.json`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        }).catch(() => null);

        for (let cat of [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES]) {
            if (cat.links) {
                let match = cat.links.find(l => (l.firebaseId === currentEditingTimeQuizId || l.id === currentEditingTimeQuizId));
                if (match) {
                    if (payload.timeLimitMinutes) match.timeLimitMinutes = payload.timeLimitMinutes;
                    if (payload.examStartTimeStr) match.examStartTimeStr = payload.examStartTimeStr;
                    if (payload.examEndTimeStr) match.examEndTimeStr = payload.examEndTimeStr;

                    fetch(`${FIREBASE_DB_URL}/custom_links/${cat.id}/${currentEditingTimeQuizId}.json`, {
                        method: 'PATCH',
                        body: JSON.stringify(payload)
                    }).catch(() => null);
                }
            }
        }

        alert("✅ Đã cập nhật thời gian đề thi thành công! Học sinh đang làm bài sẽ nhận được ngay lập tức.");
        closeExamTimeModal();
    } catch(e) {
        alert("❌ Lỗi khi lưu cấu hình thời gian: " + e.message);
    } finally {
        btn.innerText = "Lưu cấu hình"; btn.disabled = false;
    }
}

async function toggleAllowFreeExam(categoryId, itemId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const chk = document.getElementById(`free-toggle-${itemId}`);
    const txt = document.getElementById(`free-status-txt-${itemId}`);

    const currentState = chk ? chk.checked : true;
    const newState = !currentState;

    if (chk) chk.checked = newState;
    if (txt) {
        txt.innerText = newState ? 'BẬT' : 'TẮT';
        txt.className = `free-toggle-status ${newState ? 'st-on' : 'st-off'}`;
    }

    let linkedQuizId = null;
    const updateLinksList = (catList) => {
        catList.forEach(c => {
            if (c.id === categoryId && c.links) {
                const found = c.links.find(l => (l.firebaseId === itemId || l.id === itemId));
                if (found) {
                    found.allowFree = newState;
                    linkedQuizId = extractQuizIdFromItem(found);
                }
            }
        });
    };
    updateLinksList(DAY_THEM_CATEGORIES);
    updateLinksList(CHINH_KHOA_CATEGORIES);

    try {
        localStorage.setItem(`exam_allow_free_${itemId}`, String(newState));
        if (linkedQuizId) {
            localStorage.setItem(`exam_allow_free_${linkedQuizId}`, String(newState));
        }
    } catch(e) {}

    try {
        const payload = { allowFree: newState };
        fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        }).catch(e => console.error("Firebase custom_links patch error:", e));

        const targetQuizId = linkedQuizId || (itemId.startsWith('quiz_') ? itemId : null);
        if (targetQuizId) {
            fetch(`${FIREBASE_DB_URL}/quizzes/${targetQuizId}.json`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            }).catch(e => console.error("Firebase quizzes patch error:", e));
        }
    } catch(err) {
        console.error("Lỗi cập nhật trạng thái thi tự do:", err);
    }
}

async function toggleShuffle(categoryId, itemId, isChecked, event) {
    event.stopPropagation();
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ isShuffled: isChecked }) });
        await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ isShuffled: isChecked }) });
    } catch(e) { alert("❌ Lỗi đổi trạng thái đảo đề!"); }
}