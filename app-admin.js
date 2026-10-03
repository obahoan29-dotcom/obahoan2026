// =========================================================
// FILE: app-admin.js
// QUẢN LÝ QUYỀN QUẢN TRỊ VIÊN, ĐĂNG ĐỀ THI, TẢI DRIVE,
// CẤU HÌNH THỜI GIAN, SAO CHÉP / CHUYỂN LỚP & BÀI BÁO NHẮC NHỞ
// =========================================================

let currentEditingQuizId = null;
let currentTimeEditMode = null; // 'minutes' | 'schedule'
let currentEditingArticleId = null;
let currentArticleBase64Image = "";

// ---------------------------------------------------------
// KIỂM TRA PHIÊN ĐĂNG NHẬP VÀ XÁC THỰC ADMIN
// ---------------------------------------------------------
function checkAdminSessionValidity() {
    try {
        const expiry = safeLocal.getItem("admin_session_expiry");
        if (expiry) {
            const expTime = parseInt(expiry, 10);
            if (Date.now() < expTime) {
                isAdminLoggedIn = true;
            } else {
                logoutAdmin(null, false);
            }
        } else {
            isAdminLoggedIn = false;
        }
    } catch (e) {
        isAdminLoggedIn = false;
    }
}

function toggleAdminPanel(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const authContainer = document.getElementById("auth-container");
    const adminPanel = document.getElementById("admin-popover-panel");

    if (!isAdminLoggedIn) {
        if (authContainer) {
            authContainer.classList.toggle("show");
            if (authContainer.classList.contains("show")) {
                const passInput = document.getElementById("admin-pass-input");
                if (passInput) setTimeout(() => passInput.focus(), 150);
            }
        }
    } else {
        if (adminPanel) {
            adminPanel.classList.toggle("show");
            if (adminPanel.classList.contains("show")) {
                initAvatarGrid();
            }
        }
    }
}

function togglePasswordVisibility() {
    const passInput = document.getElementById("admin-pass-input");
    const eyeBtn = document.getElementById("eye-toggle-btn");
    if (!passInput) return;
    if (passInput.type === "password") {
        passInput.type = "text";
        if (eyeBtn) eyeBtn.innerText = "🙈";
    } else {
        passInput.type = "password";
        if (eyeBtn) eyeBtn.innerText = "👁️";
    }
}

function handleEnter(event) {
    if (event.key === "Enter") {
        checkAdminPassword();
    }
}

function checkAdminPassword() {
    const passInput = document.getElementById("admin-pass-input");
    const val = (passInput ? passInput.value : "").trim();

    if (val === ADMIN_PASSWORD) {
        const expirySelect = document.getElementById("admin-expiry-select");
        const expVal = expirySelect ? expirySelect.value : "1d";
        
        let durationMs = 24 * 3600 * 1000;
        if (expVal === "1h") durationMs = 3600 * 1000;
        else if (expVal === "2h") durationMs = 2 * 3600 * 1000;
        else if (expVal === "4h") durationMs = 4 * 3600 * 1000;
        else if (expVal === "8h") durationMs = 8 * 3600 * 1000;
        else if (expVal === "1d") durationMs = 24 * 3600 * 1000;
        else if (expVal === "3d") durationMs = 3 * 24 * 3600 * 1000;
        else if (expVal === "7d") durationMs = 7 * 24 * 3600 * 1000;
        else if (expVal === "30d") durationMs = 30 * 24 * 3600 * 1000;

        safeLocal.setItem("admin_session_expiry", String(Date.now() + durationMs));
        isAdminLoggedIn = true;

        const authContainer = document.getElementById("auth-container");
        if (authContainer) authContainer.classList.remove("show");
        if (passInput) passInput.value = "";

        const adminPanel = document.getElementById("admin-popover-panel");
        if (adminPanel) adminPanel.classList.add("show");

        initAvatarGrid();
        refreshAllViews();
        alert("✅ Xác thực quyền Quản trị viên thành công!");
    } else {
        alert("❌ Mật khẩu quản trị không chính xác!");
    }
}

function logoutAdmin(event, notify = true) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    isAdminLoggedIn = false;
    safeLocal.removeItem("admin_session_expiry");

    closeAdminPanel();
    refreshAllViews();
    if (notify) alert("🔒 Đã khóa quyền quản trị viên!");
}

