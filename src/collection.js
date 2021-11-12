/* eslint-disable max-lines */
/**
* Helper functions to deal with collections (collections).
*
* Notes:
* 	* Keys with undefined values are treated as non-existent,
* 		so to allow for simplicity.
*/

/*
TODO: Complete the doc comments.
*/

import { isArray, isIterable, isDict } from './reflection';
import { rndBetween } from './lib';
import { ascending } from './sorters';

/* NOTE: Exporting named imports (like keys) turns them into getters
 (probably by the compiler), this leads to some inconsistencies when
 mocking with jest. Hence, they are imported from the source.
*/
const { abs, ceil, sign } = Math;
const { assign, entries, keys: objKeys, values } = Object;

const toArray = (value) => (isArray(value) ? value : [value]);
const keys = (object) => (isArray(object)
	? objKeys(object).map(Number)
	: objKeys(object));
const keyArray = (object) => (isArray(object)
	? object.map(String)
	: keys(object));
const combineObjects = (base, extension) =>
	(isArray(base) && isArray(extension)
		// eslint-disable-next-line no-sequences
		? (base.push(...extension), base)
		: (keys(extension).forEach((key) => {
			const child = base[key];
			const childExtension = extension[key];

			base[key] = isIterable(childExtension)
				? isIterable(child)
					? combineObjects(child, childExtension)
					// eslint-disable-next-line no-use-before-define
					: clone(childExtension)
				: childExtension;
		}), base)
	);

const mergeObjects = (base, extension) => 	{
	keys(extension).forEach((key) => {
		const child = base[key];
		const childExtension = extension[key];

		base[key] = isIterable(childExtension)
			? isIterable(child)
				? mergeObjects(child, childExtension)
				// eslint-disable-next-line no-use-before-define
				: clone(childExtension)
			: childExtension;
	});

	return base;
};

const overlayObjects = (base, extension) => 	{
	keys(extension).forEach((key) => {
		const child = base[key];
		const childExtension = extension[key];

		base[key] = isDict(childExtension)
			? isDict(child)
				? overlayObjects(child, childExtension)
				// eslint-disable-next-line no-use-before-define
				: clone(childExtension)
			: childExtension;
	});

	return base;
};

// eslint-disable-next-line id-length
const { freeze, preventExtensions,
	// eslint-disable-next-line id-match
	seal } = Object;

/* Exports */

/**
 * Returns an empty container of the same type as the given collection.
 * @param {*} collection The collection to get a shell for.
 */
const shell = (collection) => (isArray(collection) ? [] : {});

const fromEntries = (kvPairs) => kvPairs.reduce((agg, pair) => {
	agg[pair[0]] = pair[1];
	return agg;
}, {});

// An Array.map like function for Iterables.
const map = (collection, cb) => {
	const ret = shell(collection);

	keys(collection).forEach((key) => (ret[key] = cb(collection[key], key)));
	return ret;
};

/*
NOTE: The standard each implementation is avoided, as it doesn't align -
	with the principle of having a return value.
*/
const each = map;

// An Array.filter like function for Objects.
const filter = (iterable, cb) => (isArray(iterable)
	? iterable.filter(cb)
	// eslint-disable-next-line no-return-assign
	: keys(iterable).reduce((t, key) => (
		(
			cb(
				iterable[key], key, iterable
			) && (t[key] = iterable[key]), t
		)
	)
	, {}));

// An Array.reduce like function for Objects.
const reduce = (
	obj, reducer, initial
) => {
	let acc = initial;

	keys(obj).forEach((key) => {
		acc = reducer(
			acc, obj[key], key, obj
		);
	});

	return acc;
};

const find = (collection, predicate) =>
	collection[keys(collection).find((key) =>
		predicate(collection[key], key))];

const findKey = (collection, predicate) => {
	const colKeys = keys(collection);

	return colKeys[colKeys.findIndex((key) => predicate(collection[key], key))];
};

const findIndex = findKey;

/*
* Recursively passes all the primitives in the given collection
* to the given callback.
*/
const traverse = (obj, cb) => map(obj, (value, key) =>
	(isIterable(value)
		? traverse(value, cb)
		: cb(
			value, key, obj
		)));

/*
* Recursively passes all the props of the given collections
* to the given callback.
*/
const walk = (obj, cb) => map(obj, (value, key) =>
	// eslint-disable-next-line no-sequences
	(isIterable(value) && walk(value, cb), cb(
		value, key, obj
	)));

const clone = (() => {
	const cloneObj = (obj) => map(obj, clone);
	const cloneArray = (arr) => arr.map(clone);

	return (value) =>
		(isDict(value)
			? cloneObj(value)
			: isArray(value)
				? cloneArray(value)
				: value
		);
})();

/**
 * Has tells whether the given collection has the given value.
 * @param {*} collection The collection to collect the values from.
 * @param {*} value The props to collect from the children of the collection.
 */
const has = (collection, value) => values(collection).indexOf(value) > -1;

