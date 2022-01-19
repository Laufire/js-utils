/* Helpers */
import { map, range, secure, shuffle, sort, translate, values } from
	'@laufire/utils/collection';

/* Tested */
import { ascending, compile, descending, existing,
	onProp, reverse } from './sorters';

/* Spec */
describe('Sorters', () => {
	/* Mocks and Stubs */
	const array = secure(range(1, 100).concat(100));
	const reversed = secure(array.slice().reverse());
	const shuffled = secure(shuffle(array));
	const objArray = secure(array.map((i) => ({ prop: i })));
	const objArrayShuffled = secure(shuffled.map((i) => ({ prop: i })));

	/* Tests */
	describe('ascending sorts the given collection in'
	+ ' ascending order.', () => {
		test('example', () => {
			const input = [3, 2, 1];

			const expected = [1, 2, 3];

			expect(sort(input, ascending)).toEqual(expected);
		});

		test('randomized', () => {
			expect(sort(shuffled, ascending)).toEqual(array);
		});
	});

	describe('descending sorts the given collection in'
	+ ' descending order.', () => {
		test('example', () => {
			const input = [1, 2, 3];

			const expected = [3, 2, 1];

			expect(sort(input, descending)).toEqual(expected);
		});

		test('randomized', () => {
			expect(sort(shuffled, descending)).toEqual(reversed);
		});
	});

	describe('existing preserves the existing order'
	+ ' of the given collection.', () => {
		test('example', () => {
			const input = [1, 2, 3];

			const expected = input;

			expect(sort(input, existing)).toEqual(expected);
		});

		test('randomized', () => {
			expect(sort(shuffled, existing)).toEqual(shuffled);
		});
	});

	describe('reverse reverses the given collection.', () => {
		test('example', () => {
			const input = [1, 3, 2];

			const expected = [2, 3, 1];

			expect(sort(input, reverse)).toEqual(expected);
		});

		test('randomized', () => {
			expect(sort(shuffled, reverse)).toEqual(shuffled.slice().reverse());
		});
	});

	describe('onProp sorts the given collection with the given sorter'
	+ ' on a given property.', () => {
		test('example', () => {
			const inputs = [
				{ a: 3 },
				{ a: 1 },
				{ a: 2 },
			];

			const expected = [
				{ a: 1 },
				{ a: 2 },
				{ a: 3 },
			];

			expect(sort(inputs, onProp('a', ascending))).toEqual(expected);
		});

		test('randomized', () => {
			expect(sort(objArrayShuffled, onProp('prop', ascending)))
				.toEqual(objArray);
		});
	});

	describe('compile helps in sorting collection of collections.', () => {
		const data = secure([
			{ a: 1, b: 2 },
			{ a: 1, b: 1 },
			{ a: 0, b: 3 },
			{ a: 1, b: 1 },
		]);

		describe('compile works with multiple props,'
		+ 'with descending priority.', () => {
			test('example', () => {
				const input = [
					{ a: 2, b: 2 },
					{ a: 2, b: 1 },
					{ a: 1, b: 3 },
				];
				const config = secure({ a: 'ascending', b: 'descending' });

				const expected = [
					{ a: 1, b: 3 },
					{ a: 2, b: 2 },
					{ a: 2, b: 1 },
				];

				const sorted = sort(input, compile(config));

				expect(sorted).toEqual(expected);
			});

			test('randomized', () => {
				const config = secure({ a: 'ascending', b: 'descending' });
				const expected = translate([2, 0, 1, 3], data);

				const compiled = compile(config);

				const sorted = sort(data, compiled);

				expect(sorted).toEqual(expected);
			});
		});

		describe('compile supports custom grammars.', () => {
			test('example', () => {
				const input = [
					{ a: 3, b: 3 },
					{ a: 2, b: 1 },
					{ a: 2, b: 2 },
				];
				const grammar = secure({ customSort: ascending });
				const config = secure({ a: 'ascending', b: 'customSort' });

				const expected = [
					{ a: 2, b: 1 },
					{ a: 2, b: 2 },
					{ a: 3, b: 3 },
				];

				const sorted = sort(input, compile(config, grammar));

				expect(sorted).toEqual(expected);
			});

			test('randomized', () => {
				const grammar = secure({ customSort: ascending });
				const config = secure({ a: 'ascending', b: 'customSort' });
				const expected = translate([2, 1, 3, 0], data);

				const sorted = sort(data, compile(config, grammar));

				expect(sorted).toEqual(expected);
			});
		});

		describe('compile works with two dimensional arrays.', () => {
			test('example', () => {
				const input = [
					[3, 1],
					[2, 2],
					[2, 3],
				];
				const config = secure(['ascending', 'descending']);

				const expected = [
					[2, 3],
					[2, 2],
					[3, 1],
				];

				const sorted = sort(input, compile(config));

				expect(sorted).toEqual(expected);
			});

			test('randomized', () => {
				const config = secure(['ascending', 'descending']);
				const arrData = map(data, values);
				const expected = translate([2, 0, 1, 3], arrData);

				const sorted = sort(arrData, compile(config));

				expect(sorted).toEqual(expected);
			});
		});
	});
});
