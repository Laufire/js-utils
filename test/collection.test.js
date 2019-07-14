/* eslint-disable sort-keys */

/* Tested */
// # NOTE: The reason for importing the modules, the old-school way is to ensure that, the downstream dependencies aren't affected.
// # TODO: Write a helper to test immutability between a source and its derived object.
const {
	clean, clone, compose, collect, diff, entries,
	filter, flip, flipMany, fromEntries, patch,
	merge, omit, props, result, select, squash,
	translate, traverse,
} = require('../src/collection');

describe('Collection', () => {
	/* Mocks and Stubs */
	const simpleObj = {
		a: 1,
		b: 2,
	};

	const nestedObj = {
		a: 1, b: 2,
		c: {
			d: 4,
		},
	};
	const complexObject = {
		single: 'single',
		parent: {
			'child': {
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

	test('collect should work with all the properties of the object '
	+ 'and build a new object', () => {
		const cb = (val, key) => key + val;

		expect(collect(simpleObj, cb)).toEqual({
			a: 'a1',
			b: 'b2',
		});
	});

	test('filter should filter the properties of the object using the passed '
	+ 'filter function', () => {
		const cb = (val) => val === 1;

		expect(filter(simpleObj, cb)).toEqual({
			a: 1,
		});
	});

	test('traverse should recursively traverse through a given object and '
	+ 'build a new object', () => {
		const cb = (val, key) => key + val;

		expect(traverse(nestedObj, cb)).toEqual({
			a: 'a1',
			b: 'b2',
			c: {
				d: 'd4',
			},
		});
	});

	test('clone should recursively clone given object', () => {
		const cloned = clone(complexObject);

		// Verify equality.
		expect(cloned).toEqual(complexObject);

		// Verify immutability.
		cloned.complexArray[0].innerArray[0] = Symbol('some value');
		expect(cloned).not.toEqual(complexObject);
	});

	test('squash should squash objects and object lists to '
	+ 'a single object', () => {
		const squashed = squash(
			{ a: 1 }, [{ b: 2 }], { c: 3 }
		);

		expect(squashed).toEqual({
			a: 1,
			b: 2,
			c: 3,
		});
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
		expect(merge(
			{ a: 1 }, { b: 2 }, { c: 3 }
		)).toEqual({
			a: 1,
			b: 2,
			c: 3,
		});
	});

	test('merge should not mutate the extensions', () => {
		const extensionToTest = { b: 2 };

		merge(
			{ a: 1 }, extensionToTest, { b: 3 }
		);

		expect(extensionToTest).toEqual({
			b: 2,
		});
	});

	test('flip should swap the keys and values of the given object', () => {
		expect(flip(simpleObj)).toEqual({
			1: 'a',
			2: 'b',
		});
	});

	test('flipMany should build an one-to-one inverted mapping of '
	+ 'a many to one object', () => {
		const oneToMany = {
			a: [1, 2],
		};
		const invertedOneToOne = {
			1: 'a',
			2: 'a',
		};

		expect(flipMany(oneToMany)).toEqual(invertedOneToOne);
	});

	test('translate should give the translation of the source based '
	+ 'on the translation map', () => {
		expect(translate([3, 5], { 1: 'a' })).toEqual({ a: 5 });
	});

	test('fromEntries should be able to build an object out of entries', () => {
		expect(fromEntries(entries(simpleObj))).toEqual(simpleObj);
	});

	test('prop should return the array of values for the given properties '
	+ 'from the given object', () => {
		expect(props(simpleObj, ['a', 'b'])).toEqual([1, 2]);
	});

	test('omit should return a sub-object of the given object, '
	+ 'without the given properties to omit', () => {
		expect(omit(simpleObj, ['a'])).toEqual({ b: 2 });
	});

	test('select should return a sub-object of the given object, '
	+ 'with the given properties', () => {
		expect(select(simpleObj, ['a'])).toEqual({ a: 1 });
	});

	test('result should work for normal paths escaped paths', () => {
		expect(result(complexObject, 'single')).toEqual(complexObject.single);
		expect(result(complexObject, 'parent/child'))
			.toEqual(complexObject.parent.child);
		expect(result(complexObject, 'parent/unescaped\\/child'))
			.toEqual(complexObject.parent['unescaped/child']);
		expect(result(complexObject, 'parent/escaped\\\\\\/child'))
			.toEqual(complexObject.parent['escaped\\/child']);
		expect(result(complexObject, 'non-existent')).toEqual(undefined);
	});

	test('compose should return an object from a list of objects, '
	+ 'with only keys from the first object and the values from '
	+ 'the objects , with a ascending priority', () => {
		expect(compose(
			{ a: 1, b: 2, c: 3 },
			{ a: 2, b: 3 },
			{ b: 2, d: 1 }
		)).toEqual({
			a: 2,
			b: 2,
			c: 3,
		});
	});

	test('patch creates a new variation of a baseObject based on '
	+ 'the given extension, while preserving them both', () => {
		const baseObject = { a: 1, b: 2 };
		const extension = { b: 3 };

		expect(patch(baseObject, extension)).toEqual({
			a: 1,
			b: 3,
		});

		expect(baseObject).toEqual({ a: 1, b: 2 });
		expect(extension).toEqual({ b: 3 });
	});

	test('diff returns the difference between a baseObject '
	+ 'and a comparedObject', () => {
		const baseObject = { a: 1, b: 2, c: 1 };
		const comparedObject = {
			a: 1,
			b: 3,
			// # TODO: Test for mixed nested object types (array and object).
			c: {
				d: 3,
			},
		};

		const difference = diff(baseObject, comparedObject);

		expect(difference).toEqual({
			b: 3,
			c: {
				d: 3,
			},
		});

		// Verify immutability of nested diffs.
		difference.c.d = 1;
		expect(comparedObject.c.d).toEqual(3);
	});

	test('diff and patch are complementary', () => {
		const baseObject = { a: 1, b: 2, c: 1 };
		const comparedObject = {
			a: 1,
			b: 3,
			c: {
				d: 3,
			},
		};

		const difference = diff(baseObject, comparedObject);

		expect(patch(baseObject, difference)).toEqual(comparedObject);
	});
});
