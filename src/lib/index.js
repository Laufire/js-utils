const { assign, entries: objEntries, values, keys: objKeys } = Object;
const { floor, random } = Math;
const { ownKeys } = Reflect;

const { isArray } = Array;

const keys = (collection) => (isArray(collection)
	? objKeys(collection).map(Number)
	: ownKeys(collection));

const entries = (collection) => (isArray(collection)
	? objEntries(collection).map(([key, value]) => [Number(key), value])
	: objEntries(collection));

const rndBetween = (from, to) =>
	floor(random() * (to - from)) + from;

export {
	assign, entries, keys, values,
	rndBetween, isArray,
};
