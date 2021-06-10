/**
 * A set of functions and partials to be used with reducers.
 */

import { keys } from './lib';

const sum = (t, c) => t + c;

const product = (t, c) => t * c;

const avg = (
	t, c, dummy, collection
) =>
	t + (c / keys(collection).length);

const len = (t) => t + 1;

const count = (value) =>
	(t, c) => t + (c === value ? 1 : 0);

const min = (t, c) => (t < c ? t : c);

const max = (t, c) => (t > c ? t : c);

export {
	sum,
	product,
	avg,
	len,
	count,
	min,
	max,
};
