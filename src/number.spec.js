import { varry } from './number';
import * as random from './random';

describe("varry", () => {
    test("varry should give a percentange between ", () => {
        const variance = 1;
        const hundred = 100;
        const min = hundred - (variance * hundred);
        const max = hundred + (variance * hundred);

        jest.spyOn(random, 'rndBetween');

        const result = varry(variance);

        expect(random.rndBetween).toHaveBeenCalledWith(min, max);
    });
});
