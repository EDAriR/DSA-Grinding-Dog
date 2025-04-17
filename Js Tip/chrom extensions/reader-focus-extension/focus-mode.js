// focus-mode.js - 處理專注模式相關功能
(function() {
  'use strict';

  // 工廠函式：建立 FocusMode 物件，並接收相依性
  function createFocusMode(dependencies) {
    const { getState, setState, originalStyles, originalVisibility } = dependencies;

    const FocusMode = {
      /**
       * 啟用專注模式
       * @param {HTMLElement} element - 要專注的元素
       */
      enableFocusMode: function(element) {
        console.log('啟用專注模式:', element);
        const { floatButton } = getState(); // 從狀態取得 floatButton

        try {
          // 1. 找出目標元素的所有父元素（包括自身）
          const targetAndParents = [];
          let currentElement = element;
          while (currentElement && currentElement !== document.body) {
            targetAndParents.push(currentElement);
            currentElement = currentElement.parentElement;
          }

          // 2. 收集要處理的所有可見元素
          let allElements = [];
          try {
            allElements = Array.from(document.querySelectorAll('body, body > *, body > * > *, div, section, article, main, aside, header, footer, nav'));
          } catch (selectorError) {
            console.warn('選擇器錯誤，使用備用方法:', selectorError);
            allElements = Array.from(document.querySelectorAll('div, section, article, main, aside, header, footer, nav'));
          }
          allElements = allElements.filter(el => {
            const tag = el.tagName.toLowerCase();
            return tag !== 'script' && tag !== 'style' && tag !== 'link' && tag !== 'meta' && getComputedStyle(el).display !== 'none';
          });

          // 3. 儲存原始狀態 (使用傳入的 originalVisibility 物件)
          Object.keys(originalVisibility).forEach(key => delete originalVisibility[key]); // 清空舊狀態
          allElements.forEach(el => {
            try {
              const key = el.tagName + '-' + (el.id || '') + '-' + (el.className || '').replace(/\s+/g, '.') + '-' + Math.random().toString(16).slice(2, 8);
              el.dataset.rfKey = key;
              originalVisibility[key] = getComputedStyle(el).display || '';
            } catch (err) {
              console.warn('儲存元素原始狀態失敗:', err, el);
            }
          });

          // 先移除覆蓋層和選取區塊的紅框
          const overlay = document.getElementById('reader-focus-overlay');
          if (overlay) overlay.remove();
          if(element) element.classList.remove('reader-focus-highlight');

          // 儲存被選元素的原始樣式 (使用傳入的 originalStyles 物件)
          if (element) {
              Object.assign(originalStyles, {
                width: element.style.width || '',
                maxWidth: element.style.maxWidth || '',
                position: element.style.position || '',
                margin: element.style.margin || '',
                zIndex: element.style.zIndex || '',
                display: element.style.display || ''
              });
          }

          // 4. 智能隱藏不相關元素
          allElements.forEach(el => {
            try {
              const isTargetOrRelated = element && (el === element || element.contains(el) || targetAndParents.includes(el));
              const isFloatButtonRelated = floatButton && (el === floatButton || floatButton.contains(el));
              if (!isTargetOrRelated && !isFloatButtonRelated && el !== document.body) {
                el.style.display = 'none';
              }
            } catch (err) {
              console.warn('隱藏元素失敗:', err, el);
            }
          });

          // 應用專注模式樣式
          if (element) {
              element.style.display = originalStyles.display || 'block';
              element.style.width = 'auto';
              element.style.maxWidth = '800px';
              element.style.position = 'relative';
              element.style.margin = '20px auto';
              element.style.zIndex = '1000';
              element.classList.remove('reader-focus-highlight');
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          console.log('專注模式已啟用');
        } catch (error) {
          console.error('啟用專注模式時發生錯誤:', error);
        }
      },

      /**
       * 還原原始頁面
       * @param {HTMLElement} element - 被專注的元素
       */
      restoreOriginalPage: function(element) {
        if (!element) {
           console.warn("restoreOriginalPage 被呼叫，但 element 不存在");
           element = getState().focusedElement;
           if (!element) return;
        }

        try {
          // 使用 dataset.rfKey 還原 (使用傳入的 originalVisibility)
          Object.keys(originalVisibility).forEach(key => {
              try {
                  const el = document.querySelector(`[data-rf-key="${key}"]`);
                  if (el) {
                      el.style.display = originalVisibility[key];
                      delete el.dataset.rfKey;
                  } else {
                      // console.warn('[還原] 找不到元素:', key);
                  }
              } catch (err) {
                  console.warn('還原元素顯示狀態失敗:', key, err);
              }
          });

          // 還原被選元素的樣式 (使用傳入的 originalStyles)
          if (originalStyles && element) {
            element.style.width = originalStyles.width || '';
            element.style.maxWidth = originalStyles.maxWidth || '';
            element.style.position = originalStyles.position || '';
            element.style.margin = originalStyles.margin || '';
            element.style.zIndex = originalStyles.zIndex || '';
            element.style.display = originalStyles.display || '';
          }

          // 清空儲存的狀態 (在 content.js 中處理，這裡不清空傳入的物件)
          // originalVisibility = {};
          // originalStyles = {};

          // 重置 focusedElement 狀態
          setState({ focusedElement: null });
          window.readerFocusTargetElement = null; // 清除全域備份

          console.log('已還原頁面原始狀態');
        } catch (error) {
          console.error('[DEBUG] 還原頁面時發生錯誤:', error);
          if (confirm('還原頁面時發生錯誤，是否重新整理頁面？')) {
            window.location.reload();
          }
        }
      }
    };

    return FocusMode;
  }

  // 將工廠函式掛載到 window 上
  window.createFocusMode = createFocusMode;

})();
