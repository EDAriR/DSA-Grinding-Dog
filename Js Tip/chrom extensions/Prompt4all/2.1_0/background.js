console.log("background.js loaded");

let lastTabId = null;
let isSidePanelEnabled = false; // 側邊面板啟用狀態
let isPromptBuilderOpen = false; // 提示生成器打開狀態
let promptBuilderTabId = null;

let processingMermaidNodes = false; // 避免重複處理
let isInScope=false;



/**
 * 初始化擴展，建立右鍵選單 + 啟用 side panel
 */

chrome.runtime.onInstalled.addListener(() => {
    const manifest = chrome.runtime.getManifest();
    const contentScripts = manifest.content_scripts || [];
    // 3. 收集所有 matches（並排除重複）
    const allMatches = [
        ...new Set(
            contentScripts.flatMap(cs => cs.matches || [])
        )
    ];
    chrome.storage.local.set({ contentScripts });
    chrome.contextMenus.removeAll(() => {
        // 預設禁用的選單項目
        chrome.contextMenus.create({
            id: "menu_prompt_template",
            title: "🥷 提示範本",
            contexts: ["editable"], // 確保選單在所有地方都顯示
            documentUrlPatterns: allMatches,
            enabled: true // 預設禁用，按右鍵時根據游標位置更新
        });

        chrome.contextMenus.create({
            id: "menu_prompt_builder",
            title: "🪄 提示產生器",
            contexts: ["editable"],
            documentUrlPatterns: allMatches,
            enabled: true
        });

        chrome.contextMenus.create({
            id: "menu_prompt4all_settings",
            title: "⚙️ 設定",
            contexts: ["all"],
            documentUrlPatterns: allMatches,
            enabled: true // 設定選單不受限制
        });


    });

});
//     chrome.contextMenus.create({
//         id: "prompt_template",
//         title: "🥷 提示範本",
//         contexts: ["editable"],
//     });
//
//     chrome.contextMenus.create({
//         id: "prompt_builder",
//         title: "🪄 提示產生器",
//         contexts: ["editable"],
//     });
//
//     chrome.contextMenus.create({
//         id: "prompt4all_settings",
//         title: "⚙️ 設定",
//         contexts: ["all"],
//     });

// 若不需要可刪除
// chrome.contextMenus.create({
//   id: "backup_customization",
//   title: "📤 備份自定義",
//   contexts: ["editable"],
// });
// chrome.contextMenus.create({
//   id: "restore_customization",
//   title: "📥 還原自定義",
//   contexts: ["editable"],
// });

// 啟用 side panel
if (chrome.sidePanel && chrome.sidePanel.setOptions) {
    chrome.sidePanel.setOptions({enabled: true}, () => {
        isSidePanelEnabled = true;
        console.log("[onInstalled] Side panel enabled.");
    });
} else {
    console.log("[onInstalled] chrome.sidePanel not supported in this environment.");
}
// });

/**
 * 快捷方式: 點擊 extension icon → 再次打開 side panel
 */
chrome.action.onClicked.addListener(() => {
    chrome.windows.getCurrent((window) => {
        if (window?.id == null) return;
        // 先重新指定要顯示的側邊欄頁面
        chrome.sidePanel.setOptions(
            { path: "side_panel.html",   tabId: window.id,      enabled: true },
            () => {
                // 再打開
                chrome.sidePanel.open({ windowId: window.id })
                    .then(() => console.log("側邊欄已開啟"))
                    .catch(err => console.error("開啟側邊欄失敗", err));
            }
        );
    });
});

/**
 * 打開側邊面板
 */
function openSidePanel(windowId) {
    if (typeof windowId !== "number") {
        console.error(`[openSidePanel] Invalid windowId type: ${typeof windowId}`, windowId);
        return;
    }

    if (!chrome.sidePanel || !chrome.sidePanel.open) {
        console.log("[openSidePanel] sidePanel API not available.");
        return;
    }

    chrome.sidePanel
        .open({windowId})
        .then(() => {
            console.log(`[openSidePanel] Side panel opened for windowId: ${windowId}`);
        })
        .catch((error) => {
            console.error(`[openSidePanel] Failed to open side panel for windowId: ${windowId}`, error);
            handleSidePanelError(error);
        });
}

/**
 * 處理 side panel 打開失敗
 */
