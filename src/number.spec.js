import { rndBetween } from './lib';
import { getDR, vary } from './number';
import * as random from './random';

describe('vary', () => {
	test('vary should give a percentage between ', () => {
		const variance = 1;
		const hundred = 100;
		const min = hundred - (variance * hundred);
		const max = hundred + (variance * hundred);
		const mockResult = rndBetween(1, 100);

		jest.spyOn(random, 'rndBetween').mockReturnValue(mockResult);

		const result = vary(variance);

		expect(random.rndBetween).toHaveBeenCalledWith(min, max);
		expect(result).toBe(mockResult / 100);
	});
});

describe('getDR', () => {
	test('gives the distance ratio between two numbers', () => {
		const numTwo = rndBetween(50, 60);
		const result = rndBetween(70, 80) / 100;
		const numOne = numTwo - (numTwo * result);

		expect(getDR(numOne, numTwo).toFixed(2))
			.toEqual(result.toFixed(2));
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
});
