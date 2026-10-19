// =========================================================
// FILE: portal-ui-article.js
// QUẢN LÝ BÀI VIẾT, BẢN TIN THƯỜNG NGÀY PHONG CÁCH BÁO DÂN TRÍ
// =========================================================

function formatDantriDateTime(d = new Date()) {
    const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    const dayName = days[d.getDay()] || "Hôm nay";
    const pad = n => String(n).padStart(2, '0');
    return `${dayName}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function editReminderSectionTitle(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    let newTitle = prompt("✏️ Nhập tiêu đề mới cho khối Bản tin thường ngày:", REMINDER_SECTION_TITLE);
    if (newTitle !== null && newTitle.trim() !== "" && newTitle.trim() !== REMINDER_SECTION_TITLE) {
        REMINDER_SECTION_TITLE = newTitle.trim();
        const titleEl = document.getElementById("reminder-section-title-text");
        if (titleEl) titleEl.innerText = REMINDER_SECTION_TITLE;

        try {
            await fetch(`${FIREBASE_DB_URL}/site_meta.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reminderTitle: REMINDER_SECTION_TITLE })
            });
        } catch(e) { console.error("Lỗi lưu tiêu đề nhắc nhở:", e); }
    }
}

function addNewReminderArticle(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const newItemId = "rem_" + Date.now();
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} - ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newItem = {
        id: newItemId,
        firebaseId: newItemId,
        categoryId: "nhac-nho",
        title: "",
        articleTitle: "",
        author: "Thầy Hoan",
        articleTime: formatDantriDateTime(now),
        date: dateStr,
        timestamp: Date.now(),
        badgeText: "MỚI",
        isHot: false,
        isDoc: true,
        avatar: PRESET_20_AVATARS[0],
        sapo: "",
        articleImg: "",
        articleImgCaption: "",
        articleBody: "",
        url: "#"
    };

    openDantriArticleModal(newItem, "nhac-nho", event, true);
}

function renderReminderSection() {
    const container = document.getElementById("reminder-container");
    const titleEl = document.getElementById("reminder-section-title-text");
    const editHeadBtn = document.getElementById("btn-edit-reminder-head");

    if (titleEl) titleEl.innerText = REMINDER_SECTION_TITLE || "📌 Bản tin thường ngày";
    if (editHeadBtn) editHeadBtn.style.display = isAdminLoggedIn ? "inline-flex" : "none";

    const headerRow = document.querySelector(".reminder-header-row-box");
    if (headerRow) {
        let addBtn = document.getElementById("btn-add-reminder-post");
        if (!addBtn) {
            addBtn = document.createElement("button");
            addBtn.type = "button";
            addBtn.id = "btn-add-reminder-post";
            addBtn.className = "btn-edit-reminder-head";
            addBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
            addBtn.style.color = "#ffffff";
            addBtn.style.borderColor = "#10b981";
            addBtn.style.marginRight = "6px";
            addBtn.title = "Viết và đăng thêm bài viết mới vào Bản tin thường ngày";
            addBtn.onclick = (e) => addNewReminderArticle(e);

            if (editHeadBtn && editHeadBtn.parentNode) {
                editHeadBtn.parentNode.insertBefore(addBtn, editHeadBtn);
            } else {
                headerRow.appendChild(addBtn);
            }
        }
        addBtn.innerHTML = "➕ Đăng bài mới";
        addBtn.style.display = isAdminLoggedIn ? "inline-flex" : "none";
    }

    if (!container) return;
    container.innerHTML = "";

    const links = sortLinksNewestFirst(REMINDER_CATEGORY.links || []);
    renderLinksWithFold(container, links, "nhac-nho", 1);
}

