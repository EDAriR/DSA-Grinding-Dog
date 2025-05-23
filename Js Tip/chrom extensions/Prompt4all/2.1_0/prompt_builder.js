let currentCategory = null; // 初始化當前分類
let currentFocusedTextarea = null; // 用來追蹤目前聚焦的 textarea
let savedRange = null; // 全域變數保存游標範圍
// 初始化 Prompt Builder
function initializePromptBuilder() {
    fetch('prompt_data.json')
        .then(response => response.json())
        .then(data => {
            initializeCategoryButtons(data.categories);
        })
        .catch(error => console.error("Failed to load JSON data:", error));
    document.getElementById('addItemButton').style.display = 'none';
    loadLocalCustomTemplates(); // 加載本地儲存的自定義模板
    loadFavorites(); // 加載收藏項

    const promptText = document.getElementById('promptText');
    promptText.focus();
    let templatecontextMenu = null;
    let currentSubMenu=null;
      // 載入 prompts.json
    let promptsTemplateData = {};
    fetch('prompts.json')
        .then(response => response.json())
        .then(dataTemplate => {
            promptsTemplateData = dataTemplate;
        })
        .catch(error => console.error("Failed to load prompts.json:", error));

    // 初始化 ContextMenu
     // 插入 Prompt 範本內容
    function getCursorElement() {
        // 獲取當前的選取對象
        const selection = window.getSelection();

        if (selection.rangeCount > 0) {
            // 獲取游標範圍
            const range = selection.getRangeAt(0);

            // 返回範圍的起始容器 (游標所在的節點)
            const cursorNode = range.startContainer;

            // 如果游標在文本節點內，則返回父元素
            if (cursorNode.nodeType === Node.TEXT_NODE) {
                return cursorNode.parentNode;
            }

            // 如果游標在元素節點內，直接返回該節點
            return cursorNode;
        }

        return null; // 如果沒有選取範圍
    }

    function createContextMenu(event) {
        if (templatecontextMenu) {
            templatecontextMenu.remove();
        }
        // **保存當前游標範圍**
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            savedRange = selection.getRangeAt(0).cloneRange(); // 保存目前的選取範圍
        }


        templatecontextMenu = document.createElement('div');
        templatecontextMenu.className = 'template-context-menu';
        templatecontextMenu.style.position = 'absolute';
        templatecontextMenu.style.visibility = 'hidden'; // 先隱藏，後面計算位置


        // 第一層選單
        Object.keys(promptsTemplateData).forEach(category => {
            const templateCategoryDiv = document.createElement('div');
            templateCategoryDiv.textContent = category;
            templateCategoryDiv.className = 'template-menu-item';

            // 第二層選單
            const subMenu = document.createElement('div');
            subMenu.className = 'template-sub-menu';

            // 驗證 category 是否有範本內容
            if (Array.isArray(promptsTemplateData[category])) {
                promptsTemplateData[category].forEach(prompt => {
                    const subMenuItem = document.createElement('div');
                    subMenuItem.textContent = prompt.key;
                    subMenuItem.className = 'template-sub-menu-item';
                    // 點擊插入模板並清除所有選單
                    subMenuItem.addEventListener('click', () => {
                        insertTemplate(prompt.value);
                        clearAllMenus();
                        subMenuItem.remove()

                    });

                    subMenu.appendChild(subMenuItem);
                });
            }

            templateCategoryDiv.appendChild(subMenu);

            // 綁定子選單顯示時的位置檢查
            templateCategoryDiv.addEventListener('mouseover', () => {
                clearSubMenu();
                document.body.appendChild(subMenu); // 動態插入子選單到 body 避免被覆蓋
                currentSubMenu = subMenu; // 記錄目前的子選單
                subMenu.style.display = 'block';
                subMenu.style.position = 'absolute';

                // 計算子選單位置
                const rect = templateCategoryDiv.getBoundingClientRect();
                let subMenuX = rect.right; // 預設在右側
                let subMenuY = rect.top;

                const subMenuWidth = subMenu.offsetWidth;
                const subMenuHeight = subMenu.offsetHeight;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // 檢查 X 軸是否超出螢幕右側
                if (subMenuX + subMenuWidth > windowWidth) {
                    subMenuX = rect.left - subMenuWidth; // 移到左側顯示
                }

                // 檢查 Y 軸是否超出螢幕底部
                if (subMenuY + subMenuHeight > windowHeight) {
                    subMenuY = windowHeight - subMenuHeight - 10; // 向上調整
                }

                subMenu.style.left = `${subMenuX}px`;
                subMenu.style.top = `${subMenuY}px`;
            });
            templateCategoryDiv.addEventListener('mouseout', () => {
                // 延遲隱藏以便鼠標進入子選單
                setTimeout(() => {
                    if (!subMenu.matches(':hover')) {
                        subMenu.style.display = 'none';
                    }
                }, 200);
            });

            templatecontextMenu.appendChild(templateCategoryDiv);
        });


        document.body.appendChild(templatecontextMenu);
// 設定初始位置
        templatecontextMenu.style.top = `${event.pageY}px`;
        templatecontextMenu.style.left = `${event.pageX}px`;
        templatecontextMenu.style.visibility = 'visible'; // 設為可見

        // **動態計算並調整位置**
        const menuWidth = templatecontextMenu.offsetWidth;
        const menuHeight = templatecontextMenu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let adjustedX = event.pageX;
        let adjustedY = event.pageY;

        // 調整 X 軸位置
        if (adjustedX + menuWidth > windowWidth) {
            adjustedX = windowWidth - menuWidth - 10; // 向左調整，留點邊距
        }

        // 調整 Y 軸位置
        if (adjustedY + menuHeight > windowHeight) {
            adjustedY = windowHeight - menuHeight - 10; // 向上調整，留點邊距
        }

        // 更新選單位置
        templatecontextMenu.style.top = `${adjustedY}px`;
        templatecontextMenu.style.left = `${adjustedX}px`;

        // 點擊其他地方關閉選單
        document.addEventListener('click', () => {
            if (templatecontextMenu)
                templatecontextMenu.remove();
        }, { once: true });

        event.preventDefault();
    }
    // 清除所有選單
    function clearAllMenus() {
        if (templatecontextMenu) {
            templatecontextMenu.remove();
            templatecontextMenu = null;
        }
        clearSubMenu();

    }
