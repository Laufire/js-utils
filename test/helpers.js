import {
	clone, secure, map, reduce,
	keys, filter, range, dict, fromEntries,
} from '@laufire/utils/collection';
import { rndValue, rndBetween, rndString, rndValues }
	from '@laufire/utils/random';

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
const stringLength = 16;

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

const rndKeys = (collection) => rndValues(keys(collection),
	rndBetween(1, keys(collection).length - 1));

const rndRange = (min = 0) =>
	range(min, rndBetween(...defaults.rndRangeLimits));

const rndRangeA = (minCount = 0) =>
	range(0, minCount + rndBetween(...defaults.rndRangeCountLimits));

const rndNumber = () => rndBetween(...defaults.randomNumLimits);

const fixNumber = (value) => value.toFixed(defaults.numberPrecision);

const expectEquals = (valOne, valtwo) => expect(valOne).toEqual(valtwo);

const getRndDict = (min = 1) => fromEntries(map(rndRange(min), (value) =>
	[rndString(), Symbol(value)]));

const valueGenerators = {
	symbol: () => Symbol(rndString()),
	undefined: () => undefined,
	nested: (
		depth, length, generators
		// eslint-disable-next-line no-use-before-define
	) => rndNested(
		depth - 1, length, generators
	),
};

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
const simpleTypes = secure({
	number: rndNumber(),
	string: rndString(stringLength),
	boolean: rndValue([true, false]),
});

/* Functions */
const getRndDictA = (minCount = 1) =>
	fromEntries(map(rndRangeA(minCount), (value) =>
		[rndString(), Symbol(value)]));
const rndCollection = (minCount = 1) =>
	rndValue([rndRangeA, getRndDictA])(minCount);
const rndNested = (
	depth = 1, length = minLength, generators = keys(valueGenerators)
) => (depth > 0
	? map(rndCollection(length), () =>
		valueGenerators[rndValue(generators)](
			depth, length, generators
		))
	: rndCollection());
const toObject = (iterator) => reduce(
	iterator, (acc, value) =>
		({ ...acc, [rndString()]: value }), {}
);

export {
	sortArray, retry, strSubSet,
	isAcceptable, rndKey, rndNumber,
	rndRange, fixNumber, expectEquals,
	contracted, array, object, cloned,
	extension, extended, isolated, ecKeys,
	collection, extCollection, numberArray,
	getRndDict, getRndDictA,
	rndCollection, rndNested, simpleTypes,
	toObject, rndKeys,
};
