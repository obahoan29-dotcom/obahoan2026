// =========================================================
// FILE: exam-render.js
// RENDER GIAO DIỆN CÂU HỎI, NỘP TỰ LUẬN DRIVE TRONG PHÒNG THI & MATHJAX
// =========================================================

function isPart4Question(q) {
    if (!q) return false;
    if (q.part === 4 || q.isPart4 === true) return true;
    if (q.type === "essay" || q.type === "essay_answer" || q.type === "part4") return true;
    const txt = String(q.question || "").toUpperCase();
    if (txt.includes("PHẦN IV") || txt.includes("PHAN IV") || txt.includes("PHẦN 4") || txt.includes("PHAN 4")) {
        return true;
    }
    return false;
}

function formatQuestionText(text) {
    if (!text) return "";
    return text.replace(/(^|[^:])\/\/\s*([^\r\n<]+)/g, function(match, prefix, content) {
        return prefix + '<span style="color: #78350f; font-weight: 800;">// ' + content.trim() + '</span>';
    });
}

function renderQuizLayout(questions, imageMap) { 
    const container = document.getElementById('dynamic-questions-container'); 
    container.innerHTML = ''; 
    
    // Tách riêng biệt 4 phần theo đúng chuẩn cấu trúc
    const p1List = questions.filter(q => q.type === "multiple_choice" && !isPart4Question(q)); 
    const p2List = questions.filter(q => q.type === "true_false" && !isPart4Question(q)); 
    const p3List = questions.filter(q => (q.type === "short_answer") && !isPart4Question(q)); 
    const p4List = questions.filter(q => isPart4Question(q)); 
    
    totalQuestionsCount = questions.length; 
    let displayIndex = 1; 
    let html = ""; 
    const isAdminMode = typeof checkIsAdminPreviewMode === 'function' && checkIsAdminPreviewMode();

    function buildAdminImageUploader(q, qIdx) {
        if (!isAdminMode) return "";
        const imgKey = q.imageKey || `img_q_${q.id}`;
        const currentImg = getEffectiveImageUrl(q, imageMap);

        const hasOriginalImg = Boolean(
            (currentImg && currentImg.trim() !== "") ||
            (q.imageKey && String(q.imageKey).trim() !== "") ||
            (q.imageUrl && String(q.imageUrl).trim() !== "")
        );
        const hasActiveImg = Boolean(currentImg && currentImg.trim() !== "");

        return `
        <div class="admin-img-uploader-zone" id="zone-q-${q.id}" tabindex="0" title="Click vào đây và bấm Ctrl+V để dán ảnh chụp màn hình từ Snipping Tool">
            <div class="admin-uploader-btn-group">
                <button type="button" class="btn-admin-paste-img" onclick="triggerPastePrompt(${q.id}, '${imgKey}')">
                    📋 Dán ảnh (Ctrl+V)
                </button>
                <button type="button" class="btn-admin-file-img" onclick="document.getElementById('input-file-q-${q.id}').click()">
                    📁 Chọn tệp
                </button>
                <button type="button" class="btn-admin-del-img" id="btn-del-img-${q.id}" onclick="deleteQuestionImage(${q.id}, '${imgKey}', ${qIdx})" style="${hasActiveImg ? 'display:inline-flex;' : 'display:none;'}">
                    🗑️ Xóa ảnh
                </button>
                <input type="file" id="input-file-q-${q.id}" accept="image/*" style="display:none;" onchange="handleAdminFileSelected(this, ${q.id}, '${imgKey}', ${qIdx})">
                
                ${hasOriginalImg ? `
                <span class="admin-badge-has-img" id="badge-has-img-${q.id}">
                    🔴 [CÂU NÀY CÓ ẢNH / HÌNH VẼ MINH HỌA]
                </span>` : `
                <span class="admin-badge-has-img" id="badge-has-img-${q.id}" style="display:none;">
                    🔴 [CÂU NÀY CÓ ẢNH / HÌNH VẼ MINH HỌA]
                </span>`}
                
                <span class="admin-uploader-hint">💡 Cắt bằng Snipping Tool rồi bấm chuột vào đây ấn <b>Ctrl + V</b></span>
            </div>
            <span class="admin-uploader-status" id="img-status-${q.id}"></span>
        </div>`;
    }

    function buildPart4RowHtml(qId) {
        return `
        <div class="part4-row-container"> 
            <div class="part4-left-col"> 
                <input type="text" class="short-input-box" id="q${qId}-input" placeholder="Nhập đáp số của bạn..." oninput="onShortInputChange(${qId})"> 
            </div> 
            <div class="part4-right-col"> 
                <div style="display:flex; gap:6px; flex-wrap:wrap; width:100%;">
                    <button type="button" class="btn-photo-trigger" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); flex:1;" onclick="triggerExamRoomDriveUpload(${qId})" title="Chụp hoặc chọn ảnh bài làm tự luận để lưu thẳng vào Google Drive 5TB"> 
                        📷 Chụp ảnh nộp Drive
                    </button> 
                    <button type="button" class="btn-photo-trigger" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; width:auto; padding:9px 10px;" onclick="toggleSubPadlet(${qId})" title="Hoặc nộp qua Padlet dự phòng"> 
                        ▾
                    </button>
                </div>
                <span id="drive-upload-status-${qId}" class="drive-up-status" style="display:none; font-size:11.5px; font-weight:800; margin-top:4px;"></span>
                <div id="sub-padlet-dropdown-${qId}" class="sub-padlet-dropdown"> 
                    <div style="font-size:11px; font-weight:800; color:#64748b; padding-bottom:4px; border-bottom:1px solid #f1f5f9;">PADLET DỰ PHÒNG:</div>
                    <a href="https://padlet.com/obahoan29/11a-nop-tu-luan-padlet-160926-s023me0a6si1mqhqpnb4" target="_blank" rel="noopener noreferrer" class="btn-padlet-opt" onclick="trackPadletClick(${qId})"> 
                        📌 11A nộp padlet 
                    </a> 
                    <a href="https://padlet.com/obahoan29/11c-nop-tu-luan-padlet-160926-s023me1v17byc9z8qj13" target="_blank" rel="noopener noreferrer" class="btn-padlet-opt" onclick="trackPadletClick(${qId})"> 
                        📌 11C nộp Padlet 
                    </a> 
                    <a href="https://padlet.com/obahoan29/10p-nop-tu-luan-tu-05-09-2026-s023mdx0qopg0az79ix0" target="_blank" rel="noopener noreferrer" class="btn-padlet-opt" onclick="trackPadletClick(${qId})"> 
                        📌 10P nộp Padlet 
                    </a> 
                    <a href="https://padlet.com/obahoan42/nop-tu-luan-11e-padlet-s024j7r2sdb80rqmahq7" target="_blank" rel="noopener noreferrer" class="btn-padlet-opt" onclick="trackPadletClick(${qId})"> 
                        📌 11E chụp tự luận Padlet 
                    </a> 
                </div> 
            </div> 
        </div>`;
    }

    // YÊU CẦU 1 & 2: THANH NỘP TỰ LUẬN DRIVE CHUNG Ở ĐẦU MỌI ĐỀ THI
    const globalDriveUploadBanner = `
        <div style="margin-bottom: 15px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1.5px solid #86efac; border-radius: 14px; padding: 11px 15px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.1);">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">📁</span>
                <div>
                    <b style="color: #166534; font-size: 13.5px; display: block;">Nộp bài làm tự luận / Giấy nháp vào Google Drive 5TB</b>
                    <span style="font-size: 11.5px; color: #475569; font-weight: 600;">Toàn bộ ảnh chụp sẽ được lưu thẳng vào thư mục của đề này trên Google Drive của Thầy</span>
                </div>
            </div>
            <button type="button" class="btn-tuluan-modal-trigger" style="padding: 7px 15px; font-size: 12px; background: linear-gradient(135deg, #16a34a, #15803d); border-color: #22c55e;" onclick="triggerExamRoomDriveUpload('chung')">
                📷 Chụp ảnh nộp Drive
            </button>
        </div>
    `;

    // PHẦN 1: TRẮC NGHIỆM 4 PHƯƠNG ÁN
    if (p1List.length > 0) { 
        html += `<div class="exam-section-banner"><div class="section-icon">📑</div><div class="section-text"><h3>PHẦN 1. TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN</h3><p>Chọn duy nhất 01 phương án đúng trong các phương án A, B, C, D</p></div></div>`; 
        p1List.forEach((q, qIdx) => { 
            window.SECURE_VAULT.questionData[q.id] = q; 
            const letters = ["A", "B", "C", "D"]; 
            
            if (q.correct !== undefined) {
                window.SECURE_VAULT.answers[`q${q.id}`] = (typeof q.correct === 'number') 
                    ? letters[q.correct] 
                    : String(q.correct).trim().toUpperCase();
            }
            if (q.explanation) window.SECURE_VAULT.explanations[`q${q.id}`] = q.explanation;
            delete q.correct;
            delete q.explanation;

            const imgUrl = getEffectiveImageUrl(q, imageMap);
            const imgHTML = buildImgHtml(imgUrl, q.id); 
            const uploaderHTML = buildAdminImageUploader(q, qIdx);

            html += `<div class="question-card" id="q-card-${q.id}" data-qid="${q.id}" data-imgkey="${q.imageKey || ''}" data-qidx="${qIdx}"> 
                <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div> 
                ${uploaderHTML}
                ${imgHTML} 
                <div class="options-list grid-2"> ${q.options.map((opt, oIdx) => `<label class="opt-label" id="opt-box-${q.id}-${letters[oIdx]}" onclick="selectOption(${q.id}, '${letters[oIdx]}')"> <input type="radio" name="q${q.id}" value="${letters[oIdx]}"> <span class="opt-circle">${letters[oIdx]}</span> <span class="opt-text">${opt}</span> </label>`).join('')} </div> 
            </div>`; 
            displayIndex++; 
        }); 
    } 

    // PHẦN 2: TRẮC NGHIỆM ĐÚNG SAI
    if (p2List.length > 0) { 
        html += `<div class="exam-section-banner" style="background: linear-gradient(135deg, #7c3aed, #4f46e5);"><div class="section-icon">⚖️</div><div class="section-text"><h3>PHẦN 2. TRẮC NGHIỆM ĐÚNG SAI</h3><p>Thí sinh chọn Đúng hoặc Sai cho từng mệnh đề a), b), c), d)</p></div></div>`; 
        p2List.forEach((q, qIdx) => { 
            window.SECURE_VAULT.questionData[q.id] = q; 
            const imgUrl = getEffectiveImageUrl(q, imageMap);
            const imgHTML = buildImgHtml(imgUrl, q.id); 
            const uploaderHTML = buildAdminImageUploader(q, p1List.length + qIdx);

            let rows = ""; 
            q.statements.forEach((st) => { 
                const subKey = `q${q.id}_${st.id}`; 
                if (st.correct !== undefined) {
                    window.SECURE_VAULT.answers[subKey] = (st.correct === true || String(st.correct).toLowerCase() === 'đúng' || String(st.correct).toLowerCase() === 'true') ? "Đúng" : "Sai";
                }
                delete st.correct;
                rows += `<tr><td><b>${st.id})</b> ${st.statement}</td> <td width="70" align="center"><input type="radio" name="${subKey}" value="Đúng" onchange="onStatementChange('${subKey}')"></td> <td width="70" align="center"><input type="radio" name="${subKey}" value="Sai" onchange="onStatementChange('${subKey}')"></td></tr>`; 
            }); 
            if (q.explanation) {
                window.SECURE_VAULT.explanations[`q${q.id}`] = q.explanation;
                delete q.explanation;
            }
            html += `<div class="question-card" id="q-card-${q.id}" data-qid="${q.id}" data-imgkey="${q.imageKey || ''}" data-qidx="${p1List.length + qIdx}"> 
                <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div> 
                ${uploaderHTML}
                ${imgHTML} 
                <div class="tf-table-box"> <table class="tf-table"><thead><tr><th>Mệnh đề</th><th>Đúng</th><th>Sai</th></tr></thead><tbody>${rows}</tbody></table> </div> 
            </div>`; 
            displayIndex++; 
        }); 
    } 

    // PHẦN 3: TRẢ LỜI NGẮN
    if (p3List.length > 0) { 
        html += `<div class="exam-section-banner" style="background: linear-gradient(135deg, #0d9488, #059669);"><div class="section-icon">✍️</div><div class="section-text"><h3>PHẦN 3. TRẢ LỜI NGẮN</h3><p>Nhập đáp số chính xác vào ô trống</p></div></div>`; 
        p3List.forEach((q, qIdx) => { 
            window.SECURE_VAULT.questionData[q.id] = q; 
            if (q.correctAnswer !== undefined) {
                window.SECURE_VAULT.answers[`q${q.id}`] = String(q.correctAnswer).trim();
                delete q.correctAnswer;
            }
            if (q.explanation) {
                window.SECURE_VAULT.explanations[`q${q.id}`] = q.explanation;
                delete q.explanation;
            }
            const imgUrl = getEffectiveImageUrl(q, imageMap);
            const imgHTML = buildImgHtml(imgUrl, q.id); 
            const uploaderHTML = buildAdminImageUploader(q, p1List.length + p2List.length + qIdx);

            html += `
            <div class="question-card" id="q-card-${q.id}" data-qid="${q.id}" data-imgkey="${q.imageKey || ''}" data-qidx="${p1List.length + p2List.length + qIdx}"> 
                <div class="q-header"><div class="q-num-badge">${displayIndex}</div><div class="q-content-text">${formatQuestionText(q.question)}</div></div> 
                ${uploaderHTML}
                ${imgHTML} 
                <div class="part4-row-container">
                    <div class="part4-left-col" style="flex:1;">
                        <input type="text" class="short-input-box" id="q${q.id}-input" placeholder="Nhập đáp số của bạn..." oninput="onShortInputChange(${q.id})">
                    </div>
                </div>
            </div>`; 
            displayIndex++; 
        }); 
    } 

    // PHẦN 4: TỰ LUẬN ĐIỀN ĐÁP ÁN NGẮN & NỘP BÀI TỰ LUẬN
    if (p4List.length > 0) { 
        html += `<div class="exam-section-banner" style="background: linear-gradient(135deg, #ea580c, #c2410c); margin-top: 20px;"> 
            <div class="section-icon">📝</div> 
            <div class="section-text"> 
                <h3>PHẦN IV. CÂU TỰ LUẬN ĐIỀN ĐÁP ÁN NGẮN</h3> 
                <p>Điền đáp số VÀ chụp ảnh bài làm tự luận nộp trực tiếp vào Google Drive 5TB của Thầy</p> 
            </div> 
        </div>`; 
        p4List.forEach((q, qIdx) => { 
            window.SECURE_VAULT.questionData[q.id] = q; 
            if (q.correctAnswer !== undefined) {
                window.SECURE_VAULT.answers[`q${q.id}`] = String(q.correctAnswer).trim(); 
                delete q.correctAnswer;
            }
            if (q.explanation) {
                window.SECURE_VAULT.explanations[`q${q.id}`] = q.explanation;
                delete q.explanation;
            }
            const imgUrl = getEffectiveImageUrl(q, imageMap);
            const imgHTML = buildImgHtml(imgUrl, q.id); 
            const uploaderHTML = buildAdminImageUploader(q, p1List.length + p2List.length + p3List.length + qIdx);

            html += `
            <div class="question-card" id="q-card-${q.id}" data-qid="${q.id}" data-imgkey="${q.imageKey || ''}" data-qidx="${p1List.length + p2List.length + p3List.length + qIdx}"> 
                <div class="q-header"> 
                    <div class="q-num-badge" style="background: linear-gradient(135deg, #ea580c, #c2410c);">${displayIndex}</div> 
                    <div class="q-content-text">${formatQuestionText(q.question)}</div> 
                </div> 
                ${uploaderHTML}
                ${imgHTML} 
                ${buildPart4RowHtml(q.id)}
            </div>`; 
            displayIndex++; 
        }); 
    } 

    container.innerHTML = globalDriveUploadBanner + html; 
    renderQuestionPalette(questions); 
    setupScrollObserver(); 
    if (typeof updateProgress === 'function') updateProgress(); 

    if (isAdminMode && typeof setupAdminClipboardPasteListener === 'function') {
        setupAdminClipboardPasteListener();
    }
}

