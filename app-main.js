// =========================================================
// FILE: app-main.js
// GIAO DIỆN CHÍNH, ĐIỀU HƯỚNG DANH MỤC, BADGES & LOGIN HỌC SINH
// =========================================================

function refreshAllViews() {
    renderReminderSection();
    renderDayThemNavBar();
    renderChinhKhoaNavBar();
    renderKhoTaiLieu();
}

async function loadDynamicLinksFromFirebase() {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/custom_links.json`);
        const data = await res.json();
        if (!data) return;

        for (const categoryId in data) {
            const linksObj = data[categoryId];
            let targetCategory = DAY_THEM_CATEGORIES.find(c => c.id === categoryId) || 
                                 CHINH_KHOA_CATEGORIES.find(c => c.id === categoryId) ||
                                 (KHO_TAI_LIEU_FOLDER.id === categoryId ? KHO_TAI_LIEU_FOLDER : null) ||
                                 (REMINDER_CATEGORY.id === categoryId ? REMINDER_CATEGORY : null);
            
            if (targetCategory) {
                let items = [];
                for (const linkId in linksObj) {
                    let item = linksObj[linkId];
                    item.firebaseId = linkId;
                    item.categoryId = categoryId;
                    if (!item.timestamp) item.timestamp = parseDateString(item.date); 
                    items.push(item);
                }
                
                targetCategory.links.forEach(link => {
                    if (!link.timestamp) link.timestamp = parseDateString(link.date);
                    link.categoryId = categoryId;
                    if (!link.firebaseId) link.firebaseId = link.id;
                });

                let existingIds = new Set(items.map(i => i.firebaseId));
                let uniqueStatic = targetCategory.links.filter(l => !existingIds.has(l.firebaseId));
                let allLinks = items.concat(uniqueStatic);

                allLinks.sort((a, b) => {
                    if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
                    return (a.title || "").localeCompare(b.title || "");
                });
                
                targetCategory.links = allLinks;
            }
        }
    } catch (e) { console.error("Lỗi tải link Firebase:", e); }
}

function updateFreeStudentTabUI(allowFree) {
    const tabFree = document.getElementById("tab-st-free");
    const errBox = document.getElementById("st-login-error");
    if (!tabFree) return;

    if (!allowFree) {
        tabFree.classList.add("disabled");
        tabFree.style.opacity = "0.45";
        tabFree.style.cursor = "not-allowed";
        tabFree.innerHTML = "🚫 Tự do: ĐÃ KHÓA";
        tabFree.title = "Giáo viên đã TẮT quyền thi tự do cho đề thi này";

        if (activeStudentLogin.currentMode === 'free') {
            switchStudentLoginMode('class');
            if (errBox) {
                errBox.innerText = "⛔ Giáo viên đã TẮT chế độ thi tự do cho đề thi này! Vui lòng dùng tài khoản học sinh theo lớp.";
                errBox.style.display = "block";
            }
        }
    } else {
        tabFree.classList.remove("disabled");
        tabFree.style.opacity = "1";
        tabFree.style.cursor = "pointer";
        tabFree.innerHTML = "🎯 Thí sinh tự do";
        tabFree.title = "Dành cho thí sinh tự do vào thi";
    }
}

function switchStudentLoginMode(mode) {
    const errBox = document.getElementById("st-login-error");
    if (errBox) { errBox.style.display = "none"; errBox.innerText = ""; }

    if (mode === 'free' && activeStudentLogin.allowFree === false) {
        if (errBox) {
            errBox.innerText = "⛔ Giáo viên đã TẮT chế độ thi tự do cho đề thi này! Chỉ học sinh trong danh sách lớp mới được phép thi.";
            errBox.style.display = "block";
        }
        return;
    }

    activeStudentLogin.currentMode = mode;
    const tabClass = document.getElementById("tab-st-class");
    const tabFree = document.getElementById("tab-st-free");
    const boxClass = document.getElementById("st-login-mode-class");
    const boxFree = document.getElementById("st-login-mode-free");
    const iconEl = document.getElementById("st-modal-icon");

    if (mode === 'free') {
        tabClass.classList.remove("active");
        tabFree.classList.add("active");
        boxClass.style.display = "none";
        boxFree.style.display = "block";
        iconEl.innerText = "🎯";
        document.getElementById("st-modal-main-title").innerText = `Thí Sinh Tự Do Vào Thi - ${getCategoryDisplayName(activeStudentLogin.categoryId)}`;
        setTimeout(() => { document.getElementById("st-free-name-input").focus(); }, 100);
    } else {
        tabFree.classList.remove("active");
        tabClass.classList.add("active");
        boxFree.style.display = "none";
        boxClass.style.display = "block";
        iconEl.innerText = "🔐";
        
        const cTitle = getCategoryDisplayName(activeStudentLogin.categoryId);
        document.getElementById("st-modal-main-title").innerText = `Đăng Nhập Làm Bài - ${cTitle}`;
        setTimeout(() => { document.getElementById("st-username-input").focus(); }, 100);
    }
}

async function openStudentLoginModal(targetUrl, examTitle, categoryId, item = null) {
    let allowFree = true;
    let quizId = extractQuizIdFromItem(item);
    if (!quizId) {
        try {
            let u = new URL(targetUrl, window.location.href);
            quizId = u.searchParams.get("id");
        } catch(e) {}
    }

    const itemId = item ? (item.firebaseId || item.id) : null;
    const localValItem = itemId ? localStorage.getItem(`exam_allow_free_${itemId}`) : null;
    const localValQuiz = quizId ? localStorage.getItem(`exam_allow_free_${quizId}`) : null;

    if (localValQuiz !== null) {
        allowFree = (localValQuiz === 'true');
    } else if (localValItem !== null) {
        allowFree = (localValItem === 'true');
    } else if (item && item.allowFree !== undefined) {
        allowFree = (item.allowFree !== false);
    }

    activeStudentLogin = { 
        targetUrl: targetUrl, 
        examTitle: examTitle, 
        categoryId: categoryId || "them-11", 
        currentMode: "class",
        allowFree: allowFree,
        item: item
    };
    
    document.getElementById("st-modal-exam-name").innerText = examTitle || "Bài kiểm tra trực tuyến";
    document.getElementById("st-username-input").value = "";
    document.getElementById("st-password-input").value = "";
    document.getElementById("st-free-name-input").value = "";
    document.getElementById("st-free-class-input").value = "";
    document.getElementById("st-free-sbd-input").value = "";
    
    const timeBox = document.getElementById("st-modal-time-box");
    
    const defaultMins = (item && item.timeLimitMinutes) ? item.timeLimitMinutes : 120;
    const itemStart = item ? item.examStartTimeStr : null;
    const itemEnd = item ? item.examEndTimeStr : null;
    const itemDate = item ? item.date : "";

    if (timeBox) {
        timeBox.innerHTML = buildTimeBoxHtml(defaultMins, itemStart, itemEnd, itemDate);
    }

    const errBox = document.getElementById("st-login-error");
    errBox.style.display = "none";
    errBox.innerText = "";

    updateFreeStudentTabUI(allowFree);
    switchStudentLoginMode('class');
    document.getElementById("student-login-modal").style.display = "flex";

    if (quizId) {
        try {
            const res = await fetch(`${FIREBASE_DB_URL}/quizzes/${quizId}.json`);
            const qData = await res.json();
            if (qData) {
                if (qData.allowFree !== undefined) {
                    activeStudentLogin.allowFree = (qData.allowFree !== false);
                    allowFree = activeStudentLogin.allowFree;
                    try {
                        localStorage.setItem(`exam_allow_free_${quizId}`, String(allowFree));
                        if (itemId) localStorage.setItem(`exam_allow_free_${itemId}`, String(allowFree));
                    } catch(e) {}
                    updateFreeStudentTabUI(allowFree);
                }

                if (timeBox) {
                    const finalMins = qData.timeLimitMinutes || defaultMins;
                    const finalStart = qData.examStartTimeStr || itemStart;
                    const finalEnd = qData.examEndTimeStr || itemEnd;
                    timeBox.innerHTML = buildTimeBoxHtml(finalMins, finalStart, finalEnd, itemDate);
                }
            }
        } catch(e) {}
    }
}

function closeStudentLoginModal() {
    document.getElementById("student-login-modal").style.display = "none";
}

function toggleStudentPassVisibility() {
    const input = document.getElementById("st-password-input");
    const btn = document.getElementById("st-eye-btn");
    if (input.type === "password") {
        input.type = "text";
        btn.innerText = "🙈";
    } else {
        input.type = "password";
        btn.innerText = "👁️";
    }
}

async function submitStudentLogin() {
    const errBox = document.getElementById("st-login-error");
    const btn = document.getElementById("st-submit-btn");
    const currentTargetCat = activeStudentLogin.categoryId;

    let quizId = extractQuizIdFromItem(activeStudentLogin.item);
    if (!quizId) {
        try {
            let u = new URL(activeStudentLogin.targetUrl, window.location.href);
            quizId = u.searchParams.get("id");
        } catch(e) {}
    }
    quizId = quizId || "101";

    let studentDataToVerify = null;

    if (activeStudentLogin.currentMode === 'free') {
        if (activeStudentLogin.allowFree === false) {
            errBox.innerText = "⛔ Giáo viên đã TẮT chế độ thi tự do cho đề thi này! Vui lòng chọn đăng nhập theo lớp.";
            errBox.style.display = "block";
            return;
        }

        const freeName = document.getElementById("st-free-name-input").value.trim();
        const freeClass = document.getElementById("st-free-class-input").value.trim();
        const freeSbd = document.getElementById("st-free-sbd-input").value.trim();

        if (!freeName || !freeClass || !freeSbd) {
            errBox.innerText = "⚠️ Vui lòng nhập đầy đủ Họ tên, Lớp và Số báo danh!";
            errBox.style.display = "block";
            return;
        }

        studentDataToVerify = {
            sbd: freeSbd, 
            name: freeName, 
            className: freeClass,
            username: "free_" + freeSbd, 
            isFreeStudent: true,
            categoryId: currentTargetCat
        };
    } else {
        const uVal = document.getElementById("st-username-input").value.trim();
        const pVal = document.getElementById("st-password-input").value.trim();

        if (!uVal || !pVal) {
            errBox.innerText = "⚠️ Vui lòng nhập đầy đủ Tên đăng nhập (hoặc SBD) và Mật khẩu!";
            errBox.style.display = "block";
            return;
        }

        const catId = activeStudentLogin.categoryId;
        const accounts = getAccountsForCategory(catId);

        if (!accounts || accounts.length === 0) {
            errBox.innerText = `⚠️ Không tìm thấy cơ sở dữ liệu của lớp "${getCategoryDisplayName(catId)}"!`;
            errBox.style.display = "block";
            return;
        }

        const matched = accounts.find(acc => 
            ((acc.username && acc.username.trim().toLowerCase() === uVal.toLowerCase()) ||
             (acc.sbd && String(acc.sbd).trim().toLowerCase() === uVal.toLowerCase()) ||
             (acc.name && acc.name.trim().toLowerCase() === uVal.toLowerCase())) &&
            (String(acc.pass).trim() === pVal)
        );

        if (!matched) {
            errBox.innerText = `❌ Sai Tên đăng nhập (hoặc SBD) hoặc Mật khẩu trong ${getCategoryDisplayName(catId)}! Vui lòng thử lại.`;
            errBox.style.display = "block";
            return;
        }

        studentDataToVerify = {
            sbd: matched.sbd, 
            name: matched.name || matched.username, 
            className: matched.className,
            username: matched.username, 
            stt: matched.stt,
            isFreeStudent: false,
            categoryId: catId
        };
    }

    errBox.style.display = "none";
    btn.disabled = true;
    btn.innerHTML = `⏳ Đang xác thực với máy chủ...`;

    try {
        localStorage.setItem("current_exam_student", JSON.stringify(studentDataToVerify));
        sessionStorage.setItem("current_exam_student", JSON.stringify(studentDataToVerify));
        localStorage.setItem("saved_student_sbd", studentDataToVerify.sbd);
        localStorage.setItem("saved_student_name", studentDataToVerify.name);
        localStorage.setItem("saved_student_class", studentDataToVerify.className);
    } catch(e) {}

    const safeSbd = String(studentDataToVerify.sbd || "user").replace(/[^a-zA-Z0-9]/g, '_');
    const examTitle = activeStudentLogin.examTitle || "Bài thi";

    const handshakePayload = {
        sbd: studentDataToVerify.sbd,
        name: studentDataToVerify.name,
        className: studentDataToVerify.className,
        cat: currentTargetCat,
        categoryId: currentTargetCat,
        quizId: quizId,
        isFree: !!studentDataToVerify.isFreeStudent,
        examTitle: examTitle,
        startTime: Date.now(),
        loginTime: Date.now(),
        lastPing: Date.now(),
        status: "logged_in"
    };

    let serverConfirmed = false;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        // ĐỒNG BỘ PHIÊN HOẠT ĐỘNG LÊN TOÀN BỘ CÁC NODE TƯƠNG ỨNG ĐỂ HIỂN THỊ "ĐANG THI" NGAY LẬP TỨC
        const targetNodes = getExamCandidateCodes(examTitle, "", quizId);
        const tasks = targetNodes.map(node => 
            fetch(`${FIREBASE_DB_URL}/active_sessions/${node}/${safeSbd}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(handshakePayload),
                signal: controller.signal
            }).catch(() => null)
        );

        await Promise.all(tasks);
        clearTimeout(timeoutId);
        serverConfirmed = true;
    } catch(e) {
        console.warn("Handshake cảnh báo kết nối:", e);
    }

    btn.innerHTML = serverConfirmed ? "✅ Xác nhận thành công! Đang vào..." : "🚀 Đang vào phòng thi...";
    btn.style.background = "#10b981";

    let urlObj;
    try {
        urlObj = new URL(activeStudentLogin.targetUrl, window.location.href);
    } catch(e) {
        urlObj = new URL(window.location.origin + "/" + activeStudentLogin.targetUrl);
    }
    urlObj.searchParams.set('sbd', studentDataToVerify.sbd);
    urlObj.searchParams.set('name', studentDataToVerify.name);
    urlObj.searchParams.set('class', studentDataToVerify.className);
    urlObj.searchParams.set('cat', currentTargetCat);
    urlObj.searchParams.set('autostart', '1');

    const finalRedirectUrl = urlObj.pathname + urlObj.search + urlObj.hash;

    setTimeout(() => {
        closeStudentLoginModal();
        window.location.href = finalRedirectUrl;
        btn.innerHTML = "Vào thi 🚀";
        btn.style.background = "";
        btn.disabled = false;
    }, 250);
}

