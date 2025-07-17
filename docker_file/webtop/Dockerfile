# 使用 NVIDIA CUDA 12.8.1 開發版作為基底，確保 CUDA 環境版本與主機一致
FROM nvidia/cuda:12.8.1-cudnn-devel-ubuntu22.04

# 避免APT安裝過程中出現互動式介面
ARG DEBIAN_FRONTEND=noninteractive
# 指定Python版本（Ubuntu22.04預設支援Python3.10）
ENV PYTHON_VERSION=3.10

# --- 系統環境與應用安裝 ---
# 安裝 Xfce 桌面、瀏覽器、VNC/NoVNC、VSCode、CUDA必要支援等
RUN apt-get update && apt-get install -y \
    # Xfce桌面及常用套件
    xfce4 xfce4-goodies xorg dbus-x11 x11-xserver-utils \
    # TigerVNC 伺服器、noVNC以及相關工具
    tigervnc-standalone-server novnc python3-websockify python3-numpy \
    # 終端機模擬器
    xfce4-terminal gnome-terminal \
    # 剪貼簿工具
    xclip xsel \
    # 實用工具
    sudo curl wget gnupg apt-transport-https openssl \
    # 瀏覽器：安裝Google Chrome（透過官方deb）和Brave Browser（透過官方APT來源）
    && wget -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get install -y /tmp/chrome.deb \
    && rm /tmp/chrome.deb \
    && curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg arch=amd64] https://brave-browser-apt-release.s3.brave.com/ stable main" \
       > /etc/apt/sources.list.d/brave.list \
    && apt-get update && apt-get install -y brave-browser \
    # 安裝 Visual Studio Code（直接下載Deb安裝）
    && curl -L -o /tmp/code.deb https://go.microsoft.com/fwlink/?LinkID=760868 \
    && apt-get install -y /tmp/code.deb \
    && rm /tmp/code.deb \
    # 安裝額外的字體和圖形庫支援 VSCode
    && apt-get install -y fonts-liberation fonts-dejavu-core fonts-noto-cjk \
    # 安裝圖示字體和主題
    && apt-get install -y fonts-font-awesome fonts-material-design-icons-iconfont \
    # 安裝 GTK 圖示主題
    && apt-get install -y adwaita-icon-theme gnome-icon-theme hicolor-icon-theme \
    # 安裝 Web 字體支援
    && apt-get install -y fontconfig fonts-noto-color-emoji fonts-symbola \
    # 安裝 VSCode 所需的依賴
    && apt-get install -y libasound2-dev libdrm2 libxkbfile1 libxss1 libgconf-2-4 \
    # 安裝 Git（VSCode 需要）
    && apt-get install -y git \
    # 安裝Python 3以及pip（CUDA基底映像未預裝）
    && apt-get install -y python3 python3-pip \
    # 安裝 Mesa GLX（提供OpenGL圖形介面所需的庫，供瀏覽器等應用使用）
    && apt-get install -y libgl1-mesa-glx libgl1-mesa-dri \
    # 清理APT暫存
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# --- 建立非root使用者並設定權限 ---
# 建立一個普通使用者 (abc)，UID和GID使用建置參數（預設1000），並加入sudo組。
ARG PUID=1000
ARG PGID=1000
RUN echo "建立使用者 abc (UID=${PUID}, GID=${PGID})..." && \
    groupadd -g "${PGID}" abc && useradd -u "${PUID}" -g "${PGID}" -m -s /bin/bash abc && \
    usermod -aG sudo abc && \
    # 為sudo指令啟用密碼驗證（確保/etc/sudoers中sudo群組需要密碼）
    sed -i 's/%sudo\tALL=(ALL:ALL) NOPASSWD: ALL/%sudo\tALL=(ALL:ALL) ALL/' /etc/sudoers

