/**
 * 閱讀區塊專注模式擴充功能
 * 重構版本 - 使用閉包實現模組化
 */

// 立即執行函式，避免全域變數污染
(function() {
  'use strict';
  
  // 全域狀態變數
  let isSelectMode = false;
  let focusedElement = null;
  let floatButton = null;
  
  // 儲存原始樣式和顯示狀態
  let originalStyles = {};
  let originalVisibility = {};
  
  // 集中管理可選取元素的選擇器，直接取用全域變數
  let FOCUSABLE_SELECTORS = window.FOCUSABLE_SELECTORS;
  
  /**
   * UI 模組 - 處理使用者介面相關功能
   */
  const UI = {
    /**
     * 建立懸浮按鈕
     * @param {Function} clickHandler - 按鈕點擊處理函式
     * @returns {HTMLElement} - 建立的按鈕元素
     */
    createFloatingButton: function(clickHandler) {
      // 改為直接呼叫 ui.js 提供的全域函式，避免重複
      if (typeof window.createFloatingButton === 'function') {
        floatButton = window.createFloatingButton(clickHandler);
        // 支援拖曳功能（如 ui.js 未內建可選擇保留）
        if (this.makeDraggable && floatButton && !floatButton._draggablePatched) {
          this.makeDraggable(floatButton);
          floatButton._draggablePatched = true;
        }
        return floatButton;
      } else {
        console.error('[ReaderFocus] 找不到 window.createFloatingButton，請確認 ui.js 是否正確載入');
        return null;
      }
    },
    
    /**
     * 更新按鈕圖示
     * @param {string} title - 按鈕提示文字
     * @param {string} iconClass - FontAwesome 圖示類別
     */
    updateButtonIcon: function(title, iconClass) {
      if (!floatButton) return;
      
      // 清空現有內容
      floatButton.innerHTML = '';
      floatButton.title = title;
      
      // 建立新的圖示
      const iconSpan = document.createElement('i');
      iconSpan.className = 'fas ' + iconClass;
      iconSpan.style.fontSize = '18px';
      
      floatButton.appendChild(iconSpan);
    },
    
    /**
     * 更新按鈕位置
     * @param {string} position - 位置 ('left' 或 'right')
     */
    updateButtonPosition: function(position) {
      if (!floatButton) return;
      
      if (position === 'left') {
        floatButton.style.left = '0px'; // 緊貼左側
        floatButton.style.right = 'auto';
      } else {
        floatButton.style.right = '0px'; // 緊貼右側
        floatButton.style.left = 'auto';
      }
    },
    
    /**
     * 使元素可拖曳
     * @param {HTMLElement} element - 要啟用拖曳功能的元素
     */
    makeDraggable: function(element) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      
      element.onmousedown = dragMouseDown;
      
      function dragMouseDown(e) {
        e.preventDefault();
        // 獲取初始滑鼠位置
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }
      
      function elementDrag(e) {
        e.preventDefault();
        // 計算新位置
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // 設置元素的新位置
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        element.style.right = 'auto';
      }
      
      function closeDragElement() {
        // 停止拖曳
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
  };
  
  /**
   * 選取模式模組 - 處理選取模式相關功能
   */
  const SelectMode = {
    /**
     * 啟用選取模式
     */
    enableSelectMode: function() {
      isSelectMode = true;
      const elements = document.querySelectorAll(FOCUSABLE_SELECTORS.join(', '));
      console.log('[DEBUG] 綁定事件的元素數量:', elements.length);
      elements.forEach(el => {
        // 確保不處理控制按鈕和其子元素
        if (el.id !== 'reader-focus-button' && 
            !el.classList.contains('reader-focus-overlay') && 
            el !== floatButton &&
            !floatButton.contains(el)) {
          // 避免選取到控制按鈕和覆蓋層
          el.addEventListener('mouseover', SelectMode.highlightElement, false);
          el.addEventListener('mouseout', SelectMode.removeHighlight, false);
          el.addEventListener('click', SelectMode.selectElement, false);
        }
      });
      
      // 確保按鈕始終可點擊
      if (floatButton) {
        floatButton.style.pointerEvents = 'auto';
        floatButton.style.zIndex = '999999';
      }
      
      // 防止點擊事件傳播到頁面其他元素，但允許按鈕事件
      document.addEventListener('click', this.preventClickPropagation, true);
    },
    
    /**
     * 停用選取模式
     */
    disableSelectMode: function() {
      isSelectMode = false;
      
      console.log('[DEBUG] 開始移除所有事件監聽');
      
      // 移除所有相關元素的事件監聽器
      document.querySelectorAll(FOCUSABLE_SELECTORS.join(', ')).forEach(el => {
        el.removeEventListener('mouseover', this.highlightElement);
        el.removeEventListener('mouseout', this.removeHighlight);
        el.removeEventListener('click', this.selectElement);
        
        // 確保移除所有可能的高亮效果
        el.classList.remove('reader-focus-highlight');
      });
      
      // 移除任何殘留的覆蓋層
      const overlay = document.getElementById('reader-focus-overlay');
      if (overlay) {
        overlay.remove();
      }
      
      // 移除點擊事件攔截
      document.removeEventListener('click', this.preventClickPropagation, true);
      
      console.log('[DEBUG] 選取模式已停用');
    },
    
    /**
     * 高亮元素
     * @param {Event} event - 滑鼠事件
     */
    highlightElement: function(event) {
      if (!isSelectMode) return;
      
      event.stopPropagation();
      
      // 移除舊的覆蓋層（如果存在）
      const oldOverlay = document.getElementById('reader-focus-overlay');
      if (oldOverlay) {
        oldOverlay.remove();
      }
      
      // 建立全新的覆蓋層
      let overlay = document.createElement('div');
      overlay.id = 'reader-focus-overlay';
      overlay.setAttribute('data-purpose', 'focus-overlay'); // 加入自定義屬性以便識別
      overlay.style.position = 'absolute'; // 改回 absolute 定位，確保正確覆蓋元素
      overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      overlay.style.zIndex = '99999'; // 確保在最上層
      overlay.style.pointerEvents = 'all'; // 確保可以接收所有滑鼠事件
      overlay.style.cursor = 'pointer'; // 指示這是可點擊的
      overlay.style.boxShadow = '0 0 5px 3px red'; // 添加明顯的邊框
      
      // 直接添加內聯文字，提示使用者點擊
      const overlayText = document.createElement('div');
      overlayText.textContent = '點擊此處專注此區塊';
      overlayText.style.position = 'absolute';
      overlayText.style.top = '50%';
      overlayText.style.left = '50%';
      overlayText.style.transform = 'translate(-50%, -50%)';
      overlayText.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlayText.style.color = 'white';
      overlayText.style.padding = '8px 12px';
      overlayText.style.borderRadius = '4px';
      overlayText.style.fontSize = '14px';
      overlayText.style.pointerEvents = 'none'; // 避免文字影響點擊
      overlay.appendChild(overlayText);
      
      // 使用多種事件綁定方法確保點擊事件被正確處理
      const handleOverlayClick = function(e) {
        
        // 防止事件傳播到其他元素
        e.stopPropagation();
        e.preventDefault();
        
        // 檢查目標元素是否存在
        const targetElement = overlay.targetElement;
        if (!targetElement) {
          console.error('[覆蓋層] 錯誤: 找不到目標元素');
          alert('找不到目標元素，請重新選取');
          return;
        }
        
        try {
          console.log('[覆蓋層] 目標元素：', {
            id: targetElement.id || '無ID',
            類別: targetElement.className || '無類別',
            標籤: targetElement.tagName,
            內容: targetElement.textContent.substring(0, 50) + '...'
          });
          
          // 顯示通知告知使用者正在處理
          const notification = document.createElement('div');
          notification.textContent = '正在設定專注模式...';
          notification.style.position = 'fixed';
          notification.style.top = '50%';
          notification.style.left = '50%';
          notification.style.transform = 'translate(-50%, -50%)';
          notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          notification.style.color = 'white';
          notification.style.padding = '12px 20px';
          notification.style.borderRadius = '6px';
          notification.style.fontSize = '16px';
          notification.style.zIndex = '999999';
          document.body.appendChild(notification);
          
          // 設置被選取的元素
          console.log('[DEBUG] 設定 focusedElement');
          window.readerFocusTargetElement = targetElement; // 使用全域變數作為備份
          focusedElement = targetElement;
          
          // 使用 setTimeout 確保 UI 更新後再執行後續動作
          setTimeout(() => {
            try {
              // 啟用專注模式
              FocusMode.enableFocusMode(focusedElement);
              
              // 停用選取模式
              SelectMode.disableSelectMode();
              
              // 更新按鈕圖示
              if (floatButton) {
                UI.updateButtonIcon('取消專注', 'fa-eye-slash');
              } else {
                console.error('[DEBUG] 找不到浮動按鈕');
              }
              
              // 移除覆蓋層和通知
              overlay.remove();
              notification.remove();
              
            } catch (innerErr) {
              console.error('[覆蓋層] setTimeout內發生錯誤:', innerErr);
              alert('設定專注模式時發生錯誤: ' + innerErr.message);
              notification.remove();
            }
          }, 100);
          
        } catch (err) {
          console.error('[覆蓋層] 點擊處理發生錯誤:', err);
          alert('點擊處理發生錯誤: ' + err.message);
        }
      };
      
      // 多種方式綁定點擊事件，確保能夠被觸發
      overlay.onclick = handleOverlayClick;
      overlay.addEventListener('click', handleOverlayClick, true);
      overlay.addEventListener('mouseup', handleOverlayClick, true);
      
      document.body.appendChild(overlay);
      
      // 設定覆蓋層位置和大小
      const rect = this.getBoundingClientRect();
      overlay.style.top = (window.scrollY + rect.top) + 'px';
      overlay.style.left = (window.scrollX + rect.left) + 'px';
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';
      overlay.style.display = 'block';
      
      // 顯示元素資訊在主控台
      console.log('元素資訊:', {
        id: this.id || '無ID',
        className: this.className || '無Class',
        tagName: this.tagName,
        textContent: this.textContent.substring(0, 50) + (this.textContent.length > 50 ? '...' : '')
      });
      
      // 儲存當前元素參考
      overlay.targetElement = this;
    },
    
    /**
     * 移除高亮
     * @param {Event} event - 滑鼠事件
     */
    removeHighlight: function(event) {
      if (!isSelectMode) return;
      
      event.stopPropagation();
      
      // 隱藏覆蓋層
      const overlay = document.getElementById('reader-focus-overlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
    },
    
    /**
     * 選取元素
     * @param {Event} event - 滑鼠事件
     */
    selectElement: function(event) {
      if (!isSelectMode) return;
      
      event.stopPropagation();
      event.preventDefault();
      
      // 設置被選取的元素
      focusedElement = this;
      console.log('元素被選取:', focusedElement);
      
      // 啟用專注模式
      FocusMode.enableFocusMode(focusedElement);
      
      // 停用選取模式
      SelectMode.disableSelectMode();
      
      // 更新按鈕圖示
      UI.updateButtonIcon('取消專注', 'fa-eye-slash');
      
      // 移除覆蓋層
      const overlay = document.getElementById('reader-focus-overlay');
      if (overlay) {
        overlay.remove();
      }
    },
    
    /**
     * 防止點擊事件傳播
     * @param {Event} event - 點擊事件
     */
    preventClickPropagation: function(event) {
      // 如果點擊事件的目標是按鈕或按鈕的子元素，則完全不進行任何處理，讓事件正常傳播
      if (floatButton && (event.target === floatButton || floatButton.contains(event.target))) {
        console.log('[DEBUG] preventClickPropagation: Click on button or child detected. Allowing event to proceed.');
        return; // 直接返回，不執行 stopPropagation
      }
    
      // 只有當處於選取模式且點擊目標不是按鈕時，才阻止事件傳播
      if (isSelectMode) {
        console.log('[DEBUG] preventClickPropagation: Stopping click propagation for target:', event.target);
        event.stopPropagation();
        event.preventDefault();
      }
    }
  };
  
  /**
   * 專注模式模組 - 處理專注模式相關功能
   */
  const FocusMode = {
    /**
     * 啟用專注模式
     * @param {HTMLElement} element - 要專注的元素
     */
    enableFocusMode: function(element) {
      console.log('啟用專注模式:', element);
      
      try {
        // 1. 找出目標元素的所有父元素（包括自身）
        const targetAndParents = [];
        let currentElement = element;
        
        // 從選取的元素開始，向上收集所有父元素直到 body
        while (currentElement && currentElement !== document.body) {
          targetAndParents.push(currentElement);
          currentElement = currentElement.parentElement;
        }
        
        // 2. 收集要處理的所有可見元素（更徹底的方法）
        let allElements = [];
        try {
          // 使用更全面的選擇器，包含所有可能包含內容的元素
          allElements = Array.from(document.querySelectorAll('body, body > *, body > * > *, div, section, article, main, aside, header, footer, nav'));
        } catch (selectorError) {
          console.warn('選擇器錯誤，使用備用方法:', selectorError);
          // 備用方法：使用所有 div 和其他常見容器元素
          allElements = Array.from(document.querySelectorAll('div, section, article, main, aside, header, footer, nav'));
        }
        
        // 過濾掉腳本、樣式等不可見元素
        allElements = allElements.filter(el => {
          const tag = el.tagName.toLowerCase();
          return tag !== 'script' && tag !== 'style' && tag !== 'link' && tag !== 'meta' && getComputedStyle(el).display !== 'none';
        });
        
        // 3. 儲存原始狀態
        allElements.forEach(el => {
          try {
            const key = el.tagName + (el.id ? '#' + el.id : '') + '-' + Math.random().toString(36).substr(2, 5);
            originalVisibility[key] = el.style.display || '';
          } catch (err) {
            console.warn('儲存元素原始狀態失敗:', err);
          }
        });
          
        // 先移除覆蓋層和選取區塊的紅框
        const overlay = document.getElementById('reader-focus-overlay');
        if (overlay) {
          overlay.remove();
        }
        element.classList.remove('reader-focus-highlight');
        
        // 儲存被選元素的原始樣式
        originalStyles = {
          width: element.style.width || '',
          position: element.style.position || '',
          margin: element.style.margin || '',
          zIndex: element.style.zIndex || ''
        };
        
        // 4. 智能隱藏不相關元素
        allElements.forEach(el => {
          try {
            // 檢查該元素是否為目標元素、其父元素或子元素
            const isTargetOrRelated = el === element || element.contains(el) || targetAndParents.includes(el) || el === floatButton || el.contains(floatButton);
            
            // 隱藏所有不相關的元素，除了 body 本身
            if (!isTargetOrRelated && el !== document.body) {
              el.style.display = 'none';
            }
          } catch (err) {
            console.warn('隱藏元素失敗:', err);
          }
        });
        
        // 應用專注模式樣式，確保選取的元素顯示在畫面中央
        element.style.width = 'auto';
        element.style.maxWidth = '100%';
        element.style.position = 'relative';
        element.style.margin = '20px auto';
        element.style.zIndex = '1000';
        
        // 移除選取區塊的紅框
        element.classList.remove('reader-focus-highlight');
        
        // 確保滾動到選取區塊
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        console.log('專注模式已啟用');
      } catch (error) {
        console.error('啟用專注模式時發生錯誤:', error);
      }
    },
    
    /**
     * 還原原始頁面
     * @param {HTMLElement} focusedElement - 被專注的元素
     */
    restoreOriginalPage: function(element) {
      if (!element) return;
      
      try {
        // 使用與 enableFocusMode 相同的選擇器來找出所有被隱藏的元素
        const allElements = document.querySelectorAll('body, body > *, body > * > *, div, section, article, main, aside, header, footer, nav');
        
        // 根據 originalVisibility 還原每個元素的 display 狀態
        allElements.forEach(el => {
          try {
            // 嘗試用 dataset.key 或 fallback selector
            let key = el.dataset.rfKey;
            if (!key) {
              key = el.tagName + (el.id ? '#' + el.id : '') + '-' + (el.className ? el.className : '');
            }
            if (originalVisibility && originalVisibility[key] !== undefined) {
              el.style.display = originalVisibility[key];
              console.log('[還原] 還原元素', key, 'display:', originalVisibility[key]);
            } else {
              el.style.display = '';
              console.log('[還原] 沒有記錄，重設元素', key, 'display 為空');
            }
          } catch (err) {
            console.warn('還原元素顯示狀態失敗:', err);
          }
        });
        
        // 還原被選元素的樣式
        if (originalStyles && element) {
          element.style.width = originalStyles.width || '';
          element.style.position = originalStyles.position || '';
          element.style.margin = originalStyles.margin || '';
          element.style.zIndex = originalStyles.zIndex || '';
        }
        
        // 清空儲存的狀態
        originalVisibility = {};
        originalStyles = {};
        
        // 重置 focusedElement
        focusedElement = null;
        
        console.log('已還原頁面原始狀態');
      } catch (error) {
        console.error('[DEBUG] 還原頁面時發生錯誤:', error);
        // 發生錯誤時，強制重新整理頁面作為備用方案
        if (confirm('還原頁面時發生錯誤，是否重新整理頁面？')) {
          window.location.reload();
        }
      }
    }
  };
  
  /**
   * 主程式模組 - 協調模組間的互動
   */
  const Main = {
    // 初始化功能
    initialize: function() {
      console.log('[DEBUG] 初始化閱讀區塊專注模式擴充功能');
      
      // 建立懸浮按鈕並傳入點擊處理函式
      const button = window.createFloatingButton(this.handleButtonClick);
      floatButton = button; // 修正：確保 floatButton 指向正確的按鈕物件
      
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
      
      // 顯示目前狀態
      console.log('[DEBUG] 按鈕點擊，目前狀態：' + (isSelectMode ? '選取模式中' : '非選取模式'));
      
      // 呼叫切換模式函式
      Main.toggleSelectMode();
      
      // 返回 false 防止預設行為
      return false;
    },
    
    // 切換選取模式
    toggleSelectMode: function() {
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
        window.readerFocusTargetElement = null; // 清除全域備份
        
        // 更新按鈕圖示
        UI.updateButtonIcon('選取區塊', 'fa-eye');
      } else if (isSelectMode) {
        // 如果已在選取模式，則關閉選取模式
        console.log('[DEBUG] 執行：停用選取模式');
        // 強制清除所有事件監聽
        try {
          SelectMode.disableSelectMode();
          console.log('[DEBUG] disableSelectMode 執行成功');
        } catch (err) {
          console.error('[DEBUG] disableSelectMode 執行失敗:', err);
        }
        
        // 直接強制更新按鈕和狀態
        UI.updateButtonIcon('選取區塊', 'fa-eye');
        
        // 移除任何殘留的覆蓋層
        const overlay = document.getElementById('reader-focus-overlay');
        if (overlay) {
          overlay.remove();
        }
        
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
  document.addEventListener('DOMContentLoaded', Main.initialize.bind(Main));
  
  // 確保在動態加載的頁面也能執行初始化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    Main.initialize();
  }
  
  console.log("Reader Focus content script loaded.");
  
  // 為了向下相容，將主要函式暴露給全域環境
  window.toggleReaderFocus = Main.toggleSelectMode.bind(Main);
})();
