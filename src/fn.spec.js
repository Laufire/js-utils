/* Helpers */
import { equals, clone } from '@laufire/utils/collection';
import { isDefined } from '@laufire/utils/reflection';
import { array, retry, rndArray, rndKey } from '../test/helpers';

/* Tested */
import { cache, value, defined, self, identity, nothing, tryCatch } from './fn';

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

	test('complete test', () => {
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

describe('defined filters the first defined value', () => {
	test('example', () => {
		const input = [undefined, 1, undefined, 2, 3];
		const expected = 1;

		const result = defined(...input);

		expect(result).toEqual(expected);
	});

	test('randomized test', () => {
		retry(() => {
			const values = clone(rndArray());

			values[rndKey(values)] = undefined;

			values.forEach((item, i) =>
				expect(defined(...values.slice(i)))
					.toEqual(isDefined(item) ? item : values[i + 1]));
		});
	});
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

describe('tryCatch helps in calling exception throwing functions.', () => {
	const success = Symbol('success');
	const error = new Error('Test Error');

	const workingFn = () => success;
	const workingAsyncFn = () => Promise.resolve(success);
	const errorFn = () => {
		throw error;
	};
	const errorAsyncFn = () => Promise.reject(error);

	test('tryCatch returns function result as { data }.', async () => {
		const result = await tryCatch(workingFn);

		expect(result.data).toEqual(success);
		expect(result.error).toEqual(undefined);
	});

	test('tryCatch returns any error as { error }.', async () => {
		const result = await tryCatch(errorFn);

		expect(result.error).toBe(error);
		expect(result.data).toEqual(undefined);
	});

	test('tryCatch returns async function result as { data }.',
		async () => {
			const result = await tryCatch(workingAsyncFn);

			expect(result.data).toEqual(success);
			expect(result.error).toEqual(undefined);
		});

	test('tryCatch returns any async function error as { error }.',
		async () => {
			const result = await tryCatch(errorAsyncFn);

			expect(result.error).toBe(error);
			expect(result.data).toEqual(undefined);
		});

	test('tryCatch along with anonymous functions could be'
	+ ' used to pass parameters.', async () => {
		const someParameter = Symbol('someParameter');
		const result = await tryCatch(() => identity(someParameter));

		expect(result.data).toEqual(someParameter);
	});
});
