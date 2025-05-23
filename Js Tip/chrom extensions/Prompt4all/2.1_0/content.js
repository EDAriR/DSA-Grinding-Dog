window.isInScope = false;
window.currentUrl = window.location.href;
window.lastUrl = window.location.href;
window.currentContentScripts = null;
window.not_setting = false
window.config = {
    automationAll: true,
    codeBlockMarkdown: true,
    codeBlockMermaid: true,
    nonCodeTables: true,
    foldHeadings: true,
    mainColor: '#FF6B00',
    subColor: '#A9A9A9',
    accentColor: '#6A0DAD',
    fontColor: '#343a40',
    fontSize: 10,
    tableBorderColor: '#CCCCCC',
    tableHeaderColor: '#FF6B00',
    foldKeywords: 'Concept Alignment, Chain-of-thought,Rethink'
};
function displayCurrentTime() {
    const now = new Date();
    return now.toISOString();
}
function isDarkMode() {
    // 有些網站透過 class="dark" 控制，也要一起抓
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        || document.documentElement.classList.contains('dark');
}

function sendInjectMermaidMessage(nodeId) {
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
        console.log("[error] chrome.runtime context is invalid.");
        return;
    }
    chrome.runtime.sendMessage({action: "injectMermaid", nodeId: nodeId}, (response) => {
        if (chrome.runtime.lastError) {
            console.log("[error] Error sending message:", chrome.runtime.lastError.message);
            // Handle the error, e.g., try to reconnect, log, or inform the user
        }
        // else {
        //     // Message sent successfully, process the response
        //     console.log("[success] Response from background:", response);
        // }
    });
}

if (!window.hasRun) {
    window.hasRun = true;
    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOMContentLoaded");
        sendInjectMermaidMessage("");


     });


    function init() {
        console.log("初始化邏輯開始");
        // 檢查是否在 Content Scripts 的範圍內

        window.currentContentScripts = [{
            "matches": [
                "https://chatgpt.com/*",
                "https://*.openai.com/*",
                "https://*.claude.ai/*",
                "https://*.anthropic.com/*",
                "https://*.perplexity.ai/*",
                "https://*.felo.ai/*",
                "https://*.lmarena.ai/*",
                "https://*.huggingface.co/*",
                "https://*.monica.im/*",
                "https://m365.cloud.microsoft/*",
                "https://gemini.google.com/*",
                "https://aistudio.google.com/*",
                "https://colab.research.google.com/*",
                "https://*.sora.com/*",
                "https://*.x.com/i/grok/*",
                "https://*.deepseek.com/*"],
            "exclude_matches": [
                "https://chatgpt.com/*#settings"],
            "js": ["content.js"],
            "run_at": "document_start"
        }];
        window.currentUrl = window.location.href;
        window.isInScope = window.currentContentScripts.some(rule =>
            rule.matches.some(matchPattern => new RegExp(matchPattern.replace(/\*/g, '.*')).test(window.currentUrl)) &&
            !rule.exclude_matches.some(excludePattern => new RegExp(excludePattern.replace(/\*/g, '.*')).test(window.currentUrl))
        );
        console.log('currentUrl', window.currentUrl, 'isInScope', window.isInScope);


        /******************************************************
         * （一） 啟動時：先從 chrome.storage 讀取設定
         ******************************************************/
        // 1. 定義一份預設值物件
        const defaultConfig = {
                automationAll: true,
                codeBlockMarkdown: true,
                codeBlockMermaid: true,
                nonCodeTables: true,
                foldHeadings: true,
                mainColor: '#FF6B00',
                subColor: '#A9A9A9',
                accentColor: '#6A0DAD',
                fontColor: '#343a40',
                fontSize: 10,
                tableBorderColor: '#CCCCCC',
                tableHeaderColor: '#FF6B00',
                foldKeywords: 'Concept Alignment, Chain-of-thought,Rethink'
            };

        // 2. 直接傳入 defaultConfig，Chrome storage 會自動補上缺失的欄位
        chrome.storage.local.get(defaultConfig, (items) => {
            // items 裡已經包含 storage 原有的值＋未設定時的預設值
            Object.assign(window.config, items);

            // 3. 將包含預設值的 items 寫回去，保證下次都能讀到
            chrome.storage.local.set(items, () => {
                console.log('已回寫預設設定到 storage：', items);
            });

            // 4. 再初始化
            initialize();
        });

        sendInjectMermaidMessage('')
    }






    // 節點追蹤器
    class NodeTracker {
        constructor() {
            this.nodes = new WeakMap();
            this.debounceDelay =1200;
            this.processDelay=800
            this.requiredSameCount =7;
            this.intersectionObserver = new IntersectionObserver(
                this._onIntersection.bind(this),
                { threshold: 0 }
            );
        }

        track(node) {
            if (node.tagName === 'PRE' && node.classList.contains('mermaid')) return;
            if (node.tagName === 'PRE') {
                const code = node.querySelector('code');
                if (code) node = code;
            }
            const html = node.innerHTML;
            let state = this.nodes.get(node);
            if (!state) {
                const timer = setTimeout(() => this.track(node), this.debounceDelay);
                state = { lastHTML: html, sameCount: 0, timer };
                this.nodes.set(node, state);
            } else {
                if (state.lastHTML === html) {
                    state.sameCount++;
                    if (state.sameCount >= this.requiredSameCount) {
                        clearTimeout(state.timer);
                        this._finalize(node);
                    }
                    else{
                        clearTimeout(state.timer);
                        state.timer = setTimeout(() => this.track(node), this.debounceDelay);
                    }
                } else {
                    state.lastHTML = html;
                    state.sameCount = 0;
                    clearTimeout(state.timer);
                    state.timer = setTimeout(() => this.track(node), this.debounceDelay);
                }
            }
        }

        // finalizeNode(node) {
        //     const rect = node.getBoundingClientRect();
        //     const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        //
        //     if (isVisible) {
        //         // 立即處理可見元素
        //         this.processNode(node);
        //         // 從 map 移除，避免重複處理
        //         this.nodes.delete(node);
        //     } else {
        //         // 延遲處理不可見元素
        //         setTimeout(() => this.processNode(node), 500);
        //     }
        // }
        //
        // /**
        //  * 根據節點類型呼叫對應的最終處理函式
        //  * @param {HTMLElement} node
        //  */
        // processNode(node) {
        //     if (node.tagName === "TABLE") {
        //         // 表格處理邏輯（可根據需求自行調整）
        //         setTimeout(() => {
        //             processTable(node);
        //             // 從 map 移除，避免重複處理
        //             this.nodes.delete(node);
        //         }, 800);
        //     } else if (node.tagName === "CODE") {
        //         // 取得最近的 <pre> 節點來處理 code block
        //         let parentPre = node.closest('pre');
        //         setTimeout(() => {
        //             processCodeBlock(parentPre);
        //             this.nodes.delete(node);
        //         }, 800);
        //     } else if (node.tagName === "DIV" && node.className === 'md-code-block') {
        //         setTimeout(() => {
        //             processCodeBlock(node);
        //             this.nodes.delete(node);
        //         }, 800);
        //     } else if (node.tagName === "BLOCKQUOTE") {
        //         let parentPre = node.closest('pre');
        //         setTimeout(() => {
        //             processCodeBlock(parentPre);
        //             this.nodes.delete(node);
        //         }, 800);
        //     }
        // }


        _finalize(node) {
            if (!document.contains(node)) {
                this.nodes.delete(node);
                return;
            }
            this.intersectionObserver.observe(node);
        }

        _onIntersection(entries) {
            entries.forEach(entry => {
                const node = entry.target;
                this.intersectionObserver.unobserve(node);
                // 使用 config.processDelay 作為非可見時的延遲
                const delay = entry.isIntersecting ? 0 : this.processDelay;
                setTimeout(() => this._process(node), delay);
            });
        }

        _process(node) {
            if (!document.contains(node)) {
                this.nodes.delete(node);
                return;
            }
            if (node.tagName === 'TABLE') {
                processTable(node);
            } else if (node.tagName === 'CODE') {
                const pre = node.closest('pre') || node;
                processCodeBlock(pre);
            } else if (node.matches('div.md-code-block')) {
                processCodeBlock(node);
            } else if (node.matches('blockquote')) {
                foldConceptAndChainOfThought(node);
            }
            this.nodes.delete(node);
        }


    }

    /**
     * DOMObserver: 監聽 document.body 的變動
     */
    class DOMObserver {
        constructor(nodeTracker, config = {}) {
            this.config = Object.assign({
                automationEnabled: true,
                generateThreshold: { count: 40 },
                idleTimeout: 2000,
                activeDebounceDelay: 800,
                activeSameCount: 8,
                idleDebounceDelay: 3000,
                idleSameCount: 2,
                maxGeneratingDuration: 100000
            }, config);
            this.nodeTracker = nodeTracker;
            this.observer = null;
            this.checkId = null;
            this.urlId = null;
            this.generateExitTimer = null;
            this.lastUrl = location.href;
            this.lastMutationTime = 0;
            this.isGenerating = false;
        }

        start() {
            this.stop();
            if (!this.config.automationEnabled) {
                console.log('[DOMObserver] automation 已停用');
                return;
            }
            this.lastMutationTime = Date.now();
            this.isGenerating = false;
            this.observer = new MutationObserver(muts => {
                const now = Date.now();
                const added = muts.reduce((sum, m) => sum + m.addedNodes.length, 0);
                let flow_rate=1000.0*added/(now - this.lastMutationTime)
                if (flow_rate >= this.config.generateThreshold.count){
                    if (!this.isGenerating) {
                        this.isGenerating = true;
                        this._adjustSettings(true);
                        //console.log(`[DOMObserver] 進入流生成狀態 `,flow_rate , displayCurrentTime());
                    }
                } else if (this.isGenerating && flow_rate < this.config.generateThreshold.count) {
                   this.isGenerating = false;
                   this._adjustSettings(false);
                    //console.log('[DOMObserver] 退出流生成狀態',flow_rate ,displayCurrentTime());

                } else if (this.isGenerating && (now - this.lastMutationTime) > this.config.idleTimeout) {
                    this.isGenerating = false;
                    this._adjustSettings(false);
                    //console.log('[DOMObserver] 退出流生成狀態',flow_rate ,displayCurrentTime());
                }
                this.lastMutationTime = now;
                const uniq = new Set();
                muts.forEach(m => {
                    m.addedNodes.forEach(n => {
                        if (n.nodeType !== Node.ELEMENT_NODE) return;
                        if (n.classList && n.classList.contains('mermaid')) return;
                        if (this._should(n)) uniq.add(n);
                        n.querySelectorAll('pre, table, code, div.md-code-block, blockquote').forEach(c => {
                            if (this._should(c)) uniq.add(c);
                        });
                    });
                });
                if (!this.isGenerating) {
                    uniq.forEach(n => this.nodeTracker.track(n));
                }
                // else {
                //     console.log('[DOMObserver] 跳過節點處理，因為正在生成中',displayCurrentTime());
                // }
            });
            this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
            this.checkId = setInterval(() => {
                if (this.isGenerating && (Date.now() - this.lastMutationTime) > this.config.idleTimeout) {
                    this.isGenerating = false;
                    this._adjustSettings(false);
                    //console.log('[DOMObserver] 閒置超時，退出生成狀態',displayCurrentTime());
                }
            }, this.config.idleTimeout);
            this.urlId = setInterval(() => {
                if (location.href !== this.lastUrl) {
                    console.log(`[DOMObserver] URL 變更 ${this.lastUrl} --> ${location.href}，重啟 Observer`, displayCurrentTime());
                    this.lastUrl = location.href;
                    this.start();
                }
            }, 1000);
            console.log('[DOMObserver] 監測已啟動',displayCurrentTime());
        }

        stop() {
            if (this.observer) this.observer.disconnect();
            if (this.checkId) clearInterval(this.checkId);
            if (this.urlId) clearInterval(this.urlId);
            if (this.generateExitTimer) clearTimeout(this.generateExitTimer);
        }

        _should(node) {
            return node.matches('pre:not(.mermaid), table, code, div.md-code-block, blockquote');
        }

        _adjustSettings(active) {
            // 清除舊定時器
            if (this.generateExitTimer) clearTimeout(this.generateExitTimer);
            if (active) {
                this.nodeTracker.debounceDelay = this.config.activeDebounceDelay
                this.nodeTracker.requiredSameCount = this.config.activeSameCount;
                // 強制在 maxGeneratingDuration 後退出
                this.generateExitTimer = setTimeout(() => {
                    this.isGenerating = false;
                    this._adjustSettings(false);
                    console.log('[DOMObserver] 超過最大生成時間，強制退出生成狀態',displayCurrentTime());
                }, this.config.maxGeneratingDuration);
            } else {
                this.nodeTracker.debounceDelay = this.config.idleDebounceDelay;
                this.nodeTracker.requiredSameCount = this.config.idleSameCount;
            }
        }
    }

    /**
     * 初始化並啟動 Observer
     */
    function initObserver() {
        const tracker = new NodeTracker(window.config);
        const observer = new DOMObserver(tracker, window.config);
        observer.start();
        window._domObserverInstance = observer;
        window.addEventListener('beforeunload', () => observer.stop());
    }




