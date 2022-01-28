/* Helpers */
import { contains, filter, shares, values,
	find, clone, shell,
	clean, select, keys, equals,
	secure, shuffle, omit, findIndex, map } from '@laufire/utils/collection';
import { rndValue, rndValues } from '@laufire/utils/random';
import { isolated, collection, extCollection, sortArray,
	rndKey, rndCollection, retry, rndDict,
	randomValues, arrayOrObject, rndNested } from '../test/helpers';
import { filter as tFilter } from './collection';

/* Tested */
import { isEqual, isSame, isPart, doesContain,
	truthy, falsy, everything, nothing,
	first, unique,
	not, or, and, onProp,
	predicate, isIn, value, key, is } from './predicates';

/* Helpers */

// eslint-disable-next-line no-shadow
const testIterator = ({ predicate, iterable, expectation }) =>
	expect(clean(filter(iterable, predicate))).toEqual(expectation);

// TODO: Remove post fixing the testHelpers.rndCollection.
const randomCollection = () => rndValue([values, (x) => x])(rndDict());

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

	describe('isEqual returns a predicate to test value equality'
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

	describe('isSame returns a predicate to test referential equality'
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

	test('is is an alias for isSame', () => {
		expect(is).toBe(isSame);
	});

	describe('isPart returns a predicate to test whether the tested object is'
	+ ' wholly contained in any of the elements', () => {
		test('example', () => {
			const taskToFind = { ...tasks[0], author: 'author' };

			expect(find(tasks, isPart(taskToFind))).toEqual(tasks[0]);
		});

		test('randomized test', () => {
			retry(() => {
				const haystack = rndNested(
					3, 3, ['nested']
				);
				const needle = rndValue(haystack);
				const extendedNeedle = { ...needle, ...rndDict() };
				const partialNeedle = randomValues(needle);

				expect(find(haystack, isPart(extendedNeedle))).toEqual(needle);
				expect(find(haystack, isPart(partialNeedle)))
					.toEqual(undefined);
			});
		});
	});

	describe('doesContain returns a predicate to test whether the'
	+ ' tested object is partially contained in any of the elements', () => {
		test('example', () => {
			const needle = { name: 'push' };
			const expectation = { name: 'push', effort: 3 };

			expect(find(tasks, doesContain(needle))).toEqual(expectation);
			expect(find(tasks, doesContain({ name: Symbol('name') })))
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
			expect([0, 1, 'a', null].filter(truthy)).toEqual([1, 'a']);
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
			// TODO: Replace with collections.filter post publishing.
			expect([0, 1, 'a', null].filter(falsy)).toEqual([0, null]);
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

	describe('first tests for the first occurrence of the element in '
	+ 'the collection', () => {
		test('example', () => {
			expect(['a', 'b', 'c', 'a'].filter(first)).toEqual(['a', 'b', 'c']);
			// TODO: Use imported filter post publishing.
			expect(tFilter({ a: 1, b: 2, c: 1, d: 2 }, first))
				.toEqual({ a: 1, b: 2 });
		});

		test('randomized test', () => {
			const haystack = rndCollection();
			const collectionKeys = keys(haystack);
			const randomKey = rndKey(haystack);
			const needle = haystack[randomKey];
			const index = findIndex(collectionKeys,
				isEqual(String(randomKey)));
			const keysToDuplicate = randomValues(collectionKeys
				.slice(index + 1));

			const modifiedHaystack = secure(map(haystack, (val, haystackKey) =>
				(keysToDuplicate.includes(haystackKey) ? needle : val)));
			const expectation = clean(omit(modifiedHaystack, keysToDuplicate));

			// TODO: Use imported filter post publishing.
			expect(tFilter(modifiedHaystack, first)).toEqual(expectation);
		});
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
				const iterable = randomCollection();
				const selector = rndKey(iterable);
				const needle = iterable[selector];
				// eslint-disable-next-line no-shadow
				const predicate = not(isEqual(needle));
				// TODO: Remove clean post publishing.
				const expectation = clean(omit(iterable, [selector]));

				testIterator({ predicate, iterable, expectation });
			});
		});
	});

	describe('and returns a predicate to test the candidates to pass'
	+ ' all the given predicates', () => {
		test('example', () => {
			const taskToFind = rndValue(tasks);
			// eslint-disable-next-line no-shadow
			const predicate = and(isSame(taskToFind), isEqual(taskToFind));
			const partialTasks = filter(tasks, not(isEqual(taskToFind)));

			expect(find(tasks, predicate)).toEqual(taskToFind);
			expect(find(partialTasks, predicate)).toEqual(undefined);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = randomCollection();
				const selector = rndKey(iterable);
				const needle = iterable[selector];
				// eslint-disable-next-line no-shadow
				const predicate = and(isEqual(needle), isSame(needle));
				const expectation = clean(select(iterable, [selector]));

				testIterator({ predicate, iterable, expectation });
			});
		});
	});

	describe('or returns a predicate to test the candidates to pass'
	+ ' at least one among multiple predicates', () => {
		test('example', () => {
			const taskToFind = tasks[1];
			// eslint-disable-next-line no-shadow
			const predicate = or(isSame(taskToFind),
				isEqual(Symbol('additionalTask')));
			const partialTasks = filter(tasks, not(isEqual(taskToFind)));

			expect(find(tasks, predicate)).toEqual(taskToFind);
			expect(find(partialTasks, predicate)).toEqual(undefined);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = randomCollection();
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

	describe('onProp returns a predicate to test the given prop across'
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
				const haystack = rndNested(
					3, 3, ['nested']
				);
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
					3, 3, ['nested', 'object', 'array']
				);
				const needle = rndValue(haystack);
				const predicateFn = predicate(
					shares, needle, rndKey(needle)
				);

				expect(find(haystack, predicateFn)).toEqual(needle);
			});
		});
	});

	describe('isIn returns a predicate to check for a given values'
	+ ' in collections', () => {
		test('example', () => {
			const iterable = [...tasks, { name: 'rebase', effort: 3 }];

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
			expect(find(cart, key(isEqual('price')))).toEqual(100);
		});

		test('randomized test', () => {
			retry(() => {
				const haystack = rndCollection();
				// TODO: Remove String function post publishing.
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

			expect(find(cart, value(isEqual('apple')))).toEqual('apple');
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
