(function (global) {
    /**
     * ──────────────────────────────
     * 通用預處理：針對所有 Mermaid 圖表的共同問題
     * ──────────────────────────────
     */

    /**
     * 將全形標點轉換為半形，避免因全形符號導致解析錯誤
     */
    function convertFullToHalf(code) {
        const fullToHalf = {
            '，': ',',
            '：': ':',
            '；': ';',
            '（': '(',
            '）': ')',
            '【': '[',
            '】': ']',
            '「': '"',
            '」': '"'
        };
        return code.replace(/[，：；（）【】「」]/g, match => fullToHalf[match] || match);
    }

    /**
     * 通用預處理函數：
     * 1. 將全形標點轉為半形
     * 2. 檢查首行是否有圖表宣告，若無則預設補上 flowchart LR
     * 3. 將孤立的 "->" 轉換為 "-->"
     * 4. 對節點定義中含中文的部分自動加上引號
     * 5. 處理 subgraph 區塊：補全缺失的 end（以堆疊方式處理多層子圖）
     */
    function preprocessCommon(code) {
        let lines=null;
        if (typeof code === 'string') {
            code = convertFullToHalf(code);
            lines = code.split('\n').filter(line => line.trim().length > 0);
        }else {
            lines = code.filter(line => line.trim().length > 0);
        }

        // 檢查是否有圖表宣告（常見類型）
        const validTypes = [
            'flowchart', 'graph', 'sequenceDiagram', 'gantt',
            'classDiagram', 'stateDiagram', 'pie', 'journey'
        ];
        if (lines.length === 0) {
            lines.unshift('flowchart LR');
        } else {
            let firstLine = lines[0].trim().toLowerCase();
            let typeFound = validTypes.some(type => firstLine.startsWith(type.toLowerCase()));
            if (!typeFound) {
                lines.unshift('flowchart LR');
            }
        }

        // 合併回 code 字串供後續處理
        code = lines.join('\n');

        // 處理箭頭：將孤立的 "->" 轉換為 "-->"（避免重複替換已正確的箭頭）
        code = code.replace(/(^|[^\-])(\-\>)(?!\>)/g, function(match, p1, p2) {
            return p1 + '-->';
        });

        // 處理節點定義：匹配形如 ID[內容] 的模式，若內容含中文且未用引號包住則補上
        code = code.replace(/(\w+\[)([^\]]+)(\])/g, function(match, p1, p2, p3) {
            if (/[\u4e00-\u9fa5]/.test(p2)) {
                let content = p2.trim();
                if (!(content.startsWith('"') && content.endsWith('"'))) {
                    return p1 + '"' + content.replace(/["']/g, '') + '"' + p3;
                }
            }
            return match;
        });

        // 處理 subgraph 區塊：以堆疊方式檢查每個 subgraph 是否有對應的 end
        let processedLines = [];
        let subgraphStack = [];
        code.split('\n').forEach(line => {
            let trimmed = line.trim();
            if (/^subgraph\s+/i.test(trimmed)) {
                subgraphStack.push('subgraph');
            }
            processedLines.push(line);
            if (/^end\s*$/i.test(trimmed) && subgraphStack.length) {
                subgraphStack.pop();
            }
        });
        while (subgraphStack.length > 0) {
            processedLines.push('end');
            subgraphStack.pop();
        }

        return processedLines.join('\n');
    }

    /**
     * ──────────────────────────────
     * 特定圖表類型專有預處理
     * ──────────────────────────────
     */

    /**
     * Flowchart 專有糾錯：
     * 1. 處理「多來源/多目標連線」的情形，例如 "A + B --> C"
     *    將其拆分成 "A --> C" 與 "B --> C"
     */
    function preprocessFlowchart(code) {
        // 使用正則尋找形如 "X + Y --> Z" 的模式
        // 此處假設節點名稱可包含字母、數字、引號或方括號
        const regex = /([A-Za-z0-9"'\[\]\s]+)\s*\+\s*([A-Za-z0-9"'\[\]\s]+)\s*-->\s*([A-Za-z0-9"'\[\]\s]+)/g;
        // 收集所有拆分行
        let newLines = [];
        let replaced = code.replace(regex, (match, left, right, target) => {
            // 建立兩行：分別從 left 與 right 指向 target
            newLines.push(left.trim() + " --> " + target.trim());
            newLines.push(right.trim() + " --> " + target.trim());
            // 回傳空字串以移除原來這行
            return "";
        });
        // 將拆分的新行插入到原代碼中（可選擇直接附加在代碼末尾）
        return replaced.trim() + "\n" + newLines.join("\n");
    }

    /**
     * Sequence Diagram 專有糾錯：
     * 1. 自動為缺少的參與者宣告補上（根據箭頭兩側提取參與者名稱）
     * 2. 修正 note 語法，將 "note left_of" 或 "note right_of" 改為 "note left of"、"note right of"
     */
    function preprocessSequenceDiagram(code) {
        let lines=null;
        if (typeof code === 'string') {
            lines = code.split('\n');
        }else {
            lines = code;
        }
        let participants = new Set();
        let newLines = [];
        // 先掃描所有參與者（非 note 與 alt/loop 等關鍵字）
        lines.forEach(line => {
            let trimmed = line.trim();
            // 如果該行是參與者宣告，記錄下參與者名稱
            if (/^participant\s+/i.test(trimmed)) {
                let parts = trimmed.split(/\s+/);
                if (parts.length >= 2) {
                    participants.add(parts[1].trim());
                }
            }
            // 如果該行含箭頭 (->> 或 -->>)，嘗試提取左右參與者
            if (/--?>>/.test(trimmed)) {
                // 分割左右箭頭
                let arrowIndex = trimmed.indexOf('-->');
                if (arrowIndex === -1) {
                    arrowIndex = trimmed.indexOf('->>');
                }
                if (arrowIndex !== -1) {
                    let leftPart = trimmed.substring(0, arrowIndex).trim();
                    let rightPart = trimmed.substring(arrowIndex + 3).trim(); // 過濾箭頭
                    // 左側可能包含空格與其他符號，取第一個單詞作為名稱
                    let leftName = leftPart.split(/\s+/)[0];
                    let rightName = rightPart.split(/\s+/)[0];
                    if (leftName) participants.add(leftName);
                    if (rightName) participants.add(rightName);
                }
            }
        });
        // 補全 note 語法：將 "note left_of" 改成 "note left of"、"note right_of" 改成 "note right of"
        lines = lines.map(line => line.replace(/note\s+(left|right)_of/gi, 'note $1 of'));

        // 如果原始代碼中沒有明確的參與者宣告，則在圖表開頭補上參與者宣告
        let hasParticipantDecl = lines.some(line => /^participant\s+/i.test(line.trim()));
        if (!hasParticipantDecl && participants.size > 0) {
            let participantLines = [];
            participants.forEach(name => {
                participantLines.push('participant ' + name);
            });
            // 將參與者宣告插入到原代碼開頭（僅在 header 後插入）
            lines.unshift(...participantLines);
        }
        return lines;
    }

    /**
     * Gantt Chart 專有糾錯：
     * 1. 檢查是否有 dateFormat 設定，若無則補上預設 "dateFormat YYYY-MM-DD"
     * 2. 檢查任務定義行，確保冒號前有任務名稱，若缺則補上佔位名稱 "[Unnamed]"
     */
    function preprocessGantt(code) {
        let lines=null;
        if (typeof code === 'string') {
            lines = code.split('\n');
        }else {
            lines = code;
        }
        let hasDateFormat = lines.some(line => /^dateFormat\s+/i.test(line.trim()));
        // 在 header 後第一行補上 dateFormat（僅對 gantt 圖有效）
        if (!hasDateFormat) {
            // 找到第一行後插入
            lines.splice(1, 0, 'dateFormat YYYY-MM-DD');
        }
        // 處理任務定義行：形如 "任務名稱 : 狀態, 任務ID, 起始日期, 持續時間"
        // 若行以 ":" 開頭，表示任務名稱缺失，則補上 "[Unnamed]"
        lines = lines.map(line => {
            if (/^\s*:\s*/.test(line)) {
                return line.replace(/^\s*:\s*/, '[Unnamed] : ');
            }
            return line;
        });
        return lines;
    }

    function preprocessMindMap(code){
        let lines=null;
        if (typeof code === 'string') {
            lines = code.split('\n');
        }else {
            lines = code;
        }

        // 3. 若是，則對後續行做「移除最外層引號」的處理
        for (let i = 2; i < lines.length; i++) {
            // 這個正則只會處理形如   "xxxx"   的整行 (含前導空白)
            // ^(\s*)  : 行首空白
            // "(.*?)" : 中間被引號包住的內容（非貪婪）
            // $       : 行尾
            // 替換成 $1$2 表示：保留原縮排 + 中間文字
            lines[i] = lines[i].replace(/"([^"]*)"/g, '$1');

            let trimmedLine = lines[i].trim();
            let prefix = lines[i].slice(0, lines[i].length - trimmedLine.length);
            if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                trimmedLine = trimmedLine.replace(/^[-*]\s*/, "");
            }
            trimmedLine = `${trimmedLine
                .replace(/&/g, '#38;')
                .replace(/\(/g, '#40;')
                .replace(/\)/g, '#41;')
                .replace(/\[/g, '#91;')
                .replace(/\]/g, '#93;')}`;
            lines[i] = prefix + trimmedLine
        }
        return lines

    }


    /**
     * 根據圖表類型分派到特定預處理函數
     */
    function preprocessByType(commonCode) {
        // 取首行判斷圖表類型
        let lines=null;
        if (typeof commonCode === 'string') {
            lines = commonCode.split('\n');
        }else {
            lines = commonCode;
        }
        let firstLine = lines[0].trim().toLowerCase();
        if (firstLine.startsWith('flowchart') || firstLine.startsWith('graph')) {
            return preprocessFlowchart(commonCode);
        } else if (firstLine.startsWith('sequencediagram')) {
            return preprocessSequenceDiagram(commonCode);
        } else if (firstLine.startsWith('mindmap')) {
            return preprocessMindMap(commonCode);
        } else if (firstLine.startsWith('gantt')) {
            return preprocessGantt(commonCode);
        }
        // 其他圖表類型暫不做特有處理，直接回傳通用處理結果
        return commonCode;
    }

    /**
     * 最終預處理函數：結合通用與特定圖表預處理
     */
    function preprocessMermaidCode(rawCode) {
        // 通用預處理：全形轉半形、檢查圖表宣告、修正箭頭與節點標籤、subgraph 補全
        let commonCode = preprocessCommon(rawCode);
        // 根據圖表類型再做特定處理
        let finalCode = preprocessByType(commonCode);
        if (typeof finalCode === 'string') {
            return finalCode.split('\n');
        }
        return finalCode;
    }

    /**
     * ──────────────────────────────
     * SVG 後處理：調整中文字型與文字溢出處理
     * ──────────────────────────────
     */

    /**
     * 完整版 SVG 後處理函數：
     * - 遍歷所有 <text> 元素，設定中文字型
     * - 若文字寬度超過預設寬度，則拆分成多行（使用 <tspan>）
     */
    function postprocessMermaidSVG(svgElement) {
        const chineseFont = '"Microsoft YaHei", "PingFang TC", sans-serif';
        const maxWidth = 150; // 可根據需求調整最大文字寬度
        const textElements = svgElement.querySelectorAll('text');
        textElements.forEach(textEl => {
            textEl.setAttribute('font-family', chineseFont);
            let bbox;
            try {
                bbox = textEl.getBBox();
            } catch (e) {
                return;
            }
            if (bbox.width <= maxWidth) return;
            let originalText = '';
            if (textEl.childNodes.length > 0) {
                textEl.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        originalText += node.textContent;
                    } else if (node.nodeName.toLowerCase() === 'tspan') {
                        originalText += node.textContent;
                    }
                });
            } else {
                originalText = textEl.textContent;
            }
            originalText = originalText.trim();
            if (!originalText) return;
            while (textEl.firstChild) {
                textEl.removeChild(textEl.firstChild);
            }
            const approxCharWidth = bbox.width / originalText.length;
            const charsPerLine = Math.max(1, Math.floor(maxWidth / approxCharWidth));
            for (let i = 0; i < originalText.length; i += charsPerLine) {
                let lineStr = originalText.substring(i, i + charsPerLine);
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                if (i > 0) {
                    tspan.setAttribute('dy', '1.2em');
                    tspan.setAttribute('x', textEl.getAttribute('x') || '0');
                }
                tspan.textContent = lineStr;
                textEl.appendChild(tspan);
            }
        });
    }

    /**
     * ──────────────────────────────
     * 主函數：結合預處理、Mermaid 渲染與 SVG 後處理
     * ──────────────────────────────
     *
     * @param {string} rawCode - 原始 Mermaid 定義代碼（可能含語法錯誤）
     * @param {string} containerId - 將最終 SVG 插入的 DOM 元素 id
     */
    function renderCorrectedMermaidDiagram(rawCode, containerId) {
        const fixedCode = preprocessMermaidCode(rawCode);
        const renderId = 'mermaid-svg-' + Date.now();
        mermaid.render(renderId, fixedCode, function(svgCode) {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgCode, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;
            postprocessMermaidSVG(svgElement);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
                container.appendChild(svgElement);
            }
        });
    }


// 將這些函式掛在全域物件 window 上，讓其他程式碼可以使用
    global.mermaidUtil = {
        preprocessFlowchart:preprocessFlowchart,
        preprocessSequenceDiagram:preprocessSequenceDiagram,
        preprocessGantt:preprocessGantt,
        preprocessMindMap:preprocessMindMap,
        preprocessByType:preprocessByType,
        preprocessMermaidCode: preprocessMermaidCode,
        postprocessMermaidSVG: postprocessMermaidSVG,
        renderCorrectedMermaidDiagram:renderCorrectedMermaidDiagram
    };
})(window);