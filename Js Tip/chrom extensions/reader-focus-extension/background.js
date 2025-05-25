try {
  // 確保 html2md.js 和 r-agent-helper.js 已複製到擴充功能的根目錄
  importScripts('r-agent-helper.js', 'html2md.js');
} catch (e) {
  console.error("載入轉換腳本失敗:", e);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ // 只保留「複製為 Markdown」選單項目
    id: "copyAsMarkdown",
    title: "複製為 Markdown",
    contexts: ["selection"] // 只在選取內容時顯示
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copyAsMarkdown" && tab) { // 只處理「複製為 Markdown」點擊事件
    chrome.tabs.sendMessage(tab.id, { action: "getSelectedHtml" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("請求選取的 HTML 時發生錯誤:", chrome.runtime.lastError.message);
        return;
      }
      if (response && typeof response.html === 'string') {
        if (typeof launchMkTransform === 'function') {
          launchMkTransform(response.html)
            .then(markdownResult => {
              const markdownText = markdownResult && markdownResult.str ? markdownResult.str : (typeof markdownResult === 'string' ? markdownResult : '');
              if (markdownText) {
                navigator.clipboard.writeText(markdownText)
                  .then(() => {
                    console.log("Markdown 已複製到剪貼簿。");
                    // (可選) 顯示通知
                    // chrome.notifications.create({
                    //   type: 'basic',
                    //   iconUrl: 'images/icon48.png', // 請確保此圖示存在
                    //   title: '複製成功',
                    //   message: '選取的內容已複製為 Markdown！'
                    // });
                  })
                  .catch(err => console.error("將 Markdown 複製到剪貼簿失敗:", err));
              } else {
                console.warn("Markdown 轉換結果為空字串。");
              }
            })
            .catch(err => console.error("HTML 轉換為 Markdown 失敗:", err));
        } else {
          console.error("launchMkTransform 函式不可用。請確保腳本已正確載入。");
        }
      } else {
        console.warn("未從內容腳本收到 HTML 或回應格式無效。");
      }
    });
  }
});
