// NOTE: The reason for importing the modules, the old-school way
// - is to ensure that, the downstream dependencies aren't affected.
// NOTE: Immutability is tested implicitly, by preventing
//	- mutations the mock objects.

/* Helpers */
import { sortArray, rndKey, array, object, extension } from '../test/helpers';
import { rndBetween, rndString, rndValue, rndValues }
	from '@laufire/utils/random';
import { isDefined } from '@laufire/utils/reflection';
import { ascending, descending } from '@laufire/utils/sorters';
import { sum } from '@laufire/utils/reducers';
import { select as tSelect, map as tMap, keys as tKeys,
	values as tValues, secure as tSecure }
	from '@laufire/utils/collection';
import { isEqual, not } from '@laufire/utils/predicates';

/* Tested */
import {
	adopt, shares, clean, clone, compose, combine, contains, dict, diff,
	each, entries, equals, find, findKey, fill, filter, flip,
	flipMany, fromEntries, gather, has, hasSame, map, merge, overlay,
	patch, pick, omit, props, range, reduce, rename, result,
	sanitize, secure, select, shell, shuffle, spread, sort, squash,
	translate, traverse, walk, values, keys,
} from './collection';

const mockObj = (objKeys, value) =>
	fromEntries(map(objKeys, (key) => [key, isDefined(value) ? value : key]));

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
			'child': {
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
	const stitch = (val, key) => String(key) + String(val);

	/* Tests */
	test('shell returns an empty container of the same type'
	+ ' as the given iterable', () => {
		expect(shell(object)).toEqual({});
		expect(shell(array)).toEqual([]);
	});

	test('clean removes undefined props from the given iterable', () => {
		expect(clean({ ...object, undefinedProp: undefined }))
			.not.toHaveProperty('undefinedProperty');
		expect(clean([undefined, ...array])).toEqual(array);
	});

	test('sanitize removes undefined props recursively from the'
	+ 'given iterable', () => {
		expect(sanitize({ ...object, undefinedProp: undefined,
			a: { undefined }})).toEqual({ ...object, a: {}});
		expect(sanitize([undefined, ...array])).toEqual(array);
	});

	test('each is an alias for map', () => {
		expect(map).toEqual(each);
	});

	const expectationBase = tSecure(tMap(object, (dummy, key) =>
		Symbol(key)));
	const testForArguments = (fn) => {
		// TODO: Use imported nothing after publishing.
		const mockPredicate = jest.fn(() => false);

		tMap([array, object], (collection) => {
			fn(collection, mockPredicate);
			// TODO: Use imported Keys after publishing.
			tMap(keys(collection), (key) =>
				expect(mockPredicate).toHaveBeenCalledWith(
					collection[key], key, collection
				));
		});
	};

	const testIterator = ({ fn, predicate, data }) => {
		tMap(data, ([collection, expectation]) =>
			expect(fn(collection, predicate)).toEqual(expectation));
		testForArguments(fn);
	};

	test('map transforms the given iterable using the given callback', () => {
		const fn = map;
		const predicate = (dummy, key) => expectationBase[key];
		const expectation = expectationBase;
		const data = [
			[array, tValues(expectation)],
			[object, expectation],
		];

		testIterator({ fn, predicate, data });
	});

	test('filter filters the given iterable using the given callback', () => {
		const fn = filter;
		// TODO: Use imported rndValues after publishing.
		const rndKeys = rndValues(tKeys(expectationBase), rndBetween(1,
			tKeys(expectationBase).length - 1));
		const predicate = (dummy, key) => rndKeys.includes(String(key));
		const expectation = tSelect(object, rndKeys);
		const data = [
			[array, tValues(expectation)],
			[object, expectation],
		];

		testIterator({ fn, predicate, data });
	});

	test('find finds the first element from the collection chose'
	+ ' by the predicate', () => {
		const fn = find;
		const randomValue = rndValue(expectationBase);
		const predicate = (value) => isEqual(randomValue)(value);
		const expectation = object[randomValue];
		const data = [
			[array, expectation],
			[object, expectation],
		];

		testIterator({ fn, predicate, data });
	});

	test('findKey finds the key of first element from the collection chose'
	+ ' by the predicate', () => {
		const fn = findKey;
		const randomKey = rndKey(expectationBase);
		const predicate = (dummy, key) => String(key) === randomKey;
		const expectation = randomKey;
		const data = [
			[array, Number(expectation)],
			[object, expectation],
		];

		testIterator({ fn, predicate, data });
	});

	test('reduce reduces the given collection', () => {
		const randomArray = range(0, 10);
		const randomObject = dict(randomArray);

		[randomArray, randomObject].map((obj) => {
			expect(reduce(
				obj, sum, 0
			)).toEqual(values(obj).reduce((t, c) => t + c));
		});
	});

	test('traverse recursively traverses through a given object and'
	+ ' builds a new object from its primitives', () => {
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
		map([array, object], (iterator) => {
			expect(has(iterator, rndValue(iterator))).toEqual(true);
			expect(has(iterator, rndString())).toEqual(false);
		});
	});

	test('walk recursively walks through a given object and'
	+ ' builds a new object from its primitives and iterables', () => {
		const classify = (value) => typeof value;

		expect(walk(nestedObj, classify)).toEqual({
			a: 'number',
			b: 'number',
			c: 'object',
		});
	});

	test('clone clones the given object', () => {
		const orginal = object;
		const cloned = clone(orginal);

		expect(cloned).toEqual(orginal);
	});

	test('squash squashes objects and object lists'
	+ ' to a single object', () => {
		const arrayOfObjs = values(map(object, (value, key) =>
			({ [key]: value })));
		const needle = rndValue(arrayOfObjs);
		const collection = filter(arrayOfObjs, not(isEqual(needle)))
			.concat([needle]);
		const squashed = squash(...shuffle(collection));

		expect(squashed).toEqual(object);
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
		topLevelBase.complexArray[0].innerArray = [0];
		topLevelBase.primitiveOverlay = simpleObj;
		topLevelBase.iterableOverlay = simpleObj;
		const topLevel = secure(topLevelBase);

		const merged = merge(
			base, bottomLevel, topLevel
		);

		expect(base).not.toEqual(complexObject);
		expect(merged).toHaveProperty(propToDelete);
		expect(merged.newProperty).toEqual(newValue);
		expect(merged.parent.child.grandChild).toEqual(newValue);
		expect(merged.primitiveOverlay).toEqual(simpleObj);
		expect(topLevelBase.iterableOverlay).toEqual(simpleObj);
		expect(merged.complexArray !== topLevel.complexArray).toEqual(true);
		expect(merged.complexArray[0].innerArray[0]).toEqual(0);
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

		const overlaid = overlay(
			base, bottomLevel, topLevel
		);

		expect(base).not.toEqual(complexObject);
		expect(overlaid).toHaveProperty(propToDelete);
		expect(overlaid.newProperty).toEqual(newValue);
		expect(overlaid.parent.child.grandChild).toEqual(newValue);
		expect(overlaid.primitiveOverlay).toEqual(simpleObj);
		expect(topLevelBase.iterableOverlay).toEqual(simpleObj);
		expect(overlaid.complexArray === topLevel.complexArray).toEqual(true);
		expect(overlaid.complexArray.innerArray
			=== topLevel.complexArray.innerArray).toEqual(true);
	});

	test('combine combines multiple objects into one', () => {
		const base = clone(complexObject);
		const underlayBase = clone(complexObject);
		const overlayBase = clone(complexObject);
		const propToDelete = 'single';
		const newValue = 'new value';

		underlayBase.primitiveOverlay = 0;
		underlayBase.iterableOverlay = {};
		const layerOne = secure(underlayBase);

		delete overlayBase[propToDelete];
		overlayBase.newProperty = newValue;
		overlayBase.parent.child.grandChild = newValue;
		overlayBase.complexArray[0].innerArray = [0];
		overlayBase.primitiveOverlay = simpleObj;
		overlayBase.iterableOverlay = simpleObj;
		const layerTwo = secure(overlayBase);

		const combined = combine(
			base, layerOne, layerTwo
		);

		expect(base).not.toEqual(complexObject);
		expect(combined).toHaveProperty(propToDelete);
		expect(combined.newProperty).toEqual(newValue);
		expect(combined.parent.child.grandChild).toEqual(newValue);
		expect(combined.array)
			.toEqual(complexObject.array.concat(underlayBase.array)
				.concat(overlayBase.array));
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

		expect(combine(
			{ a: [1] }, undefined, { a: [2] }
		)).toEqual({
			a: [1, 2],
		});
	});

	test('merge and combine work with simple arrays', () => {
		expect(merge([0, 1], [1])).toEqual([1, 1]);
		expect(combine([0, 1], [1])).toEqual([0, 1, 1]);
	});

	test('fill fills the missing properties of the given base'
	+ ' from those of the extensions', () => {
		const baseProp = Symbol('baseProp');
		const underlayProp = Symbol('underlayProp');
		const overlayProp = Symbol('overlayProp');

		const base = mockObj(['a'], baseProp);
		const layerOne = secure(mockObj(['a', 'b'], underlayProp));
		const layerTwo = secure(mockObj(['c'], overlayProp));

		const filled = fill(
			base, layerOne, layerTwo
		);

		expect(filled).toEqual(base);
		expect(base).toEqual({
			a: baseProp,
			b: underlayProp,
			c: overlayProp,
		});
	});

	test('flip swaps the keys and values of the given object', () => {
		expect(flip(simpleObj)).toEqual({
			1: 'a',
			2: 'b',
		});
	});

	test('flipMany builds an one-to-one inverted mapping of'
	+ ' a many to one object', () => {
		const oneToMany = {
			a: [1, 2],
		};
		const invertedOneToOne = {
			1: 'a',
			2: 'a',
		};

		expect(flipMany(oneToMany)).toEqual(invertedOneToOne);
	});

	test('translate gives the translation of the source based'
	+ ' on a translation map', () => {
		const translationMap = { welcome: 'hello', farewell: 'bye' };
		const data = { hola: 'welcome' };

		expect(translate(data, translationMap)).toEqual({ hola: 'hello' });
	});

	test('rename renames the source keys based on'
	+ ' the given rename map', () => {
		const data = { length: 1, breadth: 2 };
		const renameMap = { length: 'depth' };

		expect(rename(data, renameMap)).toEqual({ depth: 1 });
	});

	test('fromEntries builds an object out of entries', () => {
		expect(fromEntries(entries(simpleObj))).toEqual(simpleObj);
	});

	test('props returns an array of values for the given properties'
	+ ' from the given object', () => {
		expect(props(object, keys(object))).toEqual(values(object));
	});

	describe('select helps building sub-objects with selectors', () => {
		const keyInSource = rndKey(object);
		const keyNotInSource = rndString();

		test('select returns a sub-object of the given object,'
		+ ' with the given array of properties', () => {
			// TODO: Use randomValues after publishing.
			const expectation = { [keyInSource]: object[keyInSource] };

			expect(select(object, [keyInSource])).toEqual(expectation);
		});

		test('select returns a sub-object of the given object,'
		+ ' with the properties in the given selector object', () => {
			const expectation = { [keyInSource]: object[keyInSource] };

			expect(select(object, {
				[rndString()]: keyNotInSource,
				[rndString()]: keyInSource,
			})).toEqual(expectation);
		});

		test('select returns a sub-array of the given array,'
		+ ' with the given array of properties', () => {
			const randomKey = rndKey(array);
			const expectation = [array[randomKey]];

			expect(clean(select(array, [[randomKey]])))
				.toEqual(expectation);
		});
	});

	describe('omit helps building sub-objects through omitters', () => {
		const keyToBeOmited = rndKey(object);

		test('omit returns a sub-object of the given object,'
		+ ' without the given array of properties', () => {
			const expectation = filter(object, (dummy, key) =>
				key !== keyToBeOmited);

			expect(omit(object, [keyToBeOmited])).toEqual(expectation);
		});

		test('omit returns a sub-object of the given object,'
		+ ' without the properties in the given selector object', () => {
			const expectation = filter(object, (dummy, key) =>
				key !== keyToBeOmited);

			expect(omit(object, { [rndString()]: keyToBeOmited }))
				.toEqual(expectation);
		});

		test('omit returns a sub-array of the given array,'
		+ ' without the given array of properties', () => {
			const randomKey = Number(rndKey(array));
			// TODO: Use imported predicates, post publishing.
			const expectation = array.filter((dummy, key) =>
				key !== randomKey);

			expect(clean(omit(array, [randomKey]))).toEqual(expectation);
		});
	});

	test('result returns the value for the given simple path'
	+ ' or escaped path', () => {
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

	test('compose returns an object from a list of objects,'
	+ ' with only keys from the first object and the values from'
	+ ' the objects , with a ascending priority', () => {
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

	// TODO: Revisit the test.
	test('patch creates a new variation of a baseObject based on'
	+ ' the given extension, while preserving them both', () => {
		expect(patch(object, extension)).toEqual({
			...object,
			...extension,
		});
		expect(object).toEqual({ ...object });
		expect(extension).toEqual({ ...extension });
	});

	test('diff returns the difference between a baseObject'
	+ ' and a comparedObject', () => {
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
			objectMutation: () => {
				frozenObject.parent.child = Symbol('objectMutation') ;
			},
			objectExtension: () => {
				frozenObject.parent.childOne = Symbol('objectExtension') ;
			},
			objectDeletion: () => delete frozenObject.parent.child,
			arrayMutation: () => { frozenArray[0] = Symbol('arrayMutation') ; },
			arrayExtension: () => {
				frozenArray.push(Symbol('arrayExtension')) ;
			},
			arrayDeletion: () => frozenArray.pop(),
		};

		map(actions, (action) => expect(action).toThrow());
	});

	test('contains tests the base object contains'
	+ ' the compared object', () => {
		expect(contains(1, 1)).toBe(true);
		expect(contains(1, 0)).toBe(false);
		expect(contains(complexObject, clone(complexObject))).toBe(true);
		expect(contains(simpleObj, {})).toBe(true);
		expect(contains({}, simpleObj)).toBe(false);
	});

	test('equals tests the value equality of primitives and'
	+ ' complex objects', () => {
		expect(equals(1, 1)).toBe(true);
		expect(equals(1, 0)).toBe(false);
		expect(equals(complexObject, clone(complexObject))).toBe(true);
		expect(equals(simpleObj, {})).toBe(false);
		expect(equals({}, simpleObj)).toBe(false);
	});

	test('hasSame tests the given collections for having'
	+ ' the same children', () => {
		expect(hasSame(complexArray, [...complexArray])).toBe(true);
		expect(hasSame(complexObject, { ...complexObject })).toBe(true);
		expect(hasSame(complexArray, clone(complexArray))).toBe(false);
		expect(hasSame(complexObject, clone(complexObject))).toBe(false);
	});

	test('gather gathers the given props from the children'
	+ ' of the given iterable, as an iterable', () => {
		const arrayOfObjects = secure([
			{ a: 1, b: 2 },
			{ a: 2, b: 1 },
			// Objects do not hold references to undefined values.
			{ c: 3 },
		]);
		const objectOfArrays = secure({
			a: [1, 2],
			b: [2, 1],
			c: [undefined, undefined, 3],
			// Arrays do hold references to undefined values, to preserve indices.
		});

		expect(gather(
			arrayOfObjects, 'a', 'b', 'c'
		)).toEqual(objectOfArrays);
		expect(gather(
			objectOfArrays, 0, 1, 2
		)).toEqual(arrayOfObjects);
	});

	test('pick picks the given prop from the children of the given iterable,'
	+ ' as an iterable', () => {
		const arrayOfObjects = secure([
			{ a: 1 },
			{ a: 2, b: 3 },
			{ c: 4 },
		]);

		expect(pick(arrayOfObjects, 'a')).toEqual([1, 2]);
	});

	test('spread spreads the children of given iterables'
	+ ' into the base iterable', () => {
		const base = { a: {}, b: {}};
		const seeds = secure({
			propOne: { a: 1, b: 2 },
			propTwo: { a: 3, b: 4 },
		});

		const seeded = spread(base, seeds);

		expect(seeded).toEqual({
			a: { propOne: 1, propTwo: 3 },
			b: { propOne: 2, propTwo: 4 },
		});
		expect(seeded).toEqual(base);
	});

	test('dict converts the given array into a dictionary', () => {
		expect(dict(array)).toEqual(object);
	});

	test('adopt copies values from extensions into the base', () => {
		const base = {};

		adopt(base, object);

		tMap(base, (value, key) => {
			expect(value === object[key]).toEqual(true);
		});
	});

	test('findIndex is an alias for findIndex', () => {
		expect(findKey).toBe(findKey);
	});

	describe('range helps building number-series arrays', () => {
		const { abs, ceil } = Math;
		const getLength = (
			start, end, step
		) => ceil(abs(end - start) / abs(step));
		const testRange = (
			resultedRange, start, end, step
		) => {
			const length = getLength(
				start, end, step
			);

			expect(resultedRange.length).toBe(length);
			expect(resultedRange[0]).toBe(start);
			expect(resultedRange[length - 1])
				.toBe(start + ((length - 1) * step));
		};
		const buildRange = (
			starts, ends, steps
		) => {
			const start = rndBetween(...starts);
			const end = rndBetween(...ends) + start;
			const step = rndBetween(...steps);
			const resultingRange = range(
				start, end, step
			);

			return [resultingRange, start, end, step];
		};

		test('range returns an array of numbers with the given start, end'
		+ ' and step values', () => {
			testRange(...buildRange(
				[5, 9], [5, 9], [1, 3]
			));
		});

		test('range can return descending series', () => {
			testRange(...buildRange(
				[1, 10], [-10, -1], [-3, -1]
			));
		});

		test('range has default values for all parameters', () => {
			const start = 0;
			const end = 9;
			const step = 1;

			const resultingRange = range();

			testRange(
				resultingRange, start, end, step
			);
		});

		describe('range returns an empty array when', () => {
			test('step is 0', () => {
				expect(range(
					rndBetween(-10, 10), rndBetween(-10, 10), 0
				)).toEqual([]);
			});

			test('start to end direction and step direction '
			+ 'are different', () => {
				const start = rndBetween(-10, 10);
				const step = rndBetween(-5, 5);
				const end = start - (step * rndBetween(1, 10));

				expect(range(
					start,
					end,
					step,
				)).toEqual([]);
			});

			test('start and end are the same', () => {
				const num = rndBetween(-10, 10);

				expect(range(
					num, num, rndBetween(-10, 10)
				)).toEqual([]);
			});
		});
	});

	test('shares tests whether the given objects share the same value'
	+ ' on a given property', () => {
		expect(shares(
			simpleObj, nestedObj, 'a'
		)).toBe(true);
		expect(shares(
			simpleObj, complexObject, 'a'
		)).toBe(false);
	});

	test('shares uses \'id\' as the default property compare', () => {
		expect(shares({ id: 1 }, { id: 1 })).toBe(true);
	});

	describe('shuffle shuffles the given collection', () => {
		test('shuffle shuffles arrays', () => {
			const array = range(1, 100);

			const shuffled = shuffle(array);

			expect(shuffled).not.toEqual(array);
			expect(sortArray(shuffled)).toEqual(sortArray(array));
		});

		test('shuffle shuffles objects', () => {
			const obj = mockObj(range(1, 100).map((i) => `0${ i }`));

			const shuffled = shuffle(obj);
			const shuffledValues = values(shuffled);
			const objValues = values(obj);

			expect(shuffledValues).not.toEqual(objValues);
			expect(sortArray(shuffledValues)).toEqual(sortArray(objValues));
		});
	});

	describe('sort sorts the given collection', () => {
		test('sort sorts arrays', () => {
			const array = range(1, 100);
			const reversed = array.slice().reverse();

			const shuffled = shuffle(array);
			const sorted = sort(shuffled, descending);

			expect(sorted).toEqual(reversed);
			expect(sorted).not.toBe(array);
		});

		test('sort sorts objects', () => {
			const obj = mockObj(range(1, 100).map((i) => `0${ i }`));
			const shuffled = shuffle(obj);

			const sorted = sort(shuffled, ascending);

			const sortedValues = values(sorted);
			const objValues = values(obj);

			expect(sortArray(sortedValues)).toEqual(sortArray(objValues));
		});

		test('sort uses ascending as the default sorter', () => {
			const array = range(1, 100);

			const shuffled = shuffle(array);
			const sorted = sort(shuffled);

			expect(sorted).toEqual(array);
			expect(sorted).not.toBe(array);
		});
	});

	describe('keys', () => {
		const array = range(0, rndBetween(5, 8));
		const object = fromEntries(Object.entries(array));
		const expectations = [
			['array', 'number', array],
			['object', 'string', object],
		];
		const converters = {
			number: Number,
			string: String,
		};

		test.each(expectations)('returns %p keys as %ps', (
			dummy, itemType, input
		) => {
			const inputKeys = Object.entries(input).map(([dummyOne, value]) =>
				converters[itemType](value));

			const resultKeys = keys(input);

			expect(resultKeys.length).toEqual(inputKeys.length);
			resultKeys.forEach((dummyOne, index) =>
				expect(resultKeys[index]).toEqual(inputKeys[index]));
		});
	});
});