function handleSidePanelError(error) {
    if (!error || !error.message) {
        console.log("[handleSidePanelError] Unknown error", error);
        return;
    }

    if (error.message.includes("No active side panel")) {
        console.log("[handleSidePanelError] No active side panel found. Attempting to reset...");
        chrome.windows.getCurrent((window) => {
            if (window && typeof window.id === "number") {
                openSidePanel(window.id);
            } else {
                console.error("[handleSidePanelError] No valid active window found to reset side panel.");
                console.log("無法打開側邊面板，請檢查瀏覽器窗口是否有效。");
            }
        });
    } else {
        console.log("側邊面板啟用失敗，請檢查擴展設置或重新啟動瀏覽器。");
    }
}

/**
 * 右鍵選單點擊事件
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (tab) {
        // 儲存最後的 tabId
        if (tab.id) {
            lastTabId = tab.id;
            console.log("[contextMenus.onClicked] lastTabId =", lastTabId);
        }

        if (info.menuItemId === "menu_prompt_template" || info.menuItemId === "menu_prompt_builder") {
            chrome.storage.local.set({ lastOpenedFromContextMenu: Date.now() }, () => {
                console.log("[ContextMenu] 記錄右鍵開啟時間");
            });
            if (info.editable)
                // 使用更精確的方法收集游標資料
                chrome.scripting.executeScript(
                    {
                        target: {tabId: tab.id},
                        func: () => {
                            function getXPathForElement(el) {
                                let xpath = "";
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
                                    const position = index ? `[${index + 1}]` : "";
                                    xpath = `/${tagName}${position}${xpath}`;
                                    el = el.parentNode;
                                }
                                return xpath;
                            }

                            const activeElement = document.activeElement;
                            if (!activeElement) return null;

                            // 確保元素是可編輯的
                            const isEditable =
                                activeElement.isContentEditable ||
                                activeElement.tagName === 'TEXTAREA' ||
                                (activeElement.tagName === 'INPUT' &&
                                    activeElement.type !== 'checkbox' &&
                                    activeElement.type !== 'radio' &&
                                    activeElement.type !== 'button');

                            if (!isEditable) return null;

                            // 收集完整資訊
                            let selStart = 0, selEnd = 0;

                            if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
                                selStart = activeElement.selectionStart;
                                selEnd = activeElement.selectionEnd;
                            } else {
                                const selection = window.getSelection();
                                if (selection.rangeCount > 0) {
                                    const range = selection.getRangeAt(0);
                                    selStart = range.startOffset;
                                    selEnd = range.endOffset;
                                }
                            }

                            return {
                                elementId: activeElement.id || null,
                                tagName: activeElement.tagName,
                                isContentEditable: activeElement.isContentEditable || false,
                                xpath: getXPathForElement(activeElement),
                                selectionStart: selStart,
                                selectionEnd: selEnd,
                                url: window.location.href,
                                timeStamp: Date.now(),
                                elementValue: activeElement.value || activeElement.textContent || ""
                            };
                        }
                    },
                    (results) => {
                        if (results && results[0] && results[0].result) {
                            const data = results[0].result;
                            data.tabId = tab.id;
                            chrome.storage.local.set({cursorData: data}, () => {
                                console.log("[contextMenus.onClicked] Cursor data stored:", data);
                            });
                        } else {
                            console.log("[contextMenus.onClicked] No active editable element found.");
                        }
                    }
                );

        }
        // 不同 menuItemId → 執行不同操作
        if (info.menuItemId === "menu_prompt_template") {
            if (!info.editable){
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "showAlter", message: "這是一個警訊訊息"});
                });
            } else {
                // 打開 side panel
                if (!tab || typeof tab.windowId !== "number") {
                    console.error("[prompt_template] Invalid tab or missing valid windowId:", tab);
                    console.log("無法啟用側邊面板，請重新嘗試。");
                    return;
                }
                chrome.sidePanel.setOptions({path: "side_panel.html", enabled: true}, () => {
                    console.log("[prompt_template] Side panel re-enabled.");
                    openSidePanel(tab.windowId);
                });
            }
        } else if (info.menuItemId === "menu_prompt_builder") {
            // 若尚未開啟 prompt_builder 頁籤 → create
            if (!info.editable){
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "showAlter", message: "這是一個警訊訊息"});
                });
            } else {
                if (promptBuilderTabId === null) {
                    chrome.tabs.create(
                        {url: chrome.runtime.getURL("prompt_builder.html"), active: true},
                        (newTab) => {
                            promptBuilderTabId = newTab.id;
                            isPromptBuilderOpen = true;
                            console.log(`[prompt_builder] new tab opened: ${newTab.id}`);
                        }
                    );
                } else {
                    // 已存在 → 切回 focus
                    chrome.tabs.update(promptBuilderTabId, {active: true}, () => {
                        console.log(`[prompt_builder] switched focus to existing tab: ${promptBuilderTabId}`);
                    });
                }
            }
        } else if (info.menuItemId === "menu_prompt4all_settings") {
            // 設定 side_panel path = settings.html
            if (!tab || typeof tab.windowId !== "number") {
                console.error("[prompt4all_settings] Invalid tab or windowId:", tab);
                console.log("無法啟用側邊面板，請重新嘗試。");
                return;
            }
            chrome.sidePanel.setOptions({path: "settings.html", enabled: true}, () => {
                console.log("[prompt4all_settings] Side panel re-enabled.");
            });
            openSidePanel(tab.windowId);
        }
            // 若有備份/還原功能，可在此加上：
            // else if (info.menuItemId === "backup_customization" && info.editable) {
            //   backupCustomization();
            // } else if (info.menuItemId === "restore_customization" && info.editable) {
            //   restoreCustomization();
        // }
        else {
            // 其他的 menu item → 預設行為：嘗試再打開 side panel
            if (tab && typeof tab.windowId === "number") {
                openSidePanel(tab.windowId);
            }
        }
    }
});

// 關閉 prompt builder tab → 重置
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === promptBuilderTabId) {
        console.log("[tabs.onRemoved] prompt_builder tab closed.");
        promptBuilderTabId = null;
    }
});

/**
 * ====== 以下是備份/還原功能 ======
 */
