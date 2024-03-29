/**
 * A set of functions that generate partial functions.
 *
 * Using partials with array iterators improves readability.
 */

import { translate as cTranslate, merge, reduce } from './collection';
import { values } from './lib';
import { inferType } from './reflection';

/* Exports */
/**
 *
 * @param {Object} map
 * @returns {Function} The function used to translate a key to respective
 * value.
 * Ex: (k) => value.
 */
const translate = (map) => (key) => map[key];

// eslint-disable-next-line max-lines-per-function
const partial = (() => {
	const helpers = {
		array: {
			args: (fixed) => {
				let j = 0;
				const placeholders = reduce(
					fixed, (
						t, c, i
					// eslint-disable-next-line no-sequences
					) => (c === undefined && (t[i] = j++), t), {}
				);

				return values(placeholders).length
					? (dynamic) => merge(
						[], fixed, cTranslate(dynamic, placeholders)
					)
					: (dynamic) => fixed.concat(dynamic);
			},
			cb: ({ args, fixed, fn }) =>
				(...dynamic) => fn(...args(fixed)(dynamic)),
		},
		object: {
			args: (fixed) => (dynamic) => ({ ...fixed, ...dynamic }),
			cb: ({ args, fixed, fn }) => (dynamic) => fn(args(fixed)(dynamic)),
		},
	}
;

	return (fn, fixed) => {
		const { args, cb } = helpers[inferType(fixed)];

		return cb({ args, fixed, fn });
	};
})();

export {
	partial,
	translate,
};
