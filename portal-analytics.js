// =========================================================
// FILE: portal-analytics.js
// QUẢN LÝ VÀ THỐNG KÊ LƯỢT TRUY CẬP WEBSITE REALTIME
// =========================================================

let siteVisitStatsCache = {
    todayCount: 0, yesterdayCount: 0, weekCount: 0, totalCount: 0,
    hourlyCounts: Array(24).fill(0), dailyCounts: []
};

function getVNDateKey(d = new Date()) {
    const tzOffset = 7 * 60; 
    const localTime = d.getTime(); 
    const localOffset = d.getTimezoneOffset() * 60000;
    const vnTime = new Date(localTime + localOffset + (tzOffset * 60000));
    const pad = n => String(n).padStart(2, '0');
    return `${vnTime.getFullYear()}-${pad(vnTime.getMonth() + 1)}-${pad(vnTime.getDate())}`;
}

function getVNHour(d = new Date()) {
    const tzOffset = 7 * 60; 
    const localTime = d.getTime(); 
    const localOffset = d.getTimezoneOffset() * 60000;
    const vnTime = new Date(localTime + localOffset + (tzOffset * 60000));
    return vnTime.getHours();
}

function formatVNDateDisplay(dateStr) {
    if (!dateStr) return ""; 
    let parts = String(dateStr).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`; 
    return dateStr;
}

function getDayOfWeekVN(dateStr) {
    if (!dateStr) return "Ngày"; 
    const d = new Date(dateStr + "T00:00:00+07:00"); 
    const day = d.getDay();
    const names = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    return names[day] || "Ngày";
}

async function initSiteVisitTracker() {
    const todayKey = getVNDateKey(); 
    const currentHour = getVNHour();
    const sessionKey = `site_visit_logged_${todayKey}`;
    const isLoggedThisSession = safeSession.getItem(sessionKey);
    
    if (!isLoggedThisSession) { 
        safeSession.setItem(sessionKey, "true"); 
        await recordSiteVisit(todayKey, currentHour); 
    }
    await fetchAndRenderVisitStats(true);
}

// Ghi nhận lượt truy cập bằng cơ chế tăng nguyên tử Server Value Increment của Firebase
async function recordSiteVisit(todayKey, hour) {
    try {
        const hourStr = String(hour).padStart(2, '0');
        const incrementPayload = { ".sv": { "increment": 1 } };

        await Promise.all([
            // Tăng tổng lượt truy cập hôm nay
            fetch(`${FIREBASE_DB_URL}/site_visits/days/${todayKey}/total.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(incrementPayload)
            }).catch(() => null),

            // Tăng lượt truy cập theo khung giờ của hôm nay
            fetch(`${FIREBASE_DB_URL}/site_visits/days/${todayKey}/hours/${hourStr}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(incrementPayload)
            }).catch(() => null),

            // Tăng tổng truy cập toàn thời gian (Server-side increment, chống đua lệnh và không thể bị tụt)
            fetch(`${FIREBASE_DB_URL}/site_visits/summary/allTimeTotal.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(incrementPayload)
            }).catch(() => null),

            // Cập nhật thời điểm mới nhất
            fetch(`${FIREBASE_DB_URL}/site_visits/summary/lastUpdated.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ".sv": "timestamp" })
            }).catch(() => null)
        ]);
    } catch(e) { 
        console.warn("Lỗi ghi nhận lượt truy cập:", e); 
    }
}

async function fetchAndRenderVisitStats(isSilent = false) {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/site_visits.json`);
        const data = (res && res.ok) ? await res.json() : null;
        const todayKey = getVNDateKey(); 
        const yesterdayObj = new Date(Date.now() - 24 * 3600 * 1000); 
        const yesterdayKey = getVNDateKey(yesterdayObj);
        
        let todayCount = 0; 
        let yesterdayCount = 0; 
        let weekCount = 0; 
        let sumOfAllDays = 0;
        let allTimeTotal = 0;
        let hourlyCounts = Array(24).fill(0); 
        let dailyCounts = [];

        if (data && typeof data === 'object') {
            const daysObj = data.days || {};

            // 1. Tính tổng lượt truy cập của TẤT CẢ các ngày từng được ghi lại trong cơ sở dữ liệu
            Object.keys(daysObj).forEach(dKey => {
                const dayItem = daysObj[dKey];
                if (dayItem && typeof dayItem === 'object') {
                    const dayTotal = parseInt(dayItem.total, 10) || 0;
                    sumOfAllDays += dayTotal;
                }
            });

            // 2. Lấy dữ liệu ngày hôm nay
            if (daysObj[todayKey]) {
                todayCount = parseInt(daysObj[todayKey].total, 10) || 0;
                if (daysObj[todayKey].hours) { 
                    for (let h = 0; h < 24; h++) { 
                        const hStr = String(h).padStart(2, '0'); 
                        hourlyCounts[h] = parseInt(daysObj[todayKey].hours[hStr], 10) || 0; 
                    } 
                }
            }

            // 3. Lấy dữ liệu ngày hôm qua
            if (daysObj[yesterdayKey]) { 
                yesterdayCount = parseInt(daysObj[yesterdayKey].total, 10) || 0; 
            }

            // 4. Lấy dữ liệu 7 ngày qua
            for (let i = 6; i >= 0; i--) {
                const targetD = new Date(Date.now() - i * 24 * 3600 * 1000); 
                const dKey = getVNDateKey(targetD);
                const count = daysObj[dKey] ? (parseInt(daysObj[dKey].total, 10) || 0) : 0;
                weekCount += count;
                dailyCounts.push({ 
                    dateKey: dKey, 
                    isToday: (i === 0), 
                    dayLabel: (i === 0) ? "Hôm nay" : getDayOfWeekVN(dKey), 
                    dateDisplay: formatVNDateDisplay(dKey), 
                    count: count 
                });
            }

            // 5. Tính Tổng truy cập chính xác tuyệt đối: Phải là số lớn nhất và luôn tăng dần
            const serverAllTime = (data.summary && data.summary.allTimeTotal) ? (parseInt(data.summary.allTimeTotal, 10) || 0) : 0;
            const cachedMax = parseInt(safeLocal.getItem("site_visits_max_alltime"), 10) || 0;

            allTimeTotal = Math.max(serverAllTime, sumOfAllDays, weekCount, cachedMax);

            // Tự động khôi phục dữ liệu lên Firebase nếu trước đó từng bị lỗi tụt số
            if (allTimeTotal > serverAllTime) {
                fetch(`${FIREBASE_DB_URL}/site_visits/summary/allTimeTotal.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(allTimeTotal)
                }).catch(() => null);
            }
        } else {
            // Khi không kết nối được Firebase, dùng giá trị cao nhất từng lưu ở client
            allTimeTotal = parseInt(safeLocal.getItem("site_visits_max_alltime"), 10) || 0;
        }

        // Lưu mốc cao nhất để ngăn ngừa việc bị giảm số trong bất kỳ hoàn cảnh nào
        if (allTimeTotal > 0) {
            safeLocal.setItem("site_visits_max_alltime", String(allTimeTotal));
        }

        siteVisitStatsCache = { 
            todayCount, 
            yesterdayCount, 
            weekCount, 
            totalCount: allTimeTotal, 
            hourlyCounts, 
            dailyCounts 
        };

        const badgeNumber = document.getElementById("visit-today-count"); 
        if (badgeNumber) badgeNumber.innerText = todayCount.toLocaleString("vi-VN");

        const kpiToday = document.getElementById("kpi-visit-today"); 
        const kpiYest = document.getElementById("kpi-visit-yesterday"); 
        const kpiWeek = document.getElementById("kpi-visit-7days"); 
        const kpiTotal = document.getElementById("kpi-visit-alltime");

        if (kpiToday) kpiToday.innerText = todayCount.toLocaleString("vi-VN");
        if (kpiYest) kpiYest.innerText = yesterdayCount.toLocaleString("vi-VN");
        if (kpiWeek) kpiWeek.innerText = weekCount.toLocaleString("vi-VN");
        if (kpiTotal) kpiTotal.innerText = allTimeTotal.toLocaleString("vi-VN");

        const currentHour = getVNHour(); 
        const curBadge = document.getElementById("current-hour-badge");
        if (curBadge) curBadge.innerText = `Hiện tại: ${currentHour}:00 - ${currentHour}:59`;
        
        renderHourlyBars(hourlyCounts, currentHour); 
        renderWeeklyBars(dailyCounts);
    } catch(e) { 
        if (!isSilent) console.warn("Lỗi nạp thống kê lượt truy cập:", e); 
    }
}

function renderHourlyBars(hourlyCounts, currentHour) {
    const container = document.getElementById("hourly-bars-container"); 
    if (!container) return; 
    container.innerHTML = "";
    
    const maxVal = Math.max(1, ...hourlyCounts);
    hourlyCounts.forEach((cnt, hour) => {
        const isCur = (hour === currentHour); 
        const percent = Math.max(4, Math.round((cnt / maxVal) * 100));
        const col = document.createElement("div"); 
        col.className = `hourly-bar-col ${isCur ? 'is-current' : ''}`; 
        col.title = `Khung giờ ${hour}:00 - ${hour}:59: ${cnt} lượt truy cập`;
        col.innerHTML = `
            <div class="hourly-bar-val">${cnt > 0 ? cnt : ''}</div>
            <div class="hourly-bar-track">
                <div class="hourly-bar-fill" style="height: ${percent}%;"></div>
            </div>
            <div class="hourly-bar-hour">${hour}h</div>
        `;
        container.appendChild(col);
    });
    
    setTimeout(() => { 
        const curEl = container.querySelector(".hourly-bar-col.is-current"); 
        if (curEl) curEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); 
    }, 150);
}

function renderWeeklyBars(dailyList) {
    const container = document.getElementById("weekly-bars-container"); 
    if (!container) return; 
    container.innerHTML = "";
    
    const maxVal = Math.max(1, ...dailyList.map(d => d.count));
    dailyList.forEach(item => {
        const percent = Math.max(3, Math.round((item.count / maxVal) * 100));
        const row = document.createElement("div"); 
        row.className = `weekly-row-item ${item.isToday ? 'is-today' : ''}`;
        row.innerHTML = `
            <div class="weekly-row-day ${item.isToday ? 'is-today' : ''}">
                ${item.dayLabel} <span style="font-size:10.5px; opacity:0.8;">(${item.dateDisplay})</span>
            </div>
            <div class="weekly-row-bar-wrap">
                <div class="weekly-row-bar-fill" style="width: ${percent}%;"></div>
            </div>
            <div class="weekly-row-count">${item.count} lượt</div>
        `;
        container.appendChild(row);
    });
}

function toggleVisitStatsModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const modal = document.getElementById("visit-stats-modal"); 
    if (!modal) return;
    
    if (modal.style.display === "flex") { 
        modal.style.display = "none"; 
    } else { 
        modal.style.display = "flex"; 
        fetchAndRenderVisitStats(false); 
    }
}

function closeVisitStatsModal(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById("visit-stats-modal"); 
    if (modal) modal.style.display = "none";
}

function switchVisitStatsTab(tabName) {
    const btnHours = document.getElementById("tab-btn-hours"); 
    const btnWeek = document.getElementById("tab-btn-week");
    const viewHours = document.getElementById("visit-tab-content-hours"); 
    const viewWeek = document.getElementById("visit-tab-content-week");
    
    if (tabName === 'hours') {
        if (btnHours) btnHours.classList.add("active"); 
        if (btnWeek) btnWeek.classList.remove("active");
        if (viewHours) viewHours.style.display = "block"; 
        if (viewWeek) viewWeek.style.display = "none";
    } else {
        if (btnHours) btnHours.classList.remove("active"); 
        if (btnWeek) btnWeek.classList.add("active");
        if (viewHours) viewHours.style.display = "none"; 
        if (viewWeek) viewWeek.style.display = "block";
    }
}

async function refreshVisitStatsData() {
    const btn = document.querySelector(".btn-refresh-visits");
    if (btn) { btn.innerText = "⏳ Đang tải..."; btn.disabled = true; }
    await fetchAndRenderVisitStats(false);
    if (btn) { btn.innerText = "🔄 Cập nhật"; btn.disabled = false; }
}