// 清除子選單
    function clearSubMenu() {
        if (currentSubMenu) {
            currentSubMenu.remove();
            currentSubMenu = null;
        }
    }


    // 綁定右鍵事件
    promptText.addEventListener('contextmenu', createContextMenu);
    promptText.addEventListener('focus', () => {
        if (promptText.textContent.trim() === '') {
            promptText.innerHTML = ''; // 清除不必要的 <br>
        }
    });
}




// 初始化分類按鈕
function initializeCategoryButtons(categories) {
    const categoryButtonsDiv = document.getElementById('categoryList');
    categoryButtonsDiv.innerHTML = '';

    categories.forEach(category => {
        const categoryBtn = document.createElement('button');
        categoryBtn.textContent = category.name;
        categoryBtn.className = 'category-button';

        if (category.name === "句型範本") {
            categoryBtn.classList.add('purple-button'); // 設置紫色按鈕樣式
        }

        categoryBtn.onclick = () => {
            // 確保 items 存在且為陣列
            currentCategory = category; // 為全局變量賦值
            console.log("category", category);
            console.log("category.templates", category.templates);
            const items = Array.isArray(category.templates) ? category.templates : [];
            if (category.name === "句型範本") {
                loadSentenceTemplates(items); // 加載句型範本模板
            } else {
                loadTemplates(items || []); // 加載普通模板
            }
        };
        categoryButtonsDiv.appendChild(categoryBtn);
    });
}

