// =========================================================
// FILE: app-utils.js
// CÁC HÀM TIỆN ÍCH DÙNG CHUNG CHO TOÀN BỘ WEBSITE
// =========================================================

const safeLocal = {
    getItem(k) { try { return localStorage.getItem(k); } catch(e) { return null; } },
    setItem(k, v) { try { localStorage.setItem(k, v); } catch(e) {} },
    removeItem(k) { try { localStorage.removeItem(k); } catch(e) {} }
};

const safeSession = {
    getItem(k) { try { return sessionStorage.getItem(k); } catch(e) { return null; } },
    setItem(k, v) { try { sessionStorage.setItem(k, v); } catch(e) {} },
    removeItem(k) { try { sessionStorage.removeItem(k); } catch(e) {} }
};

function normalizeName(str) {
    if (!str) return "";
    return String(str).toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

function toTitleCaseName(str) {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

function parseDateString(dateStr) {
    if (!dateStr) return 0;
    try {
        let parts = String(dateStr).split(' - ');
        let dParts = parts[0].split('/');
        let tParts = parts[1] ? parts[1].split(':') : ['00', '00'];
        return new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1]).getTime();
    } catch(e) { return 0; }
}

function formatDateTimeFull(timestamp) {
    if (!timestamp) return "---";
    let d = new Date(timestamp);
    if (isNaN(d.getTime())) {
        let parsed = parseDateString(timestamp);
        if (parsed) d = new Date(parsed);
        else return String(timestamp);
    }
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
}

function formatElapsedDuration(startTimeMs) {
    if (!startTimeMs) return "Đang làm...";
    const diffSec = Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    if (mins === 0) return `${secs} giây`;
    return `${mins} phút ${secs} giây`;
}

function cleanExamCodeKey(code) {
    return String(code || "").trim().replace(/\s+/g, '_').replace(/[.#$\[\]\/]/g, '_');
}

function extractNormalizedExamCode(title) {
    if (!title) return "";
    let clean = String(title).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D").replace(/đ/g, "d").toUpperCase();
    let m = clean.match(/(DE\s*(?:SO)?\s*\d+)/i);
    let p1 = m ? m[1].replace(/\s+/g, "").replace("SO", "") : "";
    let mToan = clean.match(/TOAN\s*(?:LOP\s*)?(\d+)/i);
    let p2 = mToan ? ("TOAN" + mToan[1]) : "";
    if (p1 && p2) return p1 + p2;
    if (p1) return p1;
    return clean.replace(/[^A-Z0-9]/g, "");
}

function getExamCandidateCodes(title, maDe, quizId) {
    let codes = new Set();
    if (quizId) codes.add(String(quizId).trim());
    if (maDe) {
        let cleanMd = cleanExamCodeKey(maDe);
        if (cleanMd) codes.add(cleanMd);
        let normMd = extractNormalizedExamCode(maDe);
        if (normMd) codes.add(normMd);
    }
    if (title) {
        let cleanT = cleanExamCodeKey(title);
        if (cleanT) codes.add(cleanT);
        let norm = extractNormalizedExamCode(title);
        if (norm) codes.add(norm);

        let mNum = String(title).match(/(?:đề|de)\s*(?:số|so)?\s*(\d+)/i);
        if (mNum) {
            let n = mNum[1];
            codes.add(n);
            codes.add("DE" + n);
            codes.add("DE_" + n);
            codes.add("DE" + n + "TOAN11");
            codes.add("DE" + n + "TOAN10");
            codes.add("DE" + n + "TOAN12");
        }
    }
    codes.add("101");
    return Array.from(codes);
}

function toDirectGoogleDriveImageUrl(url) {
    if (!url) return "";
    let cleanUrl = String(url).trim();
    let m = cleanUrl.match(/(?:file\/d\/|id=|open\?id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (m && m[1]) return `https://lh3.googleusercontent.com/d/${m[1]}`;
    return cleanUrl;
}

function stripHtml(html) {
    let tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

function extractQuizIdFromItem(item) {
    if (!item) return null;
    if (item.firebaseId && String(item.firebaseId).startsWith('quiz_')) return item.firebaseId;
    if (item.id && String(item.id).startsWith('quiz_')) return item.id;
    if (item.url && item.url.includes("?id=")) {
        try {
            let u = new URL(item.url, window.location.href);
            return u.searchParams.get("id");
        } catch(e) {}
    }
    return null;
}

function toLocalDatetimeString(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return "";
    const pad = (n) => String(n).padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
}

function formatScheduleDateTime(dtStr) {
    if (!dtStr) return "";
    let d = new Date(dtStr);
    if (isNaN(d.getTime())) {
        let p = parseDateString(dtStr);
        if (p) d = new Date(p);
        else return String(dtStr);
    }
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function buildTimeBoxHtml(timeLimitMinutes, startStr, endStr, fallbackDateStr = "") {
    let mins = parseInt(timeLimitMinutes, 10);
    if (isNaN(mins) || mins <= 0) mins = 120;

    let stFormatted = "";
    let etFormatted = "";

    if (startStr && endStr) {
        stFormatted = formatScheduleDateTime(startStr);
        etFormatted = formatScheduleDateTime(endStr);
    } else if (endStr) {
        let dEnd = new Date(endStr);
        let dStart = new Date(dEnd.getTime() - 7 * 24 * 3600 * 1000);
        stFormatted = formatScheduleDateTime(dStart);
        etFormatted = formatScheduleDateTime(endStr);
    } else {
        let baseDate = fallbackDateStr ? new Date(parseDateString(fallbackDateStr) || Date.now()) : new Date();
        if (isNaN(baseDate.getTime())) baseDate = new Date();
        baseDate.setHours(0, 0, 0, 0);
        let endDate = new Date(baseDate.getTime() + 10 * 24 * 3600 * 1000);
        endDate.setHours(2, 58, 0, 0);
        stFormatted = formatScheduleDateTime(baseDate);
        etFormatted = formatScheduleDateTime(endDate);
    }

    return `
        <div class="time-row-limit">
            ⏱ Thời gian làm: <b>${mins} phút</b>
        </div>
        <div class="time-row-schedule">
            🗓️ Khung giờ: <b>${stFormatted} đến ${etFormatted}</b>
        </div>
    `;
}

function getCategoryDisplayName(catId) {
    const map = {
        "kho-tai-lieu": "Kho tài liệu PDF, Word, Ảnh",
        "nhac-nho": "Nhắc nhở quan trọng",
        "them-10": "Thêm 10",
        "them-11": "Thêm 11",
        "them-12": "Thêm 12",
        "lop-11a": "Lớp 11A",
        "lop-11c": "Lớp 11C",
        "lop-10p": "Lớp 10P",
        "lop-11e": "Lớp 11E",
        "hsg-toan-11": "HSG Toán 11",
        "tu-luan-padlet": "Tự luận Padlet"
    };
    return map[catId] || catId;
}

async function sha256Hash(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}