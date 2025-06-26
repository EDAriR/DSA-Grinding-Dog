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

// --- 全頁截圖功能 ---

// 監聽來自 popup 或其他地方的截圖請求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'takeScreenshot') {
    console.log('[BG] 截圖流程開始');
    startScreenshotProcess();
    sendResponse({ success: true }); // 立即回覆，表示已收到請求
    return true; // 保持通道開啟以進行非同步操作
  }

  // 添加對截圖進度報告的支援
  if (message.action === 'screenshotProgress') {
    console.log(`[BG] 截圖進度: ${message.percentage}% (${message.current}/${message.total}), 已截取 ${message.imageCount} 張`);
    sendResponse({ received: true });
    return true;
  }
  
  // 添加對截圖錯誤報告的支援
  if (message.action === 'screenshotError') {
    console.error(`[BG] 截圖錯誤: ${message.error} (位置: ${message.position}/${message.total})`);
    sendResponse({ received: true });
    return true;
  }
  
  // 添加對嚴重錯誤的支援
  if (message.action === 'screenshotFatalError') {
    console.error(`[BG] 嚴重截圖錯誤: ${message.error}`);
    // 顯示提示給使用者
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
          if (dataUrl) {
            // 發生錯誤時至少顯示當前畫面
            const previewUrl = chrome.runtime.getURL('preview.html');
            chrome.tabs.create({
              url: `${previewUrl}?originalImages=${encodeURIComponent(JSON.stringify([dataUrl]))}&error=true&errorMsg=${encodeURIComponent(message.error)}`
            });
          }
        });
      }
    });
    sendResponse({ received: true });
    return true;
  }
});

async function startScreenshotProcess() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    console.error('[BG] 截圖失敗：找不到活動分頁。');
    return;
  }
  // 全頁滾動到底部截圖，直接傳給預覽頁面處理拼接
  try {
    console.log(`[BG] 全頁滾動截圖，目標分頁：${tab.url}`);
    const [{ result: dataUrls }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrollAndCapture
    });
    if (!dataUrls || !Array.isArray(dataUrls) || dataUrls.length === 0) {
      console.error('[BG] scrollAndCapture 未取得任何截圖');
      return;
    }

    console.log(`[BG] 截圖成功，共 ${dataUrls.length} 張，開啟預覽頁面`);
    
    // 使用訊息傳遞方式，避免 URL 長度限制問題
    const previewUrl = chrome.runtime.getURL('preview.html');
    console.log(`[BG] 預覽頁面 URL: ${previewUrl}`);
    
    try {
      const newTab = await chrome.tabs.create({
        url: previewUrl
      });
      console.log('[BG] 已開啟預覽頁面，分頁 ID:', newTab.id);
      
      // 等待頁面載入完成，然後傳送圖片資料
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(newTab.id, {
            action: 'loadImages',
            originalImages: dataUrls
          });
          console.log('[BG] 已傳送圖片數據到預覽頁面');
        } catch (msgError) {
          console.error('[BG] 傳送圖片數據失敗:', msgError);
          // 如果訊息傳遞失敗，嘗試重新載入頁面並使用 URL 參數（僅第一張圖片）
          try {
            const fallbackUrl = `${previewUrl}?originalImages=${encodeURIComponent(JSON.stringify([dataUrls[0]]))}`;
            await chrome.tabs.update(newTab.id, { url: fallbackUrl });
            console.log('[BG] 使用第一張圖片作為後備方案');
          } catch (fallbackError) {
            console.error('[BG] 後備方案也失敗:', fallbackError);
          }
        }
      }, 2000); // 增加等待時間，確保頁面完全載入
      
    } catch (err) {
      console.error('[BG] 開啟預覽頁面失敗:', err);
    }
  } catch (e) {
    console.error(`[BG] 全頁滾動截圖流程發生錯誤: ${e && e.message ? e.message : e}`);
    
    if (tab) {
      console.error(`[BG] 當前分頁資訊: url=${tab.url}, status=${tab.status}, title=${tab.title}`);
    }
    
    // 發生錯誤時，嘗試直接截一張當前畫面
    try {
      chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }, (dataUrl) => {
        if (dataUrl) {
          const previewUrl = chrome.runtime.getURL('preview.html');
          chrome.tabs.create({
            url: `${previewUrl}?originalImages=${encodeURIComponent(JSON.stringify([dataUrl]))}&error=true&errorMsg=${encodeURIComponent(e && e.message ? e.message : e)}`
          });
        }
      });
    } catch (captureError) {
      console.error('[BG] 錯誤後備截圖也失敗:', captureError);
    }
  }
}