function closeAdminPanel() {
    const authContainer = document.getElementById("auth-container");
    const adminPanel = document.getElementById("admin-popover-panel");
    if (authContainer) authContainer.classList.remove("show");
    if (adminPanel) adminPanel.classList.remove("show");
}

// ---------------------------------------------------------
// TÙY CHỈNH TAB & AVATAR TRONG BẢNG QUẢN TRỊ
// ---------------------------------------------------------
function switchAdminTab(tab) {
    const tabQuiz = document.getElementById("admin-tab-quiz");
    const tabDrive = document.getElementById("admin-tab-drive");
    const tabDoc = document.getElementById("admin-tab-doc");

    const btnQuiz = document.getElementById("tab-btn-quiz");
    const btnDrive = document.getElementById("tab-btn-drive");
    const btnDoc = document.getElementById("tab-btn-doc");

    if (btnQuiz) btnQuiz.classList.remove("active");
    if (btnDrive) btnDrive.classList.remove("active");
    if (btnDoc) btnDoc.classList.remove("active");

    if (tabQuiz) tabQuiz.style.display = "none";
    if (tabDrive) tabDrive.style.display = "none";
    if (tabDoc) tabDoc.style.display = "none";

    if (tab === "quiz") {
        if (btnQuiz) btnQuiz.classList.add("active");
        if (tabQuiz) tabQuiz.style.display = "block";
    } else if (tab === "drive") {
        if (btnDrive) btnDrive.classList.add("active");
        if (tabDrive) tabDrive.style.display = "block";
    } else if (tab === "doc") {
        if (btnDoc) btnDoc.classList.add("active");
        if (tabDoc) tabDoc.style.display = "block";
    }
}

function initAvatarGrid() {
    const grid = document.getElementById("avatar-grid");
    if (!grid || grid.children.length > 0) return;

    if (!selectedAvatarUrl) {
        selectedAvatarUrl = PRESET_AVATARS[0];
    }

    PRESET_AVATARS.forEach((url, idx) => {
        const img = document.createElement("img");
        img.src = url;
        img.className = "avatar-option" + (url === selectedAvatarUrl ? " selected" : "");
        img.title = `Avatar ${idx + 1}`;
        img.onclick = () => {
            selectedAvatarUrl = url;
            grid.querySelectorAll(".avatar-option").forEach(el => el.classList.remove("selected"));
            img.classList.add("selected");
        };
        grid.appendChild(img);
    });
}

function toggleAllAdminCategories(checkAll) {
    const checkboxes = document.querySelectorAll('input[name="admin-cat-checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checkAll;
        handleCatCheckboxChange(cb);
    });
}

function handleCatCheckboxChange(cb) {
    if (!cb) return;
    const parentLabel = cb.closest(".cat-checkbox-item");
    if (parentLabel) {
        if (cb.checked) parentLabel.classList.add("checked");
        else parentLabel.classList.remove("checked");
    }
}

function getSelectedAdminCategories() {
    const checkboxes = document.querySelectorAll('input[name="admin-cat-checkbox"]:checked');
    const selected = [];
    checkboxes.forEach(cb => selected.push(cb.value));
    return selected;
}

function autoFillDriveTitle(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const fileName = input.files[0].name;
    const titleInput = document.getElementById("admin-drive-title");
    if (titleInput && !titleInput.value.trim()) {
        titleInput.value = fileName;
    }
}

// ---------------------------------------------------------
// HỖ TRỢ ĐỌC VÀ PHÂN TÍCH FILE JS / JSON ĐỀ THI
// ---------------------------------------------------------
function readFileAsTextAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(new Error("Không thể đọc file"));
        reader.readAsText(file, "UTF-8");
    });
}

