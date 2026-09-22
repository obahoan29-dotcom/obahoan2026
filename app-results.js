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

// Quản lý tự động cập nhật dữ liệu thời gian thực
let autoRefreshTimer = null;
let isAutoRefreshEnabled = true;

// Hàm sắp xếp chuỗi chi tiết bài làm theo thứ tự Câu 1, Câu 2,... đến hết
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
    currentExamResultData.item = examItem;
    currentExamResultData.categoryId = examItem.categoryId || currentExamResultData.categoryId || "them-11";

    const headTitle = document.getElementById("result-modal-heading");
    const headSub = document.getElementById("result-modal-subheading");
    const currentExamBtnText = document.getElementById("current-selected-exam-name");

    const displayCatName = getCategoryDisplayName(currentExamResultData.categoryId);

    if (headTitle) headTitle.innerText = `📊 Kết quả: ${examItem.title || "Bài thi"}`;
    if (headSub) headSub.innerText = `Chuyên mục: ${displayCatName} | Ngày cập nhật: ${examItem.date || "---"}`;
    if (currentExamBtnText) currentExamBtnText.innerText = `📑 ${examItem.title}`;

    renderExamPickerDropdown();
    await refreshCurrentExamResults();
}

async function openExamResultModal(item, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    currentExamResultData.item = item;
    currentExamResultData.categoryId = item.categoryId || "them-11";

    const searchInput = document.getElementById("result-search-input");
    if (searchInput) searchInput.value = "";

    const modal = document.getElementById("result-fullscreen-modal");
    const tbody = document.getElementById("result-table-tbody");
    const headTitle = document.getElementById("result-modal-heading");
    const headSub = document.getElementById("result-modal-subheading");
    const currentExamBtnText = document.getElementById("current-selected-exam-name");

    const displayCatName = getCategoryDisplayName(currentExamResultData.categoryId);

    modal.style.display = "flex";
    headTitle.innerText = `📊 Kết quả: ${item.title || "Bài thi"}`;
    headSub.innerText = `Chuyên mục: ${displayCatName} | Ngày cập nhật: ${item.date || "---"}`;
    if (currentExamBtnText) currentExamBtnText.innerText = `📑 ${item.title}`;
    tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:35px; font-weight:700; color:#64748b;">⏳ Đang kết nối Firebase và nạp dữ liệu ${displayCatName}...</td></tr>`;

    applyTableSettings();
    renderExamPickerDropdown();
    setTimeout(initTableResizable, 50);

    await fetchAndRenderExamResults(item, false);

    // Kích hoạt cập nhật tự động ngầm định kỳ
    startAutoRefreshResult();
}

async function refreshCurrentExamResults() {
    if (!currentExamResultData.item) return;
    const tbody = document.getElementById("result-table-tbody");
    tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:35px; font-weight:700; color:#64748b;">🔄 Đang làm mới dữ liệu...</td></tr>`;
    await fetchAndRenderExamResults(currentExamResultData.item, false);
    startAutoRefreshResult();
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

    // TỔNG HỢP TOÀN BỘ CÁC MÃ ĐỀ KHẢ DĨ (BAO GỒM CẢ DE150TOAN14, DE20TOAN10,...)
    let candidateCodes = new Set();
    
    let normCode = extractNormalizedExamCode(examTitle || item.title);
    if (normCode) candidateCodes.add(normCode);
    
    if (maDe) candidateCodes.add(cleanExamCodeKey(maDe));
    if (examTitle) candidateCodes.add(cleanExamCodeKey(examTitle));
    if (item.title) candidateCodes.add(cleanExamCodeKey(item.title));
    
    candidateCodes.add("DE150TOAN14");
    candidateCodes.add("DE20TOAN10");
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
                    for (let subId in sJson) submissionsMap[subId] = sJson[subId];
                }
            }

            if (cRes && cRes.ok) {
                let cJson = await cRes.json();
                if (cJson && typeof cJson === 'object') {
                    for (let cId in cJson) cheatingLogsData[cId] = cJson[cId];
                }
            }

            if (aRes && aRes.ok) {
                let aJson = await aRes.json();
                if (aJson && typeof aJson === 'object') {
                    for (let aId in aJson) activeSessionsData[aId] = aJson[aId];
                }
            }
        }
    } catch(e) { console.error("Lỗi khi nạp dữ liệu thi Firebase:", e); }

    const targetCatId = item.categoryId || currentExamResultData.categoryId || "them-11";
    renderExamResultTable(targetCatId, submissionsMap, cheatingLogsData, activeSessionsData);

    // Giữ nguyên bộ lọc nếu quản trị viên đang nhập tìm kiếm
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

