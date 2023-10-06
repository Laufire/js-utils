/**
 * A set of functions to help with calling other functions.
 *
 */

import { hasSame, reduceSync } from './collection';
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

const pipe = (pipes) => (data) => reduceSync(
	pipes, (acc, c) => c(acc), data,
);

const value = (x) => (isFunction(x) ? x() : x);

const defined = (...values) => values.find(isDefined);

const self = (x) => x;

const identity = self;

const nothing = () => undefined;

export {
	cache,
	value,
	defined,
	self,
	identity,
	nothing,
	pipe,
};
