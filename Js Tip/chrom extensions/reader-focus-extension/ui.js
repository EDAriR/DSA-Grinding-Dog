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

  // 新增 UI 物件，提供按鈕相關操作
  window.UI = {
    createFloatingButton: createFloatingButton,
    updateButtonIcon: function(title, iconClass) {
      const button = document.getElementById('reader-focus-button');
      if (!button) return;
      button.innerHTML = '';
      button.title = title;
      const icon = document.createElement('i');
      icon.className = 'fas ' + iconClass;
      icon.style.fontSize = '18px';
      button.appendChild(icon);
    },
    updateButtonPosition: function(position) {
      const button = document.getElementById('reader-focus-button');
      if (!button) return;
      if (position === 'left') {
        button.style.left = '0px'; button.style.right = 'auto';
      } else {
        button.style.right = '0px'; button.style.left = 'auto';
      }
    },
    makeDraggable: function(element) {
      // 從 content.js 移植的拖曳邏輯
      var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      element.onmousedown = dragMouseDown;
      function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }
      function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
        pos3 = e.clientX; pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + 'px';
        element.style.left = (element.offsetLeft - pos1) + 'px';
        element.style.right = 'auto';
      }
      function closeDragElement() {
        document.onmouseup = null; document.onmousemove = null;
      }
    }
  };
})();
