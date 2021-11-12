/* Helpers */
import { dict, secure, values } from '@laufire/utils/collection';
import { rndString } from '@laufire/utils/random';
import { rndNumber } from '../test/helpers';
/* Tested */
import { descend, index, summarize } from './crunch';

const sum = (...numbers) => numbers.reduce((t, c) => t + c, 0);

/* Spec */
describe('Crunch', () => {
	/* Mocks and Stubs */
	const rndKeyOne = rndString();
	const rndKeyTwo = rndString();
	const rndValueOne = rndNumber;
	const rndValueTwo = rndNumber;
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
			const result = index(
				item, rndKeyOne, rndKeyTwo
			);

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
				item, summarizer, rndKeyOne, rndKeyTwo
			);

			expect(result).toEqual(expected);
		});
	});

	test('descend descends into the given collection'
	+ ' upto the given level and executes the given process'
	+ ' and returns a new collection', () => {
		const numTwo = rndNumber;
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
});
