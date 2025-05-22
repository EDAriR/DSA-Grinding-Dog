(() => {
    /* ---------- 工具 ---------- */
    const normalizeDigits = str =>
        str.replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0))
           .replace(/,/g, '');

    // 將字串正規化，方便關鍵字比對
    const normalizeTechString = (str) => {
        if (typeof str !== 'string') return '';
        let normalized = str;
        // 轉換全形英數字元及常用標點為半形
        normalized = normalized.replace(
            /[Ａ-Ｚａ-ｚ０-９！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝～]/g,
            (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
        );
        // 轉換全形空白為半形空白
        normalized = normalized.replace(/　/g, ' ');
        // 移除所有空白字元 (包括換行、tab、多個空白等)
        normalized = normalized.replace(/\\s+/g, '');
        return normalized;
    };

    const parseSalary = s => {
        const m = s.match(/(\d[\d,]*)\s*万円(?:\s*[～\-]\s*(\d[\d,]*)\s*万円)?/);
        if (!m) return { ok: false };
        const low  = parseInt(normalizeDigits(m[1]), 10);
        const high = m[2] ? parseInt(normalizeDigits(m[2]), 10) : null;

        // 新邏輯歸納：
        // 1. 無最高薪資：最低薪資 <= 410 勾選，其餘不勾選
        // 2. 有最高薪資：
        //    a. 最高薪資 >= 750 且最低薪資 >= 500，不勾選
        //    b. 最高薪資 >= 700 且最低薪資 >= 400，不勾選
        //    c. 其餘（如 200~500、300~600、400~650...）都勾選
        let wantCheck = false;
        if (high === null) {
            wantCheck = low <= 410;
        } else if (high >= 600 && low >= 400) {
            wantCheck = false;
        } else {
            wantCheck = true;
        }
        const ok = wantCheck; // ok=true 代表要勾選
        return { ok, low, high };
    };

    /* ---------- 主流程 ---------- */
    const resultsY = [];
    const resultsN = [];
    document.querySelectorAll('.mod-jobList-item.jobOfferPost-job')
        .forEach(item => {
            /* Title & URL（雙版本相容） */
            const aTitle  = item.querySelector('h2.jobOfferPost-jobTitle a');
            const h2Alt   = item.querySelector('h2.jobOfferPost-jobSubTitle');
            const jobTitle = aTitle?.textContent.trim() || h2Alt?.textContent.trim() || '';
            const url      = aTitle?.href || h2Alt?.querySelector('a')?.href || '';

            /* Company */
            const company  = item.querySelector('h3.jobOfferPost-jobSubTitle')
                              ?.textContent.trim() || '';

            /* Salary → condSalary（true = 要排除） */
            const salaryText = item.querySelector('dt.jobOfferPost-jobDetails__salary + dd')
                                    ?.textContent.trim() || '';
            const { ok: condSalary } = parseSalary(salaryText);

            /* Content & Ability */
            const content = item.querySelector('h3.jobOfferPost-jobDetails__content + p')
                              ?.textContent.trim() || '';
            const ability = item.querySelector('h3.jobOfferPost-jobDetails__ability + p')
                              ?.textContent.trim() || '';

            // 使用正規化後的 content 進行比對
            const normalizedContent = normalizeTechString(content);
            const condContent = /(Salesforce|Android|Swift|C#|PHP|C\\+\\+|VB\\.NET|django)/i.test(normalizedContent);

            // --- 偵錯用 Start ---
            if (content.includes("VB.NET") || content.includes("ＶＢ．ＮＥＴ")) {
                console.log("Original content:", content);
                console.log("Normalized content:", normalizedContent);
                console.log("condContent result for VB.NET:", /(VB\\.NET)/i.test(normalizedContent));
                console.log("Full condContent result:", condContent);
            }
            // --- 偵錯用 End ---

            // 優化：所有條件皆加上單字邊界，避免誤判，並加回明確的 PM 和 ＰＭ
            const condTitle = /\b(PMO?|PM|PHP|講師|プロジェクトマネージャー|フロントエンジニア|PL)\b|\b(ＰＭＯ?|ＰＭ|ＰＨＰ)\b/i.test(jobTitle);

            const shouldCheck = condSalary || condContent || condTitle;
            if (shouldCheck) {
                const checkbox = item.querySelector('input[data-jobofferpost-ui="jobCheckbox"]');
                if (checkbox && !checkbox.checked) {
                    checkbox.click(); // 以 click 方式勾選
                }
                resultsY.push({
                    // url,
                    jobTitle,
                    company,
                    想定年収: salaryText,
                    仕事の内容: content,
                    必要な能力・経験: ability
                });
            }else {
                resultsN.push({
                // url,
                jobTitle,
                company,
                想定年収: salaryText,
                仕事の内容: content,
                必要な能力・経験: ability
            });
            }            
        });

    console.table(resultsN, ["jobTitle", "company"]);
    console.table(resultsY, ["jobTitle", "company"]);
    return resultsN;
})();