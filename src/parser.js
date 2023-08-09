import { map, merge, reduce } from './collection';

const tag = (
	collection, tags, tagProp = 'tags'
) =>
	map(collection, (item) =>
		merge(reduce(
			item[tagProp] || [], (acc, cur) => merge(acc, tags[cur]), {}
		),
		item));

export { tag };
