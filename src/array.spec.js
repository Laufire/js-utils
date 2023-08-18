import {
	expectEquals,
	retry,
	rndArray,
	rndNested,
	rndNumber,
} from '../test/helpers';
import { tile } from './array';
import { map } from './collection';

describe('Tile tiles elements of the input array to get '
+ 'an array of the desired length.', () => {
	describe('Example', () => {
		test('', () => {
			const array = ['Lion', 'Tiger'];
			const length = 4;
			const expected = ['Lion', 'Tiger', 'Lion', 'Tiger'];
			const result = tile(array, length);

			expectEquals(result, expected);
		});

		test('Tile returns an empty array when '
		+ 'the input array is empty', () => {
			const array = [];
			const length = 4;
			const expected = [];
			const result = tile(array, length);

			expectEquals(result, expected);
		});
	});

	test('Randomized Test', () => {
		retry(() => {
			const array = map(rndArray(0), () => rndNested(0, 0));
			const collectionLength = array.length;
			const rndLength = rndNumber();

			const result = tile(array, rndLength);

			expectEquals(result.length, collectionLength && rndLength);

			map(result, (value, key) => {
				const index = key % collectionLength;

				expectEquals(value, array[index]);
			});
		});
	});
});