// 如果文檔還在 loading 中，就掛接 DOMContentLoaded 事件；否則直接呼叫 init()
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }


// ========== 2) 主函式：追蹤並延後處理 ==========


    /******************************************************
     * （二） 監聽來自 settings.html 的設定更新訊息
     ******************************************************/

    function insertTextToContentEditableByOffsets(element, textToInsert, selectionStart, selectionEnd) {
        // 先 focus
        element.focus();

        // 1. 先把 contenteditable 的所有 text node & 累積長度都算出來
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let nodes = [];
        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }

        // 如果 contenteditable 內沒有 textNode，需手動新增一個
        if (nodes.length === 0) {
            let newTextNode = document.createElement("p");

            // newTextNode.textContent = textToInsert;
            element.appendChild(newTextNode);
            nodes.push(newTextNode);
        }


        let cumulativeLengths = [];
        let total = 0;
        for (let i = 0; i < nodes.length; i++) {
            cumulativeLengths[i] = total;
            total += nodes[i].textContent.length;
        }

        // 2. 建立一個新的 Range
        const range = document.createRange();

        // 找到 selectionStart 所屬的 textNode 與在該 node 中的 offset
        const {
            node: startNode,
            offset: startNodeOffset
        } = findTextNodeByOffset(nodes, cumulativeLengths, selectionStart);
        const {node: endNode, offset: endNodeOffset} = findTextNodeByOffset(nodes, cumulativeLengths, selectionEnd);

        // 如果沒找到對應的 node，就直接插到最後面
        if (!startNode || !endNode) {
            // fallback：插到 element 最尾端
            element.appendChild(document.createTextNode(textToInsert));
            return;
        }

        // 3. 設定 Range start/end
        range.setStart(startNode, startNodeOffset);
        range.setEnd(endNode, endNodeOffset);

        // 4. 刪除已選取的內容，插入文字
        range.deleteContents();
        const textNode = document.createTextNode(textToInsert);
        range.insertNode(textNode);

        // 5. 將游標移動到新插入文字尾端
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);

        // 6. 更新 Selection
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * 給定所有 textNode + 累積長度(cumulativeLengths)，以及某個 "globalOffset" (在平坦文字中的位置),
     * 找到對應的 textNode 和在該 node 內的 offset。
     */
    function findTextNodeByOffset(nodes, cumulativeLengths, globalOffset) {
        // globalOffset 超過最後
        if (globalOffset < 0) {
            return {node: null, offset: 0};
        }
        for (let i = 0; i < nodes.length; i++) {
            const start = cumulativeLengths[i];
            const end = (i === nodes.length - 1)
                ? Infinity
                : cumulativeLengths[i + 1]; // 下一個 node 的起始

            if (globalOffset >= start && globalOffset < end) {
                // 命中此 textNode
                const offsetInNode = globalOffset - start;
                return {node: nodes[i], offset: offsetInNode};
            }
        }
        // 如果 globalOffset 超過了全部 textNodes 文字長度，回傳最後一個 node 的尾端
        let lastNode = nodes[nodes.length - 1] || null;
        if (lastNode) {
            const off = lastNode.textContent.length;
            return {node: lastNode, offset: off};
        }
        return {node: null, offset: 0};
    }

    /**
     * 在 <textarea> 或 <input> 中插入文字 (覆蓋 selectionStart~selectionEnd 區間或從游標插入)。
     */
    function insertTextToTextAreaOrInput(element, textToInsert, selectionStart, selectionEnd) {
        // 確定是 <textarea> 或 <input type="text"/"search"/...>
        if (!(element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement)) {
            console.log("目標元素並非 <textarea> 或 <input>，無法以此模式插入。");
            return;
        }

        // // 先 focus
        // element.focus();

        const originalValue = element.value;
        // 字串切割重組


        element.value =
            originalValue.slice(0, selectionStart) +
            textToInsert +
            originalValue.slice(selectionEnd);


        // 更新游標到剛插入文字的尾端
        const newCursorPos = selectionStart + textToInsert.length;
        element.setSelectionRange(newCursorPos, newCursorPos);
        element.focus();
        if (window.currentUrl.includes("deepseek")) {
            let elementSibling = element.nextElementSibling;
            if (elementSibling && elementSibling.tagName === 'DIV') {
                elementSibling.textContent = element.value;
                //  simulatePaste(element, elementSibling.textContent)
            }
        }
    }

    function simulatePaste(element, textToPaste) {
        element.focus();

        // 嘗試建立 ClipboardEvent
        const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: new DataTransfer()
        });

        // 設定要貼上的文字
        pasteEvent.clipboardData.setData('text/plain', textToPaste);

        // 觸發事件
        element.dispatchEvent(pasteEvent);
    }

    function insertTextByCursorData(cursorData, textToInsert) {
        let element = null;
        if (cursorData instanceof Element){
            element=cursorData;
        }else{
            if (cursorData.elementId) {
                let elementById = document.getElementById(cursorData.elementId);
                if (elementById) {
                    element = elementById;
                    if (!element) {
                        const evaluator = new XPathEvaluator();
                        element = evaluator.evaluate(
                            cursorData.xpath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue;
                    }
                    if (!element) return;

                    // 2. 判斷目標元素是否為 contenteditable
                    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                        // ----- (A)textarea / input  模式 -----
                        insertTextToTextAreaOrInput(element, textToInsert, cursorData.selectionStart, cursorData.selectionEnd);
                        // if (!element.value.includes(textToInsert)) {
                        //     simulatePaste(element, textToInsert);
                        // }
                    } else {
                        // ----- (B) textarea / input 模式 -----
                        insertTextToContentEditableByOffsets(element, textToInsert, cursorData.selectionStart, cursorData.selectionEnd
                        );

                        if (!element.textContent.includes(textToInsert)) {
                            simulatePaste(element, textToInsert);
                            console.log('!element.textContent.includes(textToInsert)',element.textContent,textToInsert)
                        }else{
                            console.log('element.textContent.includes(textToInsert)')
                        }
                    }
                }
            }
        }

    }

    function findBestWritableElement() {
        // 特例處理：ChatGPT 專用 textarea
        if (window.location.href.includes('chatgpt')) {
            const el = document.getElementById('prompt-textarea');
            if (el) return el;
        }

        // 收集所有可寫入元素
        const allCandidates = Array.from(document.querySelectorAll('textarea, input:not([type=checkbox]):not([type=radio]):not([type=button]), [contenteditable="true"]'));

        if (allCandidates.length === 0) return null;
        if (allCandidates.length === 1) return allCandidates[0];

        // 分類排序
        const priorityGroups = {
            ProseMirror: [],
            textboxRole: [],
            withPlaceholder: [],
            others: []
        };

        allCandidates.forEach(el => {
            if (el.classList.contains('ProseMirror')) {
                priorityGroups.ProseMirror.push(el);
            } else if (el.getAttribute('role') === 'textbox') {
                priorityGroups.textboxRole.push(el);
            } else if (el.hasAttribute('placeholder') || el.hasAttribute('data-placeholder') || el.querySelector?.('[data-placeholder]')) {
                priorityGroups.withPlaceholder.push(el);
            } else {
                priorityGroups.others.push(el);
            }
        });

        // 回傳每組中面積最大者
        for (const group of Object.values(priorityGroups)) {
            if (group.length === 1) return group[0];
            if (group.length > 1) {
                return group.reduce((a, b) => {
                    const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
                    const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
                    return areaB > areaA ? b : a;
                });
            }
        }

        return null;
    }

    function insertViaSimulatedPasteIfNeeded(element, text) {
        if (!element) return;

        element.focus();

        try {
            const success = document.execCommand("insertText", false, text);
            const content = element.value || element.textContent || "";
            if (!success || !content.includes(text)) {
                simulatePaste(element, text);
                console.log("[insert] fallback to simulatePaste");
            } else {
                console.log("[insert] success with execCommand");
            }
        } catch (err) {
            console.log("[insert] execCommand failed, using simulatePaste", err);
            simulatePaste(element, text);
        }
    }
    function smartInsertText(textToInsert) {
        return new Promise((resolve) => {
            chrome.storage.local.get("cursorData", (data) => {
                const cursorData = data.cursorData;
                const currentPageUrl = window.location.href;

                if (!cursorData || cursorData.url !== currentPageUrl) {

                    const el = findBestWritableElement();
                    console.log("[smartInsertText] cursorData URL 不符改成推斷回寫位置，fallback",el);
                    insertViaSimulatedPasteIfNeeded(el, textToInsert);
                    resolve({ success: !!el, method: "fallback" });
                    return;
                }

                try {
                    insertTextByCursorData(cursorData, textToInsert);
                    resolve({ success: true, method: "byCursorData" });
                } catch (e) {
                    console.log("[smartInsertText] 插入失敗 fallback", e);
                    const el = findBestWritableElement();
                    insertViaSimulatedPasteIfNeeded(el, textToInsert);
                    resolve({ success: !!el, method: "fallbackAfterError" });
                }
            });
        });
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const editableTags = ["INPUT", "SPAN", "TEXTAREA", "DIV", "P"];
        if (request.action === 'updateSettings') {
            console.log('content.js收到新設定：', request.settings);

            Object.assign(window.config, request.settings);

            if (!window.config.automationAll) {
                removeStyles(); // 確保樣式移除
                console.log("自動格式化功能已關閉");
                alert("自動格式化功能已關閉");
            } else {
                updateStyles(); // 更新樣式
            }

            sendResponse({status: 'ok', message: '設定已成功更新'});
        } else if (request.action === "storeCursorPosition") {
            const activeElement = document.activeElement;
            let isEditable = true;
            if (activeElement.tagName === "TEXTAREA") {
                isEditable = !activeElement.readOnly && !activeElement.disabled;
            } else if (activeElement.tagName === "INPUT") {
                isEditable = ["text", "search", "url", "tel", "password", "email"].includes(activeElement.type) && !activeElement.readOnly && !activeElement.disabled;
            } else {
                isEditable = activeElement.isContentEditable;
            }
            if (activeElement && isEditable && editableTags.includes(activeElement.tagName)) {
                console.log("Editable element found:", activeElement.outerHTML);
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    const activeTab = tabs[0]; // 獲取目前活動的 Tab

                    console.log('check content.js tabid', activeTab?.id)
                    let startOffset = null;
                    let endOffset = null;
                    if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            startOffset = range.startOffset;
                            endOffset = range.endOffset;
                        }
                    } else {
                        startOffset = activeElement.selectionStart;
                        endOffset = activeElement.selectionEnd;

                    }
                    const cursorData = {
                        tabId: request.tabId || null, // 若無法直接取得 Tab ID，透過查詢補齊
                        elementId: activeElement.id || null,
                        tagName: activeElement.tagName,
                        isContentEditable: isEditable || true,
                        xpath: getXPathForElement(activeElement),
                        selectionStart: startOffset || 0,
                        selectionEnd: endOffset || 0,
                        url: window.location.href || "",
                    };

                    chrome.storage.local.set({cursorData}, () => {
                        if (chrome.runtime.lastError) {
                            console.error("Error storing cursor data:", chrome.runtime.lastError.message);
                            sendResponse({success: false, error: chrome.runtime.lastError.message});
                        } else {
                            console.log("Cursor position stored with XPath:", cursorData);
                            sendResponse({success: true});
                        }
                    });
                });
            } else {
                sendResponse({success: false, error: "No active editable element found"});
                return null;
            }
            return true;
        }

        else if (request.action === "insertPrompt") {
            smartInsertText(request.prompt).then((result) => {
                sendResponse(result); // ✅ 正確回傳結果
            });
            return true; // ✅ 告訴 Chrome：我們會非同步回應
        }

        // else if (request.action === "showAlert") {
        //     alert(request.message);
        // }
    });


    /******************************************************
     * 重新初始化的示範函式：視需求自行決定要做哪些事
     ******************************************************/
    function reinitialize() {
        // 例：先把 observer 停掉，再重新初始化
        // 這裡給個示範，你可改成你原本的 observer 變數
        if (window._domObserverInstance) {
            window._domObserverInstance.stop();
            window._domObserverInstance = null;
        }

        // 重新 initialize
        initialize();
    }

    function updateStyles() {
        const styleContent = `
body {
    color: ${window.config.fontColor};
    font-size: ${window.config.fontSize}px;
}
.h1_prompt4all {
    color: ${window.config.accentColor};
    font-size: ${parseInt(window.config.fontSize) + 12}px;
    display: block;
    margin-bottom: 10px; /* 下方加入間距 */
    font-weight:'bold';
    text-align: center; /* 置中對齊 */

}
.h2_prompt4all {
    color: ${window.config.accentColor};
    font-size: ${parseInt(window.config.fontSize) + 10}px;
    font-weight:'bold';
    margin-bottom: 10px; /* 下方加入間距 */
}
.h3_prompt4all {
    color: inherit;
    font-size: ${parseInt(window.config.fontSize) + 8}px;
    margin-bottom: 10px; /* 下方加入間距 */
}
.h4_prompt4all {
    color: inherit;
    font-size: ${parseInt(window.config.fontSize) + 6}px;
    margin-bottom: 8px; /* 下方加入間距 */
}
.h5_prompt4all {
    color: inherit;
    font-size: ${parseInt(config.fontSize) + 4}px;
    margin-bottom: 8px; /* 下方加入間距 */
}
.h5_prompt4all {
    color: inherit;
    font-size: ${parseInt(window.config.fontSize) + 2}px;
    margin-bottom: 8px; /* 下方加入間距 */
}
a {
    color: ${window.config.subColor};
    text-decoration: none;
}
a:hover {
    color: ${window.config.mainColor};
    text-decoration: underline;
}
.highlight {
    background-color: ${window.config.mainColor};
    color: ${window.config.fontColor};
}
.btn-primary {
    background-color: ${window.config.mainColor};
    border: 1px solid ${window.config.subColor};
    color: white;
}
.btn-primary:hover {
    background-color: ${window.config.accentColor};
    color: ${window.config.fontColor};
}
 .copy-btn {
    background-color: ${window.config.mainColor};
}
 .copy-btn:hover {
    background-color: ${window.config.mainColor};
}
.update_setting_btn {
    background-color: ${window.config.mainColor};
}
 .update_setting_btn:hover {
    background-color: ${window.config.mainColor};
}
.container {
    border: 2px solid ${window.config.subColor};
    padding: 10px;
    font-size: ${parseInt(window.config.fontSize)}px;
    background-color: ${window.config.accentColor}1A; /* 半透明 */
}
table {
    border: 1px solid ${window.config.mainColor};
    width: 100%;
}
th {
    background-color: ${window.config.tableHeaderColor};
    color: white;
    padding: 8px;
}
thead {
    background-color: ${window.config.tableHeaderColor};
    color: white;
    padding: 8px;
}
td {
    border: 1px solid ${window.config.subColor};
    padding: 6px;
}
summary::before {
  content: "▶"; /* 展開圖標 */
  font-size: ${window.config.fontSize}px;
  color: ${window.config.mainColor};
}
summary {
  font-size: ${window.config.fontSize}px;
  background-color:${window.config.subColor}; /* 淺灰背景 */
}
summary:hover {
font-size:'inherit';
  background-color: ${window.config.mainColor}; /* 滑鼠懸停背景變色 */
}

strong {
    color: ${window.config.accentColor};
}
blockquote {
background-color:  ${window.config.subColor}; /* 淺灰背景 */
border-left: 5px solid ${window.config.mainColor}; 
font-size: ${window.config.fontSize}px; 
}
`;
        let styleElement = document.getElementById('dynamic-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'dynamic-styles';
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = styleContent;
        reinitialize();
    }


    /**
     * 移除樣式
     */
    function removeStyles() {
        const styleElement = document.getElementById('dynamic-styles');
        if (styleElement) styleElement.remove();
    }


    /******************************************************
     * 核心初始化函式
     ******************************************************/
    function initialize() {
        // 如果全域開關被關閉，就什麼都不做
        if (!window.config.automationAll) {
            console.log("全域自動化功能已被關閉，略過初始化。");
            return;
        }
        let isDark=isDarkMode();
        chrome.storage.local.set({ currentData: { "isDark": isDark } }, () => {
            console.log('Content.js 已寫入 currentData');
        });

        if (isDark){
            window.config.fontColor = '#F1F1F1';
        }
        setTimeout(() => initializeStyles(), 100);
        initObserver();
        if (window.config.foldHeadings) {
            foldConceptAndChainOfThought(document.body);
        }



        // sendInjectMermaidMessage("");
        //3. 若有指定要處理 codeBlock markdown → checkAndProcessPreMarkdown
        // if (window.config.codeBlockMarkdown) {
        //     checkAndProcessPreMarkdown(document.body);
        // checkAndProcessPreHtml(document.body)
    }

    // 4. 若有指定要處理非 code block 表格 → checkAndProcessTable
    // if (window.config.nonCodeTables) {
    //     checkAndProcessTable(document.body);
    // }
    //
    //5. 若有指定要自動折疊



}


