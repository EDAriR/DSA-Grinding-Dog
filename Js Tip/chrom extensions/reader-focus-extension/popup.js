/**
 * 閱讀區塊專注模式擴充功能 - 彈出視窗功能
 */

// 當文件載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
  // 選取按鈕元素
  const toggleButton = document.getElementById('toggle-focus');
  const positionLeftBtn = document.getElementById('position-left');
  const positionRightBtn = document.getElementById('position-right');
  
  // 載入儲存的按鈕位置設定
  chrome.storage.local.get(['buttonPosition'], function(result) {
    const position = result.buttonPosition || 'right';
    updatePositionButtonUI(position);
  });
  
  // 切換專注模式按鈕點擊事件
  toggleButton.addEventListener('click', function() {
    // 向當前活動分頁傳送訊息
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleFocus'}, function(response) {
        if (response && response.success) {
          window.close(); // 成功後關閉彈出視窗
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
