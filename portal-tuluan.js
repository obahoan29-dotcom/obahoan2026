// =========================================================
// FILE: portal-tuluan.js
// QUẢN LÝ NỘP BÀI TỰ LUẬN LÊN GOOGLE DRIVE 5TB THEO LỚP
// NÉN ẢNH CANVAS SIÊU TỐC, XÁC THỰC MẬT KHẨU & REALTIME FIREBASE
// =========================================================

let currentTuLuanModalData = {
    classId: "",
    quizId: "",
    examTitle: "",
    submissionsMap: {},
    statusFilter: "all"
};

let tuLuanEventSource = null;

// HÀM NÉN ẢNH CLIENT-SIDE BẰNG HTML5 CANVAS
function compressImageForTuLuanAsync(file, maxDimension = 2048, quality = 0.82) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.match(/image.*/)) {
            return reject(new Error("Tệp chọn không phải là hình ảnh!"));
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                const base64 = dataUrl.split(",")[1];
                resolve({
                    base64: base64,
                    dataUrl: dataUrl,
                    mimeType: "image/jpeg",
                    width: width,
                    height: height
                });
            };
            img.onerror = () => reject(new Error("Lỗi đọc cấu trúc ảnh!"));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Lỗi đọc tệp từ thiết bị!"));
        reader.readAsDataURL(file);
    });
}

