// =========================================================
// FILE: exam-export.js
// QUẢN LÝ DỰ PHÒNG BÀI LÀM: TẢI FILE JSON TỰ CHỌN NƠI LƯU,
// SAO CHÉP DẠNG FILE .JSON VÀO CLIPBOARD & GỬI QUA ZALO / MESSENGER
// =========================================================

function getPendingPayloadOrRebuild() {
    if (typeof pendingSubmissionPayload !== 'undefined' && pendingSubmissionPayload) {
        return pendingSubmissionPayload;
    }
    try {
        const raw = safeLocal.getItem("pending_exam_submission");
        if (raw) {
            pendingSubmissionPayload = JSON.parse(raw);
            return pendingSubmissionPayload;
        }
    } catch(e) {}
    return null;
}

// Tạo chữ ký số băm nhanh để khóa điểm và chống học sinh sửa dữ liệu
function generateSubmissionChecksum(payload) {
    try {
        const sId = String(payload.studentId || payload.sbd || "");
        const sName = String(payload.studentName || "");
        const sScore = String(payload.score10 !== undefined ? payload.score10 : "");
        const sData = String(payload.dataString || "");
        const rawKey = `${sId}_${sName}_${sScore}_${sData}_OBAHOAN_SECURE_2026`;
        
        let hash = 0;
        for (let i = 0; i < rawKey.length; i++) {
            const char = rawKey.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return "SEC_" + Math.abs(hash).toString(36).toUpperCase();
    } catch (e) {
        return "SEC_VALID";
    }
}

function getSubmissionBlobAndFileName(payload) {
    if (!payload) return null;
    
    // Gắn thêm chữ ký chống sửa điểm trước khi đóng gói
    const securedPayload = {
        ...payload,
        _integrityChecksum: generateSubmissionChecksum(payload),
        exportedAt: Date.now()
    };

    const jsonStr = JSON.stringify(securedPayload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const sId = (payload.studentId || payload.sbd || "sbd").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const sName = (payload.studentName || "hocsinh").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const fileName = `BaiLam_${sId}_${sName}.json`;
    return { blob, fileName, jsonStr, securedPayload };
}

function executeBrowserFileDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
    } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch(e) {}
        document.body.removeChild(ta);
    }
}

function ensureCopyCodeOptionInModal() {
    const list = document.querySelector("#export-share-modal .share-options-list");
    if (!list || document.getElementById("btn-opt-copy-raw-json")) return;

    const btnCopy = document.createElement("button");
    btnCopy.type = "button";
    btnCopy.id = "btn-opt-copy-raw-json";
    btnCopy.className = "btn-share-option";
    btnCopy.style.borderColor = "#fcd34d";
    btnCopy.style.background = "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)";
    btnCopy.onclick = actionCopyRawJsonToClipboard;
    btnCopy.innerHTML = `
        <span class="share-opt-icon">📋</span>
        <div class="share-opt-text">
            <b style="color: #92400e;">Sao chép mã bài làm (Dạng file .json)</b>
            <span style="color: #b45309;">Lưu dạng file tệp tin, mở Zalo/Messenger dán hoặc gửi trực tiếp</span>
        </div>
        <span class="share-opt-arrow" style="color: #d97706;">➔</span>
    `;

    const downloadBtn = list.querySelector(".btn-opt-download");
    if (downloadBtn && downloadBtn.nextSibling) {
        list.insertBefore(btnCopy, downloadBtn.nextSibling);
    } else {
        list.prepend(btnCopy);
    }
}

function openExportShareModal() {
    ensureCopyCodeOptionInModal();
    const modal = document.getElementById("export-share-modal");
    if (modal) modal.style.display = "flex";
}

function closeExportShareModal() {
    const modal = document.getElementById("export-share-modal");
    if (modal) modal.style.display = "none";
}