/******************************************************
 * 核心初始化：注入樣式、啟用 DOM 監控
 ******************************************************/


/**
 * 注入 CSS 樣式
 */
function initializeStyles() {
    const styleContent = `
.download-buttons {
display:block;
gap: 8px;
margin-top: 10px;
}
.download-btn {
background-color: ${window.config.mainColor};
color: white;
border: none;
border-radius: 4px;
padding: 6px 12px;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
width: 75px;
height: 30px;
position: relative;
transition: background-color 0.3s;
}
.download-btn:hover {
background-color: ${window.config.mainColor};
}
.download-btn svg {
width: 18px;
height: 18px;
transition: opacity 0.3s;
}
.download-btn .btn-text {
position: absolute;
opacity: 0;
transition: opacity 0.3s;
white-space: nowrap;
font-size: 10px;
}
.download-btn:hover svg {
opacity: 0;
}
.download-btn:hover .btn-text {
opacity: 1;
}
.excel-icon-bg {
fill: ${window.config.mainColor};
}
.excel-icon-bg:hover {
fill: #1a5c37;
}
.copy-buttons {
display: flex;
gap: 10px;
margin-top: 10px;
}
.copy-btn {
background-color: ${window.config.mainColor};
color: white;
border: none;
border-radius: 4px;
padding: 4px 10px;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
width: 72px;
height: 30px;
position: relative;
transition: background-color 0.3s;
}
.copy-btn:hover {
background-color: ${window.config.mainColor};
}
.copy-btn svg {
transition: opacity 0.3s;
}
.copy-btn .btn-text {
position: absolute;
opacity: 0;
transition: opacity 0.3s;
}
.copy-btn:hover svg,
.copy-btn:hover .svg-group {
opacity: 0;
}
.copy-btn:hover .btn-text {
opacity: 1;
}
.markdown-icons {
position: relative;
display: flex;
align-items: center;
justify-content: center;
}
.collapsible-content {
display: none; /* 初始為隱藏 */
overflow: hidden;
transition: max-height 0.3s ease-out;
}
.collapsible-header {
cursor: pointer;
font-weight: bold;
user-select: none;
}
.collapsible-header:hover {
color: #007bff; /* 顯示可點擊提示 */
}
summary {
font-family: Arial, sans-serif;
font-size: ${window.config.fontSize}px;
font-weight: bold;
cursor: pointer;
padding: 10px;
margin: 5px 0;
background-color:${window.config.subColor}; /* 淺灰背景 */
border: 1px solid #ddd; /* 邊框顏色 */
border-radius: 5px; /* 圓角 */
display: flex;
align-items: center; /* 水平居中 */
gap: 10px; /* 圖標與文字的間距 */
transition: background-color 0.3s ease, box-shadow 0.3s ease; /* 動態效果 */
}
summary:hover {
background-color: #e2e6ea; /* 滑鼠懸停背景變色 */
box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* 輕微陰影 */
}
summary::before {
content: "▶"; /* 展開圖標 */
font-size: ${window.config.fontSize}px;
color: ${window.config.mainColor};
transition: transform 0.3s ease; /* 圖標旋轉動畫 */
}
details[open] summary::before {
transform: rotate(90deg); /* 展開時旋轉 */
}
details {
margin-bottom: 15px; /* 分隔不同區塊 */
border-left: 4px solid ${window.config.mainColor}; /* 左側標記 */
padding: 10px 15px; /* 內邊距 */
background-color: #ffffff; /* 白色背景 */
border-radius: 5px; /* 圓角 */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 陰影 */
}
blockquote {
margin: 10px 0 0 0; /* 頂部間距調整 */
padding: 10px 15px; /* 內邊距 */
background-color: #f8f9fa; /* 淺灰背景 */
border-left: 5px solid ${window.config.mainColor}; /* 左側標記 */
border-radius: 3px; /* 圓角 */
font-size: ${window.config.fontSize}px; /* 小一點字體 */
color: ${window.config.fontColor}; /* 深灰文字 */
line-height: 1.6; /* 行距 */
}
ul {
padding-left: 20px; /* 調整列表內縮 */
}
li {
margin-bottom: 5px; /* 每個項目的間距 */
}

.download-buttons {
display: flex;
gap: 8px;
margin-top: 10px;
}
.download-btn {
background-color: ${window.config.mainColor};
color: white;
border: none;
border-radius: 4px;
padding: 6px 12px;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
width: 75px;
height: 30px;
position: relative;
transition: background-color 0.3s;
}
.download-btn:hover {
background-color: ${window.config.mainColor};
}
.download-btn svg {
width: 18px;
height: 18px;
transition: opacity 0.3s;
}
.download-btn .btn-text {
position: absolute;
opacity: 0;
transition: opacity 0.3s;
white-space: nowrap;
font-size: ${window.config.fontSize}px;
}
.download-btn:hover svg {
opacity: 0;
}
.download-btn:hover .btn-text {
opacity: 1;
}
.excel-icon-bg {
fill: #217346;
}
.excel-icon-bg:hover {
fill: #1a5c37;
}
.copy-buttons {
display: flex;
gap: 10px;
margin-top: 10px;
}
.copy-btn {
background-color: ${window.config.mainColor};
color: white;
border: none;
border-radius: 4px;
padding: 4px 10px;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
width: 72px;
height: 30px;
position: relative;
transition: background-color 0.3s;
}
.copy-btn:hover {
background-color:${window.config.mainColor};
}
.copy-btn svg {
transition: opacity 0.3s;
}
.copy-btn .btn-text {
position: absolute;
opacity: 0;
transition: opacity 0.3s;
}
.copy-btn:hover svg,
.copy-btn:hover .svg-group {
opacity: 0;
}
.copy-btn:hover .btn-text {
opacity: 1;
}
.markdown-icons {
position: relative;
display: flex;
align-items: center;
justify-content: center;
}
.collapsible-content {
display: none; /* 初始為隱藏 */
overflow: hidden;
transition: max-height 0.3s ease-out;
}
.collapsible-header {
cursor: pointer;
font-weight: bold;
user-select: none;
}
.collapsible-header:hover {
color: #007bff; /* 顯示可點擊提示 */
}
.md_strong {
color: ${window.config.accentColor};
}
summary {
font-family: Arial, sans-serif;
font-size: ${window.config.fontSize}px;
font-weight: bold;
cursor: pointer;
padding: 10px;
margin: 5px 0;
background-color: inherit; 
border: 1px solid #ddd; /* 邊框顏色 */
border-radius: 5px; /* 圓角 */
display: flex;
align-items: center; /* 水平居中 */
gap: 10px; /* 圖標與文字的間距 */
transition: background-color 0.3s ease, box-shadow 0.3s ease; /* 動態效果 */
}
summary:hover {
background-color: #e2e6ea; /* 滑鼠懸停背景變色 */
box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* 輕微陰影 */
}
summary::before {
content: "▶"; /* 展開圖標 */
font-size: ${window.config.fontSize}px;
color: ${window.config.mainColor}; 
transition: transform 0.3s ease; /* 圖標旋轉動畫 */
}
details[open] summary::before {
transform: rotate(90deg); /* 展開時旋轉 */
}
details {
margin-bottom: 15px; /* 分隔不同區塊 */
border-left: 4px solid ${window.config.mainColor}; /* 左側標記 */
padding: 10px 15px; /* 內邊距 */
background-color: inherit; 
border-radius: 5px; /* 圓角 */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 陰影 */
}
blockquote {
margin: 10px 0 0 0; /* 頂部間距調整 */
padding: 10px 15px; /* 內邊距 */
background-color: inherit; 
border-left: 5px solid ${window.config.mainColor}; /* 左側標記 */
border-radius: 3px; /* 圓角 */
font-size: ${window.config.fontSize}px; /* 小一點字體 */
color: ${window.config.fontColor}; /* 深灰文字 */
line-height: 1.6; /* 行距 */
}
ul {
padding-left: 20px; /* 調整列表內縮 */
}
li {
margin-bottom: 5px; /* 每個項目的間距 */
}
li > p::marker {
display: none; /* 或調整內容以符合需求 */
}

/* 確保內嵌 ul 的樣式清晰 */
ul ul {
list-style: disc; /* 設定子列表樣式 */
}
/* 隱藏只有嵌套 ul 的li的 marker */
li:has(> ul):not(:has(> :not(ul)))::marker {
content: none;
}

/* 確保有實質內容的li顯示 marker */
li:not(:has(> ul))::marker,
li:has(> ul):has(> :not(ul))::marker {
content: initial; /* 保留預設的 marker */
}
/* 隱藏只有嵌套 ul 的li的 marker */
li:has(> ol):not(:has(> :not(ol)))::marker {
content: none;
}

/* 確保有實質內容的li顯示 marker */
li:not(:has(> ol))::marker,
li:has(> ol):has(> :not(ol))::marker {
content: initial; /* 保留預設的 marker */
}
/* 確保內嵌 ol 的樣式清晰 */
ol ol {
list-style: disc; /* 設定子列表樣式 */
}
/* 確保默認的 tooltip 顯示效果 */
a[title] {
    position: relative;
}
/* 解除遮擋的父層元素問題 */
a[title]::after, a[title]::before {
    position: absolute;
    z-index: 9999; /* 確保 tooltip 層級足夠高 */
}

/* 避免父層 overflow: hidden 的影響 */
.parent-container {
    overflow: visible !important;
}
a[title]:hover::after {
    content: attr(title);
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #222;
    color: #fff;
    padding: 5px 10px;
    border-radius: 4px;
    white-space: nowrap;
    font-size: 0.8em;
    z-index: 10;
    opacity: 1;
    transition: opacity 0.3s;
}

a[title]:hover::before {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: #222 transparent transparent transparent;
    z-index: 10;
    opacity: 1;
    transition: opacity 0.3s;
}
.h1_prompt4all {
    color: ${window.config.accentColor};
    font-size: ${parseInt(window.config.fontSize) + 12}px;
    display: block;
    margin-bottom: 10px; /* 下方加入間距 */
    font-weight:'bold';
    text-align: center; /* 置中對齊 */

}
.h2_prompt4all {
    color: ${window.config.accentColor};
    font-size: ${parseInt(window.config.fontSize) + 10}px;
    font-weight:'bold';
    margin-bottom: 10px; /* 下方加入間距 */
}
.h3_prompt4all {
    color: inherit;
    font-size: ${parseInt(window.config.fontSize) + 8}px;
    margin-bottom: 10px; /* 下方加入間距 */
}
.h4_prompt4all {
    color: inherit;
    font-size: ${parseInt(window.config.fontSize) + 6}px;
    margin-bottom: 8px; /* 下方加入間距 */
}
.h5_prompt4all {
    color: inherit;
    font-size: ${parseInt(window.config.fontSize) + 4}px;
    margin-bottom: 8px; /* 下方加入間距 */
}
.h6_prompt4all {
    color: inherit;
    font-size: ${parseInt(window.config.fontSize) + 2}px;
    margin-bottom: 8px; /* 下方加入間距 */
}

.toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      background-color: ${window.config.mainColor};
      color: #333;
      font-size: 1rem;
      height: 30px;
      max-width: 120px;
      transition: background-color 0.2s;
    }

    .toggle-btn:hover {
      background-color: #e0e0e0;
    }

    .svg-group {
      position: relative;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Control icon visibility */
   .markdown-icon,
    .mermaid-icon {
      position: absolute;
      top: 0;
      left: 0;
      width: 28px;
      height: 28px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .markdown-icon.active,
    .mermaid-icon.active {
      opacity: 1;
    }

    .btn-text {
      font-size: 0.5rem;
      color: #ffffff;
        
    }

`;
    const styleElement = document.createElement("style");
    styleElement.textContent = styleContent;
    document.head.appendChild(styleElement);

}


