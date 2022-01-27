/* Helpers */
import { adopt, map, range, secure,
	shell, shuffle, sort, translate, values } from
	'@laufire/utils/collection';
import { rndValue } from '@laufire/utils/random';
import { retry, rndKey, rndKeys, similarCols } from '../test/helpers';

/* Tested */
import { ascending, compile, descending, existing,
	onProp, reverse } from './sorters';

/* Spec */
describe('Sorters', () => {
	/* Mocks and Stubs */
	const array = secure(range(1, 100).concat(100));
	const reversed = secure(array.slice().reverse());
	const shuffled = secure(shuffle(array));

	/* Tests */
	describe('ascending sorts the given collection in'
	+ ' ascending order', () => {
		test('example', () => {
			const input = [3, 2, 1];
			const expected = [1, 2, 3];

			expect(sort(input, ascending)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				expect(sort(shuffled, ascending)).toEqual(array);
			});
		});
	});

	describe('descending sorts the given collection in'
	+ ' descending order', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const expected = [3, 2, 1];

			expect(sort(input, descending)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				expect(sort(shuffled, descending)).toEqual(reversed);
			});
		});
	});

	describe('existing preserves the existing order'
	+ ' of the given collection', () => {
		test('example', () => {
			const input = [1, 2, 3];

			expect(sort(input, existing)).toEqual(input);
		});

		test('randomized test', () => {
			retry(() => {
				expect(sort(shuffled, existing)).toEqual(shuffled);
			});
		});
	});

	describe('reverse reverses the given collection', () => {
		test('example', () => {
			const input = [1, 3, 2];
			const expected = [2, 3, 1];

			expect(sort(input, reverse)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				expect(sort(shuffled, reverse))
					.toEqual(shuffled.slice().reverse());
			});
		});
	});

	describe('onProp sorts the given collection with the given sorter'
	+ ' on a given property', () => {
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

		test('randomized test', () => {
			retry(() => {
				const collection = similarCols();
				const rndProp = rndKey(rndValue(collection));
				const sorter = rndValue([ascending, descending]);
				let count = 0;

				map(collection, (result) => {
					sorter === ascending ? count++ : count--;
					const needed = shell(result);

					needed[rndProp] = count;

					return adopt(result, needed);
				});

				expect(sort(shuffle(collection), onProp(rndProp, sorter)))
					.toEqual(collection);
			});
		});
	});

	describe('compile helps in sorting collection of collections', () => {
		const data = secure([
			{ a: 1, b: 2 },
			{ a: 1, b: 1 },
			{ a: 0, b: 3 },
			{ a: 1, b: 1 },
		]);

		describe('compile works with multiple props,'
		+ ' with descending priority', () => {
			test('example', () => {
				const input = [
					{ name: 'guava', price: 2 },
					{ name: 'guava', price: 1 },
					{ name: 'apple', price: 3 },
				];
				const config = secure({ name: 'ascending',
					price: 'descending' });
				const expected = [
					{ name: 'apple', price: 3 },
					{ name: 'guava', price: 2 },
					{ name: 'guava', price: 1 },
				];

				const sorted = sort(input, compile(config));

				expect(sorted).toEqual(expected);
			});

			test('randomized test', () => {
				retry(() => {
					const collections = similarCols();
					const randomKeys = rndKeys(rndValue(collections), 2);
					const [ascendingKey, descendingKey] = randomKeys;
					const config = shuffle({
						[ascendingKey]: 'ascending',
						[descendingKey]: 'descending',
					});
					let countOne = 0;
					let countTwo = 0;

					map(collections, (collection) => {
						const needed = shell(collection);

						needed[ascendingKey] = countOne++ % 3 === 0
							? countOne - 1
							: countOne;
						needed[descendingKey] = countTwo--;

						return adopt(collection, needed);
					});

					const sorted = sort(shuffle(collections), compile(config));

					expect(sorted).toEqual(collections);
				});
			});
		});

		describe('compile supports custom grammars', () => {
			test('example', () => {
				const products = [
					{ name: 'banana', price: 3 },
					{ name: 'apple', price: 1 },
					{ name: 'apple', price: 2 },
				];
				const grammar = secure({ customSort: ascending });
				const config = secure({ name: 'ascending',
					price: 'customSort' });
				const expected = [
					{ name: 'apple', price: 1 },
					{ name: 'apple', price: 2 },
					{ name: 'banana', price: 3 },
				];

				const sorted = sort(products, compile(config, grammar));

				expect(sorted).toEqual(expected);
			});

			test('randomized test', () => {
				const grammar = secure({ customSort: ascending });
				const config = secure({ a: 'ascending', b: 'customSort' });
				const expected = translate([2, 1, 3, 0], data);

				const sorted = sort(data, compile(config, grammar));

				expect(sorted).toEqual(expected);
			});
		});

		describe('compile works with two dimensional arrays', () => {
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

			test('randomized test', () => {
				const config = secure(['ascending', 'descending']);
				const arrData = map(data, values);
				const expected = translate([2, 0, 1, 3], arrData);

				const sorted = sort(arrData, compile(config));

				expect(sorted).toEqual(expected);
			});
		});
	});
});
