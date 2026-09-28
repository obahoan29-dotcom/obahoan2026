// =========================================================
// FILE: app-admin.js
// QUẢN TRỊ VIÊN: BẢO MẬT, ĐĂNG ĐỀ, TẢI FILE GOOGLE DRIVE,
// SỬA/XÓA, SAO CHÉP & CẤU HÌNH THỜI GIAN LÀM BÀI
// =========================================================

let currentEditingTimeQuizId = null;
let currentEditingTimeMode = null;

// HÀM ĐỌC NỘI DUNG TỪ BẤT KỲ FILE JS / TXT / JSON
function parseScriptOrJson(content) {
    if (!content) return null;
    let clean = String(content).trim();
    clean = clean.replace(/^\s*(?:const|let|var)\s+[a-zA-Z0-9_$]+\s*=\s*/, '').trim();
    if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();

    try {
        return JSON.parse(clean);
    } catch (e) {
        try {
            return new Function("return (" + clean + ");")();
        } catch (e2) {
            return new Function(content + "\n; return (typeof examData !== 'undefined' ? examData : (typeof dapanData !== 'undefined' ? dapanData : null));")();
        }
    }
}

// GỘP CÂU HỎI VÀ ĐÁP ÁN
function mergeQuestionsAndAnswers(examObj, answerObj) {
    if (!examObj || !examObj.questions || !answerObj) return examObj;
    const answersMap = answerObj.answers || answerObj.dapan || answerObj;

    examObj.questions.forEach((q, idx) => {
        const qKey = String(q.id || (idx + 1));
        const itemAns = answersMap[qKey] || answersMap[q.id];

        if (itemAns !== undefined) {
            if (typeof itemAns === 'object' && itemAns !== null) {
                if (itemAns.correct !== undefined) q.correct = itemAns.correct;
                if (itemAns.correctAnswer !== undefined) q.correctAnswer = itemAns.correctAnswer;
                if (itemAns.explanation !== undefined) q.explanation = itemAns.explanation;

                if (itemAns.statements && q.statements) {
                    q.statements.forEach(st => {
                        if (itemAns.statements[st.id] !== undefined) {
                            st.correct = itemAns.statements[st.id];
                        }
                    });
                }
            } else {
                if (q.type === 'multiple_choice') q.correct = itemAns;
                else q.correctAnswer = String(itemAns);
            }
        }
    });

    return examObj;
}

function getSelectedAdminCategories() {
    const checkboxes = document.querySelectorAll('input[name="admin-cat-checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function toggleAllAdminCategories(checkAll) {
    const checkboxes = document.querySelectorAll('input[name="admin-cat-checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checkAll;
        const parentLabel = cb.closest('.cat-checkbox-item');
        if (parentLabel) {
            if (checkAll) parentLabel.classList.add('checked');
            else parentLabel.classList.remove('checked');
        }
    });
}

function handleCatCheckboxChange(checkbox) {
    const parentLabel = checkbox.closest('.cat-checkbox-item');
    if (parentLabel) {
        if (checkbox.checked) parentLabel.classList.add('checked');
        else parentLabel.classList.remove('checked');
    }
}

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
    if (!input) return;
    if (input.type === "password") {
        input.type = "text";
        if (btn) { btn.innerText = "🙈"; btn.title = "Ẩn"; }
    } else {
        input.type = "password";
        if (btn) { btn.innerText = "👁️"; btn.title = "Hiện"; }
    }
}

function toggleAdminPanel(e) {
    if (e) e.stopPropagation();
    const authContainer = document.getElementById("auth-container");
    const panel = document.getElementById("admin-popover-panel");
    const gear = document.getElementById("gear-btn");

    if (checkAdminSessionValidity()) {
        if (panel && panel.classList.contains("show")) { closeAdminPanel(); } 
        else if (panel) { panel.classList.add("show"); if (gear) gear.classList.add("active-gear"); }
    } else {
        if (authContainer) {
            authContainer.classList.toggle("show");
            if (authContainer.classList.contains("show")) document.getElementById("admin-pass-input").focus();
        }
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
    } catch (e) {}
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
        } catch (e) {}

        const authBox = document.getElementById("auth-container");
        const popPanel = document.getElementById("admin-popover-panel");
        const gear = document.getElementById("gear-btn");
        if (authBox) authBox.classList.remove("show");
        if (popPanel) popPanel.classList.add("show");
        if (gear) gear.classList.add("active-gear");
        document.getElementById("admin-pass-input").value = "";

        if (typeof refreshAllViews === "function") refreshAllViews();
    } else {
        alert("❌ Sai mật khẩu quản trị!");
    }
}