function parseScriptOrJson(text) {
    if (!text || typeof text !== "string") return null;
    let clean = text.trim();

    try {
        return JSON.parse(clean);
    } catch (e) {}

    try {
        const runFn = new Function(`
            let examData = null;
            let dapanData = null;
            let questionsData = null;
            let data = null;
            ${clean}
            return examData || dapanData || questionsData || data || (typeof window !== 'undefined' ? (window.examData || window.dapanData) : null);
        `);
        const res = runFn();
        if (res && typeof res === "object") return res;
    } catch (err) {}

    const objMatch = clean.match(/\{[\s\S]*\}/);
    if (objMatch) {
        try {
            const fallbackFn = new Function(`return (${objMatch[0]});`);
            return fallbackFn();
        } catch (e2) {}
    }

    return null;
}

function mergeQuestionsAndAnswers(examDataObj, dapanDataObj) {
    if (!examDataObj || !examDataObj.questions) return examDataObj;
    if (!dapanDataObj) return examDataObj;

    const answersMap = dapanDataObj.answers || dapanDataObj.dapan || dapanDataObj;
    if (!answersMap || typeof answersMap !== "object") return examDataObj;

    const letters = ["A", "B", "C", "D"];

    examDataObj.questions.forEach(q => {
        const key = String(q.id);
        const ans = answersMap[key] || answersMap[q.id];
        if (!ans) return;

        if (ans.explanation) q.explanation = ans.explanation;

        if (q.type === "multiple_choice") {
            if (ans.correct !== undefined) {
                if (typeof ans.correct === "number") {
                    q.correct = ans.correct;
                } else if (typeof ans.correct === "string") {
                    let idx = letters.indexOf(ans.correct.trim().toUpperCase());
                    if (idx !== -1) q.correct = idx;
                }
            }
        } else if (q.type === "true_false") {
            if (ans.statements && q.statements) {
                q.statements.forEach(st => {
                    if (ans.statements[st.id] !== undefined) {
                        st.correct = Boolean(ans.statements[st.id]);
                    }
                });
            }
        } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") {
            if (ans.correctAnswer !== undefined) {
                q.correctAnswer = String(ans.correctAnswer).trim();
            }
        }
    });

    return examDataObj;
}

