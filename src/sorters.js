/**
 * A set of predicate functions and partials to be used with sort functions.
 *
 */

/* Helpers */
import { keys } from './lib';

/* Exports */
const ascending = (a, b) => (a > b ? 1 : a < b ? -1 : 0);

const descending = (a, b) => (a < b ? 1 : a > b ? -1 : 0);

const existing = () => 0;

const reverse = () => -1;

const onProp = (prop, sorter) => (a, b) => sorter(a[prop], b[prop]);

const defaultGrammar = {
	ascending,
	descending,
	existing,
	reverse,
};

const configured = (config, grammarExt) => {
	const grammar = { ...defaultGrammar, ...grammarExt };
	const props = keys(config);

	return (a, b) => {
		for(let i = 0; i < props.length; ++i) {
			const prop = props[i];
			const result = grammar[config[prop]](a[prop], b[prop]);

			if(result !== 0)
				return result;
		}

		return 0;
	};
};

export {
	ascending,
	descending,
	existing,
	reverse,
	onProp,
	configured,
};
