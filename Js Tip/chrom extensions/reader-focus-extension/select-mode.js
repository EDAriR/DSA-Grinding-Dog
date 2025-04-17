// select-mode.js - 處理選取模式相關功能
(function() {
  'use strict';

  // 工廠函式：建立 SelectMode 物件，並接收相依性
  function createSelectMode(dependencies) {
    const { UI, FocusMode, FOCUSABLE_SELECTORS, getState, setState } = dependencies;

    const SelectMode = {
      /**
       * 啟用選取模式
       */
      enableSelectMode: function() {
        setState({ isSelectMode: true });
        const { floatButton } = getState(); // 取得 floatButton
        const elements = document.querySelectorAll(FOCUSABLE_SELECTORS.join(', '));
        console.log('[DEBUG] 綁定事件的元素數量:', elements.length);
        elements.forEach(el => {
          // 確保不處理控制按鈕和其子元素
          if (el.id !== 'reader-focus-button' &&
              !el.classList.contains('reader-focus-overlay') &&
              el !== floatButton &&
              (!floatButton || !floatButton.contains(el))) { // 加上 !floatButton 判斷
            // 避免選取到控制按鈕和覆蓋層
            el.addEventListener('mouseover', SelectMode.highlightElement, false);
            el.addEventListener('mouseout', SelectMode.removeHighlight, false);
            el.addEventListener('click', SelectMode.selectElement, false);
          }
        });

        // 確保按鈕始終可點擊
        if (floatButton) {
          floatButton.style.pointerEvents = 'auto';
          // floatButton.style.zIndex = '999999'; // zIndex 在 ui.js 設定
        }

        // 防止點擊事件傳播到頁面其他元素，但允許按鈕事件
        document.addEventListener('click', SelectMode.preventClickPropagation, true);
      },

      /**
       * 停用選取模式
       */
      disableSelectMode: function() {
        setState({ isSelectMode: false });

        console.log('[DEBUG] 開始移除所有事件監聽');

        // 移除所有相關元素的事件監聽器
        document.querySelectorAll(FOCUSABLE_SELECTORS.join(', ')).forEach(el => {
          el.removeEventListener('mouseover', SelectMode.highlightElement); // 注意：這裡的 this 指向 SelectMode
          el.removeEventListener('mouseout', SelectMode.removeHighlight);
          el.removeEventListener('click', SelectMode.selectElement);

          // 確保移除所有可能的高亮效果
          el.classList.remove('reader-focus-highlight');
        });

        // 移除任何殘留的覆蓋層
        const overlay = document.getElementById('reader-focus-overlay');
        if (overlay) {
          overlay.remove();
        }

        // 移除點擊事件攔截
        document.removeEventListener('click', SelectMode.preventClickPropagation, true);

        console.log('[DEBUG] 選取模式已停用');
      },

      /**
       * 高亮元素
       * @param {Event} event - 滑鼠事件
       */
      highlightElement: function(event) {
        const { isSelectMode } = getState();
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
          const targetElement = overlay.targetElement; // 'this' 在這裡是 overlay
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
            setState({ focusedElement: targetElement });
            window.readerFocusTargetElement = targetElement; // 使用全域變數作為備份

            // 使用 setTimeout 確保 UI 更新後再執行後續動作
            setTimeout(() => {
              try {
                const { focusedElement: currentFocusedElement, floatButton } = getState(); // 重新取得狀態
                // 啟用專注模式
                FocusMode.enableFocusMode(currentFocusedElement);

                // 停用選取模式
                SelectMode.disableSelectMode(); // 呼叫 SelectMode 內部的方法

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
                if(notification) notification.remove(); // 確保移除通知
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

        // 設定覆蓋層位置和大小 (這裡的 'this' 是觸發 mouseover 的元素)
        const rect = event.target.getBoundingClientRect(); // 使用 event.target
        overlay.style.top = (window.scrollY + rect.top) + 'px';
        overlay.style.left = (window.scrollX + rect.left) + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        overlay.style.display = 'block';

        // 顯示元素資訊在主控台
        console.log('元素資訊:', {
          id: event.target.id || '無ID',
          className: event.target.className || '無Class',
          tagName: event.target.tagName,
          textContent: event.target.textContent.substring(0, 50) + (event.target.textContent.length > 50 ? '...' : '')
        });

        // 儲存當前元素參考到 overlay 上
        overlay.targetElement = event.target; // 將觸發事件的元素存起來
      },

      /**
       * 移除高亮
       * @param {Event} event - 滑鼠事件
       */
      removeHighlight: function(event) {
        const { isSelectMode } = getState();
        if (!isSelectMode) return;

        event.stopPropagation();

        // 隱藏覆蓋層
        const overlay = document.getElementById('reader-focus-overlay');
        // 延遲一點時間移除，避免滑鼠快速移動時閃爍
        if (overlay && overlay.targetElement === event.target) {
           setTimeout(() => {
             const currentOverlay = document.getElementById('reader-focus-overlay');
             // 再次檢查 overlay 是否還存在且目標未變
             if (currentOverlay && currentOverlay.targetElement === event.target) {
                currentOverlay.style.display = 'none'; // 或者直接 remove()
             }
           }, 50); // 50ms 延遲
        }
      },

      /**
       * 選取元素 (注意：這個函式現在由 overlay 的點擊事件觸發，而不是元素本身)
       * @param {Event} event - 滑鼠事件 (來自 overlay)
       */
      selectElement: function(event) {
         // 這個函式現在合併到 highlightElement 的 handleOverlayClick 中了
         // 保留這個函式以防萬一，但主要邏輯已移轉
         console.warn("selectElement 被直接呼叫，預期行為已移至 highlightElement 的點擊處理");
         const { isSelectMode } = getState();
         if (!isSelectMode) return;

         event.stopPropagation();
         event.preventDefault();

         // 'this' 在這裡可能是觸發事件監聽的原始元素，而不是 overlay
         const targetElement = event.target === document.getElementById('reader-focus-overlay')
                              ? document.getElementById('reader-focus-overlay').targetElement
                              : this; // Fallback

         if (!targetElement) {
            console.error("selectElement: 無法確定目標元素");
            return;
         }

         setState({ focusedElement: targetElement });
         console.log('元素被選取 (透過 selectElement):', targetElement);

         FocusMode.enableFocusMode(targetElement);
         SelectMode.disableSelectMode(); // 呼叫 SelectMode 內部的方法
         const { floatButton } = getState();
         if(floatButton) UI.updateButtonIcon('取消專注', 'fa-eye-slash');

         const overlay = document.getElementById('reader-focus-overlay');
         if (overlay) overlay.remove();
      },

      /**
       * 防止點擊事件傳播
       * @param {Event} event - 點擊事件
       */
      preventClickPropagation: function(event) {
        const { isSelectMode, floatButton } = getState();
        // 如果點擊事件的目標是按鈕或按鈕的子元素，則完全不進行任何處理，讓事件正常傳播
        if (floatButton && (event.target === floatButton || floatButton.contains(event.target))) {
          console.log('[DEBUG] preventClickPropagation: Click on button or child detected. Allowing event to proceed.');
          return; // 直接返回，不執行 stopPropagation
        }

        // 如果點擊的是覆蓋層，也允許事件（因為點擊覆蓋層要觸發選取）
        if (event.target.id === 'reader-focus-overlay') {
           console.log('[DEBUG] preventClickPropagation: Click on overlay detected. Allowing event to proceed.');
           return;
        }

        // 只有當處於選取模式且點擊目標不是按鈕或覆蓋層時，才阻止事件傳播
        if (isSelectMode) {
          console.log('[DEBUG] preventClickPropagation: Stopping click propagation for target:', event.target);
          event.stopPropagation();
          event.preventDefault();
        }
      }
    };

    // 修正 this 綁定問題 (如果函式作為事件監聽器使用)
    // SelectMode.highlightElement = SelectMode.highlightElement.bind(SelectMode); // 'this' 在 highlightElement 中應為觸發事件的元素
    // SelectMode.removeHighlight = SelectMode.removeHighlight.bind(SelectMode); // 'this' 在 removeHighlight 中應為觸發事件的元素
    // SelectMode.selectElement = SelectMode.selectElement.bind(SelectMode); // 'this' 在 selectElement 中應為觸發事件的元素
    SelectMode.preventClickPropagation = SelectMode.preventClickPropagation.bind(SelectMode); // 這個需要綁定

    return SelectMode;
  }

  // 將工廠函式掛載到 window 上
  window.createSelectMode = createSelectMode;

})();
