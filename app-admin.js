// =========================================================
// THÊM VÀO FILE app-admin.js:
// BỘ XỬ LÝ SOẠN & XUẤT BẢN BÀI BÁO NHẮC NHỞ QUAN TRỌNG
// =========================================================

let currentEditingArticleId = null;
let currentArticleBase64Image = "";

// Hàm tạo chuỗi ngày giờ tiếng Việt tự động chuẩn mẫu: "Thứ bảy, 03/10/2026 - 20:48"
function formatVietnameseDateTime(dateInput = Date.now()) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "---";
    const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    const dayName = dayNames[d.getDay()];
    const pad = n => String(n).padStart(2, '0');
    const DD = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const YYYY = d.getFullYear();
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${dayName}, ${DD}/${MM}/${YYYY} - ${hh}:${mm}`;
}

// Mở modal soạn bài báo nhắc nhở (Tạo mới hoặc Sửa)
function openReminderArticleEditorModal(itemId = null, encodedData = null, event = null) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    currentEditingArticleId = itemId;
    currentArticleBase64Image = "";

    const modal = document.getElementById("article-editor-modal");
    const modalTitle = document.getElementById("article-editor-title");
    const titleInput = document.getElementById("edit-article-title");
    const captionInput = document.getElementById("edit-article-caption");
    const sapoInput = document.getElementById("edit-article-sapo");
    const contentInput = document.getElementById("edit-article-content");
    const authorInput = document.getElementById("edit-article-author");
    const badgeSelect = document.getElementById("edit-article-badge");
    const fileInput = document.getElementById("edit-article-image-file");

    const previewContainer = document.getElementById("article-img-preview-container");
    const imgPreview = document.getElementById("edit-article-img-preview");
    const placeholder = document.getElementById("article-img-placeholder");

    if (fileInput) fileInput.value = "";

    if (itemId && encodedData) {
        const item = JSON.parse(decodeURIComponent(encodedData));
        modalTitle.innerText = "✏️ Chỉnh sửa bài báo Nhắc nhở";
        titleInput.value = item.title || "";
        captionInput.value = item.imageCaption || "";
        sapoInput.value = item.sapo || "";
        contentInput.value = item.content || item.title || "";
        authorInput.value = item.author || "Thầy Phạm Công Hoan";
        badgeSelect.value = item.badgeText || "MỚI";

        if (item.articleImage) {
            currentArticleBase64Image = item.articleImage;
            imgPreview.src = item.articleImage;
            previewContainer.style.display = "block";
            placeholder.style.display = "none";
        } else {
            previewContainer.style.display = "none";
            placeholder.style.display = "block";
        }
    } else {
        modalTitle.innerText = "📰 Soạn bài báo Nhắc nhở quan trọng";
        titleInput.value = "";
        captionInput.value = "";
        sapoInput.value = "";
        contentInput.value = "";
        authorInput.value = "Thầy Phạm Công Hoan";
        badgeSelect.value = "MỚI";
        previewContainer.style.display = "none";
        placeholder.style.display = "block";
    }

    if (modal) modal.style.display = "flex";
}

function closeReminderArticleEditorModal() {
    const modal = document.getElementById("article-editor-modal");
    if (modal) modal.style.display = "none";
    currentEditingArticleId = null;
    currentArticleBase64Image = "";
}

function triggerArticleImageFileInput() {
    const fileInput = document.getElementById("edit-article-image-file");
    if (fileInput) fileInput.click();
}

// Xử lý nén và đọc ảnh từ máy tính
function previewArticleImage(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
        alert("⚠️ Dung lượng ảnh lớn hơn 5MB! Vui lòng chọn ảnh nhỏ hơn để trang tải nhanh.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const rawBase64 = e.target.result;
        
        // Tối ưu và nén ảnh canvas để vừa sắc nét phóng to vừa nhẹ dữ liệu
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            const maxW = 1280;
            if (width > maxW) {
                height = Math.round((height * maxW) / width);
                width = maxW;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            currentArticleBase64Image = canvas.toDataURL("image/jpeg", 0.88);

            const previewContainer = document.getElementById("article-img-preview-container");
            const imgPreview = document.getElementById("edit-article-img-preview");
            const placeholder = document.getElementById("article-img-placeholder");

            if (imgPreview) imgPreview.src = currentArticleBase64Image;
            if (previewContainer) previewContainer.style.display = "block";
            if (placeholder) placeholder.style.display = "none";
        };
        img.src = rawBase64;
    };
    reader.readAsDataURL(file);
}

// Xuất bản bài báo nhắc nhở lên Firebase
async function submitReminderArticle() {
    const title = (document.getElementById("edit-article-title").value || "").trim();
    const caption = (document.getElementById("edit-article-caption").value || "").trim();
    const sapo = (document.getElementById("edit-article-sapo").value || "").trim();
    const content = (document.getElementById("edit-article-content").value || "").trim();
    const author = (document.getElementById("edit-article-author").value || "").trim() || "Thầy Phạm Công Hoan";
    const badge = document.getElementById("edit-article-badge").value || "MỚI";
    const btn = document.getElementById("btn-save-article-submit");

    if (!title) {
        alert("⚠️ Vui lòng nhập tiêu đề bài viết!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "⏳ Đang xuất bản...";

    try {
        const itemId = currentEditingArticleId || ("rem_" + Date.now());
        const nowMs = Date.now();
        const autoDateTimeStr = formatVietnameseDateTime(nowMs);

        const articlePayload = {
            id: itemId,
            firebaseId: itemId,
            categoryId: "nhac-nho",
            isDoc: true,
            isArticle: true,
            title: title,
            sapo: sapo,
            content: content,
            articleImage: currentArticleBase64Image || "",
            imageCaption: caption,
            author: author,
            badgeText: badge,
            isHot: (badge === "HOT"),
            date: autoDateTimeStr,
            formattedDate: autoDateTimeStr,
            timestamp: nowMs,
            avatar: currentArticleBase64Image || "https://i.ibb.co/HTPxzDtT/khung-long-bao-chua.jpg"
        };

        await fetch(`${FIREBASE_DB_URL}/custom_links/nhac-nho/${itemId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(articlePayload)
        });

        alert("🎉 Xuất bản bài báo Nhắc nhở quan trọng thành công!");
        closeReminderArticleEditorModal();
        window.location.reload();
    } catch(err) {
        console.error("Lỗi lưu bài báo:", err);
        alert("❌ Lỗi khi xuất bản bài báo: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "🚀 Xuất bản bài báo";
    }
}