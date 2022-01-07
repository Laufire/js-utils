/* Helpers */
import { secure, values, keys, reduce, map, contains, clean, findKey, equals, filter }
	from '@laufire/utils/collection';
import { rndBetween, rndValue, rndValues } from '@laufire/utils/random';
import { rndNested, retry, similarCols } from '../test/helpers';
/* Tested */
import { descend, index, summarize, transpose } from './crunch';
import { isDefined } from '@laufire/utils/reflection';

const sum = (...numbers) => numbers.reduce((t, c) => t + c, 0);
const failedCases = [];

/* Spec */
describe('Crunch', () => {
	/* Mocks and Stubs */

	describe('index builds an index for the given collection'
	+ ' on the given keys of the children to help with retrieval', () => {
		test('example', () => {
			const taskOne = { task: 'bug', priority: 'important' };
			const taskTwo = { task: 'feature', priority: 'normal' };
			const taskThree = { task: 'refactoring', priority: 'normal' };
			const tasks = secure([taskTwo, taskThree, taskOne]);

			const taskIndex = index(tasks, ['task']);
			const priorityIndex = index(tasks, ['priority']);
			const multiIndex = index(tasks, ['task', 'priority']);

			/* eslint-disable dot-notation */
			expect(taskIndex['bug']).toEqual([taskOne]);
			expect(priorityIndex['normal']).toEqual([taskTwo, taskThree]);
			expect(multiIndex['feature']['normal']).toEqual([taskTwo]);
			expect(multiIndex['feature']['important']).toEqual(undefined);
			/* eslint-enable dot-notation */
		});

		test('temp', () => {
			retry(() => {
				const iterable = similarCols(1, 2);
				const randomKeys = keys(rndValue(iterable));
				const indexKeys = rndValues(randomKeys, rndBetween(1, 3));

				const result = index(iterable, indexKeys);

				try {
					const testIndex = (
						currentLevel, currentIndex, currentKeys
					) => {
						const [currentKey, ...rest] = currentKeys;

						const debug = () => {
							const filtered = filter(iterable, (item) =>	{
								const itemIndex = findKey(currentIndex, (val, key) => (val !== 'undefined'
									? val !== item[key]
									: item.hasOwnProperty(key)));

								return !isDefined(itemIndex);
							});

							const find = equals(currentLevel, filtered);

							expect(find).toEqual(true);
						};

						// eslint-disable-next-line no-unused-expressions
						currentKey
							? map(currentLevel, (child, key) => testIndex(
								child, { ...currentIndex, [currentKey]: key }, rest
							))
							:	debug();
					};

					testIndex(
						result, {}, indexKeys
					);
				}
				catch (err) {
					const testIndex = (
						currentLevel, currentIndex, currentKeys
					) => {
						const [currentKey, ...rest] = currentKeys;

						const debug = () => {
							const filtered = filter(iterable, (item) =>	{
								const itemIndex = findKey(currentIndex, (val, key) => (val !== 'undefined'
									? val !== item[key]
									: item.hasOwnProperty(key)));

								return !isDefined(itemIndex);
							});

							const find = equals(currentLevel, filtered);

							expect(find).toEqual(true);
						};

						// eslint-disable-next-line no-unused-expressions
						currentKey
							? map(currentLevel, (child, key) => testIndex(
								child, { ...currentIndex, [currentKey]: key }, rest
							))
							:	debug();
					};

					testIndex(
						result, {}, indexKeys
					);
				}
			}, 1000);
		});
	});

	describe('summarize summarizes the given collection'
	+ ' and builds an index on the given keys', () => {
		test('example', () => {
			const elmOne = { price: 10, tax: 2 };
			const elmTwo = { price: 20, tax: 3 };
			const iterable = secure([elmOne, elmTwo]);
			const summarizer = (item) => sum(...values(item));
			const indexKeys = ['price', 'tax'];
			const expected = {
				10: {
					2: 12,
				},
				20: {
					3: 23,
				},
			};

			const result = summarize(
				iterable, summarizer, indexKeys
			);

			expect(result).toEqual(expected);
		});
	});

	describe('descend descends into the given collection'
	+ ' upto the given level and executes the given process'
	+ ' and returns a new collection', () => {
		test('example', () => {
			const elmOne = { price: 10, tax: 2 };
			const elmTwo = { price: 20, tax: 3 };
			const iterable = secure([elmOne, elmTwo]);
			const increase = (val) => val + 1;
			const expected = [{ price: 11, tax: 3 }, { price: 21, tax: 4 }];

			const result = descend(
				iterable, increase, 1
			);

			expect(result).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const marker = Symbol('marker');
				const depth = rndBetween(1, 3);
				const level = rndBetween(1, depth);
				const process = (value) => [value, marker];
				const source = rndNested(
					depth + 1, 1, ['nested']
				);

				const result = descend(
					source, process, level
				);

				const testDescend = (
					output, input, currentLevel
				) => {
					map(output, (value, key) => {
						currentLevel
							? testDescend(
								value, input[key], currentLevel - 1
							)
							: expect(value).toEqual([input[key], marker]);
					});
				};

				testDescend(
					result, source, level
				);
			});
		});
	});

	describe('transpose swaps the first two levels'
	+ ' of the given collection', () => {
		describe('examples', () => {
			test('transpose can transpose objects', () => {
				const input = {
					India: {
						population: 1380,
						status: 'developing',
					},
					UnitedStates: {
						population: 330,
						status: 'developed',
					},
					UnitedKingdom: {
						population: 70,
						status: 'developed',
						regent: 'Elizabeth',
					},
				};
				const transposed = {
					population: {
						India: 1380,
						UnitedStates: 330,
						UnitedKingdom: 70,
					},
					status: {
						India: 'developing',
						UnitedStates: 'developed',
						UnitedKingdom: 'developed',
					},
					regent: {
						UnitedKingdom: 'Elizabeth',
					},
				};

				expect(transpose(input)).toEqual(transposed);
				expect(transpose(transposed)).toEqual(input);
			});

			test('transpose can transpose arrays', () => {
				const input = [
					['a', 1],
					['b', 2],
					['c', 3],
				];
				const transposed = [
					['a', 'b', 'c'],
					[1, 2, 3],
				];

				expect(transpose(input)).toEqual(transposed);
				expect(transpose(transposed)).toEqual(input);
			});
		});

		describe('randomized test', () => {
			test('transpose can transpose objects & arrays', () => {
				const input = rndNested(
					3, 3, ['nested']
				);

				const testTransposed = (base, result) => {
					const levelOneKeys = keys(base);
					const levelTwoKeys = reduce(
						base, (acc, child) =>
							[
								...acc,
								// TODO: Use collections.filter after publishing.
								...keys(child).filter((childKey) =>
									!acc.includes(childKey)),
							],
						[]
					);

					map(levelOneKeys, (levelOneKey) =>
						map(levelTwoKeys, (levelTwoKey) =>
							expect(base[levelOneKey][levelTwoKey])
								.toEqual(result[levelTwoKey][levelOneKey])));
				};

				const transposed = transpose(input);

				testTransposed(input, transposed);
				testTransposed(transposed, input);
			});
		});
	});
});
