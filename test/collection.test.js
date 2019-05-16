/* Tested */
const {
	clean, collect, entries,
	flip, flipMany, fromEntries,
	props, result, traverse } = require('../src/collection');

describe('Collections', () => {

	/* Mocks and Stubs */
	const simpleObj = {
		a: 1,
		b: 2,
	};

	const nestedObj = {
		single: 'single',
		parent: {
			child: 'child',
			'escaped/child': 'escaped/child',
			'un\\/escaped\\/child': 'un\\/escaped\\/child',
		},
		undeifinedProp: undefined,
	};

	/* Tests */
	test('clean should remove undefined props', () => {
		expect(clean(nestedObj)).not.toHaveProperty('undefinedProperty');
	});

	test('collect should work with all the properties of the object and build a new object', () => {
		const cb = (val, key) => key + val;

		expect(collect(simpleObj, cb)).toEqual({
			a: 'a1',
			b: 'b2',
		});
	});

	test('traverse should recursively traverse through a given object and build a new object', () => {
		const simpleObj = {
			a: 1, b: 2,
			c: {
				d: 1,
			},
		};

		const cb = (val, key) => key + val;

		expect(traverse(simpleObj, cb)).toEqual({
			a: 'a1',
			b: 'b2',
			c: {
				d: 'd1',
			},
		});
	});

	test('flip should swap the keys and values of the given object', () => {
		expect(flip(simpleObj)).toEqual({
			1: 'a',
			2: 'b',
		});
	});

	test('flipMany should build an one-to-one inverted mapping of a many to one object', () => {
		const oneToMany = {
			a: [1, 2],
		};
		const invertedOneToOne = {
			1: 'a',
			2: 'a',
		};

		expect(flipMany(oneToMany)).toEqual(invertedOneToOne);
	});

	test('fromEntries should be able to build an object out of entries', () => {
		expect(fromEntries(entries(simpleObj))).toEqual(simpleObj);
	});

	test('prop should return the array of values for the given properties from the given object', () => {
		expect(props(simpleObj, ['a', 'b'])).toEqual([1, 2]);
	});

	test('result should work for normal paths esacped paths', () => {
		expect(result(nestedObj, 'single')).toEqual('single');
		expect(result(nestedObj, 'parent/child')).toEqual('child');
		expect(result(nestedObj, 'parent/escaped\\/child')).toEqual('escaped/child');
		expect(result(nestedObj, 'parent/un\\\\\\/escaped\\\\\\/child')).toEqual('un\\/escaped\\/child');
	});
});
