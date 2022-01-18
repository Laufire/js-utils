import {
	map, contains, secure,
	has, values, range, reduce,
} from '@laufire/utils/collection';
import {
	rndBetween as tRndBetween, rndString as tRndString,
} from '@laufire/utils/random';
import { inferType } from '@laufire/utils/reflection';
import { unique } from '@laufire/utils/predicates';
import { sum } from '@laufire/utils/reducers';
import
{ expectEquals, retry, rndCollection, getRatios,
	strSubSet, isAcceptable, testRatios, summarize, rndDict }
	from '../test/helpers';

/* Tested */
import { rndBetween, rndOfString, rndString,
	rndValue, rndValues, rndValueWeighted,
	stringSeeds, withProb } from './random';

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
		test('values test', () => {
			const retryCount = 50000;
			const from = -2;
			const to = 2;
			const possibleValues = range(from, to);

			const results = retry(() => rndBetween(from, to), retryCount);

			testRatios(results, getRatios(possibleValues));
		});

		test('precision test', () => {
			const retryCount = 50000;
			const from = -2;
			const to = 2;
			const precision = 2;
			const expected = 0.9;

			const results = retry(() => rndBetween(
				from, to, precision
			), retryCount);

			const precisions = map(results, getPrecision);
			const summarized = summarize(precisions);
			const actual = summarized[precision] / retryCount;

			isAcceptable(actual, expected);
		});
	});
});

describe('rndString', () => {
	test('returns a random string based on the given seed'
	+ ' and count', () => {
		const seed = 'abcd';
		const count = 2;

		const result = rndString(count, seed);

		expect(result.length).toBe(count);
		expect(strSubSet(seed, result)).toBe(true);
	});

	test('rndString returns a randomString based on the'
	+ ' given stringSeed', () => {
		retry(() => {
			const seed = rndValue(stringSeeds);
			const count = tRndBetween(0, 9);

			const result = rndString(count, seed);

			expect(strSubSet(seed, result)).toBe(true);
		});
	});

	test('count defaults to 8 and seed defaults to char', () => {
		const { char: seed } = stringSeeds;
		const count = 8;

		retry(() => {
			const result = rndString();

			expect(result.length).toBe(count);
			expect(strSubSet(seed, result)).toBe(true);
		});
	});

	test('ratio test', () => {
		const seed = 'abc';
		const count = 1;
		const retryCount = 50000;

		const results = retry(() => rndString(count, seed), retryCount);

		testRatios(results, getRatios(seed.split('')));
	});
});

test('rndOfString returns a random sub-string of the given string.', () => {
	const seed = tRndString();
	const seedLength = seed.length;

	retry(() => {
		const result = rndOfString(seed);

		expect(result.length <= seedLength).toBe(true);
		expect(result.length >= 1).toBe(true);
		expect(strSubSet(seed, result)).toBe(true);
	});
});

describe('rndValue returns a random a value from the given iterable.', () => {
	test('example', () => {
		const iterable = {
			a: 1,
			b: 2,
			c: 3,
			d: 4,
		};

		const result = rndValue(iterable);

		expect(has(iterable, result)).toEqual(true);
	});

	test('returns undefined when the iterable is empty', () => {
		expect(rndValue([])).toBeUndefined();
		expect(rndValue({})).toBeUndefined();
	});

	test('randomized test', () => {
		retry(() => {
			const rndColl = rndCollection();

			const result = rndValue(rndColl);

			expect(has(rndColl, result)).toEqual(true);
		});
	});

	test('ratio test', () => {
		const retryCount = 50000;
		const rndColl = rndCollection();

		const results = retry(() => rndValue(rndColl), retryCount);

		testRatios(results, getRatios(rndColl));
	});
});

describe('rndValues returns the given count of random a values'
+ 'from the given iterable', () => {
	const retryCount = 50000;

	describe('returns the given count number of values when the iterable length'
	+ ' is longer than the given count', () => {
		test('example', () => {
			const iterable = {
				a: 1,
				b: 2,
				c: 3,
				d: 4,
			};
			const count = 2;

			const result = rndValues(iterable, count);

			expectEquals(contains(iterable, result), true);
			expectEquals(values(result).length, count);
		});

		test('randomized test', () => {
			const verifiers = {
				array: (iterable, result) => {
					// TODO: Use library filter after publishing.
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
				const count = tRndBetween(0, values(rndColl).length - 1);
				const rndCollType = inferType(rndColl);

				const result = rndValues(rndColl, count);

				expect(values(result).length).toEqual(count);
				expect(rndCollType).toEqual(inferType(result));
				verifiers[rndCollType](rndColl, result);
			});
		});
	});

	describe('count is limited to the length of the source iterable', () => {
		test('example', () => {
			const iterable = {
				a: 1,
				b: 2,
				c: 3,
				d: 4,
			};
			const count = 8;

			const result = rndValues(iterable, count);

			expect(values(result).length).toEqual(values(iterable).length);
		});

		test('randomized test', () => {
			retry(() => {
				const rndColl = rndCollection();
				const count = values(rndColl).length;
				const result = rndValues(rndColl, count);

				// TODO: Use collection.count after publishing.
				expect(values(result).length).toEqual(values(rndColl).length);
			});
		});
	});

	describe('count defaults to random value', () => {
		test('example', () => {
			const iterable = {
				a: 1,
				b: 2,
				c: 3,
				d: 4,
			};

			const result = rndValues(iterable);

			expect(values(result).length)
				.not.toBeGreaterThan(values(iterable).length);
		});

		test('randomized test', () => {
			retry(() => {
				const length = tRndBetween(0, 3);
				const rndColl = rndCollection(0, length);
				const possibleLengths = range(0, rndColl.length + 1);

				const results = retry(() => rndValues(rndColl), retryCount);

				const resultLengths = map(results, (result) => result.length);

				testRatios(resultLengths, getRatios(possibleLengths));
			});
		});
	});

	test('ratio test', () => {
		const rndColl = rndCollection(0, tRndBetween(0, 3));

		const results = retry(() => rndValues(rndColl), retryCount);

		testRatios(results.flat(), getRatios(rndColl));
	});
});

describe('rndValueWeighted returns a random a value from'
	+ ' the given weight table according to the given weights.', () => {
	test('example', () => {
		const retryCount = 1000;
		const weights = { a: 1, b: 3 };

		const results = retry(rndValueWeighted(weights), retryCount);

		const summarized = summarize(results);
		const { a, b } = summarized;

		expect(a > 200 && a < 300).toBe(true);
		expect(b > 700 && b < 800).toBe(true);
	});

	test('ratios test',
		() => {
			const weights = secure(reduce(
				rndDict(0, tRndBetween(0, 3)), (
					acc, dummy, key
				) =>
					({ ...acc, [key]: tRndBetween(0, 3) }), {}
			));
			const totalWeights = reduce(
				weights, sum, 0
			);
			const ratios = reduce(weights, (
				acc, value, key
			) =>
				({ ...acc, [key]: (value / totalWeights) || 0 }))
				|| { undefined: 1 };

			const results = retry(rndValueWeighted(weights), 50000);

			testRatios(results, ratios);
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
