import { range, map, reduce, find } from '@laufire/utils/collection';
import { isEqual } from '@laufire/utils/predicates';
import {
	retry, isAcceptable, expectEquals, rndCollection, rndArray,
} from '../test/helpers';
import { isProbable, possibilities } from './prob';

test('isProbable returns true based on given probability', () => {
	const retryCount = 50000;
	const generateTest = (probability, errorMargin) => {
		const results = retry(() => isProbable(probability), retryCount);
		const successCount = results.filter(isEqual(true)).length;
		const expectedCount = Math.min(probability, 1) * retryCount;

		return isAcceptable(
			successCount, expectedCount, errorMargin
		);
	};

	const testCandidates = (candidates, margin) => {
		const results = candidates.map((probability) =>
			generateTest(probability, margin));
		const successCount = results.filter(isEqual(true)).length;

		expect(successCount).toEqual(results.length);
	};

	testCandidates([0, 1, 2], 0);
	testCandidates(range(2, 10).map((probability) => probability / 100), 0.08);
});

describe('possibilities', () => {
	describe('example', () => {
		test('returns possibilities of given cases', () => {
			const arrayCombos = possibilities([['a', 'b'], [1, 2, 3]]);
			const objectCombos = possibilities({
				item: ['apple', 'banana'],
				price: [1, 2, 3],
			});

			expect(arrayCombos).toEqual([
				['a', 1],
				['a', 2],
				['a', 3],
				['b', 1],
				['b', 2],
				['b', 3],
			]);
			expect(objectCombos).toEqual([
				{ item: 'apple', price: 1 },
				{ item: 'apple', price: 2 },
				{ item: 'apple', price: 3 },
				{ item: 'banana', price: 1 },
				{ item: 'banana', price: 2 },
				{ item: 'banana', price: 3 },
			]);
		});
	});

	describe('randomized test', () => {
		test('returns possibilities of given cases', () => {
			const inputs = map(rndCollection(2, 3), () => rndArray(2, 3));

			const expectedLength = reduce(
				inputs, (t, c) => t * c.length, 1
			);

			const result = possibilities(inputs);

			const mismatch = find(result, (possibility) =>
				find(possibility, (value, key) =>
					!inputs[key].includes(value)));
			// TODO: Use collection.find post publishing.
			const duplicate = result.find((
				possibility, i, array
			) =>
				array.slice(i + 1).includes(possibility));

			expectEquals(result.length, expectedLength);
			expectEquals(mismatch, undefined);
			expectEquals(duplicate, undefined);
		});
	});
});