function logoutAdmin(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    isAdminLoggedIn = false;
    try {
        localStorage.removeItem("adminLoggedInSession");
        localStorage.removeItem("admin_expires_at");
        sessionStorage.removeItem("adminLoggedInSession");
    } catch (e) {}
    closeAdminPanel();
    const gear = document.getElementById("gear-btn");
    if (gear) gear.classList.remove("active-gear");
    if (typeof refreshAllViews === "function") refreshAllViews();
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
        titleInput.value = fName.replace(/\.[^/.]+$/, "");
    }
}

function readFileAsTextAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = err => reject(err);
        reader.readAsText(file);
    });
}

// TẠO ĐỀ THI VÀ ĐĂNG ĐỒNG THỜI VÀO CÁC LỚP ĐƯỢC CHỌN
async function processUpload() {
    const fileInput = document.getElementById("admin-file-upload");
    const answerFileInput = document.getElementById("admin-answer-file-upload");
    const customTitleInput = document.getElementById("admin-quiz-custom-title");
    const categories = getSelectedAdminCategories();
    const btn = document.getElementById("btn-create-quiz");

    if (categories.length === 0) {
        alert("⚠️ Vui lòng tích chọn ít nhất 1 lớp / chuyên mục để đăng đề!");
        return;
    }
    if (!fileInput || fileInput.files.length === 0) {
        alert("⚠️ Vui lòng chọn file đề thi (questions.js / .txt / .json)!");
        return;
    }

    btn.innerText = "⏳ Đang xử lý..."; btn.disabled = true;

    try {
        const qContent = await readFileAsTextAsync(fileInput.files[0]);
        let parsedExam = parseScriptOrJson(qContent);

        if (!parsedExam || !parsedExam.questions) {
            throw new Error("File đề thi không đúng cấu trúc (thiếu trường questions)!");
        }

        if (answerFileInput && answerFileInput.files.length > 0) {
            const aContent = await readFileAsTextAsync(answerFileInput.files[0]);
            let parsedAnswers = parseScriptOrJson(aContent);
            if (parsedAnswers) {
                parsedExam = mergeQuestionsAndAnswers(parsedExam, parsedAnswers);
            }
        }

        const customTitle = customTitleInput ? customTitleInput.value.trim() : "";
        if (customTitle) parsedExam.title = customTitle;
        if (!parsedExam.title) parsedExam.title = fileInput.files[0].name.replace(/\.[^/.]+$/, "");

        parsedExam.isShuffled = true;
        parsedExam.allowFree = true;

        const quizId = "quiz_" + Date.now();
        await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, {
            method: 'PUT',
            body: JSON.stringify(parsedExam)
        });

        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

        const uploadTasks = categories.map(cat => {
            const linkData = {
                title: parsedExam.title,
                date: dateStr,
                url: `./thi.html?id=${quizId}&cat=${encodeURIComponent(cat)}`,
                badgeText: "HOT",
                isHot: true,
                isDoc: false,
                avatar: selectedAvatarUrl,
                timestamp: Date.now(),
                isShuffled: true,
                allowFree: true,
                categoryId: cat
            };
            return fetch(`${FIREBASE_DB_URL}/custom_links/${cat}/${quizId}.json`, {
                method: 'PUT',
                body: JSON.stringify(linkData)
            });
        });

        await Promise.all(uploadTasks);
        const catNames = categories.map(c => getCategoryDisplayName(c)).join(", ");
        alert(`✨ Đăng đề thi "${parsedExam.title}" thành công vào: ${catNames}!`);
        window.location.reload();
    } catch (err) {
        alert("❌ Lỗi: " + err.message);
    } finally {
        btn.innerText = "✨ Đăng đề thi";
        btn.disabled = false;
    }
}

