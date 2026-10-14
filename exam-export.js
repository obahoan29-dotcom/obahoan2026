// =========================================================
// FILE: exam-export.js
// QUẢN LÝ DỰ PHÒNG BÀI LÀM: TẢI FILE JSON & GỬI QUA ZALO / MESSENGER
// =========================================================

function getPendingPayloadOrRebuild() {
    if (pendingSubmissionPayload) return pendingSubmissionPayload;
    try {
        const raw = safeLocal.getItem("pending_exam_submission");
        if (raw) {
            pendingSubmissionPayload = JSON.parse(raw);
            return pendingSubmissionPayload;
        }
    } catch(e) {}
    return null;
}

function getSubmissionBlobAndFileName(payload) {
    if (!payload) return null;
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const sId = (payload.studentId || "sbd").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const sName = (payload.studentName || "hocsinh").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const fileName = `BaiLam_${sId}_${sName}.json`;
    return { blob, fileName, jsonStr };
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

function openExportShareModal() {
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

function actionDownloadJsonDirectly() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;
    executeBrowserFileDownload(fileInfo.blob, fileInfo.fileName);
    alert(`✅ ĐÃ LƯU THÀNH CÔNG!\n\nFile "${fileInfo.fileName}" đã được tải về máy của bạn.\nHãy giữ file này gửi cho giáo viên để làm bằng chứng tính điểm.`);
    closeExportShareModal();
}

async function actionShareNativeApp() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;

    try {
        const fileObj = new File([fileInfo.blob], fileInfo.fileName, { type: "application/json" });
        if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
            await navigator.share({
                title: `Bài thi ${payload.studentName}`,
                text: `Thưa thầy/cô, em gửi file bài làm: ${payload.examName || 'Bài thi'} (Họ tên: ${payload.studentName} - SBD: ${payload.studentId} - Lớp: ${payload.studentClass}).`,
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
    const message = `Thưa thầy/cô, em gửi bài làm thi:\n- Đề thi: ${payload.examName || payload.examTitle || 'Đề thi'}\n- Họ và tên: ${payload.studentName}\n- SBD: ${payload.studentId} | Lớp: ${payload.studentClass}\n- Điểm làm bài: ${payload.score10 ?? '---'}đ\n(Em đã tải file "${fileInfo.fileName}" về máy, em gửi đính kèm cho thầy/cô ạ!)`;
    copyTextToClipboard(message);

    alert(`📋 ĐÃ CHUẨN BỊ XONG BÀI THI:\n\n1. File "${fileInfo.fileName}" đã được tải về máy của bạn.\n2. Lời nhắn bài thi đã được tự động COPY vào bộ nhớ đệm.\n\n👉 Hệ thống sẽ chuyển sang ZALO ngay bây giờ, bạn chỉ cần bấm Dán (Paste) tin nhắn và đính kèm gửi file vừa tải cho Thầy nhé!`);

    closeExportShareModal();
    window.open(TEACHER_ZALO_LINK || "https://zalo.me", "_blank");
}

function actionSendViaMessenger() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;

    executeBrowserFileDownload(fileInfo.blob, fileInfo.fileName);
    const message = `Thưa thầy/cô, em gửi bài làm thi:\n- Đề thi: ${payload.examName || payload.examTitle || 'Đề thi'}\n- Họ và tên: ${payload.studentName}\n- SBD: ${payload.studentId} | Lớp: ${payload.studentClass}\n- Điểm làm bài: ${payload.score10 ?? '---'}đ\n(Em đã tải file "${fileInfo.fileName}" về máy, em gửi đính kèm cho thầy/cô ạ!)`;
    copyTextToClipboard(message);

    alert(`📋 ĐÃ CHUẨN BỊ XONG BÀI THI:\n\n1. File "${fileInfo.fileName}" đã được tải về máy của bạn.\n2. Lời nhắn bài thi đã được tự động COPY vào bộ nhớ đệm.\n\n👉 Hệ thống sẽ chuyển sang MESSENGER ngay bây giờ, bạn chỉ việc Dán (Paste) và gửi file vừa tải cho Thầy nhé!`);

    closeExportShareModal();
    window.open(TEACHER_MESSENGER_LINK || "https://m.me", "_blank");
}

function retrySubmitPending() { 
    if (!pendingSubmissionPayload) { try { const raw = safeLocal.getItem("pending_exam_submission"); if (raw) pendingSubmissionPayload = JSON.parse(raw); } catch(e) {} } 
    if (!pendingSubmissionPayload) { document.getElementById("pending-resend-bar").style.display = "none"; return; } 
    const infoText = document.getElementById("pending-info-txt"); infoText.innerText = "⏳ Đang thử gửi lại dữ liệu..."; 

    Promise.all([ 
        postToGoogleSheet(URL2_EXAM_RESULT, pendingSubmissionPayload, 15000), 
        fetch(`${FIREBASE_DB_URL}/exams/${getExamCode()}/submissions.json`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pendingSubmissionPayload) })
    ]).then(() => { 
        safeLocal.removeItem("pending_exam_submission"); pendingSubmissionPayload = null; document.getElementById("pending-resend-bar").style.display = "none"; alert("✅ Đã gửi lại dữ liệu thành công!"); 
    }).catch(() => { 
        infoText.innerText = "⚠️ Lỗi khi gửi lại! Vui lòng bấm 'Tải file' để gửi qua Zalo/Messenger cho giáo viên."; 
    }); 
}