// 這個函式將被注入到目標頁面執行
async function scrollAndCapture() {
  // 函式庫：等待指定時間
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    console.log('[ScrollCapture] 開始全頁截圖');
    const originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden'; // 隱藏滾動條

    const totalHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    let currentScroll = 0;
    const dataUrls = [];
    let currentStep = 0;

    while (currentScroll < totalHeight) {
      currentStep++;
      console.log(`[ScrollCapture] 第 ${currentStep} 次滾動，位置 ${currentScroll}/${totalHeight} (${Math.round(currentScroll/totalHeight*100)}%)`);
      window.scrollTo(0, currentScroll);
      await wait(900); // 延長等待，避免超過速率限制

      try {
        // 捕獲可見區域，增加錯誤處理與超時
        const dataUrl = await Promise.race([
          new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, response => {
              if (!response || !response.dataUrl) {
                console.error(`[ScrollCapture] 第 ${currentStep} 次截圖：回傳值無效`);
                resolve(null);
              } else {
                resolve(response.dataUrl);
              }
            });
          }),
          // 5秒超時
          new Promise((_, reject) => setTimeout(() => reject(new Error('截圖逾時 (5秒)')), 5000))
        ]);
        
        if (dataUrl) {
          dataUrls.push(dataUrl);
          console.log(`[ScrollCapture] 第 ${currentStep} 次截圖成功，目前共 ${dataUrls.length} 張`);
          
          // 向背景頁報告進度（不開啟新頁面，僅記錄日誌）
          chrome.runtime.sendMessage({ 
            action: 'screenshotProgress', 
            current: currentScroll,
            total: totalHeight,
            percentage: Math.round(currentScroll/totalHeight*100),
            imageCount: dataUrls.length
          });
        } else {
          console.error(`[ScrollCapture] 第 ${currentStep} 次截圖失敗，無回傳值`);
          // 繼續執行，允許部分截圖失敗
        }
      } catch (captureError) {
        console.error(`[ScrollCapture] 第 ${currentStep} 次截圖發生錯誤:`, captureError);
        chrome.runtime.sendMessage({ 
          action: 'screenshotError',
          error: captureError.message,
          position: currentScroll,
          total: totalHeight
        });
        // 繼續執行，允許部分截圖失敗
      }

      currentScroll += viewportHeight;
    }

    // 確保最後一屏也被截取
    if (currentScroll >= totalHeight) {
      currentStep++;
      console.log(`[ScrollCapture] 最後一次滾動至底部 ${totalHeight}`);
      window.scrollTo(0, totalHeight);
      await wait(900);
      
      try {
        const lastDataUrl = await Promise.race([
          new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, response => {
              resolve(response && response.dataUrl);
            });
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('截圖逾時 (5秒)')), 5000))
        ]);
        
        if (lastDataUrl) {
          dataUrls.push(lastDataUrl);
          console.log(`[ScrollCapture] 底部截圖成功，總計 ${dataUrls.length} 張`);
        } else {
          console.error(`[ScrollCapture] 底部截圖失敗，無回傳值`);
        }
      } catch (captureError) {
        console.error(`[ScrollCapture] 底部截圖發生錯誤:`, captureError);
      }
    }

    window.scrollTo(0, 0); // 滾動回頂部
    document.documentElement.style.overflow = originalOverflow; // 恢復滾動條
    console.log(`[ScrollCapture] 截圖完成，共 ${dataUrls.length} 張，準備拼接`);

    return dataUrls;
  } catch (error) {
    console.error('[ScrollCapture] 滾動截圖時發生錯誤:', error);
    // 確保在出錯時也恢復滾動條
    document.documentElement.style.overflow = document.documentElement.style.originalOverflow || '';
    // 向背景頁報告錯誤
    chrome.runtime.sendMessage({ 
      action: 'screenshotFatalError',
      error: error.message
    });
    return [];
  }
}

// 為了讓注入的函式可以呼叫 chrome.runtime.sendMessage，我們需要在 background.js 中監聽一個中繼訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureVisibleTab') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ dataUrl: dataUrl });
    });
    return true; // 保持通道開啟
  }
});