function ensureTuLuanModalDOM() {
    if (document.getElementById("modal-tuluan-submission")) return;
    const modalDiv = document.createElement("div");
    modalDiv.id = "modal-tuluan-submission";
    modalDiv.className = "move-modal-overlay";
    modalDiv.innerHTML = `
        <div class="tuluan-modal-card" onclick="event.stopPropagation()">
            <div class="tuluan-modal-header">
                <div class="tuluan-header-title-box">
                    <span class="tuluan-icon-badge">📁</span>
                    <div>
                        <h3 id="tuluan-modal-heading" style="margin:0; color:#0f172a; font-size:16.5px; font-weight:900;">📤 NỘP BÀI TỰ LUẬN GOOGLE DRIVE</h3>
                        <div id="tuluan-modal-subheading" style="font-size:12px; color:#64748b; font-weight:700; margin-top:2px;">Danh sách lớp</div>
                    </div>
                </div>
                <button type="button" class="btn-close-cleanup-modal" onclick="closeTuLuanModal(event)">✕</button>
            </div>

            <div class="tuluan-toolbar-bar">
                <input type="text" id="tuluan-search-student" class="tuluan-search-box" placeholder="🔍 Tìm tên hoặc SBD..." oninput="filterTuLuanStudentTable()">
                <div class="tuluan-filter-tabs">
                    <button type="button" class="tuluan-tab-pill active" id="tab-filter-all" onclick="filterTuLuanStatus('all')">Tất cả (<span id="count-all-st">0</span>)</button>
                    <button type="button" class="tuluan-tab-pill" id="tab-filter-submitted" onclick="filterTuLuanStatus('submitted')">✅ Đã nộp (<span id="count-sub-st">0</span>)</button>
                    <button type="button" class="tuluan-tab-pill" id="tab-filter-pending" onclick="filterTuLuanStatus('pending')">⏳ Chưa nộp (<span id="count-pen-st">0</span>)</button>
                </div>
            </div>

            <div class="tuluan-table-wrap">
                <table class="tuluan-table">
                    <thead>
                        <tr>
                            <th style="width: 45px; text-align: center;">STT</th>
                            <th style="width: 175px;">Họ và tên</th>
                            <th style="width: 85px; text-align: center;">SBD</th>
                            <th style="width: 180px;">Trạng thái / Ngày nộp</th>
                            <th style="min-width: 170px;">Ảnh bài làm đã nộp</th>
                            <th style="width: 115px; text-align: center;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="tuluan-students-tbody"></tbody>
                </table>
            </div>

            <div class="tuluan-modal-footer">
                <span style="font-size:11.5px; color:#475569; font-style:italic;">* Ảnh chụp bài làm tự động lưu trữ an toàn vào Google Drive của Thầy.</span>
                <button type="button" class="btn-admin btn-cancel" style="padding: 6px 18px;" onclick="closeTuLuanModal(event)">Đóng</button>
            </div>
        </div>

        <!-- LIGHTBOX XEM ẢNH TỰ LUẬN PHÓNG TO -->
        <div id="tuluan-lightbox" class="tuluan-lightbox-overlay" onclick="closeTuLuanLightbox(event)">
            <div class="tuluan-lightbox-content" onclick="event.stopPropagation()">
                <div class="tuluan-lightbox-header">
                    <span id="lightbox-student-title" style="font-weight:800; font-size:14px; color:#ffffff;">Ảnh bài làm</span>
                    <div style="display:flex; gap:8px;">
                        <a id="lightbox-drive-link" href="#" target="_blank" class="btn-lightbox-open-drive">🔗 Mở trên Drive</a>
                        <button type="button" class="btn-close-lightbox" onclick="closeTuLuanLightbox(event)">✕</button>
                    </div>
                </div>
                <div class="tuluan-lightbox-img-box">
                    <img id="lightbox-full-img" src="" alt="Ảnh bài làm tự luận">
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalDiv);
}

// MỞ MODAL NỘP BÀI TỰ LUẬN CỦA LỚP
async function openTuLuanModal(classId, itemId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    ensureTuLuanModalDOM();

    let targetCat = classId;
    if (targetCat === "tu-luan-padlet" || !targetCat) {
        if (itemId && itemId.includes("11a")) targetCat = "lop-11a";
        else if (itemId && itemId.includes("11c")) targetCat = "lop-11c";
        else if (itemId && itemId.includes("10p")) targetCat = "lop-10p";
        else if (itemId && itemId.includes("11e")) targetCat = "lop-11e";
        else targetCat = "lop-11a";
    }

    let itemTitle = "BÀI TẬP TỰ LUẬN";
    let effectiveQuizId = itemId;

    const allCats = [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES, KHO_TAI_LIEU_FOLDER];
    for (const c of allCats) {
        if (c.links) {
            const found = c.links.find(l => (l.firebaseId === itemId || l.id === itemId));
            if (found) {
                itemTitle = found.title || itemTitle;
                effectiveQuizId = (typeof extractQuizIdFromItem === 'function') ? (extractQuizIdFromItem(found) || itemId) : itemId;
                break;
            }
        }
    }

    currentTuLuanModalData.classId = targetCat;
    currentTuLuanModalData.quizId = effectiveQuizId;
    currentTuLuanModalData.examTitle = itemTitle;
    currentTuLuanModalData.statusFilter = "all";

    document.getElementById("tuluan-modal-heading").innerText = `📤 NỘP BÀI TỰ LUẬN - ${itemTitle}`;
    document.getElementById("tuluan-modal-subheading").innerText = `Lớp: ${getCategoryDisplayName(targetCat)} • Google Drive 5TB`;
    document.getElementById("modal-tuluan-submission").style.display = "flex";

    await loadTuLuanSubmissionsFromFirebase();
    renderTuLuanStudentsTable();
    startTuLuanRealtimeListener(effectiveQuizId);
}

function closeTuLuanModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const modal = document.getElementById("modal-tuluan-submission");
    if (modal) modal.style.display = "none";
    if (tuLuanEventSource) {
        tuLuanEventSource.close();
        tuLuanEventSource = null;
    }
}

async function loadTuLuanSubmissionsFromFirebase() {
    const qId = currentTuLuanModalData.quizId;
    if (!qId) return;
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${qId}/tu_luan.json`);
        if (res && res.ok) {
            const data = await res.json();
            currentTuLuanModalData.submissionsMap = (data && typeof data === 'object') ? data : {};
        }
    } catch(e) {
        currentTuLuanModalData.submissionsMap = {};
    }
}

