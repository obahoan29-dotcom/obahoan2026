// =========================================================
// FILE: exam-img-uploader.js
// QUẢN LÝ DÁN ẢNH SNIPPING TOOL (CTRL+V), TỰ ĐỘNG UPLOAD & ĐỒNG BỘ SSE
// =========================================================

let imageSyncEventSource = null;

(function injectAdminUploaderStyles() {
    const styleId = "admin-img-uploader-custom-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
        .btn-admin-del-img {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #ffffff !important;
            border: none; padding: 6px 12px; border-radius: 8px;
            font-weight: 800; font-size: 0.82rem; cursor: pointer;
            display: inline-flex; align-items: center; gap: 4px;
            box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);
            transition: transform 0.15s ease, filter 0.15s ease; user-select: none;
        }
        .btn-admin-del-img:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-admin-del-img:active { transform: translateY(2px) scale(0.96); }
        .admin-badge-has-img {
            background: #fef2f2; color: #dc2626; border: 1.5px solid #f87171;
            border-radius: 8px; padding: 4px 10px; font-size: 0.8rem; font-weight: 900;
            display: inline-flex; align-items: center; gap: 5px;
            box-shadow: 0 1px 4px rgba(239, 68, 68, 0.18); letter-spacing: -0.2px; user-select: none;
        }
        .quiz-img-wrapper {
            position: relative; display: inline-block; max-width: 100%;
        }
        .img-source-badge {
            position: absolute; top: 7px; right: 7px;
            background: rgba(15, 23, 42, 0.82); color: #ffffff;
            font-size: 10.5px; font-weight: 800; padding: 2px 8px;
            border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.35);
            backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35); pointer-events: none;
            z-index: 5; letter-spacing: 0.2px; line-height: 1.3;
        }
        .img-source-badge.badge-imgbb { color: #38bdf8; border-color: #0284c7; }
        .img-source-badge.badge-drive { color: #4ade80; border-color: #16a34a; }
    `;
    document.head.appendChild(style);
})();

function checkIsAdminPreviewMode() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === '1') return true;
        if (typeof safeLocal !== 'undefined') {
            const logged = safeLocal.getItem("adminLoggedInSession");
            const expiresAt = safeLocal.getItem("admin_expires_at");
            if (logged === "true" && expiresAt && Date.now() < parseInt(expiresAt, 10)) {
                return true;
            }
        }
    } catch(e) {}
    return false;
}

function fileToBase64Async(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            let res = String(reader.result || "");
            if (res.includes("base64,")) res = res.split("base64,")[1];
            resolve(res);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

function detectImageSource(url) {
    if (!url) return { text: "", cls: "" };
    const u = String(url).toLowerCase();
    if (u.includes("ibb.co") || u.includes("imgbb")) {
        return { text: "ImgBB", cls: "badge-imgbb" };
    }
    if (u.includes("drive.google") || u.includes("googleusercontent") || u.includes("script.google")) {
        return { text: "Google Drive", cls: "badge-drive" };
    }
    return { text: "Kho ảnh", cls: "" };
}

function getEffectiveImageUrl(q, imageMap) {
    if (!q) return "";
    if (!imageMap || typeof imageMap !== 'object') imageMap = {};

    if (q.imageUrl && String(q.imageUrl).trim() !== "") {
        return q.imageUrl.trim();
    }
    if (q.imageKey && imageMap[q.imageKey] && String(imageMap[q.imageKey]).trim() !== "") {
        return imageMap[q.imageKey].trim();
    }
    const possibleKeys = [
        `img_q_${q.id}`, `q${q.id}`, `${q.id}`,
        `dh_p1_c${q.id}`, `hy_p1_c${q.id}`, `pbc_p1_c${q.id}`, `dethem_p3_c${q.id}`
    ];
    for (let k of possibleKeys) {
        if (imageMap[k] && String(imageMap[k]).trim() !== "") {
            return imageMap[k].trim();
        }
    }
    return "";
}

function buildImgHtml(imgUrl, qId) {
    const hasUrl = Boolean(imgUrl && String(imgUrl).trim() !== "");
    const srcInfo = detectImageSource(imgUrl);
    return `
    <div class="quiz-img-container" id="img-container-${qId}" style="${hasUrl ? '' : 'display:none;'}">
        <div class="quiz-img-wrapper">
            <img src="${imgUrl || ''}" class="quiz-img" id="img-display-${qId}" referrerpolicy="no-referrer" loading="lazy" alt="Hình minh họa">
            <span class="img-source-badge ${srcInfo.cls}" id="img-source-${qId}" style="${hasUrl ? '' : 'display:none;'}">${srcInfo.text}</span>
        </div>
    </div>`;
}

function startImageSyncWatcher(quizId) {
    if (!quizId) return;
    if (imageSyncEventSource) {
        imageSyncEventSource.close();
        imageSyncEventSource = null;
    }

    const streamUrl = `${FIREBASE_DB_URL}/quizzes/${quizId}/image_sync.json`;
    imageSyncEventSource = new EventSource(streamUrl);

    const handleSyncEvent = function(e) {
        try {
            if (!e.data) return;
            const parsed = JSON.parse(e.data);
            if (!parsed) return;
            let syncData = parsed.path === "/" ? (parsed.data || {}) : parsed.data;
            if (!syncData || typeof syncData !== 'object' || !syncData.qId) return;
            applyRealtimeImageUpdate(syncData);
        } catch(err) {}
    };

    imageSyncEventSource.addEventListener('put', handleSyncEvent);
    imageSyncEventSource.addEventListener('patch', handleSyncEvent);
}

function applyRealtimeImageUpdate(syncData) {
    const qId = syncData.qId;
    const action = syncData.action;
    const newUrl = syncData.imageUrl || "";
    const imgKey = syncData.imageKey || `img_q_${qId}`;
    const isDeleteAction = (action === "delete" || !newUrl);

    if (examData) {
        if (!examData.images) examData.images = {};
        if (isDeleteAction) {
            delete examData.images[imgKey];
            delete examData.images[`img_q_${qId}`];
            delete examData.images[`q${qId}`];
            delete examData.images[`${qId}`];
            if (syncData.origKey) delete examData.images[syncData.origKey];
        } else {
            examData.images[imgKey] = newUrl;
        }

        if (Array.isArray(examData.questions)) {
            const targetQ = examData.questions.find(item => item && String(item.id) === String(qId));
            if (targetQ) {
                targetQ.imageUrl = isDeleteAction ? "" : newUrl;
                if (isDeleteAction && targetQ.imageKey) delete examData.images[targetQ.imageKey];
            }
        }
    }

    try {
        const examCode = typeof getExamCode === 'function' ? getExamCode() : "";
        const shuffleKey = `shuffled_exam_${examCode}`;
        const rawCached = safeLocal.getItem(shuffleKey);
        if (rawCached) {
            const parsedList = JSON.parse(rawCached);
            if (Array.isArray(parsedList)) {
                const qInCache = parsedList.find(item => item && String(item.id) === String(qId));
                if (qInCache) {
                    qInCache.imageUrl = isDeleteAction ? "" : newUrl;
                    safeLocal.setItem(shuffleKey, JSON.stringify(parsedList));
                }
            }
        }
    } catch(e) {}

    const containerEl = document.getElementById(`img-container-${qId}`);
    const imgEl = document.getElementById(`img-display-${qId}`);
    const badgeSrcEl = document.getElementById(`img-source-${qId}`);
    const delBtn = document.getElementById(`btn-del-img-${qId}`);
    const badgeEl = document.getElementById(`badge-has-img-${qId}`);

    if (isDeleteAction) {
        if (imgEl) { imgEl.src = ""; imgEl.style.display = "none"; }
        if (badgeSrcEl) { badgeSrcEl.innerText = ""; badgeSrcEl.style.display = "none"; }
        if (containerEl) containerEl.style.display = "none";
        if (delBtn) delBtn.style.display = "none";
        if (badgeEl) badgeEl.style.display = "none";
    } else {
        const srcInfo = detectImageSource(newUrl);
        if (imgEl) {
            imgEl.src = newUrl;
            imgEl.style.display = "inline-block";
            if (containerEl) containerEl.style.display = "block";
        } else if (containerEl) {
            containerEl.innerHTML = `
                <div class="quiz-img-wrapper">
                    <img src="${newUrl}" class="quiz-img" id="img-display-${qId}" referrerpolicy="no-referrer" loading="lazy" alt="Hình minh họa">
                    <span class="img-source-badge ${srcInfo.cls}" id="img-source-${qId}">${srcInfo.text}</span>
                </div>`;
            containerEl.style.display = "block";
        }
        if (badgeSrcEl) {
            badgeSrcEl.innerText = srcInfo.text;
            badgeSrcEl.className = `img-source-badge ${srcInfo.cls}`;
            badgeSrcEl.style.display = "inline-block";
        }
        if (delBtn) delBtn.style.display = "inline-flex";
        if (badgeEl) badgeEl.style.display = "inline-flex";
    }
}

async function uploadQuestionImageToImgBB(file, qId, imageKey, qIndex) {
    if (!file) return;
    const statusEl = document.getElementById(`img-status-${qId}`);
    const zoneEl = document.getElementById(`zone-q-${qId}`);

    if (zoneEl) zoneEl.style.pointerEvents = "none";

    if (statusEl) {
        statusEl.className = "admin-uploader-status loading";
        statusEl.innerText = "⏳ Đang đọc và chuẩn bị gửi ảnh...";
    }

    try {
        const base64Data = await fileToBase64Async(file);
        let directImgUrl = "";
        let uploadSource = "ImgBB";

        const hasValidImgbbKey = Boolean(IMGBB_API_KEY && !IMGBB_API_KEY.includes("THAY_API_KEY"));
        const hasDriveGasUrl = Boolean(
            typeof GOOGLE_DRIVE_UPLOAD_GAS_URL !== "undefined" && 
            GOOGLE_DRIVE_UPLOAD_GAS_URL && 
            !GOOGLE_DRIVE_UPLOAD_GAS_URL.includes("DÁN_URL")
        );

        let imgbbSuccess = false;

        if (hasValidImgbbKey) {
            if (statusEl) statusEl.innerText = "⏳ Đang gửi ảnh lên ImgBB (chờ tối đa 4s)...";

            const imgbbAbortController = new AbortController();
            const timeoutId = setTimeout(() => {
                try { imgbbAbortController.abort(); } catch(e) {}
            }, 4000);

            try {
                const formData = new FormData();
                formData.append("image", base64Data);

                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: "POST",
                    body: formData,
                    signal: imgbbAbortController.signal
                });

                clearTimeout(timeoutId);

                if (res && res.ok) {
                    const json = await res.json().catch(() => null);
                    if (json && json.success && json.data && (json.data.display_url || json.data.url)) {
                        directImgUrl = json.data.display_url || json.data.url;
                        imgbbSuccess = true;
                        uploadSource = "ImgBB";
                    }
                }
            } catch (imgbbErr) {
                clearTimeout(timeoutId);
            }
        }

        if (!imgbbSuccess) {
            if (!hasDriveGasUrl) {
                throw new Error("ImgBB không phản hồi trong 4 giây và chưa cấu hình GOOGLE_DRIVE_UPLOAD_GAS_URL trong app-config.js!");
            }

            if (statusEl) statusEl.innerText = "⚡ ImgBB quá 4s/bận, chuyển lưu ngay qua Google Drive...";

            uploadSource = "Google Drive";
            const drivePayload = {
                filename: `cau_${qId}_${Date.now()}.png`,
                mimeType: file.type || "image/png",
                base64: base64Data
            };

            const driveController = new AbortController();
            const driveTimer = setTimeout(() => {
                try { driveController.abort(); } catch(e) {}
            }, 45000);

            try {
                const driveRes = await fetch(GOOGLE_DRIVE_UPLOAD_GAS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(drivePayload),
                    signal: driveController.signal
                });

                clearTimeout(driveTimer);
                const driveJson = await driveRes.json();

                if (driveJson && driveJson.status === "success" && driveJson.fileUrl) {
                    directImgUrl = (typeof toDirectGoogleDriveImageUrl === "function") 
                        ? toDirectGoogleDriveImageUrl(driveJson.fileUrl) 
                        : driveJson.fileUrl;
                } else {
                    throw new Error(driveJson.message || "Máy chủ Google Drive không phản hồi đường dẫn.");
                }
            } catch (driveErr) {
                clearTimeout(driveTimer);
                if (driveErr.name === 'AbortError' || String(driveErr.message).includes('abort')) {
                    throw new Error("Google Drive phản hồi quá 45 giây do mạng chậm. Vui lòng thử lại!");
                }
                throw driveErr;
            }
        }

        if (!directImgUrl) {
            throw new Error("Không thể trích xuất đường dẫn ảnh sau khi tải.");
        }

        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('id');
        const effectiveKey = imageKey || `img_q_${qId}`;

        applyRealtimeImageUpdate({
            qId: qId,
            imageKey: effectiveKey,
            imageUrl: directImgUrl,
            action: "set"
        });

        if (quizId) {
            const syncPayload = {
                qId: qId,
                imageKey: effectiveKey,
                origKey: imageKey || "",
                imageUrl: directImgUrl,
                action: "set",
                ts: Date.now()
            };

            await Promise.all([
                fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/images/${effectiveKey}.json`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(directImgUrl)
                }).catch(() => null),
                fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/image_sync.json`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(syncPayload)
                }).catch(() => null)
            ]);

            try {
                const qRes = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/questions.json`);
                const qList = await qRes.json();
                if (Array.isArray(qList)) {
                    const targetIdx = qList.findIndex(item => item && String(item.id) === String(qId));
                    if (targetIdx !== -1) {
                        fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/questions/${targetIdx}.json`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ imageUrl: directImgUrl, imageKey: effectiveKey })
                        }).catch(() => null);
                    }
                }
            } catch(e) {}
        }

        if (statusEl) {
            statusEl.className = "admin-uploader-status success";
            statusEl.innerText = `✅ Đã lưu (${uploadSource}) & đồng bộ tức thì!`;
            setTimeout(() => { if (statusEl) statusEl.innerText = ""; }, 4000);
        }
    } catch(err) {
        let errMsg = err.message || "";
        if (err.name === 'AbortError' || errMsg.includes('abort')) {
            errMsg = "Quá thời gian kết nối máy chủ (mạng yếu hoặc máy chủ bận). Vui lòng thử lại!";
        }
        if (statusEl) {
            statusEl.className = "admin-uploader-status error";
            statusEl.innerText = "❌ Lỗi: " + errMsg;
        }
        alert("❌ Lỗi tải ảnh: " + errMsg);
    } finally {
        if (zoneEl) zoneEl.style.pointerEvents = "auto";
    }
}

async function deleteQuestionImage(qId, imageKey, qIdx) {
    const targetQ = examData && examData.questions ? examData.questions.find(item => item && String(item.id) === String(qId)) : null;
    const origKey = targetQ ? targetQ.imageKey : "";
    const effectiveKey = imageKey || origKey || `img_q_${qId}`;

    const statusEl = document.getElementById(`img-status-${qId}`);
    const imgEl = document.getElementById(`img-display-${qId}`);

    const currentImgUrl = (imgEl && imgEl.src && imgEl.style.display !== "none") 
        ? imgEl.src 
        : (examData && examData.images && (examData.images[effectiveKey] || (origKey && examData.images[origKey])));

    if (!currentImgUrl) {
        alert("⚠️ Câu này hiện tại không có ảnh để xóa!");
        return;
    }

    if (!confirm("⚠️ Bạn có chắc chắn muốn XÓA ảnh của câu này không?")) return;

    if (statusEl) {
        statusEl.className = "admin-uploader-status loading";
        statusEl.innerText = "⏳ Đang xóa ảnh & đồng bộ máy học sinh...";
    }

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('id');

        applyRealtimeImageUpdate({
            qId: qId,
            imageKey: effectiveKey,
            origKey: origKey,
            imageUrl: "",
            action: "delete"
        });

        if (quizId) {
            const syncPayload = {
                qId: qId,
                imageKey: effectiveKey,
                origKey: origKey || "",
                imageUrl: "",
                action: "delete",
                ts: Date.now()
            };

            const deleteTasks = [
                fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/image_sync.json`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(syncPayload)
                }),
                fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/images/${effectiveKey}.json`, {
                    method: "DELETE"
                })
            ];

            if (origKey && origKey !== effectiveKey) {
                deleteTasks.push(fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/images/${origKey}.json`, { method: "DELETE" }));
            }

            await Promise.all(deleteTasks);

            try {
                const qRes = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/questions.json`);
                const qList = await qRes.json();
                if (Array.isArray(qList)) {
                    const targetIdx = qList.findIndex(item => item && String(item.id) === String(qId));
                    if (targetIdx !== -1) {
                        await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/questions/${targetIdx}.json`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ imageUrl: "" })
                        });
                    }
                }
            } catch(e) {}
        }

        if (statusEl) {
            statusEl.className = "admin-uploader-status success";
            statusEl.innerText = "🗑️ Đã xóa ảnh & đồng bộ tới học sinh!";
            setTimeout(() => { if (statusEl) statusEl.innerText = ""; }, 3500);
        }
    } catch(err) {
        if (statusEl) {
            statusEl.className = "admin-uploader-status error";
            statusEl.innerText = "❌ Lỗi xóa ảnh: " + err.message;
        }
        alert("❌ Lỗi khi xóa ảnh: " + err.message);
    }
}

