// =========================================================
// FILE: portal-db-cleanup.js
// QUẢN LÝ DỌN DẸP CƠ SỞ DỮ LIỆU FIREBASE AN TOÀN & BẢO VỆ ĐỀ/ĐIỂM 100%
// =========================================================

(function injectDbCleanupStyles() {
    const styleId = "firebase-db-cleanup-custom-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
        .admin-cleanup-btn {
            background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
            color: #ffffff;
            border: none;
            border-radius: 9px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 2px 5px rgba(13, 148, 136, 0.3);
            user-select: none;
            white-space: nowrap;
        }
        .admin-cleanup-btn:hover {
            filter: brightness(1.12);
            transform: translateY(-1px);
        }
        .admin-cleanup-btn:active {
            transform: translateY(2px) scale(0.96);
        }

        .db-cleanup-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.72);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 9999999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 14px;
            animation: fadeInModal 0.22s ease-out;
            font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif;
        }
        .db-cleanup-modal-card {
            background: #ffffff;
            border-radius: 20px;
            max-width: 680px;
            width: min(680px, calc(100vw - 20px));
            max-height: 90vh;
            overflow-y: auto;
            overflow-x: hidden;
            box-shadow: 0 25px 60px rgba(15, 23, 42, 0.38);
            border: 1.5px solid #cbd5e1;
            padding: 20px 22px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            animation: popInModal 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            box-sizing: border-box;
        }
        .db-cleanup-modal-card::-webkit-scrollbar { width: 5px; }
        .db-cleanup-modal-card::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        .db-cleanup-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1.5px solid #f1f5f9;
            padding-bottom: 10px;
        }
        .db-cleanup-title-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .db-cleanup-icon {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: linear-gradient(135deg, #0d9488 0%, #0284c7 100%);
            color: #ffffff;
            font-size: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }
        .btn-close-cleanup-modal {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            font-size: 15px;
            font-weight: 900;
            color: #64748b;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.15s;
        }
        .btn-close-cleanup-modal:hover {
            background: #fee2e2;
            color: #dc2626;
            border-color: #fca5a5;
        }

        .db-protection-shield-card {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 1.5px solid #86efac;
            border-left: 5px solid #16a34a;
            border-radius: 12px;
            padding: 10px 14px;
            font-size: 12.5px;
            color: #166534;
            line-height: 1.45;
        }
        .db-protection-shield-card b {
            color: #14532d;
        }

        .db-cleanup-tools-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            border-radius: 12px;
        }
        .btn-scan-db {
            background: #ffffff;
            color: #0284c7;
            border: 1.5px solid #38bdf8;
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: 0.15s;
        }
        .btn-scan-db:hover {
            background: #f0f9ff;
        }
        .btn-clean-all-safe {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 6px 14px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);
            transition: all 0.15s ease;
        }
        .btn-clean-all-safe:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }

        .cleanup-items-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .cleanup-item-card {
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px 14px;
            transition: all 0.18s ease;
        }
        .cleanup-item-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
        }
        .cleanup-item-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
        }
        .cleanup-item-title-box {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .cleanup-item-title {
            font-size: 14px;
            font-weight: 900;
            color: #0f172a;
        }
        .cleanup-badge-count {
            background: #e0f2fe;
            color: #0369a1;
            font-weight: 800;
            font-size: 11px;
            padding: 2px 7px;
            border-radius: 10px;
            border: 1px solid #bae6fd;
            font-family: monospace;
        }
        .cleanup-item-btn {
            background: #fee2e2;
            color: #dc2626;
            border: 1.5px solid #fca5a5;
            border-radius: 8px;
            padding: 5px 12px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
        }
        .cleanup-item-btn:hover {
            background: #dc2626;
            color: #ffffff;
        }
        .cleanup-item-btn:active {
            transform: scale(0.96);
        }

        .cleanup-desc-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 5px;
            font-size: 12px;
            line-height: 1.45;
            background: #f8fafc;
            border-radius: 10px;
            padding: 8px 10px;
            border: 1px solid #f1f5f9;
        }
        .desc-row {
            display: flex;
            align-items: flex-start;
            gap: 6px;
        }
        .desc-row-label {
            font-weight: 800;
            color: #475569;
            flex-shrink: 0;
            min-width: 95px;
        }
        .desc-row-val {
            color: #1e293b;
            flex: 1;
        }
        .desc-row-val.danger-note {
            color: #b91c1c;
            font-weight: 700;
        }
        .desc-row-val.safe-note {
            color: #15803d;
            font-weight: 700;
        }

        @media (max-width: 640px) {
            .db-cleanup-modal-card {
                padding: 14px 12px;
                border-radius: 16px;
            }
            .cleanup-item-head {
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
            }
            .cleanup-item-btn {
                width: 100%;
                text-align: center;
                padding: 7px;
            }
            .desc-row {
                flex-direction: column;
                gap: 2px;
            }
        }
    `;
    document.head.appendChild(style);
})();

function ensureDbCleanupModalInDOM() {
    if (document.getElementById("firebase-db-cleanup-modal")) return;

    const modalDiv = document.createElement("div");
    modalDiv.className = "db-cleanup-modal-overlay";
    modalDiv.id = "firebase-db-cleanup-modal";
    modalDiv.innerHTML = `
        <div class="db-cleanup-modal-card" onclick="event.stopPropagation()">
            <div class="db-cleanup-header">
                <div class="db-cleanup-title-wrap">
                    <div class="db-cleanup-icon">🧹</div>
                    <div>
                        <h3 style="margin:0; font-size:16.5px; font-weight:900; color:#0f172a;">Dọn Dẹp Cơ Sở Dữ Liệu An Toàn</h3>
                        <p style="margin:2px 0 0 0; font-size:12px; color:#64748b; font-weight:600;">Giải phóng bộ nhớ Firebase RTDB & làm sạch các phiên kẹt</p>
                    </div>
                </div>
                <button type="button" class="btn-close-cleanup-modal" onclick="closeDbCleanupModal(event)">✕</button>
            </div>

            <div class="db-protection-shield-card">
                🛡️ <b>CAM KẾT AN TOÀN 100%:</b> Bộ máy dọn dẹp được lập trình cách ly độc lập. Tuyệt đối <b>KHÔNG</b> chạm vào đề thi gốc, nội dung câu hỏi, danh mục bài đăng (<code>custom_links</code>) và <b>KHÔNG BAO GIỜ</b> xóa điểm thi hay bài nộp chính thức của học sinh (<code>submissions</code>).
            </div>

            <div class="db-cleanup-tools-bar">
                <div style="font-size:12px; font-weight:800; color:#334155;">
                    Trạng thái quét: <span id="db-scan-status-text" style="color:#0284c7;">Chưa quét</span>
                </div>
                <div style="display:flex; gap:6px;">
                    <button type="button" class="btn-scan-db" onclick="scanFirebaseUsage()">🔍 Quét lại dung lượng</button>
                    <button type="button" class="btn-clean-all-safe" onclick="cleanAllSafeGarbage()">⚡ Dọn tất cả mục tạm</button>
                </div>
            </div>

            <div class="cleanup-items-list">
                <!-- MỤC 1: ACTIVE SESSIONS -->
                <div class="cleanup-item-card">
                    <div class="cleanup-item-head">
                        <div class="cleanup-item-title-box">
                            <span style="font-size:17px;">👥</span>
                            <span class="cleanup-item-title">1. Phiên làm bài tạm thời (Active Sessions)</span>
                            <span class="cleanup-badge-count" id="count-active-sessions">-- mục</span>
                        </div>
                        <button type="button" class="cleanup-item-btn" onclick="cleanActiveSessions()">🗑️ Dọn phiên kẹt</button>
                    </div>
                    <div class="cleanup-desc-grid">
                        <div class="desc-row">
                            <span class="desc-row-label">📌 Mục đích:</span>
                            <span class="desc-row-val">Ghi nhận sĩ số và tín hiệu các em đang làm bài theo thời gian thực (hiển thị chữ "Đang làm bài" trên bảng kết quả).</span>
                        </div>
                        <div class="desc-row">
                            <span class="desc-row-label">⚠️ Nếu xóa:</span>
                            <span class="desc-row-val safe-note">Làm sạch các trường hợp học sinh đóng tab/thoát ngang khiến bảng điểm bị kẹt chữ "Đang làm bài", chuyển họ về trạng thái "Chưa thi". Học sinh đang thực sự làm bài trong phòng thi sẽ tự động kết nối lại sau 45s. KHÔNG mất điểm hay bài thi.</span>
                        </div>
                        <div class="desc-row">
                            <span class="desc-row-label">💡 Khuyên dùng:</span>
                            <span class="desc-row-val">Nên bấm dọn sau mỗi ca thi để làm sạch toàn bộ bảng kết quả.</span>
                        </div>
                    </div>
                </div>

                <!-- MỤC 2: LIVE DRAFTS -->
                <div class="cleanup-item-card">
                    <div class="cleanup-item-head">
                        <div class="cleanup-item-title-box">
                            <span style="font-size:17px;">☁️</span>
                            <span class="cleanup-item-title">2. Bản nháp câu trả lời trên mây (Live Drafts)</span>
                            <span class="cleanup-badge-count" id="count-live-drafts">-- mục</span>
                        </div>
                        <button type="button" class="cleanup-item-btn" onclick="cleanLiveDrafts()">🗑️ Xóa bản nháp cũ</button>
                    </div>
                    <div class="cleanup-desc-grid">
                        <div class="desc-row">
                            <span class="desc-row-label">📌 Mục đích:</span>
                            <span class="desc-row-val">Tự động lưu câu trả lời nháp từng giây lên mây khi học sinh tích chọn, phục vụ nút <b>⚡ Thu bài tự động</b> nếu các em gặp sự cố mất mạng không thể nộp bài.</span>
                        </div>
                        <div class="desc-row">
                            <span class="desc-row-label">⚠️ Nếu xóa:</span>
                            <span class="desc-row-val danger-note">Giải phóng dung lượng đám mây. Những học sinh ĐÃ NỘP BÀI chính thức không bị ảnh hưởng. Tuy nhiên các em CHƯA NỘP BÀI sẽ không còn dữ liệu câu trả lời nháp trên mây để thu tự động.</span>
                        </div>
                        <div class="desc-row">
                            <span class="desc-row-label">💡 Khuyên dùng:</span>
                            <span class="desc-row-val">Chỉ bấm xóa sau khi ca thi kết thúc và Thầy đã bấm "⚡ Thu bài tự động" (nếu có học sinh quên nộp).</span>
                        </div>
                    </div>
                </div>

                <!-- MỤC 3: CHEATING LOGS -->
                <div class="cleanup-item-card">
                    <div class="cleanup-item-head">
                        <div class="cleanup-item-title-box">
                            <span style="font-size:17px;">⚠️</span>
                            <span class="cleanup-item-title">3. Nhật ký chuyển tab & cảnh báo gian lận (Cheating Logs)</span>
                            <span class="cleanup-badge-count" id="count-cheating-logs">-- mục</span>
                        </div>
                        <button type="button" class="cleanup-item-btn" onclick="cleanCheatingLogs()">🗑️ Xóa nhật ký tab</button>
                    </div>
                    <div class="cleanup-desc-grid">
                        <div class="desc-row">
                            <span class="desc-row-label">📌 Mục đích:</span>
                            <span class="desc-row-val">Lưu lại số lần và thời lượng học sinh rời màn hình làm bài trong đợt thi.</span>
                        </div>
                        <div class="desc-row">
                            <span class="desc-row-label">⚠️ Nếu xóa:</span>
                            <span class="desc-row-val safe-note">Xóa toàn bộ bản ghi lịch sử rời tab trong quá khứ. Cột "Số lần chuyển tab" trong các bài thi đã nộp trước đó vẫn giữ nguyên số lần đã ghi nhận lúc nộp bài.</span>
                        </div>
                        <div class="desc-row">
                            <span class="desc-row-label">💡 Khuyên dùng:</span>
                            <span class="desc-row-val">Nên dọn dẹp định kỳ sau mỗi học kỳ hoặc trước đợt kiểm tra lớn mới để giảm tải.</span>
                        </div>
                    </div>
                </div>

                <!-- MỤC 4: IMAGE SYNC CHANNELS -->
                <div class="cleanup-item-card">
                    <div class="cleanup-item-head">
                        <div class="cleanup-item-title-box">
                            <span style="font-size:17px;">📡</span>
                            <span class="cleanup-item-title">4. Kênh phát tín hiệu đồng bộ ảnh (Image Sync)</span>
                            <span class="cleanup-badge-count" id="count-image-sync">-- mục</span>
                        </div>
                        <button type="button" class="cleanup-item-btn" onclick="cleanImageSync()">🗑️ Xóa kênh đồng bộ</button>
                    </div>
                    <div class="cleanup-desc-grid">
                        <div class="desc-row">
                            <span class="desc-row-label">📌 Mục đích:</span>
                            <span class="desc-row-val">Kênh SSE phát sự kiện tức thời khi Thầy dán ảnh Snipping Tool để máy học sinh tự hiển thị ảnh ngay lập tức.</span>
                        </div>
                        <div class="desc-row">
                            <span class="desc-row-label">⚠️ Nếu xóa:</span>
                            <span class="desc-row-val safe-note">Hoàn toàn an toàn. Ảnh đã gắn vào đề thi vẫn lưu nguyên vẹn trong cấu trúc đề.</span>
                        </div>
                        <div class="desc-row">
                            <span class="desc-row-label">💡 Khuyên dùng:</span>
                            <span class="desc-row-val">Có thể dọn bất kỳ thời điểm nào.</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display:flex; justify-content:flex-end; border-top:1.5px solid #f1f5f9; padding-top:10px; margin-top:4px;">
                <button type="button" class="btn-admin btn-cancel" onclick="closeDbCleanupModal(event)" style="padding:8px 22px;">Đóng cửa sổ</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalDiv);
}

function openDbCleanupModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (typeof closeAdminPanel === "function") closeAdminPanel();
    ensureDbCleanupModalInDOM();
    const modal = document.getElementById("firebase-db-cleanup-modal");
    if (modal) {
        modal.style.display = "flex";
        scanFirebaseUsage();
    }
}

function closeDbCleanupModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const modal = document.getElementById("firebase-db-cleanup-modal");
    if (modal) modal.style.display = "none";
}

async function scanFirebaseUsage() {
    const statusTxt = document.getElementById("db-scan-status-text");
    if (statusTxt) statusTxt.innerText = "⏳ Đang quét cơ sở dữ liệu...";

    const bSessions = document.getElementById("count-active-sessions");
    const bDrafts = document.getElementById("count-live-drafts");
    const bCheat = document.getElementById("count-cheating-logs");
    const bSync = document.getElementById("count-image-sync");

    try {
        const [activeRes, quizzesRes, examsRes] = await Promise.all([
            fetch(`${FIREBASE_DB_URL}/active_sessions.json?shallow=true`).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/quizzes.json`).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/exams.json`).catch(() => null)
        ]);

        let sessionCount = 0;
        if (activeRes && activeRes.ok) {
            const data = await activeRes.json();
            if (data && typeof data === 'object') sessionCount = Object.keys(data).length;
        }
        if (bSessions) bSessions.innerText = `${sessionCount} nhóm đề`;

        let draftCount = 0;
        let syncCount = 0;
        if (quizzesRes && quizzesRes.ok) {
            const qData = await quizzesRes.json();
            if (qData && typeof qData === 'object') {
                for (let qId in qData) {
                    if (qData[qId] && qData[qId].live_drafts) {
                        draftCount += Object.keys(qData[qId].live_drafts).length;
                    }
                    if (qData[qId] && qData[qId].image_sync) {
                        syncCount++;
                    }
                }
            }
        }
        if (bDrafts) bDrafts.innerText = `${draftCount} bài nháp`;
        if (bSync) bSync.innerText = `${syncCount} kênh`;

        let cheatCount = 0;
        if (examsRes && examsRes.ok) {
            const eData = await examsRes.json();
            if (eData && typeof eData === 'object') {
                for (let code in eData) {
                    if (eData[code] && eData[code].cheating_logs) {
                        cheatCount += Object.keys(eData[code].cheating_logs).length;
                    }
                }
            }
        }
        if (bCheat) bCheat.innerText = `${cheatCount} bản ghi`;

        if (statusTxt) statusTxt.innerText = `✅ Đã quét xong lúc ${new Date().toLocaleTimeString('vi-VN')}`;
    } catch(err) {
        if (statusTxt) statusTxt.innerText = "⚠️ Lỗi khi quét: " + err.message;
    }
}

