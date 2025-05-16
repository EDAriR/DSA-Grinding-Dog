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
      let originalBodyUserSelect = document.body.style.userSelect;
      let pointerMoveHandler, pointerUpHandler;
      // 水平位置 side: 'left' or 'right'; 預設 right
      const side = element.dataset.positionSide || 'right';
      element.dataset.positionSide = side;
      // 由 updateButtonPosition() 設定預設位置，初次不需新增 class

      element.addEventListener('pointerdown', function onPointerDown(e) {
        e.preventDefault();
        element.setPointerCapture(e.pointerId);
        document.body.style.userSelect = 'none';
        element.style.cursor = 'grabbing';
        // 記錄初始 Y 值及移動狀態
        const initialY = e.clientY;
        let moved = false;
        // 確保按鈕寬高一致
        const size = element.offsetWidth;
        element.style.height = size + 'px';

        pointerMoveHandler = function(e) {
          const delta = e.clientY - initialY;
          if (!moved && Math.abs(delta) > 0) {
            moved = true;
          }
          if (moved) {
            // Y 軸跟隨游標且限制邊界
            let y = e.clientY;
            const maxY = window.innerHeight - element.offsetHeight;
            y = Math.max(0, Math.min(y, maxY));
            element.style.top = y + 'px';
          }
        };
        pointerUpHandler = function(e) {
          element.releasePointerCapture(e.pointerId);
          document.body.style.userSelect = originalBodyUserSelect;
          element.style.cursor = 'grab';
          document.removeEventListener('pointermove', pointerMoveHandler);
          document.removeEventListener('pointerup', pointerUpHandler);
          if (moved) {
            window.dispatchEvent(new CustomEvent('readerFocusButtonMoved', {
              detail: {
                side: side,
                top: element.style.top,
                custom: element.dataset.custom === 'true'
              }
            }));
          }
        };
        document.addEventListener('pointermove', pointerMoveHandler);
        document.addEventListener('pointerup', pointerUpHandler);
      });
    }
  };
})();
