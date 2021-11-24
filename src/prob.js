
import { rndBetween } from './random';

const isProbable = (probability) =>
// eslint-disable-next-line no-magic-numbers
	rndBetween(1, 101) <= probability * 100;

const possibilities = ([first, ...rest]) =>
	rest.reduce((acc, currentArray) =>
		currentArray.reduce((accOne, currentItem) =>
			[...accOne, ...acc.map((prevItems) =>
				[...prevItems, currentItem])], []),
	first.map((x) => [x]));

export { isProbable, possibilities };