// 加載模板列表
function loadTemplates(items) {
    const templateListDiv = document.getElementById('templateList');
    const categoryButtonsDiv = document.querySelector('.category-list');
    const addItemButton = document.getElementById('addItemButton');
    categoryButtonsDiv.classList.add('hidden'); // 隱藏主分類按鈕
    templateListDiv.classList.remove('hidden');
    addItemButton.style.display = 'block';
    templateListDiv.innerHTML = '';


    chrome.storage.local.get(['customTemplates', 'favoriteItems', 'pinnedItems'], (data) => {
        const customTemplates = data.customTemplates || {};
        const favoriteItems = data.favoriteItems || [];
        const pinnedItems = data.pinnedItems || [];



        const currentCustoms = currentCategory
            ? (customTemplates[currentCategory.name] || [])
            : [];

        const allTemplates = [...currentCustoms, ...items];

        // 排序：置頂優先，常用次之
        allTemplates.sort((a, b) => {
            if (pinnedItems.includes(a.key) && !pinnedItems.includes(b.key)) return -1;
            if (!pinnedItems.includes(a.key) && pinnedItems.includes(b.key)) return 1;
            if (favoriteItems.includes(a.key) && !favoriteItems.includes(b.key)) return -1;
            if (!favoriteItems.includes(a.key) && favoriteItems.includes(b.key)) return 1;
            return 0;
        });

        allTemplates.forEach(item => {
            const templateBtn = document.createElement('button');
            templateBtn.textContent = item.key;
            templateBtn.className = `template-button ${favoriteItems.includes(item.key) ? 'favorite' : ''} ${pinnedItems.includes(item.key) ? 'pinned' : ''}`;
            spacialCategories=["偽代碼","角色扮演","輸出形式"]
            if(spacialCategories.includes(currentCategory.name)){
                templateBtn.onclick = () => insertTemplate(item.value);
            }
            else {
                templateBtn.onclick = () => insertKeyword(item.value);
            }
            templateBtn.title = item.desc || '';

            // 綁定右鍵事件
            templateBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, item.key, favoriteItems, pinnedItems); // 顯示自定義右鍵選單
            });

            templateListDiv.appendChild(templateBtn);
        });
    });
}

// 顯示自定義右鍵選單
function showContextMenu(event, key, favoriteItems, pinnedItems) {
    let contextMenu = document.getElementById('customContextMenu');
    if (!contextMenu) {
        contextMenu = document.createElement('div');
        contextMenu.id = 'customContextMenu';
        contextMenu.className = 'context-menu';
        document.body.appendChild(contextMenu);
    }

    // 清空舊內容
    contextMenu.innerHTML = '';

    // 標記為常用/取消常用
    const favoriteOption = document.createElement('div');
    favoriteOption.textContent = favoriteItems.includes(key) ? '★取消常用' : '★標記為常用';
    favoriteOption.onclick = () => {
        toggleFavorite(key);
        contextMenu.style.display = 'none';
    };
    contextMenu.appendChild(favoriteOption);

    // 標記為置頂/取消置頂
    const pinnedOption = document.createElement('div');
    pinnedOption.textContent = pinnedItems.includes(key) ? '取消置頂' : '標記為置頂';
    pinnedOption.onclick = () => {
        togglePinned(key);
        contextMenu.style.display = 'none';
    };
    contextMenu.appendChild(pinnedOption);

    // 設置選單位置
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let posX = event.pageX;
    let posY = event.pageY;

    // 檢測是否超出視窗範圍，必要時調整位置
    if (posX + menuWidth > windowWidth) {
        posX = windowWidth - menuWidth - 10; // 留一些邊距
    }
    if (posY + menuHeight > windowHeight) {
        posY = windowHeight - menuHeight - 10; // 留一些邊距
    }

    contextMenu.style.top = `${posY}px`;
    contextMenu.style.left = `${posX}px`;
    contextMenu.style.position = 'absolute';
    contextMenu.style.display = 'block';

    // 點擊其他地方隱藏選單
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    }, { once: true });

    // 防止右鍵事件的預設行為
    event.preventDefault();
}

// 加載句型範本按鈕

function loadSentenceTemplates(items) {
    const templateListDiv = document.getElementById('templateList');
    const categoryButtonsDiv = document.querySelector('.category-list');

    categoryButtonsDiv.classList.add('hidden');
    templateListDiv.classList.remove('hidden');
    templateListDiv.innerHTML = '';

    items.forEach(item => {
        const templateBtn = document.createElement('button');
        templateBtn.textContent = item.name;
        templateBtn.className = 'template-button';
        templateBtn.title = item.desc;

        templateBtn.onclick = () => {
            displayTemplateSections(item.sections);
        };

        templateListDiv.appendChild(templateBtn);
    });
}
// 顯示模板的詳細區域

