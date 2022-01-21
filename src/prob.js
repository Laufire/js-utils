
import { clone } from '@laufire/utils/collection';
import { entries } from '@laufire/utils/lib';
import { rndBetween } from './random';

const isProbable = (probability) =>
// eslint-disable-next-line no-magic-numbers
	rndBetween(1, 101) <= probability * 100;

// Const sample = { item: ['apple', 'banana'], price: [1, 2, 3] };
// Const first = [{ item: 'apple' }, { item: 'banana' }];
// Const result = [{ item: 'apple', price: 1 }, { item: 'apple', price: 2 }, { item: 'apple', price: 3 }];
// Const sample = [['a', 'b', 'c'], [1, 2, 3]];
// Const first = [['a'], ['b'], ['c']];

const possibilities = (data) => {
	const [first, ...rest] = clone(data).reverse();

	return rest.reduce((acc, currentArray) =>
		currentArray.reduce((accOne, currentItem) =>
			[...accOne, ...acc.map((prevItems) =>
				[currentItem, ...prevItems])], [])
	, first.map((x) => [x]));
};

const ObjectPossibilities = () => {
	const sample = { item: ['apple', 'banana'], price: [1, 2, 3] };
	const result = entries(sample);
	const combos = possibilities(result);

	console.log;
};

export { isProbable, possibilities, ObjectPossibilities };
