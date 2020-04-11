/* Tested */
// # NOTE: The reason for importing the modules, the old-school way is to ensure that, the downstream dependencies aren't affected.
// # TODO: Write a helper to test immutability between a source and its derived object.
const {
	clean, clone, compose, combine, collect, diff, each, entries, equals,
	filter, flip, flipMany, fromEntries, secure, impose, patch, merge, omit,
	props, result, sanitize, select, squash, translate, traverse,
} = require('./collection');

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
			child: {
				grandChild: 'grandChild',
			},
			'/unescaped/child': 'unescaped/child',
			'escaped\\/child': 'escaped\\/child',
		},
		undefinedProp: undefined,
		array: [1, 2],
		complexArray: [
			{
				innerArray: [1, 3],
				dirtyArray: [undefined, 1],
			},
		],
	};
	const baseObject = {
		a: 1,
		b: 2,
		c: 1,
		d: 'only in base',
		e: [0],
	};
	const comparedObject = {
		a: 1,
		b: 3,
		c: {
			d: 3,
		},
		e: [0, 1],
		f: 'only in compared',
	};

	/* Helpers */
	const stitch = (val, key) => key + val;

	/* Tests */
	test('clean removes undefined props', () => {
		expect(clean(complexObject)).not.toHaveProperty('undefinedProperty');
		expect(clean([undefined, 1])).toEqual([1]);
	});

	test('sanitize removes undefined props recursively', () => {
		const sanitized = sanitize(complexObject);

		expect(sanitized).not.toHaveProperty('undefinedProperty');
		expect(sanitized.complexArray[0].dirtyArray).toEqual([1]);
	});

	test('each is an alias for collect', () => {
		expect(collect).toEqual(each);
	});

	test('collect works with all the properties of the object '
	+ 'and builds a new object', () => {
		expect(collect(simpleObj, stitch)).toEqual({
			a: 'a1',
			b: 'b2',
		});
	});

	test('collect handles arrays with keys instead of indexes', () => {
		expect(collect([1, 2], stitch)).toEqual(['01', '12']);
	});

	test('filter filters the properties of the given object using '
	+ ' the passed filter function', () => {
		const predicate = (val) => val === 1;

		expect(filter(simpleObj, predicate)).toEqual({
			a: 1,
		});
	});

	test('traverse recursively traverses through a given object and '
	+ 'builds a new object', () => {
		expect(traverse(nestedObj, stitch)).toEqual({
			a: 'a1',
			b: 'b2',
			c: {
				d: {
					e: 'e5',
				},
			},
		});
	});

	test('clone clones the given object', () => {
		const cloned = clone(complexObject);

		// Verify equality.
		expect(cloned).toEqual(complexObject);

		// Verify immutability.
		cloned.complexArray[0].innerArray[0] = Symbol('some value');
		expect(cloned).not.toEqual(complexObject);
	});

	test('squash squashes objects and object lists '
	+ 'to a single object', () => {
		const squashed = squash(
			{ a: 1 }, [{ b: 2 }], { c: 3 }
		);

		expect(squashed).toEqual({
			a: 1,
			b: 2,
			c: 3,
		});
	});

	test('merge merges multiple objects into one', () => {
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

	test('merge does not mutate the passed objects', () => {
		const objOne = clone(complexObject);
		const objTwo = clone(nestedObj);

		merge(
			objOne, objTwo, objOne, objTwo
		);

		expect(objOne).toEqual(complexObject);
		expect(objTwo).toEqual(nestedObj);
	});

	test('combine combines multiple objects into one', () => {
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

	test('combine does not mutate the passed objects', () => {
		const objOne = clone(nestedObj);
		const objTwo = clone(nestedObj);

		objTwo.b = { c: 1 };

		const clonedObjTwo = clone(objTwo);

		combine(
			objOne, objTwo, objOne, objTwo
		);

		expect(objOne).toEqual(nestedObj);
		expect(objTwo).toEqual(clonedObjTwo);
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

	test('merge nor combine do not mutate extensions', () => {
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

	test('merge and combine can work with undefined and null values', () => {
		expect(merge(undefined, {}, null)).toEqual({});
		expect(combine(undefined, [], null)).toEqual({});
	});

	test('impose imposes the given objects over the first one', () => {
		const base = clone(complexObject);
		const baseCopy = base;
		const extension = clone(simpleObj);

		const merged = merge(base, extension);
		const imposed = impose(base, extension);

		expect(imposed).toEqual(merged);
		expect(imposed).toEqual(merged);
		expect(imposed).not.toEqual(comparedObject);
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

	test('result returns the value for the given simple path '
	+ 'or escaped path', () => {
		expect(result(complexObject, 'single')).toEqual(complexObject.single);
		expect(result(complexObject, '/single')).toEqual(complexObject.single);
		expect(result(complexObject, 'parent/child'))
			.toEqual(complexObject.parent.child);
		expect(result(complexObject, 'parent/\\/unescaped\\/child'))
			.toEqual(complexObject.parent['/unescaped/child']);
		expect(result(complexObject, 'parent/escaped\\\\\\/child'))
			.toEqual(complexObject.parent['escaped\\/child']);
		expect(result(complexObject, 'non-existent')).toEqual(undefined);
		expect(result(complexObject, 'array/1')).toEqual(2);
		expect(result({ '': 1 }, '/')).toEqual(1);
		expect(result(complexObject, '')).toEqual(complexObject);
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
		const extension = { b: 3 };

		expect(patch(simpleObj, extension)).toEqual({
			a: 1,
			b: 3,
		});

		expect(simpleObj).toEqual({ a: 1, b: 2 });
		expect(extension).toEqual({ b: 3 });
	});

	test('diff returns the difference between a baseObject '
	+ 'and a comparedObject', () => {
		const difference = diff(baseObject, comparedObject);

		expect(difference).toEqual({
			b: 3,
			c: {
				d: 3,
			},
			d: undefined,
			e: [
				undefined,
				1,
			],
			f: 'only in compared',
		});

		// Verify the presence of missing keys.
		expect(difference).toHaveProperty('d');

		// Verify the immutability of nested diffs.
		difference.c.d = 1;
		expect(comparedObject.c.d).toEqual(3);
	});

	test('diff and patch are complementary', () => {
		const difference = diff(baseObject, comparedObject);
		const patched = patch(baseObject, difference);

		// Verify the absence of missing keys.
		expect(patched).not.toHaveProperty('d');

		expect(patched).toEqual(comparedObject);
	});

	test('secure prevents further modifications to the given iterable', () => {
		const frozenObject = secure(clone(complexObject));
		const frozenArray = frozenObject.array;

		const actions = {
			objectMutation: () => frozenObject.parent.child = Symbol(),
			objectExtension: () => frozenObject.parent.child1 = Symbol(),
			objectDeletion: () => delete frozenObject.parent.child,
			arrayMutation: () => frozenArray[0] = Symbol(),
			arrayExtension: () => frozenArray.push(Symbol()),
			arrayDeletion: () => frozenArray.pop(),
		}

		collect(actions, (action) => expect(action).toThrow());
	});

	test('equals tests the equality of primitives and'
	+ 'complex objects', () => {
		expect(equals(1, 1)).toBe(true);
		expect(equals(1, 0)).toBe(false);
		expect(equals(complexObject, clone(complexObject))).toBe(true);
		expect(equals(simpleObj, {})).toBe(false);
	});
});
