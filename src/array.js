import { range } from './collection';

const tile = (array, length) => {
	const arrayLen = array.length ;
	const start = 0;
	const repeat = arrayLen && Math.ceil(length / arrayLen);

	const duplicates = range(start, repeat)
		.reduce((acc) => acc.concat(array), []);

	return duplicates.slice(start, length);
};

export { tile };
