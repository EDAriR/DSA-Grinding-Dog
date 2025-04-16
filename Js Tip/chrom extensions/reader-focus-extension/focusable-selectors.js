// 集中管理可選取元素的選擇器
const FOCUSABLE_SELECTORS = [
  'div', 'section', 'article', 'main', 'aside',
  'header', 'footer', 'nav', '.post', '.content',
  '.article', '#post0', '[class*="content"]',
  '[class*="article"]', '[class*="post"]'
];

// 支援 CommonJS 與瀏覽器全域
if (typeof module !== 'undefined') {
  module.exports = FOCUSABLE_SELECTORS;
} else {
  window.FOCUSABLE_SELECTORS = FOCUSABLE_SELECTORS;
}
