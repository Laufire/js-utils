/* Helpers */
import { dict, map, merge,
	reduce, secure, shuffle } from '@laufire/utils/collection';
import { rndValue } from '@laufire/utils/random';
import { rndRange, extension, fixNumber, expectEquals,
	rndNested } from '../test/helpers';
import { isArray } from './lib';

/* Tested */
import { avg, count, flat, len, max, min, product,
	reducer, sum } from './reducers';

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

	test('sum sums the given candidates.', () => {
		testPredicate(
			sum, (t, c) => t + c, 0
		);
	});

	test('product multiples the given candidates.', () => {
		testPredicate(
			product, (t, c) => t * c, 1
		);
	});

	test('length returns the length of the given collection.', () => {
		testPredicate(
			len, (t) => t + 1, 0
		);
	});

	test('avg computes the average of the given candidates.', () => {
		const expected = fixNumber(reduce(
			array, (t, c) => t + c, 0
		) / array.length);

		map(collections, (collection) => {
			expectEquals(fixNumber(reduce(
				collection, avg, 0
			)), expected);
		});
	});

	test('count returns the number of occurrences of the given counted'
	+ ' among the given candidates.', () => {
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

	test('min finds the smallest of the given candidates.', () => {
		const minValue = Math.min(...array);

		expect(reduce(rndValue(collections), min)).toEqual(minValue);
		expect(reduce(
			rndValue(collections), min, minValue - 1
		)).toEqual(minValue - 1);
	});

	test('max finds the largest of the given candidates.', () => {
		const maxValue = Math.max(...array);

		expect(reduce(rndValue(collections), max)).toEqual(maxValue);
		expect(reduce(
			rndValue(collections), max, maxValue + 1
		)).toEqual(maxValue + 1);
	});

	test('reducer derives reducers from '
	+ 'relevant collection functions.', () => {
		expect(reduce(
			[object, extension], reducer(merge), {}
		)).toEqual(merge(
			{}, object, extension
		));
	});

	describe('flat flattens the given collection recursively'
	+ ' based on depth', () => {
		test('example', () => {
			const collection = [1, 2, [3, 4, [5, 6, 7]]];
			const expectation = reduce(
				collection, (acc, val) => (isArray(val)
					? [...acc, ...val]
					: [...acc, val]), []
			);

			expect(flat(collection)).toEqual(expectation);
		});

		test('randomized test', () => {
			const collection = rndNested(
				3, 3, ['nested', 'array']
			);
			const expectation = reduce(
				collection, (acc, val) => (isArray(val)
					? [...acc, ...val]
					: [...acc, val]), []
			);

			expect(flat(collection)).toEqual(expectation);
		});
	});
});
