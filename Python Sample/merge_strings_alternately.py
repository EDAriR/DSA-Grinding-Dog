class Solution:
    def mergeAlternately(self, word1: str, word2: str) -> str:
        l1 = len(word1)
        l2 = len(word2)
        r = l1

        result = ''
        last_w = ''

        if l2 < l1 :
            r = l2
            last_w = word1[l2:l1]
            print(f'l2 < l1 => last_w:{last_w}')
        else:
            last_w = word2[l1:l2]
            print(f'else => last_w:{last_w}')

        for i in range(0,r):
            result = result + word1[i] + word2[i]

        return result + last_w