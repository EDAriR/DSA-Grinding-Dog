// 動態加載 Turndown 库
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/turndown@7.0.0/dist/turndown.js';
document.head.appendChild(script);

script.onload = function() {
    // 確保 TurndownService 已加載
    var turndownService = new TurndownService();

    // 選擇要轉換的 HTML 元素，這裡是 id 為 'content' 的元素
    // var htmlContent = document.getElementById('content').innerHTML;
    var htmlContent = document.getElementsByClassName('content').innerHTML;

    // 將 HTML 轉換為 Markdown
    var markdown = turndownService.turndown(htmlContent);

    // 創建 Blob 對象
    var markdownBlob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });

    // 創建一個臨時的超鏈接元素來觸發下載
    var downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(markdownBlob);
    downloadLink.download = 'output.md';

    // 觸發下載
    downloadLink.click();

    // 清理 URL 對象
    URL.revokeObjectURL(downloadLink.href);
};