function getBadgeClass(type) {
    switch(type) {
        case 'HOT': return 'b-hot';
        case 'NEW': return 'b-new';
        case 'MỚI': return 'b-moi';
        case 'Làm ngay': return 'b-lamngay';
        case 'WARNING': return 'b-warning';
        case 'START': return 'b-start';
        default: return '';
    }
}

function toggleBadgeMenu(wrapperEl, event) {
    event.preventDefault(); event.stopPropagation();
    const currentMenu = wrapperEl.querySelector('.badge-dropdown-menu');
    const parentCard = wrapperEl.closest('.exam-card');
    const isShown = currentMenu.classList.contains('show');

    document.querySelectorAll('.badge-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.exam-card.active-dropdown').forEach(c => c.classList.remove('active-dropdown'));

    if (!isShown) {
        currentMenu.classList.add('show');
        if(parentCard) parentCard.classList.add('active-dropdown');
    }
}

async function changeBadge(categoryId, itemId, newBadgeType, event) {
    event.preventDefault(); event.stopPropagation();

    if (!checkAdminSessionValidity()) {
        let pass = prompt("🔐 Nhập mật khẩu quản trị viên để thay đổi nhãn:");
        if (pass !== ADMIN_PASSWORD) { alert("❌ Sai mật khẩu!"); return; }
        isAdminLoggedIn = true;
        try {
            const exp = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem("adminLoggedInSession", "true");
            localStorage.setItem("admin_expires_at", String(exp));
            sessionStorage.setItem("adminLoggedInSession", "true");
        } catch(e) {}
        document.getElementById("gear-btn").classList.add("active-gear");
        refreshAllViews();
    }

    const wrapperEl = event.target.closest('.badge-wrapper');
    if (wrapperEl) {
        const badgeSpan = wrapperEl.querySelector('.badge-item');
        if (badgeSpan) {
            badgeSpan.className = `badge-item ${getBadgeClass(newBadgeType)} ${newBadgeType === 'NONE' ? 'badge-empty' : ''}`;
            badgeSpan.innerHTML = `${newBadgeType !== 'NONE' ? newBadgeType : 'Nhãn'} ▾`;
        }
        const currentMenu = wrapperEl.querySelector('.badge-dropdown-menu');
        if (currentMenu) currentMenu.classList.remove('show');
        const parentCard = wrapperEl.closest('.exam-card');
        if (parentCard) parentCard.classList.remove('active-dropdown');
    }

    try {
        let payload = { badgeText: newBadgeType, isHot: (newBadgeType === 'HOT') };
        await fetch(`${FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { 
            method: 'PATCH', body: JSON.stringify(payload) 
        });
        if (itemId.startsWith('quiz_')) {
            await fetch(`${FIREBASE_DB_URL}/quizzes/${itemId}.json`, { 
                method: 'PATCH', body: JSON.stringify(payload) 
            });
        }
    } catch(e) { console.error("Lỗi lưu nhãn:", e); }
}

function createExamCard(item) {
    let card = document.createElement("a"); 
    card.className = "exam-card"; 
    
    let catId = item.categoryId || "them-11";
    item.categoryId = catId;
    let itemId = item.firebaseId || item.id || ("item_" + Date.now());

    const isPadlet = (catId === "tu-luan-padlet") || (item.url && item.url.includes("padlet.com"));
    const LOGIN_CLASSES = ["them-10", "them-11", "them-12", "lop-11a", "lop-11c", "lop-10p", "lop-11e"];
    const requiresLogin = !item.isDoc && !isPadlet && LOGIN_CLASSES.includes(catId);

    if (requiresLogin) {
        card.href = "javascript:void(0);";
        card.onclick = function(e) {
            e.preventDefault();
            openStudentLoginModal(item.url, item.title, catId, item);
        };
    } else {
        card.href = item.url; 
        card.target = "_blank";
    }

    let thumbHtml = item.avatar ? `<div class="exam-thumb-box"><img src="${item.avatar}" class="exam-thumb" alt="Avatar"></div>` : '';
    let currentBadge = item.badgeText || (item.isHot ? 'HOT' : 'NONE');

    let badgeDisplay = currentBadge !== 'NONE' 
        ? `<span class="badge-item ${getBadgeClass(currentBadge)}">${currentBadge} ▾</span>`
        : `<span class="badge-item badge-empty" title="Thêm nhãn">Nhãn ▾</span>`;

    let badgeWrapperHtml = `
        <div class="badge-wrapper" onclick="toggleBadgeMenu(this, event)">
            ${badgeDisplay}
            <div class="badge-dropdown-menu">
                <div class="b-item-btn b-hot" onclick="changeBadge('${catId}', '${itemId}', 'HOT', event)">HOT</div>
                <div class="b-item-btn b-new" onclick="changeBadge('${catId}', '${itemId}', 'NEW', event)">NEW</div>
                <div class="b-item-btn b-moi" onclick="changeBadge('${catId}', '${itemId}', 'MỚI', event)">MỚI</div>
                <div class="b-item-btn b-lamngay" onclick="changeBadge('${catId}', '${itemId}', 'Làm ngay', event)">Làm ngay</div>
                <div class="b-item-btn b-warning" onclick="changeBadge('${catId}', '${itemId}', 'WARNING', event)">WARNING</div>
                <div class="b-item-btn b-start" onclick="changeBadge('${catId}', '${itemId}', 'START', event)">START</div>
                <div class="b-item-btn b-none-btn" onclick="changeBadge('${catId}', '${itemId}', 'NONE', event)">Để trắng</div>
            </div>
        </div>
    `;

    let docBadgeHtml = item.isDoc ? `<span class="badge-doc">TÀI LIỆU</span>` : '';

    if (isAdminLoggedIn) {
        card.classList.add("admin-card-mode");

        let leftControlsHtml = "";
        if (!item.isDoc && !isPadlet) {
            let copyItem = { ...item, categoryId: catId };
            let linkedQuizId = extractQuizIdFromItem(item);
            let subTimeButtonsHtml = "";

            if (linkedQuizId) {
                subTimeButtonsHtml = `
                <div class="left-sub-btns-row" onclick="event.preventDefault(); event.stopPropagation();">
                    <button type="button" class="btn-time-sub-action btn-time-sub-minutes" onclick="openEditMinutesModal('${linkedQuizId}', event)" title="Thay đổi thời lượng làm bài (phút)">
                        ⏱ Đổi phút
                    </button>
                    <button type="button" class="btn-time-sub-action btn-time-sub-schedule" onclick="openEditScheduleModal('${linkedQuizId}', event)" title="Gia hạn khung ngày giờ làm bài">
                        📅 Gia hạn lịch
                    </button>
                </div>`;
            }

            let isFreeAllowed = true;
            const localValItem = localStorage.getItem(`exam_allow_free_${itemId}`);
            const localValQuiz = linkedQuizId ? localStorage.getItem(`exam_allow_free_${linkedQuizId}`) : null;
            if (localValQuiz !== null) {
                isFreeAllowed = (localValQuiz === 'true');
            } else if (localValItem !== null) {
                isFreeAllowed = (localValItem === 'true');
            } else if (item.allowFree !== undefined) {
                isFreeAllowed = (item.allowFree !== false);
            }

            let freeToggleHtml = `
            <div class="free-student-toggle-wrap" onclick="toggleAllowFreeExam('${catId}', '${itemId}', event)" title="Bấm để BẬT hoặc TẮT cho phép thí sinh tự do vào thi (Có hiệu lực ngay)">
                <span class="free-toggle-lbl">🎯 Tự do:</span>
                <span class="switch-toggle mini-switch">
                    <input type="checkbox" id="free-toggle-${itemId}" ${isFreeAllowed ? 'checked' : ''} tabindex="-1">
                    <span class="slider-toggle"></span>
                </span>
                <span class="free-toggle-status ${isFreeAllowed ? 'st-on' : 'st-off'}" id="free-status-txt-${itemId}">
                    ${isFreeAllowed ? 'BẬT' : 'TẮT'}
                </span>
            </div>`;

            leftControlsHtml = `
            <div class="left-admin-actions-col">
                <button type="button" class="btn-view-results-left" onclick="openExamResultModal(${JSON.stringify(copyItem).replace(/"/g, '&quot;')}, event)" title="Xem bảng điểm và chi tiết bài làm của học sinh">
                    📊 Kết quả thi
                </button>
                ${freeToggleHtml}
                ${subTimeButtonsHtml}
            </div>`;
        }

        let rightControlsHtml = "";
        if (item.firebaseId) {
            let cleanData = { title: item.title, date: item.date, url: item.url, badgeText: currentBadge, isHot: (currentBadge==='HOT'), isDoc: item.isDoc, avatar: item.avatar, timestamp: item.timestamp, isShuffled: item.isShuffled, allowFree: (item.allowFree !== false), categoryId: catId };
            let strData = encodeURIComponent(JSON.stringify(cleanData));
            let escapedTitle = (item.title || "").replace(/'/g, "\\'"); 
            let isDocFlag = item.isDoc ? 'true' : 'false';
            
            let shuffleToggleHtml = "";
            if (!item.isDoc && item.firebaseId.startsWith('quiz_')) {
                let isChecked = item.isShuffled !== false;
                shuffleToggleHtml = `
                <div style="display:flex; align-items:center; background: rgba(255,255,255,0.85); padding: 2px 6px; border-radius: 12px; border: 1px solid #cbd5e1; margin-right: 4px;" title="Gạt phải: BẬT Đảo đề | Gạt trái: TẮT Đảo đề">
                    <span class="shuffle-label">🔀</span>
                    <label class="switch-toggle" onclick="event.stopPropagation();">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleShuffle('${catId}', '${itemId}', this.checked, event)">
                        <span class="slider-toggle"></span>
                    </label>
                </div>`;
            }
            
            rightControlsHtml = `
            <div class="admin-link-tools" onclick="event.preventDefault(); event.stopPropagation();">
                ${shuffleToggleHtml}
                <button class="tool-btn tool-btn-edit" onclick="renameItem('${catId}', '${itemId}', ${isDocFlag}, '${escapedTitle}', event)" title="Sửa tên">✏️</button>
                <button class="tool-btn tool-btn-copy" onclick="openCopyModal('${catId}', '${itemId}', '${strData}', event)" title="Sao chép sang mục khác">📋</button>
                <button class="tool-btn tool-btn-move" onclick="openMoveModal('${catId}', '${itemId}', '${strData}', event)" title="Chuyển mục">🔄</button>
                <button class="tool-btn tool-btn-up" onclick="moveItemOrder('${catId}', '${itemId}', 'up', event)" title="Lên trên">⬆️</button>
                <button class="tool-btn tool-btn-down" onclick="moveItemOrder('${catId}', '${itemId}', 'down', event)" title="Xuống dưới">⬇️</button>
                <button class="tool-btn tool-btn-delete" onclick="deleteItem('${catId}', '${itemId}', event)" title="Xóa">🗑️</button>
            </div>`;
        }

        card.innerHTML = `
            <div class="admin-card-top-row">
                ${leftControlsHtml}
                ${rightControlsHtml}
            </div>
            <div class="admin-card-bottom-row">
                ${thumbHtml}
                <div class="exam-info">
                    <div class="exam-header-row">
                        ${badgeWrapperHtml}
                        ${docBadgeHtml}
                        <div class="exam-title-text" title="${item.title}">${item.title}</div>
                    </div>
                    <div class="exam-date">🕒 ${item.date}</div>
                </div>
            </div>
        `;
        return card;
    }

    let arrowHtml = `<div class="arrow">&#8250;</div>`;
    card.innerHTML = `
        ${thumbHtml}
        <div class="exam-info">
            <div class="exam-header-row">
                ${badgeWrapperHtml}
                ${docBadgeHtml}
                <div class="exam-title-text" title="${item.title}">${item.title}</div>
            </div>
            <div class="exam-date">🕒 ${item.date}</div>
        </div>
        ${arrowHtml}
    `;
    return card;
}

