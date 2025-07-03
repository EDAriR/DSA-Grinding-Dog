"use strict";

document.addEventListener('DOMContentLoaded', () => {
  const log = document.getElementById('chatLog');
  const input = document.getElementById('messageInput');
  const send = document.getElementById('sendBtn');

  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${scheme}://${location.host}/ws`);

  ws.onmessage = (event) => {
    const div = document.createElement('div');
    div.textContent = event.data;
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
