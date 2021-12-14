import {
	clone, secure, map, reduce, shuffle,
	keys, filter, range, dict, fromEntries, shell, has,
} from '@laufire/utils/collection';
import { rndValue, rndBetween, rndString, rndValues }
	from '@laufire/utils/random';
import TestConfig from './config';

/* Config */
const rangeMaxLimit = 1;
// TODO: Change the values after importing the new version.
const rangeMinLimit = 2;
const numMaxLimit = 100;
const defaults = {
	numberArrayMax: 100,
	numberPrecision: 4,
	randomNumLimits: [0, numMaxLimit],
	retryCount: 1000,
	rndRangeLimits: [rangeMaxLimit, rangeMinLimit],
};
const stringLength = 16;

/* Functions */
const sortArray = (arr) => arr.slice().sort();

const retry = (fn, retryCount = TestConfig.retryCount) =>
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

const expectEquals = (received, expected) => {
	expect(received).toEqual(expected);
};

const rndDict = (minCount = 1) =>
	fromEntries(map(rndRange(minCount), (value) =>
		[rndString(), Symbol(value)]));

const rndArray = (minCount = 1) =>
	rndRange(minCount).map(() => rndString());

const rndCollection = (minCount = 1) =>
	rndValue([rndRange, rndDict])(minCount);

const fn = function () {};

const Constructor = fn;

const iterableTypes = () => secure({
	array: rndArray(),
	object: rndDict(),
});

const constructedTypes = () => secure({
	date: new Date(),
	map: new Map(),
	object: new Constructor(),
});

const emptyTypes = () => secure({
	null: null,
	undefined: undefined,
	number: NaN,
});

const simpleTypes = () => secure({
	number: rndNumber(),
	string: rndString(stringLength),
	boolean: rndValue([true, false]),
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

const itrGenerators = {
	array: () => rndArray(),
	object: () => rndDict(),
	collection: () => rndCollection(),
};

const nonItrGenerators = {
	any: () => rndValue(allTypes()),
	symbol: () => Symbol(rndString()),
	undefined: () => undefined,
};

const valueGenerators = {
	...itrGenerators,
	...nonItrGenerators,
	nested: (
		depth, length, generators
		// eslint-disable-next-line no-use-before-define
	) => rndNested(
		depth - 1, length, generators
	),
};

const getIterator = (generators) =>
	rndValue(filter(generators, (generator) =>
		has(keys(itrGenerators), generator))) || 'collection';

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

/* Functions */
const rndNested = (
	// eslint-disable-next-line no-magic-numbers
	depth = 3, length = 3, generators = keys(valueGenerators),
) => (depth > 0
	? map(valueGenerators[getIterator(generators)](length), () =>
		valueGenerators[rndValue(generators)](
			depth, length, generators
		))
	: rndValue(nonItrGenerators)());

const toObject = (iterator) => reduce(
	iterator, (acc, value) =>
		({ ...acc, [rndString()]: value }), {}
);

const rnd = () => rndNested(0);

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
	similarCols, iterableTypes,
};
