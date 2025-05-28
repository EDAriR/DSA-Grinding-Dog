// bk downloader
// 1. 載入 html2canvas 庫
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.0.0-rc.7/dist/html2canvas.min.js';
document.head.appendChild(script);

// 2. 等待 html2canvas 載入完成
script.onload = function() {
    // 3. 創建 "保存" 按鈕
    var button = document.createElement('button');
    button.id = 'saveBtn';
    button.textContent = '保存';
    document.body.appendChild(button);

    // 4. 綁定按鈕點擊事件
    button.addEventListener('click', function() {
        // 5. 獲取目標元素
        var element = document.getElementById('viewport0');
        if (!element) {
            console.error('未找到 ID 為 "viewport0" 的元素。');
            return;
        }

        // 6. 使用 html2canvas 進行截圖
        html2canvas(element).then(function(canvas) {
            // 7. 創建下載鏈接
            var link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'downloaded_image.png';
            link.click();
        }).catch(function(error) {
            console.error('html2canvas 執行失敗：', error);
        });
    });

    button.click()
};