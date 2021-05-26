/**
 * A set of predicate functions and partials to be used with filters.
 *
 */

import { equals, shares } from './collection';

const isEqual = (left) => (right) => equals(left, right);

const isSame = (left) => (right) => left === right;

const isPart = (left) => (right) => shares(left, right);

const doesShare = isPart;

const not = (fn) => (right) => !fn(right);

const onProp = (prop, predicate) => (right) => predicate(right[prop]);

const truthy = (right) => !!right;

const falsy = (right) => !right;

const everything = () => true;

const nothing = () => false;

export {
	isEqual, isSame, isPart, doesShare, not, onProp,
	truthy, falsy, everything, nothing,
};