function renderExamResultTable(categoryId, submissionsMap, cheatingMap, activeSessionsMap) {
    // 1. LẤY DANH SÁCH HỌC SINH TỪ FILE CHÍNH XÁC CỦA LỚP ĐÓ (VÍ DỤ TKTHEM11.JS)
    const classAccounts = getAccountsForCategory(categoryId);

    const cheatHistoryBySbd = {};
    for (let k in cheatingMap) {
        let log = cheatingMap[k];
        let sbdKey = String(log.sbd || log.studentId || "").trim().toLowerCase();
        let nameKey = normalizeName(log.studentName);
        let dur = log.durationStr || "";

        if (!dur || dur === "Bắt đầu") continue;
        let shortDur = dur.replace(/phút/g, 'p').replace(/giây/g, 's').replace(/\s+/g, '');
        
        if (sbdKey && sbdKey !== "chưa nhập" && sbdKey !== "chuanhap") {
            if (!cheatHistoryBySbd[sbdKey]) cheatHistoryBySbd[sbdKey] = [];
            cheatHistoryBySbd[sbdKey].push(shortDur);
        }
        if (nameKey && nameKey !== "chuanhap") {
            if (!cheatHistoryBySbd[nameKey]) cheatHistoryBySbd[nameKey] = [];
            cheatHistoryBySbd[nameKey].push(shortDur);
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

    const activeUsersSet = new Set();
    const nowMs = Date.now();
    for (let sId in activeSessionsMap) {
        let lastPing = activeSessionsMap[sId];
        if (typeof lastPing === 'number' && (nowMs - lastPing < 120000)) {
            activeUsersSet.add(String(sId).trim().toLowerCase());
        }
    }

    const finalRows = [];
    const usedSubmissionKeys = new Set();

    // Lưu lại lựa chọn lần thi học sinh đang xem để khi auto-refresh không bị nhảy về lần cuối
    const previousSelectionMap = {};
    if (currentExamResultData.rawRows && currentExamResultData.rawRows.length > 0) {
        currentExamResultData.rawRows.forEach(r => {
            let key = (r.account && r.account.sbd) ? String(r.account.sbd).toLowerCase() : normalizeName(r.account.name);
            if (key) previousSelectionMap[key] = r.selectedAttemptIndex;
        });
    }

    // DUYỆT TỪ DANH SÁCH HỌC SINH CỦA LỚP
    classAccounts.forEach((acc, idx) => {
        const accSbd = String(acc.sbd || "").trim();
        const accSbdLower = accSbd.toLowerCase();
        const accNameNorm = normalizeName(acc.name);
        const accUserNorm = normalizeName(acc.username);
        const accClassNorm = normalizeName(acc.className);

        let matchedSubs = [];
        for (let sub of submissionsList) {
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
        if (matchedSubs.length === 0 && (activeUsersSet.has(accSbdLower) || activeUsersSet.has(safeSbd))) {
            isDoing = true;
        }

        let cheatDurations = [];
        if (accSbdLower && cheatHistoryBySbd[accSbdLower]) cheatDurations = cheatHistoryBySbd[accSbdLower];
        else if (accNameNorm && cheatHistoryBySbd[accNameNorm]) cheatDurations = cheatHistoryBySbd[accNameNorm];
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
            cheatTimeString: cheatTimeString
        });
    });

    // DUYỆT CÁC BÀI THI CỦA THÍ SINH TỰ DO (NẾU CÓ)
    let freeCounter = classAccounts.length + 1;
    const freeGroups = {};

    for (let sub of submissionsList) {
        if (usedSubmissionKeys.has(sub._keyId)) continue;
        let subSbd = String(sub.sbd || sub.studentId || "free").trim().toLowerCase();
        let subName = normalizeName(sub.studentName) || "free_student";
        let groupKey = subSbd !== "---" && subSbd !== "chuanhap" ? subSbd : subName;

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
    }

    for (let gKey in freeGroups) {
        let group = freeGroups[gKey];
        let atts = group.attempts;
        let subSbd = String(group.account.sbd).trim().toLowerCase();
        let subNameNorm = normalizeName(group.account.name);

        let cheatDurations = [];
        if (subSbd && cheatHistoryBySbd[subSbd]) cheatDurations = cheatHistoryBySbd[subSbd];
        else if (subNameNorm && cheatHistoryBySbd[subNameNorm]) cheatDurations = cheatHistoryBySbd[subNameNorm];
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
            cheatTimeString: cheatTimeString
        });
    }

    currentExamResultData.rawRows = finalRows;
    updateStatsAndRenderTable(finalRows);
}

