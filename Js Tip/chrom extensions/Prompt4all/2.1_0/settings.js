// settings.js
let automationAll = null;
let codeBlockMarkdown = null;
let nonCodeTables = null;
let foldHeadings = null;
let mainColor = null;
let subColor = null;
let accentColor = null;
let fontColor = null;
let fontSize = null;
let tableBorderColor=null;
let tableHeaderColor=null;
let foldKeywords = null;

/**
 * 調整顏色亮度的函數
 * @param {string} color - 以十六進制表示的顏色 (例如 "#1e90ff")
 * @param {number} percent - 調整亮度的百分比，正數增加亮度，負數降低亮度
 * @returns {string} - 調整後的顏色，仍為十六進制格式
 */
function adjustColorBrightness(color, percent) {
    // 移除 "#" 符號
    color = color.replace(/^#/, "");

    // 將顏色拆分為 R, G, B 分量
    const num = parseInt(color, 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

    // 限制 RGB 分量的範圍在 0-255
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    // 將 RGB 轉回十六進制格式
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

let access_token=null;
document.addEventListener('DOMContentLoaded', () => {
    // chrome.cookies.getAll({ url: 'https://www.chatgpt.com' }, (cookies) => {
    //     console.log('ChatGPT cookies:', cookies);
    //     for (let i = 0; i < cookies.length; i++) {
    //         let cookie=cookies[i];
    //         if(cookie.name==="__Secure-next-auth.session-token"){
    //             let accessToken=cookie.value;
    //             chrome.storage.local.set({ accessToken: accessToken }, () => {
    //                 console.log('accessToken', accessToken);
    //             });
    //
    //         }
    //     }
    // });
    // // 初始化設定
    chrome.storage.local.get(["currentData"], (data) => {
        const isDark = data.currentData?.isDark;
        // Dark Mode handling
        if (isDark) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
    });


        chrome.storage.local.get(
        ['automationAll', 'codeBlockMarkdown', 'nonCodeTables', 'foldHeadings', 'mainColor', 'subColor', 'accentColor', 'fontColor', 'fontSize', 'tableBorderColor', 'tableHeaderColor', 'foldKeywords'],
        (items) => {
            document.getElementById('toggleAutomationAll').checked = items.automationAll ?? true;
            document.getElementById('toggleCodeBlockMarkdown').checked = items.codeBlockMarkdown ?? true;
            document.getElementById('toggleNonCodeTables').checked = items.nonCodeTables ?? true;
            document.getElementById('toggleFoldHeadings').checked = items.foldHeadings ?? true;
            document.getElementById('mainColorPicker').value = items.mainColor ?? '#FF6B00';
            document.getElementById('subColorPicker').value = items.subColor ?? '#A9A9A9';
            document.getElementById('accentColorPicker').value = items.accentColor ?? '#6A0DAD';
            document.getElementById('fontColorPicker').value = items.fontColor ?? '#000000';
            document.getElementById('fontSizeInput').value = items.fontSize ?? 10;
            document.getElementById('tableBorderColorPicker').value = items.tableBorderColor ?? '#CCCCCC';
            document.getElementById('tableHeaderColorPicker').value = items.tableHeaderColor ?? '#FF6B00';
            document.getElementById('foldKeywordsInput').value = items.foldKeywords ?? 'Concept Alignment, Chain-of-thought,Rethink';

            document.querySelectorAll('.update_setting_btn, .copy-btn').forEach((btn) => {
                btn.style.backgroundColor = mainColor;
                btn.style.borderColor = mainColor;
            });
            document.querySelectorAll('.switch input:checked + .slider').forEach((inp) => {
                inp.style.backgroundColor = mainColor;
                inp.style.borderColor = mainColor;
            });
            // 初始化動態樣式
            applyDynamicStyles();
        }
    );
    document.getElementById('toggleAutomationAll').addEventListener('change', (event) => {
        const isChecked = event.target.checked;
        const subToggles = [
            'toggleCodeBlockMarkdown',
            'toggleNonCodeTables',
            'toggleFoldHeadings'
        ];

        subToggles.forEach((toggleId) => {
            const toggle = document.getElementById(toggleId);
            toggle.checked = isChecked;

            // 同時更新背景色
            const slider = toggle.nextElementSibling;
            slider.style.backgroundColor = isChecked
                ? document.getElementById('mainColorPicker').value
                : '#ccc';
        });
    });

    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener('change', (event) => {
            const slider = checkbox.nextElementSibling;
            if (!checkbox.checked) {
                slider.style.backgroundColor = '#ccc'; // 關閉時變灰
            } else {
                slider.style.backgroundColor = document.getElementById('mainColorPicker').value; // 打開時用主色
            }
        });
    });

    document.getElementById('update_setting_btn').addEventListener('click', () => {
        const settings = {
            automationAll: document.getElementById('toggleAutomationAll').checked,
            codeBlockMarkdown: document.getElementById('toggleCodeBlockMarkdown').checked,
            nonCodeTables: document.getElementById('toggleNonCodeTables').checked,
            foldHeadings: document.getElementById('toggleFoldHeadings').checked,
            mainColor: document.getElementById('mainColorPicker').value,
            subColor: document.getElementById('subColorPicker').value,
            accentColor: document.getElementById('accentColorPicker').value,
            fontColor: document.getElementById('fontColorPicker').value,
            fontSize: document.getElementById('fontSizeInput').value,
            tableBorderColor: document.getElementById('tableBorderColorPicker').value,
            tableHeaderColor: document.getElementById('tableHeaderColorPicker').value,
            foldKeywords: document.getElementById('foldKeywordsInput').value
        };


        chrome.runtime.sendMessage({
            action: "updateSettings",
            settings: settings
        });
        showFeedbackPopup('設定已更新！');
    });

    document.getElementById('restore_setting_btn').addEventListener('click', () => {
        const settings = {
            automationAll: true,
            codeBlockMarkdown: true,
            nonCodeTables: true,
            foldHeadings: true,
            mainColor: '#FF6B00',
            subColor: '#A9A9A9',
            accentColor: '#6A0DAD',
            fontColor: '#000000',
            fontSize: 10,
            tableBorderColor: '#CCCCCC',
            tableHeaderColor: '#FF6B00',
            foldKeywords: 'Concept Alignment, Chain-of-thought,Rethink'
        };

        // 更新控制項的 outerHTML
        document.getElementById('toggleAutomationAll').outerHTML = `<input type="checkbox" id="toggleAutomationAll" checked>`;
        document.getElementById('toggleCodeBlockMarkdown').outerHTML = `<input type="checkbox" id="toggleCodeBlockMarkdown" checked>`;
        document.getElementById('toggleNonCodeTables').outerHTML = `<input type="checkbox" id="toggleNonCodeTables" checked>`;
        document.getElementById('toggleFoldHeadings').outerHTML = `<input type="checkbox" id="toggleFoldHeadings" checked>`;
        document.getElementById('mainColorPicker').outerHTML = `<input type="color" id="mainColorPicker" value="#FF6B00">`;
        document.getElementById('subColorPicker').outerHTML = `<input type="color" id="subColorPicker" value="#A9A9A9">`;
        document.getElementById('accentColorPicker').outerHTML = `<input type="color" id="accentColorPicker" value="#6A0DAD">`;
        document.getElementById('fontColorPicker').outerHTML = `<input type="color" id="fontColorPicker" value="#000000">`;
        document.getElementById('fontSizeInput').outerHTML = `<input type="number" id="fontSizeInput" value="12">`;
        document.getElementById('tableBorderColorPicker').outerHTML = `<input type="color" id="tableBorderColorPicker" value="#CCCCCC">`;
        document.getElementById('tableHeaderColorPicker').outerHTML = `<input type="color" id="tableHeaderColorPicker" value="#FF6B00">`;
        document.getElementById('foldKeywordsInput').outerHTML = `<input type="text" id="foldKeywordsInput" value="Concept Alignment, Chain-of-thought,Rethink">`;
        applyDynamicStyles();
        // 儲存設定值到 storage
        chrome.storage.local.set(settings, () => {
            showFeedbackPopup('設定已更新！');
        });
    });


    document.getElementById('mainColorPicker').addEventListener('input', (event) => {
        let mainColor = event.target.value;
        document.querySelectorAll('.update_setting_btn, .copy-btn').forEach((btn) => {
            btn.style.backgroundColor = mainColor;
            btn.style.borderColor = mainColor;
        });
        document.querySelectorAll('.switch input:checked + .slider').forEach((inp) => {
            inp.style.backgroundColor = mainColor;
            inp.style.borderColor = mainColor;
        });
        document.querySelectorAll('.settings-section h3,.settings-header h2').forEach((inp) => {
            inp.style.color = mainColor;
        });
        let settingsPanel = document.querySelector('.settings-panel');
        settingsPanel.style.borderLeftColor = mainColor
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = `
        .update_setting_btn:hover, .copy-btn:hover {
        background-color: ${mainColor} !important;
        border-color: ${mainColor} !important;
         }
         .switch input:checked + .slider {
            background-color: ${mainColor} !important;
        }
         `
        document.head.appendChild(styleSheet);
        document.getElementById('tableHeaderColorPicker').outerHTML = `<input type="color" id="tableHeaderColorPicker" value="${adjustColorBrightness(mainColor, 20)}">`;
        document.getElementById('tableHeaderColorPicker').value = adjustColorBrightness(mainColor, 20);

    });

    document.querySelector('.close-btn').addEventListener('click', () => {
        document.getElementById('settingsPanel').style.display = 'none';
    });
})


// 動態應用樣式
function applyDynamicStyles() {
    let settingsPanel = document.querySelector('.settings-panel');

    settingsPanel.style.borderLeftColor  = document.getElementById('mainColorPicker').value;
    settingsPanel.style.color = document.getElementById('fontColorPicker').value;
    settingsPanel.style.fontSize = document.getElementById('fontSizeInput').value + 'px';
    //settingsPanel.stle.backgroundColor = document.getElementById('subColorPicker').value;

    document.querySelectorAll('.update_setting_btn, .copy-btn').forEach((btn) => {
        btn.style.backgroundColor =  document.getElementById('mainColorPicker').value;
        btn.style.borderColor =  document.getElementById('mainColorPicker').value;
    });
    document.querySelectorAll('.switch input:checked + .slider').forEach((inp) => {
        inp.style.backgroundColor =  document.getElementById('mainColorPicker').value;
        inp.style.borderColor =  document.getElementById('mainColorPicker').value;
    });
    document.querySelectorAll('.settings-section h3,.settings-header h2').forEach((inp) => {
        inp.style.color =  document.getElementById('mainColorPicker').value;
    });





}

// 顯示即時反饋 (例如彈窗)
function showFeedbackPopup(message) {
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.bottom = '20px';
    popup.style.right = '20px';
    popup.style.backgroundColor = mainColor;
    popup.style.color = '#fff';
    popup.style.padding = '10px 20px';
    popup.style.borderRadius = '5px';
    popup.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    popup.style.fontFamily = 'Arial, sans-serif';
    popup.style.zIndex = 10000;
    popup.textContent = message;

    document.body.appendChild(popup);

    // 自動移除彈窗
    setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transition = 'opacity 0.5s';
        setTimeout(() => popup.remove(), 500);
    }, 2000);
}




