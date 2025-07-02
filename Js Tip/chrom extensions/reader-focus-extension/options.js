document.addEventListener('DOMContentLoaded', () => {
    const hiddenSitesList = document.getElementById('hidden-sites-list');
    const addSiteForm = document.getElementById('add-site-form');
    const newSiteInput = document.getElementById('new-site-input');

    const darkSitesList = document.getElementById('darkmode-sites-list');
    const addDarkForm = document.getElementById('add-dark-site-form');
    const newDarkInput = document.getElementById('new-dark-site-input');

    // 載入並顯示儲存的網站
    const loadHiddenSites = () => {
        console.log('[Options] 正在從 chrome.storage.sync 載入 hiddenSites...');
        chrome.storage.sync.get({ hiddenSites: [] }, (result) => {
            // 檢查是否有執行時錯誤
            if (chrome.runtime.lastError) {
                console.error('[Options] 載入 hiddenSites 時發生錯誤:', chrome.runtime.lastError);
                hiddenSitesList.innerHTML = '<li>讀取設定時發生錯誤，請稍後再試。</li>';
                return;
            }

            console.log('[Options] 成功載入資料:', result);
            const sites = result.hiddenSites;
            hiddenSitesList.innerHTML = ''; // 清空現有列表

            if (sites && sites.length > 0) {
                sites.forEach((site, index) => {
                    const listItem = document.createElement('li');
                    listItem.textContent = site;
                    const removeButton = document.createElement('button');
                    removeButton.textContent = '移除';
                    removeButton.classList.add('remove-site-btn');
                    removeButton.dataset.index = index;
                    listItem.appendChild(removeButton);
                    hiddenSitesList.appendChild(listItem);
                });
            } else {
                console.log('[Options] 隱藏列表為空。');
                const emptyMessage = document.createElement('li');
                emptyMessage.textContent = '目前沒有已隱藏的網站。';
                emptyMessage.style.color = '#666';
                hiddenSitesList.appendChild(emptyMessage);
            }
        });
    };

    const loadDarkSites = () => {
        console.log('[Options] 正在載入 darkModeSites...');
        chrome.storage.sync.get({ darkModeSites: [] }, (result) => {
            if (chrome.runtime.lastError) {
                console.error('[Options] 讀取 darkModeSites 失敗:', chrome.runtime.lastError);
                darkSitesList.innerHTML = '<li>讀取設定時發生錯誤，請稍後再試。</li>';
                return;
            }
            const sites = result.darkModeSites;
            darkSitesList.innerHTML = '';
            if (sites && sites.length > 0) {
                sites.forEach((site, index) => {
                    const li = document.createElement('li');
                    li.textContent = site;
                    const btn = document.createElement('button');
                    btn.textContent = '移除';
                    btn.classList.add('remove-site-btn');
                    btn.dataset.index = index;
                    li.appendChild(btn);
                    darkSitesList.appendChild(li);
                });
            } else {
                const empty = document.createElement('li');
                empty.textContent = '目前沒有自動黑暗模式的網站。';
                empty.style.color = '#666';
                darkSitesList.appendChild(empty);
            }
        });
    };

    // 新增網站
    addSiteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newSite = newSiteInput.value.trim();
        if (newSite) {
            console.log(`[Options] 準備新增網站: ${newSite}`);
            chrome.storage.sync.get({ hiddenSites: [] }, (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[Options] 新增前讀取 hiddenSites 失敗:', chrome.runtime.lastError);
                    return;
                }
                const updatedSites = [...result.hiddenSites, newSite];
                chrome.storage.sync.set({ hiddenSites: updatedSites }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('[Options] 儲存新網站失敗:', chrome.runtime.lastError);
                        return;
                    }
                    console.log('[Options] 網站已成功儲存，重新載入列表中...');
                    newSiteInput.value = '';
                    loadHiddenSites();
                });
            });
        }
    });

    addDarkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newSite = newDarkInput.value.trim();
        if (newSite) {
            chrome.storage.sync.get({ darkModeSites: [] }, (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[Options] 新增前讀取 darkModeSites 失敗:', chrome.runtime.lastError);
                    return;
                }
                const updatedSites = [...result.darkModeSites, newSite];
                chrome.storage.sync.set({ darkModeSites: updatedSites }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('[Options] 儲存新網站失敗:', chrome.runtime.lastError);
                        return;
                    }
                    newDarkInput.value = '';
                    loadDarkSites();
                });
            });
        }
    });

    // 移除網站
    hiddenSitesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-site-btn')) {
            const indexToRemove = parseInt(e.target.dataset.index, 10);
            console.log(`[Options] 準備移除索引為 ${indexToRemove} 的網站`);
            chrome.storage.sync.get({ hiddenSites: [] }, (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[Options] 移除前讀取 hiddenSites 失敗:', chrome.runtime.lastError);
                    return;
                }
                const sites = result.hiddenSites;
                const siteToRemove = sites[indexToRemove];
                const updatedSites = sites.filter((_, index) => index !== indexToRemove);
                chrome.storage.sync.set({ hiddenSites: updatedSites }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('[Options] 移除網站失敗:', chrome.runtime.lastError);
                        return;
                    }
                    console.log(`[Options] 網站 ${siteToRemove} 已成功移除，重新載入列表中...`);
                    loadHiddenSites();
                });
            });
        }
    });

    darkSitesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-site-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            chrome.storage.sync.get({ darkModeSites: [] }, (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[Options] 移除前讀取 darkModeSites 失敗:', chrome.runtime.lastError);
                    return;
                }
                const sites = result.darkModeSites;
                const updated = sites.filter((_, i) => i !== index);
                chrome.storage.sync.set({ darkModeSites: updated }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('[Options] 移除網站失敗:', chrome.runtime.lastError);
                        return;
                    }
                    loadDarkSites();
                });
            });
        }
    });

    // 初始載入
    loadHiddenSites();
    loadDarkSites();
});
