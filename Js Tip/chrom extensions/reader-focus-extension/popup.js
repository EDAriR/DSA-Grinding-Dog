/**
 * 閱讀區塊專注模式擴充功能 - 彈出視窗功能
 */

// 當文件載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
  // 選取按鈕元素
  const toggleButton = document.getElementById('toggle-focus');
  const positionLeftBtn = document.getElementById('position-left');
  const positionRightBtn = document.getElementById('position-right');
  const applyBtn = document.getElementById('apply-selector');
  const customItem = document.getElementById('custom-selector-item');
  const customInput = document.getElementById('custom-selector-input');
  const toggleHideSiteButton = document.getElementById('toggle-hide-site-button');
  const toggleDarkModeButton = document.getElementById('toggle-dark-mode');

  // 控制項群組，方便統一啟用/禁用
  const controlsToDisableWhenHidden = [
    toggleButton,
    positionLeftBtn,
    positionRightBtn,
    applyBtn,
    customInput
  ];

  // 函數：更新UI元素的禁用狀態
  function updateControlsDisabledState(isDisabled) {
    controlsToDisableWhenHidden.forEach(control => {
      control.disabled = isDisabled;
    });
    // if (isDisabled) {
    //   customItem.style.display = 'none'; // 如果按鈕隱藏，也隱藏自訂選取器區域
    // } else {
    //   // 重新查詢狀態以決定是否顯示自訂選取器
    //   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //     chrome.tabs.sendMessage(tabs[0].id, { action: 'getStatus' }, function(response) {
    //       if (response && !response.hasFocusedElement) {
    //         customItem.style.display = 'block';
    //       }
    //     });
    //   });
    // }
  }

  // 在彈窗開啟時，查詢內容腳本狀態並更新按鈕文字與自訂選取器區塊
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getStatus' }, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Error getting status from content script:", chrome.runtime.lastError.message);
        // 可能需要禁用所有功能或顯示錯誤訊息
        updateControlsDisabledState(true);
        toggleHideSiteButton.textContent = '錯誤：無法連接';
        toggleHideSiteButton.disabled = true;
        return;
      }

      if (response) {
        if (response.isButtonHidden) {
          toggleHideSiteButton.textContent = `在此網站顯示按鈕`;
          toggleHideSiteButton.classList.add('hidden-active');
          updateControlsDisabledState(true);
        } else {
          toggleHideSiteButton.textContent = `在此網站隱藏按鈕`;
          toggleHideSiteButton.classList.remove('hidden-active');
          updateControlsDisabledState(false); // 預設啟用

          // 根據是否有焦點元素，更新 "選取/取消專注" 按鈕和自訂選取器可見性
          if (response.hasFocusedElement) {
            toggleButton.textContent = '取消專注模式';
            // customItem.style.display = 'none';
          } else {
            toggleButton.textContent = '選取閱讀區塊';
            // customItem.style.display = 'block';
            applyBtn.disabled = false;
            customInput.disabled = false;
          }
        }
      } else {
        // 沒有收到回應，可能內容腳本還沒注入或頁面不允許
        updateControlsDisabledState(true);
        toggleHideSiteButton.textContent = '無法在此頁面操作';
        toggleHideSiteButton.disabled = true;
      }
    });
  });
  
  // 載入儲存的按鈕位置設定
  chrome.storage.local.get(['buttonPosition'], function(result) {
    const position = result.buttonPosition || 'right';
    updatePositionButtonUI(position);
  });
  
  // 切換專注模式按鈕點擊事件
  toggleButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleFocus' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          alert('無法切換專注模式：內容腳本未回應');
        } else if (response && response.success) {
          window.close();
        } else {
          alert('切換專注模式失敗');
        }
      });
    });
  });
  
  // 點擊套用自訂選取器
  applyBtn.addEventListener('click', function() {
    const selector = customInput.value.trim();
    if (!selector) {
      alert('請輸入 CSS 選取器');
      return;
    }
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'setCustomSelector', selector: selector }, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          alert('套用失敗，內容腳本未回應');
        } else if (response && response.success) {
          // 套用成功後，隱藏自訂選取器區塊
          // customItem.style.display = 'none';
          applyBtn.disabled = true;
          customInput.disabled = true;
          toggleButton.textContent = '取消專注模式';
        } else {
          alert(response.error || '套用失敗');
        }
      });
    });
  });
  
  // 切換黑暗模式按鈕點擊事件
  toggleDarkModeButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || tabs.length === 0 || !tabs[0].id) {
        console.error('[Extension Popup] Dark Mode: Could not get active tab ID.');
        alert('無法獲取當前分頁資訊以切換黑暗模式。');
        return;
      }
      const tabId = tabs[0].id;
      console.log(`[Extension Popup] Attempting to inject script into tab ID: ${tabId}`);

      chrome.scripting.executeScript({
        target: {tabId: tabId},
        func: () => {
          console.log('[Injected Script] Filter-based dark mode script executed on page!');
          const d = document.documentElement;
          const mediaSelectors = 'img, video, canvas, svg, embed, object, picture';
          const filterValue = 'invert(1) hue-rotate(180deg)';
          const htmlMarkerClass = 'extension-dark-mode-active-filter';
          const originalFilterDatasetKey = 'extensionOriginalFilter';

          if (d.classList.contains(htmlMarkerClass)) {
            // Dark mode is on, turn it off
            d.style.filter = '';
            d.classList.remove(htmlMarkerClass);
            document.querySelectorAll(mediaSelectors).forEach(el => {
              if (el.dataset[originalFilterDatasetKey] !== undefined) {
                el.style.filter = el.dataset[originalFilterDatasetKey];
                delete el.dataset[originalFilterDatasetKey];
              } else if (el.style.filter === filterValue) {
                el.style.filter = '';
              }
            });
            console.log('[Injected Script] Filter dark mode turned OFF.');
            return {success: true, mode: 'off'};
          } else {
            // Dark mode is off, turn it on
            d.style.filter = filterValue;
            d.classList.add(htmlMarkerClass);
            document.querySelectorAll(mediaSelectors).forEach(el => {
              el.dataset[originalFilterDatasetKey] = el.style.filter || '';
              el.style.filter = filterValue; // Apply filter again to revert media
            });
            console.log('[Injected Script] Filter dark mode turned ON.');
            return {success: true, mode: 'on'};
          }
        }
      }, (injectionResults) => {
        if (chrome.runtime.lastError) {
          console.error('[Extension Popup] Dark Mode Script Execution Error:', chrome.runtime.lastError.message);
          alert('切換黑暗模式失敗：' + chrome.runtime.lastError.message);
        } else if (injectionResults && injectionResults[0] && injectionResults[0].result) {
          console.log('[Extension Popup] Dark Mode Script Injection Result:', injectionResults[0].result);
        } else {
          console.error('[Extension Popup] Dark Mode Script Execution Failed: No results or unexpected result format.', injectionResults);
          alert('切換黑暗模式時發生未知錯誤。');
        }
      });
    });
  });
  
  // 左上角位置按鈕點擊事件
  positionLeftBtn.addEventListener('click', function() {
    changeButtonPosition('left');
  });
  
  // 右上角位置按鈕點擊事件
  positionRightBtn.addEventListener('click', function() {
    changeButtonPosition('right');
  });

  // 新增：切換目前網站按鈕顯示狀態的按鈕點擊事件
  toggleHideSiteButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0] || !tabs[0].id) {
        console.error("無法獲取當前分頁資訊");
        alert('無法獲取當前分頁資訊');
        return;
      }
      // 再次獲取最新狀態，以防萬一
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getStatus' }, function(statusResponse) {
        if (chrome.runtime.lastError) {
          console.error("Error getting status before toggle hide/show:", chrome.runtime.lastError.message);
          alert('操作失敗，無法獲取按鈕狀態');
          return;
        }

        if (statusResponse && typeof statusResponse.isButtonHidden !== 'undefined') {
          const action = statusResponse.isButtonHidden ? 'showButtonForSite' : 'hideButtonForSite';
          chrome.tabs.sendMessage(tabs[0].id, { action: action }, function(response) {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              alert('切換按鈕顯示狀態失敗：內容腳本未回應');
            } else if (response && response.success) {
              // 更新彈出視窗UI
              if (action === 'hideButtonForSite') {
                toggleHideSiteButton.textContent = `在此網站顯示按鈕`;
                toggleHideSiteButton.classList.add('hidden-active');
                updateControlsDisabledState(true);
              } else {
                toggleHideSiteButton.textContent = `在此網站隱藏按鈕`;
                toggleHideSiteButton.classList.remove('hidden-active');
                updateControlsDisabledState(false);
                // 重新整理其他按鈕的狀態，因為它們現在應該是啟用的
                if (statusResponse.hasFocusedElement) {
                    toggleButton.textContent = '取消專注模式';
                    customItem.style.display = 'none';
                } else {
                    toggleButton.textContent = '選取閱讀區塊';
                    customItem.style.display = 'block';
                }
              }
              // window.close(); // 可以選擇在操作後關閉彈窗
            } else {
              alert(response.error || '切換按鈕顯示狀態失敗');
            }
          });
        } else {
          alert('無法獲取按鈕目前狀態，請重試');
        }
      });
    });
  });

  // 變更按鈕位置
  function changeButtonPosition(position) {
    // 更新儲存的設定
    chrome.storage.local.set({buttonPosition: position}, function() {
      updatePositionButtonUI(position);
      
      // 向當前活動分頁傳送訊息
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updatePosition',
          position: position
        });
      });
    });
  }
  
  // 更新按鈕 UI
  function updatePositionButtonUI(position) {
    if (position === 'left') {
      positionLeftBtn.style.backgroundColor = '#3367d6';
      positionRightBtn.style.backgroundColor = '#4285f4';
    } else {
      positionLeftBtn.style.backgroundColor = '#4285f4';
      positionRightBtn.style.backgroundColor = '#3367d6';
    }
  }
});
