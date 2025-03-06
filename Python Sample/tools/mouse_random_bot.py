from pymouse import PyMouse
import random 
import time 
import pyautogui

m = PyMouse()
a = m.position() # 偵測滑鼠位置
s = pyautogui.size() # 獲得螢幕長寬
print(s)

try:
    while 1:
        time.sleep(1) # 1秒移動一次
        a = m.position()
        pyautogui.moveTo(random.randint(1, s[0]),random.randint(1, s[1]),duration=2,tween=pyautogui.easeInOutQuad) # 隨機移動到屏幕長寬內的位置
        print(a)
except KeyboardInterrupt:
    print('stop')


