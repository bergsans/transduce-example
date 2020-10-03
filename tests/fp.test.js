const {
  map,
  mapFast,
  fold,
  foldFast,
  add,
  add1,
  compose,
  isEven,
  filter,
  filterFast,
  rMap,
  rFilter,
  concat,
} = require('../fp.js');

test('#map', () => expect(map(add1)([1, 2, 3])).toEqual([2, 3, 4]));
test('#mapFast', () => expect(mapFast(add1)([1, 2, 3])).toEqual([2, 3, 4]));
test('#filter', () => expect(filter(isEven)([1, 2, 3, 4])).toEqual([2, 4]));
test('#filterFast', () => expect(filterFast(isEven)([1, 2, 3, 4])).toEqual([2, 4]));
test('#fold', () => expect(fold(add, 0)([1, 2, 3])).toEqual(6));
test('#foldFast', () => expect(foldFast(add, 0)([1, 2, 3])).toEqual(6));
test('#compose (1)', () => expect(
  compose(
    map(add1),
    map(add1),
  )([1, 2, 3]),
).toEqual([3, 4, 5]));
test('#compose (2)', () => expect(
  compose(
    map(add1),
    filter(isEven),
    map(add1),
  )([1, 2, 3]),
).toEqual([3, 5]));
test('#mapTranduce', () => expect(
  [1, 2, 3].reduce(
    rMap(add1)(concat),
    [],
  ),
).toEqual([2, 3, 4]));
test('#filterTranduce', () => expect(
  [1, 2, 3].reduce(
    rFilter(isEven)(concat),
    [],
  ),
).toEqual([2]));
