/**
 * Reflection
 */

const getConstructorName = (value) =>
	value !== null && value !== undefined && value.constructor && value.constructor.name;

const isObject = (value) =>
	getConstructorName(value) == 'Object';

const isFunction = (value) => //NOTE: Unlike inferType, this function doesn't differentiate between functions and async functions.
	typeof value == 'function';

const inferType = (value) => {
	const type = typeof value;

	return type !== 'object' ? type
		: value !== null
			? value.constructor.name.toLowerCase()
			: 'null';
}

export {
	getConstructorName,
	isObject,
	isFunction,
	inferType,
}
