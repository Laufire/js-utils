import * as laufire from '.';
import { traverse } from './collection';

const isGetter = (obj, prop) =>
	!!Object.getOwnPropertyDescriptor(obj, prop).get;

describe('laufire', () => {
	test('no getters are exported', () => {
		traverse(laufire, (
			dummy, key, obj
		) => {
			if(isGetter(obj, key))
				throw new Error(`Getter exported: ${ key }`);
		});
	});
});
