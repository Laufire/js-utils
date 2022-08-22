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

const onProp = (prop, sorter = ascending) => (a, b) => sorter(a[prop], b[prop]);

const defaultGrammar = {
	ascending,
	descending,
	existing,
	reverse,
};

const compile = (config, grammarExt) => {
	const grammar = { ...defaultGrammar, ...grammarExt };
	const props = keys(config);

	return (a, b) => {
		let result = 0;

		props.find((prop) =>
			(result = grammar[config[prop]](a[prop], b[prop])) !== 0);

		return result;
	};
};

export {
	ascending,
	descending,
	existing,
	reverse,
	onProp,
	compile,
};
