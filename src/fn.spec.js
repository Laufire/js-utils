/* Tested */
import { cache } from './fn';

/* Helpers */
import { equals } from './collection';

test('cache caches the given function based on parameters till the next call'
	+ ' with a new set of args', () => {
	const testCache = (qualifier, callCount) => {
		const fn = jest.fn((...args) => args);
		const cachedFn = cache(fn, qualifier);
		const array = [1, 2];
		const number = 1;
		const result = cachedFn(array, number);

		expect(cachedFn(array, number)).toEqual(result);
		expect(fn.mock.calls.length).toEqual(1);

		cachedFn(array, number + 1);
		cachedFn(array.slice(), number + 1);
		expect(fn.mock.calls.length).toEqual(callCount);
	};

	testCache(undefined, 3);
	testCache(equals, 2);
});
