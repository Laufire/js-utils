import { map, contains, keys, secure, has } from
	'@laufire/utils/collection';

/* Tested */
import * as random from './random';

/* Helpers */
import { expectEquals, retry, rndCollection, strSubSet } from '../test/helpers';
import { range, reduce, sort } from './collection';
import { values } from '@laufire/utils/lib';
import { inferType } from '@laufire/utils/reflection';
import { unique } from '@laufire/utils/predicates';

const { rndBetween, rndOfString, rndString,
	rndValue, rndValues, rndValueWeighted,
	stringSeeds, withProb } = random;

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

	// TODO: Use library function post publishing.
	const isAcceptable = (
		actual, expected, errorMargin
	) => {
		const lowerMargin = expected * (1 - errorMargin);
		const upperMargin = expected * (1 + errorMargin);

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

		test('rndBetween returns a rndNumber for the given precision',
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

				retry(() => {
					const result = rndBetween();

					isBetween(
						result, from, to
					);
					hasPrecision(result, precision);
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
			const digested = digest(results);

			map(digested, (count) => isAcceptable(
				count / avg, expected, errorMargin
			));

			const resultingValues = map(keys(digested), Number);

			expect(sort(resultingValues)).toEqual(possibleValues);
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

// TODO: Randomize properly.
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
		expect(rnd.length >= 0).toBe(true);

		expect(strSubSet(seed, rnd)).toBe(true);
	}, 10000);
});

describe('rndValue returns a random a value from the given iterable.', () => {
	test('example', () => {
		const object = {
			a: 1,
			b: 2,
			c: 3,
			d: 4,
		};

		expect(has(object, rndValue(object))).toEqual(true);
	});

	test('returns a value when the iterable is not empty', () => {
		retry(() => {
			const rndColl = rndCollection();

			expect(has(rndColl, rndValue(rndColl))).toEqual(true);
		});
	});

	test('returns undefined when the iterable is empty', () => {
		expect(rndValue([])).toBeUndefined();
		expect(rndValue({})).toBeUndefined();
	});
});

// TODO: Fix the description.
describe('rndValues returns the given count of random a values'
+ 'from the given iterable', () => {
	// TODO: Fix the description.
	describe('returns count number of values when the iterable length'
	+ ' is longer than count', () => {
		test('example', () => {
			const object = {
				a: 1,
				b: 2,
				c: 3,
				d: 4,
			};
			const count = 2;

			const result = rndValues(object, count);

			expectEquals(contains(object, result), true);
			expectEquals(values(result).length, count);
		});

		test('randomized test', () => {
			const collectionTest = {
				array: (iterable, result) => {
					expect(result.filter(unique)).toEqual(result);
					map(result, (value) => expect(has(iterable, value))
						.toEqual(true));
				},
				object: (iterable, result) => {
					expect(contains(iterable, result)).toEqual(true);
				},
			};

			retry(() => {
				const rndColl = rndCollection();
				const count = rndBetween(0, values(rndColl).length - 1);

				const result = rndValues(rndColl, count);

				expect(values(result).length).toEqual(count);
				collectionTest[inferType(rndColl)](rndColl, result);
			});
		});
	});

	describe('count is limited to the length of the source iterable', () => {
		test('example', () => {
			const object = {
				a: 1,
				b: 2,
				c: 3,
				d: 4,
			};
			const count = 8;

			const result = rndValues(object, count);

			expect(values(result).length).toEqual(values(object).length);
		});
		test('randomized test', () => {
			retry(() => {
				const rndColl = rndCollection();
				const count = values(rndColl).length * 2;
				const result = rndValues(rndColl, count);

				// TODO: Use collection.count after publishing.
				expect(values(result).length).toEqual(values(rndColl).length);
			});
		});
	});

	describe('count defaults to random value', () => {
		test('example', () => {
			const object = {
				a: 1,
				b: 2,
				c: 3,
				d: 4,
			};

			expect(values(rndValues(object)).length)
				.not.toBeGreaterThan(values(object).length);
		});
		// TODO: Fix the description.
		test('randomized test', () => {
			const rndColl = rndCollection();

			expect(values(rndValues(rndColl)).length)
				.not.toBeGreaterThan(values(rndColl).length);
		});
	});
});

describe('rndValueWeighted returns a random a value from'
	+ ' the given weight table according to the given weights.', () => {
	// TODO: Use isAcceptable in example test.
	// TODO: Randomize the test.
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
	// TODO: Rewrite the example test properly.
	// TODO: Randomize the test.
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