function renderLinkListToContainer(linksArray, containerElement, customVisibleCount = 2) {
    containerElement.innerHTML = "";
    if (!linksArray || linksArray.length === 0) {
        containerElement.innerHTML = `<div class="empty-folder">Chưa có bài tập nào trong mục này...</div>`; return;
    }

    const maxVisible = customVisibleCount;
    const visibleLinks = linksArray.slice(0, maxVisible);
    const hiddenLinks = linksArray.slice(maxVisible);

    visibleLinks.forEach(item => containerElement.appendChild(createExamCard(item)));

    if (hiddenLinks.length > 0) {
        let hiddenContainer = document.createElement("div");
        hiddenContainer.className = "hidden-links-container"; hiddenContainer.style.display = "none";
        hiddenLinks.forEach(item => hiddenContainer.appendChild(createExamCard(item)));

        let toggleBtn = document.createElement("button");
        toggleBtn.className = "load-more-btn";
        toggleBtn.innerHTML = `⬇ Xem thêm ${hiddenLinks.length} bài cũ hơn...`;
        toggleBtn.onclick = function(e) {
            e.stopPropagation(); 
            if (hiddenContainer.style.display === "none") { hiddenContainer.style.display = "flex"; toggleBtn.innerHTML = `⬆ Thu gọn bớt`; } 
            else { hiddenContainer.style.display = "none"; toggleBtn.innerHTML = `⬇ Xem thêm ${hiddenLinks.length} bài cũ hơn...`; }
        };
        containerElement.appendChild(toggleBtn); containerElement.appendChild(hiddenContainer);
    }
}

