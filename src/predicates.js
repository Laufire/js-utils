/**
 * A set of predicate functions and partials to be used with filters.
 *
 */

import { equals, find, contains, findIndex } from './collection';
import { values } from './lib';
import { isDefined as rIsDefined } from './reflection';

/* Exports */
const isEqual = (left) => (right) => equals(left, right);

const isSame = (left) => (right) => left === right;

const is = isSame;

const isPart = (left) => (right) => contains(left, right);

const doesContain = (left) => (right) => contains(right, left);

const truthy = (right) => !!right;

const falsy = (right) => !right;

const everything = () => true;

const nothing = () => false;

const first = (
	value, i, collection
) => findIndex(collection, isEqual(value)) === i;

const unique = first;

const isIn = (predicate) => (value) => values(predicate).includes(value);

const key = (predicate) => (dummy, value) => predicate(value);

const value = (predicate) => (item) => predicate(item);

/* Generators */
const not = (predicate) => (right, ...rest) => !predicate(right, ...rest);

const and = (...predicates) => (right, ...rest) =>
	!rIsDefined(find(predicates, (predicate) => !predicate(right, ...rest)));

const or = (...predicates) => (right, ...rest) =>
	rIsDefined(find(predicates, (predicate) => predicate(right, ...rest)));

const onProp = (prop, predicate) =>
	(right, ...rest) => predicate(right[prop], ...rest);

const hasProp = (prop) => (item) =>
	Object.hasOwnProperty.apply(item, [prop]);

/**
 * A function to derive predicates from collection functions like equals,
 * contains, has, shares, etc.
 */
const predicate = (
	fn, left, ...rest
) => (right) => fn(
	right, left, ...rest
);

const isDefined = (data) => rIsDefined(data);

export {
	isEqual, isSame, isPart, doesContain,
	truthy, falsy, everything, nothing,
	first, unique, not, and, or, onProp,
	predicate, isIn, key, value, is, isDefined, hasProp,
};