function downloadPendingSubmissionFile() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) {
        alert("⚠️ Chưa tìm thấy dữ liệu bài làm tạm để lưu!");
        return;
    }
    openExportShareModal();
}

async function actionDownloadJsonDirectly() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;

    if (typeof window.showSaveFilePicker === "function") {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileInfo.fileName,
                types: [{
                    description: "Tệp dữ liệu bài thi JSON (*.json)",
                    accept: { "application/json": [".json"] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(fileInfo.jsonStr);
            await writable.close();

            alert(`✅ ĐÃ LƯU THÀNH CÔNG!\n\nFile "${fileInfo.fileName}" đã được lưu chính xác vào thư mục bạn chọn trên máy! Bạn chỉ cần gửi file này cho Thầy giáo.`);
            closeExportShareModal();
            return;
        } catch (err) {
            if (err.name === "AbortError") return;
            console.warn("showSaveFilePicker chuyển sang fallback tải chuẩn:", err);
        }
    }

    executeBrowserFileDownload(fileInfo.blob, fileInfo.fileName);
    alert(`✅ ĐÃ TẢI FILE VỀ MÁY!\n\n📁 Tên file: "${fileInfo.fileName}"\n📍 Vị trí: Đã lưu vào mục "Tải về" (Downloads) trên máy của bạn.\n\n👉 Bạn hãy gửi file đính kèm này qua Zalo/Messenger cho Thầy để ghi nhận điểm nhé!`);
    closeExportShareModal();
}

async function actionCopyRawJsonToClipboard() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;

    const fileObj = new File([fileInfo.blob], fileInfo.fileName, { type: "application/json" });

    let clipboardFileSuccess = false;
    if (navigator.clipboard && window.ClipboardItem) {
        try {
            const clipboardItem = new ClipboardItem({
                [fileInfo.blob.type]: fileInfo.blob
            });
            await navigator.clipboard.write([clipboardItem]);
            clipboardFileSuccess = true;
        } catch (clipErr) {
            clipboardFileSuccess = false;
        }
    }

    if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
        try {
            await navigator.share({
                title: `Bài làm: ${payload.studentName}`,
                text: `Thưa thầy, em gửi file bài làm dự phòng: ${fileInfo.fileName}`,
                files: [fileObj]
            });
            closeExportShareModal();
            return;
        } catch (shareErr) {
            if (shareErr.name === 'AbortError') return;
        }
    }

    executeBrowserFileDownload(fileInfo.blob, fileInfo.fileName);

    if (clipboardFileSuccess) {
        alert(`📁 ĐÃ SAO CHÉP FILE "${fileInfo.fileName}" VÀO BỘ NHỚ!\n\n👉 Bạn chỉ cần mở Zalo hoặc Messenger của Thầy giáo, bấm Ctrl + V (hoặc Dán) là file .json sẽ được đính kèm gửi ngay lập tức!`);
    } else {
        alert(`✅ ĐÃ TẠO FILE DỰ PHÒNG THÀNH CÔNG!\n\n📁 File "${fileInfo.fileName}" đã được tải về máy của bạn.\n🔒 Dữ liệu đã được khóa bảo mật chống can thiệp điểm số.\n\n👉 Bạn hãy mở Zalo / Messenger, chọn biểu tượng [Đính kèm File/Tệp] và gửi file "${fileInfo.fileName}" cho Thầy nhé!`);
    }

    closeExportShareModal();
}

async function actionShareNativeApp() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;

    const fileObj = new File([fileInfo.blob], fileInfo.fileName, { type: "application/json" });

    try {
        if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
            await navigator.share({
                title: `Bài thi ${payload.studentName}`,
                text: `Thưa thầy/cô, em gửi file bài làm: ${payload.examName || payload.examTitle || 'Bài thi'} (Họ tên: ${payload.studentName} - SBD: ${payload.studentId || payload.sbd} - Lớp: ${payload.studentClass || payload.className}).`,
                files: [fileObj]
            });
            closeExportShareModal();
            return;
        }
    } catch(err) {
        if (err.name !== 'AbortError') console.warn("Lỗi Web Share API:", err);
        else return;
    }

    actionDownloadJsonDirectly();
}

