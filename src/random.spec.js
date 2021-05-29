import { fromEntries, map, pick } from './collection';

/* Tested */
import {
	rndBetween, rndOfString, rndString,
	rndValue, rndValueWeighted,
	stringSeeds, withProb,
} from './random';

/* Helpers */
import { retry, strSubSet } from "../test/helpers";

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

describe('rndValueWeighted returns a random a value from'
	+ ' the given weight table according to the given weights.', () => {
	test('returns a value when the iterable is not empty', () => {
		const weights = { a: 1, b: 2 };
		const getRnd = rndValueWeighted(weights);
		const results = retry(getRnd, 1000);

		const counts = map(weights, (dummy, key) =>
			results.filter((v) => v === key).length);

		expect(counts.a > 250).toEqual(true);
		expect(counts.b > 500).toEqual(true);

		expect(rndValue({})).toBeUndefined();
	});

	test('returns undefined when the iterable is empty', () => {
		expect(rndValueWeighted({})()).toBeUndefined();
	});
});

describe('withProb returns a function which returns true once in a while'
	+ ' based on the given probability value.', () => {
	test('returns true based on the given probability.', () => {
		const probability = 0.3;
		const acceptableDeviation = 0.2;
		const retryCount = 10000;
		const isProbable = withProb(probability);

		const results = retry(isProbable, retryCount);

		const counts = results.filter((result) => result === true).length;
		const prevalence = counts / retryCount;

		expect(prevalence > probability * (1 - acceptableDeviation)).toEqual(true);
		expect(prevalence < probability * (1 + acceptableDeviation)).toEqual(true);
	});
});