function setupAdminClipboardPasteListener() {
    document.querySelectorAll('.question-card').forEach(card => {
        card.addEventListener('paste', function(e) {
            const qId = this.dataset.qid;
            const imgKey = this.dataset.imgkey || `img_q_${qId}`;
            const qIdx = parseInt(this.dataset.qidx, 10);
            const clipboardItems = (e.clipboardData || window.clipboardData)?.items;
            if (!clipboardItems) return;

            for (let i = 0; i < clipboardItems.length; i++) {
                const item = clipboardItems[i];
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    uploadQuestionImageToImgBB(blob, qId, imgKey, qIdx);
                    break;
                }
            }
        });

        card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('dragover'); });
        card.addEventListener('dragleave', () => { card.classList.remove('dragover'); });
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('dragover');
            const qId = card.dataset.qid;
            const imgKey = card.dataset.imgkey || `img_q_${qId}`;
            const qIdx = parseInt(card.dataset.qidx, 10);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                uploadQuestionImageToImgBB(e.dataTransfer.files[0], qId, imgKey, qIdx);
            }
        });
    });
}

window.triggerPastePrompt = function(qId, imgKey) {
    const zone = document.getElementById(`zone-q-${qId}`);
    if (zone) zone.focus();
    if (typeof showTimeChangeToast === 'function') {
        showTimeChangeToast(`📋 Bạn vừa quét ảnh bằng Snipping Tool? Hãy bấm Ctrl + V để dán ngay cho Câu ${qId}!`);
    }
};

window.handleAdminFileSelected = function(input, qId, imgKey, qIdx) {
    if (input.files && input.files[0]) {
        uploadQuestionImageToImgBB(input.files[0], qId, imgKey, qIdx);
    }
};

window.deleteQuestionImage = deleteQuestionImage;