/* Tested */
const {
	clean, clone, collect, entries,
	flip, flipMany, fromEntries, merge,
	props, result, select, squash,
	translate, traverse } = require('../src/collection'); //NOTE: The reason for importing the modules, the old-school way is to ensure that the downstream dependencies aren't affected.

describe('Collection', () => {

	/* Mocks and Stubs */
	const simpleObj = {
		a: 1,
		b: 2,
	};

	const nestedObj = {
		a: 1, b: 2,
		c: {
			d: 1,
		},
	};

	const complexObject = {
		single: 'single',
		parent: {
			child: {
				grandChild: 'grandChild',
			},
			'unescaped/child': 'unescaped/child',
			'escaped\\/child': 'escaped\\/child',
		},
		undefinedProp: undefined,
		array: [1, 2],
		complexArray: [
			{
				innerArray: [1, 3],
			},
		],
	};

	/* Tests */
	test('clean should remove undefined props', () => {
		expect(clean(complexObject)).not.toHaveProperty('undefinedProperty');
	});

	test('collect should work with all the properties of the object and build a new object', () => {
		const cb = (val, key) => key + val;

		expect(collect(simpleObj, cb)).toEqual({
			a: 'a1',
			b: 'b2',
		});
	});

	test('traverse should recursively traverse through a given object and build a new object', () => {
		const cb = (val, key) => key + val;

		expect(traverse(nestedObj, cb)).toEqual({
			a: 'a1',
			b: 'b2',
			c: {
				d: 'd1',
			},
		});
	});

	test('clone should recursively clone given object', () => {
		const cloned = clone(complexObject);

		// Verify equality.
		expect(cloned).toEqual(complexObject);

		// Verify immutability.
		cloned.complexArray[0].innerArray[0] = Symbol();
		expect(cloned).not.toEqual(complexObject);
	});

	test('squash should squash objects and object lists to a single object', () => {
		const squashed = squash({a: 1}, [{b: 2}], {c: 3});

		expect(squashed).toEqual({
			a: 1,
			b: 2,
			c: 3,
		})
	});

	test('merge should merge the second object to the first object', () => {
		const base = clone(complexObject);
		const extension = clone(complexObject);
		const propToDelete = 'single';
		const newValue = 'new value';

		delete extension[propToDelete];
		extension.newProperty = newValue;
		extension.parent.child.grandChild = newValue;
		extension.complexArray.innerArray = [0];

		const merged = merge(base, extension);

		expect(merged).toHaveProperty(propToDelete);
		expect(merged.newProperty).toEqual(newValue);
		expect(merged.parent.child.grandChild).toEqual(newValue);
		expect(merged.complexArray.innerArray[0]).toEqual(0);
	});

	test('merge should merge multiple objects', () => {
		expect(merge({a: 1}, {b: 2}, {c: 3})).toEqual({
			a: 1,
			b: 2,
			c: 3,
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

	test('translate should give the translation of the source based on the translation map', () => {

		expect(translate([3, 5], {1: 'a'})).toEqual({a : 5});
	});

	test('fromEntries should be able to build an object out of entries', () => {
		expect(fromEntries(entries(simpleObj))).toEqual(simpleObj);
	});

	test('prop should return the array of values for the given properties from the given object', () => {
		expect(props(simpleObj, ['a', 'b'])).toEqual([1, 2]);
	});

	test('select should return a sub-object with the given properties of the given object', () => {
		expect(select(simpleObj, ['a'])).toEqual({a: 1});
	});

	test('result should work for normal paths esacped paths', () => {
		console.log(complexObject.parent['escaped\\/child']);

		expect(result(complexObject, 'single')).toEqual(complexObject.single);
		expect(result(complexObject, 'parent/child')).toEqual(complexObject.parent.child);
		expect(result(complexObject, 'parent/unescaped\\/child'))
			.toEqual(complexObject.parent['unescaped/child']);
		expect(result(complexObject, 'parent/escaped\\\\\\/child'))
			.toEqual(complexObject.parent['escaped\\/child']);
		expect(result(complexObject, 'non-existent')).toEqual(undefined);
	});
});
