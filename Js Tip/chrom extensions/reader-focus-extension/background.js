try {
  importScripts('turndown.js');
} catch (e) {
  console.error('無法載入 Turndown:', e);
}

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

function convertHtmlToMarkdown(html, removeHidden = false) {
  if (typeof TurndownService !== 'function') {
    throw new Error('TurndownService 未載入');
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  if (removeHidden) {
    doc.querySelectorAll('[style*="display:none" i], [hidden]').forEach(el => el.remove());
  }
  const turndownService = new TurndownService();
  return turndownService.turndown(doc.body || doc);

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
        console.error('請求選取的 HTML 時發生錯誤:', chrome.runtime.lastError.message);
        return;
      }
      if (response && typeof response.html === 'string') {
        logHtmlSnippet('取得選取 HTML', response.html);
        try {
          const markdownText = convertHtmlToMarkdown(response.html);
          if (markdownText) {
            logMarkdownPreview('即將寫入剪貼簿', markdownText);
            chrome.tabs.sendMessage(tab.id, { action: 'copyMarkdown', markdown: markdownText }, res => {
              if (chrome.runtime.lastError) {
                console.error('複製 Markdown 失敗:', chrome.runtime.lastError.message);
                return;
              }
              if (res && res.success) {
                logMarkdownPreview('複製完成', markdownText);
              } else {
                console.warn('內容腳本回報複製失敗');
              }
            });
          } else {
            console.warn('Markdown 轉換結果為空字串。');
          }
        } catch (err) {
          console.error('HTML 轉換為 Markdown 失敗:', err);
        }
      } else {
        console.warn('未從內容腳本收到 HTML 或回應格式無效。');
      }
    });
  } else if (info.menuItemId === 'copyPageAsMarkdown' && tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'getPageHtml' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('請求頁面 HTML 時發生錯誤:', chrome.runtime.lastError.message);
        return;
      }
      if (response && typeof response.html === 'string') {
        logHtmlSnippet('取得整頁 HTML', response.html);
        try {
          const markdownText = convertHtmlToMarkdown(response.html, true);
          if (markdownText) {
            logMarkdownPreview('即將寫入剪貼簿', markdownText);
            chrome.tabs.sendMessage(tab.id, { action: 'copyMarkdown', markdown: markdownText }, res => {
              if (chrome.runtime.lastError) {
                console.error('複製 Markdown 失敗:', chrome.runtime.lastError.message);
                return;
              }
              if (res && res.success) {
                logMarkdownPreview('複製完成', markdownText);
              } else {
                console.warn('內容腳本回報複製失敗');
              }
            });
          } else {
            console.warn('Markdown 轉換結果為空字串。');
          }
        } catch (err) {
          console.error('HTML 轉換為 Markdown 失敗:', err);
        }
      } else {
        console.warn('未從內容腳本收到 HTML 或回應格式無效。');
      }
    });
  }
});