/******************************************************
 *  工具函式：複製剪貼簿、下載文件、CSV/Excel 生成等
 ******************************************************/
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(
        () => {
            alert("已成功複製到剪貼簿！");
        },
        (err) => {
            console.error("複製失敗", err);
            alert("複製失敗，請再試一次！");
        }
    );
}

/**
 * 下載檔案
 * @param {String|Blob} content - 檔案內容或 Blob
 * @param {String} filename - 下載後的檔名
 * @param {String} mimeType - MIME 類型
 */
function downloadFile(content, filename, mimeType) {
    const blob = content instanceof Blob ? content : new Blob([content], {type: mimeType});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * 生成 CSV 內容
 * @param {HTMLTableElement} table
 * @return {String} csvContent
 */
function generateCSVContent(table) {
    let csvContent = "";
    table.querySelectorAll("tr").forEach((row) => {
        const cells = row.querySelectorAll("th, td");
        const rowData = Array.from(cells).map((cell) => cell.textContent);
        csvContent += rowData.join(",") + "\n";
    });
    return csvContent;
}

/******************************************************
 *  表格相關：新增下載按鈕、處理表格
 ******************************************************/

/**
 * 為表格新增下載 CSV/Excel 按鈕
 * @param {HTMLTableElement} table
 * @returns {HTMLDivElement|null} 按鈕容器，若已存在按鈕則回傳 null
 */
function addTableDownloadButtons(table) {
    if (!window.config.automationAll || !window.config.codeBlockMarkdown || !window.config.nonCodeTables || table.dataset.hasButtons === "true") {
        // 防止重複添加按鈕
        return null;
    }
    table.dataset.hasButtons = "true";

    // 建立容器
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "download-buttons";

    // 下載 CSV 按鈕
    const csvButton = document.createElement("button");
    csvButton.className = "download-btn";
    csvButton.innerHTML = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
<polyline points="7 10 12 15 17 10"/>
<line x1="12" y1="15" x2="12" y2="3"/>
</svg>
<span class="btn-text">CSV</span>
`;
    csvButton.addEventListener("click", () => {
        const csvContent = generateCSVContent(table);
        downloadFile(csvContent, "table.csv", "text/csv");
    });

    // 下載 Excel 按鈕
    const excelButton = document.createElement("button");
    excelButton.className = "download-btn";
    excelButton.innerHTML = `
<svg viewBox="0 0 32 32">
<!-- Excel Icon Background -->
<rect x="2" y="2" width="28" height="28" rx="2" class="excel-icon-bg"/>
<!-- X Logo -->
<path d="M8 8 L24 24 M24 8 L8 24" stroke="white" stroke-width="2"/>
<!-- Book Pages Effect -->
<path d="M26 4 V28 H28 V6 Z" fill="#1a5c37"/>
</svg>
<span class="btn-text">Excel</span>
`;
    excelButton.addEventListener("click", () => {
        // 直接把 table 內容存成 CSV，再用 .xls 檔名下載
        const csvContent = Array.from(table.querySelectorAll("tr"))
            .map((row) =>
                Array.from(row.querySelectorAll("th, td"))
                    .map((cell) => `"${cell.textContent.replace(/"/g, '""')}"`)
                    .join(",")
            )
            .join("\n");

        const excelBlob = new Blob(["\uFEFF" + csvContent], {type: "text/csv;charset=utf-8;"});
        downloadFile(excelBlob, "table.xls", "application/vnd.ms-excel");
    });

    buttonContainer.appendChild(csvButton);
    buttonContainer.appendChild(excelButton);
    return buttonContainer;
}


