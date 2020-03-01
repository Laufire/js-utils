/**
 * Reflection
 */

/* Helpers */
const { isArray } = Array; // eslint-disable-line id-match

const constructorName = (value) =>
	value !== null && value !== undefined
		&& value.constructor && value.constructor.name;

// # NOTE: Unlike inferType, this function doesn't differentiate between functions and async functions.
const isFunction = (value) =>
	typeof value === 'function';

const isObject = (value) =>
	constructorName(value) === 'Object';

const isIterable = (value) => isArray(value) || isObject(value);

const inferType = (value) => {
	const type = typeof value;

	return type !== 'object'
		? type
		: value !== null
			? value !== undefined
				? value.constructor.name.toLowerCase()
				: 'undefined'
			: 'null';
};

export {
	constructorName,
	inferType,
	isArray,
	isIterable,
	isFunction,
	isObject,
};
