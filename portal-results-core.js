// =========================================================
// FILE: portal-results-core.js
// QUẢN LÝ DỮ LIỆU KẾT QUẢ THI, CACHE VÀ NẠP TỪ FIREBASE
// =========================================================

let currentExamResultData = {
    item: null, title: "", examCode: "", categoryId: "them-11", rawRows: []
};

let autoRefreshTimer = null;
let isAutoRefreshEnabled = false;
let scoreChartInstance = null;
const _examResultsCache = {};
let _regradeFileParsedAnswers = null;
let currentRankSortMode = 'default';

function normalizeCategoryKey(cat) {
    if (!cat) return "";
    return String(cat).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isStrictSameCategory(catA, catB) {
    if (!catA || !catB) return false;
    return normalizeCategoryKey(catA) === normalizeCategoryKey(catB);
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

    let quizId = extractQuizIdFromItem(item) || "";
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
    } catch(e) { console.error("Lỗi nạp dữ liệu Firebase:", e); }

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

// BỘ XỬ LÝ GHÉP NỐI TOÀN BỘ KẾT QUẢ THI TỪ FIREBASE VÀO TÀI KHOẢN LỚP
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

        let isDoing = false; let doingStartTime = null;
        let safeSbd = accSbdLower.replace(/[^a-zA-Z0-9]/g, '_');
        let activeSess = activeUsersMap[accSbdLower] || activeUsersMap[safeSbd] || activeUsersMap[accNameNorm] || activeUsersMap[accUserNorm];
        
        if (matchedSubs.length === 0 && activeSess) {
            isDoing = true; doingStartTime = activeSess.startTime || activeSess.loginTime || activeSess.lastPing || Date.now();
        }

        let cheatDurations = (accSbdLower && cheatHistoryBySbd[accSbdLower]) ? cheatHistoryBySbd[accSbdLower] : ((accNameNorm && cheatHistoryBySbd[accNameNorm]) ? cheatHistoryBySbd[accNameNorm] : []);
        let cheatLogsTabCount = (accSbdLower && maxCheatCountBySbd[accSbdLower]) ? maxCheatCountBySbd[accSbdLower] : ((accNameNorm && maxCheatCountBySbd[accNameNorm]) ? maxCheatCountBySbd[accNameNorm] : cheatDurations.length);

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
            isFreeDoing: false, cheatTimeString: cheatTimeString, cheatLogsTabCount: cheatLogsTabCount
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

        let cheatDurations = (subSbd && cheatHistoryBySbd[subSbd]) ? cheatHistoryBySbd[subSbd] : ((subNameNorm && cheatHistoryBySbd[subNameNorm]) ? cheatHistoryBySbd[subNameNorm] : []);
        let cheatLogsTabCount = (subSbd && maxCheatCountBySbd[subSbd]) ? maxCheatCountBySbd[subSbd] : ((subNameNorm && maxCheatCountBySbd[subNameNorm]) ? maxCheatCountBySbd[subNameNorm] : cheatDurations.length);

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
            isFreeDoing: false, cheatTimeString: cheatTimeString, cheatLogsTabCount: cheatLogsTabCount
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
            isFreeDoing: true, cheatTimeString: cheatTimeString, cheatLogsTabCount: logTab
        });
    }

    if (typeof calculateRanksForRows === 'function') calculateRanksForRows(finalRows);
    currentExamResultData.rawRows = finalRows;
    if (typeof updateStatsAndRenderTable === 'function') updateStatsAndRenderTable(finalRows);
}