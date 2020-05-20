import { fromEntries, pick } from './collection';

/* Tested */
import { rndBetween, rndOfString, rndString, stringSeeds, rndValue } from './random';

/* Config */
const defaults = {
	retryCount: 1000,
};

/* Helpers */
const retry = (fn, retryCount = defaults.retryCount) => {
	const ret = [];
	let i = 0;

	while(i < retryCount) {
		ret.push(fn(i++));
	}

	return ret;
};

const strSubSet = (superStr, tested) =>
	tested.split('').findIndex((char) => !(superStr.indexOf(char) > -1)) === -1;

/* Tests */
test('rndBetween returns a random number between two integers,'
	+ ' with 0 and 9 as the default start and end values.', () => {
	const start = 0;
	const end = 9;

	retry(() => {
		const rnd = rndBetween();

		expect(rnd >= start).toBe(true);
		expect(rnd <= end).toBe(true);
	});
});

test('rndString returns a random string of length 8,'
	+ ' with the seed char, on default configuration.', () => {
	const { char: seed } = stringSeeds;

	retry(() => {
		const rnd = rndString();

		expect(rnd.length).toBe(8);
		expect(strSubSet(seed, rnd)).toBe(true);
	});
});

test('rndOfString returns a random sub-string of the given string.', () => {
	const seed = rndString();
	const seedLength = seed.length;

	retry(() => {
		const rnd = rndOfString(seed);

		expect(rnd.length <= seedLength).toBe(true);
		expect(rnd.length >= 1).toBe(true);
		expect(strSubSet(seed, rnd)).toBe(true);
	});
});

describe('rndValue returns a random a value from the given iterable.', () => {
	test('returns a value when the iterable is not empty', () => {
		const seed = retry((i) => [i, rndString()], 10);
		const array = pick(seed, 1);
		const object = fromEntries(seed);

		retry(() => {
			expect(array).toContain(rndValue(array));
			expect(array).toContain(rndValue(object));
		});

	expect(rndValue([])).toBeUndefined();
	expect(rndValue({})).toBeUndefined();
	});

	test('returns undefined when the iterable is empty', () => {
		expect(rndValue([])).toBeUndefined();
		expect(rndValue({})).toBeUndefined();
	});
});
