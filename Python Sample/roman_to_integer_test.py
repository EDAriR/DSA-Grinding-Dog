import unittest

from roman_to_integer import Solution

class TestSolution(unittest.TestCase):
    def test_romanToInt(self):
        sol = Solution()
        self.assertEqual(sol.romanToInt("III"), 3)
        self.assertEqual(sol.romanToInt("IV"), 4)
        self.assertEqual(sol.romanToInt("IX"), 9)
        self.assertEqual(sol.romanToInt("LVIII"), 58)
        self.assertEqual(sol.romanToInt("MCMXCIV"), 1994)

if __name__ == '__main__':
    unittest.main()