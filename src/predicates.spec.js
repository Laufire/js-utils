/* Helpers */
import { contains, filter, shares, map, values,
	find, clone, shell, omit,
	clean, select, keys, equals,
	secure, shuffle } from '@laufire/utils/collection';
import { rndValue, rndValues } from '@laufire/utils/random';
import {
	isolated, collection, extCollection, sortArray,
	rndKey, rndCollection, retry, rndDict,
	rndArray, randomValues, arrayOrObject, rndNested,
} from '../test/helpers';

/* Tested */
import { isEqual, isSame, isPart, doesContain,
	truthy, falsy, everything, nothing,
	first, unique,
	not, or, and, onProp,
	predicate, isIn, value, key, is } from './predicates';

/* Helpers */

const rndCollections = (minCount, maxCount) =>
	map(rndCollection(minCount, maxCount), () =>
		rndValue([rndDict, rndArray])());

// eslint-disable-next-line no-shadow
const testIterator = ({ predicate, iterable, expectation }) =>
	expect(clean(filter(iterable, predicate))).toEqual(expectation);

/* Spec */
describe('Predicates', () => {
	const truthies = [1, '2', true, [], {}];
	const falsies = [0, '', false, undefined, null];
	const tAndFArray = secure(shuffle(truthies.concat(falsies)));
	const tasks = [
		{ name: 'commit', effort: 1 },
		{ name: 'commit', effort: 2 },
		{ name: 'push', effort: 3 },
	];

	describe('isEqual returns a function to test value equality'
	+ ' between the candidates.', () => {
		test('example', () => {
			const taskToFind = { name: 'commit', effort: 1 };

			expect(find(tasks, isEqual(taskToFind))).toEqual(taskToFind);
		});

		test('randomized test', () => {
			retry(() => {
				const haystack = rndCollection();
				const needle = clone(rndValue(haystack));

				expect(find(haystack, isEqual(needle))).toEqual(needle);
			});
		});
	});

	describe('isSame returns a function to test referential equality'
	+ ' between the candidates', () => {
		test('example', () => {
			const taskToFind = tasks[0];

			expect(find(tasks, isSame(taskToFind))).toEqual(taskToFind);
		});

		test('randomized test', () => {
			retry(() => {
				const haystack = rndCollection();
				const needle = rndValue(haystack);

				expect(find(haystack, isSame(needle))).toEqual(needle);
			});
		});
	});

	test('is, an alias for isSame', () => {
		expect(is).toBe(isSame);
	});

	describe('isPart returns a function to test whether the tested object is'
	+ ' wholly contained in any of the elements', () => {
		test('example', () => {
			const taskToFind = { ...tasks[0], ...rndDict() };

			expect(find(tasks, isPart(taskToFind))).toEqual(tasks[0]);
		});

		test('randomized test', () => {
			retry(() => {
				const haystack = rndCollections(3, 5);
				const needle = rndValue(haystack);
				const maxData = { ...needle, ...rndDict() };
				const minData = rndValue(needle);

				expect(find(haystack, isPart(maxData))).toEqual(needle);
				expect(find(haystack, isPart(minData))).toEqual(undefined);
			});
		});
	});

	describe('doesContain returns a function to test whether the'
	+ ' tested object is partially contained in'
	+ ' any of the elements', () => {
		test('example', () => {
			const needle = { name: 'push' };
			const expectation = { name: 'push', effort: 3 };

			expect(find(tasks, doesContain(needle))).toEqual(expectation);
			expect(find(tasks, doesContain({ [Symbol]: Symbol })))
				.toEqual(undefined);
		});

		test('randomized test', () => {
			retry(() => {
				const haystack = rndNested(
					3, 3, ['object']
				);
				const expectation = rndValue(haystack);
				const needle = randomValues(expectation);

				expect(find(haystack, doesContain(needle)))
					.toEqual(expectation);
			});
		});
	});

	describe('truthy tests for truthy values', () => {
		test('example', () => {
			// TODO: Replace with collections.filter post publishing.
			expect(tasks.filter(truthy)).toEqual(tasks);
		});

		test('randomized test', () => {
			retry(() => {
				const tAndFIterable = arrayOrObject(tAndFArray);
				const fIterable = arrayOrObject(falsies);

				expect(sortArray(values(filter(tAndFIterable, truthy))))
					.toEqual(sortArray(truthies));
				expect(filter(fIterable, truthy)).toEqual(shell(fIterable));
			});
		});
	});

	describe('falsy tests for falsy values', () => {
		test('example', () => {
			const dirtyTasks = [...tasks, ...falsies];

			// TODO: Replace with collections.filter post publishing.
			expect(dirtyTasks.filter(falsy)).toEqual(falsies);
		});

		test('randomized test', () => {
			retry(() => {
				const tAndFIterable = arrayOrObject(tAndFArray);
				const tIterable = arrayOrObject(truthies);

				expect(sortArray(values(filter(tAndFIterable, falsy))))
					.toEqual(sortArray(falsies));
				expect(filter(tIterable, falsy)).toEqual(shell(tIterable));
			});
		});
	});

	describe('everything allows everything through the filter', () => {
		test('example', () => {
			expect(filter(tasks, everything)).toEqual(tasks);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = rndCollection();

				expect(filter(iterable, everything)).toEqual(iterable);
			});
		});
	});

	describe('nothing allows nothing through the filter', () => {
		test('example', () => {
			expect(filter(tasks, nothing)).toEqual([]);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = rndCollection();

				expect(filter(iterable, nothing)).toEqual(shell(iterable));
			});
		});
	});

	test('first tests for the first occurrence of the element in '
	+ 'the collection.', () => {
		expect(truthies.concat(truthies).filter(first)).toEqual(truthies);
	});

	test('unique is an alias of first.', () => {
		expect(unique).toBe(first);
	});

	describe('not returns the inverse of the given predicate', () => {
		test('example', () => {
			// eslint-disable-next-line no-shadow
			const predicate = not(isEqual({ name: 'commit', effort: 1 }));
			const expectation = [
				{ name: 'commit', effort: 2 },
				{ name: 'push', effort: 3 },
			];

			// TODO: Remove clean post publishing.
			expect(clean(filter(tasks, predicate))).toEqual(expectation);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = rndCollection();
				const selector = rndKey(iterable);
				const needle = iterable[selector];
				// eslint-disable-next-line no-shadow
				const predicate = not(isSame(needle));
				// TODO: Remove clean post publishing.
				const expectation = clean(omit(iterable, [selector]));

				testIterator({ predicate, iterable, expectation });
			});
		});
	});

	describe('and returns a function to test the candidates to pass'
	+ ' all the given predicates.', () => {
		test('example', () => {
			const taskToFind = rndValue(tasks);
			// eslint-disable-next-line no-shadow
			const predicate = and(isSame(taskToFind), isEqual(taskToFind));
			const iterable = rndCollection();

			expect(find(tasks, predicate)).toEqual(taskToFind);
			expect(find(iterable, predicate)).toEqual(undefined);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = rndCollection();
				const selector = rndKey(iterable);
				const needle = iterable[selector];
				// eslint-disable-next-line no-shadow
				const predicate = and(isEqual(needle), isSame(needle));
				const expectation = clean(select(iterable, [selector]));

				testIterator({ predicate, iterable, expectation });
			});
		});
	});

	describe('or returns a function to test the candidates to pass'
	+ ' at least one among multiple predicates.', () => {
		test('example', () => {
			const arr = [0, 1];
			const needle = arr[1];

			expect(find(arr, or(isSame(needle), isEqual(Symbol))))
				.toEqual(needle);
			expect(find(arr, or(isSame(Symbol), isEqual(Symbol))))
				.toEqual(undefined);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = rndCollection();
				const selector = rndValues(keys(iterable), 2);
				const needleOne = iterable[selector[0]];
				const needleTwo = iterable[selector[1]];
				// eslint-disable-next-line no-shadow
				const predicate = or(isSame(needleOne), isSame(needleTwo));
				const expectation = clean(select(iterable, selector));

				testIterator({ predicate, iterable, expectation });
			});
		});
	});

	describe('onProp returns a function to test the given prop across'
	+ ' candidates of a collection', () => {
		test('example', () => {
			const prop = 'name';
			const taskToFind = 'push';
			// eslint-disable-next-line no-shadow
			const predicate = onProp(prop, isEqual(taskToFind));
			const expectation = { name: 'push', effort: 3 };

			expect(find(tasks, predicate)).toEqual(expectation);
		});

		test('randomized test', () => {
			retry(() => {
				const haystack = rndCollections(3, 4);
				const expectation = rndValue(haystack);
				const prop = rndKey(expectation);
				const needle = expectation[prop];

				expect(find(haystack, onProp(prop, isEqual(needle))))
					.toEqual(expectation);
			});
		});
	});

	describe('generators pass all available arguments'
	+ ' to the given predicates', () => {
		const childCollection = rndValue(collection);
		const childKey = rndKey(childCollection);
		const generators = {
			and, or, not,
		};
		const mockPredicate = jest.fn();

		test.each(values(generators))('testing the generator: %s for args',
			(generator) => {
				const args = [
					childCollection[childKey],
					childKey,
					childCollection,
				];

				filter(childCollection, generator(mockPredicate));

				expect(mockPredicate).toHaveBeenCalledWith(...args);
			});

		test('the generator onProp passes args properly', () => {
			const mockCollection = { [childKey]: childCollection };
			const prop = rndKey(childCollection);
			const args = [childCollection[prop], childKey, mockCollection];

			filter(mockCollection, onProp(prop, mockPredicate));

			expect(mockPredicate).toHaveBeenCalledWith(...args);
		});
	});

	describe('predicate derives predicates from relevant'
	+ ' collection functions', () => {
		test('example', () => {
			const taskToFind = tasks[1];

			expect(find(tasks, predicate(equals, taskToFind)))
				.toEqual(taskToFind);
			expect(find(tasks, predicate(contains, taskToFind)))
				.toEqual(taskToFind);
		});

		test('detailed example', () => {
			const mockCollection = { ...extCollection, isolated };

			expect(filter(mockCollection, predicate(
				shares, isolated, rndKey(isolated)
			))).toEqual({ isolated });
		});

		test('randomized test', () => {
			retry(() => {
				const haystack = rndNested(
					3, 3, ['object']
				);
				const needle = rndValue(haystack);

				expect(find(haystack, predicate(
					shares, needle, rndKey(needle)
				))).toEqual(needle);
			});
		});
	});

	describe('isIn returns a predicate to check for a given values'
	+ ' in collections', () => {
		test('example', () => {
			const iterable = [...tasks, Symbol('')];

			expect(filter(iterable, isIn(tasks))).toEqual(tasks);
		});

		test('randomized test', () => {
			const iterable = rndCollection();
			const needle = randomValues(iterable);

			// TODO: Remove clean post publishing.
			expect(clean(filter(iterable, isIn(needle)))).toEqual(needle);
		});
	});

	describe('key passes the keys of iterated iterables'
	+ ' to the given predicate', () => {
		test('example', () => {
			const cart = {
				item: 'apple',
				price: 100,
			};

			expect(find(cart, key(isEqual('item')))).toEqual('apple');
		});

		test('randomized test', () => {
			retry(() => {
				const haystack = rndCollection();
				const needle = String(rndKey(haystack));
				const expectation = haystack[needle];

				expect(find(haystack, key(isEqual(needle))))
					.toEqual(expectation);
			});
		});
	});

	describe('value passes the values of iterated iterables'
	+ ' to the given predicate', () => {
		test('example', () => {
			const cart = {
				item: 'apple',
				price: 100,
			};

			expect(find(cart, value(isEqual(100)))).toEqual(100);
		});

		test('randomized test', () => {
			retry(() => {
				const haystack = rndCollection();
				const needle = rndValue(haystack);

				expect(find(haystack, value(isEqual(needle)))).toEqual(needle);
			});
		});
	});
});
