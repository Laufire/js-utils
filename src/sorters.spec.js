/* Helpers */
import {
	clone, keys, map, merge, secure, shuffle, sort,
} from '@laufire/utils/collection';
import { rndValue } from '@laufire/utils/random';
import { inferType } from '@laufire/utils/reflection';
import {
	retry, rndCollection, rndKey, reversers,
	rndKeys, rndNumber, similarCols,
} from '../test/helpers';

/* Tested */
import { ascending, compile, descending, existing,
	onProp, reverse } from './sorters';

/* Spec */
describe('Sorters', () => {
	const getRndCollection = () => {
		let number = rndNumber();

		return secure(map(rndCollection(), () => number++));
	};

	/* Tests */
	describe('ascending sorts the given collection in'
	+ ' ascending order', () => {
		test('example', () => {
			const input = [2, 3, 1];
			const expected = [1, 2, 3];

			expect(sort(shuffle(input), ascending)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = getRndCollection();
				const input = shuffle(collection);

				expect(sort(input, ascending)).toEqual(collection);
			});
		});
	});

	describe('descending sorts the given collection in'
	+ ' descending order', () => {
		test('example', () => {
			const input = [2, 1, 3];
			const expected = [3, 2, 1];

			expect(sort(shuffle(input), descending)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = getRndCollection();
				const expected = reversers[inferType(collection)](collection);
				const input = shuffle(collection);

				expect(sort(input, descending)).toEqual(expected);
			});
		});
	});

	describe('existing preserves the existing order'
	+ ' of the given collection', () => {
		test('example', () => {
			const input = [2, 1, 3];

			expect(sort(input, existing)).toEqual(input);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = getRndCollection();
				const input = shuffle(collection);

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
				const collection = getRndCollection();
				const input = shuffle(collection);
				const expected = reversers[inferType(input)](input);

				expect(sort(input, reverse)).toEqual(expected);
			});
		});
	});

	describe('onProp sorts the given collection with the given sorter'
	+ ' on a given property', () => {
		test('example', () => {
			const inputs = [
				{ a: 3 },
				{ a: 2 },
				{ a: 1 },
			];
			const expected = [
				{ a: 1 },
				{ a: 2 },
				{ a: 3 },
			];

			expect(sort(inputs, onProp('a', ascending))).toEqual(expected);
			expect(sort(inputs, onProp('a', descending))).toEqual(inputs);
			expect(sort(inputs, onProp('a'))).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = similarCols();
				const rndProp = rndKey(rndValue(collection));
				const sorter = rndValue([ascending, descending]);
				let count = 0;
				const expected = map(collection, (result) =>
					merge(clone(result),
						{
							[rndProp]: sorter === ascending
								? ++count
								: --count,
						}));
				const input = secure(shuffle(expected));

				expect(sort(input, onProp(rndProp, sorter))).toEqual(expected);
			});
		});
	});

	describe('compile helps in sorting collection of collections', () => {
		describe('compile works with multiple props,'
		+ ' with descending priority', () => {
			test('example', () => {
				const input = [
					{ name: 'guava', price: 10 },
					{ name: 'guava', price: 5 },
					{ name: 'apple', price: 5 },
				];
				const expected = [
					{ name: 'apple', price: 5 },
					{ name: 'guava', price: 10 },
					{ name: 'guava', price: 5 },
				];
				const config = {
					name: 'ascending',
					price: 'descending',
				};

				expect(sort(input, compile(config))).toEqual(expected);
			});

			test('randomized test', () => {
				retry(() => {
					const collections = similarCols();
					const [
						ascendingKey,
						descendingKey,
					] = rndKeys(rndValue(collections), 2);
					const config = secure(shuffle({
						[ascendingKey]: 'ascending',
						[descendingKey]: 'descending',
					}));
					const [firstKey, secondKey] = keys(config);
					const counters = {
						ascending: 0,
						descending: 0,
					};
					const updateCounter = (key) => (key === 'ascending'
						? counters.ascending++
						: counters.descending--);
					const expected = map(collections, (collection) => {
						rndValue([0, 1]) && updateCounter(config[firstKey]);
						updateCounter(config[secondKey]);

						return merge(clone(collection), {
							[firstKey]: counters[config[firstKey]],
							[secondKey]: counters[config[secondKey]],
						});
					});
					const input = secure(shuffle(expected));

					expect(sort(input, compile(config))).toEqual(expected);
				});
			});
		});

		test('compile supports custom grammars', () => {
			const products = [
				{ name: 'banana', price: 1 },
				{ name: 'apple', price: 1 },
				{ name: 'apple', price: 3 },
			];
			const expected = [
				{ name: 'apple', price: 1 },
				{ name: 'apple', price: 3 },
				{ name: 'banana', price: 1 },
			];
			const grammar = secure({ customSort: ascending });
			const config = secure({
				name: 'ascending',
				price: 'customSort',
			});

			expect(sort(products, compile(config, grammar))).toEqual(expected);
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

			expect(sort(input, compile(config))).toEqual(expected);
		});
	});
});
