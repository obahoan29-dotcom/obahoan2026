// =========================================================
// FILE: exam-export.js
// QUẢN LÝ DỰ PHÒNG BÀI LÀM: TẢI FILE JSON TRỰC TIẾP & BẢO LƯU 100%
// =========================================================

function getPendingOrLiveSubmissionPayload() {
    if (typeof pendingSubmissionPayload !== 'undefined' && pendingSubmissionPayload) {
        return pendingSubmissionPayload;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id') || "exam";

    try {
        const rawBackup = safeLocal.getItem(`exam_completed_backup_${quizId}`);
        if (rawBackup) return JSON.parse(rawBackup);
    } catch(e) {}

    try {
        const rawPending = safeLocal.getItem("pending_exam_submission");
        if (rawPending) return JSON.parse(rawPending);
    } catch(e) {}

    // Tạo gói dự phòng trực tiếp từ trạng thái hiện tại nếu học sinh chưa ấn nộp
    const sId = document.getElementById("student-id")?.value.trim() || safeLocal.getItem("saved_student_sbd") || "sbd";
    const sName = document.getElementById("student-name")?.value.trim() || safeLocal.getItem("saved_student_name") || "Thí sinh";
    const sClass = document.getElementById("student-class")?.value.trim() || safeLocal.getItem("saved_student_class") || "Lớp";

    return {
        sbd: sId,
        studentId: sId,
        studentName: sName,
        className: sClass,
        studentClass: sClass,
        userAnswers: (window.SECURE_VAULT && window.SECURE_VAULT.userAnswers) || {},
        quizId: quizId,
        maDe: typeof getMaDe === 'function' ? getMaDe() : "101",
        examTitle: typeof EXAM_NAME !== 'undefined' ? EXAM_NAME : "Đề thi",
        timestamp: new Date().toLocaleString("vi-VN"),
        createdAt: Date.now()
    };
}

function generateSubmissionChecksum(payload) {
    try {
        const sId = String(payload.studentId || payload.sbd || "");
        const sName = String(payload.studentName || "");
        const sScore = String(payload.score10 !== undefined ? payload.score10 : "");
        const rawKey = `${sId}_${sName}_${sScore}_OBAHOAN_SECURE_2026`;
        
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

// NÚT LUÔN LUÔN CÓ MẶT Ở TRÊN CÙNG: BẤM VÀO LÀ TẢI FILE NGAY LẬP TỨC
function downloadCompletedOrDraftSubmission() {
    const payload = getPendingOrLiveSubmissionPayload();
    if (!payload) {
        alert("⚠️ Không tìm thấy bài làm trên máy này!");
        return;
    }

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

    executeBrowserFileDownload(blob, fileName);
    alert(`✅ ĐÃ TẢI FILE DỰ PHÒNG THÀNH CÔNG!\n\n📁 Tên file: "${fileName}"\n📍 Vị trí: Đã lưu vào mục "Tải về" (Downloads) trên máy của bạn.\n\n👉 Bạn hãy gửi file đính kèm này cho Thầy giáo khi có sự cố mạng nhé!`);
}

window.downloadCompletedOrDraftSubmission = downloadCompletedOrDraftSubmission;