/**
 * 為表格新增下載 CSV/Excel 按鈕
 * @param {HTMLTableElement} table
 * @returns {HTMLDivElement|null} 按鈕容器，若已存在按鈕則回傳 null
 */
function addMermaidButtons() {

    // 下載 mermaid按鈕
    const mermaidButton = document.createElement("button");
    mermaidButton.className = "toggle-btn";
    mermaidButton.innerHTML = `
        <div class="svg-group" style="transform: scale(0.75);">
      <!-- Markdown Icon -->
      <svg class="markdown-icon" viewBox="0 0 16 16" fill="#ffffff" width="28" height="28">
        <path d="M6.345 5h2.1v6.533H6.993l.055-5.31-1.774 5.31H4.072l-1.805-5.31c.04.644.06 5.31.06 5.31H1V5h2.156s1.528 4.493 1.577 4.807L6.345 5zm6.71 3.617v-3.5H11.11v3.5H9.166l2.917 2.916 2.917-2.916h-1.945z"/>
      </svg>

      <!-- Mermaid Icon -->
      <svg class="mermaid-icon active" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 259 244" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(0.000000,244.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none">
          <path d="M230 2313 l0 -118 15 -100 14 -100 21 -90 20 -90 30 -82 29 -82 35 -73 35 -73 50 -83 50 -82 55 -69 55 -68 87 -78 87 -77 76 -50 76 -50 81 -38 81 -39 26 -6 26 -7 5 -26 5 -27 17 -100 16 -100 19 -90 20 -90 35 -125 36 -125 35 -88 35 -87 249 0 249 0 0 5 0 5 -49 63 -49 63 -48 79 -47 80 -49 104 -49 104 -35 90 -36 91 -29 87 -29 87 0 14 0 14 78 38 77 38 85 51 85 51 65 55 65 56 23 20 24 20 53 65 53 65 49 80 49 80 31 80 31 80 21 85 21 85 9 85 9 85 -3 143 -4 144 -6 34 -5 34 -5 35 -6 35 -12 0 -13 0 -35 -36 -34 -36 -235 -203 -235 -204 -71 -68 -72 -68 -55 -66 -55 -67 -44 -68 -45 -69 -22 -43 -22 -43 -103 93 -103 93 -128 100 -128 100 -111 88 -111 88 -104 96 -103 97 -95 108 -95 108 -9 0 -9 0 0 -117z"/>
        </g>
      </svg>
    </div>
    <span class="btn-text" >Mermaid</span>`;
    return mermaidButton;


}

function addMarkdownButtons(markdownText) {
    // 複製 Markdown 原始碼按鈕
    let markdownButton = document.createElement("button");
    markdownButton.className = "copy-btn";
    markdownButton.innerHTML = `
<div class="svg-group">
<div class="markdown-icons">
<svg viewBox="0 0 16 16" fill="currentColor" width="28" height="28">
  <path d="M6.345 5h2.1v6.533H6.993l.055-5.31-1.774 5.31H4.072l-1.805-5.31c.04.644.06 5.31.06 5.31H1V5h2.156s1.528 4.493 1.577 4.807L6.345 5zm6.71 3.617v-3.5H11.11v3.5H9.166l2.917 2.916L15 8.617h-1.945z"/>
</svg>
<svg viewBox="0 0 16 16" fill="currentColor" width="28" height="28" style="position: absolute; transform: translate(12px, -4px); opacity: 0.85;">
  <path d="M15 8.617h-1.945v-3.5H11.11v3.5H9.166l2.917 2.916L15 8.617z"/>
</svg>
</div>
</div>
<span class="btn-text" style="transform: scale(0.75);">Markdown</span>
`;
    markdownButton.addEventListener("click", () => {
        copyToClipboard(markdownText);
    });
    return markdownButton
}


/**
 * 處理整個表格：外觀、按鈕、並用自訂結構包裹
 * @param {HTMLTableElement} table
 */

function processTable(table) {
    // 如果目前 global window.config.nonCodeTables 為 false，就不處理
    if (!window.config.nonCodeTables) {
        return;
    }

    // 避免重複處理
    if (table.dataset.initialized === "true" || table.className.includes("prompt4all")) return;
    if (!table.rows || table.rows.length < 2 || table.rows[0].cells.length < 2 || table.querySelector('thead, th') === null) return;
    table.dataset.initialized = "true";
    table.classList.add("prompt4all");

    // 初始化表格樣式
    Object.assign(table.style, {
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "10px",
        border: "1px solid " + window.config.tableBorderColor,
    });

    // 處理表頭 (thead)
    let thead = table.querySelector("thead");
    if(!thead){
        thead=table.rows[0];
    }
    if (thead) {
        thead.querySelectorAll("th").forEach((cell) => {
            Object.assign(cell.style, {
                backgroundColor: window.config.tableHeaderColor,
                color: "#fff",
                textAlign: "center",
                border: "1px solid #ccc",
                padding: "8px",
            });
        });
    }

    // 處理資料列 (tbody 或 table)
    const tbody = table.querySelector("tbody") || table;
    tbody.querySelectorAll("tr").forEach((row) => {
        row.querySelectorAll("td").forEach((cell) => {
            Object.assign(cell.style, {
                border: "1px solid " + window.config.tableBorderColor,
                padding: "8px",
                textAlign: "left",
            });

        });
    });

    // 準備包裹容器
    let markdownDiv = document.createElement("div");
    markdownDiv.className = "markdown prose w-full break-words dark:prose-invert light prompt4all";

    // 新增「複製」按鈕
    let buttonContainer1 = addCopyButtons(markdownDiv, table.innerText);
    if (buttonContainer1) markdownDiv.appendChild(buttonContainer1);

    // 放入原表格的複製版本
    markdownDiv.appendChild(table.cloneNode(true));

    // 新增「下載」按鈕
    let buttonContainer2 = addTableDownloadButtons(table);
    if (buttonContainer2) markdownDiv.appendChild(buttonContainer2);

    // 用 markdownDiv 替換原表格
    table.dataset.processed = "true";
    table.replaceWith(...markdownDiv.childNodes);

}


/**
 * 針對單一 <pre> 節點做實際的轉換 / 處理。
 * @param {HTMLPreElement} preNode - <pre> 節點
 */
function processCodeBlock(preNode) {
    function mermaidCode2Diagram(preNode) {

        let buttonContainer = document.createElement("div");
        buttonContainer.className = "copy-buttons";

        let mermaidNode = preNode.querySelector("code[class*='language-mermaid']");
        if(preNode.tagName==='DIV'&&preNode.className==='md-code-block'){
            mermaidNode = preNode.querySelector("pre");
        }

        let mermaidBlock = document.createElement("div");
        mermaidBlock.style.position = "relative"
        let mermaidButton = addMermaidButtons();
        let markdownIcon = mermaidButton.querySelector(".markdown-icon");
        let mermaidIcon = mermaidButton.querySelector(".mermaid-icon");
        let btnText = mermaidButton.querySelector(".btn-text");

        let syntaxBlock = document.createElement("pre");
        syntaxBlock.className = "mermaid-syntax";
        syntaxBlock.textContent = mermaidNode.innerText;
        syntaxBlock.dataset.is_processed='true';
        syntaxBlock.style.position = "relative"; // 使用相對定位
        syntaxBlock.style.display = "none"; // 初始隱藏

        let diagramBlock = document.createElement("pre");
        diagramBlock.className = "mermaid";

        let lines = mermaidNode.innerText.replace(/::contentReference\[oaicite:\d+\]{index=\d+}/g, '').split(/\r?\n/);

        // 檢查第一行是否為 "mindmap"
        // if (lines[0].trim() === 'mindmap') {
        //     // 3. 若是，則對後續行做「移除最外層引號」的處理
        //     for (let i = 2; i < lines.length; i++) {
        //         // 這個正則只會處理形如   "xxxx"   的整行 (含前導空白)
        //         // ^(\s*)  : 行首空白
        //         // "(.*?)" : 中間被引號包住的內容（非貪婪）
        //         // $       : 行尾
        //         // 替換成 $1$2 表示：保留原縮排 + 中間文字
        //         lines[i] = lines[i].replace(/"([^"]*)"/g, '$1');
        //
        //         let trimmedLine = lines[i].trim();
        //         let prefix = lines[i].slice(0, lines[i].length - trimmedLine.length);
        //         if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        //             trimmedLine = trimmedLine.replace(/^[-*]\s*/, "");
        //         }
        //         trimmedLine = `${trimmedLine
        //             .replace(/&/g, '#38;')
        //             .replace(/\(/g, '#40;')
        //             .replace(/\)/g, '#41;')
        //             .replace(/\[/g, '#91;')
        //             .replace(/\]/g, '#93;')}`;
        //         lines[i] = prefix + trimmedLine
        //     }
        //
        // }
        if (lines[0].trim() === 'mindmap') {
            lines=window.mermaidUtil.preprocessMindMap(lines);
        }

        // 使用 replace 搭配正則表達式，將該段內容直接移除
        diagramBlock.textContent = lines.join('\n').replace(/\\n/g, "<br/>");
        syntaxBlock.textContent = diagramBlock.textContent
        diagramBlock.style.display = "block";
        diagramBlock.style.position = "relative"; // 使用相對定位
        diagramBlock.id = "mermaid-diagram-" + Math.random().toString(36).substr(2, 9);
        diagramBlock.dataset.mermaidRendered = "false";

        let markdownButton = addMarkdownButtons(lines.join('\n'));
        // preNode.replaceWith(syntaxBlock, diagramBlock);


        mermaidButton.style.cursor = "pointer";
        mermaidButton.style.position = "relative"; // 使用相對定位
        mermaidButton.style.marginBottom = "10px"; // 與圖表保持距離
        mermaidButton.style.left = "0";

        mermaidButton.addEventListener("click", () => {
            const isDiagramVisible =
                diagramBlock.style.display !== "none";
            if (isDiagramVisible) {
                diagramBlock.style.display = "none";
                syntaxBlock.style.display = "block";
                mermaidIcon.classList.remove("active");
                markdownIcon.classList.add("active")
                btnText.innerText = "Markdown";
            } else {
                diagramBlock.style.display = "block";
                syntaxBlock.style.display = "none";
                mermaidIcon.classList.add("active");
                markdownIcon.classList.remove("active");
                btnText.innerText = "Mermaid";
            }
        });
        // mermaidBlock.appendChild(mermaidButton)
        // mermaidBlock.appendChild(syntaxBlock)
        // mermaidBlock.appendChild(diagramBlock)
        buttonContainer.appendChild(mermaidButton)
        buttonContainer.appendChild(markdownButton)
        preNode.dataset.processed='true';
        preNode.replaceWith(buttonContainer, syntaxBlock, diagramBlock);

        try {
            sendInjectMermaidMessage(diagramBlock.id)
        } catch (error) {
            console.error("sendInjectMermaidMessage 發生錯誤:", error);
        }

    }

    function markdownCode2Html(preNode) {
        let codeNode = preNode.querySelector("code[class*='language-markdown']");
        let finalContent = codeNode.textContent
        let customHTML = renderMarkdownToCustomHTML(finalContent, codeNode);
        let basefz = parseInt(window.config.fontSize);
        // 用產生出來的 HTML，替換原 <code> 區塊
        if (window.location.href.includes("claude.ai")) {
            customHTML.querySelectorAll('h1').forEach(h1 => {
                h1.style.color = window.config.accentColor
                h1.style.display = 'block';
                h1.style.fontWeight = 'bold';
                h1.style.marginBottom = `10px`;
                h1.style.fontSize = `${basefz + 12}px`;
            });
            customHTML.querySelectorAll('h2').forEach(h2 => {
                h2.style.color = window.config.accentColor;
                h2.style.fontSize = `${basefz + 10}px`;
                h2.style.fontWeight = 'bold';
                h2.style.marginBottom = `10px`;
            });
            customHTML.querySelectorAll('h3').forEach(h3 => {
                h3.style.color = 'inherit';
                h3.style.fontSize = `${basefz + 8}px`;
                h3.style.marginBottom = `10px`;
            });
            customHTML.querySelectorAll('h4').forEach(h4 => {
                h4.style.color = 'inherit';
                h4.style.fontSize = `${basefz + 6}px`;
                h4.style.marginBottom = `8px`;
            });
            customHTML.querySelectorAll('h5').forEach(h5 => {
                h5.style.color = 'inherit';
                h5.style.fontSize = `${basefz + 4}px`;
                h5.style.marginBottom = `8px`;
            });
            customHTML.querySelectorAll('h6').forEach(h6 => {
                h6.style.color = 'inherit';
                h6.style.fontSize = `${basefz + 2}px`;
                h6.style.marginBottom = `6px`;
            });
            renderKatexInElement(codeNode.parentNode);
            codeNode.parentNode.replaceWith(customHTML);

        } else {
            renderKatexInElement(codeNode);
            codeNode.replaceWith(customHTML);
        }


    }

    if (preNode) {
        console.log('processCodeBlock', preNode.outerHTML)
        // 檢查是否已有處理過的標記（可選，避免重複執行）
        if (preNode && (preNode === "mermaid-syntax" || preNode.className === "mermaid-diagram" || preNode.dataset.mermaidRendered)) {
            return;
        }

        // 找到 <code> 節點
        if(preNode.tagName==='DIV'&&preNode.className==='md-code-block') {
            let internalPreNode = preNode.querySelector("pre");
            if(internalPreNode){
                mermaidCode2Diagram(preNode);
            }
        }


        let codeNode = preNode.querySelector("code[class*='language-markdown'], code[class*='language-mermaid'],code[class*='language-html']");
        if (codeNode) {
            console.log('preNode.codeNode', codeNode.outerHTML);
        }
        if (!codeNode) {
            codeNode = preNode.querySelector("code");
            if (codeNode) {
                let previousNode = preNode.previousSibling;
                if (previousNode) {
                    console.log('previousNode', previousNode.textContent)
                    if (previousNode.textContent.length < 20 && previousNode.textContent.toLocaleLowerCase().includes('mermaid')) {
                        codeNode.classList.add('language-mermaid');
                    } else if (previousNode.textContent.length < 20 && previousNode.textContent.toLocaleLowerCase().includes('markdown')) {
                        codeNode.classList.add('language-markdown');
                    }
                }
            }

        }


        // Mermaid 情境
        if (preNode.querySelector("code[class*='language-mermaid']")) {
            mermaidCode2Diagram(preNode);
            preNode.dataset.processed = "true";

        }
        // Markdown 情境
        else if (preNode.querySelector("code[class*='language-markdown']")) {
            // 傳入原始程式碼 textContent，即可交由 parseAndReplaceMarkdownCode 做處理
            const raw = preNode.querySelector("code").textContent;
            // if (raw.trim().endsWith("```")) {
            preNode.dataset.processed = "true";
            markdownCode2Html(preNode);
            // }


        }
    }
    foldConceptAndChainOfThought();
    // // HTML 情境
    // else if (codeClass.includes("language-html")) {
    //     checkAndProcessPreHtml(preNode, codeNode.textContent);
    // }
    // // 其他（如 language-javascript / language-python ...）
    // else {
    //     // 可依需求做語法高亮或其他處理
    //     // 例如：highlightJS 或 Prism.js ...
    //     // (省略)
    // }


}

