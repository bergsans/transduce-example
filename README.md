# Benefits of optimization in functional programming

How much do optimizations matter in functional programming? At least in what I'm looking at here, very little if not data sets are very large. As long as we don't use naive solutions optimization seems trivial. And no matter what we do in a language such as JavaScript, the solutions of functional programming will never come close to the efficiency of an imperative solution.

On the other hand, efficiency is not why people use functional programming. People do functional programming to obtain safe results (fewer bugs) and clarity.

I've made a [simple microbenchmark](https://github.com/bergsans/transduce-example) of a condense, 'hipster-esque' solution, a solution
more optimized, a solution using standard, 'vanilla' JavaScript methods, and one using
the [Rich Hickeys notion of a tranduce](https://www.youtube.com/watch?v=6mTbuzafcII). Also,
see [Reginald “Raganwald” Braithwaite's thoughts about transducers in JavaScript.](https://raganwald.com/2017/04/30/transducers.html) and Eric Elliot's [Transducers: Efficient Data Processing Pipelines in JavaScript](https://medium.com/javascript-scene/transducers-efficient-data-processing-pipelines-in-javascript-7985330fe73d). I've added an imperative solution for comparison.

Intuitively, I thought the differences between a fairly good functional solution using a composition and transducers would
be greater. But only in large data sets, the difference appears and the difference is - I think - quite trivial.

## Background

`map`, `filter` & `reduce` of the Array prototype in JavaScript
are very useful. But they are not very aligned with functional programming.
If you rewrite those methods in a hipster-esque fashion, taking full advantage
of the expressiveness of JavaScript, you end up with neat, quite condensed code, fit for partial application and compostions.

However, performing operations, using such neat implementations, on even small collections (arrays) are inefficient and often end up with stack overflow.

This is why it's important to respect the fact that JavaScript not is a pure language for functional programming,
even though it's possible to use a functional programming 'style'.

If we instead make the implementations in themselves
less functional, we can reduce issues while still using a functional 'style' in a meaningful manner.
What's important is values 'eventually becoming immutable', purity 'around' and 'between'
functions - not purity inside functions.

This project demonstrates this using a microbenchmark.

When 'composed', the hipster-esque implementations are slow and go stack overflow.
The implementations written in a more sensible fashion are not only way faster but
also doesn't crash. Fastest is the tranduce composition (and even faster is the of course the imperative solution).


## Setup

```
npm install
npm run result

npm test
```

## Hipster-esque functional programming

The purpose of here is only write clear implementations, 'school-book' demonstrations.

```
const isEven = (x) => x % 2 === 0;
const add = (x, y) => x + y;
const add1 = (x) => x + 1;

const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)));
```

```
const map = (fn) => (xs) => xs.reduce((acc, x) => [...acc, fn(x)], []);

const filter = (predicate) => (xs) => xs.reduce(
  (acc, x) => (predicate(x)
    ? [...acc, x]
    : acc
  ),
  [],
);

const fold = (fn, initial) => (x) => {
  const [head, ...tail] = x;
  const result = fn(initial, head);
  return tail.length > 0
    ? fold(fn, result)(tail)
    : fn(initial, head);
};
```

## A bit faster

To avoid stack overflow and inefficiency, these implementations use the principle of 'eventually becoming immutable'.

```
const mapFast = (fn) => (xs) => {
  const newXs = [];
  for (let i = 0; i < xs.length; i++) {
    newXs.push(fn(xs[i]));
  }
  return newXs;
};

const filterFast = (predicate) => (xs) => {
  const newXs = [];
  for (let i = 0; i < xs.length; i++) {
    if (predicate(xs[i])) newXs.push(xs[i]);
  }
  return newXs;
};

const foldFast = (fn, initial) => (xs) => {
  for (let i = 0; i < xs.length; i++) {
    initial = fn(initial, xs[i]);
  }
  return initial;
};
```


## Transducers

By separating the data from function applied, a central thought-figure in functional programming becomes visible - namely that (which also is visible in the 'hipster-esque' verions) `map` and `filter` are mere 'versions' of `reduce` (or `fold`). And if we make them share signature, we can fold the functions (apply them) and iterate a collection once. If not, between every transformation an intermediate collection will be recreated.

```
const rMap = (fn) => (reducer) => (acc, x) => reducer(acc, fn(x));
const rFilter = (predicate) => (reducer) => (acc, x) => (predicate(x)
  ? reducer(acc, x)
  : acc);

const concat = (acc, x) => {
  acc.push(x);
  return acc;
};
```

## Imperative solution

An imperative solution clearly have the upperhand concerning efficiency. The
main problem with this solution is not impurity but that it's not 'composable'.
Arguable, in a real solution, perhaps we still should prefer to isolate heavy
operations in a box like this since the difference in performance - given other
operations - could 'add up'_? But this is beside the point in this context.

```
function imperativeSolution(data) {
  let result = 0;
  for (let i = 0; i < data.length; i++) {
    data[i] = multBy10(data[i]);
    if (isEven(data[i])) {
      result += data[i];
    }
  }
  return result;
}
```

## Benchmark

This microbenchmark is flawed as the results depends on the machine, the OS and available resources.
The same 'run' will differ slightly depending on the current 'situation'. Still, the results
roughly indicate a tendency. The imperative solution is always about as much more efficient
as other solutions, and so on.

This are the result of my laptop computer
of an array of increasing size (a set of integers increasing from 0 ..),
running the same composed functions. Here I only compare a 'start' and 'end' (Unix) timestamp. I only run the hipster-esque implementations up to 10.000 elements (after this these implementations lead to stack overflow).

```
function microBenchmark(size, label, fn) {
  console.log(label);
  const startStamp = new Date().getTime();
  const result = fn();
  console.log(`Result: ${result}`);
  const endStamp = new Date().getTime();
  console.log(`Time: ${endStamp - startStamp} milliseconds.`);
  console.log('-------------------------------------');
}

for (let i = 1000; i < 1e7; i *= 4) {
  const data = Array.from({ length: i }, (_, index) => index);
  console.log('-------------------------------------');
  console.log(`Array size: ${i}`);
  console.log('-------------------------------------');
  if (i <= 10000) {
    microBenchmark(i, 'SLOW', () => compose(
      fold(add, 0),
      filter(isEven),
      map(multBy10),
    )(data));
  } else {
    console.log('SLOW = STACK OVERFLOW');
    console.log('-------------------------------------');
  }

  microBenchmark(i, 'STANDARD JS CHAIN', () => data
    .map(multBy10)
    .filter(isEven)
    .reduce(add, 0));

  microBenchmark(i, 'A BIT OPTIMIZED', () => composeFast(
    foldFast(add, 0),
    filterFast(isEven),
    mapFast(multBy10),
  )(data));

  microBenchmark(i, 'TRANSDUCE', () => {
    const transduced = composeFast(
      rFilter(isEven),
      rMap(multBy10),
    )(concat);
    return composeFast(
      foldFast(add, 0),
      transduced,
    )(data);
  });

  microBenchmark(i, 'IMPERATIVE SOLUTION', () => imperativeSolution(data));

  console.log('\n');
}
```

## Result

What we can safely conclude is that the hipster-esque implementation is problematic. We can use it for sets larger than 1000 elements without facing stack overflow. Also, even with small sets it's an inefficient solution. We know that the imperative solution always will be the fastest.

When comparing efficiency between the remaining three 'fuctional' solutions, the set must include 1 million or more elements for it to be relevant. With the regard to functional programming we can also arguable claim that the standard, 'vanilla' solution is problematic. The fact that ...

```
-------------------------------------
Array size: 1000
-------------------------------------
SLOW
Result: 4995000
Time: 17 milliseconds.
-------------------------------------
STANDARD JS CHAIN
Result: 4995000
Time: 0 milliseconds.
-------------------------------------
A BIT OPTIMIZED
Result: 4995000
Time: 0 milliseconds.
-------------------------------------
TRANSDUCE
Result: 499500
Time: 0 milliseconds.
-------------------------------------
IMPERATIVE SOLUTION
Result: 4995000
Time: 0 milliseconds.
-------------------------------------


-------------------------------------
Array size: 4000
-------------------------------------
SLOW
Result: 79980000
Time: 132 milliseconds.
-------------------------------------
STANDARD JS CHAIN
Result: 79980000
Time: 0 milliseconds.
-------------------------------------
A BIT OPTIMIZED
Result: 79980000
Time: 1 milliseconds.
-------------------------------------
TRANSDUCE
Result: 7998000
Time: 0 milliseconds.
-------------------------------------
IMPERATIVE SOLUTION
Result: 79980000
Time: 2 milliseconds.
-------------------------------------


-------------------------------------
Array size: 16000
-------------------------------------
SLOW = STACK OVERFLOW
-------------------------------------
STANDARD JS CHAIN
Result: 1279920000
Time: 2 milliseconds.
-------------------------------------
A BIT OPTIMIZED
Result: 1279920000
Time: 2 milliseconds.
-------------------------------------
TRANSDUCE
Result: 127992000
Time: 1 milliseconds.
-------------------------------------
IMPERATIVE SOLUTION
Result: 1279920000
Time: 1 milliseconds.
-------------------------------------


-------------------------------------
Array size: 64000
-------------------------------------
SLOW = STACK OVERFLOW
-------------------------------------
STANDARD JS CHAIN
Result: 20479680000
Time: 7 milliseconds.
-------------------------------------
A BIT OPTIMIZED
Result: 20479680000
Time: 5 milliseconds.
-------------------------------------
TRANSDUCE
Result: 2047968000
Time: 1 milliseconds.
-------------------------------------
IMPERATIVE SOLUTION
Result: 20479680000
Time: 4 milliseconds.
-------------------------------------


-------------------------------------
Array size: 256000
-------------------------------------
SLOW = STACK OVERFLOW
-------------------------------------
STANDARD JS CHAIN
Result: 327678720000
Time: 15 milliseconds.
-------------------------------------
A BIT OPTIMIZED
Result: 327678720000
Time: 5 milliseconds.
-------------------------------------
TRANSDUCE
Result: 32767872000
Time: 1 milliseconds.
-------------------------------------
IMPERATIVE SOLUTION
Result: 327678720000
Time: 2 milliseconds.
-------------------------------------


-------------------------------------
Array size: 1024000
-------------------------------------
SLOW = STACK OVERFLOW
-------------------------------------
STANDARD JS CHAIN
Result: 5242874880000
Time: 63 milliseconds.
-------------------------------------
A BIT OPTIMIZED
Result: 5242874880000
Time: 29 milliseconds.
-------------------------------------
TRANSDUCE
Result: 524287488000
Time: 8 milliseconds.
-------------------------------------
IMPERATIVE SOLUTION
Result: 5242874880000
Time: 3 milliseconds.
-------------------------------------


-------------------------------------
Array size: 4096000
-------------------------------------
SLOW = STACK OVERFLOW
-------------------------------------
STANDARD JS CHAIN
Result: 83886059520000
Time: 248 milliseconds.
-------------------------------------
A BIT OPTIMIZED
Result: 83886059520000
Time: 109 milliseconds.
-------------------------------------
TRANSDUCE
Result: 8388605952000
Time: 34 milliseconds.
-------------------------------------
IMPERATIVE SOLUTION
Result: 83886059520000
Time: 9 milliseconds.
-------------------------------------



```
