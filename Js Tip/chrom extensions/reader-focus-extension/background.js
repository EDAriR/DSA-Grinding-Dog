try {
  importScripts('html2md.js');
} catch (e) {
  console.error('無法載入轉換腳本:', e);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ // 只保留「複製為 Markdown」選單項目
    id: "copyAsMarkdown",
    title: "複製為 Markdown",
    contexts: ["selection"] // 只在選取內容時顯示
  });
  chrome.contextMenus.create({
    id: "copyPageAsMarkdown",
    title: "整頁複製為 Markdown",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copyAsMarkdown' && tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'getSelectedHtml' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("請求選取的 HTML 時發生錯誤:", chrome.runtime.lastError.message);
        return;
      }
      if (response && typeof response.html === 'string') {
        try {
          const markdownText = convertHtmlToMarkdown(response.html);
          if (markdownText) {
            navigator.clipboard.writeText(markdownText)
              .then(() => {
                console.log('Markdown 已複製到剪貼簿。');
              })
              .catch(err => console.error('將 Markdown 複製到剪貼簿失敗:', err));
          } else {
            console.warn('Markdown 轉換結果為空字串。');
          }
        } catch (err) {
          console.error('HTML 轉換為 Markdown 失敗:', err);
        }
      } else {
        console.warn("未從內容腳本收到 HTML 或回應格式無效。");
      }
    });
  } else if (info.menuItemId === "copyPageAsMarkdown" && tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'getPageHtml' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("請求頁面 HTML 時發生錯誤:", chrome.runtime.lastError.message);
        return;
      }
      if (response && typeof response.html === 'string') {
        try {
          const markdownText = convertHtmlToMarkdown(response.html, true);
          if (markdownText) {
            navigator.clipboard.writeText(markdownText)
              .then(() => {
                console.log('Markdown 已複製到剪貼簿。');
              })
              .catch(err => console.error('將 Markdown 複製到剪貼簿失敗:', err));
          } else {
            console.warn('Markdown 轉換結果為空字串。');
          }
        } catch (err) {
          console.error('HTML 轉換為 Markdown 失敗:', err);
        }
      } else {
        console.warn("未從內容腳本收到 HTML 或回應格式無效。");
      }
    });
  }
});
