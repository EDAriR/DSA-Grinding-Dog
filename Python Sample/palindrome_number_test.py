import unittest

from palindrome_number import Solution

class TestSolution(unittest.TestCase):
    def test_solution(self):
        sol = Solution()
        self.assertEqual(sol.isPalindrome(121), True)
        self.assertEqual(sol.isPalindrome(-1), False)

if __name__ == '__main__':
    unittest.main()