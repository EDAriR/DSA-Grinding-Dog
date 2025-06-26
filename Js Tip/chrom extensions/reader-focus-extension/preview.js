// 在預覽頁面進行圖片拼接（全域函式）
async function stitchImagesInPreview(imageUrls) {
    try {
        const loadingDiv = document.getElementById('loading');
        const stitchedImage = document.getElementById('stitched-image');
        const downloadBtn = document.getElementById('download-btn');
        
        loadingDiv.textContent = '正在拼接圖片...';
        loadingDiv.style.display = 'block';
        
        // 建立隱藏的 canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 載入所有圖片
        const images = await Promise.all(
            imageUrls.map(url => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = url;
                });
            })
        );

        console.log('[Preview] 所有圖片載入完成，開始拼接');

        // 計算總高度和最大寬度
        let totalHeight = 0;
        let maxWidth = 0;
        
        images.forEach(img => {
            totalHeight += img.height;
            maxWidth = Math.max(maxWidth, img.width);
        });

        // 設定 canvas 尺寸
        canvas.width = maxWidth;
        canvas.height = totalHeight;

        // 拼接圖片
        let currentY = 0;
        images.forEach(img => {
            ctx.drawImage(img, 0, currentY);
            currentY += img.height;
        });

        console.log('[Preview] 拼接完成，尺寸:', maxWidth, 'x', totalHeight);

        // 轉換為 dataURL 並顯示
        const stitchedDataUrl = canvas.toDataURL('image/png');
        stitchedImage.src = stitchedDataUrl;
        loadingDiv.style.display = 'none';
        downloadBtn.disabled = false;

        // 移除可能存在的舊事件監聽器，添加新的下載功能
        const newDownloadBtn = downloadBtn.cloneNode(true);
        downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
        
        newDownloadBtn.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = stitchedDataUrl;
            a.download = `stitched-screenshot-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

    } catch (error) {
        console.error('[Preview] 拼接失敗:', error);
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.textContent = '拼接失敗：' + error.message;
        }
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.disabled = true;
        }
    }
}

// 監聽來自 background 的訊息（備選方案）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'loadImages' && message.originalImages) {
        console.log('[Preview] 收到來自 background 的圖片數據:', message.originalImages.length, '張');
        loadOriginalImages(message.originalImages);
        sendResponse({ success: true });
    }
});

function loadOriginalImages(originalImages) {
    const originalImagesContainer = document.getElementById('original-images');
    
    // 清空現有內容
    originalImagesContainer.innerHTML = '';
    
    originalImages.forEach((imageUrl, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'original-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `截圖 ${index + 1}`;
        
        const caption = document.createElement('div');
        caption.className = 'caption';
        caption.textContent = `截圖 ${index + 1}`;
        
        itemDiv.appendChild(img);
        itemDiv.appendChild(caption);
        originalImagesContainer.appendChild(itemDiv);
    });

    // 開始拼接
    if (originalImages.length > 0) {
        console.log('[Preview] 開始拼接', originalImages.length, '張圖片');
        stitchImagesInPreview(originalImages);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const originalImagesContainer = document.getElementById('original-images');
    const stitchedImage = document.getElementById('stitched-image');
    const downloadBtn = document.getElementById('download-btn');
    const loadingDiv = document.getElementById('loading');

    const urlParams = new URLSearchParams(window.location.search);
    const stitchedImageUrl = urlParams.get('stitchedImage');
    const originalImagesParam = urlParams.get('originalImages');

    let originalImages = [];

    // 顯示原始截圖
    if (originalImagesParam) {
        try {
            originalImages = JSON.parse(decodeURIComponent(originalImagesParam));
            originalImages.forEach((imageUrl, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'original-item';
                
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = `截圖 ${index + 1}`;
                
                const caption = document.createElement('div');
                caption.className = 'caption';
                caption.textContent = `截圖 ${index + 1}`;
                
                itemDiv.appendChild(img);
                itemDiv.appendChild(caption);
                originalImagesContainer.appendChild(itemDiv);
            });

            // 如果沒有拼接結果，直接在這裡進行拼接
            if (!stitchedImageUrl && originalImages.length > 0) {
                console.log('[Preview] 沒有拼接結果，開始在預覽頁面拼接');
                stitchImagesInPreview(originalImages);
            }
        } catch (e) {
            console.error('解析原始圖片失敗:', e);
            originalImagesContainer.innerHTML = '<p>無法載入原始截圖</p>';
        }
    } else {
        originalImagesContainer.innerHTML = '<p>無原始截圖資料</p>';
    }

    // 顯示拼接後的圖片
    if (stitchedImageUrl) {
        stitchedImage.src = decodeURIComponent(stitchedImageUrl);
        stitchedImage.onload = () => {
            loadingDiv.style.display = 'none';
            downloadBtn.disabled = false;
        };
        stitchedImage.onerror = () => {
            loadingDiv.textContent = '拼接圖片載入失敗';
            downloadBtn.disabled = true;
        };
        
        downloadBtn.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = stitchedImage.src;
            a.download = `stitched-screenshot-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    } else {
        loadingDiv.textContent = '等待拼接完成...';
        downloadBtn.disabled = true;
    }
});