// ---------------------------------------------------------
// ĐĂNG ĐỀ THI (TAB 1)
// ---------------------------------------------------------
async function processUpload() {
    const fileInput = document.getElementById("admin-file-upload");
    const ansFileInput = document.getElementById("admin-answer-file-upload");
    const customTitle = (document.getElementById("admin-quiz-custom-title").value || "").trim();
    const btn = document.getElementById("btn-create-quiz");

    const selectedCats = getSelectedAdminCategories();
    if (selectedCats.length === 0) {
        alert("⚠️ Vui lòng chọn ít nhất 01 lớp / chuyên mục để đăng đề!");
        return;
    }

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("⚠️ Vui lòng chọn file đề thi (questions.js / .json / .txt)!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "⏳ Đang xử lý file...";

    try {
        const questionText = await readFileAsTextAsync(fileInput.files[0]);
        let parsedExam = parseScriptOrJson(questionText);

        if (!parsedExam || !parsedExam.questions || !Array.isArray(parsedExam.questions)) {
            throw new Error("Cấu trúc file đề thi không hợp lệ! Cần chứa mảng 'questions'.");
        }

        if (ansFileInput && ansFileInput.files && ansFileInput.files.length > 0) {
            btn.innerText = "⏳ Đang ghép đáp án...";
            const ansText = await readFileAsTextAsync(ansFileInput.files[0]);
            const parsedAns = parseScriptOrJson(ansText);
            if (parsedAns) {
                parsedExam = mergeQuestionsAndAnswers(parsedExam, parsedAns);
            }
        }

        const finalTitle = customTitle || parsedExam.title || "Bài kiểm tra trực tuyến";
        parsedExam.title = finalTitle;

        const quizId = "quiz_" + Date.now();
        parsedExam.quizId = quizId;

        btn.innerText = "⏳ Đang tải lên cơ sở dữ liệu...";

        await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsedExam)
        });

        const autoDateStr = formatVietnameseDateTime(Date.now());
        const linkPayload = {
            id: quizId,
            firebaseId: quizId,
            title: finalTitle,
            url: `thi.html?id=${quizId}`,
            date: autoDateStr,
            formattedDate: autoDateStr,
            timestamp: Date.now(),
            badgeText: "HOT",
            isDoc: false,
            avatar: selectedAvatarUrl || PRESET_AVATARS[0],
            timeLimitMinutes: parsedExam.timeLimitMinutes || 90,
            examStartTimeStr: parsedExam.examStartTimeStr || toLocalDatetimeString(new Date()),
            examEndTimeStr: parsedExam.examEndTimeStr || toLocalDatetimeString(new Date(Date.now() + 15 * 86400000)),
            allowFree: true
        };

        const postPromises = selectedCats.map(catId => {
            return fetch(`${FIREBASE_DB_URL}/custom_links/${catId}/${quizId}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...linkPayload, categoryId: catId })
            });
        });

        await Promise.all(postPromises);

        alert(`🎉 ĐÃ ĐĂNG ĐỀ THI THÀNH CÔNG VÀO ${selectedCats.length} CHUYÊN MỤC!`);
        closeAdminPanel();
        window.location.reload();
    } catch (err) {
        console.error("Lỗi đăng đề:", err);
        alert("❌ Lỗi: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "✨ Đăng đề thi";
    }
}

// ---------------------------------------------------------
// TẢI FILE LÊN GOOGLE DRIVE (TAB 2)
// ---------------------------------------------------------
async function processUploadToGoogleDrive() {
    const fileInput = document.getElementById("admin-drive-file");
    const titleInput = document.getElementById("admin-drive-title");
    const btn = document.getElementById("btn-upload-drive");
    const statusEl = document.getElementById("drive-upload-status");

    const selectedCats = getSelectedAdminCategories();
    if (selectedCats.length === 0) {
        alert("⚠️ Vui lòng chọn ít nhất 01 chuyên mục để lưu tài liệu!");
        return;
    }

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("⚠️ Vui lòng chọn file từ máy tính!");
        return;
    }

    const file = fileInput.files[0];
    const finalTitle = (titleInput ? titleInput.value : "").trim() || file.name;

    btn.disabled = true;
    btn.innerText = "⏳ Đang chuẩn bị tệp...";
    if (statusEl) {
        statusEl.style.display = "block";
        statusEl.innerText = "⏳ Đang đọc và mã hóa dữ liệu...";
    }

    try {
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        if (statusEl) statusEl.innerText = "🚀 Đang tải lên Google Drive...";

        const payload = {
            base64Data: base64Data,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream"
        };

        const res = await fetch(GOOGLE_DRIVE_UPLOAD_GAS_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const resJson = await res.json();
        if (!resJson || !resJson.url) {
            throw new Error(resJson.error || "Không nhận được liên kết từ Google Drive");
        }

        const driveUrl = resJson.url;
        const docId = "doc_" + Date.now();
        const autoDateStr = formatVietnameseDateTime(Date.now());

        const linkPayload = {
            id: docId,
            firebaseId: docId,
            title: finalTitle,
            url: driveUrl,
            date: autoDateStr,
            formattedDate: autoDateStr,
            timestamp: Date.now(),
            badgeText: "NONE",
            isDoc: true,
            avatar: selectedAvatarUrl || "https://cdn-icons-png.flaticon.com/512/1048/1048953.png"
        };

        const postPromises = selectedCats.map(catId => {
            return fetch(`${FIREBASE_DB_URL}/custom_links/${catId}/${docId}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...linkPayload, categoryId: catId })
            });
        });

        await Promise.all(postPromises);

        alert("🎉 ĐÃ TẢI LÊN GOOGLE DRIVE & XUẤT BẢN THÀNH CÔNG!");
        closeAdminPanel();
        window.location.reload();
    } catch (err) {
        console.error("Lỗi tải lên Drive:", err);
        alert("❌ Lỗi tải file lên Drive: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "📤 Tải lên Drive";
        if (statusEl) statusEl.style.display = "none";
    }
}

