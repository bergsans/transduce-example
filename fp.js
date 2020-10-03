const isEven = (x) => x % 2 === 0;
const add = (x, y) => x + y;
const add1 = (x) => x + 1;
const multBy10 = (x) => x * 10;

const compose = (...fns) => fns.reduceRight((f, g) => (...args) => g(f(...args)));

const composeFast = (...fns) => (...args) => {
  let result = fns[0](...args);
  for (let i = fns.length - 1; i > 1; i--) {
    result = fns[i](result);
  }
  return result;
};

const map = (fn) => (xs) => xs.reduce((acc, x) => [...acc, fn(x)], []);

const mapFast = (fn) => (xs) => {
  const newXs = [];
  for (let i = 0; i < xs.length; i++) {
    newXs.push(fn(xs[i]));
  }
  return newXs;
};

const filter = (predicate) => (xs) => xs.reduce(
  (acc, x) => (predicate(x)
    ? [...acc, x]
    : acc
  ),
  [],
);

const filterFast = (predicate) => (xs) => {
  const newXs = [];
  for (let i = 0; i < xs.length; i++) {
    if (predicate(xs[i])) newXs.push(xs[i]);
  }
  return newXs;
};

const fold = (fn, initial) => (x) => {
  const [head, ...tail] = x;
  const result = fn(initial, head);
  return tail.length > 0
    ? fold(fn, result)(tail)
    : fn(initial, head);
};

const foldFast = (fn, initial) => (xs) => {
  for (let i = 0; i < xs.length; i++) {
    initial = fn(initial, xs[i]);
  }
  return initial;
};

const rMap = (fn) => (reducer) => (acc, x) => reducer(acc, fn(x));
const rFilter = (predicate) => (reducer) => (acc, x) => (predicate(x)
  ? reducer(acc, x)
  : acc);

const concat = (acc, x) => {
  acc.push(x);
  return acc;
};

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
    mapFast(multBy10),
    filterFast(isEven),
    foldFast(add, 0),
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

module.exports = {
  compose,
  map,
  mapFast,
  fold,
  foldFast,
  add,
  add1,
  isEven,
  filter,
  filterFast,
  rMap,
  rFilter,
  concat,
};
