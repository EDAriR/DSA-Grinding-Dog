EYE = "\U0001F9FF"          # 🧿
VS_TEXT = "\uFE0E"          # 文字樣式 → bit 0
VS_EMOJI = "\uFE0F"         # 彩圖樣式 → bit 1

def text_to_eye(text: str) -> str:
    """將一般文字編碼成『🧿︎/🧿️』序列。"""
    result = []
    for ch in text.encode("ascii", "ignore"):     # 去除非 ASCII 字元
        bits = f"{ch:08b}"                        # 8 bit 二進位字串
        for bit in bits:
            result.append(EYE + (VS_TEXT if bit == "0" else VS_EMOJI))
    return "".join(result)

def eye_to_text(eye: str) -> str:
    """將『🧿︎/🧿️』序列還原成文字。"""
    bits = []
    for i in range(0, len(eye), 2):               # 每 2 code unit = 🧿 + VS
        vs = eye[i + 1]
        bits.append("0" if vs == VS_TEXT else "1")
    bytes_out = [int("".join(bits[i:i + 8]), 2)   # 每 8 bit 一個位元組
                 for i in range(0, len(bits), 8)]
    return bytes(bytearray(bytes_out)).decode("ascii", "ignore")

# 小測試
if __name__ == "__main__":
    msg = "pwd && ls && cat /etc/shadow"
    encoded = text_to_eye(msg)
    decoded = eye_to_text(encoded)
    print(f"原文 : {msg}")
    print(f"編碼 : {encoded}")
    print(f"還原 : {decoded}")
