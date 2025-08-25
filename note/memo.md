https://www.tomshardware.com/maker-stem/engineer-creates-ad-block-for-the-real-world-with-augmented-reality-glasses-no-more-products-or-branding-in-your-everyday-life
一個比利時工程師寫了一個程式，讓 AR 眼鏡實時識別路邊廣告。
一旦發現廣告區域，就在其上覆蓋一個紅色遮蓋層，相當於視覺遮蔽廣告。

https://2ality.com/2025/06/ecmascript-2025.html
JS 語法標準釋出了2025版，本文羅列了今年的7個新增語法。

https://jsdev.space/tts-sentence-reader/
本文是一篇 JS 教程，教你用瀏覽器的 API，透過內建的 TTS 語音引擎，寫一個句子朗讀器。

https://simonwillison.net/2025/Jun/26/sandboxes/
最近，Cloudflare 和 Vercel 這兩家公司，不約而同推出了沙盒功能，執行不受信任的 JS 程式碼，主要用例是執行大模型生成的程式碼。

https://github.com/microsoft/vscode-copilot-chat
微軟開源了 VS Code 的 GitHub Copilot Chat 外掛，用來跟 AI 對話。據說，GitHub Copilot 本體（主要完成程式碼補全和生成）很快也會開源。

https://github.com/InkSha/rust-tutorial
一個針對新手的 Rust 快速教程，從零開始寫一個管理 Todos 的命令列程式。

https://planetscale.com/blog/btrees-and-database-indexes
這篇教程透過很多互動示例，講解資料庫常用的 B 樹資料結構。

https://news.ycombinator.com/item?id=44442771
我感覺，如果美國取消晶片出口管制，中國政府就會實施晶片的進口管制，以保護國內晶片產業，打造一個真正能與英偉達/臺積電/蘋果/谷歌抗衡的晶片製造商。



Supabase MCP can leak your entire SQL database #
https://www.generalanalysis.com/blog/supabase-mcp-blog

這篇文章討論了 Model Context Protocol（MCP）在與外部工具互動時可能引發的安全問題，特別是針對 Supabase 的 MCP 整合。文章透過一個示例展示了攻擊者如何利用 Supabase 的 MCP 整合洩露開發者的私有 SQL 表資料。
問題概述： 大型語言模型（LLMs）通常根據預定義的指令處理資料。系統提示、使用者指令和資料上下文都作為文字提供給 LLM。核心問題是 LLM 無法區分指令和資料的界限。如果使用者提供的“資料”看起來像是指令，模型可能會將其作為指令處理。

https://news.ycombinator.com/item?id=44502318

儘管採取了措施，但提示注入仍然是一個未解決的問題，任何包含私有資料的資料庫或資訊源都存在風險
有人質疑將 MCP 作為安全邊界的合理性，認為應該有分離的 LLM 上下文來處理不同的任務
有人擔心“勸阻”計算機不執行某些操作的安全性，認為程式設計應該是明確的
有人提到，儘管人類在沒有模糊性的情況下也難以確保程式的安全，但現在的情況更加複雜
有人批評當前的安全實踐，認為 MCPs 繞過了現有的安全屏障，增加了風險

---

Breaking Git with a carriage return and cloning RCE #
https://dgl.cx/2025/07/git-clone-submodule-cve-2025-48384

這篇文章討論了一個關於 Git 的嚴重安全漏洞 CVE-2025-48384，該漏洞允許攻擊者在 Unix-like 平臺上透過使用 git clone --recursive 命令克隆不受信任的倉庫來實現遠端程式碼執行（RCE）。文章建議使用者更新到修復了該漏洞的 Git 版本，以及其他嵌入 Git 的軟體（包括 GitHub Desktop）。
文章首先介紹了機械打字機時代的遺留問題——回車（Carriage Return，CR）和換行（Line Feed，LF）。Unix 系統透過僅使用 LF 來分隔行來簡化這個問題，而 Windows 和一些網際網路協議則使用 CR+LF。Git 使用簡單的.ini 風格的配置格式，這種格式不僅用於使用者的配置檔案，還用於.gitmodules 檔案，該檔案跟蹤子模組。
文章解釋了 Git 如何處理配置檔案中的 DOS 行尾，以及如何讀寫配置檔案。關鍵的問題在於，當配置檔案中的值被寫回時，如果值包含特定的字元（如空格、分號或井號），Git 會將其用雙引號包圍。但是，如果值以 CR 結尾，Git 在讀取時會將其剝離，這可能導致安全問題。

