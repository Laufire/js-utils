const { assign, entries: objEntries, values, keys: objKeys } = Object;
const { floor, random } = Math;

const { isArray } = Array;

const keys = (object) => (isArray(object)
	? objKeys(object).map(Number)
	: objKeys(object));

const entries = (collection) => (isArray(collection)
	? objEntries(collection).map(([key, value]) => [Number(key), value])
	: objEntries(collection));

// eslint-disable-next-line no-magic-numbers
const rndBetween = (from = 0, to = 10) =>
	floor(random() * (to - from)) + from;

export {
	assign, entries, keys, values,
	rndBetween, isArray,
};
