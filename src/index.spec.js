import { traverse } from '@laufire/utils/collection';
import * as laufire from '.';

const isGetter = (obj, prop) =>
	!!Object.getOwnPropertyDescriptor(obj, prop).get;

describe('laufire', () => {
	test('no getters are exported, so to control the exports', () => {
		traverse(laufire, (
			dummy, key, obj
		) => {
			if(isGetter(obj, key))
				throw new Error(`Getter exported: ${ key }`);
		});
	});
});