https://news.ycombinator.com/item?id=44502330

透過修改 Git 配置值中的回車符（CR），可以導致 Git 將檔案錯誤地寫入.git 目錄而非子模組的工作目錄，從而允許攻擊者透過子模組的 post-checkout 鉤子執行任意程式碼。
攻擊者需要在目標系統的.git/hooks 目錄下寫入 shell 指令碼才能執行遠端程式碼。

---
Astro is a return to the fundamentals of the web #
https://websmith.studio/blog/astro-is-a-developers-dream/

Astro 框架以靜態 HTML 為核心，僅在需要互動時載入 JavaScript，採用“島嶼架構”最佳化效能，適合內容驅動型網站，但不適合複雜 SPA。

Astro 網站速度快，比傳統 React 框架快 40% 的載入時間。但重要的是，這不僅僅是為了給其他開發者留下深刻印象。這些效能提升直接轉化為更好的搜尋排名、更快樂的使用者，以及更多的轉化。在慢速裝置或不穩定的移動連線上，差異更加明顯。

https://news.ycombinator.com/item?id=44507854

Astro 將網頁預設為靜態 HTML，只有需要互動的部分才會使用 JavaScript，這與過去的“漸進增強”或“網頁”類似，現在被稱為 JavaScript 島嶼
Astro 的主要價值在於它與 JS 框架整合，允許框架處理 HTML 的子樹，將初始狀態渲染為字串，並在客戶端用伺服器預載入的資料進行水合
Astro 並不是漸進增強，因為載入前的 HTML 不需要工作，它只是匹配 JS 水合後的初始狀態
Astro 聽起來並不特別具有變革性，因為它依賴於 JavaScript 來接管表單等元素
Astro 的價值在於首先傳送非功能性 HTML，然後透過後來執行的 JS 修復，這與全 JS 相比，可能會簡化框架
Astro 的優勢在於編寫元件只需一次，伺服器-客戶端傳遞對開發者透明，這是傳統框架所不具備的
Astro 提供了透明的伺服器-客戶端上下文切換，以及使用者感知到的更好效能
Astro 的優雅之處在於它以更現代的方式實現了過去的理念，儘管概念本身並不新
Astro 找到了一個很好的平衡點，將伺服器和客戶端程式碼放在一個程式碼庫中，能夠定義哪些是伺服器端程式碼，哪些是客戶端程式碼，而不是全部依賴 SPA 架構
---

RapidRAW: A non-destructive and GPU-accelerated RAW image editor #
https://github.com/CyberTimon/RapidRAW

RapidRAW 是一款非破壞性且 GPU 加速的 RAW 影象編輯器，由 18 歲開發者建立，目標是成為 Adobe Lightroom 的現代替代品。
https://news.ycombinator.com/item?id=44505876

RawTherapee 是一個由色彩科學極客開發的 RAW 影象處理工具，具有 CLI 指令碼功能，其配套的 RawPedia 提供了豐富的資訊資源。
RawTherapee 缺乏 HDR 輸出支援，但未來可能會透過 PNG v3 和 Rec. 2100 支援來實現。
RawTherapee 的曲線調整工具操作困難，難以進行精確調整，使用者體驗不佳。
Darktable 的“電影”模擬功能能夠恢復過曝的 RAW 影象，而 RawTherapee 沒有類似的工具。
RawTherapee 的使用者介面不夠直觀，對於非技術使用者來說難以上手。
Lightroom 的去噪功能優於 RawTherapee，使用者體驗更流暢。


https://github.com/coder/code-server
VS Code 的一個伺服器版本，讓使用者透過瀏覽器使用這個程式碼編輯器，不需要本地安裝，參考介紹文章。

https://pksunkara.com/thoughts/git-experts-should-try-jujutsu/
Jujutsu 是 Git 的一個前端，底層相容 Git 程式碼庫，但是大大簡化了前端操作。本文比較了三種操作，都是 Jujutsu 簡單得多。

