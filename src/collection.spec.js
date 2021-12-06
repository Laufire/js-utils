// NOTE: The reason for importing the modules, the old-school way
// - is to ensure that, the downstream dependencies aren't affected.
// NOTE: Immutability is tested implicitly, by preventing
//	- mutations the mock objects.

/* Helpers */
import { sortArray, rndKey, numberArray, array, object, expectEquals, extension,
	rndDict, rndNested, extended, isolated, cloned, simpleTypes, ecKeys,
	extCollection, collection as hCollection, toObject,
	rndKeys, rndArray, rndRange, rnd } from '../test/helpers';
import { rndBetween, rndString, rndValue, rndValues }
	from '@laufire/utils/random';
import { isDefined, inferType, isIterable,
	isDict, isArray } from '@laufire/utils/reflection';
import { ascending, descending, reverse } from '@laufire/utils/sorters';
import { sum, product } from '@laufire/utils/reducers';
import { select as tSelect, map as tMap, keys as tKeys,
	values as tValues, secure as tSecure, entries as tEntries,
	dict as tDict, filter as tFilter, reduce as tReduce,
	clean as tClean, fromEntries as tFromEntries,
	range as tRange, pick as tPick }
	from '@laufire/utils/collection';
import { isEqual, not } from '@laufire/utils/predicates';

