from pymouse import PyMouse
import random 
import time 
import pyautogui
import ctypes

# 設定安全邊界（避免移動到螢幕邊緣）
MARGIN = 10

# Windows API 常數
ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002

def prevent_screen_saver():
    """防止螢幕保護與系統睡眠"""
    ctypes.windll.kernel32.SetThreadExecutionState(
        ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
    )

def restore_screen_saver():
    """恢復螢幕保護與系統睡眠設定"""
    ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS)

m = PyMouse()
a = m.position() # 偵測滑鼠位置
s = pyautogui.size() # 獲得螢幕長寬
print(f"螢幕解析度: {s}")

try:
    # 啟動防止螢幕保護
    prevent_screen_saver()
    print("已停用螢幕保護與系統睡眠")

    while 1:
        time.sleep(1) # 1秒移動一次
        a = m.position()
        # 在螢幕邊界內隨機移動
        x = random.randint(MARGIN, s[0] - MARGIN)
        y = random.randint(MARGIN, s[1] - MARGIN)
        pyautogui.moveTo(x, y, duration=2, tween=pyautogui.easeInOutQuad)
        print(f"當前位置: {a}")

except KeyboardInterrupt:
    print('停止程式運行')
finally:
    # 恢復螢幕保護設定
    restore_screen_saver()
    print("已恢復螢幕保護與系統睡眠設定")


