/**
 * A set of predicate functions and partials to be used with sort functions.
 *
 */

const ascending = (a, b) => (a > b ? 1 : a < b ? -1 : 0);

const descending = (a, b) => (a < b ? 1 : a > b ? -1 : 0);

const existing = () => 0;

const reverse = () => -1;

const onProp = (prop, sorter) => (a, b) => sorter(a[prop], b[prop]);

export {
	ascending,
	descending,
	existing,
	reverse,
	onProp,
};
