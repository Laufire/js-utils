/**
 * Reflection
 */

/* Helpers */
// eslint-disable-next-line id-match
const { isArray } = Array;

const constructorName = (value) =>
	value !== null && value !== undefined
		&& value.constructor && value.constructor.name;

/*
NOTE: Unlike inferType, this function doesn't differentiate between
	functions and async functions.
*/
const isFunction = (value) =>
	typeof value === 'function';

const isObject = (value) =>
	constructorName(value) === 'Object';

const isIterable = (value) => isArray(value) || isObject(value);

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
	isObject,
	isDefined,
};