// NOTE: Clean does not clean recursively to allow for shallow cleaning.
const clean = (collection) => {
	if(isArray(collection))
		return collection.filter((value) => value !== undefined);

	const ret = {};
	const objectKeys = keys(collection);
	const l = objectKeys.length;
	let i = 0;

	while(i < l) {
		const key = objectKeys[i++];
		const val = collection[key];

		if(val !== undefined)
			ret[key] = val;
	}

	return ret;
};

/* A recursive clean */
const sanitize = (collection) =>
	clean(map(collection,
		(value) => (isIterable(value) ? sanitize(value) : value)));

const props = (obj, objProps) => objProps.map((prop) => obj[prop]);

/*
TODO: select uses key from objects and values from arrays streamline this.
	This would be a #BREAKING change. keyArray is the source for this confusion.
*/
const select = (collection, selector) => keyArray(selector)
	.reduce((aggregate, prop) =>
		(collection[prop] !== undefined
		// eslint-disable-next-line no-sequences
		&& (aggregate[prop] = collection[prop]), aggregate),
	shell(collection));

/*
TODO: omit uses key from objects and values from arrays streamline this.
	This would be a #BREAKING change. keyArray is the source for this confusion.
*/
const omit = (obj, selector) => {
	const propsToOmit = keyArray(selector);

	return objKeys(obj).filter((prop) => !propsToOmit.includes(prop))
		// eslint-disable-next-line no-return-assign
		.reduce((aggregate, prop) =>
		// eslint-disable-next-line no-sequences
			(aggregate[prop] = obj[prop], aggregate)
		, shell(obj));
};

/**
 * Gathers the given props from the children of the given collection,
 * as a collection.
 * @param {*} collection The collection to collect the values from.
 * @param {...any} props The props to collect from the children
 * of the collection.
 */
// eslint-disable-next-line no-shadow
const gather = (collection, ...props) => {
	const propShell = shell(collection);
	const ret = shell(values(collection)[0]);

	props.forEach((prop) => {
		const child = shell(propShell);

		map(collection, (value, key) =>
			(value[prop] !== undefined && (child[key] = value[prop])));
		ret[prop] = child;
	});

	return ret;
};

/**
 * Picks the given prop from the children of the given collection,
 * as a collection.
 * @param {*} collection The collection to collect the values from.
 * @param {any} props The props to collect from the children of the collection.
 */
const pick = (collection, prop) =>
	gather(collection, prop)[prop];

// TODO: Fix the description.
/**
 * Spreads the children of given seeds collection into
 * the given base collection.
 * @param {collection} base The collection to collect the values from.
 * @param {collection} seeds The seeds collection from where
 * the props are spread.
 */
const spread = (base, seeds) =>
	map(seeds, (propValues, targetProp) =>
		map(propValues, (value, targetKey) =>
			(base[targetKey][targetProp] = value))) && base;

/**
 * Combines multiple objects and their descendants with the given base object.
 * When immutability is required, a shell could be passed as the base object.
 * @param {collection} base The base collection on which
 * the extensions would be combined to.
 * @param {...collection} extensions The extensions to be combined.
 */
const combine = (base, ...extensions) =>
	extensions.forEach((extension) =>
		extension !== undefined && combineObjects(base, extension)) || base;

/**
 * Merges multiple objects and their descendants with to the given base object.
 * When immutability is required, a shell could be passed as the base object.
 * @param {collection} base The base collection on which
 * the extensions would be merged to.
 * @param {...collection} extensions The extensions to be merged.
 */
const merge = (base, ...extensions) =>
	extensions.forEach((extension) =>
		extension !== undefined && mergeObjects(base, extension)) || base;

/**
 * Overlays multiple objects and their descendants with the given base object.
 * When immutability is required, a shell could be passed as the base object.
 * @param {collection} base The base collection on which
 * the extensions would be overlaid to.
 * @param {...collection} extensions The extensions to be overlaid.
 */
const overlay = (base, ...extensions) =>
	extensions.forEach((extension) =>
		extension !== undefined && overlayObjects(base, extension)) || base;

// TODO: Maintain the key order, similar to merge.
/**
 * Fills the missing properties of the given base from those of the extensions.
 * @param {collection} base The base collection on which
 * the extensions would be filled.
 * @param {...collection} extensions The extensions with properties to fill.
 */
const fill = (base, ...extensions) =>
	merge(base, merge(
		{}, ...extensions.reverse(), base
	));

// Merges an array of objects / object-arrays into a single object.
const squash = (...objects) =>
	assign({}, ...objects.reduce((aggregate, value) =>
		[...aggregate, ...toArray(value)], []));

/**
 * Retrieves the value, notified by a path, from a nested map.
 * Slashes are used as the separator for readability.
 * Starting paths with a slash yields better accuracy.
 * @param {collection} obj The collection to look into.
 * @param {string} path The path to look for. Slash is the separator.
 * And backslash is the escape char.
 * @returns {*} The value from the path or undefined.
 */
