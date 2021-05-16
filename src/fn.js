/**
 * A set of functions to help with calling other functions.
 *
 */

import { hasSame } from './collection';

const cache = (fn, qualifier = hasSame) => {
	let result; // eslint-disable-line init-declarations
	let prevArgs = [];

	return (...args) => // eslint-disable-line no-return-assign
		(qualifier(args, prevArgs) && result !== undefined
			? result
			: (prevArgs = args, result = fn(...args)));
};

export {
	cache,
};
