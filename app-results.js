// =========================================================
// FILE: app-results.js
// QUẢN LÝ BẢNG KẾT QUẢ THI, THỐNG KÊ & XUẤT BÁO CÁO EXCEL
// TỐI ƯU HÓA: Cập nhật Auto-refresh 15s/lần, truy vấn tối giản
// TÍNH NĂNG MỚI: Xóa tạm thời và Xóa vĩnh viễn dữ liệu học sinh
// =========================================================

let currentExamResultData = {
    item: null,
    title: "",
    examCode: "",
    categoryId: "them-11",
    rawRows: []
};

let tableDisplaySettings = {
    fontSize: 13,
    rowPadding: 9
};

let autoRefreshTimer = null;
let isAutoRefreshEnabled = false; // Mặc định tắt để đỡ tốn băng thông
let scoreChartInstance = null;
const _examResultsCache = {};
let _regradeFileParsedAnswers = null;
let currentRankSortMode = 'default';

function toTitleCaseName(str) {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
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
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const DD = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const YY = String(d.getFullYear()).slice(-2);
    return `${hh}:${mm}:${ss} ${DD}/${MM}/${YY}`;
}

function formatElapsedDuration(startTimeMs) {
    if (!startTimeMs) return "Đang làm...";
    const diffSec = Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    if (mins === 0) return `${secs} giây`;
    return `${mins} phút ${secs} giây`;
}

function normalizeCategoryKey(cat) {
    if (!cat) return "";
    return String(cat).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isStrictSameCategory(catA, catB) {
    if (!catA || !catB) return false;
    let a = normalizeCategoryKey(catA);
    let b = normalizeCategoryKey(catB);
    return a === b;
}

function sortDataString(str) {
    if (!str) return "";
    let parts = str.split(/\s*\|\s*/);
    parts.sort((a, b) => {
        let isTabA = a.toLowerCase().includes("tab switch");
        let isTabB = b.toLowerCase().includes("tab switch");
        if (isTabA && !isTabB) return 1;
        if (!isTabA && isTabB) return -1;

        let mA = a.match(/^(?:câu\s*|q)?(\d+)([a-zA-Z]?)/i);
        let mB = b.match(/^(?:câu\s*|q)?(\d+)([a-zA-Z]?)/i);
        if (mA && mB) {
            let numA = parseInt(mA[1], 10);
            let numB = parseInt(mB[1], 10);
            if (numA !== numB) return numA - numB;
            return (mA[2] || "").localeCompare(mB[2] || "");
        }
        if (mA) return -1;
        if (mB) return 1;
        return a.localeCompare(b);
    });
    return parts.join(" | ");
}

function extractTabCountFromDataString(dataStr) {
    if (!dataStr) return 0;
    let m = dataStr.match(/tab\s*switch\s*:\s*(\d+)/i);
    return m ? (parseInt(m[1], 10) || 0) : 0;
}

function deduplicateAttempts(attempts) {
    if (!attempts || attempts.length <= 1) return attempts || [];
    let unique = [];
    attempts.forEach(sub => {
        let subTime = getSubmissionTimestamp(sub);
        let subStrTime = String(sub.timestamp || "").trim();
        let subScore = (sub.score10 !== undefined) ? String(sub.score10) : "";

        let isDup = unique.some(existing => {
            let exTime = getSubmissionTimestamp(existing);
            let exStrTime = String(existing.timestamp || "").trim();
            let exScore = (existing.score10 !== undefined) ? String(existing.score10) : "";

            if (subStrTime && exStrTime && subStrTime === exStrTime) return true;
            if (subTime > 0 && exTime > 0 && Math.abs(subTime - exTime) < 40000 && subScore === exScore) return true;
            return false;
        });

        if (!isDup) unique.push(sub);
    });
    return unique;
}

function initTableSettings() {
    try {
        const saved = localStorage.getItem("admin_table_display_settings");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.fontSize) tableDisplaySettings.fontSize = parseInt(parsed.fontSize);
            if (parsed.rowPadding !== undefined && parsed.rowPadding !== null) {
                tableDisplaySettings.rowPadding = parseInt(parsed.rowPadding);
            }
        }
    } catch(e) {}
    applyTableSettings();
    
    // Đồng bộ nút Tắt/Bật auto-refresh
    const btn = document.getElementById("btn-toggle-autorefresh");
    if (btn) {
        if (isAutoRefreshEnabled) {
            btn.innerHTML = "🟢 Tự động: BẬT";
            btn.style.color = "#38bdf8";
            btn.style.borderColor = "#38bdf8";
        } else {
            btn.innerHTML = "⚪ Tự động: TẮT";
            btn.style.color = "#94a3b8";
            btn.style.borderColor = "#64748b";
        }
    }
}

function applyTableSettings() {
    const table = document.getElementById("admin-result-table");
    if (table) {
        table.style.setProperty("--table-font-size", tableDisplaySettings.fontSize + "px");
        table.style.setProperty("--table-row-padding-y", tableDisplaySettings.rowPadding + "px");
    }

    const sliderFont = document.getElementById("slider-font-size");
    const sliderPad = document.getElementById("slider-row-padding");
    const valFont = document.getElementById("val-font-size");
    const valPad = document.getElementById("val-row-padding");

    if (sliderFont) sliderFont.value = tableDisplaySettings.fontSize;
    if (sliderPad) sliderPad.value = tableDisplaySettings.rowPadding;
    if (valFont) valFont.innerText = tableDisplaySettings.fontSize + "px";
    if (valPad) valPad.innerText = tableDisplaySettings.rowPadding + "px";

    try { localStorage.setItem("admin_table_display_settings", JSON.stringify(tableDisplaySettings)); } catch(e) {}
}

function toggleTableSettingsPopover(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const popover = document.getElementById("table-settings-popover");
    const btn = document.getElementById("btn-table-settings");
    if (!popover) return;
    if (popover.classList.contains("show")) {
        popover.classList.remove("show");
        if (btn) btn.classList.remove("active");
    } else {
        popover.classList.add("show");
        if (btn) btn.classList.add("active");
    }
}

function closeTableSettingsPopover(event) {
    if (event) event.stopPropagation();
    const popover = document.getElementById("table-settings-popover");
    const btn = document.getElementById("btn-table-settings");
    if (popover) popover.classList.remove("show");
    if (btn) btn.classList.remove("active");
}

function onFontSizeChange(val) { tableDisplaySettings.fontSize = parseInt(val); applyTableSettings(); }
function onRowPaddingChange(val) { tableDisplaySettings.rowPadding = parseInt(val); applyTableSettings(); }

function adjustSetting(type, step) {
    if (type === 'fontSize') { tableDisplaySettings.fontSize = Math.min(22, Math.max(10, tableDisplaySettings.fontSize + step)); } 
    else if (type === 'rowPadding') { tableDisplaySettings.rowPadding = Math.min(26, Math.max(0, tableDisplaySettings.rowPadding + step)); }
    applyTableSettings();
}

function applyFontSizePreset(size) { tableDisplaySettings.fontSize = size; applyTableSettings(); }
function applyRowPaddingPreset(pad) { tableDisplaySettings.rowPadding = pad; applyTableSettings(); }
function resetTableSettings() { tableDisplaySettings.fontSize = 13; tableDisplaySettings.rowPadding = 9; applyTableSettings(); }

