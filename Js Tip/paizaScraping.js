// == Paiza 求人資訊爬取腳本 ==
(async () => {
  if (window.__paizaScraping__) {
    console.warn('⚠️ 已在執行中');
    return;
  }
  window.__paizaScraping__ = true;

  // === 使用者可調整 ===
  const clearCache = true; // true = 每次執行先清空 localStorage 快取
  // ====================

  const normalize = t => t.replace(/\s+/g, ' ').trim();
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // 過濾 (排除) 關鍵字
  const skipKeywords = ["ローコード", "AI", "PM", "PL", "Android", "アプリ", "Salesforce"];
  const shouldSkip = title => {
    const tl = title.toLowerCase();
    return skipKeywords.some(k => tl.includes(k.toLowerCase()));
  };

  // r2 判斷條件
  const r2TitleKeys = ["上流", "大手", "案件"];
  const isR2 = offer => {
    const titleHit = r2TitleKeys.some(k => offer.jobTitle.includes(k));
    const salaryHit = /〜\s*60/.test(offer.想定年収);
    return titleHit || salaryHit;
  };

  /** 解析一頁 HTML → {offers, nextUrl} */
  const parsePageHtml = (html, pageUrl) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const qa = sel => Array.from(doc.querySelectorAll(sel));
    const q = sel => doc.querySelector(sel);

    const offers = qa('.c-job_offer-box--career').map(box => {
      const g = (sel, attr = 'innerText') => {
        const el = box.querySelector(sel);
        return el ? normalize(attr === 'innerText' ? el.innerText : el[attr]) : '';
      };
      const relUrl = g('.c-job_offer-box__header__title__link', 'href');
      const jobTitle = g('.c-job_offer-box__header__title');
      return {
        url: new URL(relUrl, pageUrl).href,
        jobTitle,
        company: g('.c-job_offer-recruiter__name a, .c-job_offer-recruiter__name'),
        想定年収: g('strong.c-job_offer-detail__salary'),
        仕事の内容: g('.c-job_offer-summary dd'),
        必要な能力・経験: [g('.c-job_offer-detail__occupation'), g('.c-job_offer-detail__necessary')].filter(Boolean).join(' | ')
      };
    });

    // 下一頁 URL
    let nextUrl = null;
    const nextIcon = q('.s-kaminari-renewal__next');
    if (nextIcon) {
      const link = nextIcon.closest('a.s-kaminari-renewal__link');
      if (link && link.getAttribute('href')) nextUrl = new URL(link.getAttribute('href'), pageUrl).href;
    }
    return { offers, nextUrl };
  };

  if (clearCache) localStorage.removeItem('paizaJobOffers');
  const r1 = [], r2 = [];

  let currentUrl = location.href;
  let pageIndex = 1;
  console.log('🚀 Paiza Scraper v6 start');

  while (currentUrl) {
    if (window.stopPaizaScrape) break;
    console.log(`📄 下載第 ${pageIndex} 頁 →`, currentUrl);

    let html;
    try {
      html = await (await fetch(currentUrl, { credentials: 'same-origin' })).text();
    } catch (err) {
      console.error('❌ 下載失敗', err);
      break;
    }

    const { offers, nextUrl } = parsePageHtml(html, currentUrl);
    offers.forEach(o => {
      if (shouldSkip(o.jobTitle)) return; // 除外
      (isR2(o) ? r2 : r1).push(o);
    });
    localStorage.setItem('paizaJobOffers', JSON.stringify({ r1, r2 }));

    if (!nextUrl) {
      console.log('🏁 無下一頁，結束');
      break;
    }
    currentUrl = nextUrl;
    pageIndex += 1;
    await sleep(1000);
  }

  console.log('✅ 抓取完成，r1:', r1.length, ' r2:', r2.length);
  console.table(r1, ["jobTitle", "company"]);
  console.table(r2, ["jobTitle", "company"]);
  console.table({ r1, r2 }, ["jobTitle", "company"]);

  window.__paizaScraping__ = false;
  return { r1, r2 };
})();
