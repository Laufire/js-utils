/* Helpers */
import { equals, clone } from '@laufire/utils/collection';
import { isDefined } from '@laufire/utils/reflection';
import { rndArray, rndKey } from '../test/helpers';

/* Tested */
import { cache, value, defined } from './fn';

test('cache caches the given function based on parameters till the next call'
	+ ' with a new set of args', () => {
	const testCache = (qualifier, callCount) => {
		const fn = jest.fn((...args) => args);
		const cachedFn = cache(fn, qualifier);
		const array = rndArray;
		const symbolOne = Symbol('SymbolOne');
		const SymbolTwo = Symbol('SymbolTwo');

		const result = cachedFn(array, symbolOne);

		expect(cachedFn(array, symbolOne)).toEqual(result);
		expect(fn).toHaveBeenCalledTimes(1);

		cachedFn(array, SymbolTwo);
		cachedFn(array.slice(), SymbolTwo);
		expect(fn).toHaveBeenCalledTimes(callCount);
	};

	testCache(undefined, 3);
	testCache(equals, 2);
});

test('value extracts the value from the given function or variable', () => {
	const val = Symbol('val');

	expect(value(val)).toBe(val);
	expect(value(() => val)).toBe(val);
});

test('defined filters the first defined value', () => {
	const values = clone(rndArray);

	values[rndKey(values)] = undefined;

	values.forEach((item, i) =>
		expect(defined(...values.slice(i)))
			.toEqual(isDefined(item) ? item : values[i + 1]));
});
