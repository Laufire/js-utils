/* Helpers */
import { equals, clone } from '@laufire/utils/collection';
import { isDefined } from '@laufire/utils/reflection';
import { array, retry, rndArray, rndKey, rndRange } from '../test/helpers';

/* Tested */
import { cache, value, defined, self,
	identity, nothing, pipe } from './fn';
import { map, length } from './collection';

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

describe('pipe pipes the given data to the given list of pipes', () => {
	test('examples', async () => {
		const data = 1;
		const addOne = (num) => num + 1;
		const addTwo = (num) => num + 2;
		const pipes = [addOne, addTwo];

		const buildPipe = pipe(pipes);
		const received = await buildPipe(data);

		expect(received).toEqual(4);
	});

	test('randomized test', async () => {
		const data = Symbol('data');
		const pipes = map(rndRange(), () => jest.fn(identity));
		const [first, ...rest] = pipes;
		const last = pipes[length(pipes) - 1];

		const buildPipe = pipe(pipes);
		const received = await buildPipe(data);

		expect(first).toHaveBeenCalledWith(data);
		map(rest, (fn, key) => expect(fn).toHaveBeenCalledWith(pipes[key]
			.mock.results[0].value));
		expect(received).toEqual(last.mock.results[0].value);
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