function renderArticleViewContent(item) {
    if (!item) return;
    const viewTitle = document.getElementById("article-view-title");
    const viewAuthor = document.getElementById("article-view-author");
    const viewTime = document.getElementById("article-view-time");
    const viewSapo = document.getElementById("article-view-sapo");
    const viewImgBox = document.getElementById("article-view-img-box");
    const viewImg = document.getElementById("article-view-img");
    const viewCaption = document.getElementById("article-view-caption");
    const viewBody = document.getElementById("article-view-body");

    const titleText = item.articleTitle || item.title || "Lưu ý quan trọng";
    const authorText = item.author || "Thầy Hoan";
    const timeText = item.articleTime || formatDantriDateTime(new Date(item.timestamp || Date.now()));
    const sapoText = item.sapo || `(Dân trí) - Thông báo quan trọng gửi tới toàn thể học sinh: "${titleText}".`;

    let bodyText = item.articleBody || "";
    if (!bodyText.trim()) bodyText = `Chào các em học sinh!\n\nĐây là thông báo quan trọng từ thầy giáo về nội dung: "${titleText}". Các em hãy chú ý theo dõi và thực hiện nghiêm túc theo đúng kế hoạch.`;

    if (viewTitle) viewTitle.innerText = titleText;
    if (viewAuthor) viewAuthor.innerText = authorText;
    if (viewTime) viewTime.innerText = timeText;
    if (viewSapo) viewSapo.innerText = sapoText;
    if (viewBody) viewBody.innerText = bodyText;

    const rawImg = item.articleImg || item.articleImage || "";
    if (rawImg && rawImg.trim() !== "") {
        const directUrl = toDirectGoogleDriveImageUrl(rawImg);
        if (viewImg) {
            viewImg.src = directUrl;
            viewImg.onerror = function() {
                let m = rawImg.match(/(?:file\/d\/|id=|open\?id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
                if (m && m[1] && !this.dataset.triedThumb) {
                    this.dataset.triedThumb = "true";
                    this.src = `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200`;
                }
            };
        }
        if (viewCaption) viewCaption.innerText = item.articleImgCaption || "Ảnh đại diện bài viết";
        if (viewImgBox) viewImgBox.style.display = "block";
    } else {
        if (viewImgBox) viewImgBox.style.display = "none";
    }

    let attachBox = document.getElementById("article-view-attach-box");
    if (!attachBox && viewBody) {
        attachBox = document.createElement("div");
        attachBox.id = "article-view-attach-box";
        attachBox.className = "dantri-attach-box";
        viewBody.parentNode.insertBefore(attachBox, viewBody.nextSibling);
    }
    if (attachBox) {
        if (item.url && item.url !== "#" && !item.url.includes("thi.html")) {
            attachBox.innerHTML = `<a href="${item.url}" target="_blank" class="btn-open-attach">📎 Bấm vào đây để mở tài liệu / link đính kèm</a>`;
            attachBox.style.display = "block";
        } else { attachBox.style.display = "none"; }
    }
}

function openDantriArticleModal(item, categoryId, event, startWithEdit = false) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    currentActiveArticleItem = item;
    currentActiveArticleCatId = categoryId || "nhac-nho";
    const modal = document.getElementById("dantri-article-modal");
    const editToggleBtn = document.getElementById("btn-toggle-article-edit");
    if (editToggleBtn) editToggleBtn.style.display = isAdminLoggedIn ? "inline-block" : "none";
    renderArticleViewContent(item);
    if (startWithEdit && isAdminLoggedIn) setArticleEditMode(true);
    else setArticleEditMode(false);
    if (modal) modal.style.display = "flex";
}

function closeArticleModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const modal = document.getElementById("dantri-article-modal");
    if (modal) modal.style.display = "none";
    setArticleEditMode(false);
}