let activeDanTriId = null; 
let activeDayThemId = null;
let activeChinhKhoaRow1Id = null; 
let activeChinhKhoaRow2Id = null;

function renderDanTriNavBar() {
    const navBar = document.getElementById("dantri-nav-bar"); 
    if (!navBar) return;
    navBar.innerHTML = "";
    DANTRI_NAV_CATEGORIES.forEach(cat => {
        let btn = document.createElement("button"); btn.className = "dantri-nav-btn";
        btn.innerHTML = `<div style="display:inline-flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">${cat.title}</div><span class="caret-icon">&#9660;</span>`;
        
        btn.onclick = function() {
            const panel = document.getElementById("dantri-dropdown-panel"); 
            const subTitle = document.getElementById("dantri-sub-title"); 
            const newsList = document.getElementById("dantri-news-list");
            navBar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));

            if (activeDanTriId === cat.id) { panel.classList.remove("show"); activeDanTriId = null; } 
            else {
                activeDanTriId = cat.id; btn.classList.add("active"); subTitle.innerHTML = cat.subTitle; newsList.innerHTML = "";
                cat.news.forEach(item => {
                    let card = document.createElement("a"); card.href = item.url; card.target = "_blank";
                    card.style.cssText = "display:flex; align-items:flex-start; gap:12px; padding:10px 12px; background:rgba(255,255,255,0.9); border-radius:12px; border:1px solid #e2e8f0; text-decoration:none; color:inherit; transition:all 0.25s;";
                    let tagBg = item.tag === "GIẢI TRÍ" || item.tag === "CƯỜI MẮT" || item.tag === "MEME MATH" ? "background:#fef3c7; color:#b45309;" : "background:#dcfce7; color:#15803d;";
                    card.innerHTML = `<span style="font-size:11px; font-weight:800; padding:3px 7px; border-radius:5px; ${tagBg} white-space:nowrap; margin-top:2px;">${item.tag}</span><div style="flex:1; min-width:0;"><div style="font-size:14px; font-weight:700; color:#0f172a; line-height:1.35; margin-bottom:3px;">${item.title}</div><div style="font-size:11.5px; color:#64748b; font-weight:600;">🕒 ${item.date}</div></div>`;
                    newsList.appendChild(card);
                });
                panel.classList.add("show"); btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        };
        navBar.appendChild(btn);
    });
}

