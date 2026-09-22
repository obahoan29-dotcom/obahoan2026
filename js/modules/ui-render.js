/**
 * MODULE 6: DỰNG GIAO DIỆN TRANG CHỦ, THẺ BÀI THI, MENU VÀ BADGES
 */
window.UI_RENDER = {
    activeDanTriId: null, 
    activeDayThemId: null, 
    activeChinhKhoaRow1Id: null, 
    activeChinhKhoaRow2Id: null,

    getBadgeClass(type) {
        switch(type) {
            case 'HOT': return 'b-hot';
            case 'NEW': return 'b-new';
            case 'MỚI': return 'b-moi';
            case 'Làm ngay': return 'b-lamngay';
            case 'WARNING': return 'b-warning';
            case 'START': return 'b-start';
            default: return '';
        }
    },

    createExamCard(item) {
        let card = document.createElement("a"); 
        card.className = "exam-card"; 
        
        let catId = item.categoryId || "nhac-nho";
        let itemId = item.firebaseId || item.id || ("item_" + Date.now());

        const hasAccounts = (window.STUDENT_ACCOUNTS && window.STUDENT_ACCOUNTS[catId]);
        const requiresLogin = !item.isDoc && hasAccounts;

        if (requiresLogin) {
            card.href = "javascript:void(0);";
            card.onclick = function(e) {
                e.preventDefault();
                STUDENT_AUTH.openStudentLoginModal(item.url, item.title, catId);
            };
        } else {
            card.href = item.url; 
            card.target = "_blank";
        }
        
        let leftResultBtnHtml = "";
        if (APP_STATE.isAdminLoggedIn && !item.isDoc) {
            leftResultBtnHtml = `
            <button type="button" class="btn-view-results-left" onclick="RESULT_MODAL.openExamResultModal(${JSON.stringify(item).replace(/"/g, '&quot;')}, event)" title="Xem toàn bộ điểm và chi tiết bài thi của học sinh">
                📊 Kết quả thi
            </button>`;
        }

        let thumbHtml = item.avatar ? `<div class="exam-thumb-box"><img src="${item.avatar}" class="exam-thumb" alt="Avatar"></div>` : '';
        let currentBadge = item.badgeText || (item.isHot ? 'HOT' : 'NONE');

        let badgeDisplay = currentBadge !== 'NONE' 
            ? `<span class="badge-item ${this.getBadgeClass(currentBadge)}">${currentBadge} ▾</span>`
            : `<span class="badge-item badge-empty" title="Thêm nhãn">Nhãn ▾</span>`;

        let badgeWrapperHtml = `
            <div class="badge-wrapper" onclick="UI_RENDER.toggleBadgeMenu(this, event)">
                ${badgeDisplay}
                <div class="badge-dropdown-menu">
                    <div class="b-item-btn b-hot" onclick="UI_RENDER.changeBadge('${catId}', '${itemId}', 'HOT', event)">HOT</div>
                    <div class="b-item-btn b-new" onclick="UI_RENDER.changeBadge('${catId}', '${itemId}', 'NEW', event)">NEW</div>
                    <div class="b-item-btn b-moi" onclick="UI_RENDER.changeBadge('${catId}', '${itemId}', 'MỚI', event)">MỚI</div>
                    <div class="b-item-btn b-lamngay" onclick="UI_RENDER.changeBadge('${catId}', '${itemId}', 'Làm ngay', event)">Làm ngay</div>
                    <div class="b-item-btn b-warning" onclick="UI_RENDER.changeBadge('${catId}', '${itemId}', 'WARNING', event)">WARNING</div>
                    <div class="b-item-btn b-start" onclick="UI_RENDER.changeBadge('${catId}', '${itemId}', 'START', event)">START</div>
                    <div class="b-item-btn b-none-btn" onclick="UI_RENDER.changeBadge('${catId}', '${itemId}', 'NONE', event)">Để trắng</div>
                </div>
            </div>
        `;

        let adminTools = ""; 
        let arrowHtml = `<div class="arrow">&#8250;</div>`;
        
        if (APP_STATE.isAdminLoggedIn && item.firebaseId) {
            arrowHtml = "";
            let cleanData = { title: item.title, date: item.date, url: item.url, badgeText: currentBadge, isHot: (currentBadge==='HOT'), isDoc: item.isDoc, avatar: item.avatar, timestamp: item.timestamp, isShuffled: item.isShuffled };
            let strData = encodeURIComponent(JSON.stringify(cleanData));
            let escapedTitle = (item.title || "").replace(/'/g, "\\'"); 
            let isDocFlag = item.isDoc ? 'true' : 'false';
            
            let shuffleToggleHtml = "";
            if (!item.isDoc && item.firebaseId.startsWith('quiz_')) {
                let isChecked = item.isShuffled !== false;
                shuffleToggleHtml = `
                <div style="display:flex; align-items:center; background: rgba(255,255,255,0.85); padding: 2px 6px; border-radius: 12px; border: 1px solid #cbd5e1; margin-right: 4px;" title="Bật/Tắt đảo đề">
                    <span class="shuffle-label" style="font-size:11px; font-weight:800; color:#475569;">🔀</span>
                    <label class="switch-toggle" onclick="event.stopPropagation();">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="UI_RENDER.toggleShuffle('${catId}', '${itemId}', this.checked, event)">
                        <span class="slider-toggle"></span>
                    </label>
                </div>`;
            }
            
            adminTools = `
            <div class="admin-link-tools" onclick="event.preventDefault(); event.stopPropagation();">
                ${shuffleToggleHtml}
                <button class="tool-btn tool-btn-edit" onclick="UI_RENDER.renameItem('${catId}', '${itemId}', ${isDocFlag}, '${escapedTitle}', event)" title="Sửa tên">✏️</button>
                <button class="tool-btn tool-btn-copy" onclick="UI_RENDER.openCopyModal('${catId}', '${itemId}', '${strData}', event)" title="Sao chép sang mục khác">📋</button>
                <button class="tool-btn tool-btn-move" onclick="UI_RENDER.openMoveModal('${catId}', '${itemId}', '${strData}', event)" title="Chuyển mục">🔄</button>
                <button class="tool-btn tool-btn-up" onclick="UI_RENDER.moveItemOrder('${catId}', '${itemId}', 'up', event)" title="Lên trên">⬆️</button>
                <button class="tool-btn tool-btn-down" onclick="UI_RENDER.moveItemOrder('${catId}', '${itemId}', 'down', event)" title="Xuống dưới">⬇️</button>
                <button class="tool-btn tool-btn-delete" onclick="UI_RENDER.deleteItem('${catId}', '${itemId}', event)" title="Xóa">🗑️</button>
            </div>`;
        }

        let docBadgeHtml = item.isDoc ? `<span class="badge-doc">TÀI LIỆU</span>` : '';

        card.innerHTML = `
            ${leftResultBtnHtml}
            ${thumbHtml}
            <div class="exam-info">
                <div class="exam-header-row">
                    ${badgeWrapperHtml}
                    ${docBadgeHtml}
                    <div class="exam-title-text" title="${item.title}">${item.title}</div>
                </div>
                <div class="exam-date">🕒 ${item.date}</div>
            </div>
            ${adminTools}
            ${arrowHtml}
        `;
        return card;
    },

    renderLinkListToContainer(linksArray, containerElement, customVisibleCount = 2) {
        containerElement.innerHTML = "";
        if (!linksArray || linksArray.length === 0) {
            containerElement.innerHTML = `<div class="empty-folder">Chưa có bài tập nào trong mục này...</div>`; return;
        }

        const maxVisible = customVisibleCount;
        const visibleLinks = linksArray.slice(0, maxVisible);
        const hiddenLinks = linksArray.slice(maxVisible);

        visibleLinks.forEach(item => containerElement.appendChild(this.createExamCard(item)));

        if (hiddenLinks.length > 0) {
            let hiddenContainer = document.createElement("div");
            hiddenContainer.className = "hidden-links-container"; hiddenContainer.style.display = "none";
            hiddenLinks.forEach(item => hiddenContainer.appendChild(this.createExamCard(item)));

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
    },

    toggleBadgeMenu(wrapperEl, event) {
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
    },

    async changeBadge(catId, itemId, newBadgeType, event) {
        event.preventDefault(); event.stopPropagation();
        if (!APP_STATE.isAdminLoggedIn) {
            let pass = prompt("🔐 Nhập mật khẩu quản trị viên để thay đổi nhãn:");
            if (pass !== APP_CONFIG.ADMIN_PASSWORD) { alert("❌ Sai mật khẩu!"); return; }
            APP_STATE.isAdminLoggedIn = true;
            sessionStorage.setItem("adminLoggedInSession", "true");
            document.getElementById("gear-btn").classList.add("active-gear");
            this.refreshAllViews();
        }
        await API_SERVICE.updateBadge(catId, itemId, { badgeText: newBadgeType, isHot: (newBadgeType === 'HOT') });
        this.refreshAllViews();
    },

    async toggleShuffle(catId, itemId, isChecked, event) {
        event.stopPropagation();
        try {
            await API_SERVICE.toggleShuffle(catId, itemId, isChecked);
        } catch(e) { alert("❌ Lỗi khi thay đổi trạng thái đảo đề!"); }
    },

    async deleteItem(catId, itemId, event) {
        event.preventDefault(); event.stopPropagation();
        if(!confirm("⚠️ Bạn có chắc chắn muốn XÓA vĩnh viễn mục này không?")) return;
        try {
            await API_SERVICE.deleteItem(catId, itemId);
            window.location.reload();
        } catch(e) { alert("Lỗi khi xóa!"); }
    },

    async renameItem(catId, itemId, isDoc, currentTitle, event) {
        event.preventDefault(); event.stopPropagation();
        let newTitle = prompt("✏️ Nhập tên mới:", currentTitle);
        if (newTitle !== null && newTitle.trim() !== "" && newTitle.trim() !== currentTitle) {
            try {
                await API_SERVICE.renameItem(catId, itemId, isDoc, newTitle.trim());
                window.location.reload();
            } catch(e) { alert("Lỗi khi sửa tên!"); }
        }
    },

    openMoveModal(oldCategory, quizId, stringifiedData, event) {
        event.preventDefault(); event.stopPropagation();
        APP_STATE.currentMoveData = { oldCategory, quizId, quizData: JSON.parse(decodeURIComponent(stringifiedData)) };
        document.getElementById("move-category-select").value = oldCategory;
        document.getElementById("move-modal").style.display = "flex";
    },

    openCopyModal(sourceCategory, itemId, stringifiedData, event) {
        event.preventDefault(); event.stopPropagation();
        APP_STATE.currentCopyData = { sourceCategory, itemId, itemData: JSON.parse(decodeURIComponent(stringifiedData)) };
        document.getElementById("copy-category-select").value = sourceCategory;
        document.getElementById("copy-modal").style.display = "flex";
    },

    renderDanTriNavBar() {
        const navBar = document.getElementById("dantri-nav-bar"); navBar.innerHTML = "";
        APP_STATE.DANTRI_NAV_CATEGORIES.forEach(cat => {
            let btn = document.createElement("button"); btn.className = "dantri-nav-btn";
            btn.innerHTML = `<div style="display:inline-flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">${cat.title}</div><span class="caret-icon">&#9660;</span>`;
            
            btn.onclick = () => {
                const panel = document.getElementById("dantri-dropdown-panel"); 
                const subTitle = document.getElementById("dantri-sub-title"); 
                const newsList = document.getElementById("dantri-news-list");
                navBar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));

                if (this.activeDanTriId === cat.id) { panel.classList.remove("show"); this.activeDanTriId = null; } 
                else {
                    this.activeDanTriId = cat.id; btn.classList.add("active"); subTitle.innerHTML = cat.subTitle; newsList.innerHTML = "";
                    cat.news.forEach(item => {
                        let card = document.createElement("a"); card.href = item.url; card.target = "_blank";
                        card.style.cssText = "display:flex; align-items:flex-start; gap:12px; padding:10px 12px; background:rgba(255,255,255,0.9); border-radius:12px; border:1px solid #e2e8f0; text-decoration:none; color:inherit;";
                        card.innerHTML = `<span style="font-size:11px; font-weight:800; padding:3px 7px; border-radius:5px; background:#dcfce7; color:#15803d;">${item.tag}</span><div style="flex:1; min-width:0;"><div style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:3px;">${item.title}</div><div style="font-size:11.5px; color:#64748b; font-weight:600;">🕒 ${item.date}</div></div>`;
                        newsList.appendChild(card);
                    });
                    panel.classList.add("show");
                }
            };
            navBar.appendChild(btn);
        });
    },

    renderDayThemNavBar() {
        const navBar = document.getElementById("daythem-nav-bar"); 
        const panel = document.getElementById("daythem-dropdown-panel"); 
        const container = document.getElementById("daythem-links-container"); 
        navBar.innerHTML = "";
        
        APP_STATE.DAY_THEM_CATEGORIES.forEach(cat => {
            let btn = document.createElement("button"); 
            btn.className = "dantri-nav-btn"; 
            btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
            if(this.activeDayThemId === cat.id) btn.classList.add("active");
            
            btn.onclick = () => {
                navBar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
                if (this.activeDayThemId === cat.id) { 
                    panel.classList.remove("show"); this.activeDayThemId = null; 
                } else { 
                    this.activeDayThemId = cat.id; btn.classList.add("active"); 
                    this.renderLinkListToContainer(cat.links, container, cat.visibleCount || 2); 
                    panel.classList.add("show"); 
                }
            };
            navBar.appendChild(btn);
        });

        if(this.activeDayThemId) { 
            let activeCat = APP_STATE.DAY_THEM_CATEGORIES.find(c => c.id === this.activeDayThemId); 
            if(activeCat) this.renderLinkListToContainer(activeCat.links, container, activeCat.visibleCount || 2); 
        }
    },

    renderChinhKhoaNavBar() {
        const row1Bar = document.getElementById("chinhkhoa-row1-bar");
        const row1Panel = document.getElementById("chinhkhoa-row1-dropdown");
        const row1Links = document.getElementById("chinhkhoa-row1-links");
        const row2Bar = document.getElementById("chinhkhoa-row2-bar");
        const row2Panel = document.getElementById("chinhkhoa-row2-dropdown");
        const row2Links = document.getElementById("chinhkhoa-row2-links");

        row1Bar.innerHTML = ""; row2Bar.innerHTML = "";

        const row1Categories = APP_STATE.CHINH_KHOA_CATEGORIES.filter(c => c.row === 1);
        row1Categories.forEach(cat => {
            let btn = document.createElement("button");
            btn.className = "dantri-nav-btn";
            btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
            if (this.activeChinhKhoaRow1Id === cat.id) btn.classList.add("active");

            btn.onclick = () => {
                row1Bar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
                if (this.activeChinhKhoaRow1Id === cat.id) {
                    row1Panel.classList.remove("show"); this.activeChinhKhoaRow1Id = null;
                } else {
                    this.activeChinhKhoaRow1Id = cat.id; btn.classList.add("active");
                    this.renderLinkListToContainer(cat.links, row1Links, cat.visibleCount || 2);
                    row1Panel.classList.add("show"); 
                }
            };
            row1Bar.appendChild(btn);
        });

        const row2Categories = APP_STATE.CHINH_KHOA_CATEGORIES.filter(c => c.row === 2);
        row2Categories.forEach(cat => {
            let btn = document.createElement("button");
            btn.className = cat.isGold ? "dantri-nav-btn hsg-gold-btn" : (cat.isPurple ? "dantri-nav-btn padlet-purple-btn" : "dantri-nav-btn");
            btn.innerHTML = `${cat.title} <span class="caret-icon">&#9660;</span>`;
            if (this.activeChinhKhoaRow2Id === cat.id) btn.classList.add("active");

            btn.onclick = () => {
                row2Bar.querySelectorAll(".dantri-nav-btn").forEach(b => b.classList.remove("active"));
                if (this.activeChinhKhoaRow2Id === cat.id) {
                    row2Panel.classList.remove("show"); this.activeChinhKhoaRow2Id = null;
                } else {
                    this.activeChinhKhoaRow2Id = cat.id; btn.classList.add("active");
                    this.renderLinkListToContainer(cat.links, row2Links, cat.visibleCount || 2);
                    row2Panel.classList.add("show");
                }
            };
            row2Bar.appendChild(btn);
        });

        if (this.activeChinhKhoaRow1Id) {
            let cat1 = row1Categories.find(c => c.id === this.activeChinhKhoaRow1Id);
            if (cat1) this.renderLinkListToContainer(cat1.links, row1Links, cat1.visibleCount || 2);
        }
        if (this.activeChinhKhoaRow2Id) {
            let cat2 = row2Categories.find(c => c.id === this.activeChinhKhoaRow2Id);
            if (cat2) this.renderLinkListToContainer(cat2.links, row2Links, cat2.visibleCount || 2);
        }
    },

    renderKhoTaiLieu() {
        const container = document.getElementById("kho-tai-lieu-container"); container.innerHTML = "";
        let details = document.createElement("details"); details.className = "folder-section";
        let summary = document.createElement("summary"); summary.className = "folder-header";
        summary.innerHTML = `<img src="${APP_STATE.KHO_TAI_LIEU_FOLDER.folderAvatar}" class="folder-avatar" alt="Folder Icon"><h2 class="folder-title">${APP_STATE.KHO_TAI_LIEU_FOLDER.folderName}</h2><span class="folder-arrow">&#9658;</span>`;
        details.appendChild(summary);
        let listDiv = document.createElement("div"); listDiv.className = "link-list"; 
        this.renderLinkListToContainer(APP_STATE.KHO_TAI_LIEU_FOLDER.links, listDiv, 3);
        details.appendChild(listDiv); container.appendChild(details);
    },

    renderReminderSection() {
        const container = document.getElementById("reminder-container"); container.innerHTML = "";
        this.renderLinkListToContainer(APP_STATE.REMINDER_CATEGORY.links, container, 5);
    },

    renderNewsSection() {
        const container = document.getElementById("news-container"); container.innerHTML = "";
        APP_STATE.NEWS_DATA.forEach(item => {
            let newsCard = document.createElement("a"); newsCard.href = item.url; newsCard.className = "news-item"; newsCard.target = "_blank";
            let imgHtml = item.image ? `<div class="news-img-box"><img src="${item.image}" class="news-img" alt="Illustration"></div>` : '';
            newsCard.innerHTML = `<div class="news-content"><div class="news-title">${item.title}</div><div class="news-date">🕒 ${item.date}</div></div>${imgHtml}`;
            container.appendChild(newsCard);
        });
    },

    refreshAllViews() {
        this.renderReminderSection();
        this.renderDayThemNavBar();
        this.renderChinhKhoaNavBar();
        this.renderKhoTaiLieu();
    }
};
```