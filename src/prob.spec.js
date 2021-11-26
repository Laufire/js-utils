import { range, map, reduce, find } from '@laufire/utils/collection';
import { isEqual } from '@laufire/utils/predicates';
import { rndBetween } from '@laufire/utils/random';
import { retry, isAcceptable, expectEquals } from '../test/helpers';
import { isProbable, possibilities } from './prob';

test('isProbable returns true based on given probability', () => {
	const retryCount = 100000;
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
	testCandidates(range(2, 99).map((probability) => probability / 100), 0.08);
});

test('possibilities', () => {
	const inputs = map(range(1, rndBetween(3, 6)), () =>
		map(range(1, rndBetween(2, 6)), Symbol));

	const expectedLength = reduce(
		inputs, (t, c) => t * c.length, 1
	);

	const result = possibilities(inputs);

	const mismatch = find(result, (possibility) =>
		find(possibility, (value, i) => !inputs[i].includes(value)));
	// TODO: Use collection.find post publishing.
	const duplicate = result.find((
		possibility, i, array
	) =>
		array.slice(i + 1).includes(possibility));

	expectEquals(result.length, expectedLength);
	expectEquals(mismatch, undefined);
	expectEquals(duplicate, undefined);
});