function initTableResizable() {
    const table = document.getElementById("admin-result-table");
    if (!table) return;
    const headers = table.querySelectorAll("thead th");
    
    headers.forEach(th => {
        const oldResizer = th.querySelector(".resizer");
        if (oldResizer) oldResizer.remove();

        const resizer = document.createElement("div");
        resizer.className = "resizer";
        th.appendChild(resizer);

        let startX = 0, startWidth = 0;

        resizer.addEventListener("mousedown", function(e) {
            e.preventDefault(); e.stopPropagation();
            startX = e.pageX; startWidth = th.offsetWidth;
            resizer.classList.add("resizing");

            function onMouseMove(moveEvent) {
                const diff = moveEvent.pageX - startX;
                const newWidth = Math.max(40, startWidth + diff);
                th.style.width = newWidth + "px"; th.style.minWidth = newWidth + "px";
            }
            function onMouseUp() {
                resizer.classList.remove("resizing");
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            }
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    });
}

function toggleExamPickerMenu(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const menu = document.getElementById("exam-picker-dropdown-list");
    if (menu) menu.classList.toggle("show");
}

function toggleRankSortMenu(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const menu = document.getElementById("rank-sort-dropdown-menu");
    if (menu) { menu.style.display = (menu.style.display === "none" || menu.style.display === "") ? "block" : "none"; }
}

function changeRankSort(mode, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    currentRankSortMode = mode;
    const menu = document.getElementById("rank-sort-dropdown-menu");
    if (menu) menu.style.display = "none";
    const btnText = document.getElementById("rank-header-btn-text");
    if (btnText) {
        if (mode === 'desc') btnText.innerHTML = "🏅 Hạng: Cao ➔ Thấp";
        else if (mode === 'asc') btnText.innerHTML = "🏅 Hạng: Thấp ➔ Cao";
        else btnText.innerHTML = "🏅 Xếp hạng ▾";
    }
    filterResultTable();
}

document.addEventListener("click", function(e) {
    if (!e.target.closest('.rank-picker-wrapper')) {
        const menu = document.getElementById("rank-sort-dropdown-menu");
        if (menu) menu.style.display = "none";
    }
    // Lắng nghe sự kiện để đóng menu tùy chọn Xóa nếu bấm ra ngoài
    if (!e.target.closest('.td-action-cell')) {
        document.querySelectorAll(".delete-dropdown-menu").forEach(el => el.style.display = "none");
    }
});

function renderExamPickerDropdown() {
    const menu = document.getElementById("exam-picker-dropdown-list");
    if (!menu) return;
    menu.innerHTML = "";

    const currentCatId = currentExamResultData.categoryId || "them-11";
    let targetCat = DAY_THEM_CATEGORIES.find(c => c.id === currentCatId) || CHINH_KHOA_CATEGORIES.find(c => c.id === currentCatId);
    
    const examList = targetCat ? targetCat.links.filter(l => !l.isDoc) : [];

    if (examList.length === 0) {
        menu.innerHTML = `<div style="padding:8px; color:#64748b; font-size:12px; font-style:italic;">Chưa có đề thi nào trong mục ${getCategoryDisplayName(currentCatId)}</div>`;
        return;
    }

    examList.forEach((exam, idx) => {
        const itemEl = document.createElement("div");
        itemEl.className = "exam-picker-item";
        const isCur = currentExamResultData.item && (currentExamResultData.item.firebaseId === exam.firebaseId || currentExamResultData.item.title === exam.title);
        if (isCur) itemEl.classList.add("selected");

        itemEl.innerHTML = `<span>${idx + 1}.</span> <span style="flex:1;">${exam.title}</span>`;
        itemEl.onclick = async (e) => {
            e.stopPropagation();
            menu.classList.remove("show");
            await switchExamResult(exam);
        };
        menu.appendChild(itemEl);
    });
}

async function switchExamResult(examItem) {
    const preservedCat = currentExamResultData.categoryId || examItem.categoryId || "them-11";
    examItem.categoryId = preservedCat;
    currentExamResultData.item = examItem;
    currentExamResultData.categoryId = preservedCat;

    const headTitle = document.getElementById("result-modal-heading");
    const headSub = document.getElementById("result-modal-subheading");
    const currentExamBtnText = document.getElementById("current-selected-exam-name");

    const displayCatName = getCategoryDisplayName(preservedCat);
    const breadcrumbCat = document.getElementById("breadcrumb-category");
    if (breadcrumbCat) breadcrumbCat.innerText = displayCatName;

    if (headTitle) headTitle.innerText = `📊 Kết quả: ${examItem.title || "Bài thi"}`;
    if (headSub) headSub.innerText = `Chuyên mục: ${displayCatName} | Ngày cập nhật: ${examItem.date || "---"}`;
    if (currentExamBtnText) currentExamBtnText.innerText = `📑 ${examItem.title}`;

    renderExamPickerDropdown();
    await refreshCurrentExamResults();
}

async function openExamResultModal(item, categoryIdOrEvent, maybeEvent) {
    let event = (categoryIdOrEvent && typeof categoryIdOrEvent === 'object' && categoryIdOrEvent.preventDefault) ? categoryIdOrEvent : maybeEvent;
    if (event) { event.preventDefault(); event.stopPropagation(); }

    let explicitCat = (typeof categoryIdOrEvent === 'string' && categoryIdOrEvent) ? categoryIdOrEvent : "";
    let catId = explicitCat || item.categoryId || "";

    if (!catId) {
        for (let cat of [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES]) {
            if (cat.links && cat.links.some(l => l.id === item.id || l.firebaseId === item.firebaseId || l.title === item.title)) {
                catId = cat.id; break;
            }
        }
    }
    catId = catId || "them-11";
    item.categoryId = catId;

    currentExamResultData.item = item;
    currentExamResultData.categoryId = catId;

    const searchInput = document.getElementById("result-search-input");
    if (searchInput) searchInput.value = "";

    const modal = document.getElementById("result-fullscreen-modal");
    const headTitle = document.getElementById("result-modal-heading");
    const headSub = document.getElementById("result-modal-subheading");
    const currentExamBtnText = document.getElementById("current-selected-exam-name");

    const displayCatName = getCategoryDisplayName(catId);
    const breadcrumbCat = document.getElementById("breadcrumb-category");
    if (breadcrumbCat) breadcrumbCat.innerText = displayCatName;

    window.history.pushState({ isViewingResult: true }, "", "#bang-ket-qua");

    modal.style.display = "flex";
    document.getElementById("result-modal-main-view").style.display = "flex";
    document.getElementById("result-detailed-stats-view").style.display = "none";
    document.getElementById("breadcrumb-current-view").innerText = "📊 Bảng kết quả";

    const statsBar = document.getElementById("result-modal-stats-bar");
    if (statsBar) statsBar.style.display = "flex";

    headTitle.innerText = `📊 Kết quả: ${item.title || "Bài thi"}`;
    headSub.innerText = `Chuyên mục: ${displayCatName} | Ngày cập nhật: ${item.date || "---"}`;
    if (currentExamBtnText) currentExamBtnText.innerText = `📑 ${item.title}`;

    const cacheKey = `${catId}_${item.firebaseId || item.id || item.title}`;
    if (_examResultsCache[cacheKey]) {
        const cached = _examResultsCache[cacheKey];
        renderExamResultTable(catId, cached.submissionsMap, cached.cheatingLogsData, cached.activeSessionsData, item, cached.examMeta);
    } else {
        renderExamResultTable(catId, {}, {}, {}, item, { examTitle: item.title });
    }

    applyTableSettings();
    renderExamPickerDropdown();
    setTimeout(initTableResizable, 50);

    await fetchAndRenderExamResults(item, true);
    startAutoRefreshResult();
}

async function refreshCurrentExamResults() {
    if (!currentExamResultData.item) return;
    await fetchAndRenderExamResults(currentExamResultData.item, false);
    startAutoRefreshResult();
}

function isSubmissionMatchingCurrentExam(sub, examInfo) {
    if (!sub || typeof sub !== 'object') return false;
    const subQuizId = String(sub.quizId || sub.id || "").trim();
    const curQuizId = String(examInfo.quizId || "").trim();

    if (subQuizId && curQuizId) return subQuizId === curQuizId;
    if (sub._nodeCode && curQuizId && sub._nodeCode === curQuizId) return true;

    const subTitle = sub.examName || sub.examTitle || sub.title || "";
    const curTitle = examInfo.title || examInfo.itemTitle || "";

    const subNormTitle = normalizeName(subTitle);
    const curNormTitle = normalizeName(curTitle);
    const curNormItemTitle = normalizeName(examInfo.itemTitle || "");

    if (subNormTitle && (curNormTitle || curNormItemTitle)) {
        if (subNormTitle === curNormTitle || subNormTitle === curNormItemTitle) return true;

        const subNormCode = extractNormalizedExamCode(subTitle || sub.maDe || "");
        const curNormCode = examInfo.normCode || extractNormalizedExamCode(curTitle || examInfo.maDe || "");
        if (subNormCode && curNormCode) return subNormCode === curNormCode;

        if (subNormTitle.length >= 8 && curNormTitle.length >= 8) {
            const subNums = subTitle.match(/\d+/g) || [];
            const curNums = curTitle.match(/\d+/g) || [];
            const numsMatch = subNums.length === curNums.length && subNums.every((v, i) => v === curNums[i]);
            if (numsMatch && (subNormTitle.includes(curNormTitle) || curNormTitle.includes(subNormTitle))) return true;
        }
    }

    const subMaDe = cleanExamCodeKey(sub.maDe || "");
    const curMaDe = examInfo.maDe || "";
    if (subMaDe && curMaDe && subMaDe !== "101" && curMaDe !== "101") return subMaDe === curMaDe;

    return false;
}

async function fetchAndRenderExamResults(item, isSilent = false) {
    if (!item) return;

    let quizId = "";
    if (item.url && item.url.includes("?id=")) {
        try { let u = new URL(item.url, window.location.href); quizId = u.searchParams.get("id"); } catch(e) {}
    }
    if (!quizId && item.firebaseId && item.firebaseId.startsWith("quiz_")) quizId = item.firebaseId;
    if (!quizId && item.id && String(item.id).startsWith("quiz_")) quizId = item.id;

    let maDe = "";
    let examTitle = item.title || "";

    if (quizId) {
        try {
            let qRes = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
            let qData = await qRes.json();
            if (qData) {
                maDe = qData.maDe || "";
                if (qData.title) examTitle = qData.title;
            }
        } catch(e) {}
    }

    const candidateCodesList = Array.from(new Set([quizId, cleanExamCodeKey(maDe || examTitle)].filter(Boolean)));

    let submissionsMap = {};
    let cheatingLogsData = {};
    let activeSessionsData = {};

    try {
        const fetchTasks = candidateCodesList.map(async (code) => {
            const [sRes, cRes, aRes] = await Promise.all([
                fetch(`${FIREBASE_DB_URL}/exams/${code}/submissions.json`).catch(() => null),
                fetch(`${FIREBASE_DB_URL}/exams/${code}/cheating_logs.json`).catch(() => null),
                fetch(`${FIREBASE_DB_URL}/active_sessions/${code}.json`).catch(() => null)
            ]);

            if (sRes && sRes.ok) {
                let sJson = await sRes.json().catch(() => null);
                if (sJson && typeof sJson === 'object') {
                    for (let subId in sJson) {
                        let subObj = sJson[subId];
                        if (subObj && typeof subObj === 'object') {
                            subObj._nodeCode = code; submissionsMap[subId] = subObj;
                        }
                    }
                }
            }

            if (cRes && cRes.ok) {
                let cJson = await cRes.json().catch(() => null);
                if (cJson && typeof cJson === 'object') {
                    for (let cId in cJson) {
                        let cObj = cJson[cId];
                        if (cObj && typeof cObj === 'object') {
                            cObj._nodeCode = code; cheatingLogsData[cId] = cObj;
                        }
                    }
                }
            }

            if (aRes && aRes.ok) {
                let aJson = await aRes.json().catch(() => null);
                if (aJson && typeof aJson === 'object') {
                    for (let aId in aJson) {
                        let aObj = aJson[aId];
                        if (typeof aObj === 'object' && aObj !== null) {
                            aObj._nodeCode = code; activeSessionsData[`${code}_${aId}`] = aObj;
                        } else {
                            activeSessionsData[`${code}_${aId}`] = { lastPing: aObj, _nodeCode: code };
                        }
                    }
                }
            }
        });
        await Promise.all(fetchTasks);
    } catch(e) { console.error("Lỗi khi nạp dữ liệu thi Firebase:", e); }

    const targetCatId = item.categoryId || currentExamResultData.categoryId || "them-11";
    const examMeta = { quizId, maDe, examTitle };

    const cacheKey = `${targetCatId}_${item.firebaseId || item.id || item.title}`;
    _examResultsCache[cacheKey] = { submissionsMap, cheatingLogsData, activeSessionsData, examMeta };

    renderExamResultTable(targetCatId, submissionsMap, cheatingLogsData, activeSessionsData, item, examMeta);

    const searchInput = document.getElementById("result-search-input");
    if (searchInput && searchInput.value.trim() !== "") filterResultTable();
}

function getSubmissionTimestamp(sub) {
    if (!sub) return 0;
    if (typeof sub.createdAt === 'number') return sub.createdAt;
    if (sub.createdAt) { let n = Number(sub.createdAt); if (!isNaN(n) && n > 0) return n; }
    return parseDateString(sub.timestamp) || 0;
}

function renderExamResultTable(categoryId, submissionsMap, cheatingMap, activeSessionsMap, examItem, examMeta = {}) {
    const classAccounts = getAccountsForCategory(categoryId);
    const targetCatId = String(categoryId || "").trim();

    const currentExamInfo = {
        quizId: examMeta.quizId || (examItem && (examItem.firebaseId || examItem.id)) || "",
        maDe: cleanExamCodeKey(examMeta.maDe || ""),
        title: examMeta.examTitle || (examItem && examItem.title) || "",
        itemTitle: (examItem && examItem.title) || "",
        normTitle: normalizeName(examMeta.examTitle || (examItem && examItem.title) || ""),
        normItemTitle: normalizeName((examItem && examItem.title) || ""),
        normCode: extractNormalizedExamCode(examMeta.examTitle || (examItem && examItem.title) || ""),
        categoryId: targetCatId
    };

    const cheatHistoryBySbd = {};
    const maxCheatCountBySbd = {};

    for (let k in cheatingMap) {
        let log = cheatingMap[k];
        if (!log || typeof log !== 'object') continue;
        if (!isSubmissionMatchingCurrentExam(log, currentExamInfo)) continue;

        let sbdKey = String(log.sbd || log.studentId || log.soBaoDanh || "").trim().toLowerCase();
        let nameKey = normalizeName(log.studentName);
        let dur = String(log.durationStr || log.duration || log.time || log.thoiGian || "").trim();

        if (!dur || dur.toLowerCase() === "bắt đầu" || dur.toLowerCase() === "bat dau") continue;

        let shortDur = dur.replace(/phút/g, 'p').replace(/giây/g, 's').replace(/\s+/g, '');
        let sCount = parseInt(log.switchCount || log.tabSwitchCount || log.count || log.lanChuyen, 10) || 0;

        if (sbdKey && sbdKey !== "chưa nhập" && sbdKey !== "chuanhap" && sbdKey !== "---") {
            if (!cheatHistoryBySbd[sbdKey]) cheatHistoryBySbd[sbdKey] = [];
            cheatHistoryBySbd[sbdKey].push(shortDur);
            maxCheatCountBySbd[sbdKey] = Math.max(maxCheatCountBySbd[sbdKey] || 0, sCount, cheatHistoryBySbd[sbdKey].length);
        }
        if (nameKey && nameKey !== "chuanhap") {
            if (!cheatHistoryBySbd[nameKey]) cheatHistoryBySbd[nameKey] = [];
            cheatHistoryBySbd[nameKey].push(shortDur);
            maxCheatCountBySbd[nameKey] = Math.max(maxCheatCountBySbd[nameKey] || 0, sCount, cheatHistoryBySbd[nameKey].length);
        }
    }

    let submissionsList = [];
    for (let k in submissionsMap) {
        let sub = submissionsMap[k];
        if (sub && typeof sub === 'object') {
            sub._keyId = k;
            if (sub.dataString) sub.dataString = sortDataString(sub.dataString);
            submissionsList.push(sub);
        }
    }
    submissionsList.sort((a, b) => getSubmissionTimestamp(a) - getSubmissionTimestamp(b));

    const activeUsersMap = {};
    const nowMs = Date.now();
    for (let rawKey in activeSessionsMap) {
        let sess = activeSessionsMap[rawKey];
        if (!sess || typeof sess !== 'object') continue;
        if (!isSubmissionMatchingCurrentExam(sess, currentExamInfo)) continue;

        let sessCat = sess.categoryId || sess.cat;
        if (sessCat && !isStrictSameCategory(sessCat, targetCatId)) continue;

        let lastPing = (typeof sess === 'number') ? sess : (sess.lastPing || sess.startTime || sess.loginTime || 0);
        let isRecentlyActive = (nowMs - lastPing < 300000) || (sess.startTime && (nowMs - sess.startTime < 7200000) && (nowMs - lastPing < 600000));

        if (isRecentlyActive) {
            let sessSbd = String(sess.sbd || "").trim().toLowerCase();
            let sessName = normalizeName(sess.name);

            if (sessSbd) { activeUsersMap[sessSbd] = sess; activeUsersMap[sessSbd.replace(/[^a-zA-Z0-9]/g, '_')] = sess; }
            if (sessName) { activeUsersMap[sessName] = sess; }
            let cleanRaw = rawKey.split('_').pop().toLowerCase();
            if (cleanRaw) { activeUsersMap[cleanRaw] = sess; }
        }
    }

    const finalRows = [];
    const usedSubmissionKeys = new Set();
    const usedSbdSet = new Set();

    const previousSelectionMap = {};
    if (currentExamResultData.rawRows && currentExamResultData.rawRows.length > 0) {
        currentExamResultData.rawRows.forEach(r => {
            let key = (r.account && r.account.sbd) ? String(r.account.sbd).toLowerCase() : normalizeName(r.account.name);
            if (key) previousSelectionMap[key] = r.selectedAttemptIndex;
        });
    }

    classAccounts.forEach((acc, idx) => {
        const accSbd = String(acc.sbd || "").trim();
        const accSbdLower = accSbd.toLowerCase();
        const accNameNorm = normalizeName(acc.name);
        const accUserNorm = normalizeName(acc.username);

        if (accSbdLower) usedSbdSet.add(accSbdLower);

        let matchedSubs = [];
        for (let sub of submissionsList) {
            if (!isSubmissionMatchingCurrentExam(sub, currentExamInfo)) continue;
            let subCat = sub.categoryId || sub.cat;
            if (subCat && !isStrictSameCategory(subCat, targetCatId)) continue;

            let subClass = normalizeName(sub.studentClass || sub.className);
            let accClass = normalizeName(acc.className);
            if (subClass && accClass && subClass !== accClass && !isStrictSameCategory(subClass, targetCatId)) continue;

            let subSbd = String(sub.sbd || sub.studentId || "").trim().toLowerCase();
            let subNameNorm = normalizeName(sub.studentName);

            let isMatch = false;
            if (accSbdLower && subSbd && subSbd === accSbdLower) { isMatch = true; } 
            else if (subNameNorm && (subNameNorm === accNameNorm || subNameNorm === accUserNorm)) {
                if (!subSbd || subSbd === "---" || subSbd === "free" || subSbd === accSbdLower) { isMatch = true; }
            }

            if (isMatch) { matchedSubs.push(sub); usedSubmissionKeys.add(sub._keyId); }
        }

        matchedSubs = deduplicateAttempts(matchedSubs);

        let isDoing = false; let doingStartTime = null; let doingNodeCode = null;
        let safeSbd = accSbdLower.replace(/[^a-zA-Z0-9]/g, '_');
        let activeSess = activeUsersMap[accSbdLower] || activeUsersMap[safeSbd] || activeUsersMap[accNameNorm] || activeUsersMap[accUserNorm];
        
        if (matchedSubs.length === 0 && activeSess) {
            isDoing = true; 
            doingStartTime = activeSess.startTime || activeSess.loginTime || activeSess.lastPing || Date.now();
            doingNodeCode = activeSess._nodeCode;
        }

        let cheatDurations = []; let cheatLogsTabCount = 0;
        if (accSbdLower && cheatHistoryBySbd[accSbdLower]) {
            cheatDurations = cheatHistoryBySbd[accSbdLower]; cheatLogsTabCount = maxCheatCountBySbd[accSbdLower] || cheatDurations.length;
        } else if (accNameNorm && cheatHistoryBySbd[accNameNorm]) {
            cheatDurations = cheatHistoryBySbd[accNameNorm]; cheatLogsTabCount = maxCheatCountBySbd[accNameNorm] || cheatDurations.length;
        }

        let cheatTimeString = cheatDurations.length > 0 ? cheatDurations.join(" | ") : "0s";
        let studentKey = accSbdLower || accNameNorm;
        let selectedAttemptIndex = matchedSubs.length > 0 ? (matchedSubs.length - 1) : 0;
        if (previousSelectionMap[studentKey] !== undefined && previousSelectionMap[studentKey] < matchedSubs.length) {
            selectedAttemptIndex = previousSelectionMap[studentKey];
        }

        finalRows.push({
            _rowUid: 'row_cls_' + (acc.sbd || idx) + '_' + Math.random().toString(36).substring(2, 7),
            stt: acc.stt || (idx + 1), isClassStudent: true, account: acc, allAttempts: matchedSubs,
            selectedAttemptIndex: selectedAttemptIndex, isDoing: isDoing, doingStartTime: doingStartTime,
            doingNodeCode: doingNodeCode, isFreeDoing: false, cheatTimeString: cheatTimeString, cheatLogsTabCount: cheatLogsTabCount
        });
    });

    let freeCounter = classAccounts.length + 1;
    const freeGroups = {};

    for (let sub of submissionsList) {
        if (usedSubmissionKeys.has(sub._keyId)) continue;
        if (!isSubmissionMatchingCurrentExam(sub, currentExamInfo)) continue;

        let subCat = sub.categoryId || sub.cat;
        if (!subCat || !isStrictSameCategory(subCat, targetCatId)) continue;

        let subSbd = String(sub.sbd || sub.studentId || "free").trim().toLowerCase();
        let subName = normalizeName(sub.studentName) || "free_student";
        let groupKey = (subSbd !== "---" && subSbd !== "chuanhap" && subSbd !== "free") ? subSbd : subName;

        if (!freeGroups[groupKey]) {
            freeGroups[groupKey] = {
                account: { sbd: sub.sbd || sub.studentId || "---", name: sub.studentName || "Thí sinh tự do", className: sub.studentClass || sub.className || "Tự do" },
                attempts: []
            };
        }
        freeGroups[groupKey].attempts.push(sub);
        usedSbdSet.add(subSbd);
    }

    for (let gKey in freeGroups) {
        let group = freeGroups[gKey];
        let atts = deduplicateAttempts(group.attempts);
        let subSbd = String(group.account.sbd).trim().toLowerCase();
        let subNameNorm = normalizeName(group.account.name);

        let cheatDurations = []; let cheatLogsTabCount = 0;
        if (subSbd && cheatHistoryBySbd[subSbd]) {
            cheatDurations = cheatHistoryBySbd[subSbd]; cheatLogsTabCount = maxCheatCountBySbd[subSbd] || cheatDurations.length;
        } else if (subNameNorm && cheatHistoryBySbd[subNameNorm]) {
            cheatDurations = cheatHistoryBySbd[subNameNorm]; cheatLogsTabCount = maxCheatCountBySbd[subNameNorm] || cheatDurations.length;
        }

        let cheatTimeString = cheatDurations.length > 0 ? cheatDurations.join(" | ") : "0s";
        let studentKey = subSbd || subNameNorm;
        let selectedAttemptIndex = atts.length - 1;
        if (previousSelectionMap[studentKey] !== undefined && previousSelectionMap[studentKey] < atts.length) {
            selectedAttemptIndex = previousSelectionMap[studentKey];
        }

        finalRows.push({
            _rowUid: 'row_free_' + gKey + '_' + Math.random().toString(36).substring(2, 7),
            stt: freeCounter++, isClassStudent: false, account: group.account, allAttempts: atts,
            selectedAttemptIndex: selectedAttemptIndex, isDoing: false, doingStartTime: null,
            doingNodeCode: null, isFreeDoing: false, cheatTimeString: cheatTimeString, cheatLogsTabCount: cheatLogsTabCount
        });
    }

    for (let aKey in activeUsersMap) {
        let session = activeUsersMap[aKey];
        if (!session || typeof session !== 'object') continue;

        let sessCat = session.categoryId || session.cat;
        if (!sessCat || !isStrictSameCategory(sessCat, targetCatId)) continue;

        let sSbd = String(session.sbd || "").trim().toLowerCase();
        let sName = session.name || "";
        let sClass = session.className || "Tự do";
        let normSName = normalizeName(sName);

        if (sSbd && usedSbdSet.has(sSbd)) continue;
        if (normSName && usedSbdSet.has(normSName)) continue;

        let inClass = classAccounts.some(acc => {
            let aSbd = String(acc.sbd || "").trim().toLowerCase();
            let aName = normalizeName(acc.name);
            return (aSbd && aSbd === sSbd) || (aName && aName === normSName);
        });
        if (inClass) continue;

        usedSbdSet.add(sSbd || normSName);

        let sbdLower = sSbd;
        let cheatDurations = (sbdLower && cheatHistoryBySbd[sbdLower]) ? cheatHistoryBySbd[sbdLower] : [];
        let cheatTimeString = cheatDurations.length > 0 ? cheatDurations.join(" | ") : "0s";
        let logTab = (sbdLower && maxCheatCountBySbd[sbdLower]) ? maxCheatCountBySbd[sbdLower] : 0;
        let freeStart = session.startTime || session.loginTime || session.lastPing || Date.now();

        finalRows.push({
            _rowUid: 'row_live_' + (sSbd || normSName) + '_' + Math.random().toString(36).substring(2, 7),
            stt: freeCounter++, isClassStudent: false,
            account: { sbd: session.sbd || "---", name: sName || "Thí sinh tự do", className: sClass },
            allAttempts: [], selectedAttemptIndex: 0, isDoing: true, doingStartTime: freeStart,
            doingNodeCode: session._nodeCode, isFreeDoing: true, cheatTimeString: cheatTimeString, cheatLogsTabCount: logTab
        });
    }

    calculateRanksForRows(finalRows);
    currentExamResultData.rawRows = finalRows;
    updateStatsAndRenderTable(finalRows);
}

function calculateRanksForRows(rows) {
    const scores = [];
    rows.forEach(r => {
        if (r.allAttempts.length > 0) {
            let curSub = r.allAttempts[r.selectedAttemptIndex] || r.allAttempts[r.allAttempts.length - 1];
            if (curSub && curSub.score10 !== undefined) {
                let sc = parseFloat(curSub.score10);
                if (!isNaN(sc)) scores.push(sc);
            }
        }
    });

    rows.forEach(r => {
        r.rank = null;
        if (r.allAttempts.length > 0) {
            let curSub = r.allAttempts[r.selectedAttemptIndex] || r.allAttempts[r.allAttempts.length - 1];
            if (curSub && curSub.score10 !== undefined) {
                let sc = parseFloat(curSub.score10);
                if (!isNaN(sc)) r.rank = scores.filter(s => s > sc).length + 1;
            }
        }
    });
}

function updateStatsAndRenderTable(rows) {
    let total = rows.length;
    let classCount = rows.filter(r => r.isClassStudent).length;
    let freeCount = total - classCount;

    let submittedCount = rows.filter(r => r.allAttempts.length > 0).length;
    let doingCount = rows.filter(r => r.isDoing && r.allAttempts.length === 0).length;
    let unsubmittedCount = total - submittedCount - doingCount;
    
    let sumScore = 0; let scoredStudents = 0;
    let c_0_to_3 = 0, c_3_to_5 = 0, c_5_to_6 = 0, c_6_to_7 = 0, c_7_to_8 = 0, c_8_to_9 = 0, c_9_to_10 = 0;

    rows.forEach(r => {
        if (r.allAttempts.length > 0) {
            let curSub = r.allAttempts[r.selectedAttemptIndex] || r.allAttempts[r.allAttempts.length - 1];
            if (curSub && curSub.score10 !== undefined) {
                let sc = Number(curSub.score10);
                if (!isNaN(sc)) {
                    sumScore += sc; scoredStudents++;
                    if (sc < 3.0) c_0_to_3++; else if (sc < 5.0) c_3_to_5++; else if (sc <= 6.0) c_5_to_6++;
                    else if (sc <= 7.0) c_6_to_7++; else if (sc <= 8.0) c_7_to_8++; else if (sc <= 9.0) c_8_to_9++; else c_9_to_10++;
                }
            }
        }
    });
    
    let avg = scoredStudents > 0 ? (sumScore / scoredStudents).toFixed(1) : "0.0";

    const totalEl = document.getElementById("stat-total-students"); if (totalEl) totalEl.innerText = total;
    const classEl = document.getElementById("stat-class-students"); const freeEl = document.getElementById("stat-free-students");
    if (classEl) classEl.innerText = classCount; if (freeEl) freeEl.innerText = freeCount;
    const subEl = document.getElementById("stat-submitted-students"); const doingEl = document.getElementById("stat-doing-students");
    const unsubEl = document.getElementById("stat-unsubmitted-students"); const avgEl = document.getElementById("stat-avg-score");
    if (subEl) subEl.innerText = submittedCount; if (doingEl) doingEl.innerText = doingCount;
    if (unsubEl) unsubEl.innerText = unsubmittedCount; if (avgEl) avgEl.innerText = avg;

    const el_0_3 = document.getElementById("stat-score-0-to-3"); const el_3_5 = document.getElementById("stat-score-3-to-5");
    const el_5_6 = document.getElementById("stat-score-5-to-6"); const el_6_7 = document.getElementById("stat-score-6-to-7");
    const el_7_8 = document.getElementById("stat-score-7-to-8"); const el_8_9 = document.getElementById("stat-score-8-to-9");
    const el_9_10 = document.getElementById("stat-score-9-to-10");

    if (el_0_3) el_0_3.innerText = c_0_to_3; if (el_3_5) el_3_5.innerText = c_3_to_5; if (el_5_6) el_5_6.innerText = c_5_to_6;
    if (el_6_7) el_6_7.innerText = c_6_to_7; if (el_7_8) el_7_8.innerText = c_7_to_8; if (el_8_9) el_8_9.innerText = c_8_to_9;
    if (el_9_10) el_9_10.innerText = c_9_to_10;

    filterResultTable();

    const detailView = document.getElementById("result-detailed-stats-view");
    if (detailView && detailView.style.display === "flex") { renderDetailedScoreChart(); }
}

function selectStudentAttempt(rowUid, attemptIdx, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const row = currentExamResultData.rawRows.find(r => r._rowUid === rowUid);
    if (row) { row.selectedAttemptIndex = attemptIdx; calculateRanksForRows(currentExamResultData.rawRows); filterResultTable(); }
}

function toggleAttemptMenu(rowUid, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const menu = document.getElementById(`attempt-menu-${rowUid}`); const btn = document.getElementById(`attempt-btn-${rowUid}`);
    const isShown = menu && menu.classList.contains("show");
    document.querySelectorAll('.attempt-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.btn-attempt-trigger.active').forEach(b => b.classList.remove('active'));
    if (!isShown && menu) { menu.classList.add("show"); if (btn) btn.classList.add("active"); }
}

// XÓA TẠM DÒNG KHỎI MÀN HÌNH
function deleteLocalResultRow(rowUid, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const menu = document.getElementById(`del-menu-${rowUid}`);
    if (menu) menu.style.display = "none";
    
    const rIdx = currentExamResultData.rawRows.findIndex(r => r._rowUid === rowUid);
    if (rIdx === -1) return;
    const rowObj = currentExamResultData.rawRows[rIdx];
    const sName = rowObj.account?.name || "thí sinh này";

    if (!confirm(`Bạn có chắc chắn muốn XÓA TẠM THỜI hàng của "${sName}" khỏi màn hình?\n\n(Lưu ý: Thao tác này KHÔNG xóa dữ liệu trên Firebase, khi ấn "Cập nhật" sẽ hiện lại)`)) { return; }

    currentExamResultData.rawRows.splice(rIdx, 1);
    calculateRanksForRows(currentExamResultData.rawRows);
    updateStatsAndRenderTable(currentExamResultData.rawRows);
}

// XÓA VĨNH VIỄN KHỎI FIREBASE
async function deletePermanentResultRow(rowUid, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    
    const menu = document.getElementById(`del-menu-${rowUid}`);
    if (menu) menu.style.display = "none";

    const rIdx = currentExamResultData.rawRows.findIndex(r => r._rowUid === rowUid);
    if (rIdx === -1) return;
    
    const rowObj = currentExamResultData.rawRows[rIdx];
    const sName = rowObj.account?.name || "thí sinh này";

    if (!confirm(`⚠️ NGUY HIỂM: Bạn có chắc chắn muốn xóa VĨNH VIỄN bài làm của "${sName}" trên hệ thống Firebase?\n\nThao tác này sẽ xóa sạch dữ liệu và KHÔNG THỂ KHÔI PHỤC! Ấn "OK" để tiếp tục.`)) { return; }

    const deleteTasks = [];
    
    // 1. Xóa bài làm (submissions)
    if (rowObj.allAttempts && rowObj.allAttempts.length > 0) {
        rowObj.allAttempts.forEach(sub => {
            if (sub && sub._nodeCode && sub._keyId) {
                deleteTasks.push(fetch(`${FIREBASE_DB_URL}/exams/${sub._nodeCode}/submissions/${sub._keyId}.json`, { method: 'DELETE' }));
            }
        });
    }

    // 2. Xóa trạng thái đang thi (active session)
    let safeId = "";
    let sSbd = String(rowObj.account?.sbd || "").trim().toLowerCase();
    let normName = normalizeName(rowObj.account?.name || "");
    
    if (sSbd && sSbd !== "---" && sSbd !== "free" && sSbd !== "chuanhap") {
        safeId = sSbd.replace(/[^a-zA-Z0-9]/g, '_');
    } else if (normName) {
        safeId = normName.replace(/[^a-zA-Z0-9]/g, '_');
    }

    let nodeCode = "";
    if (rowObj.allAttempts && rowObj.allAttempts.length > 0) {
        nodeCode = rowObj.allAttempts[0]._nodeCode;
    } else {
        nodeCode = rowObj.doingNodeCode;
    }

    if (safeId && nodeCode) {
        deleteTasks.push(fetch(`${FIREBASE_DB_URL}/active_sessions/${nodeCode}/${safeId}.json`, { method: 'DELETE' }));
    }

    try {
        if (deleteTasks.length > 0) {
            await Promise.all(deleteTasks.map(p => p.catch(()=>null)));
        }
        
        // Xóa cục bộ trên màn hình sau khi Firebase xóa xong
        currentExamResultData.rawRows.splice(rIdx, 1);
        calculateRanksForRows(currentExamResultData.rawRows);
        updateStatsAndRenderTable(currentExamResultData.rawRows);
        
        alert(`✅ Đã xóa vĩnh viễn dữ liệu của "${sName}".`);
    } catch(e) {
        alert("❌ Lỗi khi xóa trên hệ thống: " + e.message);
    }
}

// TOGGLE MENU XÓA
function toggleDeleteMenu(uid, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    document.querySelectorAll(".delete-dropdown-menu").forEach(el => {
        if (el.id !== `del-menu-${uid}`) el.style.display = "none";
    });
    const menu = document.getElementById(`del-menu-${uid}`);
    if (menu) {
        menu.style.display = menu.style.display === "none" ? "block" : "none";
    }
}

function ensureDeleteColumnHeader() {
    const table = document.getElementById("admin-result-table");
    if (!table) return; const theadTr = table.querySelector("thead tr"); if (!theadTr) return;
    if (!theadTr.querySelector(".th-row-action-col")) {
        const th = document.createElement("th"); th.className = "th-row-action-col";
        th.style.width = "85px"; th.style.textAlign = "center"; th.innerText = "Xóa";
        theadTr.appendChild(th);
    }
}

function renderFilteredResultTable(rows) {
    ensureDeleteColumnHeader();
    const tbody = document.getElementById("result-table-tbody"); if (!tbody) return; tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="16" style="text-align:center; padding:30px; font-weight:700; color:#64748b;">Không tìm thấy dữ liệu học sinh nào!</td></tr>`;
        return;
    }

    const currentExamTitle = (currentExamResultData.item && currentExamResultData.item.title) ? currentExamResultData.item.title : "Đề thi";

    let sortedRows = [...rows];
    if (currentRankSortMode === 'desc') {
        sortedRows.sort((a, b) => {
            let scA = (a.rank !== null && a.rank !== undefined) ? (a.allAttempts[a.selectedAttemptIndex]?.score10 ?? -1) : -999;
            let scB = (b.rank !== null && b.rank !== undefined) ? (b.allAttempts[b.selectedAttemptIndex]?.score10 ?? -1) : -999;
            if (scB !== scA) return scB - scA; return a.stt - b.stt;
        });
    } else if (currentRankSortMode === 'asc') {
        sortedRows.sort((a, b) => {
            let scA = (a.rank !== null && a.rank !== undefined) ? (a.allAttempts[a.selectedAttemptIndex]?.score10 ?? 999) : 9999;
            let scB = (b.rank !== null && b.rank !== undefined) ? (b.allAttempts[b.selectedAttemptIndex]?.score10 ?? 999) : 9999;
            if (scA !== scB) return scA - scB; return a.stt - b.stt;
        });
    } else { sortedRows.sort((a, b) => a.stt - b.stt); }

    sortedRows.forEach((row, rowIdx) => {
        const tr = document.createElement("tr");
        const acc = row.account; const attCount = row.allAttempts.length;
        const currentSub = attCount > 0 ? row.allAttempts[row.selectedAttemptIndex] : null;
        const uid = row._rowUid || `row_${rowIdx}`;

        let col1_stt = row.stt;
        let col_examName = `<div class="td-exam-text" title="${currentExamTitle}">${currentExamTitle}</div>`;
        let col_attemptCount = `<span class="status-not-submitted">---</span>`;

        if (attCount === 1) { col_attemptCount = `<span class="attempt-badge-single">1 lần</span>`; } 
        else if (attCount >= 2) {
            let menuItemsHtml = "";
            row.allAttempts.forEach((at, aIdx) => {
                let sc = at.score10 !== undefined ? at.score10 : (at.calcMetrics ? at.calcMetrics.score10Scale : "--");
                let tm = at.timestamp ? at.timestamp.split(' - ')[1] || at.timestamp : `Lần ${aIdx+1}`;
                let isSel = aIdx === row.selectedAttemptIndex;
                menuItemsHtml += `<div class="attempt-menu-item ${isSel ? 'selected' : ''}" onclick="selectStudentAttempt('${uid}', ${aIdx}, event)"><span>${isSel ? '✓ ' : ''}<b>Lần ${aIdx + 1}</b> (${tm})</span><span style="color:#0284c7; font-weight:800;">${sc}đ</span></div>`;
            });
            col_attemptCount = `<div class="td-attempt-cell"><button type="button" class="btn-attempt-trigger" id="attempt-btn-${uid}" onclick="toggleAttemptMenu('${uid}', event)" title="Bấm để chọn xem lần thi khác">${attCount} lần ▾</button><div class="attempt-dropdown-menu" id="attempt-menu-${uid}"><div style="font-size:11px; font-weight:800; color:#64748b; padding:4px 8px; border-bottom:1px solid #f1f5f9;">CHỌN LẦN THI:</div>${menuItemsHtml}</div></div>`;
        }

        let col2_inTime = `<span class="status-not-submitted">---</span>`; let col3_spentTime = `<span class="status-not-submitted">---</span>`;
        let col6_status = `<span class="status-pill status-pending">Chưa thi</span>`; let col7_correct = `<span class="status-not-submitted">---</span>`;
        let col8_score = `<span class="status-not-submitted">---</span>`; let col_rank = `<span class="status-not-submitted">---</span>`;
        let col9_tabs = `<span class="status-not-submitted">---</span>`; let col10_cheatTime = `<span class="status-not-submitted">---</span>`;
        let col11_details = `<span class="status-not-submitted">---</span>`;

        if (currentSub) {
            let subDateMs = getSubmissionTimestamp(currentSub);
            col2_inTime = `<span style="font-family:monospace; font-weight:700; color:#0369a1;">${subDateMs ? formatDateTimeFull(subDateMs) : (currentSub.timestamp || "---")}</span>`;
            col3_spentTime = `<span style="color:#0f766e; font-weight:700;">${currentSub.completionTime || (currentSub.calcMetrics && currentSub.calcMetrics.completionTimeStr) || `${currentSub.spentMins||0} phút`}</span>`;
            col6_status = `<span class="status-pill status-done">✓ Đã nộp bài</span>`;
            
            let cCount = currentSub.calcMetrics ? currentSub.calcMetrics.correctCount : (currentSub.correctCount !== undefined ? currentSub.correctCount : 0);
            col7_correct = `<span style="font-weight:900; color:#15803d;">${cCount} câu</span>`;

            let sc = currentSub.score10 !== undefined ? currentSub.score10 : (currentSub.calcMetrics ? currentSub.calcMetrics.score10Scale : 0);
            let scNum = parseFloat(sc) || 0;
            let pillClass = scNum >= 8.0 ? 'score-pill-high' : (scNum >= 5.0 ? 'score-pill-mid' : 'score-pill-low');
            col8_score = `<span class="${pillClass}">${scNum.toFixed(1)}</span>`;

            if (row.rank !== null && row.rank !== undefined) {
                let rankNum = row.rank; let rankBadge = "";
                if (rankNum === 1) { rankBadge = `<span style="background: linear-gradient(135deg, #fef08a, #fde047); color: #854d0e; border: 1.5px solid #eab308; padding: 3px 8px; border-radius: 12px; font-weight: 900; font-size: 0.95em; box-shadow: 0 2px 6px rgba(234,179,8,0.25);">🥇 Hạng 1</span>`; } 
                else if (rankNum === 2) { rankBadge = `<span style="background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #334155; border: 1.5px solid #94a3b8; padding: 3px 8px; border-radius: 12px; font-weight: 900; font-size: 0.95em; box-shadow: 0 2px 6px rgba(148,163,184,0.2);">🥈 Hạng 2</span>`; } 
                else if (rankNum === 3) { rankBadge = `<span style="background: linear-gradient(135deg, #ffedd5, #fed7aa); color: #9a3412; border: 1.5px solid #fb923c; padding: 3px 8px; border-radius: 12px; font-weight: 900; font-size: 0.95em; box-shadow: 0 2px 6px rgba(251,146,60,0.2);">🥉 Hạng 3</span>`; } 
                else { rankBadge = `<span style="background: #f8fafc; color: #1e293b; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 10px; font-weight: 800; font-size: 0.92em;">Hạng ${rankNum}</span>`; }
                col_rank = rankBadge;
            }

            let rawSubTab = parseInt(currentSub.tabSwitchCount, 10) || 0;
            let dataStringTab = extractTabCountFromDataString(currentSub.dataString);
            let logTab = row.cheatLogsTabCount || 0;
            let finalTabCount = Math.max(rawSubTab, dataStringTab, logTab);

            col9_tabs = finalTabCount > 0 ? `<span class="tabs-warn">⚠️ ${finalTabCount} lần</span>` : `<span class="tabs-ok">0 lần</span>`;
            col10_cheatTime = row.cheatTimeString;

            if (currentSub.dataString) {
                let safeText = (currentSub.dataString || "").replace(/"/g, '&quot;');
                col11_details = `<span class="td-details" title="${safeText}" onclick="alert('📋 CHI TIẾT BÀI LÀM:\\n\\n' + this.title.replace(/ \\| /g, '\\n'))">${currentSub.dataString}</span>`;
            }
        } else if (row.isDoing) {
            let formattedIn = formatDateTimeFull(row.doingStartTime);
            let liveDuration = formatElapsedDuration(row.doingStartTime);

            col2_inTime = `<span style="color:#0284c7; font-weight:800; font-family:monospace;">${formattedIn}</span>`;
            col3_spentTime = `<span style="color:#ea580c; font-weight:800; background:#fff7ed; padding:3px 7px; border-radius:6px; border:1px solid #fdba74;">⏱ ${liveDuration}</span>`;
            
            if (row.isFreeDoing) { col6_status = `<span class="status-pill" style="background:#fff7ed; color:#c2410c; border:1.5px solid #fdba74; font-weight:800;">⚡ Đang thi-tự do</span>`; } 
            else { col6_status = `<span class="status-pill status-doing">⏳ Đang làm bài</span>`; }
            
            let doingTabs = row.cheatLogsTabCount || 0;
            col9_tabs = doingTabs > 0 ? `<span class="tabs-warn">⚠️ ${doingTabs} lần</span>` : `<span class="tabs-ok">0 lần</span>`;
            col10_cheatTime = row.cheatTimeString !== "0s" ? row.cheatTimeString : `<span class="status-not-submitted">---</span>`;
        }

        let rawName = acc.name || (currentSub ? currentSub.studentName : "---");
        let freeTagHtml = (!row.isClassStudent) ? `<span class="tag-free-student">Tự do</span>` : '';
        let col4_name = `<span class="td-name">${rawName}</span>${freeTagHtml}`;
        
        let rawClass = acc.className || (currentSub ? (currentSub.studentClass || currentSub.className) : "") || "---";
        let col_class = `<span class="class-badge">${rawClass}</span>`;
        
        let col5_sbd = acc.sbd || (currentSub ? (currentSub.sbd || currentSub.studentId) : "---");
        let safeTitleCol10 = stripHtml(col10_cheatTime);

        // Cập nhật Cột Xóa với Menu xòe ra
        let col_action = `
            <div class="td-action-cell" style="position:relative; display:inline-block; text-align:left;">
                <button type="button" onclick="toggleDeleteMenu('${uid}', event)" title="Tùy chọn xóa" style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; border-radius:8px; padding:3px 8px; font-size:11.5px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:2px; transition:0.15s; box-shadow:0 1px 3px rgba(239,68,68,0.15);">
                    🗑️ Xóa ▾
                </button>
                <div id="del-menu-${uid}" class="delete-dropdown-menu" style="display:none; position:absolute; right:0; top:calc(100% + 4px); background:#ffffff; border-radius:8px; border:1px solid #cbd5e1; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:9999; min-width:150px; overflow:hidden;">
                    <div onclick="deleteLocalResultRow('${uid}', event)" style="padding:8px 10px; font-size:11.5px; font-weight:700; color:#334155; cursor:pointer; border-bottom:1px solid #f1f5f9; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        👀 Xóa tạm (Ẩn đi)
                    </div>
                    <div onclick="deletePermanentResultRow('${uid}', event)" style="padding:8px 10px; font-size:11.5px; font-weight:800; color:#dc2626; cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">
                        🔥 Xóa Vĩnh Viễn
                    </div>
                </div>
            </div>
        `;

        tr.innerHTML = `<td class="td-stt">${col1_stt}</td><td class="td-exam-col" title="${currentExamTitle}">${col_examName}</td><td class="td-attempt-cell-wrap">${col_attemptCount}</td><td class="td-truncate" title="${stripHtml(col2_inTime)}">${col2_inTime}</td><td class="td-truncate" title="${stripHtml(col3_spentTime)}">${col3_spentTime}</td><td class="td-truncate" title="${rawName}">${col4_name}</td><td class="td-class td-truncate" title="${rawClass}">${col_class}</td><td class="td-sbd td-truncate" title="${col5_sbd}">${col5_sbd}</td><td style="text-align:center;">${col6_status}</td><td style="text-align:center;">${col7_correct}</td><td class="td-score">${col8_score}</td><td style="text-align:center;">${col_rank}</td><td class="td-tabs">${col9_tabs}</td><td class="td-tab-times td-truncate" title="${safeTitleCol10}">${col10_cheatTime}</td><td class="td-truncate">${col11_details}</td><td style="text-align:center;">${col_action}</td>`;
        tbody.appendChild(tr);
    });
}

function filterResultTable() {
    const query = (document.getElementById("result-search-input").value || "").trim().toLowerCase();
    if (!query) { renderFilteredResultTable(currentExamResultData.rawRows); return; }

    const filtered = currentExamResultData.rawRows.filter(r => {
        let name = (r.account.name || "").toLowerCase(); let sbd = String(r.account.sbd || "").toLowerCase(); let cName = String(r.account.className || "").toLowerCase();
        let statusText = r.allAttempts.length > 0 ? "đã nộp bài" : (r.isFreeDoing ? "đang thi tự do" : (r.isDoing ? "đang làm bài" : "chưa thi"));
        let rankText = (r.rank !== null && r.rank !== undefined) ? `hạng ${r.rank}` : "";
        return name.includes(query) || sbd.includes(query) || cName.includes(query) || statusText.includes(query) || rankText.includes(query);
    });
    renderFilteredResultTable(filtered);
}

function openDetailedStatsView() { window.location.hash = "#bang-ket-qua/thong-ke"; showDetailedStatsUI(); }
function closeDetailedStatsView() { window.location.hash = "#bang-ket-qua"; showMainResultTableUI(); }

function handleResultHeaderBack() {
    if (window.location.hash === "#bang-ket-qua/thong-ke") closeDetailedStatsView(); else closeResultModal();
}

function showDetailedStatsUI() {
    const mainView = document.getElementById("result-modal-main-view"); const detailView = document.getElementById("result-detailed-stats-view");
    const statsBar = document.getElementById("result-modal-stats-bar"); const searchInput = document.getElementById("result-search-input");
    const breadcrumbView = document.getElementById("breadcrumb-current-view"); const detailExamName = document.getElementById("detail-stat-exam-name");

    if (mainView) mainView.style.display = "none"; if (detailView) detailView.style.display = "flex";
    if (statsBar) statsBar.style.display = "none"; if (searchInput) searchInput.style.display = "none";
    if (breadcrumbView) breadcrumbView.innerText = "📈 Phổ điểm chi tiết";

    const currentTitle = (currentExamResultData.item && currentExamResultData.item.title) ? currentExamResultData.item.title : "Bài kiểm tra";
    if (detailExamName) detailExamName.innerText = currentTitle;
    renderDetailedScoreChart();
}

function showMainResultTableUI() {
    const mainView = document.getElementById("result-modal-main-view"); const detailView = document.getElementById("result-detailed-stats-view");
    const statsBar = document.getElementById("result-modal-stats-bar"); const searchInput = document.getElementById("result-search-input");
    const breadcrumbView = document.getElementById("breadcrumb-current-view");

    if (mainView) mainView.style.display = "flex"; if (detailView) detailView.style.display = "none";
    if (statsBar) statsBar.style.display = "flex"; if (searchInput) searchInput.style.display = "block";
    if (breadcrumbView) breadcrumbView.innerText = "📊 Bảng kết quả";
}

function renderDetailedScoreChart() {
    const scores = []; const binStudents = Array.from({ length: 10 }, () => []);

    currentExamResultData.rawRows.forEach(r => {
        if (r.allAttempts.length > 0) {
            let curSub = r.allAttempts[r.selectedAttemptIndex] || r.allAttempts[r.allAttempts.length - 1];
            if (curSub && curSub.score10 !== undefined) {
                let sc = parseFloat(curSub.score10);
                if (!isNaN(sc)) { scores.push(sc); let binIdx = Math.min(Math.floor(sc), 9); let rawStName = r.account.name || (curSub ? curSub.studentName : "Học sinh"); binStudents[binIdx].push(toTitleCaseName(rawStName)); }
            }
        }
    });

    const maxScore = scores.length > 0 ? Math.max(...scores) : 0; const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const passCount = scores.filter(s => s >= 5.0).length; const goodCount = scores.filter(s => s >= 7.0).length;

    const maxEl = document.getElementById("kpi-max-score"); const minEl = document.getElementById("kpi-min-score");
    const avgEl = document.getElementById("kpi-avg-score"); const passEl = document.getElementById("kpi-pass-rate");
    const goodEl = document.getElementById("kpi-good-rate");

    if (maxEl) maxEl.innerText = scores.length > 0 ? maxScore.toFixed(1) : "0.0";
    if (minEl) minEl.innerText = scores.length > 0 ? minScore.toFixed(1) : "0.0";
    if (avgEl) avgEl.innerText = scores.length > 0 ? avgScore.toFixed(1) : "0.0";
    if (passEl) passEl.innerText = scores.length > 0 ? Math.round((passCount / scores.length) * 100) + "%" : "0%";
    if (goodEl) goodEl.innerText = scores.length > 0 ? Math.round((goodCount / scores.length) * 100) + "%" : "0%";

    const bins = binStudents.map(arr => arr.length);
    const canvas = document.getElementById("detailedScoreChart"); if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (scoreChartInstance) { scoreChartInstance.destroy(); }

    const modernColors = ['#f43f5e', '#fb7185', '#f97316', '#fb923c', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#06b6d4'];

    const namesInsideBarsPlugin = {
        id: 'namesInsideBarsPlugin',
        afterDatasetsDraw(chart) {
            const { ctx } = chart; const meta = chart.getDatasetMeta(0); if (!meta || !meta.data) return;
            meta.data.forEach((bar, index) => {
                const students = binStudents[index] || []; const n = students.length; if (n === 0) return;
                const barX = bar.x; const barTopY = bar.y; const barBaseY = bar.base; const barWidth = bar.width;
                const totalBarHeight = barBaseY - barTopY; const slotHeight = totalBarHeight / n;
                const calculatedSize = Math.floor(Math.min(11, Math.max(8.5, slotHeight * 0.68, barWidth / 9.5)));
                const fontSize = Math.max(8.5, calculatedSize);
                ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `600 ${fontSize}px 'Be Vietnam Pro', Arial, sans-serif`;

                students.forEach((fullName, sIdx) => {
                    const centerY = barTopY + (sIdx + 0.5) * slotHeight; let displayName = fullName.trim();
                    if (ctx.measureText(displayName).width > barWidth - 4) {
                        const words = displayName.split(/\s+/);
                        if (words.length >= 3) { displayName = words[0] + ' ' + words.slice(1, -1).map(w => w[0] + '.').join('') + ' ' + words[words.length - 1]; }
                        if (ctx.measureText(displayName).width > barWidth - 4 && words.length >= 2) { displayName = words.slice(0, -1).map(w => w[0] + '.').join('') + ' ' + words[words.length - 1]; }
                        if (ctx.measureText(displayName).width > barWidth - 4) { while (displayName.length > 2 && ctx.measureText(displayName + '..').width > barWidth - 4) { displayName = displayName.slice(0, -1); } displayName += '..'; }
                    }
                    ctx.shadowColor = 'rgba(15, 23, 42, 0.9)'; ctx.shadowBlur = 2.5; ctx.strokeStyle = 'rgba(15, 23, 42, 0.95)'; ctx.lineWidth = 2.2; ctx.strokeText(displayName, barX, centerY);
                    ctx.fillStyle = '#ffffff'; ctx.fillText(displayName, barX, centerY);
                });
                ctx.shadowBlur = 0; ctx.fillStyle = '#0f172a'; ctx.font = `bold 12px 'Be Vietnam Pro', Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(`${n} hs`, barX, barTopY - 4);
                ctx.restore();
            });
        }
    };

    scoreChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['0 - 1đ', '1 - 2đ', '2 - 3đ', '3 - 4đ', '4 - 5đ', '5 - 6đ', '6 - 7đ', '7 - 8đ', '8 - 9đ', '9 - 10đ'], datasets: [{ label: 'Số lượng thí sinh', data: bins, backgroundColor: modernColors, borderRadius: 9, borderSkipped: false, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.85)' }] },
        plugins: [namesInsideBarsPlugin],
        options: {
            responsive: true, maintainAspectRatio: false, layout: { padding: { top: 24 } },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { const count = ctx.parsed.y; const idx = ctx.dataIndex; const names = binStudents[idx] || []; return ` Có ${count} thí sinh: ` + names.join(', '); } } } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#64748b', font: { weight: 'bold' } }, grid: { color: '#f1f5f9' } }, x: { ticks: { color: '#1e293b', font: { weight: 'bold' } }, grid: { display: false } } }
        }
    });

    const totalSubmitted = scores.length;
    const ratingGroups = [
        { name: "Xuất sắc", range: "9.0 < Điểm ≤ 10.0", count: scores.filter(s => s > 9.0).length, note: "Nắm vững toàn diện kiến thức nâng cao", color: "#06b6d4" },
        { name: "Giỏi", range: "8.0 < Điểm ≤ 9.0", count: scores.filter(s => s > 8.0 && s <= 9.0).length, note: "Kỹ năng làm bài rất tốt, chính xác cao", color: "#10b981" },
        { name: "Khá giỏi", range: "7.0 < Điểm ≤ 8.0", count: scores.filter(s => s > 7.0 && s <= 8.0).length, note: "Hiểu sâu kiến thức, tư duy nhạy bén", color: "#22c55e" },
        { name: "Khá", range: "6.0 < Điểm ≤ 7.0", count: scores.filter(s => s > 6.0 && s <= 7.0).length, note: "Vận dụng tốt các dạng bài trọng tâm", color: "#84cc16" },
        { name: "Trung bình", range: "5.0 ≤ Điểm ≤ 6.0", count: scores.filter(s => s >= 5.0 && s <= 6.0).length, note: "Đạt chuẩn kiến thức cơ bản", color: "#eab308" },
        { name: "Yếu", range: "3.0 ≤ Điểm < 5.0", count: scores.filter(s => s >= 3.0 && s < 5.0).length, note: "Cần củng cố thêm phần lý thuyết cơ bản", color: "#f97316" },
        { name: "Kém", range: "0.0 ≤ Điểm < 3.0", count: scores.filter(s => s < 3.0).length, note: "Cần kế hoạch phụ đạo tăng cường", color: "#f43f5e" }
    ];

    const rTbody = document.getElementById("rating-breakdown-tbody");
    if (rTbody) {
        rTbody.innerHTML = ratingGroups.map(g => {
            const percent = totalSubmitted > 0 ? ((g.count / totalSubmitted) * 100).toFixed(1) : "0.0";
            return `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding:10px 12px; font-weight:800; color:${g.color};">${g.name}</td><td style="padding:10px 12px; font-weight:700; color:#475569;">${g.range}</td><td style="padding:10px 12px; text-align:center; font-weight:900; font-size:14px;">${g.count} hs</td><td style="padding:10px 12px; text-align:center; font-weight:800; color:#334155;">${percent}%</td><td style="padding:10px 12px; color:#64748b;">${g.note}</td></tr>`;
        }).join('');
    }
}