function toggleArticleEditMode(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const editModeDiv = document.getElementById("dantri-article-edit-mode");
    const isCurrentlyEditing = (editModeDiv && editModeDiv.style.display === "block");

    if (isCurrentlyEditing) {
        if (currentActiveArticleItem) {
            currentActiveArticleItem.articleTitle = document.getElementById("edit-article-title")?.value.trim() || currentActiveArticleItem.title;
            currentActiveArticleItem.title = currentActiveArticleItem.articleTitle;
            currentActiveArticleItem.author = document.getElementById("edit-article-author")?.value.trim() || "Thầy Hoan";
            currentActiveArticleItem.sapo = document.getElementById("edit-article-sapo")?.value.trim() || "";
            currentActiveArticleItem.articleImg = document.getElementById("edit-article-img-url")?.value.trim() || "";
            currentActiveArticleItem.articleImgCaption = document.getElementById("edit-article-img-caption")?.value.trim() || "";
            currentActiveArticleItem.articleBody = document.getElementById("edit-article-body")?.value.trim() || "";
        }
        renderArticleViewContent(currentActiveArticleItem);
        setArticleEditMode(false);
    } else { setArticleEditMode(true); }
}

function setArticleEditMode(isEdit) {
    const viewDiv = document.getElementById("dantri-article-view-mode");
    const editDiv = document.getElementById("dantri-article-edit-mode");
    const toggleBtn = document.getElementById("btn-toggle-article-edit");
    const previewImgBox = document.getElementById("article-edit-preview-box");
    const previewImg = document.getElementById("article-edit-preview-img");

    if (isEdit) {
        if (viewDiv) viewDiv.style.display = "none";
        if (editDiv) editDiv.style.display = "block";
        if (toggleBtn) toggleBtn.innerText = "👁️ Xem bài viết";

        const item = currentActiveArticleItem || {};
        document.getElementById("edit-article-title").value = item.articleTitle || item.title || "";
        document.getElementById("edit-article-author").value = item.author || "Thầy Hoan";
        document.getElementById("edit-article-time").value = item.articleTime || formatDantriDateTime(new Date(item.timestamp || Date.now()));
        document.getElementById("edit-article-sapo").value = item.sapo || "";
        document.getElementById("edit-article-img-url").value = item.articleImg || "";
        document.getElementById("edit-article-img-caption").value = item.articleImgCaption || "";
        document.getElementById("edit-article-body").value = item.articleBody || "";

        if (item.articleImg && previewImgBox && previewImg) {
            previewImg.src = toDirectGoogleDriveImageUrl(item.articleImg);
            previewImgBox.style.display = "block";
        } else if (previewImgBox) { previewImgBox.style.display = "none"; }
    } else {
        if (viewDiv) viewDiv.style.display = "block";
        if (editDiv) editDiv.style.display = "none";
        if (toggleBtn) toggleBtn.innerText = "✏️ Chỉnh sửa";
    }
}

function cancelArticleEdit(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    setArticleEditMode(false);
}

async function uploadArticleImageToDrive(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const statusBox = document.getElementById("article-img-upload-status");
    const urlInput = document.getElementById("edit-article-img-url");
    const previewBox = document.getElementById("article-edit-preview-box");
    const previewImg = document.getElementById("article-edit-preview-img");

    if (!GOOGLE_DRIVE_UPLOAD_GAS_URL || GOOGLE_DRIVE_UPLOAD_GAS_URL.includes("DÁN_URL")) {
        alert("⚠️ Bạn chưa cấu hình GOOGLE_DRIVE_UPLOAD_GAS_URL trong app-config.js!"); return;
    }

    if (statusBox) { statusBox.style.display = "block"; statusBox.innerText = `⏳ Đang đọc và tải ảnh "${file.name}" lên Google Drive...`; }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            let base64Data = e.target.result.split(',')[1];
            let mimeType = file.type || "image/jpeg";
            const res = await fetch(GOOGLE_DRIVE_UPLOAD_GAS_URL, {
                method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ filename: file.name, mimeType: mimeType, base64: base64Data })
            });
            const result = await res.json();
            if (result.status === "success" && result.fileUrl) {
                const directUrl = toDirectGoogleDriveImageUrl(result.fileUrl);
                if (urlInput) urlInput.value = directUrl;
                if (previewBox && previewImg) { previewImg.src = directUrl; previewBox.style.display = "block"; }
                if (statusBox) statusBox.innerText = "✅ Tải ảnh lên Google Drive thành công! Ảnh đã sẵn sàng hiển thị.";
            } else { throw new Error(result.message || "Máy chủ Drive không trả về URL"); }
        } catch(err) {
            if (statusBox) statusBox.innerText = "❌ Lỗi: " + err.message;
            alert("Lỗi upload ảnh lên Google Drive: " + err.message);
        }
    };
    reader.readAsDataURL(file);
}

