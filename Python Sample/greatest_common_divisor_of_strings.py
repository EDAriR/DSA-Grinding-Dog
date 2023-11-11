import math

class Solution:
    def gcdOfStrings(self, str1: str, str2: str) -> str:

        if (str1+str2) != (str2+str1):
            return ""

        l1 = len(str1)
        l2 = len(str2)

        if l1 == l2 and str1 == str2:
            return str1
        else:
            gcd = math.gcd(l1, l2)
            print(f"gcd:{gcd}")
            return str2[0:gcd]