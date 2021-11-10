import { rndBetween } from '@laufire/utils/random';
import { isAcceptable } from './matchers';

test('isAcceptable checks whether the result is close'
	+ 'to the expected value, by the given margin',
() => {
	const expected = rndBetween(30, 40);
	const allowedMargin = rndBetween(10, 20) / 100;
	const actual = expected - (expected * allowedMargin);

	const expectations = [
		[rndBetween(50, 60) / 100, true],
		[0, false],
	];

	expectations.forEach(([margin, expectation]) => {
		const result = isAcceptable(
			actual, expected, margin
		);

		expect(result).toEqual(expectation);
	});
});
