import { map, contains, fromEntries, pick, keys, secure } from
	'@laufire/utils/collection';

/* Tested */
import {
	rndBetween, rndOfString, rndString,
	rndValue, rndValues, rndValueWeighted,
	stringSeeds, withProb,
} from './random';

/* Helpers */
import { retry, strSubSet } from '../test/helpers';

/* Tests */
describe('rndBetween', () => {
	const isBetween = (
		value, from, to
	) => {
		expect(value >= from).toBe(true);
		expect(value <= to).toBe(true);
	};

	test('rndBetween returns a random integer between two integers', () => {
		const from = -10;
		const to = 10;

		retry(() => isBetween(
			rndBetween(from, to), from, to
		));
	});

	test('rndBetween defaults to 0 and 9 from and to values', () => {
		const from = 0;
		const to = 9;

		retry(() => isBetween(
			rndBetween(), from, to
		));
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
		const array = secure(pick(seed, 1));
		const object = secure(fromEntries(seed));

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

describe('rndValues returns the given count of random a values'
+ 'from the given iterable', () => {
	const seed = retry((i) => [i, rndString()], 10);
	const array = secure(pick(seed, 1));
	const object = secure(fromEntries(seed));
	const { length } = seed;

	test('returns count number of values when the iterable length'
	+ 'is longer than count', () => {
		const count = rndBetween(0, length - 1);
		const arrayTest = (iterable) => {
			const result = rndValues(iterable, count);

			expect(keys(result).length).toEqual(count);
			result.map((val) => expect(iterable.includes(val)).toEqual(true));
		};
		const objectTest = (iterable) => {
			const result = rndValues(iterable, count);

			expect(keys(result).length).toEqual(count);
			expect(contains(iterable, result)).toEqual(true);
		};

		retry(() => {
			arrayTest(array);
			objectTest(object);
		});
	});

	test('count is limited to the length of the source iterable', () => {
		const test = (iterable) => {
			const count = seed.length * 2;
			const result = rndValues(iterable, count);

			expect(keys(result).length).toEqual(seed.length);
		};

		retry(() => [array, object].forEach(test));
	});

	test('count defaults to 1', () => {
		expect(rndValues(array).length).toEqual(1);
	});
});

describe('rndValueWeighted returns a random a value from'
	+ ' the given weight table according to the given weights.', () => {
	test('returns a value when the iterable is not empty', () => {
		const weights = secure({ a: 1, b: 2 });
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
		const allowedDeviation = 0.2;
		const retryCount = 10000;
		const checkProbability = withProb(probability);

		const results = retry(checkProbability, retryCount);

		const counts = results.filter((result) => result === true).length;
		const prevalence = counts / retryCount;

		expect(prevalence > probability * (1 - allowedDeviation)).toEqual(true);
		expect(prevalence < probability * (1 + allowedDeviation)).toEqual(true);
	});
});
