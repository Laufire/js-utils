import { 
	clone, secure, shuffle,
	keys, filter, range, dict 
} from '@laufire/utils/collection';
import { rndValue, rndBetween } from '@laufire/utils/random';

/* Config */
const defaults = {
	retryCount: 1000,
};

/* Exports */
/* Data */
const truthies = [1, '2', true, [], {}];
const falsies = [0, '', false, undefined, null];
// TODO: Randomize all possible values.
const obj = secure({ a: 1, b: 2, c: 3 });
const cloned = secure(clone(obj));
const extension = secure({ d: 4 });
const collection = { obj, cloned };
const extended = secure({ ...obj, ...extension });
const rndkey = rndValue(keys(obj));
const contracted = filter(obj, (dummy, key) => key !== rndkey);
const isolated = secure({ z: 26 });
const extendedCollection = { obj, cloned, extended };
const array = secure(shuffle(truthies.concat(falsies)));
const rndArray = secure(shuffle(range(0, rndBetween(5, 8))));
const rndObject = secure(dict(rndArray));

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

const rndKey = (collection) => rndValue(keys(collection));

const rndNumber = () => rndBetween(0, 100);

export {
	truthies, falsies, array,
	obj, cloned, extension, extended, isolated, 
	collection, extendedCollection,
	sortArray, getPredicate, retry, 
	strSubSet, isAcceptable, rndKey, rndNumber,
	contracted, rndArray, rndObject,
};
