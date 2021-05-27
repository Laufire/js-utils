/* Tested */
import { ascending, configured, descending, existing, onProp, reverse } from './sorters';

/* Helpers */
import { range, secure, shuffle, sort, translate } from './collection';

/* Spec */
describe('Sorters', () => {
	/* Mocks and Stubs */
	const array = secure(range(1, 100).concat(100));
	const reversed = secure(array.slice().reverse());
	const shuffled = secure(shuffle(array));
	const objArray = secure(array.map((i) => ({ prop: i})));
	const objArrayShuffled = secure(shuffled.map((i) => ({ prop: i})));

	/* Tests */
	test('ascending sorts the given collection in ascending order.', () => {
		expect(sort(array, ascending)).toEqual(array);
	});

	test('descending sorts the given collection in descending order.', () => {
		expect(sort(shuffled, descending)).toEqual(reversed);
	});

	test('existing preserves the existing order of the given collection.', () => {
		expect(sort(shuffled, existing)).toEqual(shuffled);
	});

	test('reverse reverses the given collection.', () => {
		expect(sort(shuffled, reverse)).toEqual(shuffled.slice().reverse());
	});

	test('onProp sorts the given collection with the given sorter '
	+ 'on a given property.', () => {
		expect(sort(objArrayShuffled, onProp('prop', ascending)))
			.toEqual(objArray);
	});

	describe('configured helps in sorting collection of collections.', () => {
		const data = [
			{ a: 1, b: 2},
			{ a: 1, b: 1},
			{ a: 0, b: 3},
			{ a: 1, b: 1},
		];

		test('configured works with multiple props, with descending priority.', () => {
			const config = { a: 'ascending', b: 'descending' };
			const expected = translate([2, 0, 1, 3], data);

			const sorted = sort(data, configured(config));

			expect(sorted).toEqual(expected);
		});

		test('configured supports custom grammars.', () => {
			const grammar = { descending: ascending };
			const config = { a: 'ascending', b: 'descending' };
			const expected = translate([2, 1, 3, 0], data);

			const sorted = sort(data, configured(config, grammar));

			expect(sorted).toEqual(expected);
		});
	});
});
