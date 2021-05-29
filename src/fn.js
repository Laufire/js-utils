/**
 * A set of functions to help with calling other functions.
 *
 */

import { hasSame } from './collection';

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

export {
	cache,
};
