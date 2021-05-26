/* Tested */
import { isEqual, isSame, isPart, doesShare,
	truthy, falsy, everything, nothing } from './predicates';

/* Helpers */
import { clone, filter, secure, shuffle } from './collection';
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
	const array = secure(shuffle(truthies.concat(falsies)));

	test('isEqual returns a function to test value equality '
		+ 'between the candidates.', () => {
		expect(filter(collection, isEqual(obj))).toEqual(collection);
	});

	test('isSame returns a function to test referential equality '
		+ 'between the candidates', () => {
		expect(filter(collection, isSame(obj)).obj).toBe(obj);
	});

	test('isPart returns a function to test the  '
		+ 'between the candidates', () => {
		expect(filter(collection, isPart(extended)).obj).toBe(obj);
	});

	test('isPart is an alias for doesShare', () => {
		expect(isPart).toBe(doesShare);
	});

	test('truthy tests for truthy values', () => {
		const filtered = array.filter(truthy);

		expect(sortArray(filtered)).toEqual(sortArray(truthies));
	});

	test('falsy tests for falsy values', () => {
		const filtered = array.filter(falsy);

		expect(sortArray(filtered)).toEqual(sortArray(falsies));
	});

	test('everything allows everything through the filter.', () => {
		const filtered = array.filter(everything);

		expect(sortArray(filtered)).toEqual(sortArray(array));
	});

	test('nothing allows nothing through the filter.', () => {
		const filtered = array.filter(nothing);

		expect(sortArray(filtered)).toEqual([]);
	});
});