https://www.xda-developers.com/apple-container-turned-my-mac-into-a-self-hosting-war-machine/
在 Mac 電腦使用 Docker 容器，效能開銷很大，好在蘋果推出了自家的原生工具 Apple Container 取代 Docker。
本文是作者的使用感受，發現它目前只適合簡單場景。

https://antonz.org/is-online/
透過向某些特定網址傳送 HTTP 請求（比如google.com/generate_204），根據它們的回覆，判斷當前是否線上。

https://github.com/ranuts/document
這個專案把 OnlyOffice 轉成了 WASM 檔案，不需要伺服器，瀏覽器純前端就能檢視/編輯 Word、Excel、PowerPoint 文件，線上試用。
https://ranuts.github.io/document/

https://img.ops-coffee.cn/zh/
免費的線上工具，多張圖片拼成一張大圖。（@ops-coffee 投稿）

https://github.com/sst/opencode
一個 AI 終端客戶端，可以在命令列向大模型發出指令，操作檔案等，類似於 Claude Code，但是開源且不限定大模型種類。

https://github.com/kstonekuan/simple-chromium-ai
Chrome 瀏覽器從138版後，內建了 Gemini Nano 模型，並提供 AI Prompt API 以便呼叫。
這個庫就是瀏覽器 AI Prompt API 的封裝，用起來更方便。

https://github.com/eat-pray-ai/yutu
YouTube 的非官方 MCP 伺服器，AI 智慧體接入後，就能用自然語言操作 YouTube

https://n8nworkflow.net/zh
n8n 是一個工作流自動化編排軟體，這個網站收集已經編排好的 n8n 工作流，目前共有近2000個。

https://www.iamsajid.com/colors/
這個網站提出，頁面設計只需要4種顏色：前景色、背景色、強調色和趣味色。你可以在該網站生成這四種顏色的調色盤。

What the Fuck Python #
https://colab.research.google.com/github/satwikkansal/wtfpython/blob/master/irrelevant/wtf.ipynb

這個網頁是一個關於 Python 程式語言的探索性專案，旨在解釋一些看似違反直覺的 Python 程式碼片段和不太為人所知的特性。專案透過展示和解釋這些程式碼片段，幫助讀者更深入地理解 Python 的內部工作原理。
網頁首先介紹了 Python 作為一種高階、解釋型的程式語言，為程式設計師提供了許多便利的特性。但有時，Python 程式碼片段的結果可能並不那麼顯而易見。這個專案就是為了解釋這些看似奇怪但實際上揭示了 Python 有趣部分的程式碼片段。
網頁的結構是這樣的：每個例子都有一個吸引人的標題，然後是程式碼的設定部分，接著是輸出結果，最後是解釋部分。輸出結果展示了程式碼執行後的實際輸出，而解釋部分則簡明扼要地說明了為什麼會發生這樣的輸出。

https://developer.chrome.com/blog/if-article?hl=zh-cn
Chrome 瀏覽器的137版本，開始支援 CSS 的條件語句—— if() 函式。CSS 越來越像程式語言了。

https://github.com/o8oo8o/WebCurl
網頁版 API 除錯工具，Postman 的簡易替代品，前端只有一個 HTML 檔案。

https://gpfault.net/posts/asm-tut-0.txt.html
面向初學者的組合語言教程，從記憶體和暫存器講起，標題連結是第一講，後面還有第二、三、四講。


IP 地址池 Netnut
https://netnut.cn/
它有全球195個國家/地區的 IP 地址，分成四大類，供使用者選擇：

動態住宅 IP
靜態住宅 IP
手機 IP
資料機房 IP
其中，單單住宅的動態 IP 地址，就有8500萬個。按照官網介紹，這些地址穩定快速，不被遮蔽，而且便宜。

https://thomascountz.com/2025/07/17/chromes-ssl-bypass-cheatcode
Chrome 瀏覽器遇到網站證書錯誤，會顯示一個報錯頁面
誰能想到，它居然有後門，只要輸入口令thisisunsafe，就能跳過這個頁面。


