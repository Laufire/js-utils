import { range } from '@laufire/utils/collection';
import { isEqual } from '@laufire/utils/predicates';
import { retry, isAcceptable } from '../test/helpers';
import { isProbable } from './prob';

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
