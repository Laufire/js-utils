import { map, merge, reduce, shell } from './collection';

const tag = (
	collection, tags, tagProp = 'tags'
) =>
	map(collection, (item) =>
		merge(reduce(
			item[tagProp] || [],
			(acc, cur) => merge(acc, tags[cur]),
			shell(item)
		),
		item));

export { tag };