const result = (() => {
	const initialSlash = /^\//;
	const matcher = /(?:(?:[^/\\]|\\.)*\/)/g;
	const escapedSequence = /\\(.)/g;

	return (obj, path) => {
		const parts = (`${ path }/`.replace(initialSlash, '').match(matcher) || [])
			.map((part) => part.replace(escapedSequence, '$1').slice(0, -1));

		const partCount = parts.length;
		let currentObject = obj;
		let cursor = 0;

		while(cursor < partCount && isIterable(currentObject))
			currentObject = currentObject[parts[cursor++]];

		return currentObject;
	};
})();

// Swaps the keys and values of a map.
const flip = (obj) => {
	const ret = {};

	keys(obj).forEach((key) => (ret[obj[key]] = key));
	return ret;
};

/*
Converts a one-to-many map (an object of array values)
as an one-to-one inverted map, to ease reverse lookups.
IE: {'a': ['b', 'c']} => {'b': 'a', 'c': 'a'}.
*/
const flipMany = (obj) => {
	const ret = {};

	keys(obj).forEach((key) => obj[key].forEach((item) =>
		(ret[item] = key)));
	return ret;
};

const translate = (source, translationMap) =>
	entries(source).reduce((ret, [key, value]) =>
		assign(ret, { [key]: translationMap[value] }), shell(source));

// Ex: ([3, 5], {1: 'a'}) => {a: 5}
const rename = (source, renameMap) =>
	entries(renameMap).reduce((ret, [key, value]) =>
		assign(ret, { [value]: source[key] }), shell(source));

const compose = (...objects) => {
	const keysToPick = keys(objects[0]);
	const keysLength = keysToPick.length;

	return objects.reduce((aggregate, current) => {
		let i = 0;

		while(i < keysLength) {
			const key = keysToPick[i++];
			const val = current[key];

			if(val !== undefined)
				aggregate[key] = val;
		}

		return aggregate;
	}, {});
};

const patch = (base, extension) =>
	sanitize(merge(clone(base), extension));

const diff = (base, compared) => {
	const difference = shell(base);

	keys(compared).forEach((key) => {
		const baseChild = base[key];
		const comparedChild = compared[key];

		if(baseChild !== comparedChild) {
			difference[key] = isIterable(comparedChild)
				?	diff(baseChild, comparedChild)
				: comparedChild;
		}
	});

	keys(base).forEach((key) =>
		compared[key] === undefined && (difference[key] = undefined));

	return difference;
};

const secure = (object) =>
	freeze(preventExtensions(seal(map(object, (value) =>
		(isIterable(value) ? secure(value) : value)))));

const contains = (base, compared) =>
	(isIterable(base) && isIterable(compared)
		? keys(compared)
			.findIndex((key) => !contains(base[key], compared[key])) === -1
		: base === compared);

const equals = (base, compared) =>
	(isIterable(base) && isIterable(compared)
		? keys(base).length === keys(compared).length
			&& keys(base)
				.findIndex((key) => !equals(base[key], compared[key])) === -1
		: base === compared);

/* Tests the collections to have same children. */
const hasSame = (base, compared) =>
	keys(base).length === keys(compared).length
	&& findKey(base, (value, key) => value !== compared[key]) === undefined;

const dict = (collection) =>
	fromEntries(map(collection, (value, key) => [key, value]));

const adopt = (base, ...extensions) =>
	each(extensions, (extension) =>
		each(extension, (value, key) => (base[key] = value)));

const range = (
	// eslint-disable-next-line no-magic-numbers
	start = 0, end = 9, step = 1
) => Array.from({
	length: sign(end - start) !== sign(step) || !step
		? 0
		: ceil(abs(end - start) / abs(step)),
},
(dummy, i) => (i * step) + start);

const shares = (
	left, right, prop = 'id'
) =>
	left[prop] === right[prop];

const shuffle = (collection) => {
	const ixs = keys(collection);
	const newIxs = [];

	while(ixs.length)
		newIxs.push(ixs.splice(rndBetween(0, ixs.length - 1), 1)[0]);

	return newIxs.reduce(isArray(collection)
		// eslint-disable-next-line no-return-assign
		? (
			t, c, i
		// eslint-disable-next-line no-sequences
		) => (t[i] = collection[c], t)
		// eslint-disable-next-line no-return-assign
		: (t, c) =>
		// eslint-disable-next-line no-sequences
			(t[c] = collection[c], t),
	shell(collection));
};

const sort = (collection, sorter = ascending) => (isArray(collection)
	? collection.slice().sort(sorter)
	: fromEntries(entries(collection).sort((a, b) => sorter(a[1], b[1]))));

export {
	keys, values, entries, fromEntries, props,
	each, map, filter, reduce,
	traverse, walk, has,
	clean, sanitize, omit, select, result,
	flip, flipMany, rename, translate,
	shell, assign, clone, squash, combine, merge, overlay, compose, fill,
	patch, diff, secure, equals, contains,
	gather, pick, spread, dict, adopt,
	find, findKey, findIndex, range, hasSame, shares, shuffle, sort,
};