/* Tested */
import {
	adopt, shares, clean, clone, compose, combine, contains, toDict, diff,
	each, entries, equals, find, findKey, fill, filter, flip,
	flipMany, fromEntries, gather, has, hasSame, map, merge, overlay,
	patch, pick, omit, range, reduce, result,
	sanitize, secure, select, shell, shuffle, spread, sort, squash,
	translate, traverse, walk, values, keys, length, toArray, nReduce,
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

	const mcoCollections = [
		{
			a: 1, b: 2,
			c: {
				d: {
					e: [1, 3],
				},
			},
		},
		{
			a: 2,
			c: {
				d: {
					e: [6, 9],
					f: 7,
				},
				g: 8,
			},
		},
		{
			b: 1,
			c: {
				d: {
					e: [8, 2],
					h: 9,
				},
			},
		},
	];

	const expectationBase = tSecure(tMap(object, (dummy, key) =>
		Symbol(key)));
	const simpleValues = values(simpleTypes());
	const simpleValue = rndValue(simpleValues);
	const anotherValue = rndValue(tFilter(simpleValues,
		not(isEqual(simpleValue))));

	/* Helpers */
	const stitch = (val, key) => String(key) + String(val);
	const reverseArray = (input) => sort(input, reverse);
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
		tEntries(data).map(([dummy, [collection, expectation]]) =>
			expect(fn(collection, predicate)).toEqual(expectation));
		testForArguments(fn);
	};

	const arrayOrObject = (collection) =>
		rndValue([tValues, toObject])(collection);

	// TODO: Remove the converters after using published functions.
	const converters = {
		array: Number,
		object: String,
	};

	const convey = (...args) => args;

	/* Tests */
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
		const randomKeys = rndKeys(expectationBase);
		const predicate = (dummy, key) => randomKeys.includes(String(key));
		const expectation = tSelect(object, randomKeys);
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

	describe('reduce reduces the given collection.', () => {
		test('example', () => {
			expect(reduce(
				simpleObj, sum, 0
			)).toEqual(3);
			expect(reduce(
				simpleArray, product, 1
			)).toEqual(2);
		});

		test('randomized test', () => {
			tMap([array, object], (collection) => {
				const initial = Symbol('initial');
				const collectionKeys = tKeys(collection);
				const accumlators = [initial,
					...tMap(collectionKeys, Symbol)];
				const expectation = accumlators[accumlators.length - 1];

				const predicate = jest.fn().mockImplementation((
					dummy, dummyOne, key
				) => accumlators[collectionKeys.findIndex((cKey) =>
					cKey === String(key)) + 1]);

				expect(reduce(
					collection, predicate, initial
				)).toEqual(expectation);

				tMap(collectionKeys, (key) =>
					expect(predicate.mock.calls[key]).toEqual([
						accumlators[key],
						collection[key],
						converters[inferType(collection)](key),
						collection,
					]));
			});
		});
	});

	describe('reduceN reduce the given nested collection.', () => {
		test('example', () => {
			expect(nReduce(
				{ a: 2, b: { c: { d: 8 }}}, product, 1
			)).toEqual(16);
		});
		test('randomized test', () => {
			const obj = rndNested();
			const initial = Symbol('initial');
			const acc = [initial];
			const reducer = jest.fn().mockImplementation((
				dummy, dummyOne, key
			) => {
				const ret = Symbol(key);

				acc.push(ret);
				return ret;
			});

			const reduced = nReduce(
				obj, reducer, initial
			);

			const testReduce = (branch) => tMap(branch, (value, key) =>
				(isIterable(value)
					? testReduce(value)
					: expect(reducer).toHaveBeenCalledWith(
						acc.shift(),
						value,
						converters[inferType(branch)](key),
						branch
					)));

			testReduce(obj);
			expect(reduced).toEqual(acc.shift());
		});
	});

	test('shell returns an empty container of the same type'
	+ ' as the given iterable', () => {
		expect(shell(object)).toEqual({});
		expect(shell(array)).toEqual([]);
	});

	describe('clean removes undefined props from the given iterable', () => {
		test('example', () => {
			expect(clean(complexObject)).not
				.toHaveProperty('undefinedProperty');
			expect(clean([undefined, 1])).toEqual([1]);
		});

		test('randomized test', () => {
			const randomDict = rndDict(10);
			// TODO: Use rndValues post publishing.
			const randomKeys = rndKeys(randomDict);
			const dirtyObject = tMap(randomDict, (value, key) =>
				(randomKeys.includes(key) ? undefined : value));
			const expectedObject = tFilter(dirtyObject, isDefined);
			const [dirtyArray, expectedArray] = tMap([dirtyObject,
				expectedObject], tValues);

			expect(clean(dirtyObject)).toEqual(expectedObject);
			expect(clean(dirtyArray)).toEqual(expectedArray);
		});
	});

	describe('sanitize removes undefined props recursively from the'
	+ 'given iterable', () => {
		test('example', () => {
			const sanitized = sanitize(complexObject);

			expect(sanitized).not.toHaveProperty('undefinedProperty');
			expect(sanitized.complexArray[0].dirtyArray).toEqual([1]);
		});

		test('randomized test', () => {
			const isSanitizeEqual = (base, sanitized) =>
				map(tClean(base), (value, key) => (isIterable(value)
					? isSanitizeEqual(value, sanitized[key])
					: expect(value).toEqual(sanitized[key])));

			const data = rndNested(5, 5);
			const processed = sanitize(data);

			isSanitizeEqual(data, processed);
		});
	});

	test('each is an alias for map', () => {
		expect(map).toEqual(each);
	});

	describe('traverse recursively traverses through a given object and'
	+ ' builds a new object from its primitives', () => {
		test('example', () => {
			expect(traverse(nestedObj, stitch)).toEqual({
				a: 'a1',
				b: 'b2',
				c: {
					d: {
						e: 'e5',
					},
				},
			});
			expect(traverse(1, convey)).toEqual([1]);
		});

		test('randomized test', () => {
			const obj = rnd();
			const testTraversed = (base, traversed) => (isIterable(base)
				? tMap(base, (value, key) => (isIterable(value)
					? testTraversed(value, traversed[key])
					: expect(traversed[key]).toEqual([
						value,
						converters[inferType(base)](key),
						base,
					])))
				: expect(traversed).toEqual([base]));

			const traversed = traverse(obj, convey);

			testTraversed(obj, traversed);
		});
	});

	test('has tells whether the given iterable has the given value', () => {
		map([array, object], (iterable) => {
			expect(has(iterable, rndValue(iterable))).toEqual(true);
			expect(has(iterable, rndString())).toEqual(false);
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
		expect(clone(object)).toEqual(object);
	});

	test('squash squashes objects and object lists'
	+ ' to a single object', () => {
		const arrayOfObjs = values(map(object, (value, key) =>
			({ [key]: value })));
		const substitutionKey = rndKey(arrayOfObjs);

		arrayOfObjs[substitutionKey] = [arrayOfObjs[substitutionKey]];
		const collection = shuffle(arrayOfObjs);
		const squashed = squash(...collection);

		expect(squashed).toEqual(object);
	});

	describe('merge merges multiple objects into one', () => {
		test('example', () => {
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

		// TODO: Use getNested from testHelpers and randomized.
		test('nested test', () => {
			const testMerge = (merged, ...collections) => {
				tMap(merged, (value, key) => {
					const children = tClean(tPick(collections, key));
					const [firstChild] = children;

					isIterable(value)
						? testMerge(value, ...children)
						: expectEquals(value, firstChild);
				});
			};

			const merged = merge({}, ...mcoCollections);

			testMerge(merged, ...reverseArray(mcoCollections));
		});
	});

	describe('overlay overlays multiple objects into one', () => {
		test('example', () => {
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
			expect(overlaid.complexArray === topLevel.complexArray)
				.toEqual(true);
			expect(overlaid.complexArray.innerArray
			=== topLevel.complexArray.innerArray).toEqual(true);
		});

		// TODO: Use getNested from testHelpers and randomized.
		test('nested test', () => {
			const testOverlay = (overlaid, ...collections) => {
				tMap(overlaid, (value, key) => {
					const children = tClean(tPick(collections, key));
					const [firstChild] = children;

					isDict(value)
						? testOverlay(value, ...children)
						: expectEquals(value, firstChild);
				});
			};

			const overlaid = overlay({}, ...mcoCollections);

			testOverlay(overlaid, ...reverseArray(mcoCollections));
		});
	});

	describe('combine combines multiple objects into one', () => {
		test('example', () => {
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

		// TODO: Use getNested from testHelpers and randomized.
		test('nested test', () => {
			const combineChildren = (children) => {
				const index = reverseArray(children).findIndex((element) =>
					!isArray(element)) + 1;

				return reverseArray(children)
					.slice(index)
					.flat();
			};

			const testCombine = (combined, ...collections) => {
				tMap(combined, (value, key) => {
					const children = tClean(tPick(collections, key));
					const [firstChild] = children;

					isDict(value)
						? testCombine(value, ...children)
						: isArray(value)
							? expectEquals(value,
								combineChildren(children))
							: expectEquals(value, firstChild);
				});
			};

			const combined = combine({}, ...mcoCollections);

			testCombine(combined, ...reverseArray(mcoCollections));
		});
	});

	describe('merge, combine and overlay shares some behaviors', () => {
		test('they work with multiple extensions', () => {
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

		test('they ignore undefined values as extensions', () => {
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

		test('they work with simple arrays', () => {
			expect(merge([0, 1], [1])).toEqual([1, 1]);
			expect(combine([0, 1], [1])).toEqual([0, 1, 1]);
		});
	});

	// TODO: Don't mutate the base.
	describe('fill fills the missing properties of the given base'
	+ ' from those of the extensions', () => {
		test('example', () => {
			const baseProp = Symbol('baseProp');
			const underlayProp = Symbol('underlayProp');
			const overlayProp = Symbol('overlayProp');

			const base = mockObj(['a'], baseProp);
			const layerOne = secure(mockObj(['a', 'b'], underlayProp));
			const layerTwo = secure(mockObj(['b', 'c'], overlayProp));

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

		// TODO: Use nested objects.
		test('randomized test', () => {
			const rndDictionaries = map(rndRange(),
				() => rndDict());
			const rndLayer = rndValue(rndDictionaries);
			const base = rndDict();

			tMap(rndValues(tKeys(base)), (key) =>
				(rndLayer[key] = Symbol(key)));

			const randomLayers = tReduce(
				rndDictionaries,
				(acc, dictionary) =>
					({ ...dictionary, ...acc }), {}
			);

			const expected = { ...randomLayers, ...base };

			const filled = fill(
				base, rndLayer, ...rndDictionaries,
			);

			expect(filled).toEqual(base);
			expect(base).toEqual(expected);
		});
	});

	describe('flip swaps the keys and values of the given object', () => {
		test('example', () => {
			expect(flip(simpleObj)).toEqual({
				1: 'a',
				2: 'b',
			});
		});

		test('randomized test', () => {
			const expectation = tFromEntries(tMap(tEntries(object),
				([key, value]) => [value, key]));

			expect(flip(object)).toEqual(expectation);
		});
	});

	describe('flipMany builds an one-to-one inverted mapping of'
	+ ' a many to one object', () => {
		test('example', () => {
			const oneToMany = {
				a: [1, 2],
			};
			const invertedOneToOne = {
				1: 'a',
				2: 'a',
			};

			expect(flipMany(oneToMany)).toEqual(invertedOneToOne);
		});

		test('randomized test', () => {
			// TODO: Decide whether the values could be objects.
			const data = tMap(rndDict(), () =>
				tMap(rndRange(), () => rndString()));

			const expected = {};

			tKeys(data).forEach((key) =>
				data[key].forEach((item) =>
					(expected[item] = key)));

			expect(flipMany(data)).toEqual(expected);
		});
	});

	describe('translate gives the translation of the source based'
	+ ' on a translation map', () => {
		test('example', () => {
			// TODO: Randomize test using rndNested.
			const expectations = [
				{
					source: { a: 1, b: { c: 2 }, d: 3 },
					selector: { x: 'a', y: '/b/c', z: { w: 'd' }},
					expectation: { x: 1, y: 2, z: { w: 3 }},
				},
				{
					source: ['a', 'b', ['c'], 'd'],
					selector: ['1', '2/0', ['3']],
					expectation: ['b', 'c', ['d']],
				},
			];

			expectations.map(({ source, selector, expectation }) =>
				expect(translate(source, selector))
					.toEqual(expectation));
		});

		test('randmized test', () => {
			const source = rndDict();
			const keysArr = rndValues(tKeys(source));
			const selector = tReduce(
				keysArr, (acc, key) =>
					({ ...acc, [rndString()]: key }), {}
			);

			const expected = tMap(selector, (value) => source[value]);

			expect(translate(source, selector)).toEqual(expected);
		});
	});

	test('fromEntries builds an object out of entries', () => {
		map([array, object], (iterable) => {
			const expectation = tDict(values(iterable));

			expect(fromEntries(tEntries(iterable))).toEqual(expectation);
		});
	});

	test('entries', () => {
		tMap([array, object], (iterable) => {
			const expectation = tValues(tMap(iterable, (value, key) =>
				[converters[inferType(iterable)](key), value]));

			expect(entries(iterable)).toEqual(expectation);
		});
	});

	describe('select helps building sub-objects with selectors', () => {
		describe('examples', () => {
			test('select returns a sub-object of the given object,'
		+ ' with the given array of properties', () => {
				expect(select(simpleObj, ['a'])).toEqual({ a: 1 });
			});
			test('select returns a sub-object of the given object,'
		+ ' with the properties in the given selector object', () => {
				expect(select(simpleObj, {
					'some-thing': 'a',
					'some value': 'keyNotInSource',
				})).toEqual({ a: 1 });
			});

			test('select returns a sub-array of the given array,'
		+ ' with the given array of properties', () => {
				expect(select(simpleArray, [0])).toEqual([1]);
			});
		});

		describe('randomized tests', () => {
			// TODO: Try to combine array and object test.
			test('select returns a sub-object of the given object,'
			+ ' with the properties in the given selector collection', () => {
				const keysInSource = rndKeys(object);
				const keysToSelect = secure(shuffle([
					...keysInSource, ...rndArray(5),
				]));
				const selector = secure(arrayOrObject(keysToSelect));
				const expectation = tReduce(
					keysInSource, (acc, prop) => ({
						...acc,
						[prop]: object[prop],
					}), {}
				);

				expect(select(object, selector)).toEqual(expectation);
			});

			test('select returns a sub-array of the given array,'
			+ ' with the given selector collection', () => {
				const keysInSource = rndKeys(array).map(Number);
				const { length: childCount } = array;
				const keysToSelect = secure(shuffle([
					...keysInSource,
					...tRange(rndBetween(childCount + 1, childCount * 2),
						childCount * 2),
				]));
				const selector = secure(arrayOrObject(keysToSelect));
				const expectation = tReduce(
					keysInSource, (acc, prop) =>
						[...acc, array[prop]], []
				);

				expect(select(array, selector)).toEqual(expectation);
			});
		});
	});

	describe('omit helps building sub-objects through omitters', () => {
		describe('examples', () => {
			test('omit returns a sub-object of the given object,'
		+ ' without the given array of properties', () => {
				expect(omit(simpleObj, ['a'])).toEqual({ b: 2 });
			});

			test('omit returns a sub-object of the given object,'
		+ ' without the properties in the given selector object', () => {
				expect(omit(simpleObj, { 'some-thing': 'a' }))
					.toEqual({ b: 2 });
			});

			test('omit returns a sub-array of the given array,'
		+ ' without the given array of properties', () => {
				expect(clean(omit(simpleArray, [0]))).toEqual([2]);
			});
		});

		describe('randomized tests', () => {
			test('omit returns a sub-object of the given object,'
		+ ' without the properties in the given selector collection', () => {
				const keysInSource = rndKeys(object);
				const keysToBeOmited = secure(shuffle([
					...keysInSource,
					...rndArray(5),
				]));
				const selector = shuffle(arrayOrObject(keysToBeOmited));
				const expectation = tReduce(
					object, (
						acc, value, key
					) =>
						(!keysInSource.includes(key)
							? { ...acc, [key]: value }
							: acc
						), {}
				);

				expect(omit(object, selector)).toEqual(expectation);
			});

			test('omit returns a sub-array of the given array,'
		+ ' without the given collection of properties', () => {
				const keysInSource = rndKeys(array).map(Number);
				const { length: childCount } = array;
				const keysToBeOmited = secure(shuffle([
					...keysInSource,
					...tRange(rndBetween(childCount + 1, childCount * 2),
						childCount * 2),
				]));
				const selector = secure(arrayOrObject(keysToBeOmited));
				const expectation = tReduce(
					array, (
						acc, value, key
					) =>
						(!keysInSource.includes(Number(key))
							? [...acc, value]
							: acc
						), []
				);

				expect(omit(array, selector)).toEqual(expectation);
			});
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
	});

	describe('diff returns the difference between a baseObject'
	+ ' and a comparedObject', () => {
		test('example', () => {
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

			// NOTE: Verify the presence of missing keys.
			expect(difference).toHaveProperty('d');
		});

		test('randomized test', () => {
			const properties = rndDict();
			const base = { ...hCollection, ...properties };
			const expectedProps = tReduce(
				properties, (
					t, dummy, key
				) => ({ ...t, [key]: undefined }), {}
			);
			const expectation = { [ecKeys.extended]: extended,
				...expectedProps };

			const difference = diff(base, extCollection);

			expect(difference).toEqual(expectation);
		});
	});

	describe('diff and patch are complementary', () => {
		test('example', () => {
			const difference = diff(baseObject, comparedObject);
			const patched = patch(baseObject, difference);

			// NOTE: Verify the absence of missing keys.
			expect(patched).not.toHaveProperty('d');

			expect(patched).toEqual(comparedObject);
		});

		test('randomized test', () => {
			const prop = rndString();
			const difference = diff({ ...object, [prop]: rndString() },
				extended);
			const patched = patch({ ...object, [prop]: rndString() },
				difference);

			expect(patched).toEqual(extended);
		});
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

	test('contains tests whether the base object contains'
	+ ' the compared object', () => {
		expect(contains(extended, object)).toEqual(true);
		expect(contains(isolated, object)).toEqual(false);
		expect(contains(simpleValue, simpleValue)).toEqual(true);
		expect(contains(simpleValue, anotherValue)).toEqual(false);
	});

	test('equals tests the value equality of primitives and'
	+ ' complex objects', () => {
		expect(equals(simpleValue, simpleValue)).toEqual(true);
		expect(equals(simpleValue, anotherValue)).toEqual(false);
		expect(equals(object, cloned)).toEqual(true);
		expect(equals(extension, object)).toEqual(false);
	});

	test('hasSame tests the given collections for having'
	+ ' the same children', () => {
		const nested = rndNested(
			2, 2, ['nested']
		);

		expect(hasSame(object, cloned)).toEqual(true);

		expect(hasSame(nested, clone(nested))).toEqual(false);
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

		expect(gather(arrayOfObjects, ['a', 'b', 'c']))
			.toEqual(objectOfArrays);
		expect(gather(objectOfArrays, { a: 0, b: 1, c: 2 }))
			.toEqual(arrayOfObjects);
	});

	test('pick picks the given prop from the children,'
	+ ' of the given iterable as an iterable', () => {
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

	test('toArray is an alias for values', () => {
		expect(toArray).toEqual(values);
	});

	test('toDict converts the given collection into a dictionary', () => {
		expect(toDict(array)).toEqual(object);
		expect(toDict(object)).toEqual(object);
	});

	test('adopt copies values from extensions into the base', () => {
		const base = {};

		const adoptedObject = adopt(base, object);

		expect(base).toEqual(object);
		expect(adoptedObject).toEqual(base);
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
			const childCount = getLength(
				start, end, step
			);

			expect(resultedRange.length).toBe(childCount);
			expect(resultedRange[0]).toBe(start);
			expect(resultedRange[childCount - 1])
				.toBe(start + ((childCount - 1) * step));
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

	describe('shares', () => {
		describe('examples', () => {
			test('shares tests whether the given objects share the same value'
	+ ' on given properties', () => {
				expect(shares(
					simpleObj, nestedObj, ['a']
				)).toBe(true);
				expect(shares(
					simpleObj, complexObject, ['a']
				)).toBe(false);
			});

			test('shares uses \'id\' as the default property compare', () => {
				expect(shares({ id: 1 }, { id: 1 })).toBe(true);
			});
		});

		describe('randomized test', () => {
			test('shares tests whether the given objects share the same value'
			+ ' on given properties', () => {
				expect(shares(
					object, cloned, rndKeys(object)
				)).toBe(true);
				expect(shares(
					object, isolated, rndKeys(object)
				)).toBe(false);
			});
		});
	});

	describe('shuffle shuffles the given collection', () => {
		test('shuffle shuffles arrays', () => {
			const shuffled = shuffle(numberArray);

			expect(shuffled).not.toEqual(numberArray);
			expect(sortArray(shuffled)).toEqual(sortArray(numberArray));
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
			const reversed = numberArray.slice().reverse();

			const shuffled = shuffle(numberArray);
			const sorted = sort(shuffled, descending);

			expect(sorted).toEqual(reversed);
			expect(sorted).not.toBe(numberArray);
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
			const shuffled = shuffle(numberArray);
			const sorted = sort(shuffled);

			expect(sorted).toEqual(numberArray);
			expect(sorted).not.toBe(numberArray);
		});
	});

	describe('keys', () => {
		const expectations = [
			['array', 'numbers', array],
			['object', 'strings', object],
		];

		test.each(expectations)('returns %p keys as %p', (
			dummy, dummyOne, input
		) => {
			const expectedKeys = Object.keys(input).map((key) =>
				converters[inferType(input)](key));

			const resultKeys = keys(input);

			expectEquals(resultKeys.length, expectedKeys.length);
			expectEquals(resultKeys, expectedKeys);
		});
	});

	test('length returns the length of given collection', () => {
		tMap([array, object], (collection) =>
			expect(length(collection)).toEqual(tValues(collection).length));
	});
});
