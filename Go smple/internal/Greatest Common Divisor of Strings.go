package internal

func gcdOfStrings(str1 string, str2 string) string {

    l1 := len(str1)
    l2 := len(str2)

    if (str1 + str2) != (str2 + str1){

        return ""
    } else {
       
        if l1 == l2 && str1 == str2 {
            return str1
        } else {
            
            gcd := gcd(l1, l2)
            fmt.Println(gcd)
            return str2[:gcd]
        }
        return ""
    }
    
}

func gcd(a,b int) int {
	if b == 0 {
		return a
	}
	return gcd(b, a % b)
}