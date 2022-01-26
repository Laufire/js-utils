/* Helpers */
import { secure, values, keys, reduce, map, findKey }
	from '@laufire/utils/collection';
import { rndBetween, rndString, rndValue }
	from '@laufire/utils/random';
import {
	rndNested, retry, similarCols, rndKeys, rndCollection, convertKey,
} from '../test/helpers';
/* Tested */
import { descend, index, summarize, transpose, group } from './crunch';
import { isDefined } from '@laufire/utils/reflection';

/* Spec */
describe('Crunch', () => {
	/* Helpers */

	const getMatcher = (acc) => (item) =>	{
		const itemIndex = findKey(acc, (val, key) =>	(
			val !== 'undefined'
				? val !== item[key]
				: item.hasOwnProperty(key)
		));

		return !isDefined(itemIndex);
	};

	const testIndex = (
		currentLevel, currentIndex, currentKeys, verify, data
	) => {
		const [currentKey, ...rest] = currentKeys;

		currentKey
			? map(currentLevel, (child, key) => testIndex(
				child, { ...currentIndex, [currentKey]: key }, rest,
				verify, data
			))
			:	verify(
				currentLevel, currentIndex, data
			);
	};

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

		test('randomized test', () => {
			const verifyIndexed = (
				result, acc, data
			) => {
				const expected = values(data).filter(getMatcher(acc));

				expect(result).toEqual(expected);
			};

			retry(() => {
				// TODO: Revert iterables to use Symbols after fixing collection.keys.
				const data = map(similarCols(), (collection) =>
					map(collection, () => rndString()));
				const indexKeys = rndKeys(rndValue(data));

				const indexed = index(data, indexKeys);

				testIndex(
					indexed, {}, indexKeys, verifyIndexed, data
				);
			});
		});
	});

	describe('summarize summarizes the given collection'
	+ ' and builds an index on the given keys', () => {
		test('example', () => {
			const summarizer = (acc, { cost }) => acc + cost;
			const indexKeys = ['category', 'item'];
			const data = secure([
				{ item: 'apple', category: 'fruit', cost: 2 },
				{ item: 'burger', category: 'snack', cost: 1 },
				{ item: 'burger', category: 'snack', cost: 2 },
			]);
			const expected = {
				fruit: {
					apple: 2,
				},
				snack: {
					burger: 3,
				},
			};

			const result = summarize(
				data, indexKeys, summarizer, 0
			);

			expect(result).toEqual(expected);
		});

		test('randomized test', () => {
			const summarizer = (acc, item) => acc.concat(item);
			const initial = [];
			const verifySummarized = (
				result, acc, data
			) => {
				const filtered = values(data).filter(getMatcher(acc));
				const expected = filtered.reduce(summarizer, initial);

				expect(result).toEqual(expected);
			};

			retry(() => {
				const data = map(similarCols(), (collection) =>
					map(collection, () => rndString()));
				const indexKeys = rndKeys(rndValue(data));

				const summarized = summarize(
					data, indexKeys, summarizer, initial
				);

				testIndex(
					summarized, {}, indexKeys, verifySummarized, data
				);
			});
		});
	});

	describe('descend descends into the given collection'
	+ ' upto the given level and executes the given process'
	+ ' and returns a new collection', () => {
		test('example', () => {
			const elmOne = { price: 10, tax: 2 };
			const elmTwo = { price: 20, tax: 3 };
			const data = secure([elmOne, elmTwo]);
			const increase = (val) => val + 1;
			const expected = [{ price: 11, tax: 3 }, { price: 21, tax: 4 }];

			const result = descend(
				data, increase, 1
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

	describe('groups the given collection according to given grouper', () => {
		test('example', () => {
			const taskOne = { task: 'bugFix', priority: 1 };
			const taskTwo = { task: 'feature', priority: 2 };
			const data = [taskOne, taskTwo];
			const grouper = ({ priority }) =>
				(priority === 1 ? 'urgent' : 'trivial');
			const expected = {
				urgent: [taskOne],
				trivial: [taskTwo],
			};

			const result = group(data, grouper);

			expect(result).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const data = rndCollection();
				const a = Symbol('groupA');
				const b = Symbol('groupB');
				const indexKeys = [a, b];
				const expected = [];
				const mockGrouper = jest.fn().mockImplementation((item) => {
					const key = rndValue(indexKeys);

					expected.push([key, item]);

					return key;
				});

				const grouped = group(data, mockGrouper);

				// TODO: Use map instead of reduce post publishing.
				reduce(
					data, (
						acc, item, key, collection
					) => {
						expect(mockGrouper).toHaveBeenCalledWith(
							item, convertKey(collection, key), collection
						);
					}, {}
				);
				map(expected, ([key, item]) => {
					expect(grouped[key].includes(item)).toEqual(true);
				});
			});
		});
	});
});
