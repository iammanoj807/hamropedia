---
title: "Python Decorators Explained for Beginners (with Examples)"
seoTitle: "Python Decorators Explained for Beginners (with Examples)"
description: "Learn Python decorators step by step: functions as objects, wrappers, the @ syntax, functools.wraps, arguments, and real uses like timing, logins and caching."
date: 2024-02-25
updated: 2026-11-01
category: coding
tags: [python, programming, beginners]
coverWord: "@decorator"
coverAlt: "Python decorators explained"
---

A **decorator** lets you change what a function does *without changing the function's code* and *without changing how it is called*. It sounds like magic the first time you see the `@` symbol, but it is built from two simple ideas you probably already know.

Every example on this page has been run, and the output shown is the real output. Copy any of them into a file and try them yourself.

## The problem decorators solve

Imagine you have a function that works and is already tested:

```python
def my_func():
    print("Hamropedia is an amazing website.")

my_func()
```

Output:

```text
Hamropedia is an amazing website.
```

Now you are asked to print an extra line *before* it runs. You could edit `my_func`, but in a real project that function might be used in fifty places, or be tested code you do not want to touch. You want two rules:

1. The code **inside** the original function must not change.
2. The way the function is **called** (`my_func()`) must not change.

Decorators give you exactly that.

## Idea 1: functions are objects

In Python, a function is an object like any other. Written without brackets, `my_func` is the function itself; written with brackets, `my_func()` *calls* it. That means you can pass a function to another function, and return one from a function.

## Idea 2: a function inside a function

Put those together and you get a **wrapper**: a function that takes a function, and returns a new function that does something extra and then calls the original.

```python
def my_wrapper(func):
    def inner():
        print("Read an amazing article.")
        func()
    return inner

def my_func():
    print("Hamropedia is an amazing website.")

my_func = my_wrapper(my_func)
my_func()
```

Output:

```text
Read an amazing article.
Hamropedia is an amazing website.
```

Here is what happens:

- `my_wrapper` receives the original function as `func`.
- It defines `inner`, which prints the extra line and then calls `func()`.
- It returns `inner` (without brackets, so it is returned, not called).
- `my_func = my_wrapper(my_func)` replaces the name `my_func` with the new, wrapped function.

Rule 1 is met: the code inside `my_func` never changed. But we had to add the line `my_func = my_wrapper(my_func)`, which is clumsy.

## The @ syntax

Python has a shortcut for that line. Writing `@my_wrapper` directly above the function definition does exactly the same thing:

```python
def my_wrapper(func):
    def inner():
        print("Read an amazing article.")
        func()
    return inner

@my_wrapper
def my_func():
    print("Hamropedia is an amazing website.")

my_func()
```

Output:

```text
Read an amazing article.
Hamropedia is an amazing website.
```

`@my_wrapper` above `def my_func` means: *after defining `my_func`, run `my_func = my_wrapper(my_func)`*. Both rules are now met. That is all a decorator is.

## Writing decorators properly: arguments and functools.wraps

The simple wrapper above breaks as soon as the decorated function takes arguments or returns a value. Real decorators use `*args` and `**kwargs` to pass everything through, `return` the result, and `functools.wraps` so the wrapped function keeps its original name and docstring:

```python
import functools

def my_wrapper(func):
    @functools.wraps(func)
    def inner(*args, **kwargs):
        print("Read an amazing article.")
        return func(*args, **kwargs)
    return inner

@my_wrapper
def greet(name, country="Nepal"):
    """Return a greeting."""
    return f"Namaste, {name} from {country}!"

print(greet("Sita"))
print(greet("Ram", country="the UK"))
print(greet.__name__, "-", greet.__doc__)
```

Output:

```text
Read an amazing article.
Namaste, Sita from Nepal!
Read an amazing article.
Namaste, Ram from the UK!
greet - Return a greeting.
```

Without `@functools.wraps(func)`, the last line would print `inner - None`, which makes debugging and documentation confusing. **Use this template for every decorator you write.**

## Three decorators you will actually use

### 1. Timing a function

```python
import functools
import time

def timer(func):
    """Print how long the decorated function takes to run."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f} seconds")
        return result
    return wrapper

@timer
def total_marks(marks):
    return sum(marks)

print(total_marks([78, 85, 91, 66]))
```

Output (the time will differ on your computer):

```text
total_marks took 0.0000 seconds
320
```

### 2. Checking a condition before running (like a login check)

Web frameworks such as Flask and Django use exactly this pattern for "you must be logged in" pages.

```python
import functools

def require_login(func):
    @functools.wraps(func)
    def wrapper(user, *args, **kwargs):
        if not user.get("logged_in"):
            raise PermissionError("Please log in first.")
        return func(user, *args, **kwargs)
    return wrapper

@require_login
def view_results(user):
    return f"Showing SEE results for {user['name']}"

print(view_results({"name": "Hari", "logged_in": True}))
try:
    view_results({"name": "Guest", "logged_in": False})
except PermissionError as e:
    print("Error:", e)
```

Output:

```text
Showing SEE results for Hari
Error: Please log in first.
```

### 3. Caching results, built into Python

Python ships with decorators too. `functools.lru_cache` remembers results so the same calculation is never done twice. It turns a painfully slow recursive Fibonacci into an instant one:

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(80))
print(fib.cache_info())
```

Output:

```text
23416728348467685
CacheInfo(hits=78, misses=81, maxsize=None, currsize=81)
```

## Decorators that take arguments

Sometimes you want to configure a decorator, as in `@repeat(times=3)`. That needs one more layer: a function that *returns* a decorator.

```python
import functools

def repeat(times):
    """A decorator factory: repeat(3) returns a decorator."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = None
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def say(word):
    print(word)

say("Dhanyabad!")
```

Output:

```text
Dhanyabad!
Dhanyabad!
Dhanyabad!
```

Read `@repeat(times=3)` as two steps: first `repeat(times=3)` runs and returns `decorator`; then `decorator` is applied to `say`.

## When to use decorators, and when not to

**Good uses:** logging, timing, caching, access checks, retrying a failed network call, registering routes in a web app. These are "around the function" concerns that would otherwise be copy-pasted into many functions.

**Avoid them when** the extra behaviour is really part of what the function does. If someone reading the function needs to know about it to understand the result, put it in the function.

## Summary

- A decorator is a function that takes a function and returns a new function.
- `@decorator` above `def f` is shorthand for `f = decorator(f)`.
- Always use `*args, **kwargs`, return the result, and add `@functools.wraps(func)`.
- Need options? Add one more outer function, as in `@repeat(times=3)`.

Next step: follow the [coding roadmap for beginners](/coding-for-beginners-the-complete-roadmap-for-nepali-students-in-2025/), or, if you are heading towards AI, start the [free AI & machine learning roadmap](/ai-roadmap/), which uses Python from day one.