/*****************************************************
 * ======= (B) 基礎工具：escape HTML、KaTeX render =======
 *****************************************************/

/**
 * 轉譯 HTML 特殊字元，避免惡意注入
 */
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * 掃描 container 裡的 latex-inline / latex-block 做 KaTeX 渲染
 * 須在網頁引入 KaTeX JS / CSS
 */
function renderKatexInElement(container) {
    // 處理行內數學公式 (行內模式)
    container.querySelectorAll(".latex-inline").forEach((el) => {
        const latexCode = el.getAttribute("data-latex") || "";
        try {
            katex.render(latexCode, el, {
                throwOnError: false,
                displayMode: false,
            });
        } catch (err) {
            console.error(`KaTeX inline render error: ${err.message}`, latexCode);
            el.innerHTML = `<span class="latex-error">${latexCode}</span>`; // 錯誤回退
        }
    });

    // 處理數學公式區塊 (顯示模式)
    container.querySelectorAll(".latex-block").forEach((el) => {
        const latexCode = el.getAttribute("data-latex") || "";
        try {
            katex.render(latexCode, el, {
                throwOnError: false,
                displayMode: true,
            });
        } catch (err) {
            console.error(`KaTeX block render error: ${err.message}`, latexCode);
            el.innerHTML = `<div class="latex-error" style="color: red;">${latexCode}</div>`; // 錯誤回退
        }
    });
}

/*****************************************************
 * ========== (C) 行內 Markdown 語法解析函式 ============
 *****************************************************/

/**
 * 處理行內語法(斜體、粗體、刪除線、行內程式碼、base64 圖片、URL、LaTeX等)。
 * - 避免與「清單星號」等行級產生衝突：行級(段落解析)結束後，才會呼叫本函式對文字做行內處理。
 */

/**
 * 解析 Markdown 語法並轉換為 HTML
 */

function parseInlineSyntax(text) {
    const htmlRegex = /(<[^>]+>)|([^<]+)/g;
    return text.replace(htmlRegex, (match, htmlTag, plainText) => {
        if (htmlTag) {
            return preserveHtmlAttributes(htmlTag);
        } else if (plainText) {
            return processMarkdownAndSpecialChars(plainText);
        }
        return match;
    });
}

/**
 * 保護 HTML 標籤內的屬性內容，避免被替換
 */
function preserveHtmlAttributes(tag) {
    return tag.replace(/(\w+)=["']([^"']*)["']/g, (match, attrName, attrValue) => {
        const escapedValue = attrValue.replace(/[&<>"']/g, (char) => {
            switch (char) {
                case '&':
                    return '&amp;';
                case '<':
                    return '&lt;';
                case '>':
                    return '&gt;';
                case '"':
                    return '&quot;';
                case "'":
                    return '&#39;';
                default:
                    return char;
            }
        });
        return `${attrName}="${escapedValue}"`;
    });
}

/**
 * 處理 Markdown 和 LaTeX 的純文字部分
 */
function processMarkdownAndSpecialChars(text) {
    // 行級解析：列表、區塊引用、水平分隔線
    const lines = text.split('\n');
    let result = '';
    let currentList = null;
    let currentListType = null;

    lines.forEach((line) => {
        // 無序列表處理
        if (/^(\s*)[\-\+\*]\s+/.test(line)) {
            const {indentation, content} = parseIndentedLine(line, 'ul');
            currentList = manageList(result, currentList, 'ul', indentation, content);
        }
        // 有序列表處理
        else if (/^(\s*)\d+\.\s+/.test(line)) {
            const {indentation, content} = parseIndentedLine(line, 'ol');
            currentList = manageList(result, currentList, 'ol', indentation, content);
        }
        // 普通段落
        else {
            if (currentList) {
                result += currentList.outerHTML;
                currentList = null;
                currentListType = null;
            }
            result += `${parseInlineMarkdown(line)}`;
        }
    });

    // 結束最後的列表
    if (currentList) {
        result += currentList.outerHTML;
    }

    return result;
}

/**
 * 處理縮排邏輯
 */
function parseIndentedLine(line, listType) {
    const indentMatch = line.match(/^(\s*)/);
    const indentation = Math.floor((indentMatch ? indentMatch[0].length : 0) / 4); // 假設 4 個空格為一層縮排
    const content = line.replace(/^\s*[\-\+\*]?\s*|\d+\.\s+/, '').trim();
    return {indentation, content, listType};
}

/**
 * 管理嵌套的列表結構
 */
function manageList(result, currentList, listType, indentation, content) {
    if (!currentList) {
        currentList = document.createElement(listType);
    }

    let targetList = currentList;
    for (let i = 0; i < indentation; i++) {
        let lastItem = targetList.lastElementChild;
        if (!lastItem || lastItem.tagName !== 'LI') {
            lastItem = document.createElement('li');
            targetList.appendChild(lastItem);
        }
        if (!lastItem.lastElementChild || lastItem.lastElementChild.tagName !== listType) {
            const nestedList = document.createElement(listType);
            lastItem.appendChild(nestedList);
        }
        targetList = lastItem.lastElementChild;
    }

    const li = document.createElement('li');
    li.innerHTML = parseInlineMarkdown(content).replace(/^<p>|<\/p>$/g, '');
    targetList.appendChild(li);

    return currentList;
}

/**
 * 處理行內 Markdown 語法
 */
function parseInlineMarkdown(text) {
    // Markdown 粗體
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Markdown 斜體
    text = text.replace(/_(.+?)_/g, '<em>$1</em>');
    // Markdown 自動偵測 URL
    text = text.replace(/(https?:\/\/[\w./%-]+)/g, '<a href="$1" target="_blank">$1</a>');
    // Markdown 圖片
    text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" style="max-width:100%;">');

    // 其他轉換可根據需求擴展
    return text;
}

function parseFencedCodeAndLatexBlocks(markdown) {
    // 1) 處理 ```...``` (fenced code)
    const codeBlockRegex = /```(\w+)?([\s\S]*?)```/g;
    let html = markdown.replace(codeBlockRegex, (match, lang, codeContent) => {
        return `<pre class="md_codeblock language-${lang || "plaintext"}"><code>${escapeHTML(codeContent)}</code></pre>`;
    });

    // 2) 處理 LaTeX 區塊：$$...$$
    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, latexCode) => {
        return `<div class="latex-block" data-latex="${escapeHTML(latexCode)}"></div>`;
    });

    // 3) 處理行內 LaTeX：$...$
    html = escapeHTML(html).replace(/(?<!\\)\$(.+?)(?<!\\)\$/g, (_, latexCode) => {
        return `<span class="latex-inline" data-latex="${latexCode}"></span>`;
    });

    return html;
}

