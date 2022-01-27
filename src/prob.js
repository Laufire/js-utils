
import { clone, fromEntries, map } from '@laufire/utils/collection';
import { entries } from '@laufire/utils/lib';
import { inferType } from '@laufire/utils/reflection';
import { rndBetween } from './random';

const isProbable = (probability) =>
// eslint-disable-next-line no-magic-numbers
	rndBetween(1, 101) <= probability * 100;

// eslint-disable-next-line max-lines-per-function
const possibilities = (() => {
	const arrayWorker = (source) => {
		const [first, ...rest] = clone(source).reverse();

		return rest.reduce((acc, currentArray) =>
			currentArray.reduce((accOne, currentItem) =>
				// eslint-disable-next-line max-nested-callbacks
				[...accOne, ...acc.map((prevItems) =>
					[currentItem, ...prevItems])], [])
		, first.map((x) => [x]));
	};

	const objectWorker = (source) => {
		const transformed = map(entries(source), (value) => {
			const [name, combos] = value;

			return arrayWorker([[name], combos]);
		});

		return map(arrayWorker(transformed), fromEntries);
	};

	const workers = {
		object: objectWorker,
		array: arrayWorker,
	};

	return (data) => workers[inferType(data)](data);
})();

export { isProbable, possibilities };
