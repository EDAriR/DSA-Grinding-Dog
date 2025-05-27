DSA

根據以下步驟

1. 逐行中英對照解釋題目,最後列出難度B1以上難度單字
2. 總結題目條件
3. 用多角度生活例子舉2,3例這題目在生活中會有怎樣的應用
4. 根據例子說明解題方式及步驟
5. 對照例子與題目是否匹配為什麼 
6. 產出最基本直覺的程式碼解題(例如使用暴力解)
7. 第一次優化(使用特定基礎演算法優化)
8. 說明這題主要是考哪些演算法所以使用該演算法優化,並且考慮是否有其他種類解法
9. 考慮語言特性嘗試是否有其他優化手法(goroutine channel, python ansync...etc)，有的請分別使用並行/非並行版本並進行比較


最用使用以下格式開始解題最終的程式碼中不需要有註釋
```python
class Solution:
    def foo(self, s: str) -> str:
```
```go
func addMinimum(word string) int {
    
}
```

```rust
impl Solution {
    pub fn add_minimum(word: String) -> i32 {
        
    }
}
```

要得成果:
- 生活化例子需詳細，並說明與原題的關聯
- 產出python版本後根據python 使用演算法的版本
- 使用go, rust 產出各自語言特性風格的優化解法
- 各語言版本請力求簡短的方式例如使用lambda等api來簡化code

中英對照解釋範例
```

You are given an array of integers “height,” where each element represents the height of a vertical line on the x-axis (width of 1). 
給定一個陣列 height，其中每個元素代表一條直線在 x 軸上的高度，寬度為1。

Choose any two lines to form a container with the x-axis.
選擇兩條線與 x 軸形成的容器

The capacity of water is determined by “the minimum of the two heights” multiplied by “the distance between them.” Find the maximum amount of water a container can store.
容器能承載的水量取決於「兩者中較小的高度」×「兩線之間的寬度」。求最大載水量。

determined 決定
capacity 容量
represents 代表
```


以下為題目

