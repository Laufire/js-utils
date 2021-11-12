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
		// TODO: Use symbols.
		const array = [1, 2];
		const number = 1;
		const result = cachedFn(array, number);

		expect(cachedFn(array, number)).toEqual(result);
		// TODO: Change API, Use twoHaveBeenCalledTimes.
		expect(fn.mock.calls.length).toEqual(1);

		cachedFn(array, number + 1);
		cachedFn(array.slice(), number + 1);
		expect(fn.mock.calls.length).toEqual(callCount);
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
