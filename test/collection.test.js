/* eslint-disable sort-keys */

/* Tested */
// # NOTE: The reason for importing the modules, the old-school way is to ensure that, the downstream dependencies aren't affected.
// # TODO: Write a helper to test immutability between a source and its derived object.
const {
	clean, clone, compose, combine, collect, diff, entries,
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
			d: {
				e: 5,
			},
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
	test('clean removes undefined props', () => {
		expect(clean(complexObject)).not.toHaveProperty('undefinedProperty');
		expect(clean([undefined, 1])).toEqual([1]);
	});

	test('collect works with all the properties of the object '
	+ 'and build a new object', () => {
		const cb = (val, key) => key + val;

		expect(collect(simpleObj, cb)).toEqual({
			a: 'a1',
			b: 'b2',
		});
	});

	test('collect handles arrays with keys instead of indexes', () => {
		const cb = (val, key) => key + val;

		expect(collect([1, 2], cb)).toEqual(['01', '12']);
	});

	test('filter filters the properties of the object using the passed '
	+ 'filter function', () => {
		const cb = (val) => val === 1;

		expect(filter(simpleObj, cb)).toEqual({
			a: 1,
		});
	});

	test('traverse recursively traverses through a given object and '
	+ 'build a new object', () => {
		const cb = (val, key) => key + val;

		expect(traverse(nestedObj, cb)).toEqual({
			a: 'a1',
			b: 'b2',
			c: {
				d: {
					e: 'e5',
				},
			},
		});
	});

	test('clone clones given object', () => {
		const cloned = clone(complexObject);

		// Verify equality.
		expect(cloned).toEqual(complexObject);

		// Verify immutability.
		cloned.complexArray[0].innerArray[0] = Symbol('some value');
		expect(cloned).not.toEqual(complexObject);
	});

	test('squash squashes objects and object lists to '
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

	test('merge merges the second object to the first object', () => {
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

	test('combine combines the second object '
	+ 'to the first object', () => {
		const base = clone(complexObject);
		const extension = clone(base);
		const baseCopy = clone(complexObject);
		const propToDelete = 'single';
		const newValue = 'new value';

		delete extension[propToDelete];
		extension.newProperty = newValue;
		extension.parent.child.grandChild = newValue;

		const combined = combine(base, extension);

		expect(combined).toHaveProperty(propToDelete);
		expect(combined.newProperty).toEqual(newValue);
		expect(combined.parent.child.grandChild).toEqual(newValue);
		expect(combined.array).toEqual(baseCopy.array.concat(extension.array));
		expect(combined.complexArray).toEqual([
			baseCopy.complexArray[0],
			extension.complexArray[0],
		]);
	});

	test('merge and combine work with multiple extensions', () => {
		expect(merge(
			{ a: 1 }, { b: 2 }, { c: 3 }
		)).toEqual({
			a: 1,
			b: 2,
			c: 3,
		});

		expect(combine({ a: [1] }, { a: [2], c: 3 })).toEqual({
			a: [1, 2],
			c: 3,
		});
	});

	test('merge nor combine not mutate extensions', () => {
		const extensionToTest = { b: [2] };
		const cloned = clone(extensionToTest);

		merge(
			{ a: [1] }, extensionToTest, { b: 3 }
		);

		expect(extensionToTest).toEqual(cloned);

		combine(
			{ a: [1] }, extensionToTest, { b: 3 }
		);

		expect(extensionToTest).toEqual(cloned);
	});

	test('merge and combine work with simple arrays', () => {
		expect(merge([0, 1], [1])).toEqual([1, 1]);
		expect(combine([0, 1], [1])).toEqual([0, 1, 1]);
	});

	test('flip swaps the keys and values of the given object', () => {
		expect(flip(simpleObj)).toEqual({
			1: 'a',
			2: 'b',
		});
	});

	test('flipMany builds an one-to-one inverted mapping of '
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

	test('translate gives the translation of the source based '
	+ 'on the translation map', () => {
		expect(translate([3, 5], { 1: 'a' })).toEqual({ a: 5 });
	});

	test('fromEntries builds an object out of entries', () => {
		expect(fromEntries(entries(simpleObj))).toEqual(simpleObj);
	});

	test('prop returns an array of values for the given properties '
	+ 'from the given object', () => {
		expect(props(simpleObj, ['a', 'b'])).toEqual([1, 2]);
	});

	test('select returns a sub-object of the given object, '
	+ 'with the given array of properties', () => {
		expect(select(simpleObj, ['a'])).toEqual({ a: 1 });
	});

	test('select returns a sub-object of the given object, '
	+ 'with the properties in the given selector object', () => {
		expect(select(simpleObj, {
			a: 'some-thing',
			keyNotInSource: 'some value',
		})).toEqual({ a: 1 });
	});

	test('omit returns a sub-object of the given object, '
	+ 'without the given array of properties', () => {
		expect(omit(simpleObj, ['a'])).toEqual({ b: 2 });
	});

	test('omit returns a sub-object of the given object, '
	+ 'without the properties in the given selector object', () => {
		expect(omit(simpleObj, { a: 'some-thing' })).toEqual({ b: 2 });
	});

	test('result works for normal paths escaped paths', () => {
		expect(result(complexObject, 'single')).toEqual(complexObject.single);
		expect(result(complexObject, 'parent/child'))
			.toEqual(complexObject.parent.child);
		expect(result(complexObject, 'parent/unescaped\\/child'))
			.toEqual(complexObject.parent['unescaped/child']);
		expect(result(complexObject, 'parent/escaped\\\\\\/child'))
			.toEqual(complexObject.parent['escaped\\/child']);
		expect(result(complexObject, 'non-existent')).toEqual(undefined);
	});

	test('compose returns an object from a list of objects, '
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
