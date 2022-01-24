/* Helpers */
import { equals, clone } from '@laufire/utils/collection';
import { isDefined } from '@laufire/utils/reflection';
import { array, rndKey } from '../test/helpers';

/* Tested */
import { cache, value, defined, self, identity, nothing } from './fn';

describe('cache caches the given function based on parameters'
+ ' till the next call with a new set of args', () => {
	test('example', () => {
		const getTime = () => performance.now();
		const cachedFn = cache(getTime);
		const uncachedFn = getTime;

		const resultOne = cachedFn();
		const resultTwo = cachedFn();

		const uncachedResOne = uncachedFn();
		const uncachedResTwo = uncachedFn();

		expect(resultOne).toEqual(resultTwo);
		expect(uncachedResOne).not.toEqual(uncachedResTwo);
	});

	test('randomized test', () => {
		const testCache = (qualifier, callCount) => {
			const fn = jest.fn((...args) => args);
			const cachedFn = cache(fn, qualifier);
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
});

test('value extracts the value from the given function or variable', () => {
	const val = Symbol('val');

	expect(value(val)).toBe(val);
	expect(value(() => val)).toBe(val);
});

test('defined filters the first defined value', () => {
	const values = clone(array);

	values[rndKey(values)] = undefined;

	values.forEach((item, i) =>
		expect(defined(...values.slice(i)))
			.toEqual(isDefined(item) ? item : values[i + 1]));
});

test('self returns the same input value', () => {
	const x = Symbol('x');

	expect(self(x)).toEqual(x);
});

test('identity is an alias of self', () => {
	expect(identity).toEqual(self);
});

test('nothing returns undefined', () => {
	expect(nothing()).toEqual(undefined);
});