// ---------------------------------------------------------
// ĐĂNG LINK TÀI LIỆU CÓ SẴN (TAB 3)
// ---------------------------------------------------------
async function processAddDocument() {
    const title = (document.getElementById("admin-doc-title").value || "").trim();
    const url = (document.getElementById("admin-doc-url").value || "").trim();
    const btn = document.getElementById("btn-create-doc");

    const selectedCats = getSelectedAdminCategories();
    if (selectedCats.length === 0) {
        alert("⚠️ Vui lòng chọn ít nhất 01 chuyên mục!");
        return;
    }

    if (!title || !url) {
        alert("⚠️ Vui lòng nhập đầy đủ tên tài liệu và đường link!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "⏳ Đang lưu...";

    try {
        const docId = "doc_" + Date.now();
        const autoDateStr = formatVietnameseDateTime(Date.now());

        const linkPayload = {
            id: docId,
            firebaseId: docId,
            title: title,
            url: url,
            date: autoDateStr,
            formattedDate: autoDateStr,
            timestamp: Date.now(),
            badgeText: "NONE",
            isDoc: true,
            avatar: selectedAvatarUrl || "https://cdn-icons-png.flaticon.com/512/1048/1048953.png"
        };

        const postPromises = selectedCats.map(catId => {
            return fetch(`${FIREBASE_DB_URL}/custom_links/${catId}/${docId}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...linkPayload, categoryId: catId })
            });
        });

        await Promise.all(postPromises);

        alert("🎉 ĐÃ ĐĂNG LIÊN KẾT TÀI LIỆU THÀNH CÔNG!");
        closeAdminPanel();
        window.location.reload();
    } catch (err) {
        console.error("Lỗi đăng link:", err);
        alert("❌ Lỗi: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "🔗 Đăng tài liệu";
    }
}

// ---------------------------------------------------------
// QUẢN LÝ THAO TÁC TRÊN THẺ ĐỀ THI
// ---------------------------------------------------------
async function handleAllowFreeToggleChange(categoryId, itemId, isChecked, event) {
    if (event) event.stopPropagation();

    const statusTxt = document.getElementById(`free-status-txt-${itemId}`);
    if (statusTxt) {
        statusTxt.innerText = isChecked ? "BẬT" : "TẮT";
        statusTxt.className = `free-toggle-status ${isChecked ? 'st-on' : 'st-off'}`;
    }

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ allowFree: isChecked })
        });

        if (itemId.startsWith("quiz_")) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ allowFree: isChecked })
            }).catch(() => null);
        }
    } catch (e) {
        alert("Lỗi cập nhật trạng thái tự do!");
    }
}

function openEditMinutesModal(quizId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    currentEditingQuizId = quizId;
    currentTimeEditMode = "minutes";

    const modal = document.getElementById("exam-time-modal");
    const titleEl = document.getElementById("exam-time-modal-title");
    const minGroup = document.getElementById("modal-time-minutes-group");
    const schedGroup = document.getElementById("modal-time-schedule-group");
    const minInput = document.getElementById("edit-time-limit");

    if (titleEl) titleEl.innerText = "⏱ Đổi thời lượng làm bài";
    if (minGroup) minGroup.style.display = "block";
    if (schedGroup) schedGroup.style.display = "none";

    fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`).then(r => r.json()).then(q => {
        if (q && q.timeLimitMinutes && minInput) minInput.value = q.timeLimitMinutes;
        else if (minInput) minInput.value = 90;
    }).catch(() => { if (minInput) minInput.value = 90; });

    if (modal) modal.style.display = "flex";
}

function openEditScheduleModal(quizId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    currentEditingQuizId = quizId;
    currentTimeEditMode = "schedule";

    const modal = document.getElementById("exam-time-modal");
    const titleEl = document.getElementById("exam-time-modal-title");
    const minGroup = document.getElementById("modal-time-minutes-group");
    const schedGroup = document.getElementById("modal-time-schedule-group");
    const startInput = document.getElementById("edit-start-time");
    const endInput = document.getElementById("edit-end-time");

    if (titleEl) titleEl.innerText = "📅 Gia hạn thời gian mở / đóng đề";
    if (minGroup) minGroup.style.display = "none";
    if (schedGroup) schedGroup.style.display = "block";

    fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`).then(r => r.json()).then(q => {
        if (q) {
            if (startInput && q.examStartTimeStr) startInput.value = q.examStartTimeStr.slice(0, 16);
            if (endInput && q.examEndTimeStr) endInput.value = q.examEndTimeStr.slice(0, 16);
        }
    }).catch(() => null);

    if (modal) modal.style.display = "flex";
}

function closeExamTimeModal() {
    const modal = document.getElementById("exam-time-modal");
    if (modal) modal.style.display = "none";
    currentEditingQuizId = null;
    currentTimeEditMode = null;
}

async function saveExamTimeConfig() {
    if (!currentEditingQuizId) return;
    const btn = document.getElementById("btn-save-exam-time");
    btn.disabled = true;
    btn.innerText = "⏳ Đang lưu...";

    try {
        let patchData = {};
        if (currentTimeEditMode === "minutes") {
            const mins = parseInt(document.getElementById("edit-time-limit").value, 10);
            if (isNaN(mins) || mins <= 0) throw new Error("Số phút không hợp lệ!");
            patchData = { timeLimitMinutes: mins };
        } else if (currentTimeEditMode === "schedule") {
            const st = document.getElementById("edit-start-time").value;
            const et = document.getElementById("edit-end-time").value;
            if (!st || !et) throw new Error("Vui lòng chọn cả thời gian mở và đóng!");
            patchData = { examStartTimeStr: st, examEndTimeStr: et };
        }

        await fetch(`${FIREBASE_DB_URL}/quizzes/${currentEditingQuizId}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patchData)
        });

        // Đồng bộ cập nhật sang tất cả custom_links chứa quizId này
        const allCats = [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES].map(c => c.id);
        allCats.push("kho-tai-lieu", "nhac-nho");

        await Promise.all(allCats.map(catId => {
            return fetch(`${FIREBASE_DB_URL}/custom_links/${catId}/${currentEditingQuizId}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patchData)
            }).catch(() => null);
        }));

        alert("✅ Đã cập nhật thời gian đề thi thành công!");
        closeExamTimeModal();
        window.location.reload();
    } catch (e) {
        alert("❌ Lỗi: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Lưu cấu hình";
    }
}

async function toggleShuffle(categoryId, itemId, isChecked, event) {
    if (event) event.stopPropagation();
    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isShuffled: isChecked })
        });
        if (itemId.startsWith("quiz_")) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isShuffled: isChecked })
            }).catch(() => null);
        }
    } catch (e) {}
}

async function moveItemOrder(categoryId, itemId, direction, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    let list = [];
    const all = [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES];
    const found = all.find(c => c.id === categoryId);
    if (found && found.links) list = found.links;
    else if (categoryId === "nhac-nho") list = REMINDER_CATEGORY.links;
    else if (categoryId === "kho-tai-lieu") list = KHO_TAI_LIEU_FOLDER.links;

    const idx = list.findIndex(l => (l.id === itemId || l.firebaseId === itemId));
    if (idx === -1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const curItem = list[idx];
    const targetItem = list[targetIdx];

    const curTime = curItem.timestamp || parseDateString(curItem.date) || Date.now();
    const targetTime = targetItem.timestamp || parseDateString(targetItem.date) || Date.now();

    const newCurTime = direction === "up" ? (targetTime + 1000) : (targetTime - 1000);

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${curItem.firebaseId || curItem.id}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timestamp: newCurTime })
        });
        window.location.reload();
    } catch (e) {
        alert("Lỗi di chuyển thứ tự!");
    }
}

function openMoveModal(categoryId, itemId, encodedData, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    try {
        currentMoveData = {
            oldCategory: categoryId,
            quizId: itemId,
            quizData: JSON.parse(decodeURIComponent(encodedData))
        };
        const modal = document.getElementById("move-modal");
        if (modal) modal.style.display = "flex";
    } catch (e) {}
}

function closeMoveModal() {
    const modal = document.getElementById("move-modal");
    if (modal) modal.style.display = "none";
    currentMoveData = { oldCategory: null, quizId: null, quizData: null };
}

async function confirmMoveQuiz() {
    const select = document.getElementById("move-category-select");
    const newCat = select ? select.value : "";
    if (!newCat || !currentMoveData.quizData) return;

    if (newCat === currentMoveData.oldCategory) {
        alert("⚠️ Mục mới phải khác mục hiện tại!");
        return;
    }

    try {
        const item = currentMoveData.quizData;
        const itemId = currentMoveData.quizId;
        item.categoryId = newCat;

        await fetch(`${FIREBASE_DB_URL}/custom_links/${newCat}/${itemId}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item)
        });

        await fetch(`${FIREBASE_DB_URL}/custom_links/${currentMoveData.oldCategory}/${itemId}.json`, {
            method: "DELETE"
        });

        alert(`🔄 Đã chuyển sang chuyên mục "${getCategoryDisplayName(newCat)}" thành công!`);
        closeMoveModal();
        window.location.reload();
    } catch (e) {
        alert("Lỗi khi chuyển chuyên mục: " + e.message);
    }
}

function openCopyModal(categoryId, itemId, encodedData, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    try {
        currentCopyData = {
            sourceCategory: categoryId,
            itemId: itemId,
            itemData: JSON.parse(decodeURIComponent(encodedData))
        };
        const modal = document.getElementById("copy-modal");
        if (modal) modal.style.display = "flex";
    } catch (e) {}
}

function closeCopyModal() {
    const modal = document.getElementById("copy-modal");
    if (modal) modal.style.display = "none";
    currentCopyData = { sourceCategory: null, itemId: null, itemData: null };
}

async function confirmCopyItem() {
    const select = document.getElementById("copy-category-select");
    const targetCat = select ? select.value : "";
    if (!targetCat || !currentCopyData.itemData) return;

    try {
        const item = { ...currentCopyData.itemData, categoryId: targetCat };
        const itemId = currentCopyData.itemId;

        await fetch(`${FIREBASE_DB_URL}/custom_links/${targetCat}/${itemId}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item)
        });

        alert(`📋 Đã sao chép sang chuyên mục "${getCategoryDisplayName(targetCat)}" thành công!`);
        closeCopyModal();
        window.location.reload();
    } catch (e) {
        alert("Lỗi khi sao chép: " + e.message);
    }
}

async function renameItem(categoryId, itemId, isDoc, oldTitle, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const newTitle = prompt("Nhập tên mới hiển thị:", oldTitle);
    if (!newTitle || newTitle.trim() === "" || newTitle.trim() === oldTitle) return;

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle.trim() })
        });

        if (!isDoc && itemId.startsWith("quiz_")) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle.trim() })
            }).catch(() => null);
        }

        window.location.reload();
    } catch (e) {
        alert("Lỗi đổi tên: " + e.message);
    }
}

async function deleteItem(categoryId, itemId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    if (!confirm("⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn mục này?")) return;

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, {
            method: "DELETE"
        });
        window.location.reload();
    } catch (e) {
        alert("Lỗi xóa: " + e.message);
    }
}

// ---------------------------------------------------------
// BỘ SOẠN VÀ XUẤT BẢN BÀI BÁO NHẮC NHỞ QUAN TRỌNG
// ---------------------------------------------------------
function formatVietnameseDateTime(dateInput = Date.now()) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "---";
    const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    const dayName = dayNames[d.getDay()];
    const pad = n => String(n).padStart(2, '0');
    const DD = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const YYYY = d.getFullYear();
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${dayName}, ${DD}/${MM}/${YYYY} - ${hh}:${mm}`;
}

function openReminderArticleEditorModal(itemId = null, encodedData = null, event = null) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    currentEditingArticleId = itemId;
    currentArticleBase64Image = "";

    const modal = document.getElementById("article-editor-modal");
    const modalTitle = document.getElementById("article-editor-title");
    const titleInput = document.getElementById("edit-article-title");
    const captionInput = document.getElementById("edit-article-caption");
    const sapoInput = document.getElementById("edit-article-sapo");
    const contentInput = document.getElementById("edit-article-content");
    const authorInput = document.getElementById("edit-article-author");
    const badgeSelect = document.getElementById("edit-article-badge");
    const fileInput = document.getElementById("edit-article-image-file");

    const previewContainer = document.getElementById("article-img-preview-container");
    const imgPreview = document.getElementById("edit-article-img-preview");
    const placeholder = document.getElementById("article-img-placeholder");

    if (fileInput) fileInput.value = "";

    if (itemId && encodedData) {
        const item = JSON.parse(decodeURIComponent(encodedData));
        modalTitle.innerText = "✏️ Chỉnh sửa bài báo Nhắc nhở";
        titleInput.value = item.title || "";
        captionInput.value = item.imageCaption || "";
        sapoInput.value = item.sapo || "";
        contentInput.value = item.content || item.title || "";
        authorInput.value = item.author || "Thầy Phạm Công Hoan";
        badgeSelect.value = item.badgeText || "MỚI";

        if (item.articleImage) {
            currentArticleBase64Image = item.articleImage;
            imgPreview.src = item.articleImage;
            previewContainer.style.display = "block";
            placeholder.style.display = "none";
        } else {
            previewContainer.style.display = "none";
            placeholder.style.display = "block";
        }
    } else {
        modalTitle.innerText = "📰 Soạn bài báo Nhắc nhở quan trọng";
        titleInput.value = "";
        captionInput.value = "";
        sapoInput.value = "";
        contentInput.value = "";
        authorInput.value = "Thầy Phạm Công Hoan";
        badgeSelect.value = "MỚI";
        previewContainer.style.display = "none";
        placeholder.style.display = "block";
    }

    if (modal) modal.style.display = "flex";
}

function closeReminderArticleEditorModal() {
    const modal = document.getElementById("article-editor-modal");
    if (modal) modal.style.display = "none";
    currentEditingArticleId = null;
    currentArticleBase64Image = "";
}

function triggerArticleImageFileInput() {
    const fileInput = document.getElementById("edit-article-image-file");
    if (fileInput) fileInput.click();
}

function previewArticleImage(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
        alert("⚠️ Dung lượng ảnh lớn hơn 5MB! Vui lòng chọn ảnh nhẹ hơn.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const rawBase64 = e.target.result;
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            const maxW = 1280;
            if (width > maxW) {
                height = Math.round((height * maxW) / width);
                width = maxW;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            currentArticleBase64Image = canvas.toDataURL("image/jpeg", 0.88);

            const previewContainer = document.getElementById("article-img-preview-container");
            const imgPreview = document.getElementById("edit-article-img-preview");
            const placeholder = document.getElementById("article-img-placeholder");

            if (imgPreview) imgPreview.src = currentArticleBase64Image;
            if (previewContainer) previewContainer.style.display = "block";
            if (placeholder) placeholder.style.display = "none";
        };
        img.src = rawBase64;
    };
    reader.readAsDataURL(file);
}

async function submitReminderArticle() {
    const title = (document.getElementById("edit-article-title").value || "").trim();
    const caption = (document.getElementById("edit-article-caption").value || "").trim();
    const sapo = (document.getElementById("edit-article-sapo").value || "").trim();
    const content = (document.getElementById("edit-article-content").value || "").trim();
    const author = (document.getElementById("edit-article-author").value || "").trim() || "Thầy Phạm Công Hoan";
    const badge = document.getElementById("edit-article-badge").value || "MỚI";
    const btn = document.getElementById("btn-save-article-submit");

    if (!title) {
        alert("⚠️ Vui lòng nhập tiêu đề bài viết!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "⏳ Đang xuất bản...";

    try {
        const itemId = currentEditingArticleId || ("rem_" + Date.now());
        const nowMs = Date.now();
        const autoDateTimeStr = formatVietnameseDateTime(nowMs);

        const articlePayload = {
            id: itemId,
            firebaseId: itemId,
            categoryId: "nhac-nho",
            isDoc: true,
            isArticle: true,
            title: title,
            sapo: sapo,
            content: content,
            articleImage: currentArticleBase64Image || "",
            imageCaption: caption,
            author: author,
            badgeText: badge,
            isHot: (badge === "HOT"),
            date: autoDateTimeStr,
            formattedDate: autoDateTimeStr,
            timestamp: nowMs,
            avatar: currentArticleBase64Image || "https://i.ibb.co/HTPxzDtT/khung-long-bao-chua.jpg"
        };

        await fetch(`${FIREBASE_DB_URL}/custom_links/nhac-nho/${itemId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(articlePayload)
        });

        alert("🎉 Xuất bản bài báo Nhắc nhở quan trọng thành công!");
        closeReminderArticleEditorModal();
        window.location.reload();
    } catch(err) {
        console.error("Lỗi lưu bài báo:", err);
        alert("❌ Lỗi khi xuất bản bài báo: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "🚀 Xuất bản bài báo";
    }
}
