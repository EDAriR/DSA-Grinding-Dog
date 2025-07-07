"use strict";

document.addEventListener('DOMContentLoaded', () => {
  const log = document.getElementById('chatLog');
  const input = document.getElementById('messageInput');
  const send = document.getElementById('sendBtn');

  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${scheme}://${location.host}/ws`);

  ws.onmessage = (event) => {
    const div = document.createElement('div');
    const msg = event.data.trim();
    // 若訊息包含圖片 URL，則顯示預覽
    if (/https?:\/\/\S+\.(?:png|jpe?g|gif|webp)/i.test(msg)) {
      const img = document.createElement('img');
      img.src = msg;
      img.alt = msg;
      img.style.maxWidth = '200px';
      div.appendChild(img);
    } else {
      div.textContent = msg;
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  };

  function submit() {
    if (input.value.trim() !== '') {
      ws.send(input.value.trim());
      input.value = '';
    }
  }

  send.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  });
});
