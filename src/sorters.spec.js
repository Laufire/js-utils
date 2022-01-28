/* Helpers */
import { map, secure, shuffle, sort } from
	'@laufire/utils/collection';
import { rndValue } from '@laufire/utils/random';
import { retry, rndCollection, rndKey,
	rndKeys, rndNumber, similarCols } from '../test/helpers';

/* Tested */
import { ascending, compile, descending, existing,
	onProp, reverse } from './sorters';

/* Spec */
describe('Sorters', () => {
	/* Mocks and Stubs */
	const getRndCollection = () => {
		const randomCollection = rndCollection();
		let number = rndNumber();

		map(randomCollection, (dummy, key) => {
			randomCollection[key] = number++;
		});

		return randomCollection;
	};

	const randomCollection = secure(getRndCollection());
	const reversed = secure(randomCollection.slice().reverse());
	const shuffled = secure(shuffle(randomCollection));

	/* Tests */
	describe('ascending sorts the given collection in'
	+ ' ascending order', () => {
		test('example', () => {
			const input = [3, 2, 1];
			const expected = [1, 2, 3];

			expect(sort(shuffle(input), ascending)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				expect(sort(shuffled, ascending)).toEqual(randomCollection);
			});
		});
	});

	describe('descending sorts the given collection in'
	+ ' descending order', () => {
		test('example', () => {
			const input = [1, 2, 3];
			const expected = [3, 2, 1];

			expect(sort(shuffle(input), descending)).toEqual(expected);
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
					result[rndProp] = count;
				});

				expect(sort(secure(shuffle(collection)),
					onProp(rndProp, sorter))).toEqual(collection);
			});
		});
	});

	describe('compile helps in sorting collection of collections', () => {
		describe('compile works with multiple props,'
		+ ' with descending priority', () => {
			test('example', () => {
				const input = [
					{ name: 'guava', price: 2 },
					{ name: 'guava', price: 1 },
					{ name: 'apple', price: 3 },
				];
				const expected = [
					{ name: 'apple', price: 3 },
					{ name: 'guava', price: 2 },
					{ name: 'guava', price: 1 },
				];
				const config = secure({
					name: 'ascending',
					price: 'descending',
				});

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
					const counts = [0, 0];

					map(collections, (collection) => {
						collection[ascendingKey] = counts[0]++ % 3 === 0
							? counts[0] - 1
							: counts[0];
						collection[descendingKey] = counts[1]--;
					});

					const sorted = sort(secure(shuffle(collections)),
						compile(config));

					expect(sorted).toEqual(collections);
				});
			});
		});

		test('compile supports custom grammars', () => {
			const products = [
				{ name: 'banana', price: 3 },
				{ name: 'apple', price: 1 },
				{ name: 'apple', price: 2 },
			];
			const expected = [
				{ name: 'apple', price: 1 },
				{ name: 'apple', price: 2 },
				{ name: 'banana', price: 3 },
			];
			const grammar = secure({ customSort: ascending });
			const config = secure({
				name: 'ascending',
				price: 'customSort',
			});

			const sorted = sort(products, compile(config, grammar));

			expect(sorted).toEqual(expected);
		});

		test('compile works with two dimensional arrays', () => {
			const input = [
				[3, 1],
				[2, 2],
				[2, 3],
			];
			const expected = [
				[2, 3],
				[2, 2],
				[3, 1],
			];
			const config = secure(['ascending', 'descending']);

			const sorted = sort(input, compile(config));

			expect(sorted).toEqual(expected);
		});
	});
});
