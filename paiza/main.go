package main

import "fmt"

func main() {
	var N int
	fmt.Scan(&N)
	stones := make([][]int, N)
	for i := 0; i < N; i++ {
		stones[i] = make([]int, N)
		for j := 0; j < N; j++ {
			fmt.Scan(&stones[i][j])
		}
	}

	fmt.Println(N)
	fmt.Println(stones)

}