# --- 安全強化: 設定使用者密碼及VNC密鑰 ---
RUN echo "設定 abc 使用者的密碼為 123456..." && \
    # 設定密碼為 123456（開發環境用）
    echo 'abc:123456' | chpasswd && \
    echo "產生自簽署SSL憑證供noVNC使用..." && \
    openssl req -x509 -nodes -newkey rsa:3072 -keyout /home/abc/novnc.pem -out /home/abc/novnc.pem -days 3650 -subj "/CN=localhost" && \
    chown abc:abc /home/abc/novnc.pem

# 建立與掛載目錄對應的資料夾（下載/圖片），並賦予abc使用者權限
RUN mkdir -p /download /picture && chown abc:abc /download /picture

# --- 配置 VNC 的啟動腳本 ---
USER abc
# 設定環境變數
ENV DISPLAY=:1
ENV ELECTRON_DISABLE_SECURITY_WARNINGS=true
ENV ELECTRON_ENABLE_LOGGING=true
RUN mkdir -p /home/abc/.vnc && echo -e "#!/bin/sh\nunset SESSION_MANAGER\nunset DBUS_SESSION_BUS_ADDRESS\n# 設定環境變數\nexport DISPLAY=:1\nexport ELECTRON_DISABLE_SECURITY_WARNINGS=true\n# 啟動 XFCE 桌面環境\nstartxfce4 &\n# 等待桌面啟動\nsleep 3\n# 確保面板正常啟動\nDISPLAY=:1 xfce4-panel &\n# 保持腳本運行\nwait" > /home/abc/.vnc/xstartup && \
    chmod +x /home/abc/.vnc/xstartup

# 建立 XFCE 自動啟動目錄和應用程式
RUN mkdir -p /home/abc/.config/autostart && \
    echo -e "[Desktop Entry]\nType=Application\nName=Panel Restart\nExec=/bin/bash -c 'sleep 5 && DISPLAY=:1 xfce4-panel'\nHidden=false\nX-GNOME-Autostart-enabled=true" > /home/abc/.config/autostart/panel-restart.desktop

