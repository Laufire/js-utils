import { map, merge, reduce } from './collection';

const tag = (collection, tags) =>
	map(collection, (item) =>
		merge(reduce(
			item.tags, (acc, cur) => merge(acc, tags[cur]), {}
		),
		item));

export { tag };
