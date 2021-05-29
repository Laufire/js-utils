/**
 * A set of functions and partials to be used with reducers.
 *
 * NOTE: Some collection functions like merge, compose, squash,
 * adopt, etc work well with reducers.
 */

import { keys } from './lib';

const sum = (t, c) => t + c;

const product = (t, c) => t * c;

const avg = (
	t, c, dummy, collection
) =>
	t + (c / keys(collection).length);

const count = (t) => t + 1;

const min = (t, c) => (t < c ? t : c);

const max = (t, c) => (t > c ? t : c);

export {
	sum,
	product,
	avg,
	count,
	min,
	max,
};