function displayTemplateSections(sections) {
    const promptText = document.getElementById('promptText');
    promptText.innerHTML = '';
    let set_current_section=false;
    idx=0
    sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'template-section';
        const header = document.createElement('h3');

        header.textContent = section.header;
        header.contentEditable = 'false';

        const protect_input = document.createElement('div');
        protect_input.contentEditable = 'false';

        const input = document.createElement('div');
        input.contentEditable = 'true';
        input.className = 'template-input';
        if (! set_current_section) {
            currentFocusedTextarea = input
            set_current_section = true
            input.focus(); // 將游標自動定位到第一個section的可編輯區域
        }
        input.setAttribute("data-placeholder",section.placeholder) ;
        //直接定位至第一個section

        // 綁定 focus 事件，記錄目前的 textarea
         input.addEventListener('focus', () => {
            currentFocusedTextarea=input
             currentSelectionStart=currentFocusedTextarea.selectionStart || 0;
             currentSelectionEnd=currentFocusedTextarea.selectionEnd || 0;
             input.removeAttribute("data-placeholder")
        });

        // 監聽 mousedown 事件，解決右鍵失焦問題
        input.addEventListener('mousedown', (event) => {
            const target = event.target;
            if (target.contentEditable === 'true' || target.tagName === 'div') {
                currentFocusedTextarea = target; // 更新目前的編輯區域
                currentSelectionStart = target.selectionStart || 0;
                currentSelectionEnd = target.selectionEnd || 0;
            }
        });

        // 監聽 keyup 事件，動態更新游標位置
        input.addEventListener('keyup', function () {
            if (currentFocusedTextarea) {
                currentSelectionStart = currentFocusedTextarea.selectionStart || 0;
                currentSelectionEnd = currentFocusedTextarea.selectionEnd || 0;
            }
            if (this.textContent.trim().length === 0) {
                this.classList.add('empty');
                this.setAttribute('data-placeholder', section.placeholder);
            } else {
                this.classList.remove('empty');
            }
        });
        sectionDiv.appendChild(header);
        protect_input.appendChild(input);
        sectionDiv.appendChild(protect_input);
        promptText.appendChild(sectionDiv);
    });
}
// 加載本地自定義模板
function loadLocalCustomTemplates() {
    chrome.storage.local.get('customTemplates', (data) => {
        customTemplates = data.customTemplates || {};
    });
}

// 新增自定義模板
function addCustomTemplate(categoryName) {
    const key = prompt("輸入模板名稱：");
    const value = prompt("輸入模板內容：");
    if (!key || !value) return;

    const newTemplate = { key, value };
    chrome.storage.local.get('customTemplates', (data) => {
        const customTemplates = data.customTemplates || {};
        customTemplates[categoryName] = customTemplates[categoryName] || [];
        customTemplates[categoryName].push(newTemplate);
        chrome.storage.local.set({ customTemplates }, () => {
            alert("新增成功！");
            loadTemplates([]);
        });
    });
}

// 標記為最近使用
function markAsRecentlyUsed(key) {
    chrome.storage.local.get('recentlyUsed', (data) => {
        let recentlyUsed = data.recentlyUsed || [];
        recentlyUsed = [key, ...recentlyUsed.filter(item => item !== key)].slice(0, 10);
        chrome.storage.local.set({ recentlyUsed });
    });
}

// 切換收藏狀態
function toggleFavorite(key) {
    chrome.storage.local.get('favoriteItems', (data) => {
        let favoriteItems = data.favoriteItems || [];
        if (favoriteItems.includes(key)) {
            favoriteItems = favoriteItems.filter(item => item !== key);
        } else {
            favoriteItems.push(key);
        }

        chrome.storage.local.set({ favoriteItems }, () => {
            console.log(`Updated favorite status for: ${key}`);
            loadTemplates(currentCategory.templates || []); // 重新加載模板列表
        });
    });
}