function closeResultModal(triggerHistoryBack = true) {
    stopAutoRefreshResult();
    const modal = document.getElementById("result-fullscreen-modal");
    if (modal) modal.style.display = "none";
    closeRegradeModal();
    if (triggerHistoryBack && window.location.hash.startsWith("#bang-ket-qua")) { window.history.back(); }
}

function exportResultsToExcel() {
    if (!currentExamResultData.rawRows || currentExamResultData.rawRows.length === 0) { alert("⚠️ Chưa có dữ liệu để xuất file!"); return; }
    const currentExamTitle = (currentExamResultData.item && currentExamResultData.item.title) ? currentExamResultData.item.title : "Đề thi";
    const excelData = [["STT", "Số đề thi", "Số lần thi", "Thời gian vào thi", "Thời gian thi", "Họ và tên", "Lớp", "SBD", "Tình trạng", "Số câu đúng", "Điểm thang 10", "Xếp hạng", "Số lần chuyển tab", "Thời gian chuyển tab", "Chi tiết bài làm"]];

    currentExamResultData.rawRows.forEach(r => {
        const attCount = r.allAttempts.length; const sub = attCount > 0 ? r.allAttempts[r.selectedAttemptIndex] : null; const acc = r.account;
        let stt = r.stt; let soLanThi = attCount > 0 ? `${attCount} lần (Đang xem lần ${r.selectedAttemptIndex + 1})` : "Chưa thi";
        let inTime = sub ? (sub.timestamp || "") : (r.isDoing ? formatDateTimeFull(r.doingStartTime) : "Chưa thi");
        let spent = sub ? (sub.completionTime || "") : (r.isDoing ? formatElapsedDuration(r.doingStartTime) : "");
        let name = acc.name || ""; let lop = acc.className || (sub ? (sub.studentClass || sub.className) : "") || "";
        let sbd = acc.sbd || ""; let tinhTrang = sub ? "Đã nộp bài" : (r.isFreeDoing ? "Đang thi-tự do" : (r.isDoing ? "Đang làm bài" : "Chưa thi"));
        let correct = sub ? (sub.calcMetrics ? sub.calcMetrics.correctCount : (sub.correctCount !== undefined ? sub.correctCount : 0)) : "";
        let score = sub ? (sub.score10 !== undefined ? sub.score10 : (sub.calcMetrics ? sub.calcMetrics.score10Scale : "")) : "";
        let rankStr = (r.rank !== null && r.rank !== undefined) ? `Hạng ${r.rank}` : "---";
        let rawSubTab = sub ? (parseInt(sub.tabSwitchCount, 10) || 0) : 0; let dataStringTab = sub ? extractTabCountFromDataString(sub.dataString) : 0;
        let logTab = r.cheatLogsTabCount || 0; let finalTabCount = Math.max(rawSubTab, dataStringTab, logTab);
        let tabs = sub ? `${finalTabCount} lần` : (r.isDoing ? `${finalTabCount} lần` : "");
        let cheatTimes = r.cheatTimeString || ""; let details = sub ? (sub.dataString || "") : "";
        excelData.push([stt, currentExamTitle, soLanThi, inTime, spent, name, lop, sbd, tinhTrang, correct, score, rankStr, tabs, cheatTimes, details]);
    });

    if (typeof XLSX !== "undefined") {
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 13 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 24 }, { wch: 55 }];
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "KetQuaThi");
        let examTitle = (currentExamResultData.item && currentExamResultData.item.title) ? currentExamResultData.item.title : "KetQuaThi";
        let safeTitle = examTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
        XLSX.writeFile(wb, `${safeTitle}_${Date.now()}.xlsx`);
    } else { alert("❌ Không thể tải thư viện XLSX. Vui lòng kiểm tra kết nối mạng!"); }
}

