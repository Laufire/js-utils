/**
* Helper functions to deal with collections.
*
* TODO: Add a function to recursives parse an object through some given function.
* TODO: Write the doc comments.
*/

/* Helpers */
const isObject = (value) =>
	value && value.constructor && value.constructor.name === 'Object' || false;

/* Exports */
const { assign, entries, keys, values } = Object;

const fromEntries = (kvPairs) => kvPairs.reduce((agg, pair) => { agg[pair[0]] = pair[1]; return agg; }, {});

const collect = (obj, cb) => { // An Array.map like function for Objects.
	let ret = {};
	keys(obj).forEach(key => ret[key] = cb(obj[key], key));
	return ret;
};

const traverse = (obj, cb) => collect(obj, (value, key) =>
	isObject(value) ? collect(value, cb) : cb(value, key)
);

const clone = (() => {
	const { isArray } = Array;
	const cloneObj = (obj) => collect(obj, clone);
	const cloneArray = (arr) => arr.map(clone);

	return (value) =>
		isObject(value)
			? cloneObj(value)
			: isArray(value)
				? cloneArray(value)
				: value;
})();

const props = (obj, properties) => properties.map(prop => obj[prop]);

const select = (obj, properties) => {
	const ret = {};
	const propCount = properties.length;
	let propIndex = 0;

	while(propIndex < propCount) {
		const prop = properties[propIndex++];
		ret[prop] = obj[prop];
	}

	return ret;
}

/**
 * Retrives the value, notified by a path, from a nested map. Slashes are used as the separator for readability.
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
};

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
};

const flipMany = (obj) => { // Convers a one-to-many map (an object of array values) as an one-to-one inverted map, to ease reverse lookups. IE: {'a': ['b', 'c']} => {'b': 'a', 'c': 'a'}.

	let ret = {};
	keys(obj).forEach(key => obj[key].forEach(item => ret[item] = key));
	return ret;
};

module.exports = {

	assign, entries, keys, values,
	fromEntries, collect, clean, clone, traverse,
	props, select, result,
	flip, flipMany,
}
