import {
	clone, secure, map,
	keys, filter, range, dict, fromEntries, omit,
} from '@laufire/utils/collection';
import { rndValue, rndBetween, rndString } from '@laufire/utils/random';
import { isArray } from '@laufire/utils/reflection';

/* Config */
const rangeMaxLimit = 5;
// TODO: Change the values after importing the new version.
const rangeMinLimit = 8;
const numMaxLimit = 100;
const defaults = {
	numberArrayMax: 100,
	numberPrecision: 4,
	randomNumLimits: [0, numMaxLimit],
	retryCount: 1000,
	rndRangeLimits: [rangeMaxLimit, rangeMinLimit],
	// eslint-disable-next-line id-length
	rndRangeCountLimits: [0, rangeMaxLimit],
};
const minLength = 3;

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

const rndRangeA = (minCount = 0) =>
	range(0, minCount + rndBetween(...defaults.rndRangeCountLimits));

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
const numberArray = secure(range(1, defaults.numberArrayMax));
const collection = {
	[ecKeys.object]: object,
	[ecKeys.cloned]: cloned,
};
const extCollection = {
	...collection,
	[ecKeys.extended]: extended,
};

/* Functions */
const getRndDictA = (minCount = 1) =>
	fromEntries(map(rndRangeA(minCount), (value) =>
		[rndString(), Symbol(value)]));
const removeKeys = (iterable, selectorKeys) => (isArray(iterable)
	// TODO: Use imported filter after publishing.
	? omit(iterable, selectorKeys).filter(() => true)
	: omit(iterable, selectorKeys));
const rndCollection = (minCount = 1) =>
	rndValue([rndRangeA, getRndDictA])(minCount);
const rndNested = (depth = 1, length = minLength) => (depth > 0
	? map(rndCollection(length), (dummy, key) =>
		rndValue([Symbol(key), undefined, rndNested(depth - 1)]))
	: rndCollection());

export {
	sortArray, retry, strSubSet,
	isAcceptable, rndKey, rndNumber,
	rndRange, fixNumber, expectEquals,
	contracted, array, object, cloned,
	extension, extended, isolated, ecKeys,
	collection, extCollection, numberArray,
	getRndDict, getRndDictA, removeKeys,
	rndCollection, rndNested,
};
