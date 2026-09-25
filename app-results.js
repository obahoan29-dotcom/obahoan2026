// =========================================================
// QUẢN LÝ BẢNG KẾT QUẢ THI, THỐNG KÊ & XUẤT BÁO CÁO EXCEL
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
let isAutoRefreshEnabled = true;
let scoreChartInstance = null;

function isSameCategory(catA, catB) {
    if (!catA || !catB) return false;
    let a = String(catA).toLowerCase().replace(/[^a-z0-9]/g, '');
    let b = String(catB).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (a === b) return true;
    
    const aliases = {
        "them10": ["them10", "t10"],
        "them11": ["them11", "t11"],
        "them12": ["them12", "t12"],
        "lop11a": ["lop11a", "11a"],
        "lop11c": ["lop11c", "11c"],
        "lop10p": ["lop10p", "10p"]
    };
    for (let key in aliases) {
        let list = aliases[key];
        if (list.includes(a) && list.includes(b)) return true;
    }
    return false;
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

function initTableSettings() {
    try {
        const saved = localStorage.getItem("admin_table_display_settings");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.fontSize) tableDisplaySettings.fontSize = parseInt(parsed.fontSize);
            if (parsed.rowPadding) tableDisplaySettings.rowPadding = parseInt(parsed.rowPadding);
        }
    } catch(e) {}
    applyTableSettings();
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

    try {
        localStorage.setItem("admin_table_display_settings", JSON.stringify(tableDisplaySettings));
    } catch(e) {}
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
    if (type === 'fontSize') {
        tableDisplaySettings.fontSize = Math.min(22, Math.max(10, tableDisplaySettings.fontSize + step));
    } else if (type === 'rowPadding') {
        tableDisplaySettings.rowPadding = Math.min(26, Math.max(2, tableDisplaySettings.rowPadding + step));
    }
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
            startX = e.pageX;
            startWidth = th.offsetWidth;
            resizer.classList.add("resizing");

            function onMouseMove(moveEvent) {
                const diff = moveEvent.pageX - startX;
                const newWidth = Math.max(40, startWidth + diff);
                th.style.width = newWidth + "px";
                th.style.minWidth = newWidth + "px";
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

function renderExamPickerDropdown() {
    const menu = document.getElementById("exam-picker-dropdown-list");
    if (!menu) return;
    menu.innerHTML = "";

    const currentCatId = currentExamResultData.categoryId || "them-11";
    let targetCat = DAY_THEM_CATEGORIES.find(c => c.id === currentCatId) || 
                    CHINH_KHOA_CATEGORIES.find(c => c.id === currentCatId);
    
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

async function openExamResultModal(item, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    let catId = item.categoryId;
    if (!catId) {
        for (let cat of [...DAY_THEM_CATEGORIES, ...CHINH_KHOA_CATEGORIES]) {
            if (cat.links && cat.links.some(l => l.id === item.id || l.firebaseId === item.firebaseId || l.title === item.title)) {
                catId = cat.id;
                break;
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
    const tbody = document.getElementById("result-table-tbody");
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
    tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:35px; font-weight:700; color:#64748b;">⏳ Đang kết nối Firebase và nạp dữ liệu ${displayCatName}...</td></tr>`;

    applyTableSettings();
    renderExamPickerDropdown();
    setTimeout(initTableResizable, 50);

    await fetchAndRenderExamResults(item, false);
    startAutoRefreshResult();
}

async function refreshCurrentExamResults() {
    if (!currentExamResultData.item) return;
    const tbody = document.getElementById("result-table-tbody");
    tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:35px; font-weight:700; color:#64748b;">🔄 Đang làm mới dữ liệu...</td></tr>`;
    await fetchAndRenderExamResults(currentExamResultData.item, false);
    startAutoRefreshResult();
}

function isSubmissionMatchingCurrentExam(sub, examInfo) {
    if (!sub || typeof sub !== 'object') return false;

    if (sub.quizId && examInfo.quizId) {
        if (String(sub.quizId).trim() === String(examInfo.quizId).trim()) return true;
        return false;
    }

    let subTitle = sub.examName || sub.examTitle || sub.title || "";
    let subNormTitle = normalizeName(subTitle);
    let subNormCode = extractNormalizedExamCode(subTitle || sub.maDe || "");

    if (subNormTitle && (examInfo.normTitle || examInfo.normItemTitle)) {
        if (subNormTitle === examInfo.normTitle || subNormTitle === examInfo.normItemTitle) return true;
        if (subNormTitle.length >= 8 && examInfo.normTitle.length >= 8) {
            if (subNormTitle.includes(examInfo.normTitle) || examInfo.normTitle.includes(subNormTitle)) return true;
        }
    }

    if (subNormCode && examInfo.normCode) {
        if (subNormCode === examInfo.normCode) return true;
    }

    let subMaDe = cleanExamCodeKey(sub.maDe || "");
    if (subMaDe && examInfo.maDe && subMaDe !== "101" && examInfo.maDe !== "101") {
        if (subMaDe === examInfo.maDe) return true;
    }

    if (sub._nodeCode && sub._nodeCode !== "101") {
        if (sub._nodeCode === examInfo.quizId || sub._nodeCode === examInfo.maDe || sub._nodeCode === examInfo.normCode) {
            return true;
        }
    }

    return false;
}

async function fetchAndRenderExamResults(item, isSilent = false) {
    if (!item) return;

    let quizId = "";
    if (item.url && item.url.includes("?id=")) {
        try {
            let u = new URL(item.url, window.location.href);
            quizId = u.searchParams.get("id");
        } catch(e) {}
    }
    if (!quizId && item.firebaseId && item.firebaseId.startsWith("quiz_")) {
        quizId = item.firebaseId;
    }

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

    let candidateCodes = new Set();
    let normCode = extractNormalizedExamCode(examTitle || item.title);
    if (normCode) candidateCodes.add(normCode);
    if (maDe) candidateCodes.add(cleanExamCodeKey(maDe));
    if (examTitle) candidateCodes.add(cleanExamCodeKey(examTitle));
    if (item.title) candidateCodes.add(cleanExamCodeKey(item.title));
    if (quizId) candidateCodes.add(quizId);
    candidateCodes.add("101");

    let submissionsMap = {};
    let cheatingLogsData = {};
    let activeSessionsData = {};

    try {
        for (let code of candidateCodes) {
            let [sRes, cRes, aRes] = await Promise.all([
                fetch(`${FIREBASE_DB_URL}/exams/${code}/submissions.json`).catch(() => null),
                fetch(`${FIREBASE_DB_URL}/exams/${code}/cheating_logs.json`).catch(() => null),
                fetch(`${FIREBASE_DB_URL}/active_sessions/${code}.json`).catch(() => null)
            ]);

            if (sRes && sRes.ok) {
                let sJson = await sRes.json();
                if (sJson && typeof sJson === 'object') {
                    for (let subId in sJson) {
                        let subObj = sJson[subId];
                        if (subObj && typeof subObj === 'object') {
                            subObj._nodeCode = code;
                            submissionsMap[subId] = subObj;
                        }
                    }
                }
            }

            if (cRes && cRes.ok) {
                let cJson = await cRes.json();
                if (cJson && typeof cJson === 'object') {
                    for (let cId in cJson) {
                        let cObj = cJson[cId];
                        if (cObj && typeof cObj === 'object') {
                            cObj._nodeCode = code;
                            cheatingLogsData[cId] = cObj;
                        }
                    }
                }
            }

            if (aRes && aRes.ok) {
                let aJson = await aRes.json();
                if (aJson && typeof aJson === 'object') {
                    for (let aId in aJson) {
                        let aObj = aJson[aId];
                        if (typeof aObj === 'object' && aObj !== null) {
                            aObj._nodeCode = code;
                            activeSessionsData[aId] = aObj;
                        } else {
                            activeSessionsData[aId] = { lastPing: aObj, _nodeCode: code };
                        }
                    }
                }
            }
        }
    } catch(e) { console.error("Lỗi khi nạp dữ liệu thi Firebase:", e); }

    const targetCatId = item.categoryId || currentExamResultData.categoryId || "them-11";
    renderExamResultTable(targetCatId, submissionsMap, cheatingLogsData, activeSessionsData, item, {
        quizId,
        maDe,
        examTitle
    });

    const searchInput = document.getElementById("result-search-input");
    if (searchInput && searchInput.value.trim() !== "") {
        filterResultTable();
    }
}

function getSubmissionTimestamp(sub) {
    if (!sub) return 0;
    if (typeof sub.createdAt === 'number') return sub.createdAt;
    if (sub.createdAt) {
        let n = Number(sub.createdAt);
        if (!isNaN(n) && n > 0) return n;
    }
    return parseDateString(sub.timestamp) || 0;
}

function renderExamResultTable(categoryId, submissionsMap, cheatingMap, activeSessionsMap, examItem, examMeta = {}) {
    const classAccounts = getAccountsForCategory(categoryId);
    const targetCatIdLower = (categoryId || "").toLowerCase().trim();

    const currentExamInfo = {
        quizId: examMeta.quizId || "",
        maDe: cleanExamCodeKey(examMeta.maDe || ""),
        title: examMeta.examTitle || (examItem && examItem.title) || "",
        itemTitle: (examItem && examItem.title) || "",
        normTitle: normalizeName(examMeta.examTitle || (examItem && examItem.title) || ""),
        normItemTitle: normalizeName((examItem && examItem.title) || ""),
        normCode: extractNormalizedExamCode(examMeta.examTitle || (examItem && examItem.title) || ""),
        categoryId: targetCatIdLower
    };

    const cheatHistoryBySbd = {};
    const maxCheatCountBySbd = {};

    for (let k in cheatingMap) {
        let log = cheatingMap[k];
        if (!log || typeof log !== 'object') continue;

        if ((log.examName || log.quizId) && !isSubmissionMatchingCurrentExam(log, currentExamInfo)) {
            continue;
        }

        let logCat = log.categoryId || log.cat;
        if (logCat && !isSameCategory(logCat, targetCatIdLower)) {
            continue;
        }

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
            if (sub.dataString) {
                sub.dataString = sortDataString(sub.dataString);
            }
            submissionsList.push(sub);
        }
    }
    submissionsList.sort((a, b) => getSubmissionTimestamp(a) - getSubmissionTimestamp(b));

    const activeUsersMap = {};
    const nowMs = Date.now();
    for (let sId in activeSessionsMap) {
        let sess = activeSessionsMap[sId];
        let lastPing = (typeof sess === 'number') ? sess : (sess && sess.lastPing ? sess.lastPing : 0);
        if (nowMs - lastPing < 120000) {
            activeUsersMap[String(sId).trim().toLowerCase()] = sess;
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

    // 1. DUYỆT DANH SÁCH HỌC SINH CỦA LỚP HIỆN TẠI
    classAccounts.forEach((acc, idx) => {
        const accSbd = String(acc.sbd || "").trim();
        const accSbdLower = accSbd.toLowerCase();
        const accNameNorm = normalizeName(acc.name);
        const accUserNorm = normalizeName(acc.username);
        const accClassNorm = normalizeName(acc.className);

        if (accSbdLower) usedSbdSet.add(accSbdLower);

        let matchedSubs = [];
        for (let sub of submissionsList) {
            if (!isSubmissionMatchingCurrentExam(sub, currentExamInfo)) continue;

            let subCat = sub.categoryId || sub.cat;
            if (subCat && !isSameCategory(subCat, targetCatIdLower)) continue;

            let subSbd = String(sub.sbd || sub.studentId || "").trim().toLowerCase();
            let subNameNorm = normalizeName(sub.studentName);
            let subClassNorm = normalizeName(sub.studentClass || sub.className);

            let isMatch = false;
            if (accSbdLower && subSbd && subSbd === accSbdLower) {
                isMatch = true;
            } else if (subNameNorm && (subNameNorm === accNameNorm || subNameNorm === accUserNorm)) {
                isMatch = (!subClassNorm || !accClassNorm || subClassNorm === accClassNorm);
            }

            if (isMatch) {
                matchedSubs.push(sub);
                usedSubmissionKeys.add(sub._keyId);
            }
        }

        let isDoing = false;
        let safeSbd = accSbdLower.replace(/[^a-zA-Z0-9]/g, '_');
        let activeSess = activeUsersMap[accSbdLower] || activeUsersMap[safeSbd];
        if (matchedSubs.length === 0 && activeSess) {
            let sCat = activeSess.categoryId || activeSess.cat;
            if (!sCat || isSameCategory(sCat, targetCatIdLower)) {
                isDoing = true;
            }
        }

        let cheatDurations = [];
        let cheatLogsTabCount = 0;

        if (accSbdLower && cheatHistoryBySbd[accSbdLower]) {
            cheatDurations = cheatHistoryBySbd[accSbdLower];
            cheatLogsTabCount = maxCheatCountBySbd[accSbdLower] || cheatDurations.length;
        } else if (accNameNorm && cheatHistoryBySbd[accNameNorm]) {
            cheatDurations = cheatHistoryBySbd[accNameNorm];
            cheatLogsTabCount = maxCheatCountBySbd[accNameNorm] || cheatDurations.length;
        }

        let cheatTimeString = cheatDurations.length > 0 ? cheatDurations.join(" | ") : "0s";
        let studentKey = accSbdLower || accNameNorm;
        let selectedAttemptIndex = matchedSubs.length > 0 ? (matchedSubs.length - 1) : 0;
        if (previousSelectionMap[studentKey] !== undefined && previousSelectionMap[studentKey] < matchedSubs.length) {
            selectedAttemptIndex = previousSelectionMap[studentKey];
        }

        finalRows.push({
            stt: acc.stt || (idx + 1),
            isClassStudent: true,
            account: acc,
            allAttempts: matchedSubs,
            selectedAttemptIndex: selectedAttemptIndex,
            isDoing: isDoing,
            isFreeDoing: false,
            cheatTimeString: cheatTimeString,
            cheatLogsTabCount: cheatLogsTabCount
        });
    });

    // 2. DUYỆT THÍ SINH TỰ DO ĐÃ NỘP BÀI TRONG LỚP NÀY
    let freeCounter = classAccounts.length + 1;
    const freeGroups = {};

    for (let sub of submissionsList) {
        if (usedSubmissionKeys.has(sub._keyId)) continue;
        if (!isSubmissionMatchingCurrentExam(sub, currentExamInfo)) continue;

        let subCat = sub.categoryId || sub.cat;
        let subClass = normalizeName(sub.studentClass || sub.className || "");

        let isBelongToCurrentClass = false;
        if (subCat) {
            isBelongToCurrentClass = isSameCategory(subCat, targetCatIdLower);
        } else {
            if (targetCatIdLower.includes("11a") && subClass.includes("11a")) isBelongToCurrentClass = true;
            else if (targetCatIdLower.includes("11c") && subClass.includes("11c")) isBelongToCurrentClass = true;
            else if (targetCatIdLower.includes("10p") && subClass.includes("10p")) isBelongToCurrentClass = true;
            else if (targetCatIdLower.includes("them-10") && subClass.includes("10")) isBelongToCurrentClass = true;
            else if (targetCatIdLower.includes("them-11") && subClass.includes("11")) isBelongToCurrentClass = true;
            else if (targetCatIdLower.includes("them-12") && subClass.includes("12")) isBelongToCurrentClass = true;
        }

        if (!isBelongToCurrentClass) continue;

        let subSbd = String(sub.sbd || sub.studentId || "free").trim().toLowerCase();
        let subName = normalizeName(sub.studentName) || "free_student";
        let groupKey = (subSbd !== "---" && subSbd !== "chuanhap") ? subSbd : subName;

        if (!freeGroups[groupKey]) {
            freeGroups[groupKey] = {
                account: {
                    sbd: sub.sbd || sub.studentId || "---",
                    name: sub.studentName || "Thí sinh tự do",
                    className: sub.studentClass || sub.className || "Tự do"
                },
                attempts: []
            };
        }
        freeGroups[groupKey].attempts.push(sub);
        usedSbdSet.add(subSbd);
    }

    for (let gKey in freeGroups) {
        let group = freeGroups[gKey];
        let atts = group.attempts;
        let subSbd = String(group.account.sbd).trim().toLowerCase();
        let subNameNorm = normalizeName(group.account.name);

        let cheatDurations = [];
        let cheatLogsTabCount = 0;

        if (subSbd && cheatHistoryBySbd[subSbd]) {
            cheatDurations = cheatHistoryBySbd[subSbd];
            cheatLogsTabCount = maxCheatCountBySbd[subSbd] || cheatDurations.length;
        } else if (subNameNorm && cheatHistoryBySbd[subNameNorm]) {
            cheatDurations = cheatHistoryBySbd[subNameNorm];
            cheatLogsTabCount = maxCheatCountBySbd[subNameNorm] || cheatDurations.length;
        }

        let cheatTimeString = cheatDurations.length > 0 ? cheatDurations.join(" | ") : "0s";
        let studentKey = subSbd || subNameNorm;
        let selectedAttemptIndex = atts.length - 1;
        if (previousSelectionMap[studentKey] !== undefined && previousSelectionMap[studentKey] < atts.length) {
            selectedAttemptIndex = previousSelectionMap[studentKey];
        }

        finalRows.push({
            stt: freeCounter++,
            isClassStudent: false,
            account: group.account,
            allAttempts: atts,
            selectedAttemptIndex: selectedAttemptIndex,
            isDoing: false,
            isFreeDoing: false,
            cheatTimeString: cheatTimeString,
            cheatLogsTabCount: cheatLogsTabCount
        });
    }

    // 3. THÍ SINH ĐANG THI TỰ DO TRỰC TUYẾN TRONG LỚP NÀY
    for (let aKey in activeUsersMap) {
        let session = activeUsersMap[aKey];
        if (!session || typeof session !== 'object') continue;

        let sessCat = session.categoryId || session.cat;
        if (sessCat && !isSameCategory(sessCat, targetCatIdLower)) continue;

        let sSbd = String(session.sbd || "").trim().toLowerCase();
        let sName = session.name || "";
        let sClass = session.className || "Tự do";

        if (sSbd && usedSbdSet.has(sSbd)) continue;
        if (!isSubmissionMatchingCurrentExam(session, currentExamInfo)) continue;

        usedSbdSet.add(sSbd || normalizeName(sName));

        let sbdLower = sSbd;
        let cheatDurations = (sbdLower && cheatHistoryBySbd[sbdLower]) ? cheatHistoryBySbd[sbdLower] : [];
        let cheatTimeString = cheatDurations.length > 0 ? cheatDurations.join(" | ") : "0s";
        let logTab = (sbdLower && maxCheatCountBySbd[sbdLower]) ? maxCheatCountBySbd[sbdLower] : 0;

        finalRows.push({
            stt: freeCounter++,
            isClassStudent: false,
            account: {
                sbd: session.sbd || "---",
                name: sName || "Thí sinh tự do",
                className: sClass
            },
            allAttempts: [],
            selectedAttemptIndex: 0,
            isDoing: true,
            isFreeDoing: true,
            startTimeStr: session.startTime ? new Date(session.startTime).toLocaleTimeString("vi-VN") : "Vừa vào thi",
            cheatTimeString: cheatTimeString,
            cheatLogsTabCount: logTab
        });
    }

    currentExamResultData.rawRows = finalRows;
    updateStatsAndRenderTable(finalRows);
}

function updateStatsAndRenderTable(rows) {
    let total = rows.length;
    let classCount = rows.filter(r => r.isClassStudent).length;
    let freeCount = total - classCount;

    let submittedCount = rows.filter(r => r.allAttempts.length > 0).length;
    let doingCount = rows.filter(r => r.isDoing && r.allAttempts.length === 0).length;
    let unsubmittedCount = total - submittedCount - doingCount;
    
    let sumScore = 0;
    let scoredStudents = 0;

    let countUnder5 = 0;
    let count5To7 = 0;
    let countOver7 = 0;

    rows.forEach(r => {
        if (r.allAttempts.length > 0) {
            let curSub = r.allAttempts[r.selectedAttemptIndex] || r.allAttempts[r.allAttempts.length - 1];
            if (curSub && curSub.score10 !== undefined) {
                let sc = Number(curSub.score10);
                if (!isNaN(sc)) {
                    sumScore += sc;
                    scoredStudents++;

                    if (sc < 5.0) {
                        countUnder5++;
                    } else if (sc <= 7.0) {
                        count5To7++;
                    } else {
                        countOver7++;
                    }
                }
            }
        }
    });
    
    let avg = scoredStudents > 0 ? (sumScore / scoredStudents).toFixed(1) : "0.0";

    document.getElementById("stat-total-students").innerText = total;
    const classEl = document.getElementById("stat-class-students");
    const freeEl = document.getElementById("stat-free-students");
    if (classEl) classEl.innerText = classCount;
    if (freeEl) freeEl.innerText = freeCount;

    document.getElementById("stat-submitted-students").innerText = submittedCount;
    document.getElementById("stat-doing-students").innerText = doingCount;
    document.getElementById("stat-unsubmitted-students").innerText = unsubmittedCount;
    document.getElementById("stat-avg-score").innerText = avg;

    const u5El = document.getElementById("stat-score-under-5");
    const midEl = document.getElementById("stat-score-5-to-7");
    const o7El = document.getElementById("stat-score-over-7");
    if (u5El) u5El.innerText = countUnder5;
    if (midEl) midEl.innerText = count5To7;
    if (o7El) o7El.innerText = countOver7;

    renderFilteredResultTable(rows);

    const detailView = document.getElementById("result-detailed-stats-view");
    if (detailView && detailView.style.display === "flex") {
        renderDetailedScoreChart();
    }
}

function selectStudentAttempt(rowIndex, attemptIdx, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    if (currentExamResultData.rawRows[rowIndex]) {
        currentExamResultData.rawRows[rowIndex].selectedAttemptIndex = attemptIdx;
        filterResultTable();
    }
}

function toggleAttemptMenu(rowIndex, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const menu = document.getElementById(`attempt-menu-${rowIndex}`);
    const btn = document.getElementById(`attempt-btn-${rowIndex}`);
    const isShown = menu && menu.classList.contains("show");

    document.querySelectorAll('.attempt-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.btn-attempt-trigger.active').forEach(b => b.classList.remove('active'));

    if (!isShown && menu) {
        menu.classList.add("show");
        if (btn) btn.classList.add("active");
    }
}

function renderFilteredResultTable(rows) {
    const tbody = document.getElementById("result-table-tbody");
    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:30px; font-weight:700; color:#64748b;">Không tìm thấy dữ liệu học sinh nào!</td></tr>`;
        return;
    }

    const currentExamTitle = (currentExamResultData.item && currentExamResultData.item.title) ? currentExamResultData.item.title : "Đề thi";

    rows.forEach((row, rowIdx) => {
        const tr = document.createElement("tr");
        const acc = row.account;
        const attCount = row.allAttempts.length;
        const currentSub = attCount > 0 ? row.allAttempts[row.selectedAttemptIndex] : null;

        let col1_stt = row.stt;
        let col_examName = `<div class="td-exam-text" title="${currentExamTitle}">${currentExamTitle}</div>`;
        let col_attemptCount = `<span class="status-not-submitted">---</span>`;

        if (attCount === 1) {
            col_attemptCount = `<span class="attempt-badge-single">1 lần</span>`;
        } else if (attCount >= 2) {
            let menuItemsHtml = "";
            row.allAttempts.forEach((at, aIdx) => {
                let sc = at.score10 !== undefined ? at.score10 : (at.calcMetrics ? at.calcMetrics.score10Scale : "--");
                let tm = at.timestamp ? at.timestamp.split(' - ')[1] || at.timestamp : `Lần ${aIdx+1}`;
                let isSel = aIdx === row.selectedAttemptIndex;
                menuItemsHtml += `
                    <div class="attempt-menu-item ${isSel ? 'selected' : ''}" onclick="selectStudentAttempt(${rowIdx}, ${aIdx}, event)">
                        <span>${isSel ? '✓ ' : ''}<b>Lần ${aIdx + 1}</b> (${tm})</span>
                        <span style="color:#0284c7; font-weight:800;">${sc}đ</span>
                    </div>
                `;
            });

            col_attemptCount = `
                <div class="td-attempt-cell">
                    <button type="button" class="btn-attempt-trigger" id="attempt-btn-${rowIdx}" onclick="toggleAttemptMenu(${rowIdx}, event)" title="Bấm để chọn xem lần thi khác">
                        ${attCount} lần ▾
                    </button>
                    <div class="attempt-dropdown-menu" id="attempt-menu-${rowIdx}">
                        <div style="font-size:11px; font-weight:800; color:#64748b; padding:4px 8px; border-bottom:1px solid #f1f5f9;">CHỌN LẦN THI:</div>
                        ${menuItemsHtml}
                    </div>
                </div>
            `;
        }

        let col2_inTime = `<span class="status-not-submitted">---</span>`;
        let col3_spentTime = `<span class="status-not-submitted">---</span>`;
        let col6_status = `<span class="status-pill status-pending">Chưa thi</span>`;
        let col7_correct = `<span class="status-not-submitted">---</span>`;
        let col8_score = `<span class="status-not-submitted">---</span>`;
        let col9_tabs = `<span class="status-not-submitted">---</span>`;
        let col10_cheatTime = `<span class="status-not-submitted">---</span>`;
        let col11_details = `<span class="status-not-submitted">---</span>`;

        if (currentSub) {
            col2_inTime = currentSub.timestamp || (currentSub.createdAt ? new Date(currentSub.createdAt).toLocaleTimeString("vi-VN") : "---");
            col3_spentTime = currentSub.completionTime || (currentSub.calcMetrics && currentSub.calcMetrics.completionTimeStr) || `${currentSub.spentMins||0} phút`;
            col6_status = `<span class="status-pill status-done">Đã nộp bài</span>`;
            
            let cCount = currentSub.calcMetrics ? currentSub.calcMetrics.correctCount : (currentSub.correctCount !== undefined ? currentSub.correctCount : 0);
            col7_correct = `<span style="font-weight:800; color:#10b981;">${cCount} câu</span>`;

            let sc = currentSub.score10 !== undefined ? currentSub.score10 : (currentSub.calcMetrics ? currentSub.calcMetrics.score10Scale : 0);
            let scNum = parseFloat(sc) || 0;
            let pillClass = scNum >= 8.0 ? 'score-pill-high' : (scNum >= 5.0 ? 'score-pill-mid' : 'score-pill-low');
            col8_score = `<span class="${pillClass}">${scNum.toFixed(1)}</span>`;

            let rawSubTab = parseInt(currentSub.tabSwitchCount, 10) || 0;
            let dataStringTab = extractTabCountFromDataString(currentSub.dataString);
            let logTab = row.cheatLogsTabCount || 0;
            let finalTabCount = Math.max(rawSubTab, dataStringTab, logTab);

            col9_tabs = finalTabCount > 0 ? `<span class="tabs-warn">${finalTabCount} lần</span>` : `<span class="tabs-ok">0 lần</span>`;
            col10_cheatTime = row.cheatTimeString;

            if (currentSub.dataString) {
                let safeText = (currentSub.dataString || "").replace(/"/g, '&quot;');
                col11_details = `<span class="td-details" title="${safeText}" onclick="alert('📋 CHI TIẾT BÀI LÀM:\\n\\n' + this.title.replace(/ \\| /g, '\\n'))">${currentSub.dataString}</span>`;
            }
        } else if (row.isDoing) {
            col2_inTime = `<span style="color:#0284c7; font-weight:800;">${row.startTimeStr || "Vừa vào thi"}</span>`;
            col3_spentTime = `<span style="color:#f59e0b; font-weight:800;">Đang làm...</span>`;
            
            if (row.isFreeDoing) {
                col6_status = `<span class="status-pill" style="background:#fff7ed; color:#c2410c; border:1px solid #fdba74; font-weight:800;">⚡ Đang thi-tự do</span>`;
            } else {
                col6_status = `<span class="status-pill status-doing">Đang làm bài</span>`;
            }
            
            let doingTabs = row.cheatLogsTabCount || 0;
            col9_tabs = doingTabs > 0 ? `<span class="tabs-warn">${doingTabs} lần</span>` : `<span class="tabs-ok">0 lần</span>`;
            col10_cheatTime = row.cheatTimeString !== "0s" ? row.cheatTimeString : `<span class="status-not-submitted">---</span>`;
        }

        let col4_name = acc.name || (currentSub ? currentSub.studentName : "---");
        let col_class = acc.className || (currentSub ? (currentSub.studentClass || currentSub.className) : "") || "---";
        let col5_sbd = acc.sbd || (currentSub ? (currentSub.sbd || currentSub.studentId) : "---");
        let safeTitleCol10 = stripHtml(col10_cheatTime);

        tr.innerHTML = `
            <td class="td-stt">${col1_stt}</td>
            <td class="td-exam-col" title="${currentExamTitle}">${col_examName}</td>
            <td class="td-attempt-cell-wrap">${col_attemptCount}</td>
            <td class="td-truncate" title="${stripHtml(col2_inTime)}">${col2_inTime}</td>
            <td class="td-truncate" title="${stripHtml(col3_spentTime)}">${col3_spentTime}</td>
            <td class="td-name td-truncate" title="${col4_name}">${col4_name}</td>
            <td class="td-class td-truncate" title="${col_class}">${col_class}</td>
            <td class="td-sbd td-truncate" title="${col5_sbd}">${col5_sbd}</td>
            <td style="text-align:center;">${col6_status}</td>
            <td style="text-align:center;">${col7_correct}</td>
            <td class="td-score">${col8_score}</td>
            <td class="td-tabs">${col9_tabs}</td>
            <td class="td-tab-times td-truncate" title="${safeTitleCol10}">${col10_cheatTime}</td>
            <td class="td-truncate">${col11_details}</td>
        `;

        tbody.appendChild(tr);
    });
}

function filterResultTable() {
    const query = (document.getElementById("result-search-input").value || "").trim().toLowerCase();
    if (!query) {
        renderFilteredResultTable(currentExamResultData.rawRows);
        return;
    }

    const filtered = currentExamResultData.rawRows.filter(r => {
        let name = (r.account.name || "").toLowerCase();
        let sbd = String(r.account.sbd || "").toLowerCase();
        let cName = String(r.account.className || "").toLowerCase();
        let statusText = r.allAttempts.length > 0 ? "đã nộp bài" : (r.isFreeDoing ? "đang thi tự do" : (r.isDoing ? "đang làm bài" : "chưa thi"));
        return name.includes(query) || sbd.includes(query) || cName.includes(query) || statusText.includes(query);
    });

    renderFilteredResultTable(filtered);
}

// =========================================================
// ĐIỀU HƯỚNG MÀN HÌNH THỐNG KÊ CHI TIẾT & BIỂU ĐỒ HÌNH CỘT
// =========================================================
function openDetailedStatsView() {
    window.location.hash = "#bang-ket-qua/thong-ke";
    showDetailedStatsUI();
}

function closeDetailedStatsView() {
    window.location.hash = "#bang-ket-qua";
    showMainResultTableUI();
}

function handleResultHeaderBack() {
    if (window.location.hash === "#bang-ket-qua/thong-ke") {
        closeDetailedStatsView();
    } else {
        closeResultModal();
    }
}

function showDetailedStatsUI() {
    const mainView = document.getElementById("result-modal-main-view");
    const detailView = document.getElementById("result-detailed-stats-view");
    const statsBar = document.getElementById("result-modal-stats-bar");
    const searchInput = document.getElementById("result-search-input");
    const breadcrumbView = document.getElementById("breadcrumb-current-view");
    const detailExamName = document.getElementById("detail-stat-exam-name");

    if (mainView) mainView.style.display = "none";
    if (detailView) detailView.style.display = "flex";
    if (statsBar) statsBar.style.display = "none";
    if (searchInput) searchInput.style.display = "none";
    if (breadcrumbView) breadcrumbView.innerText = "📈 Phổ điểm chi tiết";

    const currentTitle = (currentExamResultData.item && currentExamResultData.item.title) ? currentExamResultData.item.title : "Bài kiểm tra";
    if (detailExamName) detailExamName.innerText = currentTitle;

    renderDetailedScoreChart();
}

function showMainResultTableUI() {
    const mainView = document.getElementById("result-modal-main-view");
    const detailView = document.getElementById("result-detailed-stats-view");
    const statsBar = document.getElementById("result-modal-stats-bar");
    const searchInput = document.getElementById("result-search-input");
    const breadcrumbView = document.getElementById("breadcrumb-current-view");

    if (mainView) mainView.style.display = "flex";
    if (detailView) detailView.style.display = "none";
    if (statsBar) statsBar.style.display = "flex";
    if (searchInput) searchInput.style.display = "block";
    if (breadcrumbView) breadcrumbView.innerText = "📊 Bảng kết quả";
}

function renderDetailedScoreChart() {
    const scores = [];
    currentExamResultData.rawRows.forEach(r => {
        if (r.allAttempts.length > 0) {
            let curSub = r.allAttempts[r.selectedAttemptIndex] || r.allAttempts[r.allAttempts.length - 1];
            if (curSub && curSub.score10 !== undefined) {
                let sc = parseFloat(curSub.score10);
                if (!isNaN(sc)) scores.push(sc);
            }
        }
    });

    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const passCount = scores.filter(s => s >= 5.0).length;
    const goodCount = scores.filter(s => s >= 7.0).length;

    document.getElementById("kpi-max-score").innerText = scores.length > 0 ? maxScore.toFixed(1) : "0.0";
    document.getElementById("kpi-min-score").innerText = scores.length > 0 ? minScore.toFixed(1) : "0.0";
    document.getElementById("kpi-avg-score").innerText = scores.length > 0 ? avgScore.toFixed(1) : "0.0";
    document.getElementById("kpi-pass-rate").innerText = scores.length > 0 ? Math.round((passCount / scores.length) * 100) + "%" : "0%";
    document.getElementById("kpi-good-rate").innerText = scores.length > 0 ? Math.round((goodCount / scores.length) * 100) + "%" : "0%";

    const bins = Array(10).fill(0);
    scores.forEach(s => {
        let binIdx = Math.min(Math.floor(s), 9);
        bins[binIdx]++;
    });

    const canvas = document.getElementById("detailedScoreChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (scoreChartInstance) {
        scoreChartInstance.destroy();
    }

    const columnColors = [
        '#ef4444', '#f87171', '#fb923c', '#fbbf24', '#facc15',
        '#a3e635', '#4ade80', '#22c55e', '#10b981', '#06b6d4'
    ];

    scoreChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [
                '0 - 1đ', '1 - 2đ', '2 - 3đ', '3 - 4đ', '4 - 5đ', 
                '5 - 6đ', '6 - 7đ', '7 - 8đ', '8 - 9đ', '9 - 10đ'
            ],
            datasets: [{
                label: 'Số lượng thí sinh',
                data: bins,
                backgroundColor: columnColors,
                borderRadius: 8,
                borderSkipped: false,
                borderWidth: 1.5,
                borderColor: '#cbd5e1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ` Có ${ctx.parsed.y} thí sinh đạt mức điểm này`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, color: '#64748b', font: { weight: 'bold' } },
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    ticks: { color: '#1e293b', font: { weight: 'bold' } },
                    grid: { display: false }
                }
            }
        }
    });

    const totalSubmitted = scores.length;
    const ratingGroups = [
        { name: "Giỏi - Xuất sắc", range: "8.0 - 10.0", count: scores.filter(s => s >= 8.0).length, note: "Nắm vững toàn diện kiến thức", color: "#16a34a" },
        { name: "Khá", range: "6.5 - 7.9", count: scores.filter(s => s >= 6.5 && s < 8.0).length, note: "Hiểu bài tốt, kỹ năng vững", color: "#0284c7" },
        { name: "Trung bình", range: "5.0 - 6.4", count: scores.filter(s => s >= 5.0 && s < 6.5).length, note: "Đạt chuẩn kiến thức cơ bản", color: "#d97706" },
        { name: "Yếu", range: "3.5 - 4.9", count: scores.filter(s => s >= 3.5 && s < 5.0).length, note: "Cần củng cố thêm phần lý thuyết", color: "#ea580c" },
        { name: "Kém", range: "0.0 - 3.4", count: scores.filter(s => s < 3.5).length, note: "Cần kế hoạch phụ đạo bổ trợ", color: "#dc2626" }
    ];

    const rTbody = document.getElementById("rating-breakdown-tbody");
    if (rTbody) {
        rTbody.innerHTML = ratingGroups.map(g => {
            const percent = totalSubmitted > 0 ? ((g.count / totalSubmitted) * 100).toFixed(1) : "0.0";
            return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding:10px 12px; font-weight:800; color:${g.color};">${g.name}</td>
                    <td style="padding:10px 12px; font-weight:700; color:#475569;">${g.range}</td>
                    <td style="padding:10px 12px; text-align:center; font-weight:900; font-size:14px;">${g.count} hs</td>
                    <td style="padding:10px 12px; text-align:center; font-weight:800; color:#334155;">${percent}%</td>
                    <td style="padding:10px 12px; color:#64748b;">${g.note}</td>
                </tr>
            `;
        }).join('');
    }
}

function closeResultModal(triggerHistoryBack = true) {
    stopAutoRefreshResult();
    const modal = document.getElementById("result-fullscreen-modal");
    if (modal) modal.style.display = "none";

    if (triggerHistoryBack && window.location.hash.startsWith("#bang-ket-qua")) {
        window.history.back();
    }
}

function exportResultsToExcel() {
    if (!currentExamResultData.rawRows || currentExamResultData.rawRows.length === 0) {
        alert("⚠️ Chưa có dữ liệu để xuất file!");
        return;
    }

    const currentExamTitle = (currentExamResultData.item && currentExamResultData.item.title) ? currentExamResultData.item.title : "Đề thi";

    const excelData = [
        [
            "STT", "Số đề thi", "Số lần thi", "Thời gian vào thi", "Thời gian thi", 
            "Họ và tên", "Lớp", "SBD", "Tình trạng", "Số câu đúng", 
            "Điểm thang 10", "Số lần chuyển tab", "Thời gian chuyển tab", "Chi tiết bài làm"
        ]
    ];

    currentExamResultData.rawRows.forEach(r => {
        const attCount = r.allAttempts.length;
        const sub = attCount > 0 ? r.allAttempts[r.selectedAttemptIndex] : null;
        const acc = r.account;

        let stt = r.stt;
        let soLanThi = attCount > 0 ? `${attCount} lần (Đang xem lần ${r.selectedAttemptIndex + 1})` : "Chưa thi";
        let inTime = sub ? (sub.timestamp || "") : (r.isDoing ? "Đang thi" : "Chưa thi");
        let spent = sub ? (sub.completionTime || "") : "";
        let name = acc.name || "";
        let lop = acc.className || (sub ? (sub.studentClass || sub.className) : "") || "";
        let sbd = acc.sbd || "";
        let tinhTrang = sub ? "Đã nộp bài" : (r.isFreeDoing ? "Đang thi-tự do" : (r.isDoing ? "Đang làm bài" : "Chưa thi"));
        let correct = sub ? (sub.calcMetrics ? sub.calcMetrics.correctCount : (sub.correctCount !== undefined ? sub.correctCount : 0)) : "";
        let score = sub ? (sub.score10 !== undefined ? sub.score10 : (sub.calcMetrics ? sub.calcMetrics.score10Scale : "")) : "";
        
        let rawSubTab = sub ? (parseInt(sub.tabSwitchCount, 10) || 0) : 0;
        let dataStringTab = sub ? extractTabCountFromDataString(sub.dataString) : 0;
        let logTab = r.cheatLogsTabCount || 0;
        let finalTabCount = Math.max(rawSubTab, dataStringTab, logTab);

        let tabs = sub ? `${finalTabCount} lần` : (r.isDoing ? `${finalTabCount} lần` : "");
        let cheatTimes = r.cheatTimeString || "";
        let details = sub ? (sub.dataString || "") : "";

        excelData.push([
            stt, currentExamTitle, soLanThi, inTime, spent, name, lop, sbd, 
            tinhTrang, correct, score, tabs, cheatTimes, details
        ]);
    });

    if (typeof XLSX !== "undefined") {
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [
            { wch: 6 }, { wch: 28 }, { wch: 14 }, { wch: 22 }, { wch: 16 },
            { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 13 },
            { wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 55 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "KetQuaThi");

        let examTitle = (currentExamResultData.item && currentExamResultData.item.title) ? currentExamResultData.item.title : "KetQuaThi";
        let safeTitle = examTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
        XLSX.writeFile(wb, `${safeTitle}_${Date.now()}.xlsx`);
    } else {
        alert("❌ Không thể tải thư viện XLSX. Vui lòng kiểm tra kết nối mạng!");
    }
}

function startAutoRefreshResult() {
    stopAutoRefreshResult();
    if (!isAutoRefreshEnabled) return;

    autoRefreshTimer = setInterval(async () => {
        const modal = document.getElementById("result-fullscreen-modal");
        if (modal && modal.style.display === "flex" && currentExamResultData.item) {
            await fetchAndRenderExamResults(currentExamResultData.item, true);
        }
    }, 3500);
}

function stopAutoRefreshResult() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
    }
}

function toggleAutoRefresh(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    isAutoRefreshEnabled = !isAutoRefreshEnabled;
    const btn = document.getElementById("btn-toggle-autorefresh");
    if (isAutoRefreshEnabled) {
        if (btn) {
            btn.innerHTML = "🟢 Tự động: BẬT";
            btn.style.color = "#38bdf8";
            btn.style.borderColor = "#38bdf8";
        }
        startAutoRefreshResult();
    } else {
        if (btn) {
            btn.innerHTML = "⚪ Tự động: TẮT";
            btn.style.color = "#94a3b8";
            btn.style.borderColor = "#64748b";
        }
        stopAutoRefreshResult();
    }
}

// BẮT SỰ KIỆN NÚT LÙI LẠI TRÊN TRÌNH DUYỆT (BACK BUTTON / POPSTATE)
window.addEventListener("popstate", function(event) {
    const resModal = document.getElementById("result-fullscreen-modal");
    if (!resModal || resModal.style.display !== "flex") return;

    const hash = window.location.hash;
    if (hash === "#bang-ket-qua/thong-ke") {
        showDetailedStatsUI();
    } else if (hash === "#bang-ket-qua") {
        showMainResultTableUI();
    } else {
        closeResultModal(false);
    }
});