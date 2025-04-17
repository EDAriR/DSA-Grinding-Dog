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

      // 建立懸浮按鈕並傳入點擊處理函式
      const button = UI.createFloatingButton(this.handleButtonClick); // 使用 UI 物件
      if (button) {
          setState({ floatButton: button }); // 將按鈕存入狀態
          UI.makeDraggable(button); // 使按鈕可拖曳
      } else {
          console.error("[Main.initialize] 無法建立懸浮按鈕");
          return; // 無法建立按鈕則停止初始化
      }

      // 初始設定按鈕位置（預設右上角）
      chrome.storage.local.get(['buttonPosition'], function(result) {
        const position = result.buttonPosition || 'right';
        UI.updateButtonPosition(position);
      });
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
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleFocus') {
      Main.toggleSelectMode();
    } else if (message.action === 'updatePosition') {
      UI.updateButtonPosition(message.position);
    }
    sendResponse({ success: true });
  });

  // 在頁面完全載入後初始化
  function initializeExtension() {
      // 檢查是否已初始化，避免重複執行
      if (window.readerFocusInitialized) return;
      window.readerFocusInitialized = true;
      Main.initialize();
  }

  // DOMContentLoaded 可能對 SPA 不可靠，改用更穩健的方式
  if (document.readyState === 'loading') { // 尚未載入完成
      document.addEventListener('DOMContentLoaded', initializeExtension);
  } else { // 'interactive' 或 'complete'
      initializeExtension();
  }

  // 針對 SPA 或動態載入內容，增加 MutationObserver 監聽
  const observer = new MutationObserver((mutationsList, observer) => {
      // 簡單檢查 body 是否存在，若不存在則可能還在載入早期
      if (!document.body) return;
      // 檢查按鈕是否意外消失，如果消失則重新初始化 (可能由 SPA 框架移除)
      if (!document.getElementById('reader-focus-button')) {
          console.warn('[DEBUG] 偵測到按鈕消失，嘗試重新初始化...');
          window.readerFocusInitialized = false; // 重設標記
          initializeExtension();
      }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });


  console.log("Reader Focus content script loaded.");

  // 為了向下相容，將主要函式暴露給全域環境
  window.toggleReaderFocus = Main.toggleSelectMode.bind(Main);
})();