function startTuLuanRealtimeListener(quizId) {
    if (tuLuanEventSource) {
        tuLuanEventSource.close();
        tuLuanEventSource = null;
    }
    if (!quizId) return;
    try {
        tuLuanEventSource = new EventSource(`${FIREBASE_DB_URL}/quizzes/${quizId}/tu_luan.json`);
        tuLuanEventSource.addEventListener('put', async () => {
            await loadTuLuanSubmissionsFromFirebase();
            renderTuLuanStudentsTable();
        });
        tuLuanEventSource.addEventListener('patch', async () => {
            await loadTuLuanSubmissionsFromFirebase();
            renderTuLuanStudentsTable();
        });
    } catch(e) {}
}

function renderTuLuanStudentsTable() {
    const tbody = document.getElementById("tuluan-students-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const students = getAccountsForCategory(currentTuLuanModalData.classId);
    const searchVal = (document.getElementById("tuluan-search-student")?.value || "").trim().toLowerCase();
    const subMap = currentTuLuanModalData.submissionsMap || {};

    let totalSt = students.length;
    let submittedCount = 0;

    students.forEach(st => {
        const cleanSbd = String(st.sbd || "").trim().replace(/[^a-zA-Z0-9]/g, '_');
        if (subMap[cleanSbd] && subMap[cleanSbd].images && subMap[cleanSbd].images.length > 0) {
            submittedCount++;
        }
    });

    const elTotal = document.getElementById("count-all-st");
    const elSub = document.getElementById("count-sub-st");
    const elPen = document.getElementById("count-pen-st");
    if (elTotal) elTotal.innerText = totalSt;
    if (elSub) elSub.innerText = submittedCount;
    if (elPen) elPen.innerText = (totalSt - submittedCount);

    students.forEach(st => {
        const cleanSbd = String(st.sbd || "").trim().replace(/[^a-zA-Z0-9]/g, '_');
        const record = subMap[cleanSbd];
        const isSubmitted = Boolean(record && record.images && record.images.length > 0);

        if (currentTuLuanModalData.statusFilter === "submitted" && !isSubmitted) return;
        if (currentTuLuanModalData.statusFilter === "pending" && isSubmitted) return;

        if (searchVal) {
            const nameNorm = (typeof normalizeName === 'function') ? normalizeName(st.name) : st.name.toLowerCase();
            const sbdNorm = String(st.sbd || "").toLowerCase();
            if (!nameNorm.includes(searchVal) && !sbdNorm.includes(searchVal)) return;
        }

        const tr = document.createElement("tr");

        let statusHtml = `<span class="tuluan-status-badge pending">⏳ Chưa nộp</span>`;
        let thumbnailsHtml = `<span style="font-size:11.5px; color:#94a3b8; font-style:italic;">Chưa có ảnh</span>`;

        if (isSubmitted) {
            const imgCount = record.images.length;
            const lastTime = record.lastSubmit || "Vừa xong";
            statusHtml = `
                <div class="tuluan-status-badge done">
                    ✅ Đã nộp ${imgCount} ảnh
                </div>
                <div style="font-size: 11px; color: #64748b; font-weight: 700; margin-top: 2px;">
                    🕒 ${lastTime}
                </div>
            `;

            thumbnailsHtml = `
                <div class="tuluan-thumb-row">
                    ${record.images.map((im, idx) => `
                        <div class="tuluan-img-thumbnail-item" onclick="openTuLuanLightbox('${im.directUrl || im.fileUrl}', '${im.fileUrl}', '${st.name} - Trang ${idx + 1}', event)" title="Bấm để xem ảnh phóng to">
                            <img src="${im.directUrl || im.fileUrl}" alt="Trang ${idx + 1}">
                            <span class="tuluan-thumb-page">Trang ${idx + 1}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        tr.innerHTML = `
            <td style="text-align: center; font-weight: 800; color: #475569;">${st.stt}</td>
            <td style="font-weight: 800; color: #0f172a;">${st.name}</td>
            <td style="text-align: center; font-weight: 800; color: #0284c7; font-family: monospace;">${st.sbd}</td>
            <td>${statusHtml}</td>
            <td>${thumbnailsHtml}</td>
            <td style="text-align: center;">
                <input type="file" id="tuluan-input-${cleanSbd}" accept="image/*" multiple style="display:none;" onchange="handleStudentEssayUploadPC('${st.stt}', '${st.sbd}', '${st.name}', this)">
                <button type="button" class="btn-tuluan-upload-row" onclick="triggerStudentUpload('${st.stt}', '${st.sbd}', '${st.name}', '${st.pass}')" id="btn-up-${cleanSbd}">
                    📷 Tải ảnh
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterTuLuanStudentTable() {
    renderTuLuanStudentsTable();
}

function filterTuLuanStatus(filterType) {
    currentTuLuanModalData.statusFilter = filterType;
    document.querySelectorAll(".tuluan-tab-pill").forEach(p => p.classList.remove("active"));
    const activeBtn = document.getElementById(`tab-filter-${filterType}`);
    if (activeBtn) activeBtn.classList.add("active");
    renderTuLuanStudentsTable();
}

// BẬT FILE CHO HỌC SINH (KÈM BẢO MẬT NHẬP MẬT KHẨU TRÁNH NỘP NHẦM)
function triggerStudentUpload(stt, sbd, studentName, correctPass) {
    const cleanSbd = String(sbd).replace(/[^a-zA-Z0-9]/g, '_');
    const sessionAuthKey = `tuluan_authed_${currentTuLuanModalData.quizId}_${cleanSbd}`;

    // Nếu là Admin hoặc học sinh đã xác thực trong phiên này thì cho chọn ảnh ngay
    if (isAdminLoggedIn || safeSession.getItem(sessionAuthKey) === "true") {
        document.getElementById(`tuluan-input-${cleanSbd}`).click();
        return;
    }

    const inputPass = prompt(`🔐 XÁC NHẬN BẢO MẬT NỘP BÀI:\n\nEm đang nộp bài cho: [${stt}] ${studentName} (SBD: ${sbd}).\nVui lòng nhập mật khẩu (hoặc SBD) của em để xác nhận:`);
    if (inputPass === null) return;

    const trimmedInput = inputPass.trim().toLowerCase();
    const isPassOk = (trimmedInput === String(correctPass).trim().toLowerCase()) || (trimmedInput === String(sbd).trim().toLowerCase());

    if (isPassOk) {
        safeSession.setItem(sessionAuthKey, "true");
        document.getElementById(`tuluan-input-${cleanSbd}`).click();
    } else {
        alert("❌ Mật khẩu hoặc SBD không chính xác! Vui lòng kiểm tra lại để tránh nộp nhầm vào bài của bạn khác.");
    }
}

// XỬ LÝ UPLOAD ẢNH BÀI LÀM LÊN GOOGLE DRIVE 5TB
async function handleStudentEssayUploadPC(stt, sbd, studentName, fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return;

    const files = Array.from(fileInput.files);
    const cleanSbd = String(sbd).replace(/[^a-zA-Z0-9]/g, '_');
    const upBtn = document.getElementById(`btn-up-${cleanSbd}`);

    if (upBtn) {
        upBtn.disabled = true;
        upBtn.innerText = "⏳ Đang gửi...";
    }

    const classId = currentTuLuanModalData.classId || "lop-11a";
    const className = getCategoryDisplayName(classId);
    const quizId = currentTuLuanModalData.quizId || "quiz";
    const examTitle = currentTuLuanModalData.examTitle || "De_Thi";

    const currentSub = currentTuLuanModalData.submissionsMap[cleanSbd] || {};
    const existingImages = Array.isArray(currentSub.images) ? [...currentSub.images] : [];

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pageIdx = existingImages.length + i + 1;
        try {
            if (upBtn) upBtn.innerText = `⏳ Nén ảnh ${i + 1}/${files.length}...`;
            const compressed = await compressImageForTuLuanAsync(file, 2048, 0.82);

            if (upBtn) upBtn.innerText = `🚀 Lưu trang ${pageIdx}...`;

            const payload = {
                className: className,
                examTitle: examTitle,
                stt: stt,
                sbd: sbd,
                studentName: studentName,
                filename: `Trang_${pageIdx}_${Date.now()}.jpg`,
                mimeType: "image/jpeg",
                base64: compressed.base64
            };

            const gasUrl = GOOGLE_DRIVE_TULUAN_GAS_URL || GOOGLE_DRIVE_UPLOAD_GAS_URL;
            const res = await fetch(gasUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (result && result.status === "success" && result.fileId) {
                const directImgUrl = result.directUrl || (typeof toDirectGoogleDriveImageUrl === 'function' ? toDirectGoogleDriveImageUrl(result.fileUrl) : result.fileUrl);
                existingImages.push({
                    fileId: result.fileId,
                    fileUrl: result.fileUrl,
                    directUrl: directImgUrl,
                    fileName: payload.filename,
                    uploadedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN")
                });
                successCount++;
            } else {
                throw new Error(result.message || "Máy chủ Drive không trả về liên kết ảnh.");
            }
        } catch(err) {
            console.error(`Lỗi tải ảnh trang ${i + 1}:`, err);
            alert(`⚠️ Lỗi tải ảnh trang ${i + 1}: ${err.message}`);
        }
    }

    if (successCount > 0) {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const submitDateStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

        const firebaseRecord = {
            stt: stt,
            sbd: sbd,
            studentName: studentName,
            className: className,
            examTitle: examTitle,
            lastSubmit: submitDateStr,
            lastSubmitTime: Date.now(),
            count: existingImages.length,
            images: existingImages
        };

        await Promise.all([
            fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/tu_luan/${cleanSbd}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(firebaseRecord)
            }).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/exams/${quizId}/tu_luan/${cleanSbd}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(firebaseRecord)
            }).catch(() => null)
        ]);

        currentTuLuanModalData.submissionsMap[cleanSbd] = firebaseRecord;
        renderTuLuanStudentsTable();
        alert(`🎉 THÀNH CÔNG!\n\nĐã tải lên và lưu ${successCount} ảnh bài làm vào thư mục Google Drive của em [${studentName}]. Thầy giáo có thể xem được ngay!`);
    }

    if (upBtn) {
        upBtn.disabled = false;
        upBtn.innerText = "📷 Tải ảnh";
    }
    fileInput.value = "";
}

// BẬT LIGHTBOX XEM ẢNH TỰ LUẬN
function openTuLuanLightbox(imgSrc, driveUrl, title, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const lb = document.getElementById("tuluan-lightbox");
    const fullImg = document.getElementById("lightbox-full-img");
    const titleEl = document.getElementById("lightbox-student-title");
    const driveLink = document.getElementById("lightbox-drive-link");

    if (fullImg) fullImg.src = imgSrc;
    if (titleEl) titleEl.innerText = title || "Ảnh bài làm tự luận";
    if (driveLink) driveLink.href = driveUrl || "#";

    if (lb) lb.style.display = "flex";
}

function closeTuLuanLightbox(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const lb = document.getElementById("tuluan-lightbox");
    if (lb) lb.style.display = "none";
}

// TÍCH HỢP TRONG PHÒNG THI (thi.html): HỌC SINH TỰ CHỤP NỘP THẲNG LÊN GOOGLE DRIVE
async function triggerExamRoomDriveUpload(qId) {
    const sId = document.getElementById("student-id")?.value.trim() || safeLocal.getItem("saved_student_sbd");
    const sName = document.getElementById("student-name")?.value.trim() || safeLocal.getItem("saved_student_name");
    const sClass = document.getElementById("student-class")?.value.trim() || safeLocal.getItem("saved_student_class");

    if (!sId || !sName) {
        alert("⚠️ Không xác định được thông tin học sinh đang làm bài!");
        return;
    }

    let input = document.getElementById(`drive-exam-input-${qId}`);
    if (!input) {
        input = document.createElement("input");
        input.type = "file";
        input.id = `drive-exam-input-${qId}`;
        input.accept = "image/*";
        input.multiple = true;
        input.style.display = "none";
        document.body.appendChild(input);

        input.onchange = async function() {
            if (!this.files || this.files.length === 0) return;
            const files = Array.from(this.files);

            const statusEl = document.getElementById(`drive-upload-status-${qId}`);
            if (statusEl) {
                statusEl.style.display = "inline-flex";
                statusEl.innerText = "⏳ Đang nén & gửi lên Drive...";
            }

            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('id') || (examData && examData.id) || "quiz";
            const examTitle = typeof EXAM_NAME !== 'undefined' ? EXAM_NAME : "Bài thi";
            const cleanSbd = sId.replace(/[^a-zA-Z0-9]/g, '_');

            let existingImages = [];
            try {
                const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/tu_luan/${cleanSbd}.json`);
                if (res.ok) {
                    const d = await res.json();
                    if (d && Array.isArray(d.images)) existingImages = d.images;
                }
            } catch(e) {}

            let successCount = 0;
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const pageIdx = existingImages.length + i + 1;
                try {
                    const comp = await compressImageForTuLuanAsync(f, 2048, 0.82);
                    const payload = {
                        className: sClass || "Lớp thi",
                        examTitle: examTitle,
                        stt: "00",
                        sbd: sId,
                        studentName: sName,
                        filename: `Cau_${qId}_Trang_${pageIdx}_${Date.now()}.jpg`,
                        mimeType: "image/jpeg",
                        base64: comp.base64
                    };

                    const gasUrl = GOOGLE_DRIVE_TULUAN_GAS_URL || GOOGLE_DRIVE_UPLOAD_GAS_URL;
                    const r = await fetch(gasUrl, {
                        method: "POST",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify(payload)
                    });
                    const resJson = await r.json();
                    if (resJson && resJson.status === "success") {
                        existingImages.push({
                            fileId: resJson.fileId,
                            fileUrl: resJson.fileUrl,
                            directUrl: resJson.directUrl || resJson.fileUrl,
                            fileName: payload.filename,
                            uploadedAt: new Date().toLocaleTimeString("vi-VN")
                        });
                        successCount++;
                    }
                } catch(err) {
                    console.error("Lỗi upload ảnh tự luận trong phòng thi:", err);
                }
            }

            if (successCount > 0) {
                const submitRecord = {
                    sbd: sId,
                    studentName: sName,
                    className: sClass,
                    examTitle: examTitle,
                    lastSubmit: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
                    count: existingImages.length,
                    images: existingImages
                };
                fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/tu_luan/${cleanSbd}.json`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(submitRecord)
                }).catch(() => null);

                if (statusEl) {
                    statusEl.className = "drive-up-status success";
                    statusEl.innerText = `✅ Đã lưu ${existingImages.length} ảnh lên Drive!`;
                }
                alert(`✅ ĐÃ LƯU BÀI TỰ LUẬN THÀNH CÔNG!\n\nĐã gửi ${successCount} ảnh bài làm vào thư mục Google Drive của em [${sName}]. Thầy giáo sẽ chấm phần này!`);
            } else {
                if (statusEl) {
                    statusEl.className = "drive-up-status error";
                    statusEl.innerText = `❌ Lỗi gửi ảnh!`;
                }
            }
            this.value = "";
        };
    }
    input.click();
}

window.openTuLuanModal = openTuLuanModal;
window.closeTuLuanModal = closeTuLuanModal;
window.triggerStudentUpload = triggerStudentUpload;
window.handleStudentEssayUploadPC = handleStudentEssayUploadPC;
window.filterTuLuanStudentTable = filterTuLuanStudentTable;
window.filterTuLuanStatus = filterTuLuanStatus;
window.openTuLuanLightbox = openTuLuanLightbox;
window.closeTuLuanLightbox = closeTuLuanLightbox;
window.triggerExamRoomDriveUpload = triggerExamRoomDriveUpload;