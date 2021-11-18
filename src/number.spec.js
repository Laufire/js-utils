import { rndBetween } from './lib';
import { getDR, vary } from './number';
import * as random from './random';
import { fixNumber } from '../test/helpers';

describe('vary', () => {
	test('vary should give a percentage between ', () => {
		// TODO: Revisit.
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

		expect(fixNumber(getDR(numOne, numTwo)))
			.toEqual(fixNumber(result));
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
