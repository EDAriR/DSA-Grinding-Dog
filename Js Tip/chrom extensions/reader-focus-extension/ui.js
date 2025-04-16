// ui.js - 只重構 createFloatingButton
(function() {
  function createFloatingButton(clickHandler) {
    console.log('[DEBUG] 開始建立懸浮按鈕');
    var floatButton = document.createElement('button');
    floatButton.id = 'reader-focus-button';
    // 注入 FontAwesome 樣式表
    if (!document.getElementById('font-awesome-css')) {
      var fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.id = 'font-awesome-css';
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(fontAwesomeLink);
    }
    var iconSpan = document.createElement('i');
    iconSpan.className = 'fas fa-eye';
    iconSpan.style.fontSize = '18px';
    floatButton.appendChild(iconSpan);
    floatButton.title = '選取區塊';
    if (clickHandler) {
      floatButton.addEventListener('click', clickHandler, true);
      floatButton.onclick = clickHandler;
    }
    floatButton.style.zIndex = '9999999';
    floatButton.style.position = 'fixed';
    floatButton.style.pointerEvents = 'auto';
    document.body.appendChild(floatButton);
    console.log('[DEBUG] 懸浮按鈕已建立');
    return floatButton;
  }
  window.createFloatingButton = createFloatingButton;
})();
