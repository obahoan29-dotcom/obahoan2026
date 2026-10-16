// =========================================================
// FILE: exam-export.js
// QUẢN LÝ DỰ PHÒNG BÀI LÀM: TẢI FILE JSON TỰ CHỌN NƠI LƯU,
// COPY MÃ BÀI LÀM TRỰC TIẾP & GỬI QUA ZALO / MESSENGER
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

// Tự động kiểm tra và bổ sung nút "Sao chép mã bài làm" vào Modal nếu chưa có
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
            <b style="color: #92400e;">Sao chép mã bài làm (Không cần tìm tệp)</b>
            <span style="color: #b45309;">Copy toàn bộ dữ liệu, mở Zalo/Messenger nhấn giữ "Dán" gửi Thầy</span>
        </div>
        <span class="share-opt-arrow" style="color: #d97706;">➔</span>
    `;

    // Chèn ngay dưới nút Tải file (.json) về máy
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

// TÍNH NĂNG CHỌN NƠI LƯU TRÊN MÁY (SAVE AS) + TỰ ĐỘNG SAO CHÉP DỰ PHÒNG
async function actionDownloadJsonDirectly() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;

    // Tự động sao chép sẵn dữ liệu bài thi vào bộ nhớ tạm phòng hờ
    copyTextToClipboard(fileInfo.jsonStr);

    // 1. Nếu trình duyệt hỗ trợ File System Access API: Mở cửa sổ "Lưu dưới dạng..." (Save As)
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

            alert(`✅ ĐÃ LƯU THÀNH CÔNG!\n\nFile "${fileInfo.fileName}" đã được lưu chính xác vào thư mục bạn chọn trên máy!\n\n💡 Mẹo: Toàn bộ mã bài làm cũng đã được tự động copy vào bộ nhớ tạm, bạn có thể dán vào tin nhắn gửi giáo viên nếu cần.`);
            closeExportShareModal();
            return;
        } catch (err) {
            // Nếu học sinh chủ động bấm Cancel (Hủy bỏ) hộp thoại chọn thư mục
            if (err.name === "AbortError") {
                return;
            }
            console.warn("showSaveFilePicker lỗi hoặc không được cấp quyền, chuyển sang tải thông thường:", err);
        }
    }

    // 2. Fallback cho các thiết bị di động không hỗ trợ hộp thoại Save As
    executeBrowserFileDownload(fileInfo.blob, fileInfo.fileName);

    alert(`✅ ĐÃ TẢI FILE VỀ MÁY!\n\n📁 Tên file: "${fileInfo.fileName}"\n📍 Vị trí: Đã lưu vào mục "Tải về" (Downloads) trên máy của bạn.\n\n💡 NẾU TÌM KHÔNG THẤY FILE TRÊN MÁY:\nHệ thống đã TỰ ĐỘNG SAO CHÉP toàn bộ mã bài làm vào bộ nhớ tạm. Bạn chỉ cần mở cuộc trò chuyện với Thầy giáo trên Zalo/Messenger, ấn giữ vào ô nhập tin nhắn và chọn "DÁN" (Paste) để gửi trực tiếp!`);
    closeExportShareModal();
}

// TÍNH NĂNG SAO CHÉP TRỰC TIẾP MÃ BÀI LÀM (KHÔNG CẦN TÌM TỆP)
function actionCopyRawJsonToClipboard() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;

    copyTextToClipboard(fileInfo.jsonStr);
    alert(`📋 ĐÃ SAO CHÉP MÃ BÀI THI THÀNH CÔNG!\n\nToàn bộ dữ liệu bài làm của ${payload.studentName} đã được lưu vào bộ nhớ tạm của máy.\n\n👉 Bạn hãy mở Zalo hoặc Messenger của Thầy giáo, ấn giữ vào ô gõ tin nhắn và chọn "DÁN" (Paste) để gửi cho Thầy ghi nhận điểm nhé!`);
    closeExportShareModal();
}

async function actionShareNativeApp() {
    const payload = getPendingPayloadOrRebuild();
    if (!payload) return;
    const fileInfo = getSubmissionBlobAndFileName(payload);
    if (!fileInfo) return;

    copyTextToClipboard(fileInfo.jsonStr);

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