# 建立桌面快捷方式（可執行）
RUN mkdir -p /home/abc/Desktop && \
    echo -e "[Desktop Entry]\nVersion=1.0\nType=Application\nName=Visual Studio Code\nComment=Code Editor\nExec=code --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-software-rasterizer\nIcon=code\nTerminal=false\nStartupNotify=true\nCategories=Development;\nStartupWMClass=Code" > /home/abc/Desktop/VSCode.desktop && \
    echo -e "[Desktop Entry]\nVersion=1.0\nType=Application\nName=Brave Browser\nComment=Web Browser\nExec=brave-browser --no-sandbox --disable-dev-shm-usage\nIcon=brave-browser\nTerminal=false\nStartupNotify=true\nCategories=Network;\nStartupWMClass=Brave" > /home/abc/Desktop/Brave.desktop && \
    echo -e "[Desktop Entry]\nVersion=1.0\nType=Application\nName=Google Chrome\nComment=Web Browser\nExec=google-chrome --no-sandbox --disable-dev-shm-usage\nIcon=google-chrome\nTerminal=false\nStartupNotify=true\nCategories=Network;\nStartupWMClass=Google-chrome" > /home/abc/Desktop/Chrome.desktop && \
    echo -e "[Desktop Entry]\nVersion=1.0\nType=Application\nName=Terminal\nComment=Terminal Emulator\nExec=gnome-terminal\nIcon=utilities-terminal\nTerminal=false\nStartupNotify=true\nCategories=System;\nStartupWMClass=Gnome-terminal" > /home/abc/Desktop/Terminal.desktop && \
    echo -e "[Desktop Entry]\nVersion=1.0\nType=Application\nName=XFCE Terminal\nComment=XFCE Terminal Emulator\nExec=xfce4-terminal\nIcon=utilities-terminal\nTerminal=false\nStartupNotify=true\nCategories=System;\nStartupWMClass=Xfce4-terminal" > /home/abc/Desktop/XfceTerminal.desktop && \
    echo -e "[Desktop Entry]\nVersion=1.0\nType=Application\nName=File Manager\nComment=File Manager\nExec=thunar\nIcon=file-manager\nTerminal=false\nStartupNotify=true\nCategories=System;\nStartupWMClass=Thunar" > /home/abc/Desktop/FileManager.desktop && \
    chmod +x /home/abc/Desktop/*.desktop

# 建立面板重新啟動腳本
RUN echo -e "#!/bin/bash\nkillall xfce4-panel 2>/dev/null\nsleep 1\nDISPLAY=:1 xfce4-panel &" > /home/abc/restart-panel.sh && \
    chmod +x /home/abc/restart-panel.sh

# 設定 XFCE 預設設定
RUN mkdir -p /home/abc/.config/xfce4/xfconf/xfce-perchannel-xml && \
    echo -e '<?xml version="1.0" encoding="UTF-8"?>\n<channel name="xfce4-panel" version="1.0">\n  <property name="configver" type="int" value="2"/>\n  <property name="panels" type="array">\n    <value type="int" value="1"/>\n    <property name="panel-1" type="empty">\n      <property name="position" type="string" value="p=6;x=0;y=0"/>\n      <property name="length" type="uint" value="100"/>\n      <property name="position-locked" type="bool" value="true"/>\n      <property name="size" type="uint" value="24"/>\n      <property name="plugin-ids" type="array">\n        <value type="int" value="1"/>\n        <value type="int" value="2"/>\n        <value type="int" value="3"/>\n        <value type="int" value="4"/>\n        <value type="int" value="5"/>\n      </property>\n    </property>\n  </property>\n  <property name="plugins" type="empty">\n    <property name="plugin-1" type="string" value="applicationsmenu"/>\n    <property name="plugin-2" type="string" value="tasklist"/>\n    <property name="plugin-3" type="string" value="separator"/>\n    <property name="plugin-4" type="string" value="systray"/>\n    <property name="plugin-5" type="string" value="clock"/>\n  </property>\n</channel>' > /home/abc/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml

# --- 建立 VSCode 設定檔案 ---
RUN mkdir -p /home/abc/.config/Code/User && \
    echo -e '{\n  "extensions.autoCheckUpdates": false,\n  "extensions.autoUpdate": false,\n  "telemetry.telemetryLevel": "off",\n  "update.mode": "none",\n  "security.workspace.trust.enabled": false,\n  "workbench.startupEditor": "welcomePage",\n  "git.enableSmartCommit": true,\n  "git.confirmSync": false,\n  "terminal.integrated.defaultProfile.linux": "bash"\n}' > /home/abc/.config/Code/User/settings.json

# --- 更新字體快取 ---
RUN fc-cache -fv

# --- 設定字體配置以改善圖示顯示 ---
RUN mkdir -p /home/abc/.config/fontconfig && \
    echo -e '<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n  <alias>\n    <family>sans-serif</family>\n    <prefer>\n      <family>Noto Sans</family>\n      <family>Noto Color Emoji</family>\n      <family>Font Awesome 5 Free</family>\n    </prefer>\n  </alias>\n  <alias>\n    <family>monospace</family>\n    <prefer>\n      <family>Noto Sans Mono</family>\n      <family>Noto Color Emoji</family>\n    </prefer>\n  </alias>\n</fontconfig>' > /home/abc/.config/fontconfig/fonts.conf

# --- 啟動容器時執行 VNC 伺服器與 noVNC ---
# 使用 supervisord/s6 等管理多進程是更正規的方法，但此處用簡單方法在前景啟動websockify。
USER abc
CMD bash -c "vncserver :1 -depth 24 -SecurityTypes None & websockify --web=/usr/share/novnc/ --cert=/home/abc/novnc.pem 3001 localhost:5901 -- /?resize=scale&clipboard=1"
