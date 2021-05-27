/* Tested */
import { ascending, descending, existing, onProp, reverse } from './sorters';

/* Helpers */
import { range, secure, shuffle } from './collection';

/* Spec */
describe('Sorters', () => {
	/* Mocks and Stubs */
	const array = secure(range(1, 100).concat(100));
	const reversed = secure(array.slice().reverse());
	const shuffled = secure(shuffle(array));
	const objArray = array.map((i) => ({ prop: i}));
	const objArrayShuffled = shuffled.map((i) => ({ prop: i}));

	/* Tests */
	test('ascending sorts the given collection in ascending order.', () => {
		expect(shuffled.slice().sort(ascending)).toEqual(array);
	});

	test('descending sorts the given collection in descending order.', () => {
		expect(shuffled.slice().sort(descending)).toEqual(reversed);
	});

	test('existing preserves the existing order of the given collection.', () => {
		expect(shuffled.slice().sort(existing)).toEqual(shuffled);
	});

	test('reverse reverses the given collection.', () => {
		expect(shuffled.slice().sort(reverse)).toEqual(shuffled.slice().reverse());
	});

	test('onProp sorts the given collection with the given sorter '
	+ 'on a given property.', () => {
		expect(objArrayShuffled.slice().sort(onProp('prop', ascending)))
			.toEqual(objArray);
	});
});
