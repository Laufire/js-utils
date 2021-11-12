/* Helpers */
import { contains, equals, filter, keys, shares } from
	'@laufire/utils/collection';
import { truthies, falsies, array, obj, cloned, extension, extended, isolated,
	collection, extendedCollection, sortArray, contracted }
	from '../test/helpers';

/* Tested */
import { isEqual, isSame, isPart, doesContain,
	truthy, falsy, everything, nothing,
	first, unique,
	not, or, and, onProp,
	predicate, isIn, key, value } from './predicates';

/* Spec */
describe('Predicates', () => {
	test('isEqual returns a function to test value equality'
		+ ' between the candidates.', () => {
		expect(filter(collection, isEqual(obj))).toEqual(collection);
	});

	test('isSame returns a function to test referential equality'
		+ ' between the candidates', () => {
		expect(filter(collection, isSame(collection.obj)).obj)
			.toBe(collection.obj);
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
		expect(sortArray(array.filter(truthy))).toEqual(sortArray(truthies));
		expect(sortArray(falsies.filter(truthy))).toEqual([]);
	});

	test('falsy tests for falsy values', () => {
		expect(sortArray(array.filter(falsy))).toEqual(sortArray(falsies));
		expect(sortArray(truthies.filter(falsy))).toEqual([]);
	});

	test('everything allows everything through the filter.', () => {
		expect(sortArray(array.filter(everything))).toEqual(sortArray(array));
	});

	test('nothing allows nothing through the filter.', () => {
		expect(sortArray(array.filter(nothing))).toEqual([]);
	});

	test('first tests for the first occurrence of the element in '
	+ 'the collection.', () => {
		expect(truthies.concat(truthies).filter(first)).toEqual(truthies);
	});

	test('unique is an alias of first.', () => {
		expect(unique).toBe(first);
	});

	test('not returns the inverse of the given predicate.', () => {
		expect(filter(collection, not(isEqual(obj)))).not.toEqual(collection);
		expect(filter(collection, not(isSame(obj))).obj).not.toBe(obj);
		expect(filter(collection, not(isPart(extended))).obj).not.toBe(obj);

		expect(sortArray(array.filter(not(truthy))))
			.toEqual(sortArray(falsies));
		expect(sortArray(array.filter(not(falsy))))
			.toEqual(sortArray(truthies));
		expect(sortArray(array.filter(not(everything)))).toEqual([]);
		expect(sortArray(array.filter(not(nothing)))).toEqual(sortArray(array));
	});

	test('and returns a function to test the candidates to pass'
	+ ' all the given predicates.', () => {
		expect(filter(collection, and(isSame(obj), isSame(cloned))))
			.toEqual({});
		expect(filter(collection, and(isSame(obj), isEqual(cloned))))
			.toEqual({ obj });
	});

	test('or returns a function to test the candidates to pass'
	+ ' at least one among multiple predicates.', () => {
		expect(filter(collection, or(isSame(obj), isSame(cloned))))
			.toEqual(collection);
		expect(filter(collection, or(isSame(extended), isEqual(extended))))
			.toEqual({});
	});

	test('onProp returns a function to test the given prop across candidates'
	+ ' of a collection.', () => {
		expect(filter(collection, onProp('a', isEqual(1)))).toEqual(collection);
		expect(filter(extendedCollection,
			onProp('d', isEqual(4)))).toEqual({ extended });
	});

	describe('generators pass all available arguments'
	+ 'to the given predicates.', () => {
		const generators = {
			and, or, not,
		};

		test.each(keys(generators))('testing the generator: %s',
			(generatorKey) => {
				const mockPredicate = jest.fn();
				const args = [obj.a, 'a', obj];

				filter(obj, generators[generatorKey](mockPredicate));

				expect(mockPredicate).toHaveBeenCalledWith(...args);
			});

		test('testing the generator: onProp.', () => {
			const mockPredicate = jest.fn();
			const mockCollection = { obj };
			const prop = 'a';

			filter(mockCollection, onProp(prop, mockPredicate));

			expect(mockPredicate).toHaveBeenCalledWith(
				obj[prop], 'obj', mockCollection
			);
		});
	});

	test('predicate derives predicates from relevant '
	+ 'collection functions', () => {
		expect(filter(extendedCollection, predicate(equals, extended)))
			.toEqual({ extended });

		expect(filter(extendedCollection, predicate(contains, extension)))
			.toEqual({ extended });

		expect(filter(extendedCollection, predicate(
			shares, extension, 'd'
		)))
			.toEqual({ extended });
	});

	test('isIn', () => {
		// TODO: use imported collection.filter instead. It's not used as it's buggy.
		expect([1, 2, 3].filter(isIn([2, 3])))
			.toEqual([2, 3]);
	});

	test('passes key to predicate function.', () => {
		expect(filter(collection, key(isEqual('obj')))).toEqual({ obj });
	});

	test('passes value to predicate function', () => {
		const { d } = extension;

		expect(filter(extended, value(isEqual(d)))).toEqual(extension);
	});
});
