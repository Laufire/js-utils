import { clone, secure, shuffle } from '../src/collection';

/* Config */
const defaults = {
	retryCount: 1000,
};

/* Exports */
/* Data */
const truthies = [1, '2', true, [], {}];
const falsies = [0, '', false, undefined, null];
const obj = secure({ a: 1, b: 2, c: 3 });
const cloned = secure(clone(obj));
const extension = secure({ d: 4 });
const collection = { obj, cloned };
const extended = secure({ ...obj, ...extension });
const isolated = secure({ z: 26 });
const extendedCollection = { obj, cloned, extended };
const array = secure(shuffle(truthies.concat(falsies)));

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

const isAcceptable = (
	actual, expected, margin
) => Math.abs((expected - actual) / (expected || 1)) <= margin;

export {
	truthies, falsies, array,
	obj, cloned, extension, extended, isolated, collection, extendedCollection,
	sortArray, getPredicate,
	retry, strSubSet, isAcceptable,
};
