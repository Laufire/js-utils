// # NOTE: The reason for importing the modules, the old-school way is to ensure that, the downstream dependencies aren't affected.
// # NOTE: Immutability is tested implicitly, by preventing mutations the mock objects.

/* Tested */
const {
	adopt, shares, clean, clone, compose, combine, contains, dict, diff, each, entries, equals,
	find, findIndex, findKey, fill, filter, flip, flipMany, fromEntries, gather, has, hasSame,
	index, map, merge, overlay, patch, pick, omit, props, range, result, rename,
	sanitize, secure, select, shell, spread, squash, translate, traverse, walk,
} = require('./collection.js');

/* Helpers */
const { isDefined } = require('./reflection.js');
const { rndBetween } = require('./random.js');

const mockObj = (keys, value) =>
	fromEntries((map(keys, (key) => [key, isDefined(value) ? value : key])));

const getPredicate = (check) => (val) => val === check;

/* Spec */
describe('Collection', () => {
	/* Mocks and Stubs */
	const simpleObj = secure({
		a: 1,
		b: 2,
	});
	const simpleArray = secure([1, 2]);
	const nestedObj = secure({
		a: 1, b: 2,
		c: {
			d: {
				e: 5,
			},
		},
	});
	const complexArray = [
		{
			innerArray: [1, 3],
			dirtyArray: [undefined, 1],
		},
	];
	const complexObject = secure({
		single: 'single',
		parent: {
			child: {
				grandChild: 'grandChild',
			},
			'/unescaped/child': 'unescaped/child',
			'escaped\\/child': 'escaped\\/child',
		},
		undefinedProp: undefined,
		array: clone(simpleArray),
		primitiveOverlay: null,
		iterableOverlay: null,
		complexArray: complexArray,
	});
	const baseObject = secure({
		a: 1,
		b: 2,
		c: 1,
		d: 'only in base',
		e: [0],
	});
	const comparedObject = secure({
		a: 1,
		b: 3,
		c: {
			d: 3,
		},
		e: [0, 1],
		f: 'only in compared',
	});

	/* Helpers */
	const stitch = (val, key) => key + val;

	/* Tests */
	test('shell returns an empty container of the same type as the given iterable', () => {
		expect(shell(simpleObj)).toEqual({});
		expect(shell(simpleArray)).toEqual([]);
	});

	test('clean removes undefined props', () => {
		expect(clean(complexObject)).not.toHaveProperty('undefinedProperty');
		expect(clean([undefined, 1])).toEqual([1]);
	});

	test('sanitize removes undefined props recursively', () => {
		const sanitized = sanitize(complexObject);

		expect(sanitized).not.toHaveProperty('undefinedProperty');
		expect(sanitized.complexArray[0].dirtyArray).toEqual([1]);
	});

	test('each is an alias for map', () => {
		expect(map).toEqual(each);
	});

	test('map works with all the properties of the object '
	+ 'and builds a new object', () => {
		expect(map(simpleObj, stitch)).toEqual({
			a: 'a1',
			b: 'b2',
		});
	});

	test('map handles arrays with keys instead of indexes', () => {
		expect(map([1, 2], stitch)).toEqual(['01', '12']);
	});

	test('filter filters the properties of the given iterable using '
	+ ' the passed filter function', () => {
		expect(filter(simpleObj, getPredicate(1))).toEqual({
			a: 1,
		});

		expect(filter(simpleArray, getPredicate(1))).toEqual([1]);
	});

	test('traverse recursively traverses through a given object and '
	+ 'builds a new object from its primitives', () => {
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

	test('has tells whether the given iterable has the given value', () => {
		expect(has(simpleObj, 1)).toEqual(true);
		expect(has(simpleArray, 1)).toEqual(true);
		expect(has(simpleObj, 0)).toEqual(false);
		expect(has(simpleArray, 0)).toEqual(false);
	});

	test('walk recursively walks through a given object and '
	+ 'builds a new object from its primitives and iterables', () => {
		const classify = (value) => typeof value;
		expect(walk(nestedObj, classify)).toEqual({
			a: 'number',
			b: 'number',
			c: 'object',
		});
	});

	test('clone clones the given object', () => {
		const cloned = clone(complexObject);

		expect(cloned).toEqual(complexObject);
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
		const bottomLevelBase = clone(complexObject);
		const topLevelBase = clone(complexObject);
		const propToDelete = 'single';
		const newValue = 'new value';

		bottomLevelBase.primitiveOverlay = 0;
		bottomLevelBase.iterableOverlay = {};
		const bottomLevel = secure(bottomLevelBase);

		delete topLevelBase[propToDelete];
		topLevelBase.newProperty = newValue;
		topLevelBase.parent.child.grandChild = newValue;
		topLevelBase.complexArray.innerArray = [0];
		topLevelBase.primitiveOverlay = simpleObj;
		topLevelBase.iterableOverlay = simpleObj;
		const topLevel = secure(topLevelBase);

		const merged = merge(base, bottomLevel, topLevel);

		expect(base).not.toEqual(complexObject);
		expect(merged).toHaveProperty(propToDelete);
		expect(merged.newProperty).toEqual(newValue);
		expect(merged.parent.child.grandChild).toEqual(newValue);
		expect(merged.primitiveOverlay).toEqual(simpleObj);
		expect(topLevelBase.iterableOverlay).toEqual(simpleObj);
		expect(merged.complexArray !== topLevel.complexArray).toEqual(true);
		expect(merged.complexArray.innerArray[0]).toEqual(0);
	});

	test('overlay overlays multiple objects into one', () => {
		const base = clone(complexObject);
		const bottomLevelBase = clone(complexObject);
		const topLevelBase = clone(complexObject);
		const propToDelete = 'single';
		const newValue = 'new value';

		bottomLevelBase.primitiveOverlay = 0;
		bottomLevelBase.iterableOverlay = {};
		const bottomLevel = secure(bottomLevelBase);

		delete topLevelBase[propToDelete];
		topLevelBase.newProperty = newValue;
		topLevelBase.parent.child.grandChild = newValue;
		topLevelBase.complexArray.innerArray = [0];
		topLevelBase.primitiveOverlay = simpleObj;
		topLevelBase.iterableOverlay = simpleObj;
		const topLevel = secure(topLevelBase);

		const overlaid = overlay(base, bottomLevel, topLevel);

		expect(base).not.toEqual(complexObject);
		expect(overlaid).toHaveProperty(propToDelete);
		expect(overlaid.newProperty).toEqual(newValue);
		expect(overlaid.parent.child.grandChild).toEqual(newValue);
		expect(overlaid.primitiveOverlay).toEqual(simpleObj);
		expect(topLevelBase.iterableOverlay).toEqual(simpleObj);
		expect(overlaid.complexArray === topLevel.complexArray).toEqual(true);
		expect(overlaid.complexArray.innerArray === topLevel.complexArray.innerArray).toEqual(true);
	});

	test('combine combines multiple objects into one', () => {
		const base = clone(complexObject);
		const underlayBase = clone(complexObject);
		const overlayBase = clone(complexObject);
		const propToDelete = 'single';
		const newValue = 'new value';

		underlayBase.primitiveOverlay = 0;
		underlayBase.iterableOverlay = {};
		const underlay = secure(underlayBase);

		delete overlayBase[propToDelete];
		overlayBase.newProperty = newValue;
		overlayBase.parent.child.grandChild = newValue;
		overlayBase.complexArray.innerArray = [0];
		overlayBase.primitiveOverlay = simpleObj;
		overlayBase.iterableOverlay = simpleObj;
		const overlay = secure(overlayBase);

		const combined = combine(base, underlay, overlay);

		expect(base).not.toEqual(complexObject);
		expect(combined).toHaveProperty(propToDelete);
		expect(combined.newProperty).toEqual(newValue);
		expect(combined.parent.child.grandChild).toEqual(newValue);
		expect(combined.array).toEqual(
			complexObject.array.concat(underlayBase.array).concat(overlayBase.array)
		);
		expect(combined.primitiveOverlay).toEqual(simpleObj);
		expect(overlayBase.iterableOverlay).toEqual(simpleObj);
		expect(combined.complexArray).toEqual([
			complexObject.complexArray[0],
			underlayBase.complexArray[0],
			overlayBase.complexArray[0],
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

	test('merge and combine ignore undefined values as extensions', () => {
		expect(merge(
			{ a: 1 }, undefined, { c: 3 }
		)).toEqual({
			a: 1,
			c: 3,
		});

		expect(combine({ a: [1] }, undefined, { a: [2] })).toEqual({
			a: [1, 2],
		});
	});

	test('merge and combine work with simple arrays', () => {
		expect(merge([0, 1], [1])).toEqual([1, 1]);
		expect(combine([0, 1], [1])).toEqual([0, 1, 1]);
	});

	test('fill fills the missing properties of the given base from those of the extensions', () => {
		const baseProp = Symbol('baseProp');
		const underlayProp = Symbol('underlayProp');
		const overlayProp = Symbol('overlayProp');

		const base = mockObj(['a'], baseProp);
		const underlay = secure(mockObj(['a', 'b'], underlayProp));
		const overlay = secure(mockObj(['c'], overlayProp));

		const filled = fill(base, underlay, overlay);

		expect(filled).toEqual(base);
		expect(base).toEqual({
			a: baseProp,
			b: underlayProp,
			c: overlayProp
		});
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
	+ 'on a translation map', () => {
		const translationMap = { welcome: "hello", farewell: "bye" };
		const data = { hola: "welcome" };

		expect(translate(data, translationMap)).toEqual({ "hola" : "hello" });
	});

	test('rename renames the source keys based on '
	+ 'the given rename map', () => {
		const data = { length: 1, breadth: 2 };
		const renameMap = { length: "depth" };

		expect(rename(data, renameMap)).toEqual({ "depth": 1 });
	});

	test('fromEntries builds an object out of entries', () => {
		expect(fromEntries(entries(simpleObj))).toEqual(simpleObj);
	});

	test('props returns an array of values for the given properties '
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

		map(actions, (action) => expect(action).toThrow());
	});

	test('contains tests the base object contains '
	+ 'the compared object', () => {
		expect(contains(1, 1)).toBe(true);
		expect(contains(1, 0)).toBe(false);
		expect(contains(complexObject, clone(complexObject))).toBe(true);
		expect(contains(simpleObj, {})).toBe(true);
		expect(equals({}, simpleObj)).toBe(false);
	});

	test('equals tests the value equality of primitives and'
	+ 'complex objects', () => {
		expect(equals(1, 1)).toBe(true);
		expect(equals(1, 0)).toBe(false);
		expect(equals(complexObject, clone(complexObject))).toBe(true);
		expect(equals(simpleObj, {})).toBe(false);
		expect(equals({}, simpleObj)).toBe(false);
	});

	test('hasSame tests the given collections for having the same children', () => {
		expect(hasSame(complexArray, [...complexArray])).toBe(true);
		expect(hasSame(complexObject, {...complexObject})).toBe(true);
		expect(hasSame(complexArray, clone(complexArray))).toBe(false);
		expect(hasSame(complexObject, clone(complexObject))).toBe(false);
	});

	test('gather gathers the given props from the children '
	+ 'of the given iterable, as an iterable', () => {
		const arrayOfObjects = secure([
			{ a: 1, b: 2 },
			{ a: 2, b: 1 },
			{ c: 3 }, // Objects do not hold references to undefined values.
		]);
		const objectOfArrays = secure({
			a: [1, 2],
			b: [2, 1],
			c: [undefined, undefined, 3], // Arrays do hold references to undefined values, to preserve indices.
		});

		expect(gather(arrayOfObjects, 'a', 'b', 'c')).toEqual(objectOfArrays);
		expect(gather(objectOfArrays, 0, 1, 2)).toEqual(arrayOfObjects);
	});

	test('pick picks the given prop from the children of the given iterable, '
	+ 'as an iterable', () => {
		const arrayOfObjects = secure([
			{ a: 1 },
			{ a: 2, b: 3 },
			{ c: 4},
		]);

		expect(pick(arrayOfObjects, 'a')).toEqual([1, 2]);
	});

	test('spread spreads the children of given iterable ' // #TODO: Fix the description.
	+ 'into the base iterable', () => {
		const base = { a: {}, b: {} };
		const seeds = secure({
			prop1: { a: 1, b: 2 },
			prop2: { a: 3, b: 4 },
		});

		const seeded = spread(base, seeds);

		expect(seeded).toEqual({
			a: { prop1: 1, prop2: 3 },
			b: { prop1: 2, prop2: 4 },
		});
		expect(seeded).toEqual(base);
	});

	test('dict converts the given collection into a dictionary', () => {
		expect(dict(simpleArray)).toEqual({0: 1, 1: 2});
	});

	test('adopt copies values from extensions into the base', () => {
		const base = {};

		adopt(base, complexObject);

		each(base, (value, key) => {
			expect(value === complexObject[key]).toEqual(true);
		});
	});

	test('find finds the first element from the collection chose by the predicate', () => {
		expect(find(simpleObj, getPredicate(2))).toBe(2);
		expect(find(simpleObj, getPredicate(3))).toBeUndefined();
		expect(find(simpleArray, getPredicate(2))).toBe(2);
		expect(find(simpleArray, getPredicate(3))).toBeUndefined();
	});

	test('findKey finds the key of first element from the collection chose by the predicate', () => {
		expect(findKey(simpleObj, getPredicate(2))).toBe('b');
		expect(findKey(simpleObj, getPredicate(3))).toBeUndefined();
		expect(findKey(simpleArray, getPredicate(2))).toBe('1');
		expect(findKey(simpleArray, getPredicate(3))).toBeUndefined();
	});

	test('findIndex is an alias for findIndex', () => {
		expect(findIndex).toBe(findKey);
	});

	test('range returns an array with the given start end and the step values', () => {
		const start = rndBetween(5, 9);
		const end = rndBetween(5, 9) + start;
		const step = rndBetween(1, 3);
		const length = Math.floor((end - start + 1) / step);

		const result = range(start, end, step);

		expect(result.length).toBe(length);
		expect(result[0]).toBe(start);
		expect(result[length - 1]).toBe(start + (length - 1) * step);
	});

	test('range has default values for all parameters', () => {
		const start = 0;
		const end = 9;
		const step = 1;
		const length = Math.floor((end - start + 1) / step);

		const result = range();

		expect(result.length).toBe(length);
		expect(result[0]).toBe(start);
		expect(result[length - 1]).toBe(start + (length - 1) * step);
	});

	test('shares tests whether the given objects share the same value '
	+ 'on a given property', () => {
		expect(shares(simpleObj, nestedObj, 'a')).toBe(true);
		expect(shares(simpleObj, complexObject, 'a')).toBe(false);
	});

	test('shares uses \'id\' as the default property compare', () => {
		expect(shares({ id: 1 }, { id : 1 })).toBe(true);
	});
});
