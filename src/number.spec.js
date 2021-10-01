import { vary } from './number';
import * as random from './random';

describe("vary", () => {
    test("vary should give a percentage between ", () => {
        const variance = 1;
        const hundred = 100;
        const min = hundred - (variance * hundred);
        const max = hundred + (variance * hundred);

        jest.spyOn(random, 'rndBetween');

        const result = vary(variance);

        expect(random.rndBetween).toHaveBeenCalledWith(min, max);
    });
});
