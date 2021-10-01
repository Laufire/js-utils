import { rndBetween } from './lib';
import { vary } from './number';
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