function startAutoRefreshResult() {
    stopAutoRefreshResult();
    if (!isAutoRefreshEnabled) return;
    autoRefreshTimer = setInterval(async () => {
        const modal = document.getElementById("result-fullscreen-modal");
        if (modal && modal.style.display === "flex" && currentExamResultData.item) {
            await fetchAndRenderExamResults(currentExamResultData.item, true);
        }
    }, 15000); 
}

function stopAutoRefreshResult() {
    if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
}

function toggleAutoRefresh(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    isAutoRefreshEnabled = !isAutoRefreshEnabled;
    const btn = document.getElementById("btn-toggle-autorefresh");
    if (isAutoRefreshEnabled) {
        if (btn) { btn.innerHTML = "🟢 Tự động: BẬT"; btn.style.color = "#38bdf8"; btn.style.borderColor = "#38bdf8"; }
        startAutoRefreshResult();
    } else {
        if (btn) { btn.innerHTML = "⚪ Tự động: TẮT"; btn.style.color = "#94a3b8"; btn.style.borderColor = "#64748b"; }
        stopAutoRefreshResult();
    }
}

function openRegradeModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const dropdown = document.getElementById("regrade-inline-dropdown");
    const preview = document.getElementById("regrade-file-preview-status");
    const fileInput = document.getElementById("regrade-answer-file");

    if (!dropdown) return;
    if (dropdown.style.display === "block") { dropdown.style.display = "none"; return; }

    if (fileInput) fileInput.value = "";
    if (preview) { preview.style.display = "none"; preview.innerText = ""; }
    _regradeFileParsedAnswers = null; dropdown.style.display = "block";
}

