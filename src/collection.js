/**
* Helper functions to deal with collections.
*
* # ToDo
* 	* Complete the doc comments.
* # Notes
* 	* Keys with undefined values are treated as non-existent, so to allow for simplicity.
*/

/* Helpers */
import { isArray, isIterable, isObject } from './reflection';
const toArray = (value) => (isArray(value) ? value : [value]);
const keyArray = (object) => (isArray(object) ? object : keys(object)); // eslint-disable-line no-use-before-define
const mergeObjects = (base, extension) => 	{
	keys(extension).forEach((key) => { // eslint-disable-line no-use-before-define
		const child = base[key];
		const childExtension = extension[key];

		base[key] = isIterable(childExtension) && isIterable(child)
			? mergeObjects(child, childExtension)
			: clone(childExtension); // eslint-disable-line no-use-before-define
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
				: clone(childExtension); // eslint-disable-line no-use-before-define
		}), base)
	);

const { freeze, preventExtensions, // eslint-disable-line id-length
	seal } = Object; // eslint-disable-line id-match

/* Exports */
const { assign, entries, keys, values } = Object; // eslint-disable-line id-match

/**
 * Returns an empty container of the same type as the given iterable.
 * @param {*} iterable The iterable to get a shell for.
 */
const shell = (iterable) => (isArray(iterable) ? [] : {});

const fromEntries = (kvPairs) => kvPairs.reduce((agg, pair) => {
	agg[pair[0]] = pair[1];
	return agg;
}, {});

// An Array.map like function for Iterables.
const map = (iterable, cb) => {
	const ret = shell(iterable);

	keys(iterable).forEach((key) => (ret[key] = cb(iterable[key], key)));
	return ret;
};

// NOTE: The standard each implementation is avoided, it doesn't align with the principle of having a return value.
const each = map;

// An Array.filter like function for Objects.
const filter = (obj, cb) => {
	const ret = shell(obj);

	keys(obj).forEach((key) => {
		if(cb(obj[key], key))
			ret[key] = obj[key];
	});

	return ret;
};

// Recursively passes all the primitives to the given callback.
const traverse = (obj, cb) => map(obj, (value, key) =>
	(isIterable(value) ? traverse(value, cb) : cb(value, key)));

// Recursively passes all the props to the given callback.
const walk = (obj, cb) => map(obj, (value, key) =>
	(isIterable(value) && walk(value, cb), cb(value, key))); // eslint-disable-line no-sequences

const clone = (() => {
	const cloneObj = (obj) => map(obj, clone);
	const cloneArray = (arr) => arr.map(clone);

	return (value) =>
		(isObject(value)
			? cloneObj(value)
			: isArray(value)
				? cloneArray(value)
				: value
		);
})();

/**
 * Has tells whether the given iterable has the given value.
 * @param {*} iterable The iterable to collect the values from.
 * @param {*} value The props to collect from the children of the iterable.
 */
const has = (iterable, value) => values(iterable).indexOf(value) > -1;

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
	clean(map(iterable,
		(value) => (isIterable(value) ? sanitize(value) : value)));

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
 * Gathers the given props from the children of the given iterable, as an iterable.
 * @param {*} iterable The iterable to collect the values from.
 * @param {...any} props The props to collect from the children of the iterable.
 */
const gather = (iterable, ...props) => { // eslint-disable-line no-shadow
	const propShell = shell(iterable);
	const ret = shell(values(iterable)[0]);

	props.forEach((prop) => {
		const child = shell(propShell);

		map(iterable, (value, key) =>
			(value[prop] !== undefined && (child[key] = value[prop])));
		ret[prop] = child;
	});

	return ret;
};

/**
 * Picks the given prop from the children of the given iterable, as an iterable.
 * @param {*} iterable The iterable to collect the values from.
 * @param {any} props The props to collect from the children of the iterable.
 */
const pick = (iterable, prop) => // eslint-disable-line no-shadow
	gather(iterable, prop)[prop];

/**
 * Spreads the children of given seeds iterable into the given base iterable.
 * @param {iterable} base The iterable to collect the values from.
 * @param {iterable} seeds The seeds iterable from where the props are spread.
 */
const spread = (base, seeds) =>
	map(seeds, (propValues, targetProp) =>
		map(propValues, (value, targetKey) =>
			(base[targetKey][targetProp] = value))) && base;

/**
 * Combines multiple objects and their descendants with the given base object. When immutability is required, a shell could be passed as the base object.
 * @param {iterable} base The base iterable on which the extensions would be combined to.
 * @param {...iterable} extensions The extensions to be combined.
 */
const combine = (base, ...extensions) =>
	extensions.forEach((extension) =>
		extension !== undefined && combineObjects(base, extension)) || base;

/**
 * Merges multiple objects and their descendants with to the given base object. When immutability is required, a shell could be passed as the base object.
 * @param {iterable} base The base iterable on which the extensions would be merged to.
 * @param {...iterable} extensions The extensions to be merged.
 */
const merge = (base, ...extensions) =>
	extensions.forEach((extension) =>
		extension !== undefined && mergeObjects(base, extension)) || base;

// TODO: Maintain the key order, similar to merge.
/**
 * Fills the missing properties of the given base from those of the extensions.
 * @param {iterable} base The base iterable on which the extensions would be filled.
 * @param {...iterable} extensions The extensions with properties to fill.
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
 * Retrieves the value, notified by a path, from a nested map. Slashes are used as the separator for readability. Starting paths with a slash yields better accuracy.
 * @param {iterable} obj The iterable to look into.
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

const equals = (base, compared) =>
	(isIterable(base) && isIterable(compared)
		? keys(base)
			.findIndex((key) => !equals(base[key], compared[key])) === -1 // eslint-disable-line no-magic-numbers
		: base === compared);

export {
	keys, values, entries, fromEntries, props,
	each, map, traverse, walk, has,
	clean, sanitize,
	filter, omit, select, result,
	flip, flipMany, rename,
	shell, assign, clone, squash, combine, merge, compose, fill,
	patch, diff, secure, equals,
	gather, pick, spread,
};
