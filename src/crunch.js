/* Helpers */
import { map, merge, values } from './collection';

/* Exports */
const index = (collection, ...indexKeys) => {
	indexKeys.reverse();

	return merge(...values(map(collection, (item) =>
		indexKeys.reduce((agg, key) => ({ [item[key]]: agg }), item))));
};

export {
	index,
};
