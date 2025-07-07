// 將 dialog 相關變數移到全域範圍
let imageDialog, videoDialog, videoDialogPlayer;

document.addEventListener('DOMContentLoaded', () => {
  // 獲取所有需要的 DOM 元素
  const mainContainer = document.getElementById('mainContainer');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('file');
  const messageDiv = document.getElementById('message');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const mobileThemeToggle = document.getElementById('mobileThemeToggle');
  const mobileThemeIcon = document.getElementById('mobileThemeIcon');

  // 初始化 Materialize components
  M.Tabs.init(document.querySelectorAll('.tabs'));
  M.Sidenav.init(document.querySelectorAll('.sidenav'));

  // 初始化 Materialize tabs
  M.Tabs.init(document.querySelectorAll('.tabs'));

  // 初始化 dialog 變數
  imageDialog = document.getElementById('imageDialog');
  videoDialog = document.getElementById('videoDialog');
  videoDialogPlayer = document.getElementById('videoDialogPlayer');

  // 主題相關邏輯
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'default') {
    document.body.classList.remove('monokai');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
    mobileThemeIcon.classList.remove('fa-moon');
    mobileThemeIcon.classList.add('fa-sun');
  } else {
    document.body.classList.add('monokai');
    themeIcon.classList.remove('fa-sun');
    themeIcon.classList.add('fa-moon');
    mobileThemeIcon.classList.remove('fa-sun');
    mobileThemeIcon.classList.add('fa-moon');
  }

  // 主題切換
  function toggleTheme() {
    if (document.body.classList.contains('monokai')) {
      document.body.classList.remove('monokai');
      localStorage.setItem('theme', 'default');
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
      mobileThemeIcon.classList.remove('fa-moon');
      mobileThemeIcon.classList.add('fa-sun');
    } else {
      document.body.classList.add('monokai');
      localStorage.setItem('theme', 'monokai');
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
      mobileThemeIcon.classList.remove('fa-sun');
      mobileThemeIcon.classList.add('fa-moon');
    }
  }
  themeToggle.addEventListener('click', toggleTheme);
  mobileThemeToggle?.addEventListener('click', () => {
    const sidenavEl = document.querySelector('.sidenav');
    const instance = M.Sidenav.getInstance(sidenavEl);
    instance.close();
    toggleTheme();
  });

  // 檔案上傳相關
  async function uploadFiles(files) {
    const progressDiv = document.getElementById('uploadProgress');
    const total = files.length;
    
    // 建立進度追蹤容器
    const progressContainer = document.createElement('div');
    progressContainer.style.position = 'fixed';
    progressContainer.style.bottom = '10px';
    progressContainer.style.right = '10px';
    progressContainer.style.background = 'rgba(0,0,0,0.7)';
    progressContainer.style.color = '#fff';
    progressContainer.style.padding = '10px';
    progressContainer.style.borderRadius = '5px';
    progressContainer.style.zIndex = '1000';
    document.body.appendChild(progressContainer);
  
    // 同時上傳所有檔案
    const uploadPromises = Array.from(files).map((file, index) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
  
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload", true);
  
        // 為每個檔案建立獨立的進度追蹤
        let startTime = Date.now();
        let lastLoaded = 0;
        const progressElement = document.createElement('div');
        progressElement.textContent = `${file.name}: 0%`;
        progressContainer.appendChild(progressElement);
  
        xhr.upload.onprogress = function(e) {
          if (e.lengthComputable) {
            const currentTime = Date.now();
            const elapsedSeconds = (currentTime - startTime) / 1000;
            const loadedBytes = e.loaded - lastLoaded;
            const bytesPerSecond = loadedBytes / elapsedSeconds;
            const uploadSpeed = (bytesPerSecond / (1024 * 1024)).toFixed(2);
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            
            progressElement.textContent = `${file.name}: ${percentComplete}% (${uploadSpeed} MB/s)`;
  
            lastLoaded = e.loaded;
            startTime = currentTime;
          }
        };
  
        xhr.onload = function() {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            progressElement.textContent = `${file.name}: 完成`;
            setTimeout(() => progressElement.remove(), 1000);
            resolve(result);
          } else {
            progressElement.textContent = `${file.name}: 失敗 (${xhr.statusText})`;
            reject(new Error(xhr.statusText));
          }
        };
  
        xhr.onerror = function(e) {
          progressElement.textContent = `${file.name}: 失敗`;
          reject(e);
        };
  
        xhr.send(formData);
      });
    });
  
    try {
      // 等待所有檔案上傳完成
      await Promise.all(uploadPromises);
      
      // 顯示成功訊息
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-success';
      alertDiv.role = 'alert';
      alertDiv.textContent = `${total} 個檔案上傳完成`;
      messageDiv.appendChild(alertDiv);
      
      setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => alertDiv.remove(), 500);
      }, 4500);
      
      // 移除進度容器
      setTimeout(() => progressContainer.remove(), 1000);
      
      // 重新整理檔案列表
      updateFileLists();
      
    } catch (error) {
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-danger';
      alertDiv.role = 'alert';
      alertDiv.textContent = `上傳發生錯誤: ${error.message}`;
      messageDiv.appendChild(alertDiv);
      
      setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => alertDiv.remove(), 500);
      }, 4500);
    }
  }

  // 拖放相關事件
  mainContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  mainContainer.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  mainContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      uploadFiles(e.dataTransfer.files);
    }
  });

  // 點擊上傳區域
  dropZone.addEventListener('click', () => fileInput.click());

  // 檔案選擇變更
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      uploadFiles(fileInput.files);
    }
  });

  // 剪貼簿上傳
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    const dt = new DataTransfer();
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        dt.items.add(file);
      }
    }
    if (dt.files.length) {
      uploadFiles(dt.files);
    }
  });

  // 圖片對話框點擊關閉
  imageDialog.addEventListener('click', (event) => {
    if (event.target === imageDialog) {
      imageDialog.close();
    }
  });

  // 影片對話框點擊關閉
  videoDialog.addEventListener('click', (event) => {
    if (event.target === videoDialog) {
      videoDialogPlayer.pause();
      videoDialog.close();
    }
  });

  // YouTube 下載表單處理
  const ytDownloadForm = document.getElementById('ytDownloadForm');
  const ytDownloadBtn = document.getElementById('ytDownloadBtn');

  ytDownloadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('youtubeUrl').value;
    
    // 顯示 loading spinner
    const downloadIcon = ytDownloadBtn.querySelector('.fa-download');
    const spinner = ytDownloadBtn.querySelector('.fa-spinner');
    const buttonText = ytDownloadBtn.querySelector('span');
    
    downloadIcon.style.display = 'none';
    spinner.style.display = 'inline-block';
    buttonText.textContent = '處理中';
    ytDownloadBtn.disabled = true;
    
    try {
      // 發送下載請求並獲取任務ID
      const response = await fetch('/api/ytdownloader/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });
      
      const { taskId } = await response.json();
      
      // 建立 SSE 連接
      const eventSource = new EventSource(`/api/ytdownloader/status/${taskId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.status === 'processing') {
          // 更新進度（如果有）
          if (data.progress) {
            buttonText.textContent = `處理中 ${data.progress}%`;
          }
        } else if (data.status === 'completed') {
          // 下載完成
          const alertDiv = document.createElement('div');
          alertDiv.className = 'alert alert-success';
          alertDiv.role = 'alert';
          alertDiv.textContent = '下載成功！';
          messageDiv.appendChild(alertDiv);
          
          setTimeout(() => {
            alertDiv.classList.add('fade-out');
            setTimeout(() => alertDiv.remove(), 500);
          }, 4500);
          
          eventSource.close();
          resetButton();
        } else if (data.status === 'failed') {
          // 下載失敗
          const alertDiv = document.createElement('div');
          alertDiv.className = 'alert alert-danger';
          alertDiv.role = 'alert';
          alertDiv.textContent = `下載失敗: ${data.error || '未知錯誤'}`;
          messageDiv.appendChild(alertDiv);
          
          setTimeout(() => {
            alertDiv.classList.add('fade-out');
            setTimeout(() => alertDiv.remove(), 500);
          }, 4500);
          
          eventSource.close();
          resetButton();
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        resetButton();
      };
      
    } catch (error) {
      // 處理初始請求錯誤
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-danger';
      alertDiv.role = 'alert';
      alertDiv.textContent = `下載失敗: ${error.message}`;
      messageDiv.appendChild(alertDiv);
      
      setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => alertDiv.remove(), 500);
      }, 4500);
      
      resetButton();
    }
    
    function resetButton() {
      downloadIcon.style.display = 'inline-block';
      spinner.style.display = 'none';
      buttonText.textContent = '下載';
      ytDownloadBtn.disabled = false;
    }
  });

  // 改用事件委派處理所有文件操作
  document.addEventListener('click', async (e) => {
    // 處理刪除按鈕
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      
      const fileName = deleteBtn.dataset.file;
      const fileType = deleteBtn.dataset.type;
      
      if (confirm(`確定要刪除 ${fileName} 嗎？`)) {
        try {
          const response = await fetch(`/api/files/${fileType}/${fileName}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            const col = deleteBtn.closest('.col');
            if (col) {
              col.remove();
              
              const alertDiv = document.createElement('div');
              alertDiv.className = 'alert alert-success';
              alertDiv.textContent = '檔案已成功刪除';
              messageDiv.appendChild(alertDiv);
              setTimeout(() => alertDiv.remove(), 3000);
              
              // 重新整理檔案列表
              updateFileLists();
            }
          } else {
            throw new Error('刪除失敗');
          }
        } catch (error) {
          console.error('Delete error:', error);
          const alertDiv = document.createElement('div');
          alertDiv.className = 'alert alert-danger';
          alertDiv.textContent = '刪除檔案時發生錯誤';
          messageDiv.appendChild(alertDiv);
          setTimeout(() => alertDiv.remove(), 3000);
        }
      }
      return;
    }

    // 處理檔案卡片點擊
    const fileCard = e.target.closest('.file-card');
    if (fileCard && !e.target.closest('.delete-btn')) {
      const file = fileCard.dataset.file;
      const type = fileCard.dataset.type;
      
      if (type === 'image') {
        e.preventDefault();
        const img = imageDialog.querySelector('img');
        if (img) {
          img.src = `/img/${file}`;
          imageDialog.showModal();
        }
      } else if (type === 'video') {
        e.preventDefault();
        videoDialogPlayer.src = `/video/${file}`;
        videoDialog.showModal();
        videoDialogPlayer.play();
      }
    }
  });
});

