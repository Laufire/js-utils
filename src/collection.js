/**
 * Helper functions to deal with collections.
 */

 /* Exports */
const { assign, entries, keys, values } = Object;

const fromEntries = (kvPairs) => kvPairs.reduce((agg, pair) => { agg[pair[0]] = pair[1]; return agg; }, {});

module.exports = {

	assign, entries, keys, values,
	fromEntries,
}
