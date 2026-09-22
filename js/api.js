/**
 * MODULE 3: TẦNG KẾT NỐI VÀ THAO TÁC CƠ SỞ DỮ LIỆU FIREBASE RTDB
 */
window.API_SERVICE = {
    parseDateString(dateStr) {
        if (!dateStr) return 0;
        try {
            let parts = String(dateStr).split(' - ');
            let dParts = parts[0].split('/');
            let tParts = parts[1] ? parts[1].split(':') : ['00', '00'];
            return new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1]).getTime();
        } catch(e) {
            return 0;
        }
    },

    async loadDynamicLinks() {
        try {
            const res = await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/custom_links.json`);
            const data = await res.json();
            if (!data) return;

            for (const categoryId in data) {
                const linksObj = data[categoryId];
                let targetCategory = APP_STATE.DAY_THEM_CATEGORIES.find(c => c.id === categoryId) || 
                                     APP_STATE.CHINH_KHOA_CATEGORIES.find(c => c.id === categoryId) ||
                                     (APP_STATE.KHO_TAI_LIEU_FOLDER.id === categoryId ? APP_STATE.KHO_TAI_LIEU_FOLDER : null) ||
                                     (APP_STATE.REMINDER_CATEGORY.id === categoryId ? APP_STATE.REMINDER_CATEGORY : null);
                
                if (targetCategory) {
                    let items = [];
                    for (const linkId in linksObj) {
                        let item = linksObj[linkId];
                        item.firebaseId = linkId;
                        item.categoryId = categoryId;
                        if (!item.timestamp) item.timestamp = this.parseDateString(item.date); 
                        items.push(item);
                    }
                    
                    targetCategory.links.forEach(link => {
                        if (!link.timestamp) link.timestamp = this.parseDateString(link.date);
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
        } catch (e) { console.error("Lỗi tải link Firebase", e); }
    },

    async deleteItem(categoryId, itemId) {
        await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'DELETE' });
        if(itemId.startsWith('quiz_')) {
            await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'DELETE' });
        }
    },

    async renameItem(categoryId, itemId, isDoc, newTitle) {
        await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ title: newTitle }) });
        if (!isDoc && itemId.startsWith('quiz_')) {
            await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ title: newTitle }) });
        }
    },

    async toggleShuffle(categoryId, itemId, isChecked) {
        await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ isShuffled: isChecked }) });
        await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'PATCH', body: JSON.stringify({ isShuffled: isChecked }) });
    },

    async updateBadge(categoryId, itemId, payload) {
        await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/custom_links/${categoryId}/${itemId}.json`, { method: 'PATCH', body: JSON.stringify(payload) });
        if (itemId.startsWith('quiz_')) {
            await fetch(`${APP_CONFIG.FIREBASE_DB_URL}/quizzes/${itemId}.json`, { method: 'PATCH', body: JSON.stringify(payload) });
        }
    }
};
```