/* Tested */
import { isEqual, isSame, isPart, doesShare,
	truthy, falsy, everything, nothing,
	first, unique,
	not, or, and, onProp,
} from './predicates';

/* Helpers */
import { clone, filter, keys, secure, shuffle } from './collection';
import { truthies, falsies, sortArray } from "../test/helpers";

/* Spec */
describe('Predicates', () => {
	/* Mocks and Stubs */
	const obj = secure({
		a: 1,
	});
	const cloned = secure(clone(obj));
	const collection = { obj, cloned };
	const extended = secure({ ...obj, b: 2 });
	const extendedCollection = { obj, cloned, extended };
	const array = secure(shuffle(truthies.concat(falsies)));

	test('isEqual returns a function to test value equality'
		+ ' between the candidates.', () => {
		expect(filter(collection, isEqual(obj))).toEqual(collection);
	});

	test('isSame returns a function to test referential equality'
		+ ' between the candidates', () => {
		expect(filter(collection, isSame(obj)).obj).toBe(obj);
	});

	test('isPart returns a function to test the '
		+ ' between the candidates', () => {
		expect(filter(collection, isPart(extended)).obj).toBe(obj);
	});

	test('isPart is an alias for doesShare', () => {
		expect(isPart).toBe(doesShare);
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

	test('not returns the negated version of the given predicate.', () => {
		expect(filter(collection, not(isEqual(obj)))).not.toEqual(collection);
		expect(filter(collection, not(isSame(obj))).obj).not.toBe(obj);
		expect(filter(collection, not(isPart(extended))).obj).not.toBe(obj);

		expect(sortArray(array.filter(not(truthy)))).toEqual(sortArray(falsies));
		expect(sortArray(array.filter(not(falsy)))).toEqual(sortArray(truthies));
		expect(sortArray(array.filter(not(everything)))).toEqual([]);
		expect(sortArray(array.filter(not(nothing)))).toEqual(sortArray(array));
	});

	test('and returns a function to test the candidates to pass'
	+ ' all the given predicates.', () => {
		expect(filter(collection, and(isSame(obj), isSame(cloned)))).toEqual({});
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
			onProp('b', isEqual(2)))).toEqual({ extended });
	});

	describe('Generators pass all available arguments to the given predicates.', () => {
		const generators = {
			and, or, not
		};

		test.each(keys(generators))('Testing the generator: %s.', (key) => {
			const predicate = jest.fn();
			const args = [obj.a, 'a', obj];

			filter(obj, generators[key](predicate));

			expect(predicate).toHaveBeenCalledWith(...args);
		});

		test('Testing the generator: onProp.', () => {
			const predicate = jest.fn();
			const collection = { obj };
			const prop = 'a';

			filter(collection, onProp(prop, predicate));

			expect(predicate).toHaveBeenCalledWith(obj[prop], 'obj', collection);
		});
	});
});