function renderQuestionPalette(questions) { 
    const container = document.getElementById('q-nav-scroll-container'); 
    if (!container) return; 
    let html = ""; 
    let idx = 1; 
    questions.forEach(q => { 
        html += `<div class="q-circle" id="q-nav-btn-${q.id}" onclick="scrollToQuestion(${q.id})" title="Câu ${idx}">${idx}</div>`; 
        idx++; 
    }); 
    container.innerHTML = html; 
}

function scrollQPalette(offset) { 
    const container = document.getElementById("q-nav-scroll-container"); 
    if (container) container.scrollBy({ left: offset, behavior: 'smooth' }); 
}

function scrollToQuestion(qId) { 
    const target = document.getElementById(`q-card-${qId}`); 
    if (target) { 
        const headerOffset = window.innerWidth <= 640 ? 72 : 82; 
        const elementPosition = target.getBoundingClientRect().top; 
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset; 
        window.scrollTo({ top: offsetPosition, behavior: "smooth" }); 
        highlightActiveCircle(qId); 
    } 
}

function highlightActiveCircle(qId) { 
    if (currentActiveQId === qId) return; 
    if (currentActiveQId) { 
        const prev = document.getElementById(`q-nav-btn-${currentActiveQId}`); 
        if (prev) prev.classList.remove('active'); 
    } 
    currentActiveQId = qId; 
    const curr = document.getElementById(`q-nav-btn-${qId}`); 
    if (curr) { 
        curr.classList.add('active'); 
        const scrollContainer = document.getElementById("q-nav-scroll-container");
        if (scrollContainer) {
            const containerWidth = scrollContainer.offsetWidth;
            const btnLeft = curr.offsetLeft;
            const btnWidth = curr.offsetWidth;
            scrollContainer.scrollTo({
                left: btnLeft - (containerWidth / 2) + (btnWidth / 2),
                behavior: 'smooth'
            });
        }
    } 
}

function setupScrollObserver() { 
    if (window._qCardObserver) window._qCardObserver.disconnect();
    const options = { root: null, rootMargin: '-85px 0px -50% 0px', threshold: 0.1 }; 
    window._qCardObserver = new IntersectionObserver((entries) => { 
        let bestEntry = null;
        entries.forEach(entry => {
            if (entry.isIntersecting) { 
                if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
                    bestEntry = entry;
                }
            } 
        }); 
        if (bestEntry && bestEntry.target) {
            const id = bestEntry.target.id.replace('q-card-', ''); 
            highlightActiveCircle(id); 
        }
    }, options); 
    document.querySelectorAll('.question-card').forEach(card => window._qCardObserver.observe(card)); 
}

window.isPart4Question = isPart4Question;
