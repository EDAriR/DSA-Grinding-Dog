try {
  importScripts('turndown.js');
} catch (e) {
  console.error('無法載入 Turndown:', e);
}

function convertHtmlToMarkdown(html, removeHidden = false) {
  if (typeof TurndownService !== 'function') {
    throw new Error('TurndownService 未載入');
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  if (removeHidden) {
    doc.querySelectorAll('[style*="display:none" i], [hidden]').forEach(el => el.remove());
  }
  const turndownService = new TurndownService();
  return turndownService.turndown(doc.body || doc);
}

// 若在瀏覽器頁面直接引入，可提供全域函式方便呼叫
if (typeof window !== 'undefined') {
  window.convertHtmlToMarkdown = convertHtmlToMarkdown;
}
