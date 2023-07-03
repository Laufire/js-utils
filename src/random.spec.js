/* Helpers */
import {
	map, contains, secure,
	has, range,	reduce,
	filter, count,
} from '@laufire/utils/collection';
import {
	rndBetween as tRndBetween, rndString as tRndString,
	rndValues as tRndValues,
} from '@laufire/utils/random';
import { inferType } from '@laufire/utils/reflection';
import { unique } from '@laufire/utils/predicates';
import { sum } from '@laufire/utils/reducers';
import {
	expectEquals, retry, rndCollection,
	getRatios,	strSubSet, isAcceptable,
	testRatios, summarize, rndDict,
}	from '../test/helpers';

/* Tested */
import {
	rndBetween, rndOfString, rndString,
	rndValue, rndValues, rndValueWeighted,
	stringSeeds,
} from './random';

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
		const length = 2;

		const result = rndString(length, seed);

		expect(result.length).toBe(length);
		expect(strSubSet(seed, result)).toBe(true);
	});

	test('rndString returns a randomString based on the'
	+ ' given stringSeed', () => {
		retry(() => {
			const seed = rndValue(stringSeeds);
			const length = tRndBetween(0, 9);

			const result = rndString(length, seed);

			expect(strSubSet(seed, result)).toBe(true);
		});
	});

	test('count defaults to 8 and seed defaults to char', () => {
		const { char: seed } = stringSeeds;
		const defaultLength = 8;

		retry(() => {
			const result = rndString();

			expect(result.length).toBe(defaultLength);
			expect(strSubSet(seed, result)).toBe(true);
		});
	});

	test('ratio test', () => {
		const seed = 'abc';
		const length = 1;
		const retryCount = 50000;

		const results = retry(() => rndString(length, seed), retryCount);

		testRatios(results, getRatios(seed.split('')));
	});
});

describe('rndOfString returns a random sub-string of the given string.', () => {
	const retryCount = 50000;

	describe('count defaults to random value', () => {
		test('example', () => {
			const string = 'ab';

			const expected = ['', 'a', 'b', 'ab', 'ba'];

			const result = rndOfString(string);

			expect(result.length)
				.not.toBeGreaterThan(string.length);
			expect(expected.includes(result)).toBe(true);
		});

		test('randomized test', () => {
			const length = tRndBetween(0, 3);
			const seed = 'ab';
			const seedArray = tRndValues(seed.split(''), length);
			const seedStr = seedArray.join('');
			const possibleLengths = range(0, seedStr.length + 1);

			const results = retry(() => rndOfString(seedStr), retryCount);
			const resultsArray = map(results, (result) =>
				result.split(''));

			const resultLengths = map(resultsArray, (result) =>
				result.length);

			testRatios(resultLengths, getRatios(possibleLengths));
		});
	});

	describe('count is limited to the length of the source string', () => {
		test('example', () => {
			const string = 'abcd';
			const length = 8;

			const result = rndOfString(string, length);

			expect(result.length).toEqual(string.length);
			expect(strSubSet(string, result)).toBe(true);
		});

		test('randomized test', () => {
			retry(() => {
				const string = tRndString();
				const { length } = string;
				const result = rndOfString(string, length);

				expect(result.length).toEqual(string.length);
				expect(strSubSet(string, result)).toBe(true);
			});
		});
	});

	describe('returns the given count number of string when the string length'
	+ ' is longer than the given count', () => {
		test('example', () => {
			const string = 'abcd';
			const length = 2;

			const result = rndOfString(string, length);

			expectEquals(result.length, length);
			expectEquals(strSubSet(string, result), true);
		});

		test('randomized test', () => {
			retry(() => {
				const string = tRndString();
				const length = tRndBetween(0, string.length - 1);

				const result = rndOfString(string, length);

				expectEquals(result.length, length);
				expectEquals(strSubSet(string, result), true);
			});
		});
	});

	test('ratio test', () => {
		const seed = 'ab';
		const seedArray = tRndValues(seed.split(''), tRndBetween(0, 3));
		const seedStr = seedArray.join('');

		const results = retry(() => rndOfString(seedStr), retryCount);

		const resultsArray = map(results, (result) =>
			result.split(''));

		testRatios(resultsArray.flat(), getRatios(seedArray));
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
			const length = 2;

			const result = rndValues(iterable, length);

			expectEquals(contains(iterable, result), true);
			expectEquals(count(result), length);
		});

		test('randomized test', () => {
			const verifiers = {
				array: (iterable, result) => {
					expect(filter(result, unique)).toEqual(result);
					map(result, (value) => expect(has(iterable, value))
						.toEqual(true));
				},
				object: (iterable, result) => {
					expect(contains(iterable, result)).toEqual(true);
				},
			};

			retry(() => {
				const rndColl = rndCollection();
				const length = tRndBetween(0, count(rndColl) - 1);
				const rndCollType = inferType(rndColl);

				const result = rndValues(rndColl, length);

				expect(count(result)).toEqual(length);
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
			const length = 8;

			const result = tRndValues(iterable, length);

			expect(count(result)).toEqual(count(iterable));
		});

		test('randomized test', () => {
			retry(() => {
				const rndColl = rndCollection();
				const length = count(rndColl);
				const result = tRndValues(rndColl, length);

				expect(count(result)).toEqual(count(rndColl));
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

			const result = tRndValues(iterable);

			expect(count(result))
				.not.toBeGreaterThan(count(iterable));
		});

		test('randomized test', () => {
			const length = tRndBetween(0, 3);
			const rndColl = rndCollection(0, length);
			const possibleLengths = range(0, rndColl.length + 1);

			const results = retry(() => tRndValues(rndColl), retryCount);

			const resultLengths = map(results, (result) => result.length);

			testRatios(resultLengths, getRatios(possibleLengths));
		});
	});

	test('ratio test', () => {
		const rndColl = rndCollection(0, tRndBetween(0, 2));

		const results = retry(() => tRndValues(rndColl), retryCount);

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
