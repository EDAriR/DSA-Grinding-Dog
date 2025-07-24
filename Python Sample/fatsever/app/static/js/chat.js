"use strict";

document.addEventListener('DOMContentLoaded', () => {
  const log = document.getElementById('chatLog');
  const input = document.getElementById('messageInput');
  const send = document.getElementById('sendBtn');
  const nameInput = document.getElementById('usernameInput');
  const setNameBtn = document.getElementById('setNameBtn');
  const previewArea = document.getElementById('previewArea');
  let userName = '';

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!resp.ok) {
      throw new Error('upload failed');
    }
    const result = await resp.json();
    const baseUrl = `${location.protocol}//${location.host}`;
    if (result.file_type === 'image') {
      return `${baseUrl}/img/${result.file_location}`;
    }
    if (result.file_type === 'video') {
      return `${baseUrl}/video/${result.file_location}`;
    }
    return `${baseUrl}/files/${result.file_location}`;
  }

  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${scheme}://${location.host}/ws`);
  ws.addEventListener('open', () => {
    if (nameInput.value.trim()) {
      userName = nameInput.value.trim();
    }
    ws.send(JSON.stringify({ type: 'join', name: userName }));
  });

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    appendMessage(data);
  });

  function isLandscape() {
    return window.innerWidth > window.innerHeight;
  }

  function extractPreviewUrls(text) {
    const infos = [];
    const imgReg = /https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S*)?/gi;
    const imgMatches = text.matchAll(imgReg);
    for (const m of imgMatches) {
      infos.push({ type: 'img', url: m[0] });
    }

    const tw = text.match(/https?:\/\/(?:x|twitter)\.com\/[\w@.-]+\/status\/\d+/i);
    if (tw) {
      const url = new URL(tw[0]);
      url.hostname = 'vxtwitter.com';
      infos.push({ type: 'iframe', url: url.toString() });
    }

    const yt = text.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (yt) infos.push({ type: 'iframe', url: `https://www.youtube.com/embed/${yt[1]}` });

    const twitch = text.match(/twitch\.tv\/videos\/(\d+)/);
    if (twitch) infos.push({ type: 'iframe', url: `https://player.twitch.tv/?video=${twitch[1]}&parent=${location.hostname}` });

    const tiktok = text.match(/tiktok\.com\/.+\/video\/(\d+)/);
    if (tiktok) infos.push({ type: 'iframe', url: `https://www.tiktok.com/embed/v2/${tiktok[1]}` });

    return infos;
  }

  function createPreviewElement(info) {
    if (!info) return null;
    if (info.type === 'img') {
      const img = document.createElement('img');
      img.src = info.url;
      img.className = 'img-fluid';
      return img;
    }
    const iframe = document.createElement('iframe');
    iframe.src = info.url;
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.className = 'w-100';
    return iframe;
  }

  function showPreviewSide(el) {
    if (!previewArea) return;
    const wrap = document.createElement('div');
    wrap.className = 'side-preview-item mb-2';
    wrap.appendChild(el);
    previewArea.appendChild(wrap);
  }

  function appendMessage(data) {
    const box = document.createElement('div');
    box.className = 'message-box';

    const header = document.createElement('div');
    header.className = 'message-header';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = data.name || 'System';
    const timeSpan = document.createElement('span');
    timeSpan.className = 'timestamp';
    timeSpan.textContent = new Date(data.timestamp).toLocaleTimeString();
    header.appendChild(nameSpan);
    header.appendChild(timeSpan);
    box.appendChild(header);

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = data.message;
    box.appendChild(textDiv);

    const previews = extractPreviewUrls(data.message || '');
    for (const info of previews) {
      const previewEl = createPreviewElement(info);
      if (isLandscape()) {
        showPreviewSide(previewEl);
      } else {
        const wrap = document.createElement('div');
        wrap.className = 'message-preview mt-2';
        wrap.appendChild(previewEl);
        box.appendChild(wrap);
      }
    }

    log.appendChild(box);
    log.scrollTop = log.scrollHeight;
  }

  function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;
    ws.send(JSON.stringify({ type: 'chat', message: msg }));
    input.value = '';
  }

  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener('paste', async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;
        try {
          const url = await uploadImage(file);
          ws.send(JSON.stringify({ type: 'chat', message: url }));
        } catch (err) {
          console.error('upload error', err);
        }
      }
    }
  });

  setNameBtn.addEventListener('click', () => {
    userName = nameInput.value.trim();
    ws.send(JSON.stringify({ type: 'rename', name: userName }));
  });
});