https://www.chipstrat.com/p/gpu-networking-basics-part-1
AI 大模型需要成千上萬的 GPU 連在一起，本文告訴你，這在技術上多麼不容易。

https://css-tricks.com/revisiting-css-border-image/
本文詳細介紹 CSS 的 border-image 屬性，如何為邊框設定背景圖案。

https://www.xda-developers.com/powerful-tools-should-use-instead-task-manager/
Windows 程序如何管理？系統內建的工作管理員並不好用，本文介紹四種替代工具。

https://measured.co/blog/tailwind-trade-offs
本文詳細分析了目前最流行的 CSS 框架 Tailwind CSS，它的長處並非沒有代價。

https://github.com/RustScan/RustScan
一個命令列工具，用來掃描發現某臺伺服器開放了哪些埠。

https://tsx.is/
直接執行 TypeScript 程式碼的命令列工具，類似於 ts-node。


https://kashw1n.com/blog/nodejs-2025/
Node.js 已經發生了巨大的變化，本文介紹現在應該採用的新寫法。

https://rgbcu.be/blog/gitignore/
.gitignore 預設是黑名單，會把指定檔案排除出 Git 提交。本文教你把它改成白名單，只有提到的檔案才能提交。


https://www.xda-developers.com/replace-default-linux-commands-alternatives/
Linux 的很多基本命令（cd、cat、ls、du、df 等）現在都有更好的替代品。

https://github.com/miroslavpejic85/mirotalksfu
基於瀏覽器 WebRTC 的線上影片通訊開源解決方案
點對點通訊版本
https://github.com/miroslavpejic85/mirotalk
一對一通訊版本
https://github.com/miroslavpejic85/mirotalkc2c

https://github.com/fastrepl/hyprnote
本地的 AI 會議助手，監聽線上會議，自動生成會議筆記和總結。

https://github.com/KittenML/KittenTTS
一個 25MB 大小的 AI 語音模型，用來從文字生成語音。只使用個人電腦 CPU，幾分鐘就安裝完畢，透過 Python 指令碼使用，好像不支援中文，參見教程。
https://algogist.com/kitten-tts-the-25mb-ai-voice-model-thats-about-to-change-everything-runs-on-a-potato/


https://github.com/shanleiguang/vRain
製作中文古籍直排刻本的工具，使用 Perl 語言編寫

https://github.com/baerwang/openapi-rs
一個 Rust 的 OpenAPI 庫，可以解析 API 的規格檔案，並進行資料驗證

https://github.com/KrishKrosh/TrackWeight
把 MacBook 觸控板變成電子秤，使用時手指必須與觸控板保持接觸

https://github.com/hvhghv/se-script
作者寫的一些 Bash 指令碼，用於 Linux 系統管理

https://duiduixia.com/
一個 AI 文字玩具網站，只需輸入對方說的話，AI 自動生成優雅還擊的句子。

https://github.com/cursor-project/prompt-manager
VS Code/Cursor 的開源外掛，統一管理 AI 提示詞，支援分類、搜尋、匯入匯出。
另有一個開源應用 Prompt Shelf，透過 Web 介面，對提示詞進行版本管理，可以比對差異和回滾。（@newdee 投稿）
https://github.com/newdee/prompt-shelf


https://github.com/law-chain-hot/websocket-devtools
Chrome 開源外掛，專門用於 WebSocket 除錯，提供監控、攔截、模擬、收藏等功能。

https://github.com/WCY-dt/ponghub
一個開源的服務監控平臺，透過 GitHub Actions 去監控服務是否正常線上。

https://github.com/itMrBoy/resumePolice
AI 開發平臺 Dify 的外掛，讓 AI 修改簡歷，具體的修改點可以參考它的提示詞。
https://github.com/itMrBoy/resumePolice/blob/main/prompt/resume_police_Zh.md

https://github.com/justlovemaki/AIClient-2-API
這個工具將 Google Gemini CLI 和 Kiro 客戶端封裝為本地 API 服務，提供 OpenAI 相容介面，方便呼叫。

https://langshift.dev/
透過比較不同的計算機語言，學習新語言，原始碼開源。
https://github.com/erweixin/langshift.dev

https://www.futilitycloset.com/2024/12/15/tidy-2/
代數公式的圖形化證明

