/* Helpers */
import {
	secure, values, keys,
	reduce, map, findKey,
	shell, merge, filter, find, findIndex,
} from '@laufire/utils/collection';
import { rndBetween, rndValue, rndValues } from '@laufire/utils/random';
import { isDefined } from '@laufire/utils/reflection';
import { isProbable } from './prob';
import {
	rndNested, retry, similarCols,
	rndKeys, rndCollection,
} from '../test/helpers';

/* Tested */
import {
	descend, index, summarize,
	transpose, group, classify,
} from './crunch';

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

		isDefined(currentKey)
			? map(currentLevel, (child, key) => testIndex(
				child, merge(
					shell(currentIndex), currentIndex, { [currentKey]: key }
				), rest,
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
				const data = similarCols();
				const indexKeys = rndKeys(rndValue(data));

				const indexed = index(data, indexKeys);

				testIndex(
					indexed, shell(data[0]), indexKeys, verifyIndexed, data
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
				const data = similarCols();
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
				retry(() => {
					const similarCol = rndNested(
						3, 3, ['nested', rndValue(['array', 'object'])]
					);
					const arrayOfObjects = values(rndNested(
						3, 3, ['nested', 'object']
					));
					const input = rndValue([similarCol, arrayOfObjects]);

					const testTransposed = (base, result) => {
						const levelOneKeys = keys(base);
						const levelTwoKeys = reduce(
							base, (acc, child) =>
								[
									...acc,
									...filter(keys(child), (childKey) =>
										!acc.includes(childKey)),
								],
							[]
						);

						map(levelOneKeys, (levelOneKey) =>
							map(levelTwoKeys, (levelTwoKey) => {
								expect(base[levelOneKey][levelTwoKey])
									.toEqual(result[levelTwoKey][levelOneKey]);
							}));
					};

					const transposed = transpose(input);

					testTransposed(input, transposed);
					testTransposed(transposed, input);
				});
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

				map(data, expect(mockGrouper).toHaveBeenCalledWith);
				map(expected, ([key, item]) => {
					expect(grouped[key].includes(item)).toEqual(true);
				});
			});
		});
	});

	// TODO: Give a separate example to show collection will be classified on the first satisfied classifier as priority.
	// TODO: Description can be written better for test.

	describe('classify classifies the given collection based on classifiers',
		() => {
			describe('example', () => {
				test('object of objects', () => {
					const classifiers = {
						densePopulation: ({ population }) =>
							population > 500000,
						sparsePopulation: ({ population }) =>
							population > 300000,
						lowPopulation: () => true,
					};

					const asia = {
						population: 700000,
						country: 'india',
					};
					const africa = {
						population: 200000,
						country: 'algeria',
					};
					const europe = {
						population: 300000,
						country: 'albania',
					};
					const america = {
						population: 500000,
						country: 'mexico',
					};

					const populations = { asia, africa, europe, america };

					const result = {
						densePopulation: { asia },
						sparsePopulation: {	america },
						lowPopulation: { africa, europe },
					};

					expect(classify(populations, classifiers)).toEqual(result);
				});
				test('array of objects', () => {
					const classifiers = {
						adult: (person) => person.age > 19,
						teen: (person) => person.age > 12,
						child: (person) => person.age > 4,
						toddler: () => true,
					};
					const personOne = { name: 'a', age: 20 };
					const personTwo = { name: 'b', age: 10 };
					const personThree = { name: 'c', age: 2 };
					const personFour = { name: 'd', age: 14 };
					const people = [
						personOne, personTwo, personThree, personFour,
					];

					const result = classify(people, classifiers);

					expect(result.adult[0]).toEqual(personOne);
					expect(result.child[1]).toEqual(personTwo);
					expect(result.toddler[2]).toEqual(personThree);
					expect(result.teen[3]).toEqual(personFour);
				});
			});

			// TODO: use rndValues with count as dynamic, instead of isProbable.

			describe('randomized test', () => {
				test('Randomized test', () => {
					retry(() => {
						const collection = rndCollection();
						const classifiersBase = rndCollection();
						const classifierKeys = keys(classifiersBase);

						const randomSelection = reduce(
							collection,
							(
								acc, item, key,
							) => {
								isProbable(0.8) && (acc[key] = item);
								return acc;
							},
							shell(collection),
						);

						const baseCollection = map(randomSelection,
							(value, key) =>
								({
									key: key,
									value: value,
									rndClassifyKeys: rndValues(classifierKeys),
								}));

						const classifiers = map(classifiersBase,
							(val, orgClassifierKey) => (orgValue, orgKey) =>
								!!find(baseCollection, ({
									key, value, rndClassifyKeys,
								}) => (value === orgValue)
								&& (key === orgKey)
								&& rndClassifyKeys.includes(orgClassifierKey)));

						const expected = map(classifiersBase,
							() => shell(collection));

						map(baseCollection, ({ key, value }) => {
							const predicted = findIndex(classifiers,
								(classifier) => classifier(value, key));

							isDefined(predicted)
								&& (expected[predicted][key] = value);
						});

						const result = classify(collection, classifiers);

						expect(result).toEqual(expected);
					});
				});
			});
		});
});