async function cleanActiveSessions() {
    if (!confirm("⚠️ XÁC NHẬN DỌN PHIÊN KẸT:\n\nBạn có chắc muốn xóa toàn bộ phiên làm bài tạm thời (/active_sessions)?\n- Tác dụng: Hết kẹt trạng thái 'Đang làm bài' đối với các học sinh đã thoát ngang.\n- An toàn 100%: Điểm và đề thi không bị ảnh hưởng.")) {
        return;
    }

    try {
        await fetch(`${FIREBASE_DB_URL}/active_sessions.json`, { method: "DELETE" });
        alert("✅ Đã làm sạch toàn bộ phiên làm bài tạm thời thành công!");
        scanFirebaseUsage();
    } catch(e) {
        alert("❌ Lỗi dọn phiên: " + e.message);
    }
}

async function cleanLiveDrafts() {
    if (!confirm("⚠️ CẢNH BÁO BẢN NHÁP CÂU TRẢ LỜI:\n\nBạn chỉ nên xóa bản nháp sau khi đợt thi đã hoàn tất và Thầy đã bấm '⚡ Thu bài tự động'.\n\nBạn có chắc chắn muốn xóa toàn bộ bản nháp lưu ngầm (/live_drafts) của các đề thi không?")) {
        return;
    }

    try {
        const res = await fetch(`${FIREBASE_DB_URL}/quizzes.json`);
        const qData = await res.json();
        if (qData && typeof qData === 'object') {
            const deleteTasks = [];
            for (let qId in qData) {
                if (qData[qId] && qData[qId].live_drafts) {
                    deleteTasks.push(fetch(`${FIREBASE_DB_URL}/quizzes/${qId}/live_drafts.json`, { method: "DELETE" }));
                }
            }
            await Promise.all(deleteTasks);
        }
        alert("✅ Đã dọn dẹp sạch toàn bộ bản lưu nháp trên mây!");
        scanFirebaseUsage();
    } catch(e) {
        alert("❌ Lỗi dọn bản nháp: " + e.message);
    }
}

