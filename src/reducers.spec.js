/* Helpers */
import { dict, map, merge,
	reduce, secure, shuffle } from '@laufire/utils/collection';
import { rndValue } from '@laufire/utils/random';
import { rndRange, extension, fixNumber, expectEquals } from '../test/helpers';

/* Tested */
import { avg, count, len, max, min, product, reducer, sum } from './reducers';

/* Spec */
describe('Reducers', () => {
	const rndArray = secure(shuffle(rndRange));
	const rndObject = secure(dict(rndArray));
	const collections = [rndObject, rndArray];

	const testPredicate = (
		predicate, buildExpectation, initial
	) => {
		const expected = reduce(
			rndArray, buildExpectation, initial
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
			rndArray, (t, c) => t + c, 0
		) / rndArray.length);

		map(collections, (collection) => {
			expectEquals(fixNumber(reduce(
				collection, avg, 0
			)), expected);
		});
	});

	test('count returns the number of occurrences of the given counted'
	+ ' among the given candidates.', () => {
		const existing = rndValue(rndArray);
		const nonExistent = Math.max(...rndArray) + 1;

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
		const minValue = Math.min(...rndArray);

		expect(reduce(rndValue(collections), min)).toEqual(minValue);
		expect(reduce(
			rndValue(collections), min, minValue - 1
		)).toEqual(minValue - 1);
	});

	test('max finds the largest of the given candidates.', () => {
		const maxValue = Math.max(...rndArray);

		expect(reduce(rndValue(collections), max)).toEqual(maxValue);
		expect(reduce(
			rndValue(collections), max, maxValue + 1
		)).toEqual(maxValue + 1);
	});

	test('reducer derives reducers from '
	+ 'relevant collection functions.', () => {
		expect(reduce(
			[rndObject, extension], reducer(merge), {}
		)).toEqual(merge(
			{}, rndObject, extension
		));
	});
});
