import {
	clone, secure, map,
	keys, filter, range, dict, fromEntries,
} from '@laufire/utils/collection';
import { rndValue, rndBetween, rndString } from '@laufire/utils/random';

/* Config */
const rangeMaxLimit = 5;
const rangeMinLimit = 8;
const numMaxLimit = 100;
const defaults = {
	numberPrecision: 4,
	randomNumLimits: [0, numMaxLimit],
	retryCount: 1000,
	rndRangeLimits: [rangeMaxLimit, rangeMinLimit],
};

/* Functions */
const sortArray = (arr) => arr.slice().sort();

const retry = (fn, retryCount = defaults.retryCount) =>
	map(range(0, retryCount), (value) => fn(value));

const strSubSet = (superStr, tested) =>
	tested.split('').findIndex((char) =>
		!(superStr.indexOf(char) > -1)) === -1;

const isAcceptable = (
	actual, expected, margin
) => Math.abs((expected - actual) / (expected || 1)) <= margin;

const rndKey = (collection) => rndValue(keys(collection));

const rndRange = (min = 0) =>
	range(min, rndBetween(...defaults.rndRangeLimits));

const rndNumber = () => rndBetween(...defaults.randomNumLimits);

const fixNumber = (value) => value.toFixed(defaults.numberPrecision);

const expectEquals = (valOne, valtwo) => expect(valOne).toEqual(valtwo);

const getRndDict = (min = 1) => fromEntries(map(rndRange(min), (value) =>
	[rndString(), Symbol(value)]));

/* Exports */
/* Data */
const array = secure(map(rndRange(), Symbol));
const object = secure(dict(array));
const cloned = secure(clone(object));
const extension = secure(getRndDict());
const isolated = secure(getRndDict());
const removedKey = rndValue(keys(object));
const contracted = filter(object, (dummy, key) => key !== removedKey);
const extended = secure({ ...object, ...extension });
const ecKeys = {
	object: rndString(),
	// eslint-disable-next-line sort-keys
	cloned: rndString(),
	extended: rndString(),
};
const collection = {
	[ecKeys.object]: object,
	[ecKeys.cloned]: cloned,
};
const extCollection = {
	...collection,
	[ecKeys.extended]: extended,
};

export {
	sortArray, retry, strSubSet,
	isAcceptable, rndKey, rndNumber,
	rndRange, fixNumber, expectEquals,
	contracted, array, object, cloned,
	extension, extended, isolated, ecKeys,
	collection, extCollection,
};
