/**
* Helper functions to deal with collections.
*
* # ToDo
* 	* Complete the doc comments.
* #  Notes
* 	* Keys with undefined values are treated as non-existent, so to allow for simplicity.
*/

/* Helpers */
import { isArray, isIterable, isObject } from './reflection';
const toArray = (value) => (isArray(value) ? value : [value]);
const keyArray = (object) => (isArray(object) ? object : keys(object)); // eslint-disable-line no-use-before-define
const getShell = (iterable) => (isArray(iterable) ? [] : {});
const mergeObjects = (base, extension) => 	{
	keys(extension).forEach((key) => { // eslint-disable-line no-use-before-define
		const child = base[key];
		const childExtension = extension[key];

		base[key] = isIterable(childExtension) && isIterable(child)
			? mergeObjects(child, childExtension)
			: childExtension;
	});

	return base;
};

const combineObjects = (base, extension) =>
	(isArray(base) && isArray(extension)
		? (base.push(...extension), base)
		: (keys(extension).forEach((key) => { // eslint-disable-line no-use-before-define
			const child = base[key];
			const childExtension = extension[key];

			base[key] = isIterable(child) && isIterable(childExtension)
				? combineObjects(child, childExtension)
				: childExtension;
		}), base)
	);

const { freeze, preventExtensions, // eslint-disable-line id-length
	seal } = Object; // eslint-disable-line id-match

/* Exports */
const { assign, entries, keys, values } = Object; // eslint-disable-line id-match

const fromEntries = (kvPairs) => kvPairs.reduce((agg, pair) => {
	agg[pair[0]] = pair[1];
	return agg;
}, {});

// An Array.map like function for Iterables.
const collect = (iterable, cb) => {
	const ret = getShell(iterable);

	keys(iterable).forEach((key) => (ret[key] = cb(iterable[key], key)));
	return ret;
};

// NOTE: The standard each implementation is avoided, it doesn't align with the principle of having a return value.
const each = collect;

// An Array.filter like function for Objects.
const filter = (obj, cb) => {
	const ret = getShell(obj);

	keys(obj).forEach((key) => {
		if(cb(obj[key], key))
			ret[key] = obj[key];
	});

	return ret;
};

// Recursively passes all the primitives to the given callback.
const traverse = (obj, cb) => collect(obj, (value, key) =>
	(isIterable(value) ? traverse(value, cb) : cb(value, key)));

const clone = (() => {
	const cloneObj = (obj) => collect(obj, clone);
	const cloneArray = (arr) => arr.map(clone);

	return (value) =>
		(isObject(value)
			? cloneObj(value)
			: isArray(value)
				? cloneArray(value)
				: value
		);
})();

const props = (obj, objProps) => objProps.map((prop) => obj[prop]);

const select = (obj, selector) => keyArray(selector)
	.reduce((aggregate, prop) => // eslint-disable-line no-return-assign
		(obj[prop] !== undefined && (aggregate[prop] = obj[prop]), aggregate), // eslint-disable-line no-sequences
	{});

const omit = (obj, selector) => {
	const propsToOmit = keyArray(selector);

	return keys(obj).filter((prop) => !propsToOmit.includes(prop))
		.reduce((aggregate, prop) => // eslint-disable-line no-return-assign
			(aggregate[prop] = obj[prop], aggregate) // eslint-disable-line no-sequences
		, {});
};

/**
 * Combines multiple objects and their descendants with the given base object. When immutability is required, a shell could be passed as the base object.
 * @param {object} base The base object on which the extensions would be combined to.
 * @param {...object} extensions The objects to be combined.
 */
const combine = (base, ...extensions) =>
	extensions.forEach((extension) =>
		extension !== undefined && combineObjects(base, extension)) || base;

/**
 * Merges multiple objects and their descendants with to the given base object. When immutability is required, a shell could be passed as the base object.
 * @param {object} base The base object on which the extensions would be merged to.
 * @param {...object} extensions The objects to be merged.
 */
const merge = (base, ...extensions) =>
	extensions.forEach((extension) =>
		extension !== undefined && mergeObjects(base, extension)) || base;

// Merges an array of objects / object-arrays into a single object.
const squash = (...objects) =>
	assign({}, ...objects.reduce((aggregate, value) =>
		[...aggregate, ...toArray(value)], []));

/**
 * Retrieves the value, notified by a path, from a nested map. Slashes are used as the separator for readability. Starting paths with a slash yields better accuracy.
 * @param {object} obj The object to look into.
 * @param {string} path The path to look for. Slash is the separator. And backslash is the escape char.
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

// NOTE: Clean does not clean recursively to allow for shallow cleaning.
const clean = (iterable) => {
	if(isArray(iterable))
		return iterable.filter((value) => value !== undefined);

	const ret = {};
	const objKeys = keys(iterable);
	const l = objKeys.length;
	let i = 0;

	while(i < l) {
		const key = objKeys[i++];
		const val = iterable[key];

		if(val !== undefined)
			ret[key] = val;
	}

	return ret;
};

/* A recursive clean */
const sanitize = (iterable) =>
	clean(collect(iterable,
		(value) => (isIterable(value) ? sanitize(value) : value)));

// Swaps the keys and values of a map.
const flip = (obj) => {
	const ret = {};

	keys(obj).forEach((key) => (ret[obj[key]] = key));
	return ret;
};

// Converts a one-to-many map (an object of array values) as an one-to-one inverted map, to ease reverse lookups. IE: {'a': ['b', 'c']} => {'b': 'a', 'c': 'a'}.
const flipMany = (obj) => {
	const ret = {};

	keys(obj).forEach((key) => obj[key].forEach((item) => (ret[item] = key)));
	return ret;
};

// Ex: ([3, 5], {1: "a"}) => {a: 5}
const translate = (source, translationMap) =>
	entries(translationMap).reduce((ret, [key, value]) =>
		assign(ret, { [value]: source[key] }), {});

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
	const difference = getShell(base);

	keys(compared).forEach((key) => { // eslint-disable-line complexity
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
	freeze(preventExtensions(seal(collect(object, (value) =>
		(isIterable(value) ? secure(value) : value)))));

const equals = (base, compared) =>
	(isIterable(base) && isIterable(compared)
		? keys(base)
			.findIndex((key) => !equals(base[key], compared[key])) === -1 // eslint-disable-line no-magic-numbers
		: base === compared);

export {
	keys, values, entries, fromEntries, props,
	each, collect, traverse,
	clean, sanitize,
	filter, omit, select, result,
	flip, flipMany, translate,
	assign, clone, squash, combine, merge, compose,
	patch, diff, secure, equals,
};
