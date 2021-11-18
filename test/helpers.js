import { 
	clone, secure, shuffle, map,
	keys, filter, range, dict, values, fromEntries
} from '@laufire/utils/collection';
import { rndValue, rndBetween, rndString } from '@laufire/utils/random';
/* Config */
const defaults = {
	retryCount: 1000,
};

/* Exports */
/* Data */
const truthies = [1, '2', true, [], {}];
const falsies = [0, '', false, undefined, null];
const getRndRange = () => range(0, rndBetween(5, 8));
const rndRange = range(0, rndBetween(5, 8));
const rndArray = secure(map(getRndRange(), Symbol));
const rndObject = secure(dict(rndArray));
const obj = secure(rndObject);
 // TODO: Revisit. 
const cloned = secure(clone(rndObject));
const extension = secure(fromEntries(getRndRange().map((value) => 
	[rndString(), Symbol(value)])));
const collection = { obj, cloned };
const extended = secure({ ...obj, ...extension });
const removedKey = rndValue(keys(obj));
const contracted = filter(obj, (dummy, key) => key !== removedKey);
const isolated = secure(fromEntries(getRndRange().map((value) => 
	[rndString(), Symbol(value)])));
const extendedCollection = {
	[rndString()]: obj,
	[rndString()]: cloned,
	[rndString()]: extended,
};
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

const rndKey = (collection) => rndValue(keys(collection));

const rndNumber = () => rndBetween(0, 100);

const fixNumber = (value) => value.toFixed(4); 

const expectEquals = (valOne, valtwo) => expect(valOne).toEqual(valtwo);

export {
	truthies, falsies, array,
	obj, cloned, extension, extended, isolated, 
	collection, extendedCollection, rndRange,
	sortArray, getPredicate, retry, strSubSet,
	isAcceptable, rndKey, rndNumber, fixNumber,
	expectEquals, contracted, rndArray, rndObject,
};
