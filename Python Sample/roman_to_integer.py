class Solution:
    def romanToInt(self, s: str) -> int:
        dic = {
            "I":1,
            "V":5,
            "X":10,
            "L":50,
            "C":100,
            "D":500,
            "M":1000,
            # "IV":4,
            # "IX":9,
            # "XL":40,
            # "XC":90,
            # "CD":400,
            # "CM":900
        }

        result = 0

        s = s.replace("IV", "IIII")
        s = s.replace("IX", "VIIII")
        s = s.replace("XL", "XXXX")
        s = s.replace("XC", "LXXXX")
        s = s.replace("CD", "CCCC")
        s = s.replace("CM", "DCCCC")

        # print(f"s:{s}")

        for i in s:
            result += dic[i]

        # print(f"result:{result}")
        
        return result