// 切換置頂狀態
function togglePinned(key) {
    chrome.storage.local.get('pinnedItems', (data) => {
        let pinnedItems = data.pinnedItems || [];
        if (pinnedItems.includes(key)) {
            pinnedItems = pinnedItems.filter(item => item !== key);
        } else {
            pinnedItems.push(key);
        }

        chrome.storage.local.set({ pinnedItems }, () => {
            console.log(`Updated pinned status for: ${key}`);
            loadTemplates(currentCategory.templates || []); // 重新加載模板列表
        });
    });
}
function isFavorite(key) {
    return favoriteItems.includes(key);
}

// 初始化收藏列表
let favoriteItems = [];
function loadFavorites() {
    chrome.storage.local.get('favoriteItems', (data) => {
        favoriteItems = data.favoriteItems || [];
    });
}
// 插入模板內容
function replaceSpacesWithNbsp(text) {
    return text.replace(/ /g, '\u00A0'); // 用非斷空白替換空格
}

// 插入詞彙為不可修改群組
function insertKeyword(value) {
    if (!currentFocusedTextarea) {
        currentFocusedTextarea = document.getElementById('promptText');
    }
    let selection = window.getSelection();
    // 若沒有有效選取範圍且有保存的游標範圍，則還原它
    if (!selection.rangeCount && savedRange) {
        selection.addRange(savedRange);
    }
    if (!selection.rangeCount) return; // 若仍無有效選取範圍則中止

    let range = selection.getRangeAt(0);
    // 刪除選取的內容（如果有反白）
    range.deleteContents();

    // 建立關鍵字元素
    const spanElement = document.createElement('span');
    spanElement.className = 'keyword-span';
    spanElement.textContent = value;
    spanElement.setAttribute('contenteditable', 'false');

    // 插入關鍵字元素到目前的 range
    range.insertNode(spanElement);

    // 插入一個空白字符作為分隔
    const space = document.createTextNode(' ');
    range.insertNode(space);

    // 更新 range 到插入內容之後
    range.setStartAfter(space);
    range.setEndAfter(space);

    // 更新選取範圍以便游標正確定位
    selection.removeAllRanges();
    selection.addRange(range);
}



//插入prompt內容，文字+變數
function insertTemplate(template) {
    if (!currentFocusedTextarea) {
        currentFocusedTextarea = document.getElementById('promptText');
    }
    // 確保處理空內容情況
    if (!currentFocusedTextarea.textContent) {
        currentFocusedTextarea.textContent = ''; // 如果為空，設為空字串
    }

    // **還原游標範圍**
    let selection = window.getSelection();
    selection.removeAllRanges();
    // 若沒有選取範圍，將游標放在內容的末尾
    if (!savedRange) {
        let range = document.createRange();
        range.selectNodeContents(currentFocusedTextarea);
        range.collapse(false);
        savedRange=range;
    }

    selection.addRange(savedRange);





    // 創建一個臨時容器來處理範本
    let tempDiv = document.createElement('div');
    tempDiv.style.whiteSpace = 'pre-wrap'; // 添加白空格處理
    let templateLines = template.trimStart().split('\n');

    templateLines.forEach(line => {
        if (line.trim() === '') {
            // 處理空行
            tempDiv.appendChild(document.createElement('br'));

        }
        else {
            line = replaceSpacesWithNbsp(line); // 替換空格為 `&nbsp;`
            const regex = /\{\{(.*?)\}\}/g;
            let lastIndex = 0;
            let match;

            while ((match = regex.exec(line)) !== null) {
                const variableName = match[1];

                // 插入變數前的文字
                if (lastIndex < match.index) {
                    const beforeVariableText = line.substring(lastIndex, match.index).replace(/ /g, '\u00A0'); // 替換空格
                    const spanText = document.createElement('span');
                    spanText.innerHTML = beforeVariableText; // 使用 innerHTML 保留空白
                    tempDiv.appendChild(spanText);

                }

                // 插入變數
                const spanElement = document.createElement('span');
                spanElement.className = 'keyword-span';
                spanElement.textContent = variableName;
                spanElement.setAttribute('contenteditable', 'false'); // 禁止編輯
                tempDiv.appendChild(spanElement);

                lastIndex = regex.lastIndex; // 更新索引
            }

            // 插入變數後的剩餘文字
            if (lastIndex < line.length) {
                const afterVariableText = line.substring(lastIndex).replace(/ /g, '\u00A0'); // 替換空格
                const spanText = document.createElement('span');
                spanText.innerHTML = afterVariableText; // 使用 innerHTML 保留空白
                tempDiv.appendChild(spanText);
            }

            // 加上換行
            tempDiv.appendChild(document.createElement('br'));
        }
    });

    // 在當前選取範圍插入新內容
    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }

    // 插入範本文字
    savedRange.insertNode(fragment);

    // 移動游標到插入內容之後
    savedRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(savedRange);
    // 清除保存的範圍
    savedRange = null;
}






