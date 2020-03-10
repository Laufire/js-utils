
/**
* Helper functions to deal with collections.
*
* # ToDo
* 	* Complete the doc comments.
* 	* Handle arrays in a better fashion. Assume the base based on the type of the iterable ({} / []).
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

		isIterable(child) && isIterable(childExtension)
			? mergeObjects(child, childExtension)
			: base[key] = childExtension;
	});
};

const combineObjects = (base, extension) =>
	(isArray(base) && isArray(extension)
		? base.concat(extension)
		: (keys(extension).forEach((key) => { // eslint-disable-line no-use-before-define
			/* eslint-disable complexity */
			const child = base[key];
			const childExtension = extension[key];

			base[key] = isIterable(child) && isIterable(childExtension)
				? combineObjects(child, childExtension)
				: childExtension;
		}), base));

/* Exports */
const { assign, entries, keys, values } = Object; // eslint-disable-line id-match

const fromEntries = (kvPairs) => kvPairs.reduce((agg, pair) => {
	agg[pair[0]] = pair[1];
	return agg;
}, {});

// An Array.map like function for Objects.
const collect = (iterable, cb) => {
	const ret = getShell(iterable);

	keys(iterable).forEach((key) => (ret[key] = cb(iterable[key], key)));
	return ret;
};

// An Array.map like function for Objects.
const filter = (obj, cb) => {
	const ret = {};

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
 * Combines multiple objects and their properties. The difference between merge and combine is that combine concatenates arrays.
 * @param {object} base The base object onto which the extensions would be merged.
 * @param  {...object} extensions
 */
const combine = (base, ...extensions) => {
	extensions.forEach((extension) => // eslint-disable-line no-return-assign
		base = combineObjects(base, extension)); // eslint-disable-line no-param-reassign

	return base;
};

/**
 * Merges multiple objects and their properties.
 * @param {object} base The base object onto which the extensions would be merged.
 * @param  {...object} extensions
 */
const merge = (base, ...extensions) => {
	extensions.forEach((extension) =>
		mergeObjects(base, extension));

	return base;
};

// Merges an array of objects into a single object.
const squash = (...objects) =>
	assign({}, ...objects.reduce((aggregate, value) =>
		[...aggregate, ...toArray(value)], []));

/**
 * Retrieves the value, notified by a path, from a nested map. Slashes are used as the separator for readability.
 * @param {object} obj The object to look into.
 * @param {string} path The path to look for. Slash is the separator. And backslash is the escape char.
 * @returns {*} The value from the path or undefined.
 */
const result = (obj, path) => {
	const parts = path.split(/(?<!(?:[^\\])(?:\\{2})*\\)\//g)
		.map((part) => part.replace(/\\(.)/g, '$1'));
	const partCount = parts.length;
	let currentObject = obj;
	let partIndex = 0;

	while(partIndex < partCount && typeof currentObject === 'object')
		currentObject = currentObject[parts[partIndex++]];

	if(partIndex === partCount)
		return currentObject;
};

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
				?	diff(isArray(baseChild) !== isArray(comparedChild)
					? isObject(comparedChild) ? {} : []
					: baseChild,
				comparedChild)
				: comparedChild;
		}
	});

	keys(base).forEach((key) =>
		compared[key] === undefined && (difference[key] = undefined));

	return difference;
};

export {
	keys, values, entries, fromEntries, props,
	collect, traverse,
	clean, sanitize,
	filter, omit, select, result,
	flip, flipMany, translate,
	assign, clone, squash, combine, merge, compose,
	patch, diff,
};