function backupCustomization() {
    chrome.storage.local.get(["favoriteItems", "customTemplates"], (data) => {
        const backupData = {
            favorites: data.favoriteItems || [],
            customTemplates: data.customTemplates || [],
        };
        uploadToGDrive("custom_backup.json", JSON.stringify(backupData))
            .then(() => alert("自定義備份成功！"))
            .catch((err) => {
                alert("備份失敗，請稍後再試。");
                console.error("[backupCustomization] error:", err);
            });
    });
}

function restoreCustomization() {
    downloadFromGDrive("custom_backup.json")
        .then((data) => {
            const parsedData = JSON.parse(data);
            chrome.storage.local.set(
                {
                    favoriteItems: parsedData.favorites || [],
                    customTemplates: parsedData.customTemplates || [],
                },
                () => {
                    alert("自定義還原完成！");
                }
            );
        })
        .catch(() => alert("未找到備份檔案或還原失敗。"));
}

/**
 * Google Drive 上傳 & 下載範例 (可視需要再封裝)
 */
async function uploadToGDrive(fileName, fileContent) {
    const token = await getGoogleAuthToken();
    return fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=media", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: fileContent,
    });
}

async function downloadFromGDrive(fileName) {
    const token = await getGoogleAuthToken();
    const resp = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${fileName}'&spaces=appDataFolder`,
        {headers: {Authorization: `Bearer ${token}`}}
    );
    const fileMetadata = await resp.json();

    if (fileMetadata.files && fileMetadata.files.length > 0) {
        const fileId = fileMetadata.files[0].id;
        const fileResp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {Authorization: `Bearer ${token}`},
        });
        return fileResp.text();
    } else {
        throw new Error("File not found");
    }
}

async function getGoogleAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({interactive: true}, (token) => {
            if (chrome.runtime.lastError || !token) {
                return reject(chrome.runtime.lastError || "未能獲取身份驗證令牌");
            }
            resolve(token);
        });
    });
}

/**
 *  後端 API 呼叫(範例) - 注意 async
 */
