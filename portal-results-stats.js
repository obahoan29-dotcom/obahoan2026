// =========================================================
// FILE: portal-results-stats.js
// THỐNG KÊ KPI, VẼ BIỂU ĐỒ PHỔ ĐIỂM CHART.JS & XUẤT EXCEL
// =========================================================

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