function renderDayThemNavBar() {
    const navBar = document.getElementById("daythem-nav-bar"); 
    const panel = document.getElementById("daythem-dropdown-panel"); 
    const container = document.getElementById("daythem-links-container"); 
    if (!navBar) return;
    navBar.innerHTML = "";
    
    DAY_THEM_CATEGORIES.forEach(cat => {
        let btn = document.createElement("button"); 
        btn.className = "dantri-nav-btn"; 
        btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
        if (activeDayThemId === cat.id) btn.classList.add("active");
        
        btn.onclick = function() {
            navBar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
            if (activeDayThemId === cat.id) { 
                panel.classList.remove("show"); 
                activeDayThemId = null; 
            } else { 
                activeDayThemId = cat.id; 
                btn.classList.add("active"); 
                renderLinkListToContainer(cat.links, container, cat.visibleCount || 2); 
                panel.classList.add("show"); 
            }
        };
        navBar.appendChild(btn);
    });

    if (activeDayThemId) { 
        let activeCat = DAY_THEM_CATEGORIES.find(c => c.id === activeDayThemId); 
        if (activeCat) {
            renderLinkListToContainer(activeCat.links, container, activeCat.visibleCount || 2);
            panel.classList.add("show");
        }
    }
}

function renderChinhKhoaNavBar() {
    const row1Bar = document.getElementById("chinhkhoa-row1-bar");
    const row1Panel = document.getElementById("chinhkhoa-row1-dropdown");
    const row1Links = document.getElementById("chinhkhoa-row1-links");

    const row2Bar = document.getElementById("chinhkhoa-row2-bar");
    const row2Panel = document.getElementById("chinhkhoa-row2-dropdown");
    const row2Links = document.getElementById("chinhkhoa-row2-links");

    if (!row1Bar || !row2Bar) return;

    row1Bar.innerHTML = "";
    row2Bar.innerHTML = "";

    const row1Categories = CHINH_KHOA_CATEGORIES.filter(c => c.row === 1);
    row1Categories.forEach(cat => {
        let btn = document.createElement("button");
        btn.className = "dantri-nav-btn";
        btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
        if (activeChinhKhoaRow1Id === cat.id) btn.classList.add("active");

        btn.onclick = function() {
            row1Bar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
            if (activeChinhKhoaRow1Id === cat.id) {
                row1Panel.classList.remove("show");
                activeChinhKhoaRow1Id = null;
            } else {
                activeChinhKhoaRow1Id = cat.id;
                btn.classList.add("active");
                renderLinkListToContainer(cat.links, row1Links, cat.visibleCount || 2);
                row1Panel.classList.add("show"); 
            }
        };
        row1Bar.appendChild(btn);
    });

    const row2Categories = CHINH_KHOA_CATEGORIES.filter(c => c.row === 2);
    row2Categories.forEach(cat => {
        let btn = document.createElement("button");
        if (cat.isGold) btn.className = "dantri-nav-btn hsg-gold-btn";
        else if (cat.isPurple) btn.className = "dantri-nav-btn padlet-purple-btn";
        else if (cat.id === "lop-11e") btn.className = "dantri-nav-btn lop11e-btn";
        else btn.className = "dantri-nav-btn";

        btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
        if (activeChinhKhoaRow2Id === cat.id) btn.classList.add("active");

        btn.onclick = function() {
            row2Bar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
            if (activeChinhKhoaRow2Id === cat.id) {
                row2Panel.classList.remove("show");
                activeChinhKhoaRow2Id = null;
            } else {
                activeChinhKhoaRow2Id = cat.id;
                btn.classList.add("active");
                renderLinkListToContainer(cat.links, row2Links, cat.visibleCount || 2);
                row2Panel.classList.add("show"); 
            }
        };
        row2Bar.appendChild(btn);
    });

    if (activeChinhKhoaRow1Id) {
        let cat1 = row1Categories.find(c => c.id === activeChinhKhoaRow1Id);
        if (cat1) renderLinkListToContainer(cat1.links, row1Links, cat1.visibleCount || 2);
    }
    if (activeChinhKhoaRow2Id) {
        let cat2 = row2Categories.find(c => c.id === activeChinhKhoaRow2Id);
        if (cat2) renderLinkListToContainer(cat2.links, row2Links, cat2.visibleCount || 2);
    }
}

