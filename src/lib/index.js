import { isArray } from '@laufire/utils/reflection';

const { assign, entries, values, keys: objKeys } = Object;
const { floor, random } = Math;
const keys = (object) => (isArray(object)
	? objKeys(object).map(Number)
	: objKeys(object));

// eslint-disable-next-line no-magic-numbers
const rndBetween = (from = 0, to = 10) =>
	floor(random() * (to - from)) + from;

export {
	assign, entries, keys, values,
	rndBetween,
};
