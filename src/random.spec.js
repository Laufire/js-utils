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
import { range, reduce, sort } from './collection';

/* Tests */
describe('rndBetween helps in generating random numbers', () => {
	const isBetween = (
		value, from, to
	) => {
		expect(value >= from).toBe(true);
		expect(value < to).toBe(true);
	};

	const getPrecision = (number) => String(number).split('.')[1]?.length || 0;

	const hasPrecision = (number, precision) =>
		expect(getPrecision(number))
			.toBeLessThanOrEqual(precision);

	const digest = (numbers) => reduce(
		// eslint-disable-next-line no-return-assign
		numbers, (acc, value) =>
		// eslint-disable-next-line no-sequences
			(acc[value] = (acc[value] || 0) + 1, acc), {}
	);

	const getMargin = (expectation, errorMargin) => {
		const lowerMargin = expectation * (1 - errorMargin);
		const upperMargin = expectation * (1 + errorMargin);

		return [lowerMargin, upperMargin];
	};

	// TODO: Use library function post publishing.
	const isAcceptable = (
		actual, expected, errorMargin
	) => {
		const [lowerMargin, upperMargin] = getMargin(expected, errorMargin);

		isBetween(
			actual, lowerMargin, upperMargin
		);
	};

	describe('examples', () => {
		test('rndBetween returns a random number between two numbers',
			() => {
				const from = -10;
				const to = 10;

				retry(() => isBetween(
					rndBetween(from, to), from, to
				));
			});

		test('rndBetween returns a decimal number if we give the precision',
			() => {
				const from = 1;
				const to = 10;
				const precision = 2;

				retry(() => hasPrecision(rndBetween(
					from, to, precision
				), precision));
			});

		test('rndBetween defaults to 0 for from, 10 for to and 0 for precision',
			() => {
				const from = 0;
				const to = 10;
				const precision = 0;

				const result = retry(() => rndBetween());

				map(result, (value) => {
					isBetween(
						value, from, to
					);
					hasPrecision(value, precision);
				});
			});
	});

	describe('randomized tests', () => {
		const retryCount = 100000;

		test('testing values', () => {
			const from = -10;
			const to = 10;
			const possibleValues = range(-10, 10);
			const errorMargin = 0.1;
			const expected = 1;

			const results = retry(() => rndBetween(from, to), retryCount);

			const avg = retryCount / possibleValues.length;

			map(digest(results), (value) => isAcceptable(
				value / avg, expected, errorMargin
			));

			const values = map(keys(digest(results)), Number);

			expect(sort(values)).toEqual(possibleValues);
		});

		test('testing precision', () => {
			const from = 1;
			const to = 10;
			const precision = 2;
			const errorMargin = 0.05;
			const expected = 0.9;

			const result = retry(() => rndBetween(
				from, to, precision
			), retryCount);

			const precisions = map(result, getPrecision);
			const digested = digest(precisions);
			const actual = digested[precision] / retryCount;

			isAcceptable(
				actual, expected, errorMargin
			);
		});
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

	test('count defaults to random value', () => {
		expect(rndValues(array).length).toBeLessThan(array.length);
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
