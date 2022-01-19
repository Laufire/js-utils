/* Helpers */
import { dict, map, merge,
	reduce, secure, shuffle } from '@laufire/utils/collection';
import { rndValue } from '@laufire/utils/random';
import { rndRange, extension, fixNumber, expectEquals, rndNested }
	from '../test/helpers';

/* Tested */
import { avg, count, flat, len, max, min, product, reducer, sum }
	from './reducers';

/* Spec */
describe('Reducers', () => {
	const array = secure(shuffle(rndRange()));
	const object = secure(dict(array));
	const collections = [object, array];

	const testPredicate = (
		predicate, buildExpectation, initial
	) => {
		const expected = reduce(
			array, buildExpectation, initial
		);

		map(collections, (collection) => {
			expect(reduce(
				collection, predicate, initial
			)).toEqual(expected);
		});
	};

	describe('sum sums the given candidates.', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const initialValue = 0;

			const expected = 6;

			expect(reduce(
				input, sum, initialValue
			)).toEqual(expected);
		});

		test('randomized', () => {
			testPredicate(
				sum, (t, c) => t + c, 0
			);
		});
	});

	describe('product multiples the given candidates.', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const initialValue = 1;

			const expected = 6;

			expect(reduce(
				input, product, initialValue
			)).toEqual(expected);
		});

		test('randomized', () => {
			testPredicate(
				product, (t, c) => t * c, 1
			);
		});
	});

	describe('length returns the length of the given collection.', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const initialValue = 0;

			const expected = 3;

			expect(reduce(
				input, len, initialValue
			)).toEqual(expected);
		});

		test('randomized', () => {
			testPredicate(
				len, (t) => t + 1, 0
			);
		});
	});

	describe('avg computes the average of the given candidates.', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const initialValue = 0;

			const expected = 2;

			expect(reduce(
				input, avg, initialValue
			)).toEqual(expected);
		});

		test('randomized', () => {
			const expected = fixNumber(reduce(
				array, (t, c) => t + c, 0
			) / array.length);

			map(collections, (collection) => {
				expectEquals(fixNumber(reduce(
					collection, avg, 0
				)), expected);
			});
		});
	});

	describe('count returns the number of occurrences of the given counted'
	+ ' among the given candidates.', () => {
		test('example', () => {
			const input = [1, 2, 3, 1, 1, 1];
			const initialValue = 0;

			const expected = 4;

			expect(reduce(
				input, count(1), initialValue
			)).toEqual(expected);
		});

		test('randomized', () => {
			const existing = rndValue(array);
			const nonExistent = Math.max(...array) + 1;

			const expectations = [
				[existing, 1],
				[nonExistent, 0],
			];

			map(expectations, ([value, expected]) =>
				expect(reduce(
					rndValue(collections), count(value), 0
				)).toEqual(expected));
		});
	});

	describe('min finds the smallest of the given candidates.', () => {
		test('example', () => {
			const input = [1, 2, 3];

			const expected = 1;

			expect(reduce(input, min)).toEqual(expected);
		});

		test('randomized', () => {
			const minValue = Math.min(...array);

			expect(reduce(rndValue(collections), min)).toEqual(minValue);
			expect(reduce(
				rndValue(collections), min, minValue - 1
			)).toEqual(minValue - 1);
		});
	});

	describe('max finds the largest of the given candidates.', () => {
		test('example', () => {
			const input = [1, 2, 3];

			const expected = 3;

			expect(reduce(input, max)).toEqual(expected);
		});

		test('randomized test', () => {
			const maxValue = Math.max(...array);

			expect(reduce(rndValue(collections), max)).toEqual(maxValue);
			expect(reduce(
				rndValue(collections), max, maxValue + 1
			)).toEqual(maxValue + 1);
		});
	});

	describe('reducer derives reducers from '
	+ 'relevant collection functions.', () => {
		test('example', () => {
			const input = [
				{
					a: 1, b: 2,
				},
				{
					a: 3, b: 4, c: 5,
				},
			];

			const expected = { a: 3, b: 4, c: 5 };

			expect(reduce(
				input, reducer(merge), {}
			)).toEqual(expected);
		});

		test('randomized', () => {
			expect(reduce(
				[object, extension], reducer(merge), {}
			)).toEqual(merge(
				{}, object, extension
			));
		});
	});

	describe('flat flattens the given collection recursively', () => {
		test('example', () => {
			const nestedArray = [1, 2, [3, [4]]];
			const expectation = [1, 2, 3, 4];

			expect(reduce(
				nestedArray, flat, []
			)).toEqual(expectation);
		});

		test('randomized test', () => {
			const nestedArray = rndNested(
				3, 3, ['nested', 'array']
			);
			const expectation = nestedArray.flat(Infinity);

			expect(reduce(
				nestedArray, flat, []
			)).toEqual(expectation);
		});
	});
});
