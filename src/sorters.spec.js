/* Helpers */
import { adopt, clone, keys, map, reduce, secure, shell, shuffle, sort } from
	'@laufire/utils/collection';
import { rndBetween, rndValue } from '@laufire/utils/random';
import { inferType, isArray } from '@laufire/utils/reflection';
import { retry, rndCollection, rndKey,
	rndKeys, rndNumber, similarCols } from '../test/helpers';

/* Tested */
import { ascending, compile, descending, existing,
	onProp, reverse } from './sorters';

/* Spec */
describe('Sorters', () => {
	/* Mocks and Stubs */
	const getRndCollection = () => {
		let number = rndNumber();

		return secure(map(rndCollection(), () => number++));
	};

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
				const randomCollection = getRndCollection();

				expect(sort(shuffle(randomCollection), ascending))
					.toEqual(randomCollection);
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
				const reversers = {
					array: (array) => clone(array).reverse(),
					object: (object) => {
						const randomCollection = object;
						const reversedKeys = keys(randomCollection).reverse();

						return reduce(
							reversedKeys, (acc, key) => {
								acc[key] = randomCollection[key];

								return acc;
							}, shell(randomCollection)
						);
					},
				};
				const input = getRndCollection();
				const expected = reversers[inferType(input)](input);

				const result = sort(shuffle(input), descending);

				expect(result).toEqual(expected);
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
				const input = shuffle(getRndCollection());

				expect(sort(input, existing)).toEqual(input);
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
				const reversers = {
					array: (array) => clone(array).reverse(),
					object: (object) => {
						const randomCollection = object;
						const reversedKeys = keys(randomCollection).reverse();

						return reduce(
							reversedKeys, (acc, key) => {
								acc[key] = randomCollection[key];

								return acc;
							}, shell(randomCollection)
						);
					},
				};
				const input = shuffle(getRndCollection());
				const expected = reversers[inferType(input)](input);

				const result = sort(input, reverse);

				expect(result).toEqual(expected);
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

				const expected = map(collection, (result) => {
					const needed = shell(result);
					const base = shell(result);

					sorter === ascending ? count++ : count--;
					needed[rndProp] = count;

					adopt(
						base, result, needed
					);

					return base;
				});
				const input = shuffle(expected);

				expect(sort(secure(input),
					onProp(rndProp, sorter))).toEqual(expected);
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
					const neededColl = secure(map(collections, (collection) =>
						map(collection, () => rndBetween(-10, 10))));
					const randomKeys = rndKeys(rndValue(collections), 2);
					const [ascendingKey, descendingKey] = randomKeys;
					const config = shuffle({
						[ascendingKey]: 'ascending',
						[descendingKey]: 'descending',
					});
					const counts = [0, 0];

					const expected = map(neededColl, (collection) => {
						const needed = shell(collection);

						needed[ascendingKey] = counts[0]++ % 3 === 0
							? counts[0] - 1
							: counts[0];
						needed[descendingKey] = counts[1]--;

						return isArray(collection)
							? [...collection, ...needed]
							: { ...collection, ...needed };
					});
					const input = shuffle(expected);

					expect(sort(secure(shuffle(input)),
						compile(config))).toEqual(expected);
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
