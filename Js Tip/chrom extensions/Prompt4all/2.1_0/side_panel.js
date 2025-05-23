console.log("side_panel.js loaded");

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get([ "currentData"], (data) => {
    const isDark = data.currentData?.isDark;


    // Dark Mode handling
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }


  });

  // Load prompts data
  chrome.runtime.sendMessage({ action: "loadPrompts" }, (response) => {
    if (response && response.success) {
      console.log("Loaded prompts data:", response.prompts);
      initializeUI(response.prompts);
    } else {
      console.error("Failed to load prompts:", response?.error || "Unknown error");
    }
  });
});

categoryItems={}
// 初始化界面
// function initializeUI(prompts) {
//   const categoriesDiv = document.getElementById('categories');
//   const templatesDiv = document.getElementById('templates');
//   const homeBtn = document.getElementById('homeButton');
//
//   categoriesDiv.innerHTML = '';
//   templatesDiv.innerHTML = '';
//
//
//   Object.entries(prompts).forEach(([category, items]) => {
//     if (!Array.isArray(items)) {
//       throw new Error(`Invalid format for category "${category}": Expected an array.`);
//     }
//
//     const categoryBtn = document.createElement('button');
//     categoryBtn.textContent = category;
//     categoryBtn.className = 'category-button orange-button';
//     categoriesDiv.appendChild(categoryBtn);
//
//     items.forEach(item => {
//       if (item.key) { // 確認必要屬性存在
//         const templateBtn = document.createElement('button');
//         let itemPrompt= String(item.value);
//         templateBtn.id=item.id
//         templateBtn.textContent = item.key;
//         templateBtn.className = 'template-button hidden';
//         templateBtn.addEventListener('click', async () => {
//           // 保存到剪貼簿
//           try {
//             await navigator.clipboard.writeText(itemPrompt);
//             console.log("Prompt copied to clipboard.");
//           } catch (err) {
//             console.error("Failed to copy prompt to clipboard:", err);
//           }
//           console.log(`Button clicked: ${item.key}, Prompt content:`, itemPrompt);
//
//           if (category === "GPTs捷徑") {
//             window.open(item.value, '_blank');
//           } else {
//             // 確保發送明確的訊息
//             chrome.runtime.sendMessage({
//               action: "relayPrompt",
//               prompt: itemPrompt
//             }, response => {
//               if (response && response.success) {
//                 console.log("Prompt successfully relayed!");
//               } else {
//                 console.error("Failed to relay prompt:", response?.error || "Unknown error");
//               }
//             });
//           }
//         });
//         templatesDiv.appendChild(templateBtn);
//
//       }
//     });
//     categoryBtn.addEventListener('click', () => {
//       // 隱藏所有分類按鈕
//       document.querySelectorAll('.category-button').forEach(btn => btn.classList.add('hidden'));
//
//       // 顯示該分類的模板按鈕
//       templatesDiv.childNodes.forEach(btn => {
//         if (items.some(item => String(item.id) === btn.id)){
//           btn.classList.remove('hidden');
//           } else {
//           btn.classList.add('hidden');
//         }
//       });
//
//       // 顯示返回主頁按鈕
//       // homeBtn.classList.remove('hidden');
//     });
//   });
//
//   // 返回主頁按鈕邏輯
//   homeBtn.onclick = () => {
//     document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('hidden'));
//     document.querySelectorAll('.template-button').forEach(btn => btn.classList.add('hidden'));
//     // homeBtn.classList.add('hidden');
//   };
// }

function initializeUI(prompts) {
  const categoriesDiv = document.getElementById('categories');
  const templatesDiv  = document.getElementById('templates');
  const homeBtn       = document.getElementById('homeButton');

  // 清空舊內容
  categoriesDiv.innerHTML = '';
  templatesDiv.innerHTML  = '';

  // 初始狀態：隱藏 templates 容器，只顯示分類列表
  templatesDiv.classList.add('hidden');
  // home 按鈕一開始也隱藏（如果你希望）
  // homeBtn.classList.add('hidden');

  // 依照 prompts 動態建立分類與模板按鈕
  Object.entries(prompts).forEach(([category, items]) => {
    // 分類按鈕
    const categoryBtn = document.createElement('button');
    categoryBtn.textContent = category;
    categoryBtn.className   = 'category-button orange-button';
    categoriesDiv.appendChild(categoryBtn);

    // 對每個 prompts item 建立 template-button
    items.forEach(item => {
      if (!item.key || !item.id) return;  // 確保必要屬性
      const templateBtn = document.createElement('button');
      templateBtn.id        = String(item.id);
      templateBtn.textContent = item.key;
      templateBtn.className   = 'template-button hidden';


      // 點擊後把 prompt 寫到剪貼簿或轉發

      templateBtn.addEventListener('click', async () => {
        const itemPrompt = String(item.value);
        try {
          await navigator.clipboard.writeText(itemPrompt);
          console.log("Prompt copied:", itemPrompt);
        } catch (err) {
          console.error("Copy failed:", err);
        }

        if (category === "GPTs捷徑") {
          window.open(item.value, '_blank');
        } else {
          // ✅ 這裡改用 active tab 執行插入
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab?.id) return;

            chrome.scripting.executeScript({
              target: {tabId: activeTab.id},
              files: ["content.js"]
            }, () => {
              chrome.tabs.sendMessage(activeTab.id, {
                action: "insertPrompt",
                prompt: itemPrompt
              }, (response) => {
                if (!response?.success) {
                  console.error("插入失敗:", response?.error);
                } else {
                  chrome.runtime.sendMessage({action: "closeSidePanel"});
                }
              });
            });
          });
        }
      });

      templatesDiv.appendChild(templateBtn);
    });

    // 點進分類：切換顯示邏輯
    categoryBtn.addEventListener('click', () => {
      // 隱藏整個分類容器，顯示模板容器
      categoriesDiv.classList.add('hidden');
      templatesDiv.classList.remove('hidden');
      // 逐一顯示屬於此分類的 template-button
      templatesDiv.childNodes.forEach(btn => {
        if (items.some(item => String(item.id) === btn.id)) {
          btn.classList.remove('hidden');
        } else {
          btn.classList.add('hidden');
        }
      });
      // 顯示 Home 按鈕（若先前隱藏）
      // homeBtn.classList.remove('hidden');
    });
  });

  // Home 按鈕：回到主選單
  homeBtn.addEventListener('click', () => {
    categoriesDiv.classList.remove('hidden');
    templatesDiv.classList.add('hidden');
    // 隱藏 Home 按鈕（如果需要）
    // homeBtn.classList.add('hidden');
  });
}
