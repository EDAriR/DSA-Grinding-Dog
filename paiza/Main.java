import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int N = sc.nextInt();
        int[][] stones = new int[N][N];
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                stones[i][j] = sc.nextInt();
            }
        }
        
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                stones[i][j] = sc.nextInt();
                System.out.print(stones[i][j]);
            }
            System.out.println(" ");
        }
    }
}
