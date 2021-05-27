/* Tested */
import { avg, count, max, min, product, sum } from './reducers';

/* Helpers */
import { reduce, secure } from './collection';
import { values } from './lib';

/* Spec */
describe('Reducers', () => {
	/* Mocks and Stubs */
	const obj = secure({ a: 1, b: 2, c: 3 });
	const array = secure(values(obj));

	test('sum sums the given candidates.', () => {
		expect(reduce(obj, sum, 0)).toEqual(6);
		expect(reduce(array, sum, 0)).toEqual(6);
	});

	test('product multiples the given candidates.', () => {
		expect(reduce(obj, product, 1)).toEqual(6);
		expect(reduce(array, product, 1)).toEqual(6);
	});

	test('avg computes the average of the given candidates.', () => {
		expect(reduce(obj, avg, 0)).toEqual(2);
		expect(reduce(array, avg, 0)).toEqual(2);
	});

	test('count counts the given candidates.', () => {
		expect(reduce(obj, count, 0)).toEqual(3);
		expect(reduce(array, count, 0)).toEqual(3);
	});

	test('min finds the smallest of the given candidates.', () => {
		expect(reduce(obj, min)).toEqual(1);
		expect(reduce(array, min, 0)).toEqual(0);
	});

	test('max finds the largest of the given candidates.', () => {
		expect(reduce(obj, max, 100)).toEqual(100);
		expect(reduce(array, max)).toEqual(3);
	});
});