function renderKhoTaiLieu() {
    const container = document.getElementById("kho-tai-lieu-container"); 
    if (!container) return;
    container.innerHTML = "";
    let details = document.createElement("details"); details.className = "folder-section";
    let summary = document.createElement("summary"); summary.className = "folder-header";
    summary.innerHTML = `<img src="${KHO_TAI_LIEU_FOLDER.folderAvatar}" class="folder-avatar" alt="Folder Icon"><h2 class="folder-title">${KHO_TAI_LIEU_FOLDER.folderName}</h2><span class="folder-arrow">&#9658;</span>`;
    details.appendChild(summary);
    let listDiv = document.createElement("div"); listDiv.className = "link-list"; renderLinkListToContainer(KHO_TAI_LIEU_FOLDER.links, listDiv, 3);
    details.appendChild(listDiv); container.appendChild(details);
}

function renderReminderSection() {
    const container = document.getElementById("reminder-container"); 
    if (!container) return;
    container.innerHTML = "";
    renderLinkListToContainer(REMINDER_CATEGORY.links, container, 5);
}

function renderNewsSection() {
    const container = document.getElementById("news-container"); 
    if (!container) return;
    container.innerHTML = "";
    NEWS_DATA.forEach(item => {
        let newsCard = document.createElement("a"); newsCard.href = item.url; newsCard.className = "news-item"; newsCard.target = "_blank";
        let imgHtml = item.image ? `<div class="news-img-box"><img src="${item.image}" class="news-img" alt="Illustration"></div>` : '';
        newsCard.innerHTML = `<div class="news-content"><div class="news-title">${item.title}</div><div class="news-date">🕒 ${item.date}</div></div>${imgHtml}`;
        container.appendChild(newsCard);
    });
}

