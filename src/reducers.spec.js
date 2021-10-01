/* Tested */
import { avg, count, len, max, min, product, reducer, sum } from './reducers';

/* Helpers */
import { merge, reduce, secure } from './collection';
import { values } from './lib';
import { obj, extension, extended } from '../test/helpers';

/* Spec */
describe('Reducers', () => {
	/* Mocks and Stubs */
	const array = secure(values(obj));

	test('sum sums the given candidates.', () => {
		expect(reduce(
			obj, sum, 0
		)).toEqual(6);
		expect(reduce(
			array, sum, 0
		)).toEqual(6);
	});

	test('product multiples the given candidates.', () => {
		expect(reduce(
			obj, product, 1
		)).toEqual(6);
		expect(reduce(
			array, product, 1
		)).toEqual(6);
	});

	test('avg computes the average of the given candidates.', () => {
		expect(reduce(
			obj, avg, 0
		)).toEqual(2);
		expect(reduce(
			array, avg, 0
		)).toEqual(2);
	});

	test('length returns the length of the given collection.', () => {
		expect(reduce(
			obj, len, 0
		)).toEqual(3);
		expect(reduce(
			array, len, 0
		)).toEqual(3);
	});

	test('count returns the number of occurrences of the given counted'
	+ 'among the  given candidates.', () => {
		expect(reduce(
			obj, count(1), 0
		)).toEqual(1);
		expect(reduce(
			array, count(0), 0
		)).toEqual(0);
	});

	test('min finds the smallest of the given candidates.', () => {
		expect(reduce(obj, min)).toEqual(1);
		expect(reduce(
			array, min, 0
		)).toEqual(0);
	});

	test('max finds the largest of the given candidates.', () => {
		expect(reduce(
			obj, max, 100
		)).toEqual(100);
		expect(reduce(array, max)).toEqual(3);
	});

	test('reducer derives reducers from '
	+ 'relevant collection functions.', () => {
		expect(reduce(
			[obj, extension], reducer(merge), {}
		)).toEqual(extended);
	});
});