async function saveArticleToFirebase(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!currentActiveArticleItem) return;

    const btn = document.getElementById("btn-save-article-firebase");
    const titleVal = document.getElementById("edit-article-title").value.trim();
    const authorVal = document.getElementById("edit-article-author").value.trim() || "Thầy Hoan";
    const timeVal = document.getElementById("edit-article-time").value.trim() || formatDantriDateTime(new Date());
    const sapoVal = document.getElementById("edit-article-sapo").value.trim();
    const rawImgVal = document.getElementById("edit-article-img-url").value.trim();
    const captionVal = document.getElementById("edit-article-img-caption").value.trim();
    const bodyVal = document.getElementById("edit-article-body").value.trim();

    if (!titleVal) { alert("⚠️ Vui lòng nhập tiêu đề bài viết!"); return; }

    btn.disabled = true; btn.innerText = "⏳ Đang lưu bài...";

    const directImgVal = toDirectGoogleDriveImageUrl(rawImgVal);
    let cardDateStr = "";
    let m = timeVal.match(/(\d{1,2}\/\d{1,2}\/\d{4}(?:\s*-\s*\d{1,2}:\d{2})?)/);
    if (m) cardDateStr = m[1];
    else {
        let d = new Date(); const pad = n => String(n).padStart(2, '0');
        cardDateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    const itemId = currentActiveArticleItem.id || currentActiveArticleItem.firebaseId;

    const payload = {
        title: titleVal, 
        articleTitle: titleVal, 
        author: authorVal, 
        articleTime: timeVal,
        date: cardDateStr, 
        timestamp: currentActiveArticleItem.timestamp || Date.now(),
        sapo: sapoVal, 
        articleImg: directImgVal, 
        articleImgCaption: captionVal, 
        articleBody: bodyVal,
        isDoc: true,
        badgeText: currentActiveArticleItem.badgeText || "MỚI",
        avatar: currentActiveArticleItem.avatar || PRESET_20_AVATARS[0],
        categoryId: currentActiveArticleCatId || "nhac-nho"
    };

    try {
        await fetch(`${FIREBASE_DB_URL}/custom_links/${currentActiveArticleCatId}/${itemId}.json`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });

        if (currentActiveArticleCatId === "nhac-nho") {
            if (!REMINDER_CATEGORY.links) REMINDER_CATEGORY.links = [];
            const exIdx = REMINDER_CATEGORY.links.findIndex(l => l.id === itemId || l.firebaseId === itemId);
            if (exIdx !== -1) {
                REMINDER_CATEGORY.links[exIdx] = { id: itemId, firebaseId: itemId, ...payload };
            } else {
                REMINDER_CATEGORY.links.unshift({ id: itemId, firebaseId: itemId, ...payload });
            }
            REMINDER_CATEGORY.links = sortLinksNewestFirst(REMINDER_CATEGORY.links);
        }

        Object.assign(currentActiveArticleItem, payload);
        alert("🎉 Đã lưu bài viết theo phong cách báo Dân trí thành công!");
        window.location.reload();
    } catch(e) {
        alert("❌ Lỗi khi lưu bài viết: " + e.message);
        btn.disabled = false; btn.innerText = "💾 Lưu bài viết lên hệ thống";
    }
}