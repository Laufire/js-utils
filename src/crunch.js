/* Helpers */
import { combine, filter, gather, map, merge, values,
	keys } from './collection';
import { unique } from './predicates';

/* Exports */
const index = (collection, indexes) => {
	const indexKeys = values(indexes).reverse();

	return combine(...values(map(collection, (item) =>
		indexKeys.reduce((
			agg, indexKey, i
		) => ({ [item[indexKey]]: i === 0 ? [agg] : agg }), item))));
};

const summarize = (
	collection, summarizer, indexes
) => {
	const indexKeys = values(indexes).reverse();

	return merge(...values(map(collection, (item) =>
		indexKeys.reduce((agg, key) =>
			({ [item[key]]: agg }), summarizer(item)))));
};

const descend = (
	collection, process, level
) => (level
	? map(collection, (item) => descend(
		item, process, level - 1
	))
	: map(collection, process));

const transpose = (collection) => gather(collection,
	filter(values(map(collection, keys)).flat(), unique));

export {
	index,
	summarize,
	descend,
	transpose,
};