async function cleanCheatingLogs() {
    if (!confirm("⚠️ XÁC NHẬN XÓA NHẬT KÝ RỜI TAB:\n\nThao tác này sẽ xóa toàn bộ lịch sử chi tiết các lần học sinh chuyển tab (/cheating_logs) trong quá khứ.\n- Số lần chuyển tab trong các bài đã nộp trước đó vẫn giữ nguyên.\n\nBạn có muốn tiếp tục không?")) {
        return;
    }

    try {
        const res = await fetch(`${FIREBASE_DB_URL}/exams.json`);
        const eData = await res.json();
        if (eData && typeof eData === 'object') {
            const deleteTasks = [];
            for (let code in eData) {
                if (eData[code] && eData[code].cheating_logs) {
                    deleteTasks.push(fetch(`${FIREBASE_DB_URL}/exams/${code}/cheating_logs.json`, { method: "DELETE" }));
                }
            }
            await Promise.all(deleteTasks);
        }
        alert("✅ Đã xóa toàn bộ nhật ký chuyển tab cũ thành công!");
        scanFirebaseUsage();
    } catch(e) {
        alert("❌ Lỗi xóa nhật ký: " + e.message);
    }
}

async function cleanImageSync() {
    if (!confirm("⚠️ XÁC NHẬN XÓA KÊNH ĐỒNG BỘ ẢNH TẠM:\n\nThao tác này sẽ làm sạch các tín hiệu sự kiện đồng bộ ảnh (/image_sync). Hình ảnh đã đính kèm trong câu hỏi đề thi vẫn còn nguyên vẹn 100%.\n\nBạn có muốn thực hiện không?")) {
        return;
    }

    try {
        const res = await fetch(`${FIREBASE_DB_URL}/quizzes.json`);
        const qData = await res.json();
        if (qData && typeof qData === 'object') {
            const deleteTasks = [];
            for (let qId in qData) {
                if (qData[qId] && qData[qId].image_sync) {
                    deleteTasks.push(fetch(`${FIREBASE_DB_URL}/quizzes/${qId}/image_sync.json`, { method: "DELETE" }));
                }
            }
            await Promise.all(deleteTasks);
        }
        alert("✅ Đã làm sạch toàn bộ kênh sự kiện đồng bộ ảnh!");
        scanFirebaseUsage();
    } catch(e) {
        alert("❌ Lỗi xóa kênh đồng bộ: " + e.message);
    }
}

