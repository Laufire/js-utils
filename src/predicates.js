/**
 * A set of predicate functions and partials to be used with filters.
 *
 */

import { equals, find, shares } from './collection';
import { isDefined } from './reflection';

const isEqual = (left) => (right) => equals(left, right);

const isSame = (left) => (right) => left === right;

const isPart = (left) => (right) => shares(left, right);

const doesShare = isPart;

const not = (fn) => (right) => !fn(right);

const and = (...predicates) => (right) =>
	!isDefined(find(predicates, (predicate) => !predicate(right)));

const or = (...predicates) => (right) =>
	isDefined(find(predicates, (predicate) => predicate(right)));

const onProp = (prop, predicate) => (right) => predicate(right[prop]);

const truthy = (right) => !!right;

const falsy = (right) => !right;

const everything = () => true;

const nothing = () => false;

export {
	isEqual, isSame, isPart, doesShare,
	not, and, or, onProp,
	truthy, falsy, everything, nothing,
};