async function updateFileLists() {
  try {
    const imgFiles = await fetchFiles('img');
    const videoFiles = await fetchFiles('video');
    const otherFiles = await fetchFiles('files');

    updateFileGrid('imageGrid', imgFiles, 'image');
    updateFileGrid('videoGrid', videoFiles, 'video');
    updateFileGrid('otherGrid', otherFiles, 'other');
  } catch (error) {
    console.error('Error updating file lists:', error);
  }
}

async function fetchFiles(fileType) {
  const response = await fetch(`/files?filetype=${fileType}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

function updateFileGrid(gridId, files, fileType) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  
  // 清空現有內容並重建
  grid.innerHTML = '';
  
  // 檔案去重
  let uniqueFiles = files;
  if (fileType !== 'video') {
    uniqueFiles = [...new Set(files)];
  }

  // 為不同檔案類型創建對應的卡片
  let html = '';
  if (fileType === 'video') {
    uniqueFiles.forEach(item => {
      const videoName = item.video ?? item;
      const thumbnail = item.thumbnail ?? null;
      html += `
        <div class="col">
          <div class="file-card" data-file="${videoName}" data-type="video">
            ${thumbnail
              ? `<img src="/video/${thumbnail}" alt="${videoName}" class="file-card-img">`
              : `<div class="video-icon"></div>`
            }
            <div class="file-card-body">
              <p class="file-card-title">${videoName}</p>
            </div>
            <button class="btn btn-danger btn-sm delete-btn"
                    data-file="${videoName}"
                    data-type="video"
                    style="position: absolute; top: 5px; right: 5px;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });
  } else if (fileType === 'image') {
    uniqueFiles.forEach(file => {
      html += `
        <div class="col">
          <div class="file-card" data-file="${file}" data-type="image" title="${file}">
            <img src="/img/${file}" alt="${file}" class="file-card-img">
            <button class="btn btn-danger btn-sm delete-btn" 
                    data-file="${file}" 
                    data-type="image"
                    style="position: absolute; top: 5px; right: 5px;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });
  } else {
    uniqueFiles.forEach(file => {
      html += `
        <div class="col">
          <a class="file-card" href="/files/${file}" download data-file="${file}" data-type="other">
            <div class="file-icon"></div>
            <div class="file-card-body">
              <p class="file-card-title">${file}</p>
            </div>
            <button class="btn btn-danger btn-sm delete-btn" 
                    data-file="${file}" 
                    data-type="other"
                    style="position: absolute; top: 5px; right: 5px;">
              <i class="fas fa-trash"></i>
            </button>
          </a>
        </div>
      `;
    });
  }
  
  grid.innerHTML = html;
}