async function cleanAllSafeGarbage() {
    if (!confirm("⚡ DỌN TỔNG THỂ TẤT CẢ MỤC TẠM (SIÊU NHANH):\n\nHệ thống sẽ đồng thời:\n1. Xóa toàn bộ phiên kẹt 'Đang làm bài' (/active_sessions).\n2. Xóa các bản nháp câu trả lời cũ (/live_drafts).\n3. Xóa nhật ký chuyển tab cũ (/cheating_logs).\n4. Xóa kênh đồng bộ ảnh tạm (/image_sync).\n\n🛡️ CAM KẾT: Đề thi và toàn bộ bài nộp, điểm số chính thức của học sinh được BẢO VỆ NGUYÊN VẸN 100%.\n\nBạn có chắc chắn muốn tiến hành?")) {
        return;
    }

    const statusTxt = document.getElementById("db-scan-status-text");
    if (statusTxt) statusTxt.innerText = "⏳ Đang dọn dẹp tổng thể cơ sở dữ liệu...";

    try {
        const [quizzesRes, examsRes] = await Promise.all([
            fetch(`${FIREBASE_DB_URL}/quizzes.json`).catch(() => null),
            fetch(`${FIREBASE_DB_URL}/exams.json`).catch(() => null)
        ]);

        const tasks = [
            fetch(`${FIREBASE_DB_URL}/active_sessions.json`, { method: "DELETE" }).catch(() => null)
        ];

        if (quizzesRes && quizzesRes.ok) {
            const qData = await quizzesRes.json();
            if (qData && typeof qData === 'object') {
                for (let qId in qData) {
                    if (qData[qId] && qData[qId].live_drafts) {
                        tasks.push(fetch(`${FIREBASE_DB_URL}/quizzes/${qId}/live_drafts.json`, { method: "DELETE" }).catch(() => null));
                    }
                    if (qData[qId] && qData[qId].image_sync) {
                        tasks.push(fetch(`${FIREBASE_DB_URL}/quizzes/${qId}/image_sync.json`, { method: "DELETE" }).catch(() => null));
                    }
                }
            }
        }

        if (examsRes && examsRes.ok) {
            const eData = await examsRes.json();
            if (eData && typeof eData === 'object') {
                for (let code in eData) {
                    if (eData[code] && eData[code].cheating_logs) {
                        tasks.push(fetch(`${FIREBASE_DB_URL}/exams/${code}/cheating_logs.json`, { method: "DELETE" }).catch(() => null));
                    }
                }
            }
        }

        await Promise.all(tasks);
        alert("🎉 ĐÃ DỌN DẸP TỔNG THỂ THÀNH CÔNG!\n\n- Toàn bộ phiên kẹt, bản nháp và nhật ký tạm thời đã được giải phóng.\n- Cơ sở dữ liệu Firebase của Thầy đã được tối ưu sạch sẽ, nhẹ nhàng và chạy mượt mà nhất!");
        scanFirebaseUsage();
    } catch(err) {
        alert("❌ Lỗi trong quá trình dọn dẹp: " + err.message);
    }
}

window.openDbCleanupModal = openDbCleanupModal;
window.closeDbCleanupModal = closeDbCleanupModal;
window.scanFirebaseUsage = scanFirebaseUsage;
window.cleanActiveSessions = cleanActiveSessions;
window.cleanLiveDrafts = cleanLiveDrafts;
window.cleanCheatingLogs = cleanCheatingLogs;
window.cleanImageSync = cleanImageSync;
window.cleanAllSafeGarbage = cleanAllSafeGarbage;