// TẢI FILE PDF / WORD LÊN GOOGLE DRIVE
async function processUploadToGoogleDrive() {
    const fileInput = document.getElementById("admin-drive-file");
    const titleInput = document.getElementById("admin-drive-title");
    const categories = getSelectedAdminCategories();
    const btn = document.getElementById("btn-upload-drive");
    const statusBox = document.getElementById("drive-upload-status");

    if (categories.length === 0) {
        alert("⚠️ Vui lòng tích chọn ít nhất 1 lớp / chuyên mục để đăng tài liệu!");
        return;
    }
    if (!fileInput || fileInput.files.length === 0) {
        alert("⚠️ Vui lòng chọn file PDF hoặc Word trên máy tính!");
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 25 * 1024 * 1024) {
        alert("⚠️ Dung lượng file quá lớn (> 25MB). Vui lòng chọn file nhẹ hơn!");
        return;
    }

    let finalTitle = titleInput.value.trim() || file.name;
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

                    const saveTasks = categories.map(cat => {
                        const linkData = {
                            title: finalTitle,
                            date: dateStr,
                            url: result.fileUrl,
                            badgeText: "MỚI",
                            isHot: false,
                            isDoc: true,
                            avatar: selectedAvatarUrl,
                            timestamp: Date.now(),
                            categoryId: cat
                        };
                        return fetch(`${FIREBASE_DB_URL}/custom_links/${cat}/${docId}.json`, {
                            method: 'PUT',
                            body: JSON.stringify(linkData)
                        });
                    });

                    await Promise.all(saveTasks);
                    const catNames = categories.map(c => getCategoryDisplayName(c)).join(", ");
                    alert(`🎉 Tải file lên Google Drive thành công!\n📁 Tên: ${finalTitle}\n🔗 Đã thêm vào: ${catNames}`);
                    window.location.reload();
                } else {
                    throw new Error(result.message || "Máy chủ Google Drive không phản hồi đường link file!");
                }
            } catch (uploadErr) {
                alert("❌ Lỗi khi tải file lên Drive: " + uploadErr.message);
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

// ĐĂNG LINK LIÊN KẾT WEB
async function processAddDocument() {
    const titleInput = document.getElementById("admin-doc-title").value.trim();
    const urlInput = document.getElementById("admin-doc-url").value.trim();
    const categories = getSelectedAdminCategories();
    const btn = document.getElementById("btn-create-doc");

    if (categories.length === 0) {
        alert("⚠️ Vui lòng tích chọn ít nhất 1 lớp / chuyên mục để đăng!");
        return;
    }
    if (!titleInput || !urlInput) {
        alert("⚠️ Vui lòng nhập đủ tên tài liệu và link!");
        return;
    }

    btn.innerText = "⏳ Đang đăng..."; btn.disabled = true;

    try {
        const docId = "doc_" + Date.now();
        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

        const tasks = categories.map(cat => {
            const linkData = {
                title: titleInput, date: dateStr, url: urlInput,
                badgeText: "NONE", isHot: false, isDoc: true,
                avatar: selectedAvatarUrl, timestamp: Date.now(),
                categoryId: cat
            };
            return fetch(`${FIREBASE_DB_URL}/custom_links/${cat}/${docId}.json`, {
                method: 'PUT',
                body: JSON.stringify(linkData)
            });
        });

        await Promise.all(tasks);
        const catNames = categories.map(c => getCategoryDisplayName(c)).join(", ");
        alert(`📤 Đăng tài liệu thành công vào: ${catNames}!`);
        window.location.reload();
    } catch (err) {
        alert("❌ Lỗi: " + err.message);
    } finally {
        btn.innerText = "🔗 Đăng tài liệu"; btn.disabled = false;
    }
}

async function deleteItem(categoryId, itemId, event) {
    event.preventDefault(); event.stopPropagation();
    if (!confirm("⚠️ Bạn có chắc chắn muốn XÓA vĩnh viễn mục này không?")) return;
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'DELETE' });
        if (itemId.startsWith('quiz_')) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'DELETE' });
        }
        window.location.reload();
    } catch (e) { alert("Lỗi khi xóa!"); }
}

