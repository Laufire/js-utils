/* Helpers */
import { map, merge,
	reduce, shell, values } from '@laufire/utils/collection';
import { rndBetween, rndValue } from '@laufire/utils/random';
import { extension, fixNumber, rndNested, rndCollection, retry, summarize }
	from '../test/helpers';

/* Tested */
import { avg, count, flat, len, max, min, product, reducer, sum }
	from './reducers';

/* Spec */
describe('Reducers', () => {
	const getRndCollection = () => {
		const rndColl = rndCollection();
		const randomCollection = shell(rndColl);

		map(rndColl, (dummy, key) => {
			randomCollection[key] = rndBetween(-10, 10);
		});

		return randomCollection;
	};

	describe('sum sums the given candidates', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const initial = 0;
			const expected = 6;

			const result = reduce(
				input, sum, initial
			);

			expect(result).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const randomCollection = getRndCollection();
				let expected = 0;

				map(randomCollection, (value) => (expected += value));

				const result = reduce(
					randomCollection, sum, 0
				);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('product multiples the given candidates', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const initial = 1;
			const expected = 6;

			expect(reduce(
				input, product, initial
			)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const randomCollection = getRndCollection();
				let expected = 1;

				map(randomCollection, (value) => (expected *= value));

				const result = reduce(
					randomCollection, product, 1
				);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('length returns the length of the given collection', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const initial = 0;
			const expected = 3;

			expect(reduce(
				input, len, initial
			)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const randomCollection = getRndCollection();
				let expected = 0;

				map(randomCollection, () => (expected += 1));

				const result = reduce(
					randomCollection, len, 0
				);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('avg computes the average of the given candidates', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const initial = 0;
			const expected = 2;

			const result = reduce(
				input, avg, initial
			);

			expect(result).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const randomCollection = getRndCollection();
				let total = 0;

				map(randomCollection, (value) => (total += value));
				const expected = total / values(randomCollection).length;

				const result = reduce(
					randomCollection, avg, 0
				);

				expect(fixNumber(Math.abs(result)))
					.toEqual(fixNumber(Math.abs(expected)));
			});
		});
	});

	describe('count returns the number of occurrences of the given counted'
	+ ' among the given candidates', () => {
		test('example', () => {
			const input = [1, 2, 3, 1, 1, 1];
			const initial = 0;
			const expected = 4;

			const result = reduce(
				input, count(1), initial
			);

			expect(result).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const randomCollection = getRndCollection();
				const existing = rndValue(randomCollection);
				const nonExistent = Math.max(...values(randomCollection)) + 1;
				const summarized = summarize(randomCollection);
				const expectations = [
					[existing, summarized[existing]],
					[nonExistent, 0],
				];

				map(expectations, ([value, expected]) =>
					expect(reduce(
						randomCollection, count(value), 0
					)).toEqual(expected));
			});
		});
	});

	describe('min finds the smallest of the given candidates', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const expected = 1;

			expect(reduce(input, min)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const randomCollection = getRndCollection();
				const minValue = Math.min(...values(randomCollection));

				expect(reduce(randomCollection, min)).toEqual(minValue);
				expect(reduce(
					randomCollection, min, minValue - 1
				)).toEqual(minValue - 1);
			});
		});
	});

	describe('max finds the largest of the given candidates', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const expected = 3;

			expect(reduce(input, max)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const randomCollection = getRndCollection();
				const maxValue = Math.max(...values(randomCollection));

				expect(reduce(randomCollection, max)).toEqual(maxValue);
				expect(reduce(
					randomCollection, max, maxValue + 1
				)).toEqual(maxValue + 1);
			});
		});
	});

	describe('reducer derives reducers from '
	+ 'relevant collection functions', () => {
		test('example', () => {
			const input = [
				{
					a: 1, b: 2,
				},
				{
					a: 3, b: 4, c: 5,
				},
			];
			const expected = { a: 3, b: 4, c: 5 };

			const result = reduce(
				input, reducer(merge), {}
			);

			expect(result).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const randomCollection = getRndCollection();
				const expected = merge(
					{}, randomCollection, extension
				);

				const result = reduce(
					[randomCollection, extension], reducer(merge), {}
				);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('flat flattens the given collection recursively', () => {
		test('example', () => {
			const nestedArray = [1, 2, [3, [4]]];
			const expectation = [1, 2, 3, 4];

			const result = reduce(
				nestedArray, flat, []
			);

			expect(result).toEqual(expectation);
		});

		test('randomized test', () => {
			retry(() => {
				const nestedArray = rndNested(
					3, 3, ['nested', 'array']
				);
				const expectation = nestedArray.flat(Infinity);

				const result = reduce(
					nestedArray, flat, []
				);

				expect(result).toEqual(expectation);
			});
		});
	});
});
