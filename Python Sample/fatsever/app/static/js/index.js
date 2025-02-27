document.addEventListener('DOMContentLoaded', () => {
  // 獲取所有需要的 DOM 元素
  const mainContainer = document.getElementById('mainContainer');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('file');
  const messageDiv = document.getElementById('message');
  const imageDialog = document.getElementById('imageDialog');
  const videoDialog = document.getElementById('videoDialog');
  const videoDialogPlayer = document.getElementById('videoDialogPlayer');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  // 主題相關邏輯
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'default') {
    document.body.classList.remove('monokai');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
  } else {
    document.body.classList.add('monokai');
    themeIcon.classList.remove('fa-sun');
    themeIcon.classList.add('fa-moon');
  }

  // 主題切換
  themeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('monokai')) {
      document.body.classList.remove('monokai');
      localStorage.setItem('theme', 'default');
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    } else {
      document.body.classList.add('monokai');
      localStorage.setItem('theme', 'monokai');
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  });

  // 檔案上傳相關
  async function uploadFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        
        // 建立訊息元素
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.role = 'alert';
        alertDiv.textContent = result.info;
        
        // 加入到訊息區
        messageDiv.appendChild(alertDiv);
        
        // 5秒後移除訊息
        setTimeout(() => {
          alertDiv.classList.add('fade-out');
          setTimeout(() => alertDiv.remove(), 500);
        }, 4500);
        
      } catch (error) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.role = 'alert';
        alertDiv.textContent = `上傳失敗: ${error}`;
        
        messageDiv.appendChild(alertDiv);
        
        setTimeout(() => {
          alertDiv.remove();
        }, 30000);
      }
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

  // 檔案卡片點擊事件
  document.querySelectorAll('.file-card').forEach(card => {
    card.addEventListener('click', () => {
      const file = card.dataset.file;
      const type = card.dataset.type;
      if (type === 'image') {
        imageDialog.querySelector('img').src = `/img/${file}`;
        imageDialog.showModal();
      } else if (type === 'video') {
        videoDialogPlayer.src = `/video/${file}`;
        videoDialog.showModal();
        videoDialogPlayer.play();
      }
    });
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
});

async function updateFileLists() {
  try {
    const imgFiles = await fetchFiles('img');
    const videoFiles = await fetchFiles('video');
    const otherFiles = await fetchFiles('files');

    updateFileGrid('imageGrid', imgFiles, 'image');
    updateFileGrid('videoGrid', videoFiles, 'video');
    updateFileGrid('otherGrid', otherFiles, 'other');

    rebindFileCards();
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
  grid.innerHTML = files.map(file => {
    if (fileType === 'image') {
      return `
        <div class="col">
          <div class="file-card" data-file="${file}" data-type="image">
            <img src="/img/${file}" alt="${file}" class="file-card-img">
            <div class="file-card-body">
              <p class="file-card-title">${file}</p>
            </div>
          </div>
        </div>
      `;
    } else if (fileType === 'video') {
      return `
        <div class="col">
          <div class="file-card" data-file="${file}" data-type="video">
            <div class="file-icon"></div>
            <div class="file-card-body">
              <p class="file-card-title">${file}</p>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="col">
          <div class="file-card" data-file="${file}" data-type="other">
            <div class="file-icon"></div>
            <div class="file-card-body">
              <p class="file-card-title">${file}</p>
            </div>
          </div>
        </div>
      `;
    }
  }).join('');
}

function rebindFileCards() {
  document.querySelectorAll('.file-card').forEach(card => {
    card.addEventListener('click', () => {
      const file = card.dataset.file;
      const type = card.dataset.type;
      if (type === 'image') {
        imageDialog.querySelector('img').src = `/img/${file}`;
        imageDialog.showModal();
      } else if (type === 'video') {
        videoDialogPlayer.src = `/video/${file}`;
        videoDialog.showModal();
        videoDialogPlayer.play();
      } else {
        window.open(`/files/${file}`, '_blank');
      }
    });
  });
}