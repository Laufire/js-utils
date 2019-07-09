/**
* Helper functions to deal with collections.
*
* TODO: Complete the doc comments.
*/

/* Helpers */
import { isIterable, isObject } from './reflection';
const { isArray } = Array;
const toArray = (value) => isArray(value) ? value : [value];

const mergeObjects = (base, extension = {}) => 	{
	keys(extension).forEach((key) => {
		const child = base[key];
		const childExtension = extension[key];
		isIterable(child) && isIterable(childExtension)
			? mergeObjects(child, childExtension)
			: base[key] = childExtension
	});
}

/* Exports */
const { assign, entries, keys, values } = Object;

const fromEntries = (kvPairs) => kvPairs.reduce((agg, pair) => { agg[pair[0]] = pair[1]; return agg; }, {});

const collect = (obj, cb) => { // An Array.map like function for Objects.
	let ret = {};
	keys(obj).forEach(key => ret[key] = cb(obj[key], key));
	return ret;
}

const filter = (obj, cb) => { // An Array.map like function for Objects.
	let ret = {};
	keys(obj).forEach(key => {
		if(cb(obj[key], key))
			ret[key] = obj[key];
	});

	return ret;
}

const traverse = (obj, cb) => collect(obj, (value, key) =>
	isObject(value) ? collect(value, cb) : cb(value, key)
);

const clone = (() => {
	const cloneObj = (obj) => collect(obj, clone);
	const cloneArray = (arr) => arr.map(clone);

	return (value) =>
		isObject(value)
			? cloneObj(value)
			: isArray(value)
				? cloneArray(value)
				: value;
})();

const props = (obj, props) => props.map(prop => obj[prop]);

const select = (obj, props) => props.reduce((aggregate, prop) =>
	(aggregate[prop] = obj[prop], aggregate)
, {});

/**
 * Merges multiple objects and their properties.
 * @param {object} base The base object onto which the extensions would be merged.
 * @param  {...object} extensions
 */
const merge = (base, ...extensions) => {

	extensions.forEach((extension) =>
		mergeObjects(base, extension));

	return base;
}

const squash = (...values) => // Merges arrays of objects into a single object.
	assign({}, ...values.reduce((aggregate, value) => [...aggregate, ...toArray(value)], []));

/**
 * Retrieves the value, notified by a path, from a nested map. Slashes are used as the separator for readability.
 * @param {object} obj The object to look into.
 * @param {string} path The path to look for. Slash is the separator. And backslash is the escape char.
 * @returns {*} The value from the path or undefined.
 */
const result = (obj, path) => {
	const parts = path.split(/(?<!(?:[^\\])(?:\\{2})*\\)\//g).map(part => part.replace(/\\(.)/g, '$1'));
	const partCount = parts.length;
	let partIndex = 0;

	while(partIndex < partCount && typeof obj == 'object')
		obj = obj[parts[partIndex++]]

	if(partIndex === partCount)
		return obj;
}

const clean = (obj) => {
	const ret = {};
	const objKeys = keys(obj);
	const l = objKeys.length;
	let i = 0;
	while(i < l) {
		const key = objKeys[i++];
		const val = obj[key];
		if(val !== undefined)
			ret[key] = val;
	}

	return ret;
}

const flip = (obj) => { // Swaps the keys and values of a map.
	let ret = {};
	keys(obj).forEach(key => ret[obj[key]] = key);
	return ret;
}

const flipMany = (obj) => { // Converts a one-to-many map (an object of array values) as an one-to-one inverted map, to ease reverse lookups. IE: {'a': ['b', 'c']} => {'b': 'a', 'c': 'a'}.
	let ret = {};
	keys(obj).forEach(key => obj[key].forEach(item => ret[item] = key));
	return ret;
}

const translate = (source, translationMap) => // ([3, 5], {1: "a"}) => {a: 5}
	entries(translationMap).reduce((ret, [key, value]) =>
		assign(ret, {[value]: source[key]}), {});

const compose = (...overlays) => {
	const keysToPick = keys(overlays[0]);
	const keysLength = keysToPick.length;
	return overlays.reduce((aggregate, current) => {
		let i = keysLength;
		while(i) {
			const key = keysToPick[--i];
			const val = current[key];
			if((val) !== undefined)
				aggregate[key] = val;
		}

		return aggregate;
	}, {});
};

export {
	assign, entries, keys, values,
	fromEntries, collect, filter,
	clean, clone, merge,
	props, traverse, select, squash, result,
	flip, flipMany, translate, compose,
}
