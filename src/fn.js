/**
 * A set of functions to help with calling other functions.
 *
 */

import { hasSame } from './collection';
import { isFunction, isDefined } from './reflection';

const cache = (fn, qualifier = hasSame) => {
	// eslint-disable-next-line init-declarations
	let result;
	let prevArgs = [];

	// eslint-disable-next-line no-return-assign
	return (...args) =>
		(qualifier(args, prevArgs) && result !== undefined
			? result
			: (prevArgs = args, result = fn(...args)));
};

const value = (x) => (isFunction(x) ? x() : x);

const defined = (...values) => values.find(isDefined);

const self = (x) => x;

const identity = self;

const nothing = () => undefined;

const tryCatch = async (fn) => {
	try {
		return { data: await fn() };
	}
	catch (error) {
		return { error };
	}
};

export {
	cache,
	value,
	defined,
	self,
	identity,
	nothing,
	tryCatch,
};