function closeRegradeModal(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById("regrade-inline-dropdown");
    if (dropdown) dropdown.style.display = "none";
    _regradeFileParsedAnswers = null;
}

async function previewRegradeFile(input) {
    const preview = document.getElementById("regrade-file-preview-status");
    if (!input.files || input.files.length === 0) {
        if (preview) preview.style.display = "none";
        _regradeFileParsedAnswers = null; return;
    }
    const file = input.files[0];
    try {
        const text = await readFileAsTextAsync(file); const parsed = parseScriptOrJson(text);
        if (!parsed) throw new Error("Không thể phân tích file! Vui lòng kiểm tra định dạng.");
        const answersMap = parsed.answers || parsed.dapan || parsed;
        const count = Object.keys(answersMap).length;
        if (count === 0) throw new Error("File không chứa trường answers / dapan hợp lệ!");

        _regradeFileParsedAnswers = parsed;
        if (preview) {
            preview.style.display = "block"; preview.style.color = "#0369a1"; preview.style.borderColor = "#bae6fd"; preview.style.background = "#f0f9ff";
            preview.innerHTML = `✅ Đã đọc thành công <b>${file.name}</b> (tìm thấy <b>${count}</b> câu đáp án). Sẵn sàng chấm lại!`;
        }
    } catch(err) {
        _regradeFileParsedAnswers = null;
        if (preview) {
            preview.style.display = "block"; preview.style.color = "#dc2626"; preview.style.borderColor = "#fca5a5"; preview.style.background = "#fef2f2";
            preview.innerText = "❌ Lỗi đọc file: " + err.message;
        }
    }
}

