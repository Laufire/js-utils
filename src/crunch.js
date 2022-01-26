/* Helpers */
import { combine, filter, gather, map, values, reduce,
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

const descend = (
	collection, process, level
) => (level
	? map(collection, (item) => descend(
		item, process, level - 1
	))
	: map(collection, process));

const summarize = (
	collection, indexes, summarizer, initial
) => descend(
	index(collection, indexes), (indexed) =>
		reduce(
			indexed, summarizer, initial
		), indexes.length - 1
);

const transpose = (collection) => gather(collection,
	filter(values(map(collection, keys)).flat(), unique));

const group = (collection, grouper) => reduce(
	collection, (
		acc, item, ...rest
	) => {
		const category = grouper(item, ...rest);

		acc[category] = [...acc[category] || [], item];
		return acc;
	}, {}
);

export {
	index,
	summarize,
	descend,
	transpose,
	group,
};
