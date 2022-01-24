import { rndBetween } from './lib';
import { getDR, vary } from './number';
import { fixNumber, getRatios, retry, testRatios } from '../test/helpers';
import { range } from '@laufire/utils/collection';

describe('vary', () => {
	test('example', () => {
		const variance = 0.1;

		const result = vary(variance);

		expect(result >= 0.9 && result <= 1.1).toEqual(true);
	});

	test('ratio test', () => {
		const retryCount = 10000;
		const variance = 0.01;
		const possibilities = range(99, 102).map((value) => value / 100);

		const results = retry(() => vary(variance), retryCount);

		testRatios(results, getRatios(possibilities));
	});
});

describe('getDR gives the distance ratio between two numbers', () => {
	test('example', () => {
		const numOne = 10;
		const numTwo = 20;
		const expected = 0.5;

		const result = getDR(numOne, numTwo);

		expect(result).toEqual(expected);
	});

	test('gives infinity if numTwo is zero', () => {
		const numTwo = 0;
		const numOne = rndBetween(50, 60);

		expect(getDR(numOne, numTwo)).toEqual(Infinity);
	});

	test('gives zero if both numbers are zero', () => {
		const numTwo = 0;
		const numOne = 0;

		expect(getDR(numOne, numTwo)).toEqual(0);
	});

	test('randomized test', () => {
		const numTwo = rndBetween(50, 60);
		const result = rndBetween(70, 80) / 100;
		const numOne = numTwo - (numTwo * result);

		expect(fixNumber(getDR(numOne, numTwo)))
			.toEqual(fixNumber(result));
	});
});