function updateStatsAndRenderTable(rows) {
    let total = rows.length;
    let submittedCount = rows.filter(r => r.allAttempts.length > 0).length;
    let doingCount = rows.filter(r => r.isDoing && r.allAttempts.length === 0).length;
    let unsubmittedCount = total - submittedCount - doingCount;
    let sumScore = 0;
    let scoredStudents = 0;

    rows.forEach(r => {
        if (r.allAttempts.length > 0) {
            let curSub = r.allAttempts[r.selectedAttemptIndex] || r.allAttempts[r.allAttempts.length - 1];
            if (curSub && curSub.score10 !== undefined) {
                sumScore += Number(curSub.score10) || 0;
                scoredStudents++;
            }
        }
    });
    let avg = scoredStudents > 0 ? (sumScore / scoredStudents).toFixed(1) : "0.0";

    document.getElementById("stat-total-students").innerText = total;
    document.getElementById("stat-submitted-students").innerText = submittedCount;
    document.getElementById("stat-doing-students").innerText = doingCount;
    document.getElementById("stat-unsubmitted-students").innerText = unsubmittedCount;
    document.getElementById("stat-avg-score").innerText = avg;

    renderFilteredResultTable(rows);
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

            let tabCount = parseInt(currentSub.tabSwitchCount) || 0;
            col9_tabs = tabCount > 0 ? `<span class="tabs-warn">${tabCount} lần</span>` : `<span class="tabs-ok">0 lần</span>`;
            
            col10_cheatTime = row.cheatTimeString;

            if (currentSub.dataString) {
                let safeText = (currentSub.dataString || "").replace(/"/g, '&quot;');
                col11_details = `<span class="td-details" title="${safeText}" onclick="alert('📋 CHI TIẾT BÀI LÀM:\\n\\n' + this.title.replace(/ \\| /g, '\\n'))">${currentSub.dataString}</span>`;
            }
        } else if (row.isDoing) {
            col2_inTime = `<span style="color:#eab308; font-weight:800;">Vừa vào thi</span>`;
            col3_spentTime = `<span style="color:#eab308; font-weight:800;">Đang làm...</span>`;
            col6_status = `<span class="status-pill status-doing">Đang làm bài</span>`;
        }

        let col4_name = acc.name || (currentSub ? currentSub.studentName : "---");
        let col_class = acc.className || (currentSub ? (currentSub.studentClass || currentSub.className) : "") || "---";
        let col5_sbd = acc.sbd || (currentSub ? (currentSub.sbd || currentSub.studentId) : "---");

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
            <td class="td-tab-times td-truncate" title="${col10_cheatTime}">${col10_cheatTime}</td>
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
        let statusText = r.allAttempts.length > 0 ? "đã nộp bài" : (r.isDoing ? "đang làm bài" : "chưa thi");
        return name.includes(query) || sbd.includes(query) || cName.includes(query) || statusText.includes(query);
    });

    renderFilteredResultTable(filtered);
}

function closeResultModal() {
    stopAutoRefreshResult(); // Dừng chạy ngầm ngay khi đóng bảng
    document.getElementById("result-fullscreen-modal").style.display = "none";
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
        let tinhTrang = sub ? "Đã nộp bài" : (r.isDoing ? "Đang làm bài" : "Chưa thi");
        let correct = sub ? (sub.calcMetrics ? sub.calcMetrics.correctCount : (sub.correctCount !== undefined ? sub.correctCount : 0)) : "";
        let score = sub ? (sub.score10 !== undefined ? sub.score10 : (sub.calcMetrics ? sub.calcMetrics.score10Scale : "")) : "";
        let tabs = sub ? (parseInt(sub.tabSwitchCount) || 0) : "";
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

// =========================================================
// HÀM ĐIỀU KHIỂN TỰ ĐỘNG CẬP NHẬT THỜI GIAN THỰC (REALTIME)
// =========================================================
function startAutoRefreshResult() {
    stopAutoRefreshResult();
    if (!isAutoRefreshEnabled) return;

    // Cứ 3.5 giây tự động cập nhật ngầm mà không làm giật giao diện
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