async function renameItem(categoryId, itemId, isDoc, currentTitle, event) {
    event.preventDefault(); event.stopPropagation();
    let newTitle = prompt("✏️ Nhập tên mới:", currentTitle);
    if (newTitle !== null && newTitle.trim() !== "" && newTitle.trim() !== currentTitle) {
        try {
            await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
                method: 'PATCH', body: JSON.stringify({ title: newTitle.trim() })
            });
            if (!isDoc && itemId.startsWith('quiz_')) {
                await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, {
                    method: 'PATCH', body: JSON.stringify({ title: newTitle.trim() })
                });
            }
            window.location.reload();
        } catch (e) { alert("Lỗi khi sửa tên!"); }
    }
}

async function moveItemOrder(categoryId, currentId, direction, event) {
    event.preventDefault(); event.stopPropagation();
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}.json`);
        const data = await res.json();
        if (!data) return;

        let arr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        arr.forEach(item => { if (!item.timestamp) item.timestamp = parseDateString(item.date); });

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
    } catch (e) { alert("Lỗi khi đổi thứ tự!"); }
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
    if (newCategory === currentMoveData.oldCategory) { alert("Đã nằm ở mục này rồi!"); return; }
    try {
        let itemUrl = currentMoveData.quizData.url || "";
        try {
            if (itemUrl.includes("thi.html")) {
                let u = new URL(itemUrl, window.location.href);
                u.searchParams.set("cat", newCategory);
                itemUrl = u.pathname + u.search + u.hash;
            }
        } catch (e) {}

        let updatedData = { ...currentMoveData.quizData, categoryId: newCategory, url: itemUrl };
        await fetch(`${FIREBASE_DB_URL}/custom_links/${newCategory}/${currentMoveData.quizId}.json`, { method: 'PUT', body: JSON.stringify(updatedData) });
        await fetch(`${FIREBASE_DB_URL}/custom_links/${currentMoveData.oldCategory}/${currentMoveData.quizId}.json`, { method: 'DELETE' });
        window.location.reload();
    } catch (e) { alert("Lỗi khi chuyển!"); }
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
                const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${oldQuizId}.json`);
                const quizData = await res.json();
                if (quizData) {
                    await fetch(`${FIREBASE_DB_URL}/quizzes/${newItemId}.json`, {
                        method: 'PUT', body: JSON.stringify(quizData)
                    });
                }
            }
            itemUrl = `./thi.html?id=${newItemId}&cat=${encodeURIComponent(destCategory)}`;
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
    } catch (e) {
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
    } catch (e) {}

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
    } catch (e) {}

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
            method: 'PATCH', body: JSON.stringify(payload)
        });

        alert("✅ Đã cập nhật cấu hình thời gian bài thi thành công!");
        closeExamTimeModal();
        window.location.reload();
    } catch (e) {
        alert("❌ Lỗi khi lưu cấu hình thời gian: " + e.message);
    } finally {
        btn.innerText = "Lưu cấu hình"; btn.disabled = false;
    }
}

async function toggleAllowFreeExam(categoryId, itemId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const chk = document.getElementById(`free-toggle-${itemId}`);
    const txt = document.getElementById(`free-status-txt-${itemId}`);
    const currentState = chk ? chk.checked : true;
    const newState = !currentState;

    if (chk) chk.checked = newState;
    if (txt) {
        txt.innerText = newState ? 'BẬT' : 'TẮT';
        txt.className = `free-toggle-status ${newState ? 'st-on' : 'st-off'}`;
    }

    try {
        localStorage.setItem(`exam_allow_free_${itemId}`, String(newState));
        const payload = { allowFree: newState };
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: 'PATCH', body: JSON.stringify(payload)
        });

        if (itemId.startsWith('quiz_')) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, {
                method: 'PATCH', body: JSON.stringify(payload)
            });
        }
    } catch (err) {
        console.error("Lỗi cập nhật trạng thái tự do:", err);
    }
}

async function toggleShuffle(categoryId, itemId, isChecked, event) {
    event.stopPropagation();
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: 'PATCH', body: JSON.stringify({ isShuffled: isChecked })
        });
        if (itemId.startsWith('quiz_')) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, {
                method: 'PATCH', body: JSON.stringify({ isShuffled: isChecked })
            });
        }
    } catch (e) {
        alert("❌ Lỗi đổi trạng thái đảo đề!");
    }
}