// function parseFencedCodeAndLatexBlocks(markdown) {
//     // 1) 先處理 ```...``` (fenced code)
//     const codeBlockRegex = /```(\w+)?([\s\S]*?)```/g;
//     let html = "";
//     let lastIndex = 0;
//     let match;
//
//     while ((match = codeBlockRegex.exec(markdown)) !== null) {
//         const [fullMatch, lang, codeContent] = match;
//         const index = match.index;
//
//         // 先把前面的文字加入
//         html += markdown.slice(lastIndex, index);
//
//         // 轉成 <pre><code>
//         html += `<pre class="md_codeblock language-${lang || "plaintext"}"><code>${escapeHTML(
//             codeContent
//         )}</code></pre>`;
//
//         lastIndex = index + fullMatch.length;
//     }
//     // 剩餘
//     html += markdown.slice(lastIndex);
//
//     // 2) 再處理 LaTeX 區塊：$$...$$
//     // → <div class="latex-block" data-latex="..."></div>
//     const latexBlockRegex = /\$\$([\s\S]+?)\$\$/g;
//     html = escapeHTML(html).replace(latexBlockRegex, (match, p1) => {
//         console.log("LaTeX block:", p1);
//         return `<div class="latex-block" data-latex="${p1}"></div>`;
//     });
//
//     return html;
// }

/*****************************************************
 * =========== (E) 主函式：renderMarkdownToCustomHTML ==
 *****************************************************/
/**
 * @param {String} markdownText - 原始 Markdown
 * @param {HTMLElement} codeBlockElement - 你之前提到的 codeBlockElement (若不需要可自行移除)
 * @returns {HTMLElement} 產生的容器
 */
