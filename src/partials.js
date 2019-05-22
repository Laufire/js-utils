/**
 * A set of functions that generate partial functions.
 *
 * Using partials with array iterators improves readability.
 */

/* Exports */
/**
 *
 * @param {Object} map
 * @returns {Function} The function used to translate a key to respective value. Ex: (k) => value.
 */
const translate = (map) => (key) => map[key];

export {
	translate,
}