// 清空按鈕功能
document.getElementById('clearButton').onclick = () => {
    const promptText = document.getElementById('promptText');
    currentFocusedTextarea=null;
    promptText.innerHTML = '';
};

// 返回主分類按鈕功能
document.getElementById('homeButton').onclick = () => {
    document.querySelector('.category-list').classList.remove('hidden');
    document.getElementById('addItemButton').style.display = 'none'
    document.getElementById('templateList').innerHTML = '';
};

// 函數：將句型範本轉換為 Markdown 格式
function convertToMarkdown() {
    let sections = document.querySelectorAll('.template-section');

    return Array.from(sections).map(section => {
        const title = section.querySelector('h3').textContent;
        const textarea = section.querySelector('div').textContent;
        return `## ${title}  \n\n  ${textarea}`;
    }).join('\n\n  ');
}

// 函數：關鍵字模式處理
function getEditorContent() {
    const editor = document.querySelector('[contenteditable="true"], textarea');
    if (!editor) {
        console.warn("No editable element found for keyword mode.");
        return '';
    }

    // 處理 contenteditable 的內容
    if (editor.hasAttribute('contenteditable')) {
        let content = '';
        editor.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                // 文字節點，直接加入內容
                content += node.textContent;
            } else if (node.nodeName === 'BR') {
                // 換行符號
                content += '\n';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList.contains('keyword-span')) {
                    // 處理關鍵字的 span 節點
                    content += `{{${node.textContent}}}`;
                } else {
                    // 遞歸處理其他子節點
                    content += getEditorContentFromElement(node);
                }
            }
        });
        return content.trimStart();;
    }

    // 處理 textarea 的內容
    return editor.value || '';
}

// 遞歸處理子節點
function getEditorContentFromElement(element) {
    let content = '';
    element.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            content += node.textContent;
        } else if (node.nodeName === 'BR') {
            content += '\n';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('keyword-span')) {
                content += `{{${node.textContent}}}`;
            } else {
                content += getEditorContentFromElement(node);
            }
        }
    });
    return content;
}

// 判斷是否為句型範本模式
function isTemplateSectionAvailable() {
    return document.querySelector('.template-section') !== null;
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['currentData'], items => {
        const isDark = items.currentData?.isDark;
        if (isDark) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
    });
    initializePromptBuilder();
    loadFavorites();

    const submitButton = document.getElementById('submitPrompt');

    if (submitButton) {
        submitButton.addEventListener('click', async(event) => {
            event.preventDefault();
            let promptContent;
            if (isTemplateSectionAvailable()) {
                promptContent = convertToMarkdown();
            } else {
                promptContent = getEditorContent();
            }

            if (!promptContent) {
                alert('未找到有效內容，請檢查輸入是否正確！');
                return;
            }
            // 保存到剪貼簿
            try {
                  await navigator.clipboard.writeText(promptContent);
              } catch (err) {
                  console.error("Failed to copy prompt to clipboard:", err);
              }



            chrome.runtime.sendMessage(
                { action: "relayBuiltPrompt", prompt: promptContent },
                (response) => {
                    if (response?.success) {
                        console.log('Markdown inserted successfully.');
                        window.close();
                    } else {
                        alert(`Failed to insert Markdown: ${response?.error || 'Unknown error'}`);
                    }
                }
            );
        });
    } else {
        console.error("Submit button not found.");
    }
});


