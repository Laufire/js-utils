/**
 * Reflection
 */

/* Helpers */
// eslint-disable-next-line id-match
const { isArray } = Array;

const constructorName = (value) =>
	value?.constructor.name || undefined;

/*
NOTE: Unlike inferType, this function doesn't differentiate between
	functions and async functions.
*/
const isFunction = (value) =>
	typeof value === 'function';

const isDict = (value) =>
	constructorName(value) === 'Object';

const isObject = (value) =>
	typeof value === 'object'
		&& ![undefined, 'Array'].includes(constructorName(value));

const isIterable = (value) => isArray(value) || isDict(value);

const isDefined = (value) => value !== undefined;

const inferType = (value) => {
	const type = typeof value;

	return type !== 'object'
		? type
		: value !== null
			? value.constructor.name.toLowerCase()
			: 'null';
};

/* Aliases */
const isCollection = isIterable;

export {
	constructorName,
	inferType,
	isArray,
	isCollection,
	isIterable,
	isFunction,
	isDict,
	isObject,
	isDefined,
};
