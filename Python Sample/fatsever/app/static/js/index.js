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
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    uploadFile();
  }
});

document.addEventListener('paste', (e) => {
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === 'file') {
      const file = items[i].getAsFile();
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      uploadFile();
    }
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    uploadFile();
  }
});

async function uploadFile() {
  const formData = new FormData(uploadForm);
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  const result = await response.json();
  messageDiv.innerHTML = `<div class="alert alert-success" role="alert">${result.info}</div>`;
  // 上傳成功後更新檔案列表
  await updateFileLists();
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