/**
 * Reflection
 */
import { isArray as libIsArray } from './lib';

/* Helpers */

const isArray = libIsArray;

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
	const startpos = 8;
	const endpos = -1;
	const type = typeof value;

	return type !== 'object'
		? type
		: value !== null
			? Object.prototype.toString.call(value)
				.slice(startpos, endpos)
				.toLowerCase()
			: 'null';
};

/* Aliases */
const isCollection = isIterable;

const isEmpty = (value) => [null, undefined, NaN].includes(value);

const isSimple = (value) => !isEmpty(value)
	&& ['number', 'string', 'boolean'].includes(inferType(value));

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
	isEmpty,
	isSimple,
};
