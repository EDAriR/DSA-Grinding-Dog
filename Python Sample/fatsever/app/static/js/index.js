const mainContainer = document.getElementById('mainContainer');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('file');
const uploadForm = document.getElementById('uploadForm');
const messageDiv = document.getElementById('message');

// dialog 元素
const imageDialog = document.getElementById('imageDialog');
const imageDialogImg = document.getElementById('imageDialogImg');
const closeImageDialog = document.getElementById('closeImageDialog');

const videoDialog = document.getElementById('videoDialog');
const videoDialogPlayer = document.getElementById('videoDialogPlayer');
const closeVideoDialog = document.getElementById('closeVideoDialog');

// 監聽 file-card 點擊
document.querySelectorAll('.file-card').forEach(card => {
  card.addEventListener('click', () => {
    const file = card.dataset.file;
    const type = card.dataset.type;
    if (type === 'image') {
      imageDialogImg.src = `/img/${file}`;
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

// 監聽 imageDialog，如果點擊對象是 dialog 本身，也就是空白處，則關閉
imageDialog.addEventListener('click', (event) => {
  if (event.target === imageDialog) {
    imageDialog.close();
  }
});

// 關閉 dialog
closeImageDialog.addEventListener('click', () => {
  imageDialog.close();
});

// 新增：監聽 videoDialog，如果點擊對象是 dialog 本身，也就是空白處，則關閉對話框
videoDialog.addEventListener('click', event => {
  if (event.target === videoDialog) {
    videoDialogPlayer.pause();
    videoDialog.close();
  }
});

// Drag & Drop + Paste 邏輯
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
  const files = e.dataTransfer.files;
  if (files.length) {
    uploadFiles(files);
  }
});

// 保留 dropZone 的點擊行為
dropZone.addEventListener('click', () => fileInput.click());

document.addEventListener('paste', (e) => {
  const items = e.clipboardData.items;
  const dt = new DataTransfer();  // 收集檔案
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === 'file') {
      const file = items[i].getAsFile();
      dt.items.add(file);
    }
  }
  if (dt.files.length) {
    uploadFiles(dt.files);
    updateFileLists();
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    uploadFiles(fileInput.files);
    updateFileLists();
  }
});

async function uploadFiles(fileList) {
  // 清空訊息區（依需求可調整）
  messageDiv.innerHTML = "";
  for (let i = 0; i < fileList.length; i++) {
    let file = fileList[i];
    let fileName = file.name;
    // 假設預設名稱為 "image.png"、"image.jpg" 等，可依需求調整
    const defaultNames = ["image.png", "image.jpg", "video.mp4"];
    if (defaultNames.includes(fileName.toLowerCase())) {
      // 檢查檔案類型，若是 image 則用 "img_"，video 則用 "vid_"
      const prefix = file.type.startsWith("image/") ? "img_" :
                     file.type.startsWith("video/") ? "vid_" : "file_";
      const d = new Date();
      // 生成 YYYYMMDDhhmmssSSS 格式字串
      const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}${String(d.getMilliseconds()).padStart(3, '0')}`;
      // 根據 mime type 取得副檔名 (例如 image/webp 取得 webp)
      const ext = file.type.split("/")[1];
      fileName = `${prefix}${ts}.${ext}`;
      // 建立新的 File 物件，新檔名可覆蓋預設名稱
      file = new File([file], fileName, { type: file.type, lastModified: file.lastModified });
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      // 將每次上傳結果顯示在訊息區
      messageDiv.innerHTML += `<div class="alert alert-success" role="alert">${result.info}</div>`;
    } catch (error) {
      messageDiv.innerHTML += `<div class="alert alert-danger" role="alert">上傳失敗: ${error}</div>`;
    }
  }
}

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
        imageDialogImg.src = `/img/${file}`;
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