function actionSendViaZalo() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;

    executeBrowserFileDownload(fileInfo.blob, fileInfo.fileName);
    alert(`📋 ĐÃ CHUẨN BỊ XONG BÀI THI:\n\n1. File "${fileInfo.fileName}" đã được tải về máy của bạn.\n2. Hệ thống sẽ tự động chuyển sang Zalo của Thầy.\n\n👉 Bạn chỉ cần chọn biểu tượng đính kèm File (Tệp) trên Zalo và gửi file "${fileInfo.fileName}" vừa tải nhé!`);

    closeExportShareModal();
    const zaloUrl = (typeof TEACHER_ZALO_LINK !== 'undefined' && TEACHER_ZALO_LINK) ? TEACHER_ZALO_LINK : "https://zalo.me";
    window.open(zaloUrl, "_blank");
}

function actionSendViaMessenger() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;

    executeBrowserFileDownload(fileInfo.blob, fileInfo.fileName);
    alert(`📋 ĐÃ CHUẨN BỊ XONG BÀI THI:\n\n1. File "${fileInfo.fileName}" đã được tải về máy của bạn.\n2. Hệ thống sẽ tự động chuyển sang Messenger của Thầy.\n\n👉 Bạn chỉ cần bấm vào biểu tượng đính kèm File và gửi file "${fileInfo.fileName}" cho Thầy nhé!`);

    closeExportShareModal();
    const messUrl = (typeof TEACHER_MESSENGER_LINK !== 'undefined' && TEACHER_MESSENGER_LINK) ? TEACHER_MESSENGER_LINK : "https://m.me";
    window.open(messUrl, "_blank");
}

// GỬI LẠI BÀI KHI CÓ MẠNG: CHUẨN HÓA VÀO ĐỊA CHỈ DUY NHẤT TRÊN FIREBASE
function retrySubmitPending() { 
    if (!pendingSubmissionPayload) { 
        try { 
            const raw = safeLocal.getItem("pending_exam_submission"); 
            if (raw) pendingSubmissionPayload = JSON.parse(raw); 
        } catch(e) {} 
    } 
    if (!pendingSubmissionPayload) { 
        document.getElementById("pending-resend-bar").style.display = "none"; 
        return; 
    } 
    const infoText = document.getElementById("pending-info-txt"); 
    infoText.innerText = "⏳ Đang thử gửi lại dữ liệu..."; 

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id') || pendingSubmissionPayload.quizId || "exam";
    const cleanSbd = String(pendingSubmissionPayload.sbd || pendingSubmissionPayload.studentId || "user").replace(/[^a-zA-Z0-9]/g, '_');

    Promise.all([ 
        (typeof postToGoogleSheet === 'function' && typeof URL2_EXAM_RESULT !== 'undefined') 
            ? postToGoogleSheet(URL2_EXAM_RESULT, pendingSubmissionPayload, 15000).catch(() => null) 
            : Promise.resolve(), 
        fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}/submissions/${cleanSbd}.json`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(pendingSubmissionPayload) 
        }),
        fetch(`${FIREBASE_DB_URL}/exams/${quizId}/submissions/${cleanSbd}.json`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(pendingSubmissionPayload) 
        })
    ]).then(() => { 
        safeLocal.removeItem("pending_exam_submission"); 
        pendingSubmissionPayload = null; 
        document.getElementById("pending-resend-bar").style.display = "none"; 
        alert("✅ Đã gửi lại bài thi lên máy chủ thành công!"); 
    }).catch(() => { 
        infoText.innerText = "⚠️ Lỗi khi gửi lại! Vui lòng bấm 'Tải file' để gửi qua Zalo/Messenger cho giáo viên."; 
    }); 
}
