/**
 * 閱讀區塊專注模式擴充功能
 * 重構版本 - 使用閉包實現模組化
 */

// 立即執行函式，避免全域變數污染
(function() {
  'use strict';

  // --- 狀態管理 --- 
  let state = {
    isSelectMode: false,
    focusedElement: null,
    floatButton: null,
    isButtonHiddenForSite: false, // 新增狀態：按鈕是否在此網站隱藏
  };

  function getState() {
    return { ...state }; // 回傳狀態的淺複製
  }

  function setState(newState) {
    state = { ...state, ...newState };
    // 更新全域 floatButton 參考 (如果存在)
    if (newState.floatButton !== undefined) {
       window.floatButton = newState.floatButton; // 讓 select-mode.js 可以存取
    }
    console.log('[DEBUG] State updated:', state);
  }
  // --- /狀態管理 --- 

  // 儲存原始樣式和顯示狀態
  let originalStyles = {};
  let originalVisibility = {};

  // 集中管理可選取元素的選擇器，直接取用全域變數
  let FOCUSABLE_SELECTORS = window.FOCUSABLE_SELECTORS;

  // UI 物件的實作已移至 ui.js，從全域 UI 取得
  const UI = window.UI;

  // --- FocusMode (從 focus-mode.js 建立) ---
  const FocusMode = window.createFocusMode({
    getState,
    setState,
    originalStyles, // 傳入在 content.js 定義的物件
    originalVisibility // 傳入在 content.js 定義的物件
  });
  // --- /FocusMode ---

  // --- SelectMode (從 select-mode.js 建立) --- 
  const SelectMode = window.createSelectMode({
    UI,
    FocusMode, // 傳入已建立的 FocusMode 實例
    FOCUSABLE_SELECTORS,
    getState,
    setState
  });
  // --- /SelectMode --- 

  /**
   * 主程式模組 - 協調模組間的互動
   */
  const Main = {
    // 初始化功能
    initialize: function() {
      console.log('[DEBUG] 初始化閱讀區塊專注模式擴充功能');

      if (getState().isButtonHiddenForSite) {
        console.log('[DEBUG] 按鈕已設定為在此網站隱藏，跳過建立按鈕。');
        // 即使按鈕隱藏，訊息監聽器等還是需要設定
      } else {
        // 建立懸浮按鈕並傳入點擊處理函式
        const button = UI.createFloatingButton(this.handleButtonClick); // 使用 UI 物件
        if (button) {
            setState({ floatButton: button }); // 將按鈕存入狀態
            UI.makeDraggable(button); // 使按鈕可拖曳
            // 初始設定按鈕位置（預設右上角）
            chrome.storage.local.get(['buttonPosition'], function(result) {
              const position = result.buttonPosition || 'right';
              UI.updateButtonPosition(position);
            });
        } else {
            console.error("[Main.initialize] 無法建立懸浮按鈕");
            // 即使無法建立按鈕，也應該繼續設定訊息監聽器
        }
      }
      // 設定訊息監聽器 (無論按鈕是否顯示，都需要監聽來自 popup 的指令)
      // 這部分邏輯移到 initializeExtension 的末尾，確保只註冊一次
    },

    // 按鈕點擊處理函式
    handleButtonClick: function(e) {
      console.log('[DEBUG] 按鈕被點擊');
      e.stopPropagation(); // 確保事件不會傳播
      e.preventDefault(); // 確保不會觸發預設行為

      const { isSelectMode } = getState(); // 從狀態取得
      // 顯示目前狀態
      console.log('[DEBUG] 按鈕點擊，目前狀態：' + (isSelectMode ? '選取模式中' : '非選取模式'));

      // 呼叫切換模式函式
      Main.toggleSelectMode();

      // 返回 false 防止預設行為
      return false;
    },

    // 切換選取模式
    toggleSelectMode: function() {
      const { isSelectMode, focusedElement } = getState(); // 從狀態取得
      console.log('[DEBUG] 按鈕點擊: 目前狀態 - isSelectMode:', isSelectMode, 'focusedElement:', !!focusedElement);

      // 檢查按鈕點擊時的狀態
      const currentStatus = {
        isInSelectMode: isSelectMode,
        hasFocusedElement: !!focusedElement
      };
      console.log('[DEBUG] 目前詳細狀態:', currentStatus);

      if (focusedElement) {
        // 已有專注元素，則取消專注
        console.log('[DEBUG] 執行：取消專注模式');
        FocusMode.restoreOriginalPage(focusedElement);
        // focusedElement 會在 restoreOriginalPage 中被設為 null

        // 更新按鈕圖示
        UI.updateButtonIcon('選取區塊', 'fa-eye');
      } else if (isSelectMode) {
        // 如果已在選取模式，則關閉選取模式
        console.log('[DEBUG] 執行：停用選取模式');
        try {
          SelectMode.disableSelectMode();
          console.log('[DEBUG] disableSelectMode 執行成功');
        } catch (err) {
          console.error('[DEBUG] disableSelectMode 執行失敗:', err);
        }

        // 直接強制更新按鈕和狀態
        UI.updateButtonIcon('選取區塊', 'fa-eye');

        // 移除任何殘留的覆蓋層 (disableSelectMode 內部已處理)
        // const overlay = document.getElementById('reader-focus-overlay');
        // if (overlay) overlay.remove();

        console.log('[DEBUG] 選取模式已停用');
      } else {
        // 啟用選取模式
        console.log('[DEBUG] 執行：啟用選取模式');
        SelectMode.enableSelectMode();
        UI.updateButtonIcon('取消選擇', 'fa-eye-slash');
      }
    }
  };

  // 修正 this 綁定問題
  Main.handleButtonClick = Main.handleButtonClick.bind(Main);

  // 接收來自 popup 的訊息
  let messageListener = null; // 將監聽器移到外部，方便管理

  function setupMessageListener() {
    if (messageListener) {
      chrome.runtime.onMessage.removeListener(messageListener); // 移除舊的，避免重複
    }
    messageListener = (message, sender, sendResponse) => {
      if (message.action === 'toggleFocus') {
        if (getState().isButtonHiddenForSite) {
          sendResponse({ success: false, error: '按鈕已隱藏，無法切換專注' });
          return; // 同步回應，不需要 return true
        }
        Main.toggleSelectMode();
        sendResponse({ success: true });
        return; // 同步回應
      } else if (message.action === 'updatePosition') {
        if (getState().isButtonHiddenForSite) {
          sendResponse({ success: false, error: '按鈕已隱藏，無法更新位置' });
          return;
        }
        UI.updateButtonPosition(message.position);
        sendResponse({ success: true });
        return;
      } else if (message.action === 'getStatus') {
        sendResponse({
          hasFocusedElement: !!getState().focusedElement,
          isSelectMode: getState().isSelectMode,
          isButtonHidden: getState().isButtonHiddenForSite,
          currentSiteHost: window.location.hostname
        });
        return; // 同步回應
      } else if (message.action === 'setCustomSelector') {
        if (getState().isButtonHiddenForSite) {
          sendResponse({ success: false, error: '按鈕已隱藏，無法套用自訂選取器' });
          return;
        }
        try {
          const el = document.querySelector(message.selector);
          if (el) {
            FocusMode.enableFocusMode(el);
            setState({ focusedElement: el });
            UI.updateButtonIcon('取消專注', 'fa-eye-slash');
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: '找不到元素: ' + message.selector });
          }
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
        return; // 同步回應
      } else if (message.action === 'hideButtonForSite') {
        const currentHostname = window.location.hostname;
        chrome.storage.local.get(['hiddenSites'], function(result) {
          const hiddenSites = result.hiddenSites || [];
          if (!hiddenSites.includes(currentHostname)) {
            hiddenSites.push(currentHostname);
            chrome.storage.local.set({ hiddenSites: hiddenSites }, () => {
              console.log(`[DEBUG] ${currentHostname} 已加入隱藏列表`);
              performHideButtonActions();
              sendResponse({ success: true, isHidden: true });
            });
          } else {
            performHideButtonActions();
            sendResponse({ success: true, isHidden: true });
          }
        });
        return true; // 非同步回應
      } else if (message.action === 'showButtonForSite') {
        const currentHostname = window.location.hostname;
        chrome.storage.local.get(['hiddenSites'], function(result) {
          let hiddenSites = result.hiddenSites || [];
          const index = hiddenSites.indexOf(currentHostname);
          if (index > -1) {
            hiddenSites.splice(index, 1);
            chrome.storage.local.set({ hiddenSites: hiddenSites }, () => {
              console.log(`[DEBUG] ${currentHostname} 已從隱藏列表移除`);
              performShowButtonActions();
              sendResponse({ success: true, isHidden: false });
            });
          } else {
            performShowButtonActions();
            sendResponse({ success: true, isHidden: false });
          }
        });
        return true; // 非同步回應
      } else if (message.action === "getSelectedHtml") {
        let selectedHtml = "";
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const div = document.createElement("div");
          div.appendChild(range.cloneContents());
          selectedHtml = div.innerHTML;
          console.log("選取的 HTML:", selectedHtml);
        } else {
          console.log("未找到選取內容或 rangeCount 為 0。");
        }
        sendResponse({ html: selectedHtml });
        // 雖然 getSelection 是同步的，但為了與 background.js 的流程保持一致性，
        // 且 sendResponse 是在函式末尾，可以不返回 true，或返回 true 均可。
        // 這裡保持原樣返回 true，因為 background.js 期望它可能非同步。
        return true; 
      } else if (message.action === "getPageHtml") {
        const clone = document.documentElement.cloneNode(true);
        // 移除隱藏元素的操作已移至 actualConvertToMarkdown，這裡只傳送原始 HTML
        // clone.querySelectorAll('[style*="display:none" i], [hidden]').forEach(el => el.remove());
        const html = clone.outerHTML;
        sendResponse({ html });
        return true; // 同上，保持返回 true
      } else if (message.action === 'actualConvertToMarkdown') {
        console.log('[ContentScript] Received actualConvertToMarkdown request:', message);
        try {
          if (typeof TurndownService !== 'function') {
            console.error('[ContentScript] TurndownService is not defined!');
            sendResponse({ success: false, error: 'TurndownService is not available in content script.' });
            return; // Turndown 未定義，同步回覆錯誤，不需 return true
          }

          const htmlString = message.html;
          const removeHidden = message.removeHidden;

          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlString, 'text/html');

          // 1. 移除所有 <script> 標籤
          doc.querySelectorAll('script').forEach(scriptTag => {
            scriptTag.remove();
          });

          // 移除隱藏元素 (如果需要)
          if (removeHidden) {
            doc.querySelectorAll('[style*="display:none" i], [hidden]').forEach(el => {
              if (el && typeof el.remove === 'function') {
                el.remove();
              }
            });
          }

          const turndownService = new TurndownService({
            // Turndown 選項範例
            // headingStyle: 'atx',
            // hr: '---',
            // bulletListMarker: '*',
            // codeBlockStyle: 'fenced'
          });

          // 2. 為 <pre> 標籤新增自訂規則 (使用遞迴方式處理換行)
          turndownService.addRule('preservePreWithLanguageRecursive', {
            filter: 'pre',
            replacement: function (content, node) {
              let language = '';
              // 嘗試從 <pre> 自身或其子 <code> 元素獲取語言標記
              const firstCodeElement = node.querySelector('code');
              if (firstCodeElement) {
                const langClass = firstCodeElement.className.match(/language-(\S+)/);
                if (langClass && langClass[1]) {
                  language = langClass[1];
                }
              }
              if (!language) {
                language = node.getAttribute('data-lang') ||
                           (node.className.match(/language-(\S+)/) || [])[1] ||
                           (node.getAttribute('lang')) ||
                           (node.getAttribute('language')) ||
                           '';
              }

              // 遞迴函式來處理節點及其子節點，尋找文本和 <br>
              function getNodeTextRecursive(currentNode) {
                let text = '';
                Array.from(currentNode.childNodes).forEach(childNode => {
                  if (childNode.nodeType === Node.TEXT_NODE) {
                    text += childNode.nodeValue;
                  } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                    if (childNode.tagName === 'BR') {
                      text += '\n';
                    } else {
                      // 對於其他所有元素節點 (如 code, span 等)，遞迴處理其子節點
                      text += getNodeTextRecursive(childNode);
                    }
                  }
                });
                return text;
              }

              let codeText = getNodeTextRecursive(node); // 從 <pre> 節點開始遞迴

              // 標準化換行符：將 \r\n 和 \r 替換為 \n
              codeText = codeText.replace(/\r\n?/g, '\n');
              // 移除程式碼區塊內容本身前後的空白換行
              const trimmedCode = codeText.trim();

              if (!trimmedCode) {
                return '';
              }
              return '\n\n```' + language + '\n' + trimmedCode + '\n```\n\n';
            }
          });

          const markdownText = turndownService.turndown(doc.body || doc.documentElement);

          console.log('[ContentScript] Markdown conversion successful.');
          sendResponse({ success: true, markdown: markdownText });

        } catch (e) {
          console.error('[ContentScript] Error during Markdown conversion:', e, e.stack);
          sendResponse({ success: false, error: e.toString(), stack: e.stack });
        }
        return true; // DOMParser 和 Turndown 可能耗時，表示非同步回應
      } else if (message.action === 'copyMarkdown') {
        const text = message.markdown || '';
        const lines = text.split('\n');
        const first = lines[0] || '';
        const last = lines[lines.length - 1] || '';
        console.log(`[Content] 開始寫入剪貼簿 首行: ${first} | 末行: ${last}`);

        // 嘗試將焦點設定回文件，以允許剪貼簿寫入
        window.focus();

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(() => {
              console.log(`[Content] 已完成複製 首行: ${first} | 末行: ${last}`);
              sendResponse({ success: true });
            })
            .catch(err => {
              console.error('[Content] 複製 Markdown 失敗 (navigator.clipboard.writeText):', err);
              // 嘗試使用 document.execCommand('copy') 作為備案
              console.log('[Content] 嘗試使用 document.execCommand(\'copy\') 作為備案...');
              try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed'; // 防止滾動
                textarea.style.top = '-9999px'; // 移出畫面外
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (success) {
                  console.log('[Content] document.execCommand(\'copy\') 成功');
                  sendResponse({ success: true, method: 'execCommand' });
                } else {
                  console.error('[Content] document.execCommand(\'copy\') 失敗');
                  sendResponse({ success: false, error: 'execCommand failed', originalError: err.toString() });
                }
              } catch (execErr) {
                console.error('[Content] document.execCommand(\'copy\') 執行時發生錯誤:', execErr);
                sendResponse({ success: false, error: execErr.toString(), originalError: err.toString() });
              }
            });
        } else {
          console.warn('[Content] Clipboard API 不可用');
          sendResponse({ success: false, error: 'Clipboard API not available' });
        }
        return true; // navigator.clipboard.writeText 是非同步的
      }
      // 移除通用的 return true，只在需要非同步回應的 action 中返回 true
      // console.warn('[ContentScript] Unknown message action:', message.action);
      // sendResponse({ success: false, error: 'Unknown action' }); // 對於未知 action，可以考慮回覆
      // return false; // 或不返回，讓通道關閉
    };
    chrome.runtime.onMessage.addListener(messageListener);
  }

  function performHideButtonActions() {
    setState({ isButtonHiddenForSite: true });
    if (getState().floatButton) {
      // 如果之前有專注或選取，先清理
      if (getState().focusedElement) {
        FocusMode.restoreOriginalPage(getState().focusedElement);
      }
      if (getState().isSelectMode) {
        SelectMode.disableSelectMode();
      }
      getState().floatButton.remove();
      setState({ floatButton: null });
      console.log('[DEBUG] 懸浮按鈕已移除');
    }
  }

  function performShowButtonActions() {
    setState({ isButtonHiddenForSite: false });
    if (!getState().floatButton && !document.getElementById('reader-focus-button')) { // 避免重複建立
      // 重新執行 Main.initialize 的部分邏輯來建立按鈕
      const button = UI.createFloatingButton(Main.handleButtonClick);
      if (button) {
        setState({ floatButton: button });
        UI.makeDraggable(button);
        chrome.storage.local.get(['buttonPosition'], function(result) {
          const position = result.buttonPosition || 'right';
          UI.updateButtonPosition(position);
        });
        console.log('[DEBUG] 懸浮按鈕已建立並顯示');
      } else {
        console.error("[Main.performShowButtonActions] 無法建立懸浮按鈕");
      }
    } else if (getState().floatButton && !getState().floatButton.isConnected) {
        // 按鈕物件存在但已從 DOM 移除，重新加入
        document.body.appendChild(getState().floatButton);
        console.log('[DEBUG] 懸浮按鈕已重新加入 DOM');
    }
  }


  // 在頁面完全載入後初始化
  function initializeExtension() {
      // 檢查是否已初始化，避免重複執行
      if (window.readerFocusInitialized) {
        console.log('[DEBUG] 已初始化過，檢查按鈕顯示狀態');
        // 如果已初始化，但按鈕因SPA等原因消失，且不應隱藏，則重建
        if (!getState().isButtonHiddenForSite && !document.getElementById('reader-focus-button') && getState().floatButton) {
            console.warn('[DEBUG] 按鈕消失但應顯示，嘗試重建...');
            performShowButtonActions();
        }
        return;
      }
      
      window.readerFocusInitialized = true; // 先標記初始化

      chrome.storage.local.get(['hiddenSites'], function(result) {
        const hiddenSites = result.hiddenSites || [];
        const currentHostname = window.location.hostname;
        if (hiddenSites.includes(currentHostname)) {
          setState({ isButtonHiddenForSite: true });
          console.log(`[DEBUG] 擴充功能按鈕已於 ${currentHostname} 設定為隱藏 (根據儲存設定)。`);
        }
        Main.initialize(); // 呼叫初始化，它會根據 isButtonHiddenForSite 決定是否建按鈕
        setupMessageListener(); // 在 Main.initialize 後設定訊息監聽器
      });
  }

  // DOMContentLoaded 可能對 SPA 不可靠，改用更穩健的方式
  if (document.readyState === 'loading') { // 尚未載入完成
      document.addEventListener('DOMContentLoaded', initializeExtension);
  } else { // 'interactive' 或 'complete'
      initializeExtension();
  }

  // 針對 SPA 或動態載入內容，增加 MutationObserver 監聽
  const observer = new MutationObserver((mutationsList, obs) => {
      // 簡單檢查 body 是否存在，若不存在則可能還在載入早期
      if (!document.body) return;

      // 如果按鈕設定為隱藏，則 MutationObserver 不應嘗試重建按鈕
      if (getState().isButtonHiddenForSite) {
        // 如果按鈕意外出現了（不應該），則移除它
        const buttonElement = document.getElementById('reader-focus-button');
        if (buttonElement) {
            console.warn('[DEBUG] 按鈕設定為隱藏，但按鈕存在於 DOM 中，將其移除。');
            buttonElement.remove();
            setState({ floatButton: null }); // 更新狀態
        }
        return;
      }

      // 檢查按鈕是否意外消失，如果消失則重新初始化 (可能由 SPA 框架移除)
      // 且按鈕不應該是隱藏的
      if (!document.getElementById('reader-focus-button') && window.readerFocusInitialized) {
          // 這裡需要確保 floatButton 狀態也正確，避免在不應顯示時重建
          // initializeExtension 內部已有 isButtonHiddenForSite 的檢查
          console.warn('[DEBUG] 偵測到按鈕消失，嘗試重新執行初始化檢查...');
          // window.readerFocusInitialized = false; // 不需要重設為 false，讓 initializeExtension 內部邏輯判斷
          initializeExtension(); // 重新執行初始化流程，它會檢查是否要建按鈕
      }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });


  console.log("Reader Focus content script loaded.");

  // 為了向下相容，將主要函式暴露給全域環境
  window.toggleReaderFocus = Main.toggleSelectMode.bind(Main);
})();
