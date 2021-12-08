/* Helpers */
import { dict, secure, values, keys, reduce, map }
	from '@laufire/utils/collection';
import { rndString } from '@laufire/utils/random';
import { unique } from '@laufire/utils/predicates';
import { inferType } from '@laufire/utils/reflection';
import { rndNested, rndNumber, converters } from '../test/helpers';
/* Tested */
import { descend, index, summarize, transpose } from './crunch';
import * as collection from './collection';

const sum = (...numbers) => numbers.reduce((t, c) => t + c, 0);

/* Spec */
describe('Crunch', () => {
	/* Mocks and Stubs */
	const rndKeyOne = rndString();
	const rndKeyTwo = rndString();
	const rndValueOne = rndNumber();
	const rndValueTwo = rndNumber();
	const rndValueThree = rndValueTwo + 1;
	const elmOne = secure({
		[rndKeyOne]: rndValueOne,
		[rndKeyTwo]: rndValueTwo,
	});
	const elmTwo = secure({
		[rndKeyOne]: rndValueOne,
		[rndKeyTwo]: rndValueThree,
	});
	const elmThree = secure({
		[rndKeyOne]: rndValueOne,
		[rndKeyTwo]: rndValueThree,
	});
	const arr = secure([elmOne, elmTwo, elmThree]);
	const obj = secure(dict(arr));
	const types = [arr, obj];

	test('index builds and index the given collection'
	+ ' on the given keys of the children to help with retrieval', () => {
		const expected = {
			[rndValueOne]: {
				[rndValueTwo]: [elmOne],
				[rndValueThree]: [elmTwo, elmThree],
			},
		};

		types.forEach((item) => {
			const result = index(item, [rndKeyOne, rndKeyTwo]);

			expect(result).toEqual(expected);
		});
	});

	test('summarize summarizes the given collection'
	+ ' and builds an index on the given keys', () => {
		const summarizer = (item) => sum(...values(item));
		const expected = {
			[rndValueOne]: {
				[rndValueTwo]: rndValueOne + rndValueTwo,
				[rndValueThree]: rndValueOne + rndValueThree,
			},
		};

		types.forEach((item) => {
			const result = summarize(
				item, summarizer, [rndKeyOne, rndKeyTwo]
			);

			expect(result).toEqual(expected);
		});
	});

	test('descend descends into the given collection'
	+ ' upto the given level and executes the given process'
	+ ' and returns a new collection', () => {
		const numTwo = rndNumber();
		const descendLevel = 1;
		const process = (num) => num + numTwo;
		const expectedFromArr = [
			{
				[rndKeyOne]: rndValueOne + numTwo,
				[rndKeyTwo]: rndValueTwo + numTwo,
			},
			{
				[rndKeyOne]: rndValueOne + numTwo,
				[rndKeyTwo]: rndValueThree + numTwo,
			},
			{
				[rndKeyOne]: rndValueOne + numTwo,
				[rndKeyTwo]: rndValueThree + numTwo,
			},
		];
		const expectedFromObj = dict(expectedFromArr);
		const expectations = [expectedFromArr, expectedFromObj];

		types.forEach((item, i) => {
			const result = descend(
				item, process, descendLevel
			);

			expect(result).toEqual(expectations[i]);
		});
	});

	describe('transpose swaps the first two levels'
	+ ' of the given collection', () => {
		describe('examples', () => {
			test('transpose can transpose objects', () => {
				const input = {
					India: {
						population: 1380,
						status: 'developing',
					},
					UnitedStates: {
						population: 330,
						status: 'developed',
					},
					UnitedKingdom: {
						population: 70,
						status: 'developed',
						regent: 'Elizabeth',
					},
				};
				const transposed = {
					population: {
						India: 1380,
						UnitedStates: 330,
						UnitedKingdom: 70,
					},
					status: {
						India: 'developing',
						UnitedStates: 'developed',
						UnitedKingdom: 'developed',
					},
					regent: {
						UnitedKingdom: 'Elizabeth',
					},
				};

				expect(transpose(input)).toEqual(transposed);
				expect(transpose(transposed)).toEqual(input);
			});

			test('transpose can transpose arrays', () => {
				const input = [
					['a', 1],
					['b', 2],
					['c', 3],
				];
				const transposed = [
					['a', 'b', 'c'],
					[1, 2, 3],
				];

				expect(transpose(input)).toEqual(transposed);
				expect(transpose(transposed)).toEqual(input);
			});
		});

		describe('randomized test', () => {
			test('transpose can transpose objects & arrays', () => {
				map(['array', 'object'], (iterable) => {
					const input = rndNested(
						3, 3, ['nested', iterable]
					);
					const selector = reduce(
						input, (acc, value) =>
							[
								...acc,
								...map(keys(value), (key) =>
									converters[inferType(input)](key)),
							],
						[]
					).filter(unique);
					const mockValue = Symbol('mockValue');

					jest.spyOn(collection, 'gather').mockReturnValue(mockValue);

					// I[l1][l2] === t[l2][l1]

					expect(transpose(input)).toEqual(mockValue);
					expect(collection.gather)
						.toHaveBeenCalledWith(input, selector);
				});
			});
		});
	});
});