document.addEventListener("click", function(e) {
    const panel = document.getElementById("admin-popover-panel");
    const gear = document.getElementById("gear-btn");
    const authContainer = document.getElementById("auth-container");
    const moveModal = document.getElementById("move-modal");
    const copyModal = document.getElementById("copy-modal");
    const examTimeModal = document.getElementById("exam-time-modal");
    const studentModal = document.getElementById("student-login-modal");
    const resModal = document.getElementById("result-fullscreen-modal");
    const examPickerMenu = document.getElementById("exam-picker-dropdown-list");
    const tableSettingsWrapper = document.getElementById("table-settings-wrapper");

    if (panel && panel.classList.contains("show")) {
        if (!panel.contains(e.target) && !gear.contains(e.target) && (!moveModal || !moveModal.contains(e.target)) && (!copyModal || !copyModal.contains(e.target)) && (!examTimeModal || !examTimeModal.contains(e.target)) && (!studentModal || !studentModal.contains(e.target)) && (!resModal || !resModal.contains(e.target))) {
            closeAdminPanel();
        }
    }
    if (authContainer && authContainer.classList.contains("show")) {
        if (!authContainer.contains(e.target) && !gear.contains(e.target)) {
            authContainer.classList.remove("show");
        }
    }

    if (!e.target.closest('.badge-wrapper')) {
        document.querySelectorAll('.badge-dropdown-menu.show').forEach(m => m.classList.remove('show'));
        document.querySelectorAll('.exam-card.active-dropdown').forEach(c => c.classList.remove('active-dropdown'));
    }

    if (examPickerMenu && examPickerMenu.classList.contains("show")) {
        if (!e.target.closest('.exam-picker-wrapper')) examPickerMenu.classList.remove("show");
    }

    if (!e.target.closest('.td-attempt-cell-wrap')) {
        document.querySelectorAll('.attempt-dropdown-menu.show').forEach(m => m.classList.remove('show'));
        document.querySelectorAll('.btn-attempt-trigger.active').forEach(b => b.classList.remove('active'));
    }

    if (tableSettingsWrapper && !tableSettingsWrapper.contains(e.target)) {
        closeTableSettingsPopover();
    }
});

