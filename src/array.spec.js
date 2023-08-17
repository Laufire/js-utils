import { expectEquals } from '../test/helpers';
import { tile } from './array';

describe('Tile', () => {
	test('Example', () => {
		const array = ['Naruto', 'Hinata'];
		const length = 4;
		const expected = ['Naruto', 'Hinata', 'Naruto', 'Hinata'];
		const result = tile(array, length);

		expectEquals(result, expected);
	});
	test('Tile returns an empty array when the input array is empty', () => {
		const array = [];
		const length = 4;
		const expected = [];
		const result = tile(array, length);

		expectEquals(result, expected);
	});
	test('Tiles an array with multiple data types ', () => {
		const array = [{ key: 2 }, 1, '2', [3]];
		const length = 6;
		const expected = [{ key: 2 }, 1, '2', [3], { key: 2 }, 1];
		const result = tile(array, length);

		expect(result).toEqual(expected);
	});
});
