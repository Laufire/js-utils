/* Helpers */
import {
	map, merge, reduce, secure, shell, values,
} from '@laufire/utils/collection';
import { rndBetween, rndValue } from '@laufire/utils/random';
import {
	fixNumber, rndNested, rndCollection,
	retry, summarize, rndArray, rndDict, rndRange,
} from '../test/helpers';

/* Tested */
import {
	avg, count, flat, len, max,
	min, product, reducer, sum,
} from './reducers';

/* Spec */
describe('Reducers', () => {
	const getRndCollection = () =>
		secure(map(rndCollection(), () => rndBetween(-10, 10)));

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
				const collection = getRndCollection();
				let expected = 0;

				map(collection, (value) => (expected += value));

				const result = reduce(
					collection, sum, 0
				);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('product multiplies the given candidates', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const initial = 1;
			const expected = 6;

			const result = reduce(
				input, product, initial
			);

			expect(result).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = getRndCollection();
				let expected = 1;

				map(collection, (value) => (expected *= value));

				const result = reduce(
					collection, product, 1
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

			const result = reduce(
				input, len, initial
			);

			expect(result).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = getRndCollection();
				let expected = 0;

				map(collection, () => (expected += 1));

				const result = reduce(
					collection, len, 0
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
				const collection = getRndCollection();
				let total = 0;

				map(collection, (value) => (total += value));
				const expected = total / values(collection).length;

				const result = reduce(
					collection, avg, 0
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
				const collection = getRndCollection();
				const existing = rndValue(collection);
				const nonExistent = Math.max(...values(collection)) + 1;
				const summarized = summarize(collection);
				const expectations = [
					[existing, summarized[existing]],
					[nonExistent, 0],
				];

				map(expectations, ([value, expected]) =>
					expect(reduce(
						collection, count(value), 0
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
				const collection = getRndCollection();
				const minValue = Math.min(...values(collection));

				expect(reduce(collection, min)).toEqual(minValue);
				expect(reduce(
					collection, min, Infinity
				)).toEqual(minValue);
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
				const collection = getRndCollection();
				const maxValue = Math.max(...values(collection));

				expect(reduce(collection, max)).toEqual(maxValue);
				expect(reduce(
					collection, max, -Infinity
				)).toEqual(maxValue);
			});
		});
	});

	describe('reducer derives reducers from '
	+ 'relevant collection functions', () => {
		test('example', () => {
			const input = [
				{ a: 1, b: 2, c: 5 },
				{ a: 3, b: 4, d: 6 },
			];
			const expected = { a: 3, b: 4, c: 5, d: 6 };

			const result = reduce(
				input, reducer(merge), {}
			);

			expect(result).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const generator = rndValue([rndArray, rndDict]);
				const extensions = map(rndRange(), () => generator());
				const [base] = extensions;
				const expected = merge(shell(base), ...extensions);

				const result = reduce(
					extensions, reducer(merge), shell(base)
				);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('flat flattens the given array recursively', () => {
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
