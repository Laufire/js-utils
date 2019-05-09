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

module.exports = {

	assign, entries, keys, values,
	fromEntries,
	collect, flip, flipMany, props,
}
