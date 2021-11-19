/* Helpers */
import { contains, filter, shares, map, values, has, dict } from
	'@laufire/utils/collection';
import { rndValue, rndValues } from '@laufire/utils/random';
import {
	array, object, cloned, extension, extended, isolated,
	collection, extendedCollection, sortArray,
	contracted, rndKey, ecKeys,
} from '../test/helpers';
import { secure, shuffle } from './collection';
import { keys, rndBetween } from './lib';

/* Tested */
import { isEqual, isSame, isPart, doesContain,
	truthy, falsy, everything, nothing,
	first, unique,
	not, or, and, onProp,
	predicate, isIn, value, key } from './predicates';

/* Spec */
describe('Predicates', () => {
	const truthies = [1, '2', true, [], {}];
	const falsies = [0, '', false, undefined, null];
	const tAndFArray = secure(shuffle(truthies.concat(falsies)));

	test('isEqual returns a function to test value equality'
		+ ' between the candidates.', () => {
		expect(filter(collection, isEqual(object))).toEqual(collection);
	});

	test('isSame returns a function to test referential equality'
		+ ' between the candidates', () => {
		expect(filter(collection, isSame(collection.object)).object)
			.toBe(collection.object);
	});

	test('isPart returns a function to test whether the tested object is'
		+ ' wholly contained in any of the elements', () => {
		expect(filter(collection, isPart(extended))).toEqual(collection);
		expect(filter(collection, isPart(isolated))).toEqual({});
	});

	test('doesContain returns a function to test whether the tested object is'
		+ 'partially contained in any of the elements', () => {
		expect(filter(collection, doesContain(contracted)))
			.toEqual(collection);
		expect(filter(collection, doesContain(isolated)))
			.toEqual({});
	});

	test('truthy tests for truthy values', () => {
		expect(sortArray(tAndFArray.filter(truthy)))
			.toEqual(sortArray(truthies));
		expect(sortArray(falsies.filter(truthy))).toEqual([]);
	});

	test('falsy tests for falsy values', () => {
		expect(sortArray(tAndFArray.filter(falsy)))
			.toEqual(sortArray(falsies));
		expect(sortArray(truthies.filter(falsy))).toEqual([]);
	});

	test('everything allows everything through the filter.', () => {
		expect(sortArray(tAndFArray.filter(everything)))
			.toEqual(sortArray(tAndFArray));
	});

	test('nothing allows nothing through the filter.', () => {
		expect(sortArray(tAndFArray.filter(nothing))).toEqual([]);
	});

	test('first tests for the first occurrence of the element in '
	+ 'the collection.', () => {
		expect(truthies.concat(truthies).filter(first)).toEqual(truthies);
	});

	test('unique is an alias of first.', () => {
		expect(unique).toBe(first);
	});

	test('not returns the inverse of the given predicate.', () => {
		expect(filter(collection, not(isEqual(object)))).not
			.toEqual(collection);
		expect(filter(collection, not(isSame(object))).object).not
			.toBe(object);
		expect(filter(collection, not(isPart(extended))).object).not
			.toBe(object);

		const expectations = [
			[truthy, falsies],
			[falsy, truthies],
			[nothing, tAndFArray],
			[everything, []],
		];

		map(expectations, ([fn, expected]) => {
			expect(sortArray(tAndFArray.filter(not(fn))))
				.toEqual(sortArray(expected));
		});
	});

	test('and returns a function to test the candidates to pass'
	+ ' all the given predicates.', () => {
		expect(filter(collection, and(isSame(object), isSame(cloned))))
			.toEqual({});
		expect(filter(collection, and(isSame(object), isEqual(cloned))))
			.toEqual({ [ecKeys.object]: object });
	});

	test('or returns a function to test the candidates to pass'
	+ ' at least one among multiple predicates.', () => {
		expect(filter(collection, or(isSame(object), isSame(cloned))))
			.toEqual(collection);
		expect(filter(collection, or(isSame(extended), isEqual(extended))))
			.toEqual({});
	});

	test('onProp returns a function to test the given'
	+ 'prop across candidates'
	+ ' of a collection.', () => {
		const prop = rndKey(isolated);

		expect(filter({ ...extendedCollection, isolated },
			onProp(prop, isEqual(isolated[prop]))))
			// TODO: Randomize the key.
			.toEqual({ isolated });
	});

	describe('generators pass all available arguments'
	+ 'to the given predicates.', () => {
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

	test('predicate derives predicates from relevant'
	+ ' collection functions', () => {
		const childKey = rndKey(extendedCollection);
		const childCollection = extendedCollection[childKey];
		const mockCollection = { ...extendedCollection, isolated };

		expect(filter(mockCollection, predicate(isSame(childCollection))))
			.toEqual({ [childKey]: childCollection });

		expect(filter(mockCollection, predicate(contains, isolated)))
			.toEqual({ isolated });

		expect(filter(mockCollection, predicate(
			shares, isolated, rndKey(isolated)
		)))
			.toEqual({ isolated });
	});

	test('isIn returns a predicate to check for a given values'
	+ ' in collections', () => {
		map([array, object], (iterable) => {
			const haystackObject = dict(rndValues(values(iterable),
				rndBetween(0, keys(iterable).length - 1)));
			const haystackArray = values(haystackObject);
			const predicateFn = (left) => (right) => has(left, right);

			map([haystackArray, haystackObject], (haystack) => {
				const expectation = filter(iterable, predicateFn(haystack));

				expect(filter(iterable, isIn(haystack)))
					.toEqual(expectation);
			});
		});
	});

	test('key passes the keys of iterated iterables'
	+ ' to the given predicate.', () => {
		const collectionKey = rndKey(collection);

		expect(filter(collection, key(isEqual(collectionKey))))
			.toEqual({ [collectionKey]: collection[collectionKey] });
	});

	test('value passes the values of iterated iterables'
	+ ' to the given predicate', () => {
		const extensionKey = rndKey(extension);

		expect(filter(extended, value(isEqual(extension[extensionKey]))))
			.toEqual({ [extensionKey]: extended[extensionKey] });
	});
});
