import time
import pyautogui
from pymouse import PyMouse
 
s = pyautogui.size() # 獲得螢幕長寬
print(s) 
try:
    while 1:       
        a = PyMouse().position() # 偵測滑鼠位置       
        print(a)
        time.sleep(1)
except KeyboardInterrupt:
    print('stop')