window.onload = function() {
    const savedDuration = localStorage.getItem("admin_duration_choice");
    const durSelect = document.getElementById("admin-expiry-select");
    if (savedDuration && durSelect) {
        durSelect.value = savedDuration;
    }

    if (checkAdminSessionValidity()) { 
        document.getElementById("gear-btn").classList.add("active-gear");
    }

    document.getElementById("top-banner-img").src = TOP_BANNER_URL;
    document.getElementById("web-avatar-img").src = WEB_AVATAR_URL;
    document.getElementById("bottom-banner-img").src = BOTTOM_BANNER_URL;
    
    initAvatarGrid();
    initTableSettings();

    const uInput = document.getElementById("st-username-input");
    const pInput = document.getElementById("st-password-input");
    const fName = document.getElementById("st-free-name-input");
    const fClass = document.getElementById("st-free-class-input");
    const fSbd = document.getElementById("st-free-sbd-input");

    if (uInput) uInput.addEventListener("keypress", function(e) { if(e.key === 'Enter') pInput.focus(); });
    if (pInput) pInput.addEventListener("keypress", function(e) { if(e.key === 'Enter') submitStudentLogin(); });
    if (fName) fName.addEventListener("keypress", function(e) { if(e.key === 'Enter') fClass.focus(); });
    if (fClass) fClass.addEventListener("keypress", function(e) { if(e.key === 'Enter') fSbd.focus(); });
    if (fSbd) fSbd.addEventListener("keypress", function(e) { if(e.key === 'Enter') submitStudentLogin(); });

    renderDanTriNavBar();
    renderReminderSection();
    renderDayThemNavBar();
    renderChinhKhoaNavBar();
    renderKhoTaiLieu();
    renderNewsSection();

    loadDynamicLinksFromFirebase().then(() => {
        refreshAllViews();
    });
};