/**
 * Reflection
 */

/* Helpers */
const { isArray } = Array; // eslint-disable-line id-match

const getConstructorName = (value) =>
	value !== null && value !== undefined
		&& value.constructor && value.constructor.name;

// # NOTE: Unlike inferType, this function doesn't differentiate between functions and async functions.
const isFunction = (value) =>
	typeof value === 'function';

const isObject = (value) =>
	getConstructorName(value) === 'Object';

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
	getConstructorName,
	inferType,
	isIterable,
	isFunction,
	isObject,
};
