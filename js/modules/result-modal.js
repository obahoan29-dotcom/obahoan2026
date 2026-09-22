/**
 * MODULE 7: ĐỘNG CƠ PHÂN TÍCH, SO KHỚP FIREBASE VÀ HIỂN THỊ KẾT QUẢ THI
 */
window.RESULT_MODAL = {
    cleanExamCodeKey(code) {
        return String(code || "").trim().replace(/\s+/g, '_').replace(/[.#$\[\]\/]/g, '_');
    },

    normalizeName(str) {
        if (!str) return "";
        return String(str).toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/[^a-z0-9]/g, "").trim();
    },

    stripHtml(html) {
        let tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    },

    async openExamResultModal(item, event) {
        if (event) { event.preventDefault(); event.stopPropagation(); }

        APP_STATE.currentExamResultData.item = item;
        APP_STATE.currentExamResultData.categoryId = item.categoryId || "them-10";

        const curCatId = APP_STATE.currentExamResultData.categoryId;
        const targetCategory = APP_STATE.DAY_THEM_CATEGORIES.find(c => c.id === curCatId) || 
                               APP_STATE.CHINH_KHOA_CATEGORIES.find(c => c.id === curCatId);
        const catName = targetCategory ? targetCategory.title : curCatId;

        const searchInput = document.getElementById("result-search-input");
        if (searchInput) searchInput.value = "";

        const modal = document.getElementById("result-fullscreen-modal");
        const tbody = document.getElementById("result-table-tbody");
        const headTitle = document.getElementById("result-modal-heading");
        const headSub = document.getElementById("result-modal-subheading");
        const currentExamBtnText = document.getElementById("current-selected-exam-name");

        modal.style.display = "flex";
        headTitle.innerText = `📊 Kết quả: ${item.title || "Bài thi"}`;
        headSub.innerText = `Chuyên mục: ${catName} | Ngày cập nhật: ${item.date || "---"}`;
        if (currentExamBtnText) currentExamBtnText.innerText = `📑 ${item.title}`;
        tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:35px; font-weight:700; color:#64748b;">⏳ Đang kết nối Firebase và nạp dữ liệu thí sinh...</td></tr>`;

        this.applyTableSettings();
        this.renderExamPickerDropdown();
        setTimeout(() => this.initTableResizable(), 50);

        await this.fetchAndRenderExamResults(item);
    },

    async refreshCurrentExamResults() {
        if (!APP_STATE.currentExamResultData.item) return;
        const tbody = document.getElementById("result-table-tbody");
        tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:35px; font-weight:700; color:#64748b;">🔄 Đang làm mới dữ liệu...</td></tr>`;
        await this.fetchAndRenderExamResults(APP_STATE.currentExamResultData.item);
    },

    async fetchAndRenderExamResults(item) {
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
                let qRes = await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/quizzes/${quizId}.json`);
                let qData = await qRes.json();
                if (qData) {
                    maDe = qData.maDe || "";
                    if (qData.title) examTitle = qData.title;
                }
            } catch(e) {}
        }

        let candidateCodes = new Set();
        if (maDe) candidateCodes.add(this.cleanExamCodeKey(maDe));
        if (examTitle) candidateCodes.add(this.cleanExamCodeKey(examTitle));
        if (item.title) candidateCodes.add(this.cleanExamCodeKey(item.title));
        candidateCodes.add("DE20TOAN10");
        candidateCodes.add("101");

        let submissionsMap = {};
        let cheatingLogsData = {};
        let activeSessionsData = {};

        try {
            for (let code of candidateCodes) {
                let sRes = await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/exams/${code}/submissions.json`);
                let sJson = await sRes.json();
                if (sJson && typeof sJson === 'object') {
                    for (let subId in sJson) submissionsMap[subId] = sJson[subId];
                }

                let cRes = await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/exams/${code}/cheating_logs.json`);
                let cJson = await cRes.json();
                if (cJson && typeof cJson === 'object') {
                    for (let cId in cJson) cheatingLogsData[cId] = cJson[cId];
                }

                let aRes = await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/active_sessions/${code}.json`);
                let aJson = await aRes.json();
                if (aJson && typeof aJson === 'object') {
                    for (let aId in aJson) activeSessionsData[aId] = aJson[aId];
                }
            }
        } catch(e) { console.error("Lỗi khi nạp dữ liệu Firebase:", e); }

        this.renderExamResultTable(item.categoryId, submissionsMap, cheatingLogsData, activeSessionsData);
    },

    renderExamResultTable(categoryId, submissionsMap, cheatingMap, activeSessionsMap) {
        const tbody = document.getElementById("result-table-tbody");
        tbody.innerHTML = "";

        // NẠP ĐÚNG DANH SÁCH TÀI KHOẢN CỦA LỚP ĐƯỢC CHỌN
        let classAccounts = [];
        if (window.STUDENT_ACCOUNTS && window.STUDENT_ACCOUNTS[categoryId] && window.STUDENT_ACCOUNTS[categoryId].length > 0) {
            classAccounts = window.STUDENT_ACCOUNTS[categoryId];
        }

        const cheatHistoryBySbd = {};
        for (let k in cheatingMap) {
            let log = cheatingMap[k];
            let sbdKey = String(log.sbd || log.studentId || "").trim().toLowerCase();
            let nameKey = this.normalizeName(log.studentName);
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
                submissionsList.push(sub);
            }
        }

        submissionsList.sort((a, b) => {
            let ta = Number(a.createdAt) || 0;
            let tb = Number(b.createdAt) || 0;
            return ta - tb;
        });

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

        // 1. Duyệt danh sách học sinh theo lớp
        classAccounts.forEach((acc, idx) => {
            const accSbd = String(acc.sbd || "").trim();
            const accSbdLower = accSbd.toLowerCase();
            const accNameNorm = this.normalizeName(acc.name);
            const accUserNorm = this.normalizeName(acc.username);
            const accClassNorm = this.normalizeName(acc.className);

            let matchedSubs = [];
            for (let sub of submissionsList) {
                let subSbd = String(sub.sbd || sub.studentId || "").trim().toLowerCase();
                let subNameNorm = this.normalizeName(sub.studentName);
                let subClassNorm = this.normalizeName(sub.studentClass || sub.className);

                let isMatch = false;
                if (accSbdLower && subSbd && subSbd === accSbdLower) isMatch = true;
                else if (subNameNorm && (subNameNorm === accNameNorm || subNameNorm === accUserNorm)) {
                    if (subClassNorm && accClassNorm && subClassNorm !== accClassNorm) isMatch = false;
                    else isMatch = true;
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

            finalRows.push({
                stt: acc.stt || (idx + 1),
                isClassStudent: true,
                account: acc,
                allAttempts: matchedSubs,
                selectedAttemptIndex: matchedSubs.length > 0 ? (matchedSubs.length - 1) : 0,
                isDoing: isDoing,
                cheatTimeString: cheatTimeString
            });
        });

        // 2. Duyệt thí sinh tự do
        let freeCounter = classAccounts.length + 1;
        const freeGroups = {};

        for (let sub of submissionsList) {
            if (usedSubmissionKeys.has(sub._keyId)) continue;
            let subSbd = String(sub.sbd || sub.studentId || "free").trim().toLowerCase();
            let subName = this.normalizeName(sub.studentName) || "free_student";
            let groupKey = subSbd !== "---" && subSbd !== "chuanhap" ? subSbd : subName;

            if (!freeGroups[groupKey]) {
                freeGroups[groupKey] = {
                    account: { sbd: sub.sbd || sub.studentId || "---", name: sub.studentName || "Thí sinh tự do", className: sub.studentClass || sub.className || "Tự do" },
                    attempts: []
                };
            }
            freeGroups[groupKey].attempts.push(sub);
        }

        for (let gKey in freeGroups) {
            let group = freeGroups[gKey];
            let atts = group.attempts;
            let subSbd = String(group.account.sbd).trim().toLowerCase();
            let subNameNorm = this.normalizeName(group.account.name);

            let cheatDurations = [];
            if (subSbd && cheatHistoryBySbd[subSbd]) cheatDurations = cheatHistoryBySbd[subSbd];
            else if (subNameNorm && cheatHistoryBySbd[subNameNorm]) cheatDurations = cheatHistoryBySbd[subNameNorm];
            let cheatTimeString = cheatDurations.length > 0 ? cheatDurations.join(" | ") : "0s";

            finalRows.push({
                stt: freeCounter++,
                isClassStudent: false,
                account: group.account,
                allAttempts: atts,
                selectedAttemptIndex: atts.length - 1,
                isDoing: false,
                cheatTimeString: cheatTimeString
            });
        }

        APP_STATE.currentExamResultData.rawRows = finalRows;
        this.updateStatsAndRenderTable(finalRows);
    },

    updateStatsAndRenderTable(rows) {
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

        this.renderFilteredResultTable(rows);
    },

    renderFilteredResultTable(rows) {
        const tbody = document.getElementById("result-table-tbody");
        tbody.innerHTML = "";

        if (!rows || rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:30px; font-weight:700; color:#64748b;">Không tìm thấy dữ liệu học sinh nào!</td></tr>`;
            return;
        }

        const currentExamTitle = (APP_STATE.currentExamResultData.item && APP_STATE.currentExamResultData.item.title) ? APP_STATE.currentExamResultData.item.title : "Đề thi";

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
                        <div class="attempt-menu-item ${isSel ? 'selected' : ''}" onclick="RESULT_MODAL.selectStudentAttempt(${rowIdx}, ${aIdx}, event)">
                            <span>${isSel ? '✓ ' : ''}<b>Lần ${aIdx + 1}</b> (${tm})</span>
                            <span style="color:#0284c7; font-weight:800;">${sc}đ</span>
                        </div>
                    `;
                });

                col_attemptCount = `
                    <div class="td-attempt-cell">
                        <button type="button" class="btn-attempt-trigger" id="attempt-btn-${rowIdx}" onclick="RESULT_MODAL.toggleAttemptMenu(${rowIdx}, event)">
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
                <td class="td-truncate" title="${this.stripHtml(col2_inTime)}">${col2_inTime}</td>
                <td class="td-truncate" title="${this.stripHtml(col3_spentTime)}">${col3_spentTime}</td>
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
    },

    selectStudentAttempt(rowIndex, attemptIdx, event) {
        if (event) { event.stopPropagation(); event.preventDefault(); }
        if (APP_STATE.currentExamResultData.rawRows[rowIndex]) {
            APP_STATE.currentExamResultData.rawRows[rowIndex].selectedAttemptIndex = attemptIdx;
            this.filterResultTable();
        }
    },

    toggleAttemptMenu(rowIndex, event) {
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
    },

    filterResultTable() {
        const query = (document.getElementById("result-search-input").value || "").trim().toLowerCase();
        if (!query) {
            this.renderFilteredResultTable(APP_STATE.currentExamResultData.rawRows);
            return;
        }

        const filtered = APP_STATE.currentExamResultData.rawRows.filter(r => {
            let name = (r.account.name || "").toLowerCase();
            let sbd = String(r.account.sbd || "").toLowerCase();
            let cName = String(r.account.className || "").toLowerCase();
            let statusText = r.allAttempts.length > 0 ? "đã nộp bài" : (r.isDoing ? "đang làm bài" : "chưa thi");
            return name.includes(query) || sbd.includes(query) || cName.includes(query) || statusText.includes(query);
        });

        this.renderFilteredResultTable(filtered);
    },

    renderExamPickerDropdown() {
        const menu = document.getElementById("exam-picker-dropdown-list");
        if (!menu) return;
        menu.innerHTML = "";

        const curCatId = APP_STATE.currentExamResultData.categoryId || "them-10";
        const targetCategory = APP_STATE.DAY_THEM_CATEGORIES.find(c => c.id === curCatId) || 
                               APP_STATE.CHINH_KHOA_CATEGORIES.find(c => c.id === curCatId);
        const examList = targetCategory ? targetCategory.links.filter(l => !l.isDoc) : [];
        const catTitle = targetCategory ? targetCategory.title : curCatId;

        if (examList.length === 0) {
            menu.innerHTML = `<div style="padding:8px; color:#64748b; font-size:12px; font-style:italic;">Chưa có đề thi nào trong ${catTitle}</div>`;
            return;
        }

        examList.forEach((exam, idx) => {
            const itemEl = document.createElement("div");
            itemEl.className = "exam-picker-item";
            const isCur = APP_STATE.currentExamResultData.item && (APP_STATE.currentExamResultData.item.firebaseId === exam.firebaseId || APP_STATE.currentExamResultData.item.title === exam.title);
            if (isCur) itemEl.classList.add("selected");

            itemEl.innerHTML = `<span>${idx + 1}.</span> <span style="flex:1;">${exam.title}</span>`;
            itemEl.onclick = async (e) => {
                e.stopPropagation();
                menu.classList.remove("show");
                await this.switchExamResult(exam);
            };
            menu.appendChild(itemEl);
        });
    },

    async switchExamResult(examItem) {
        APP_STATE.currentExamResultData.item = examItem;
        if (examItem.categoryId) APP_STATE.currentExamResultData.categoryId = examItem.categoryId;

        const curCatId = APP_STATE.currentExamResultData.categoryId;
        const targetCategory = APP_STATE.DAY_THEM_CATEGORIES.find(c => c.id === curCatId) || 
                               APP_STATE.CHINH_KHOA_CATEGORIES.find(c => c.id === curCatId);
        const catName = targetCategory ? targetCategory.title : curCatId;

        document.getElementById("result-modal-heading").innerText = `📊 Kết quả: ${examItem.title || "Bài thi"}`;
        document.getElementById("result-modal-subheading").innerText = `Chuyên mục: ${catName} | Ngày cập nhật: ${examItem.date || "---"}`;
        document.getElementById("current-selected-exam-name").innerText = `📑 ${examItem.title}`;

        this.renderExamPickerDropdown();
        await this.refreshCurrentExamResults();
    },

    applyTableSettings() {
        const table = document.getElementById("admin-result-table");
        if (table) {
            table.style.setProperty("--table-font-size", APP_STATE.tableDisplaySettings.fontSize + "px");
            table.style.setProperty("--table-row-padding-y", APP_STATE.tableDisplaySettings.rowPadding + "px");
        }
    },

    initTableResizable() {
        const table = document.getElementById("admin-result-table");
        if (!table) return;
        const headers = table.querySelectorAll("thead th");
        
        headers.forEach(th => {
            const oldResizer = th.querySelector(".resizer");
            if (oldResizer) oldResizer.remove();

            const resizer = document.createElement("div");
            resizer.className = "resizer";
            th.appendChild(resizer);

            let startX = 0; let startWidth = 0;
            resizer.addEventListener("mousedown", function(e) {
                e.preventDefault(); e.stopPropagation();
                startX = e.pageX; startWidth = th.offsetWidth;
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
};

function filterResultTable() { RESULT_MODAL.filterResultTable(); }
function refreshCurrentExamResults() { RESULT_MODAL.refreshCurrentExamResults(); }
function closeResultModal() { document.getElementById("result-fullscreen-modal").style.display = "none"; }
function toggleExamPickerMenu(e) { 
    if(e) { e.preventDefault(); e.stopPropagation(); }
    document.getElementById("exam-picker-dropdown-list").classList.toggle("show");
}
```