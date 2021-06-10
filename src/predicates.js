/**
 * A set of predicate functions and partials to be used with filters.
 *
 */

import { equals, find, shares } from './collection';
import { values } from './lib';
import { isDefined } from './reflection';

/* Exports */
const isEqual = (left) => (right) => equals(left, right);

const isSame = (left) => (right) => left === right;

const isPart = (left) => (right) => shares(left, right);

const doesShare = isPart;

const truthy = (right) => !!right;

const falsy = (right) => !right;

const everything = () => true;

const nothing = () => false;

const first = (
	value, i, collection
) => values(collection).indexOf(value) === i;

const unique = first;

/* Generators */
const not = (predicate) => (right, ...rest) => !predicate(right, ...rest);

const and = (...predicates) => (right, ...rest) =>
	!isDefined(find(predicates, (predicate) => !predicate(right, ...rest)));

const or = (...predicates) => (right, ...rest) =>
	isDefined(find(predicates, (predicate) => predicate(right, ...rest)));

const onProp = (prop, predicate) =>
	(right, ...rest) => predicate(right[prop], ...rest);

export {
	isEqual, isSame, isPart, doesShare,
	truthy, falsy, everything, nothing,
	first, unique,
	not, and, or, onProp,
};
