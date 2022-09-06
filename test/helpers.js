import {
	clone, secure, map, reduce, shuffle,
	keys, filter, range, toDict, fromEntries, shell, has, values,
	omit, merge,
} from '@laufire/utils/collection';
import { rndValue, rndBetween, rndString, rndValues }
	from '@laufire/utils/random';
import { inferType } from '@laufire/utils/reflection';
import { not, isEqual } from '@laufire/utils/predicates';
import TestConfig from './config';

/* Config */
// TODO: Change the values after importing the new version.
const numMaxLimit = 100;
const defaults = {
	minCount: 5,
	maxCount: 9,
	numberPrecision: 4,
	randomNumLimits: [0, numMaxLimit],
	retryCount: 1000,
};
const stringLength = 16;
// TODO: Remove the converters after using published functions.
const converters = {
	array: Number,
	object: String,
};

/* Functions */
const sortArray = (arr) => arr.slice().sort();

const retry = (fn, retryCount = TestConfig.retryCount) =>
	map(range(0, retryCount), (value) => fn(value));

const strSubSet = (superStr, tested) =>
	tested.split('').findIndex((char) =>
		!(superStr.indexOf(char) > -1)) === -1;

// TODO: Use library function post publishing.
const secondStdDev = 0.05;
const isAcceptable = (
	actual, expected, margin = secondStdDev
) => Math.abs((expected - actual) / (expected || 1)) <= margin;

const rndKey = (collection) =>
	converters[inferType(collection)](rndValue(keys(collection)));

const rndKeys = (collection, count) => secure(map(rndValues(keys(collection),
	count || rndBetween(1, keys(collection).length - 1)),
converters[inferType(collection)]));

const rndRange = (minCount = defaults.minCount, maxCount = defaults.maxCount) =>
	secure(range(0, rndBetween(minCount, maxCount)));

const rndNumber = () => rndBetween(...defaults.randomNumLimits);

const fixNumber = (value) => value.toFixed(defaults.numberPrecision);

const expectEquals = (valOne, valtwo) => expect(valOne).toEqual(valtwo);

const rndDict = (minCount = defaults.minCount, maxCount = defaults.maxCount) =>
	secure(fromEntries(map(rndRange(minCount, maxCount), (value) =>
		[rndString(), Symbol(value)])));

const rndArray = (minCount = defaults.minCount, maxCount = defaults.maxCount) =>
	secure(rndRange(minCount, maxCount).map((value) => Symbol(value)));

const rndCollection = (minCount = defaults.minCount,
	maxCount = defaults.maxCount) =>
	rndValue([rndArray, rndDict])(minCount, maxCount);

const findLastIndex = (arr, predicate) =>
	arr.findIndex((item, i) => predicate(item)
							&& arr.slice(i + 1)
								.findIndex(predicate) === -1);

const till = (arr, predicate) =>
	secure(arr.slice(0, findLastIndex(arr, predicate) + 1));

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

const getLeaf = (generators) => {
	const filteredGen = generators.filter(not(isEqual('nested')));

	return filteredGen.length === 0
		? keys(omit(valueGenerators, ['nested']))
		: filteredGen;
};

/* Exports */
/* Data */
const array = secure(map(rndRange(), Symbol));
const object = secure(toDict(array));
const cloned = secure(clone(object));
const extension = secure(rndDict());
const isolated = secure(rndDict());
const removedKey = rndValue(keys(object));
const contracted = secure(filter(object, (dummy, key) => key !== removedKey));
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

/* Functions */
const rndNested = (
	// eslint-disable-next-line no-magic-numbers
	depth = 3, length = 3, generators = keys(valueGenerators),
) => (depth > 0
	? secure(map(valueGenerators[getIterator(generators)](length), () =>
		valueGenerators[rndValue(generators)](
			depth, length, generators
		)))
	: valueGenerators[rndValue(getLeaf(generators))]());

const toObject = (iterator) => secure(reduce(
	iterator, (acc, value) =>
		({ ...acc, [rndString()]: value }), {}
));

const rnd = () => rndNested(0);

const similarCols = (minCount = defaults.minCount,
	maxCount = defaults.maxCount) => {
	const child = rndValue([rndDict, rndArray]);
	const rndCollections = map(rndCollection(minCount, maxCount), () =>
		child(minCount, maxCount));
	const rndColl = rndValue(rndCollections);

	const partialObject = reduce(
		// eslint-disable-next-line no-return-assign
		rndColl, (
			acc, dummy, key
		// eslint-disable-next-line no-sequences
		) => (acc[key] = Symbol(key), acc), shell(rndColl)
	);

	return secure(map(rndCollections, (value) => shuffle(merge(
		shell(value), value, partialObject
	))));
};

const summarize = (iterable) => secure(reduce(
	iterable, (acc, value) =>
		({ ...acc, [value]: (acc[value] || 0) + 1 }), {}
));

const testRatios = (iterable, ratios) => {
	const typeCounts = summarize(iterable);
	const { length } = keys(iterable);

	map(ratios, (ratio, key) => {
		expect(isAcceptable((typeCounts[key] || 0) / length, ratio))
			.toEqual(true);
	});
};

const getRatios = (iterable) => {
	const { length } = values(iterable);

	return secure(reduce(
		iterable, (acc, value) =>
			({ ...acc, [value]: 1 / length }), {}
	));
};

const arrayOrObject = (iterable) =>
	secure(rndValue([values, toObject])(iterable));

export {
	contracted, array, object, cloned,
	extension, extended, isolated, ecKeys,
	collection, extCollection, converters, simpleTypes,
	rndRange, rndDict, rndArray, rndCollection, rndNested,
	rndNumber, fixNumber, toObject, rndKey, rndKeys,
	sortArray, strSubSet, retry, isAcceptable, expectEquals,
	allTypes, emptyTypes, rnd, similarCols, iterableTypes,
	till, findLastIndex, summarize, testRatios, getRatios,
	arrayOrObject,
};