async function makeRequest(method, path, data) {
    // 讀取 token
    let token = null;
    const stored = await chrome.storage.local.get("accessToken");
    token = stored?.accessToken || null;

    const response = await fetch(`https://chatgpt.com/backend-api${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    const responseText = await response.text();
    console.debug(`[makeRequest] path=${path}, responseText=`, responseText);

    return {response, responseText};
}

/**
 * 接收來自 content script/side_panel 的訊息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 插入 prompt
    if (["relayPrompt", "relayBuiltPrompt"].includes(request.action)) {
        console.log(`[onMessage] Received action ${request.action} with prompt:`, request.prompt);

        chrome.storage.local.get("cursorData", (data) => {
            const cursorData = data.cursorData;
            if (!cursorData || !cursorData.xpath) {
                console.error("[onMessage] No valid cursorData stored.");
                sendResponse({success: false, error: "No valid cursor data stored."});
                return;
            }

            // 儲存最後的 tabId（若尚未設定）
            if (!lastTabId && "tabId" in cursorData) {
                lastTabId = cursorData.tabId;
            }
            const targetTabId = lastTabId || cursorData.tabId;
            if (!targetTabId) {
                console.error("[onMessage] No valid tabId found in cursorData.");
                sendResponse({success: false, error: "No valid tabId."});
                return;
            }

            console.log(`[onMessage] Preparing to inject content.js into tab ${targetTabId}`);
            chrome.scripting.executeScript({
                target: {tabId: targetTabId},
                files: ["content.js"]
            }).then(() => {
                console.log(`[onMessage] Successfully injected content.js into tab ${targetTabId}`);
                const messageData = {
                    action: "insertPrompt",
                    prompt: request.prompt,
                    timestamp: Date.now()
                };
                console.log("[onMessage] Sending message to content.js with data:", messageData);
                chrome.tabs.sendMessage(targetTabId, messageData, (response) =>  {
                    if (chrome.runtime.lastError) {
                        console.error("[onMessage] Error sending message to content.js:", chrome.runtime.lastError.message);
                        sendResponse({success: false, error: chrome.runtime.lastError.message});
                    } else {
                        console.log("[onMessage] Received response from content.js:", response);
                        if (request.action === "relayBuiltPrompt") {
                            chrome.tabs.update(targetTabId, {active: true}, () => {
                                if (chrome.runtime.lastError) {
                                    console.error("[onMessage] Failed to switch tab:", chrome.runtime.lastError);
                                    sendResponse({success: false, error: "Failed to switch to the tab."});
                                } else {
                                    sendResponse({success: true});
                                }
                            });
                        } else if (request.action === "relayPrompt") {
                            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                                const tabId = tabs[0].id;
                                chrome.sidePanel.setOptions({tabId, enabled: false}, () => {
                                    chrome.sidePanel.setOptions({tabId, enabled: true});
                                });
                            });

                            // 呼叫後端 API 作後續處理
                            (async () => {
                                try {
                                    const {response, responseText} = await makeRequest("GET", "/models");
                                    console.log("[onMessage] Response from /models:", responseText);
                                    console.log(JSON.parse(responseText));
                                    sendResponse({success: true});
                                } catch (err) {
                                    console.error("[onMessage] makeRequest error:", err);
                                    sendResponse({success: false, error: err.message});
                                }
                            })();
                        } else {
                            console.warn("[onMessage] Unknown action received.");
                            sendResponse({success: false, error: "Unknown error"});
                        }
                    }
                });
            }).catch((error) => {
                console.error("[onMessage] Failed to inject content.js into tab", targetTabId, error);
                sendResponse({success: false, error: error.message});
            });
        });
        return true; // 告知 chrome.runtime.onMessage 將會進行非同步回應
    }



    // 載入 prompts.json
    else if (request.action === "loadPrompts") {
        fetch(chrome.runtime.getURL("prompts.json"))
            .then((res) => res.json())
            .then((data) => {
                if (typeof data !== "object" || data === null) {
                    throw new Error("Invalid data format: Expected an object.");
                }
                sendResponse({success: true, prompts: data});
            })
            .catch((error) => {
                console.error("[onMessage] Failed to load prompts.json:", error);
                sendResponse({success: false, error: error.message});
            });
        return true; // 非同步
    }

    // 儲存設定
    else if (request.action === "updateSettings") {
        console.log("[onMessage] updateSettings:", request.settings);

        chrome.storage.local.set(request.settings, () => {
            console.log("[onMessage] settings saved to local storage.");
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs.length > 0) {
                    const currentTabId = tabs[0].id;
                    const currentTabUrl = tabs[0].url || "";
                    // 避免在 chrome:// or edge:// 等內建頁面 reload
                    if (
                        !currentTabUrl.startsWith("chrome://") &&
                        !currentTabUrl.startsWith("edge://")
                    ) {
                        // 先嘗試 sendMessage
                        chrome.tabs.sendMessage(
                            currentTabId,
                            {type: "updateSettings", settings: request.settings},
                            () => {
                                if (chrome.runtime.lastError) {
                                    console.warn(`[updateSettings] tab ${currentTabId} no response, inject content.js`);
                                    chrome.scripting.executeScript(
                                        {target: {tabId: currentTabId}, files: ["content.js"]},
                                        () => console.log(`[updateSettings] content.js injected to tab ${currentTabId}`)
                                    );
                                } else {
                                    console.log(`[updateSettings] notified tab ${currentTabId} to update settings`);
                                }
                            }
                        );
                        // 重新載入當前頁
                        chrome.tabs.reload(currentTabId, () => {
                            console.log(`[updateSettings] Tab ${currentTabId} reloaded.`);
                        });
                    } else {
                        console.warn(`[updateSettings] Can't reload a chrome:// or edge:// URL: ${currentTabUrl}`);
                    }
                }
            });
            sendResponse( {status: "success"});
        });
        return true; // 非同步
    }
    else if (request.action === "closeSidePanel") {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tabId = tabs[0].id;
            // 先把 panel 關掉 → UI 消失
            chrome.sidePanel.setOptions({tabId, enabled: false}, () => {
                // 再立刻重啟功能，但不打開 UI → 下一次打開動作可正常運作
                chrome.sidePanel.setOptions({tabId, enabled: true});
            });
        });
    }

    // 注入 Mermaid
    else if (request.action === "injectMermaid" && sender.tab) {
        const tabId = sender.tab.id;

        // 第一步：注入 Mermaid 腳本
        chrome.scripting.executeScript(
            {
                target: { tabId },
                files: ["mermaid.min.js"],
            },
            async (results) => {
                if (chrome.runtime.lastError) {
                    console.error("[injectMermaid] script injection failed:", chrome.runtime.lastError.message);
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    console.log("[injectMermaid] script injected successfully.");
                    // 第二步：初始化 mermaid
                    chrome.scripting.executeScript(
                        {
                            target: { tabId },
                            func:(nodeId) => {
                                if (typeof mermaid !== "undefined" && typeof mermaid.initialize === "function") {
                                    mermaid.initialize({ startOnLoad: false });
                                }
                                // 處理已有的 <pre class="mermaid">
                                async function processMermaidElements(prenode) {
                                    let elements = [prenode];
                                    if (prenode === undefined || prenode === null) {
                                        prenode = document;
                                        elements = prenode.querySelectorAll("pre.mermaid");
                                    }

                                console.log("[mermaid] processed elements:", elements);
                                for (const el of elements) {
                                    if (el === document) continue;
                                    try {
                                        if (el.dataset.mermaidRendered === "true" || el.className === "mermaid-syntax") continue;
                                            await mermaid.run({nodes: [el]});
                                            el.dataset.mermaidRendered = "true";
                                            console.log("[mermaid] processed <pre.mermaid>:", el);


                                    }catch (err) {
                                            console.log("[mermaid] process error:", err);
                                        }

                                }







                                    // const innerTspans = document.querySelectorAll('tspan.text-inner-tspan');
                                    // console.log('innerTspans',innerTspans)
                                    // // 逐一處理 textContent
                                    // innerTspans.forEach(tspan => {
                                    //     tspan.textContent = tspan.textContent.replace("&amp;quot;", '');
                                    // });
                                }
                                // 先處理現有

                                if(nodeId===""){
                                    processMermaidElements(document);
                                    console.log("[mermaid] processMermaidElements",nodeId);
                                }else {
                                    processMermaidElements(document.querySelector(`#${nodeId}`));
                                    console.log("[mermaid] processMermaidElements",nodeId);
                                }
                            },
                            args: [request.nodeId],
                        },
                        async (results) => {
                            if (chrome.runtime.lastError) {
                                console.error("[injectMermaid] init failed:", chrome.runtime.lastError.message);
                                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                            } else {
                                console.log("[injectMermaid] mermaid init done.");
                                sendResponse({ success: true });
                            }
                        }
                    );
                }
            }
        );
        return true;
    }





});