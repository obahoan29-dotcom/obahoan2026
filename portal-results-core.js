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