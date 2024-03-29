/**
 * A set of functions and partials to be used with reducers.
 */

import { keys } from './lib';
import { isArray } from './reflection';

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

// LATER: Think of introducing flat for objects.
const flat = (t, c) =>
	[...t, ...isArray(c) ? c.flat(Infinity) : [c]];

/**
 * A function to derive reducers from collection functions like merge,
 * compose, squash and adopt.
 */
// LATER: Rename the function to highlight the use of underlying collection.
const reducer = (fn) => (t, c) => fn(t, c);

export {
	sum,
	product,
	avg,
	len,
	count,
	min,
	max,
	reducer,
	flat,
};
