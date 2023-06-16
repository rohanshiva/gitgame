def fizzbuzz_bad():
    print("1")
    print("2")
    print("Fizz")
    print("4")
    print("Buzz")
    print("Fizz")
    print("7")
    print("8")
    print("Fizz")
    print("Buzz")
    print("10")
    print("11")
    print("Fizz")
    print("13")
    print("14")
    print("FizzBuzz")


def fizzbuzz_good():
    for i in range(1, 16):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 5 == 0:
            print("Buzz")
        elif i % 3 == 0: 
            print("Fizz")
        else:
            print(i)