async function processRegradeWithAnswers() {
    const btn = document.getElementById("btn-confirm-regrade");
    const fileInput = document.getElementById("regrade-answer-file");

    if (!_regradeFileParsedAnswers) {
        if (fileInput && fileInput.files.length > 0) { await previewRegradeFile(fileInput); }
        if (!_regradeFileParsedAnswers) { alert("⚠️ Vui lòng chọn file đáp án đã sửa hợp lệ trước khi bắt đầu!"); return; }
    }

    const currentItem = currentExamResultData.item;
    if (!currentItem) { alert("⚠️ Không xác định được đề thi đang xem!"); return; }

    let quizId = extractQuizIdFromItem(currentItem);
    if (!quizId) { alert("⚠️ Đề thi này không liên kết với cơ sở dữ liệu câu hỏi quiz trực tuyến!"); return; }

    btn.disabled = true; btn.innerText = "⏳ Đang nạp đề gốc...";

    try {
        const qRes = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
        let quizObj = await qRes.json();
        if (!quizObj || !quizObj.questions) { throw new Error("Không tìm thấy cấu trúc câu hỏi của đề thi trên máy chủ!"); }

        quizObj = mergeQuestionsAndAnswers(quizObj, _regradeFileParsedAnswers);
        await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`, { method: 'PATCH', body: JSON.stringify({ questions: quizObj.questions }) });

        const newAnswerKey = {}; const letters = ["A", "B", "C", "D"];
        quizObj.questions.forEach(q => {
            if (q.type === "multiple_choice") {
                if (q.correct !== undefined) { newAnswerKey[`q${q.id}`] = (typeof q.correct === 'number') ? letters[q.correct] : String(q.correct).trim().toUpperCase(); }
            } else if (q.type === "true_false") {
                if (q.statements) { q.statements.forEach(st => { newAnswerKey[`q${q.id}_${st.id}`] = st.correct ? "Đúng" : "Sai"; }); }
            } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") {
                if (q.correctAnswer !== undefined) { newAnswerKey[`q${q.id}`] = String(q.correctAnswer).trim(); }
            }
        });

        btn.innerText = "⏳ Đang tải bài làm...";
        const examTitle = quizObj.title || currentItem.title || "";
        const candidateCodes = getExamCandidateCodes(examTitle, quizObj.maDe || "", quizId);
        let allSubmissionsToUpdate = [];

        for (const code of candidateCodes) {
            try {
                const sRes = await fetch(`${FIREBASE_DB_URL}/exams/${code}/submissions.json`);
                if (sRes.ok) {
                    const sJson = await sRes.json();
                    if (sJson && typeof sJson === 'object') {
                        for (let subId in sJson) {
                            let subObj = sJson[subId];
                            if (subObj && typeof subObj === 'object') { subObj._nodeCode = code; subObj._subId = subId; allSubmissionsToUpdate.push(subObj); }
                        }
                    }
                }
            } catch(e) {}
        }

        if (allSubmissionsToUpdate.length === 0) {
            alert("ℹ️ Đã cập nhật đáp án mới vào đề thi thành công! Chưa có bài làm nào của học sinh cần tính lại điểm.");
            closeRegradeModal(); btn.disabled = false; btn.innerText = "🚀 Chấm lại ngay";
            await refreshCurrentExamResults(); return;
        }

        btn.innerText = `⏳ Đang chấm lại ${allSubmissionsToUpdate.length} bài...`;
        let updatedCount = 0;

        const regradeTasks = allSubmissionsToUpdate.map(async (sub) => {
            const userAnswersMap = {};
            if (sub.dataString) {
                const parts = sub.dataString.split(/\s*\|\s*/);
                parts.forEach(part => {
                    let m = part.match(/^(\d+)([a-zA-Z]?)\s*-\s*(.*?)\s*\[(?:ĐÚNG|SAI.*?)]$/i);
                    if (m) {
                        let qNum = m[1]; let subPart = m[2]; let ansVal = m[3].trim();
                        if (subPart) { userAnswersMap[`q${qNum}_${subPart}`] = ansVal; } else { userAnswersMap[`q${qNum}`] = ansVal; }
                    }
                });
            }
            if (sub.userAnswers && typeof sub.userAnswers === 'object') { Object.assign(userAnswersMap, sub.userAnswers); }

            let correctCount = 0; let wrongCount = 0; let totalRawScore = 0; let maxTotalScore = 0; let dataDetails = [];

            quizObj.questions.forEach(q => {
                maxTotalScore += 1.0;
                if (q.type === "multiple_choice") {
                    const userVal = userAnswersMap[`q${q.id}`] || "Chưa chọn"; const correctVal = newAnswerKey[`q${q.id}`];
                    if (correctVal && userVal.toUpperCase() === correctVal.toUpperCase()) {
                        correctCount++; totalRawScore += 1.0; dataDetails.push(`${q.id}-${userVal} [ĐÚNG]`);
                    } else {
                        wrongCount++; dataDetails.push(`${q.id}-${userVal} [SAI: ${correctVal || "---"}]`);
                    }
                } else if (q.type === "true_false") {
                    let cSt = 0;
                    (q.statements || []).forEach(st => {
                        const subKey = `q${q.id}_${st.id}`; const uVal = userAnswersMap[subKey] || "Chưa chọn"; const cVal = newAnswerKey[subKey];
                        if (cVal && uVal === cVal) { cSt++; dataDetails.push(`${q.id}${st.id}-${uVal} [ĐÚNG]`); } 
                        else { dataDetails.push(`${q.id}${st.id}-${uVal} [SAI]`); }
                    });
                    let qScore = 0;
                    if (cSt === 1) qScore = 0.1; else if (cSt === 2) qScore = 0.25; else if (cSt === 3) qScore = 0.5; else if (cSt === 4) qScore = 1.0;
                    totalRawScore += qScore;
                    if (cSt === (q.statements ? q.statements.length : 4)) correctCount++; else wrongCount++;
                } else if (q.type === "short_answer" || q.type === "essay" || q.type === "essay_answer") {
                    const uVal = String(userAnswersMap[`q${q.id}`] || "").trim().replace(',', '.'); const cVal = String(newAnswerKey[`q${q.id}`] || "").trim().replace(',', '.');
                    const isRight = (uVal !== "" && cVal !== "" && (uVal === cVal || Number(uVal) === Number(cVal)));
                    if (isRight) {
                        correctCount++; totalRawScore += 1.0; dataDetails.push(`${q.id}-${uVal} [ĐÚNG]`);
                    } else {
                        wrongCount++; dataDetails.push(`${q.id}-${uVal || "Trống"} [SAI: ${cVal || "---"}]`);
                    }
                }
            });

            const score10Scale = Math.round(((totalRawScore / (maxTotalScore || 1)) * 10) * 10) / 10;
            const originalTab = parseInt(sub.tabSwitchCount, 10) || extractTabCountFromDataString(sub.dataString) || 0;
            dataDetails.push(`Tab Switch: ${originalTab}`);

            const patchPayload = {
                score10: score10Scale, rawScore: Math.round(totalRawScore * 100) / 100, correctCount: correctCount,
                dataString: dataDetails.join(" | "),
                calcMetrics: { ...(sub.calcMetrics || {}), correctCount: correctCount, wrongCount: wrongCount, score10Scale: score10Scale },
                regradedAt: Date.now()
            };

            try { await fetch(`${FIREBASE_DB_URL}/exams/${sub._nodeCode}/submissions/${sub._subId}.json`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patchPayload) }); updatedCount++; } catch(e) {}
        });

        await Promise.all(regradeTasks);
        alert(`🎉 CHẤM LẠI THÀNH CÔNG!\n\n- Đã cập nhật đáp án mới vào đề thi gốc.\n- Đã tính lại điểm và cập nhật đồng bộ ${updatedCount} bài làm của học sinh.`);
        closeRegradeModal(); await refreshCurrentExamResults();
    } catch(err) {
        console.error("Lỗi khi chấm lại bài:", err); alert("❌ Lỗi trong quá trình chấm lại: " + err.message);
    } finally { btn.disabled = false; btn.innerText = "🚀 Chấm lại ngay"; }
}

window.addEventListener("popstate", function(event) {
    const resModal = document.getElementById("result-fullscreen-modal");
    if (!resModal || resModal.style.display !== "flex") return;
    const hash = window.location.hash;
    if (hash === "#bang-ket-qua/thong-ke") { showDetailedStatsUI(); } 
    else if (hash === "#bang-ket-qua") { showMainResultTableUI(); } 
    else { closeResultModal(false); }
});

--- START OF FILE text/javascript ---
