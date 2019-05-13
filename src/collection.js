/**
* Helper functions to deal with collections.
*/

/* Exports */
const { assign, entries, keys, values } = Object;

const fromEntries = (kvPairs) => kvPairs.reduce((agg, pair) => { agg[pair[0]] = pair[1]; return agg; }, {});

const collect = (obj, cb) => { // An Array.map like function for Objects.

	let ret = {};
	keys(obj).forEach(key => ret[key] = cb(obj[key], key));
	return ret;
};

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

const props = (obj, properties) => properties.map(prop => obj[prop]);

/**
 * Retrives the value, notified by a path, from a nested map. Slashes are used as the separator for readability.
 * @param {object} obj The object to look into.
 * @param {string} path The path to look for. Slash is the separator. And backslash is the escape char.
 * @returns {*} The value from the path or undefined.
 */
const result = (obj, path) => {
	const parts = path.split(/(?<!(?:[^\\])(?:\\{2})*\\)\//g).map(part => part.replace(/\\(.)/g, '$1'));
	const l = parts.length;
	let i = 0;

	while(i < l && typeof obj == 'object')
		obj = obj[parts[i++]]

	if(i == l)
		return obj;
};

module.exports = {

	assign, entries, keys, values,
	fromEntries, collect, flip, flipMany,
	props, result,
}
