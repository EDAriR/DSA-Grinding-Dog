function logHtmlSnippet(prefix, html) {
  const maxLen = 200;
  const snippet = html.length > maxLen
    ? `${html.slice(0, 100)}...${html.slice(-100)}`
    : html;
  console.log(`${prefix}:`, snippet);
}

function logMarkdownPreview(prefix, markdown) {
  const lines = markdown.split('\n');
  const first = lines[0] || '';
  const last = lines[lines.length - 1] || '';
  console.log(`${prefix} 首行: ${first} | 末行: ${last}`);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "copyAsMarkdown",
    title: "複製選取文字為 Markdown",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "copyPageAsMarkdown",
    title: "整頁複製為 Markdown",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || typeof tab.id === 'undefined') {
    console.error('無效的分頁資訊，無法傳送訊息。');
    return;
  }

  const actionForHtml = info.menuItemId === 'copyAsMarkdown' ? 'getSelectedHtml' : 'getPageHtml';
  const shouldRemoveHidden = info.menuItemId === 'copyPageAsMarkdown';
  const logPrefix = `[${info.menuItemId}]`; // 用於區分日誌來源

  console.log(`${logPrefix} 監聽器觸發，準備請求 HTML。 Action: ${actionForHtml}`);

  // 步驟 1: 從內容腳本取得 HTML
  chrome.tabs.sendMessage(tab.id, { action: actionForHtml }, (htmlResponse) => {
    console.log(`${logPrefix} ${actionForHtml} 回呼函式已執行。`);
    if (chrome.runtime.lastError) {
      console.error(`${logPrefix} 請求 HTML 時發生錯誤:`, chrome.runtime.lastError.message);
      return;
    }

    if (htmlResponse && typeof htmlResponse.html === 'string') {
      logHtmlSnippet(`${logPrefix} 取得 HTML`, htmlResponse.html);

      // 步驟 2: 將 HTML 傳送給內容腳本進行解析和 Markdown 轉換
      console.log(`${logPrefix} 準備將 HTML 傳送給內容腳本 (action: actualConvertToMarkdown)。`);
      chrome.tabs.sendMessage(tab.id, {
        action: 'actualConvertToMarkdown', // 新的動作名稱
        html: htmlResponse.html,
        removeHidden: shouldRemoveHidden
      }, (markdownResponse) => {
        console.log(`${logPrefix} actualConvertToMarkdown 回呼函式已執行。`);
        if (chrome.runtime.lastError) {
          console.error(`${logPrefix} 從內容腳本接收 Markdown 時發生錯誤:`, chrome.runtime.lastError.message);
          return;
        }

        if (markdownResponse && markdownResponse.success && typeof markdownResponse.markdown === 'string') {
          const markdownText = markdownResponse.markdown;
          // 避免在主控台印出過長的 Markdown 字串，logMarkdownPreview 較為合適
          logMarkdownPreview(`${logPrefix} 從內容腳本成功收到 Markdown`, markdownText);
          
          // 步驟 3: 指示內容腳本複製 Markdown 到剪貼簿
          console.log(`${logPrefix} 準備將 Markdown 傳送給內容腳本進行複製 (action: copyMarkdown)。`);
          chrome.tabs.sendMessage(tab.id, { action: 'copyMarkdown', markdown: markdownText }, (copyRes) => {
            console.log(`${logPrefix} copyMarkdown 回呼函式已執行。`);
            if (chrome.runtime.lastError) {
              console.error(`${logPrefix} 複製 Markdown 失敗:`, chrome.runtime.lastError.message);
              return;
            }
            if (copyRes && copyRes.success) {
              logMarkdownPreview(`${logPrefix} 複製完成`, markdownText);
            } else {
              console.warn(`${logPrefix} 內容腳本回報複製失敗。回應:`, copyRes);
            }
          });
        } else {
          console.warn(`${logPrefix} 未從內容腳本收到有效的 Markdown。回應:`, markdownResponse);
        }
      });
    } else {
      console.warn(`${logPrefix} 未從內容腳本收到 HTML 或回應格式無效。回應:`, htmlResponse);
    }
  });
});
