/* Config */
const defaults = {
	retryCount: 1000,
};

/* Exports */
/* Data */
const truthies = [1, '2', true, [], {}];
const falsies = [0, '', false, undefined, null];

/* Functions */
const sortArray = (arr) => arr.slice().sort();

const getPredicate = (check) => (val) => val === check;

const retry = (fn, retryCount = defaults.retryCount) => {
	const ret = [];
	let i = 0;

	while(i < retryCount)
		ret.push(fn(i++));

	return ret;
};

const strSubSet = (superStr, tested) =>
	tested.split('').findIndex((char) => !(superStr.indexOf(char) > -1)) === -1;

export {
	truthies, falsies,
	sortArray, getPredicate,
	retry, strSubSet,
};
