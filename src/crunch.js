/* Helpers */
import { combine, map, merge, values } from './collection';

/* Exports */
const index = (collection, ...indexKeys) => {
	indexKeys.reverse();

	return combine(...values(map(collection, (item) =>
		indexKeys.reduce((
			agg, indexKey, i
		) => ({ [item[indexKey]]: i === 0 ? [agg] : agg }), item))));
};

const summarize = (
	collection, summarizer, ...indexKeys
) => {
	indexKeys.reverse();

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

export {
	index,
	summarize,
	descend,
};
