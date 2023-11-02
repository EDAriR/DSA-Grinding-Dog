## enumerate

```Python
   def twoSum(self, nums: List[int], target: int) -> List[int]:
        keys = {}
        for idx, value in enumerate(nums):
            diff = target - value
            if diff in keys:
                return [keys[diff], idx]
            keys[value] = idx
```