function renderMarkdownToCustomHTML(markdownText, codeBlockElement) {
    // 將 fenced code 和 LaTeX 區塊預處理
    let processed = parseFencedCodeAndLatexBlocks(markdownText);

    // 1) 建立容器
    const container = document.createElement("div");
    container.className = "markdown-content";

    // 動態樣式配置
    container.style.fontSize = `${window.config.fontSize}px`;
    container.style.wordWrap = "break-word";
    container.style.whiteSpace = "pre-wrap";

    // 2) 建立放置主要內容的 markdownDiv
    let markdownDiv = document.createElement("div");
    // 你提到要在特定路徑添加特定 class
    if (
        window.location.href.includes("chatgpt") ||
        window.location.href.includes("openai")
    ) {
        markdownDiv.className =
            "markdown prose w-full break-words dark:prose-invert light prompt4all";
    }
    markdownDiv.style.fontSize = `${window.config.fontSize}px`;

    // 3) 在最前面放置複製按鈕
    container.appendChild(addCopyButtons(markdownDiv, markdownText));
    container.appendChild(markdownDiv);

    // 狀態變數
    let currentList = null; // 當前處理中的列表
    let currentListType = null; // 列表類型 ("ul" 或 "ol")
    let currentListIndentation = 0; // 當前縮排層級
    let isTable = false; // 是否在處理表格
    let tableMarkdown = ""; // 表格的 Markdown 緩存

    const lines = processed.split("\n");

    /**
     * 幫助函式 - 結束清單
     */
    function closeListIfAny() {
        if (currentList) {
            markdownDiv.appendChild(currentList);
            currentList = null;
            currentListType = null;
            currentListIndentation = 0;
        }
    }

    /**
     * 幫助函式 - 添加列表項
     */

    function appendListItem(line, isOrdered) {
        // 確保當前清單存在
        if (!currentList) {
            currentList = document.createElement(isOrdered ? "ol" : "ul");
            markdownDiv.appendChild(currentList);
            currentListIndentation = 0; // 初始化縮排層級
        }

        // 計算縮排層級（每 4 個空格視為一層）
        const indentMatch = line.match(/^(\s*)/);
        const newIndentation = Math.floor((indentMatch ? indentMatch[0].length : 0) / 4);

        // **移除有序或無序列表標記**
        const content = line.replace(/^\s*(\d+\.\s+|[\-\+\*]\s+)/, "").trim();

        // 處理嵌套清單
        if (newIndentation > currentListIndentation) {
            // 增加縮排層級，建立嵌套清單
            const lastItem = currentList.lastElementChild;
            if (lastItem && lastItem.tagName === "LI") {
                const nestedList = document.createElement(isOrdered ? "ol" : "ul");
                lastItem.appendChild(nestedList);
                currentList = nestedList;
            }
            currentListIndentation = newIndentation;
        } else if (newIndentation < currentListIndentation) {
            // 減少縮排層級，回退到上一層清單
            while (currentListIndentation > newIndentation) {
                currentList = currentList.parentElement.closest("ul, ol");
                currentListIndentation--;
            }
        }

        // 添加新項目
        const li = document.createElement("li");
        li.innerHTML = parseInlineSyntax(content).replace(/^<p>|<\/p>$/g, '');
        currentList.appendChild(li);
    }

    /**
     * 幫助函式 - 區塊引用
     */
    function appendBlockquote(line) {
        const bq = document.createElement("blockquote");
        const content = line.replace(/^>\s*/, "");
        bq.innerHTML = parseInlineSyntax(content);
        markdownDiv.appendChild(bq);
    }

    /**
     * 幫助函式 - 水平分隔線
     */
    function appendHR() {
        markdownDiv.appendChild(document.createElement("hr"));
    }

    /**
     * 幫助函式 - 一般段落
     */
    function appendParagraph(line) {
        const p = document.createElement("p");
        // 此處不要再 escapeHTML(line)；因為先前已做 fenced code/latex block 處理
        p.innerHTML = parseInlineSyntax(line);
        markdownDiv.appendChild(p);
    }

    /**
     * 幫助函式 - 處理標題
     */
    function appendHeader(line) {
        const level = line.match(/^#{1,6}/)[0].length;
        const content = line.replace(/^#{1,6}\s*/, "");
        const h = document.createElement(`h${level}`);
        h.className = `h${level}_prompt4all`;
        h.innerHTML = parseInlineSyntax(content).replace(/^<p>|<\/p>$/g, '');
        // 若需要置中 h1, 也可在這裡判斷
        if (level === 1) {
            const divCenter = document.createElement("div");
            divCenter.style.textAlign = "center";
            divCenter.appendChild(h);
            markdownDiv.appendChild(divCenter);
        } else {
            markdownDiv.appendChild(h);
        }
    }

    /**
     * 幫助函式 - 處理表格
     */
    function renderMarkdownTable(tableStr) {
        const table = document.createElement("table");
        table.className = "tb_prompt4all";
        Object.assign(table.style, {
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "4px",
            fontSize: `${window.config.fontSize}px`,
            border: "1px solid " + window.config.tableBorderColor,
        });

        const rows = tableStr.trim().split("\n");
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");

        let isHeaderRow = true; // 初始假設第一部分是表頭

        rows.forEach((row, rowIndex) => {
            // 如果是分隔行 (形如 |---|---|)，切換到內容行處理
            if (row.trim().match(/^\|-+.*-+\|$/)) {
                isHeaderRow = false;
                return; // 分隔行本身不添加到表格
            }

            const tableRow = document.createElement("tr");

            row
                .split("|")
                .map((cell) => cell.trim())
                .filter((cell) => cell !== "") // 過濾空白單元格
                .forEach((cell) => {
                    const cellElement = isHeaderRow ? document.createElement("th") : document.createElement("td");
                    cellElement.innerHTML = parseInlineSyntax(cell);
                    Object.assign(cellElement.style, {
                        border: "1px solid " + window.config.tableBorderColor,
                        padding: "4px",
                        textAlign: isHeaderRow ? "center" : "left", // 表頭置中，內容靠左
                    });

                    // 表頭的樣式
                    if (isHeaderRow) {
                        Object.assign(cellElement.style, {
                            backgroundColor: window.config.tableHeaderColor,
                            color: "#fff",
                        });
                    }

                    tableRow.appendChild(cellElement);
                });

            // 將行添加到對應的表頭或內容部分
            if (isHeaderRow) {
                thead.appendChild(tableRow);
            } else {
                tbody.appendChild(tableRow);
            }
        });

        // 將 thead 和 tbody 添加到表格
        if (thead.children.length > 0) {
            table.appendChild(thead);
        }
        if (tbody.children.length > 0) {
            table.appendChild(tbody);
        }

        markdownDiv.appendChild(table);
    }

    /**
     * 渲染 LaTeX (使用 KaTeX)
     */
    function renderLatex(container) {
        const elements = container.querySelectorAll('span.katex, .katex-html');
        elements.forEach(element => {
            const mathContent = element.textContent || '';
            try {
                element.innerHTML = katex.renderToString(mathContent, {displayMode: true});
            } catch (error) {
                console.error('KaTeX rendering error:', error);
            }
        });
    }

    const tablePatterns = {
        start: /^\|.*\|$/,         // 以 | 開頭並以 | 結尾
        divider: /^\|[-\s:]+(\|[-\s:]+)*\|$/,
    };
    // =============== 逐行解析 ===============
    lines.forEach((line, idx) => {
        if (isTable) {
            if (tablePatterns.start.test(line)) {
                tableMarkdown += line + "\n";
            } else {
                isTable = false;
                if (tablePatterns.divider.test(tableMarkdown.split('\n')[1] || '')) {
                    renderMarkdownTable(tableMarkdown);
                }
                tableMarkdown = "";
            }
        }

        if (!isTable) {
            // 1) 空行 → 結束清單
            if (!line.trim()) {
                closeListIfAny();
                return;
            }
            // 2) 標題 (#, ##, ...)
            if (/^#{1,6}\s/.test(line)) {
                closeListIfAny();
                appendHeader(line);
                return;
            }
            // 3) 有序列表
            if (/^\s*\d+\.\s+/.test(line)) {
                appendListItem(line, true);
                return;
            }
            // 4) 無序列表
            if (/^\s*[\-\+\*]\s+/.test(line)) {
                appendListItem(line, false);
                return;
            }
            // 5) 區塊引用 (>)
            if (/^>\s/.test(line)) {
                closeListIfAny();
                appendBlockquote(line)
                return;
            }
            // 6) 水平分隔線 (---, ***, ___)
            if (/^(\-\-\-|\*\*\*|___)\s*$/.test(line.trim())) {
                closeListIfAny();
                appendHR();
                return;
            }
            // 7) 表格
            if (
                tablePatterns.start.test(line) &&
                idx + 1 < lines.length &&
                tablePatterns.divider.test(lines[idx + 1])
            ) {
                closeListIfAny();
                isTable = true;
                tableMarkdown += line + "\n";
                return;
            }
            // 8) 其他段落
            closeListIfAny();
            appendParagraph(line);
        }
    });

    // 如果結尾時仍在表格狀態
    if (isTable && tableMarkdown.trim()) {
        renderMarkdownTable(tableMarkdown);
    }
    // 若最後有未關閉的列表
    closeListIfAny();
    renderLatex(container);
    return container;
}

/******************************************************
 *  Markdown 附加功能：折疊 Concept Alignment、Chain-of-thought、Rethink 等
 ******************************************************/
function foldConceptAndChainOfThought(node) {
    // 如果 window.config.foldHeadings 為 false，就不執行
    if (!window.config.foldHeadings) return;
    if(!node){
        node=document
    }
    // 取得 foldKeywords，並轉為陣列
    const foldKeywords = window.config.foldKeywords.split(",").map((keyword) => keyword.trim());

    let markdownBlocks = document.querySelectorAll(".markdown");
    markdownBlocks.forEach((block) => {
        const headers = block.querySelectorAll("h2, h3");
        headers.forEach((header) => {
            const text = header.textContent.trim();

            // 遍歷 foldKeywords 來動態匹配
            for (const keyword of foldKeywords) {
                if (text.startsWith(keyword)) {
                    const nextElement = header.nextElementSibling;

                    if (
                        nextElement &&
                        nextElement.tagName.toLowerCase() === "blockquote"
                    ) {
                        if (keyword === "Rethink") {
                            // 特殊處理 Rethink 的條件
                            const nextnextElement = nextElement.children[0];
                            if (
                                nextnextElement &&
                                nextnextElement.tagName.toLowerCase() === "blockquote"
                            ) {

                                setTimeout(() => transformHeaderAndBlockquoteToDetails(header, nextElement), 1200);

                            }
                        } else {
                            // 一般處理
                            setTimeout(() => transformHeaderAndBlockquoteToDetails(header, nextElement), 1200);
                        }
                    }
                    break; // 一旦匹配到規則，停止進一步檢查
                }
            }
        });
    });
}

/**
 * 將 (h3 + blockquote) 轉換為 <details> 結構
 */
function transformHeaderAndBlockquoteToDetails(header, blockquote) {
    const dark = isDarkMode();
    let details = document.createElement("details");
    details.open = true;
    // 整個 container 背景＋左邊標記
    details.style.backgroundColor = dark ? "#2a2a2a" : "#ffffff";
    details.style.borderLeft = `4px solid ${window.config.mainColor}`;
    details.style.borderRadius = "4px";
    details.style.margin = "8px 0";
    details.style.padding = "0";


    const summary = document.createElement("summary");
    summary.innerHTML = header.textContent;
    // summary 樣式
    summary.style.padding = "8px 12px";
    summary.style.cursor = "pointer";
    summary.style.backgroundColor = dark ? "#2a2a2a" : "#f1f1f1";
    //summary.style.color = dark ? "#f1f1f1" : "#333333";
    summary.style.fontWeight = "bold";
    // 箭頭顏色（部分瀏覽器支援）
    summary.style.setProperty("color", summary.style.color, "important");

    // blockquote 內容
    blockquote.style.margin = "0";
    blockquote.style.padding = "12px";
    blockquote.style.backgroundColor = dark ? "#1e1e1e" : "#fafafa";
    //blockquote.style.color = dark ? "#cccccc" : "#555555";
    blockquote.style.borderLeft = `4px solid ${window.config.mainColor}`;

    details.appendChild(summary);
    details.appendChild(blockquote.cloneNode(true));
    blockquote.remove();

    // 用 <details> 取代 <h3>
    if (header.parentNode) {
        header.parentNode.replaceChild(details, header);
    }
    else{
        header.replaceWith(details)
    }
}


/******************************************************
 *基於iframe來渲染出html 預覽
 ******************************************************/
function AddPreHtmlButton(node, finalContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(finalContent, 'text/html');


    // 下載 mermaid按鈕
    const previewButton = document.createElement("button");
    previewButton.className = "toggle-btn";
    previewButton.innerHTML = `
        <div class="svg-group">
        <!-- HTML Code icon -->
        <svg width="16px" height="16px" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 13L4 25.4322L16 37" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M32 13L44 25.4322L32 37" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M28 4L21 44" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
</svg>
        <!-- HTML Page Preview icon -->
        <svg fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve">
<g><path d="M51.8,25.1C47.1,15.6,37.3,9,26,9S4.9,15.6,0.2,25.1c-0.3,0.6-0.3,1.3,0,1.8C4.9,36.4,14.7,43,26,43s21.1-6.6,25.8-16.1C52.1,26.3,52.1,25.7,51.8,25.1z M26,37c-6.1,0-11-4.9-11-11s4.9-11,11-11s11,4.9,11,11S32.1,37,26,37z"/><path d="M26,19c-3.9,0-7,3.1-7,7s3.1,7,7,7s7-3.1,7-7S29.9,19,26,19z"/>
</g>
</svg>
      </div>
    <span class="btn-text" >Preview</span>`;
    previewButton.dataset.htmlCode = finalContent;
    // 按鈕點擊事件
    previewButton.addEventListener("click", () => {
        const previewUrl = chrome.runtime.getURL(`preview.html`);

        // 創建 modal 容器
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "10%";
        modal.style.left = "10%";
        modal.style.width = "80%";
        modal.style.height = "80%";
        modal.style.backgroundColor = "#fff";
        modal.style.border = "1px solid #ccc";
        modal.style.borderRadius = "10px";
        modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        modal.style.zIndex = "10000";
        modal.style.overflow = "hidden";

        // const blob = new Blob([finalContent], { type: "text/html" })
        // const url = URL.createObjectURL(blob)
        const iframe = document.createElement("iframe");
        iframe.src = previewUrl;
        iframe.style.minWidth = "800px";
        iframe.style.minHeight = "600px";
        iframe.style.border = "none";

        modal.appendChild(iframe);


        // // 創建 div用於顯示預覽
        // const window = document.createElement("div");
        // window.id='fake_window'
        //
        // const frame = document.createElement("div");
        // frame.id='fake_iframe'
        // frame.style.minWidth = "800px";
        // frame.style.minHeight = "600px";
        // frame.style.border = "none";
        // const tempDiv = document.createElement("div");
        // tempDiv.innerHTML = doc.body.innerHTML;
        //
        // // 2. 抓出所有 <script>
        // const scriptTags = tempDiv.querySelectorAll("script");
        //
        // // 3. 將非 <script> 部分注入頁面
        // frame.innerHTML = tempDiv.innerHTML.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
        // window.appendChild(frame);
        // modal.appendChild(window);
        // document.body.appendChild(modal);

        //
        // // 為每個 <script> 都新建一個真正的 <script> 元素來執行
        // scriptTags.forEach(oldScript => {
        //     const newScript = document.createElement("script");
        //     // 如果舊script有 src，則設定給新script
        //     if (oldScript.src) {
        //         newScript.src = oldScript.src;
        //     } else {
        //         // 如果是內嵌腳本，則把文字內容複製進去
        //         newScript.textContent = oldScript.textContent;
        //     }
        //     frame.appendChild(newScript);
        // });
        //
        // const styleElements = doc.head.querySelectorAll('style');
        // styleElements.forEach(styleEl => {
        //     // 使用 cloneNode(true) 複製整個 style 節點
        //     const clonedStyle = styleEl.cloneNode(true);
        //     frame.appendChild(clonedStyle);
        // });

        // modal.innerHTML=finalContent;

        // 添加關閉按鈕
        const closeButton = document.createElement("button");
        closeButton.textContent = "×";
        closeButton.style.position = "absolute";
        closeButton.style.top = "10px";
        closeButton.style.right = "10px";
        closeButton.style.backgroundColor = "#ff5f5f";
        closeButton.style.color = "#fff";
        closeButton.style.border = "none";
        closeButton.style.borderRadius = "50%";
        closeButton.style.width = "30px";
        closeButton.style.height = "30px";
        closeButton.style.cursor = "pointer";

        closeButton.addEventListener("click", () => {
            document.body.removeChild(modal);
        });

        modal.appendChild(closeButton);

        // 將 modal 添加到頁面
        document.body.appendChild(modal);

    });

    node.parentNode.insertBefore(previewButton, node);


}

/******************************************************
 * Modify existing logic to identify HTML code blocks
 ******************************************************/
function checkAndProcessPreHtml(node, finalContent) {
    console.log("checkAndProcessPreHtml", node.outerHTML, finalContent)
    if (node.tagName === 'PRE' && node.querySelector('code')) {
        const codeNode = node.querySelector('code');
        if (codeNode && codeNode.classList.contains('language-html')) {
            node.id = "html-preview-" + Math.random().toString(36).substr(2, 9);
            AddPreHtmlButton(node, finalContent)
        }
    } else if (node.querySelectorAll('pre')) {
        node.querySelectorAll('pre').forEach((preNode) => {
            const codeNode = preNode.querySelector('code');
            if (codeNode && codeNode.classList.contains('language-html')) {
                preNode.id = "html-preview-" + Math.random().toString(36).substr(2, 9);
                AddPreHtmlButton(preNode, finalContent)

            }
        });
    }
}

/******************************************************
 *  文字複製按鈕
 ******************************************************/

/**
 * 為指定的 markdownElement 建立複製按鈕區塊 (Text / Markdown)
 */
function addCopyButtons(markdownElement, markdownText) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "copy-buttons";

    // 複製文字按鈕
    let textButton = document.createElement("button");
    textButton.className = "copy-btn";
    textButton.innerHTML = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon" width="18" height="18">
<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
</svg>
<span class="btn-text" style="transform: scale(0.75);">Text</span>
`;
    // 只複製除了按鈕自身以外的文字
    textButton.addEventListener("click", () => {
        const textToCopy = Array.from(markdownElement.childNodes)
            .filter((node) => !(node.classList && node.classList.contains("copy-buttons")))
            .map((node) => node.innerText || "")
            .join("\n");
        copyToClipboard(textToCopy);
    });

    // 複製 Markdown 原始碼按鈕
    let markdownButton = addMarkdownButtons(markdownText)

    // 加入容器
    buttonContainer.appendChild(textButton);
    buttonContainer.appendChild(markdownButton);

    return buttonContainer;
}



function getXPathForElement(el) {
    let xpath = '';
    while (el && el.nodeType === Node.ELEMENT_NODE) {
        let index = 0;
        let sibling = el.previousSibling;
        while (sibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === el.nodeName) {
                index++;
            }
            sibling = sibling.previousSibling;
        }
        const tagName = el.nodeName.toLowerCase();
        const position = index ? `[${index + 1}]` : '';
        xpath = `/${tagName}${position}${xpath}`;
        el = el.parentNode;
    }
    return xpath;
}


// 定義插入 M365 Prompt 的函數
// function insertM365Prompt(promptText) {
//     console.log("Inserting M365 prompt:", promptText);
//
//     // 獲取 M365 編輯器目標元素
//     let editorInput = document.getElementById('#m365-chat-editor-target-element');
//     let spanElement = document.querySelector('span[role="textbox"][contenteditable="true"]');
//     if (!editorInput) {
//         editorInput = document.querySelector('div[role="textbox"]');
//     }
//     console.log('editorInput', editorInput)
//     console.log('spanElement', spanElement)
//     if (!editorInput) {
//         console.error("M365 editor target element not found.");
//         return {success: false, error: "Editor element not found."};
//     }
//
//     try {
//         // 清空現有內容
//
//         console.log("Editor content cleared.");
//
//         // 按行分割文本並構建 HTML 結構
//         const lines = String(promptText).split('\n');
//         let pElement = document.createElement('p');
//         pElement.className = spanElement.children[0].className;
//         pElement.dir = 'ltr';
//         spanElement.innerHTML = '';
//         lines.forEach((line, index) => {
//             let textSpan = document.createElement('span');
//             textSpan.setAttribute('data-lexical-text', 'true');
//             textSpan.textContent = line;
//             pElement.appendChild(textSpan);
//
//             if (index === lines.length - 1) {
//                 const hiddenSpan = document.createElement('span');
//                 hiddenSpan.setAttribute('aria-hidden', 'true');
//                 hiddenSpan.setAttribute('data-lexical-text', 'true');
//                 hiddenSpan.textContent = '\u200B\u200C';
//                 pElement.appendChild(hiddenSpan);
//             }
//
//             spanElement.appendChild(pElement);
//             console.log(`Inserted paragraph:`, pElement);
//         });
//
//         return {success: true};
//     } catch (error) {
//         console.error("Error inserting prompt:", error);
//         return {success: false, error: error.message};
//     }
//  }

