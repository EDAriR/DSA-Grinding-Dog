(() => {
    /* ---------- 工具 ---------- */
    const normalizeDigits = str =>
        str.replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0))
           .replace(/,/g, '');

    const parseSalary = s => {
        const m = s.match(/(\d[\d,]*)\s*万円(?:\s*[～\-]\s*(\d[\d,]*)\s*万円)?/);
        if (!m) return { ok: false };
        const low  = parseInt(normalizeDigits(m[1]), 10);
        const high = m[2] ? parseInt(normalizeDigits(m[2]), 10) : null;

        // 新邏輯：
        // 1. 無最高薪資且最低薪資>=300，勾選
        // 2. 最高薪資>=750且最低薪資>=500，不勾選
        // 3. 最高薪資>=700且最低薪資>=400，不勾選
        // 其餘都勾選
        let wantCheck = false;
        if (high === null && low <= 300) {
            wantCheck = true;
        } else if (low >= 400 && high >= 700) {
            wantCheck = false;
        } else {
            wantCheck = false;
        }
        const ok = wantCheck; // ok=true 代表要勾選
        return { ok, low, high };
    };

    /* ---------- 主流程 ---------- */
    const results = [];
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

            const condContent = /(Salesforce|Android|Swift|C#|PHP|C\+\+)/i.test(content);
            const condTitle   = /\b(PMO?|PM|PHP)\b|ＰＭＯ?|ＰＭ|ＰＨＰ/i.test(jobTitle);

            const shouldCheck = condSalary || condContent || condTitle;
            if (shouldCheck) {
                const checkbox = item.querySelector('input[data-jobofferpost-ui="jobCheckbox"]');
                if (checkbox && !checkbox.checked) {
                    checkbox.click(); // 以 click 方式勾選
                }
            }

            /* Collect */
            results.push({
                url,
                jobTitle,
                company,
                想定年収: salaryText,
                仕事の内容: content,
                必要な能力・経験: ability
            });
        });

    console.table(results);
    return results;
})();