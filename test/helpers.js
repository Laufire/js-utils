import {
	clone, secure, map, reduce, shuffle, values,
	keys, filter, range, dict, fromEntries, shell,
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

const rndRange = (minCount = 0) =>
	range(0, minCount + rndBetween(...defaults.rndRangeLimits));

const rndNumber = () => rndBetween(...defaults.randomNumLimits);

const fixNumber = (value) => value.toFixed(defaults.numberPrecision);

const expectEquals = (valOne, valtwo) => expect(valOne).toEqual(valtwo);

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

const rndDict = (minCount = 1) =>
	fromEntries(map(rndRange(minCount), (value) =>
		[rndString(), Symbol(value)]));

const fn = function () {};

const Constructor = fn;

/* Exports */
/* Data */
const array = secure(map(rndRange(), Symbol));
const object = secure(dict(array));
const cloned = secure(clone(object));
const extension = secure(rndDict());
const isolated = secure(rndDict());
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
const simpleTypes = () => secure({
	number: rndNumber(),
	string: rndString(stringLength),
	boolean: rndValue([true, false]),
});

/* Functions */
const rndCollection = (minCount = 1) =>
	rndValue([rndRange, rndDict])(minCount);

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

const rndArray = (minCount = 1) =>
	rndRange(minCount).map(() => rndString());

const emptyTypes = () => secure({
	null: null,
	undefined: undefined,
	number: NaN,
});

const iterableTypes = () => secure({
	array: rndArray(),
	object: rndDict(),
	map: new Map(),
});

const constructedTypes = () => secure({
	date: new Date(),
	map: new Map(),
	object: new Constructor(),
});

const complexTypes = () => secure({
	...constructedTypes(),
	...iterableTypes(),
	function: fn,
});

const allTypes = () => secure({
	...emptyTypes(),
	...simpleTypes(),
	...complexTypes(),
});

const rnd = () => rndValue([
	...values(allTypes()),
	rndNested(),
]);

const similarCols = () => {
	const child = rndValue([rndDict, rndArray]);
	const rndCollections = map(rndCollection(), () => child());
	const rndColl = rndValue(rndCollections);

	const partialObject = reduce(
		// eslint-disable-next-line no-return-assign
		rndColl, (
			acc, dummy, key
		// eslint-disable-next-line no-sequences
		) => (acc[key] = Symbol(key), acc), shell(rndColl)
	);

	return map(rndCollections, (value) =>
		shuffle({ ...value, ...partialObject }));
};

export {
	contracted, array, object, cloned,
	extension, extended, isolated, ecKeys,
	collection, extCollection, numberArray, simpleTypes,
	rndRange, rndDict, rndArray, rndCollection, rndNested,
	rndNumber, fixNumber, toObject, rndKey, rndKeys,
	sortArray, strSubSet, retry, isAcceptable, expectEquals,
	allTypes, emptyTypes, rnd,
	similarCols,
};
