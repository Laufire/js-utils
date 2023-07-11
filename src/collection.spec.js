// NOTE: The reason for importing the modules, the old-school way
// - is to ensure that, the downstream dependencies aren't affected.
// NOTE: Immutability is tested implicitly, by preventing
//	- mutations the mock objects.

/* Helpers */
import { rndKey, array, object, expectEquals,
	rndDict, rndNested, extended, isolated, toObject,
	rndKeys, rndRange, rnd, similarCols,
	iterableTypes, allTypes, retry, rndCollection, converters, till,
	isAcceptable, randomValues, reversers } from '../test/helpers';
import { rndBetween, rndString, rndValue, rndValues }
	from '@laufire/utils/random';
import { isDefined, inferType, isIterable,
	isDict, isArray } from '@laufire/utils/reflection';
import { ascending, descending,
	reverse as sReverse } from '@laufire/utils/sorters';
import { sum, product } from '@laufire/utils/reducers';
import { select as tSelect, map as tMap, keys as tKeys,
	values as tValues, secure as tSecure, entries as tEntries,
	dict as tDict, filter as tFilter, reduce as tReduce,
	clean as tClean, fromEntries as tFromEntries,
	pick as tPick, clone as tClone, merge as tMerge,
	shell as tShell, equals as tEquals,
	shuffle as tShuffle } from '@laufire/utils/collection';
import { isEqual } from '@laufire/utils/predicates';

/* Tested */
import {
	adopt, shares, clean, clone, compose, combine, contains, toDict, diff,
	each, entries, equals, find, findKey, fill, filter, flip, flipMany,
	fromEntries, gather, has, hasSame, map, merge, overlay, patch, pick,
	omit, range, reduce, result, sanitize, secure, select, shell, shuffle,
	sort, squash, hasKey, translate, traverse, walk, values, keys,
	length, toArray, nReduce, findIndex, findLast, lFind, findLastKey,
	lFindKey, count, flatMap, some, every, reverse,
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
	const complexArray = tSecure([
		{
			innerArray: [1, 3],
			dirtyArray: [undefined, 1],
		},
	]);
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
	const reverseArray = (input) => sort(input, sReverse);
	const testForArguments = (fn, collection) => {
	// TODO: Use imported nothing after publishing.
		const mockPredicate = jest.fn(() => false);

		fn(collection, mockPredicate);

		// TODO: Use imported Keys after publishing.
		tMap(keys(collection), (key) =>
			expect(mockPredicate).toHaveBeenCalledWith(
				collection[key], key, collection
			));
	};

	const testIterator = ({ fn, processor, data }) => {
		tEntries(data).map(([dummy, [collection, expectation]]) =>
			expect(fn(collection, processor)).toEqual(expectation));
		testForArguments(fn, data);
	};

	const arrayOrObject = (collection) =>
		rndValue([tValues, toObject])(collection);

	const convey = (...args) => args;

	const getUnlike = (() => {
		const unlikeGenerator = (value) => {
			const unlike = rnd();

			return value !== unlike ? unlike : unlikeGenerator(value);
		};

		return (value) => (isIterable(value)
			? randomValues(value, tKeys(value).length - 1)
			: unlikeGenerator(value));
	})();

	const symbolize = (iterable) =>
		tMap(iterable, (dummy, key) => Symbol(key));

	const testMerge = (merged, ...collections) => {
		tMap(merged, (value, key) => {
		// TODO: Use library filter.
			const getChildren = () =>
				tMap(collections.filter((collection) =>
					isIterable(collection)
						&& collection.hasOwnProperty(key)), (child) =>
					child[key]);

			const expected = getChildren();

			isIterable(value)
				? testMerge(value, ...getChildren())
				: expectEquals(value, expected[expected.length - 1]);
		});
	};

	/* Tests */
	describe('map transforms the given iterable using'
	+ ' the given callback', () => {
		describe('examples', () => {
			test('map works with all the properties of the object'
		+ ' and builds a new object', () => {
				expect(map(simpleObj, stitch)).toEqual({
					a: 'a1',
					b: 'b2',
				});
			});

			test('map handles arrays with keys instead of indexes', () => {
				expect(map([1, 2], stitch)).toEqual(['01', '12']);
			});
		});

		test('randomized test', () => {
			retry(() => {
				const fn = map;
				const collection = rndCollection();
				const expectation = symbolize(collection);
				const processor = (dummy, key) => expectation[key];
				const data = [
					[collection, expectation],
				];

				testIterator({ fn, processor, data });
			});
		});
	});

	describe('filter filters the given iterable using'
	+ ' the given callback', () => {
		test('example', () => {
			expect(filter(simpleObj, isEqual(1))).toEqual({
				a: 1,
			});

			expect(filter(simpleArray, isEqual(1))).toEqual([1]);
		});

		test('randomized test', () => {
			retry(() => {
				const fn = filter;
				const collection = rndCollection();
				const keysToBeFiltered = rndKeys(collection);
				const processor = (dummy, key) =>
					keysToBeFiltered.includes(key);
				const expectation = tClean(tSelect(collection,
					keysToBeFiltered));
				const data = [
					[collection, expectation],
				];

				testIterator({ fn, processor, data });
			});
		});
	});

	describe('find finds the first element from the collection chose'
	+ ' by the predicate', () => {
		test('example', () => {
			expect(find(simpleObj, isEqual(2))).toBe(2);
			expect(find(simpleObj, isEqual(3))).toBeUndefined();
			expect(find(simpleArray, isEqual(2))).toBe(2);
			expect(find(simpleArray, isEqual(3))).toBeUndefined();
		});

		test('randomized test', () => {
			retry(() => {
				const collection = rndCollection();
				const rndSymbol = rndNested(
					3, 0, ['symbol']
				);
				const needle = rndValue(collection);
				const expectations = [
					[needle, needle],
					[rndSymbol, undefined],
				];

				tMap(expectations, ([value, expectation]) => {
					const fn = find;
					const processor = isEqual(value);
					const data = [
						[collection, expectation],
					];

					testIterator({ fn, processor, data });
				});
			});
		});
	});

	describe('findLast finds the last element from the collection chose'
	+ ' by the predicate', () => {
		test('example', () => {
			const iterable = [999, 12, 8, 130, 44];

			expect(findLast(iterable, isEqual(44))).toEqual(44);
			expect(findLast(iterable, isEqual(1000))).toEqual(undefined);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = rndCollection();
				const needle = rndValue(collection);
				const expectations = [
					[needle, needle],
					[Symbol('value'), undefined],
				];

				tMap(expectations, ([value, expectation]) => {
					const fn = findLast;
					const processor = isEqual(value);
					const data = [
						[collection, expectation],
					];

					testIterator({ fn, processor, data });
				});
			});
		});
	});

	test('lFind is an alias for findLast', () => {
		expect(lFind).toEqual(findLast);
	});

	describe('findKey finds the key of first element from the collection chose'
	+ ' by the predicate', () => {
		test('example', () => {
			expect(findKey(simpleObj, isEqual(2))).toBe('b');
			expect(findKey(simpleObj, isEqual(3))).toBeUndefined();
			expect(findKey(simpleArray, isEqual(2))).toBe(1);
			expect(findKey(simpleArray, isEqual(3))).toBeUndefined();
		});

		test('randomized test', () => {
			retry(() => {
				const fn = findKey;
				const collection = rndCollection();
				const needle = rndKey(collection);
				const processor = isEqual(collection[needle]);
				const expectation = needle;
				const data = [
					[collection, expectation],
				];

				testIterator({ fn, processor, data });
			});
		});
	});

	test('findIndex is an alias for findKey', () => {
		expect(findIndex).toBe(findKey);
	});

	describe('findLastKey find the key of last element from the'
	+ ' collection chose by predicate', () => {
		test('example', () => {
			const iterable = [999, 12, 8, 44, 130, 44];

			expect(findLastKey(iterable, isEqual(44))).toEqual(5);
			expect(findLastKey(iterable, isEqual(1000))).toEqual(undefined);
		});

		test('randomized test', () => {
			retry(() => {
				const fn = findLastKey;
				const baseCol = rndCollection();
				const selector = rndKeys(baseCol);
				const needle = Symbol('needle');
				const haystack = tMap(baseCol, (value, key) =>
					(selector.includes(converters[inferType(baseCol)](key))
						? needle
						: value));
				const expectation = selector[selector.length - 1];
				const processor = isEqual(needle);
				const data = [
					[haystack, expectation],
				];

				testIterator({ fn, processor, data });
			});
		});
	});

	test('lFindKey is an alias for findLastKey', () => {
		expect(lFindKey).toEqual(findLastKey);
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
			retry(() => {
				const collection = rndCollection();
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

				tMap(collectionKeys, (key, i) =>
					expect(predicate.mock.calls[i]).toEqual([
						accumlators[i],
						collection[key],
						// TODO: Remove converters post publishing.
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
			retry(() => {
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
							// TODO: Remove converters post publishing.
							converters[inferType(branch)](key),
							branch
						)));

				testReduce(obj);
				expect(reduced).toEqual(acc.shift());
			});
		});
	});

	describe('shell returns an empty container of the same type'
	+ ' as the given iterable', () => {
		test('example', () => {
			expect(shell(simpleObj)).toEqual({});
			expect(shell(simpleArray)).toEqual([]);
		});

		test('randomized test', () => {
			expect(shell(object)).toEqual({});
			expect(shell(array)).toEqual([]);
		});
	});

	describe('clean removes undefined props from the given iterable', () => {
		test('example', () => {
			expect(clean(complexObject)).not
				.toHaveProperty('undefinedProperty');
			expect(clean([undefined, 1])).toEqual([1]);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = rndCollection();
				// TODO: Use rndValues post publishing.
				const dirtyKeys = rndKeys(collection);
				const dirtyCollection = tSecure(tMap(collection, (value, key) =>
					(dirtyKeys.includes(key) ? undefined : value)));
				const expectation = tFilter(dirtyCollection, isDefined);

				expect(clean(dirtyCollection)).toEqual(expectation);
			});
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

			retry(() => {
				const data = rndNested();
				const sanitized = sanitize(data);

				isSanitizeEqual(data, sanitized);
			});
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
			retry(() => {
				const input = rnd();
				const testTraversed = (base, traversed) => (isIterable(base)
					? tMap(base, (value, key) => (isIterable(value)
						? testTraversed(value, traversed[key])
						: expect(traversed[key]).toEqual([
							value,
							// TODO: Remove converters post publishing.
							converters[inferType(base)](key),
							base,
						])))
					: expect(traversed).toEqual([base]));

				const traversed = traverse(input, convey);

				testTraversed(input, traversed);
			});
		});
	});

	describe('has tells whether the given iterable has the given value', () => {
		test('example', () => {
			expect(has(simpleObj, 1)).toEqual(true);
			expect(has(simpleArray, 1)).toEqual(true);
			expect(has(simpleObj, 0)).toEqual(false);
			expect(has(simpleArray, 0)).toEqual(false);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = rndCollection();

				expect(has(iterable, rndValue(iterable))).toEqual(true);
				expect(has(iterable, Symbol)).toEqual(false);
			});
		});
	});

	describe('hasKey tells whether the given iterable has'
	+ ' the given key', () => {
		test('example', () => {
			const cart = {
				item: 'apple',
				price: 100,
			};

			expect(hasKey(cart, 'item')).toEqual(true);
			expect(hasKey(cart, 'discount')).toEqual(false);
		});

		test('randomized test', () => {
			const iterables = iterableTypes();

			const types = {
				...allTypes(),
				...iterables,
			};

			tMap(types, (type) => {
				has(iterables, type)
					&& expect(hasKey(type, rndKey(type))).toEqual(true);
				expect(hasKey(type, rndString())).toEqual(false);
			});
		});
	});

	describe('walk recursively walks through a given object and'
	+ ' returns the reduced value', () => {
		test('example', () => {
			const dirStructure = {
				a: 1,
				b: { c: 2 },
			};
			const report = {
				type: 'dir', size: 3, children: {
					a: { type: 'file', size: 1 },
					b: { type: 'dir', size: 2, children: {
						c: { type: 'file', size: 2 },
					}},
				},
			};
			const walker = (digest, value) => (!isDefined(digest)
				? { type: 'file', size: value }
				: { type: 'dir', size: tReduce(
					digest, (acc, { size }) => acc + size, 0
				), children: digest });

			expect(walk(dirStructure, walker)).toEqual(report);
		});

		test('randomized test', () => {
			retry(() => {
				const input = rnd();

				const walker = jest.fn().mockImplementation(convey);

				const walkedResult = walk(input, walker);

				const results = tClone(tPick(walker.mock.results, 'value'));
				const testWalk = (
					compared, base, ...rest
				) => {
					const walked = isIterable(base)
						? tMap(base, (value, key) => {
							isIterable(value) && testWalk(
								compared[0][key],
								value,
								// TODO: Remove converters post publishing.
								converters[inferType(base)](key),
								base
							);
							return results.shift();
						})
						: undefined;

					expect(walker)
						.toHaveBeenCalledWith(
							walked, base, ...rest
						);
					expect(compared).toEqual([walked, base, ...rest]);
				};

				testWalk(walkedResult, input);
			});
		});
	});

	describe('clone clones the given object', () => {
		test('example', () => {
			expect(clone(complexObject)).toEqual(complexObject);
		});

		test('randomized test', () => {
			retry(() => {
				const rndNestedObj = rndNested();
				const testCloned = (base, compared) => (!isIterable(base)
					? expect(compared).toEqual(base)
					: tMap(base, (value, key) =>
						testCloned(value, compared[key])));

				const cloned = clone(rndNestedObj);

				testCloned(rndNestedObj, cloned);
			});
		});
	});

	describe('squash squashes objects and object lists'
	+ ' to a single object', () => {
		test('example', () => {
			const squashed = squash(
				{ a: 1 }, [{ b: 2 }], { c: 3 }
			);

			expect(squashed).toEqual({
				a: 1,
				b: 2,
				c: 3,
			});
		});

		test('randomized test', () => {
			retry(() => {
				const objectArray = values(rndNested(
					2, 2, ['object']
				));
				const propsToBeAltered = rndKeys(objectArray);
				const inputs = tMap(objectArray, (value, key) =>
					(propsToBeAltered.includes(Number(key))
						? values(rndNested(
							1, 2, ['object']
						))
						: value));
				const expectation = tReduce(
					inputs.flat(), (acc, val) => ({ ...acc, ...val }), {}
				);

				const squashed = squash(...inputs);

				expect(squashed).toEqual(expectation);
			});
		});
	});

	describe('merge merges multiple objects into one', () => {
		test('example', () => {
			const inputs = [
				{
					a: 1,
					c: 3,
					d: [1, 2, 3],
					e: [5],
				},
				{
					b: 2,
					c: 4,
					d: [4, 5],
					e: [6, 7],
				},
			];

			const expected = {
				a: 1,
				b: 2,
				c: 4,
				d: [4, 5, 3],
				e: [6, 7],
			};

			const merged = merge({}, ...inputs);

			expect(merged).toEqual(expected);
		});

		test('complete example', () => {
			const base = clone(complexObject);
			const bottomLevelBase = clone(complexObject);
			const topLevelBase = clone(complexObject);
			const propToDelete = 'single';
			const newValue = 'new value';

			bottomLevelBase.primitiveOverlay = 0;
			bottomLevelBase.iterableOverlay = {};
			const bottomLevel = bottomLevelBase;

			delete topLevelBase[propToDelete];
			topLevelBase.newProperty = newValue;
			topLevelBase.parent.child.grandChild = newValue;
			topLevelBase.complexArray[0].innerArray = [0];
			topLevelBase.primitiveOverlay = simpleObj;
			topLevelBase.iterableOverlay = simpleObj;
			const topLevel = topLevelBase;

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

		test('randomized test', () => {
			retry(() => {
				const mCollections = tValues(rndNested());

				const merged = merge({}, ...mCollections);

				testMerge(merged, ...mCollections);
			});
		});
	});

	describe('overlay overlays multiple objects into one', () => {
		test('example', () => {
			const inputs = [
				{
					a: 1,
					c: 3,
					d: [1, 2, 3],
					e: [5],
				},
				{
					b: 2,
					c: 4,
					d: [4, 5],
					e: [6, 7],
				},
			];

			const expected = {
				a: 1,
				b: 2,
				c: 4,
				d: [4, 5],
				e: [6, 7],
			};

			const overlaid = overlay({}, ...inputs);

			expect(overlaid).toEqual(expected);
		});

		test('complete example', () => {
			const base = clone(complexObject);
			const bottomLevelBase = clone(complexObject);
			const topLevelBase = clone(complexObject);
			const propToDelete = 'single';
			const newValue = 'new value';

			bottomLevelBase.primitiveOverlay = 0;
			bottomLevelBase.iterableOverlay = {};
			const bottomLevel = bottomLevelBase;

			delete topLevelBase[propToDelete];
			topLevelBase.newProperty = newValue;
			topLevelBase.parent.child.grandChild = newValue;
			topLevelBase.complexArray.innerArray = [0];
			topLevelBase.primitiveOverlay = simpleObj;
			topLevelBase.iterableOverlay = simpleObj;
			const topLevel = topLevelBase;

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

		test('randomized test', () => {
			const testOverlay = (overlaid, ...collections) => {
				tMap(overlaid, (value, key) => {
				// TODO: Use library filter.
					const getChildren = () =>
						tMap(collections.filter((collection) =>
							isIterable(collection)
							&& collection.hasOwnProperty(key)), (child) =>
							child[key]);

					isDict(value)
						? testOverlay(value, ...getChildren())
						: expectEquals(value, getChildren()[0]);
				});
			};

			retry(() => {
				const inputs = tValues(rndNested());

				const overlaid = overlay({}, ...inputs);

				testOverlay(overlaid, ...reverseArray(inputs));
			});
		});
	});

	describe('combine combines multiple objects into one', () => {
		test('example', () => {
			const inputs = [
				{
					a: 1,
					c: 3,
					d: [1, 2, 3],
					e: [5],
				},
				{
					b: 2,
					c: 4,
					d: [4, 5],
					e: [6, 7],
				},
			];

			const expected = {
				a: 1,
				b: 2,
				c: 4,
				d: [1, 2, 3, 4, 5],
				e: [5, 6, 7],
			};

			const combined = combine({}, ...inputs);

			expect(combined).toEqual(expected);
		});

		test('complete example', () => {
			const base = clone(complexObject);
			const underlayBase = clone(complexObject);
			const overlayBase = clone(complexObject);
			const propToDelete = 'single';
			const newValue = 'new value';

			underlayBase.primitiveOverlay = 0;
			underlayBase.iterableOverlay = {};
			const layerOne = underlayBase;

			delete overlayBase[propToDelete];
			overlayBase.newProperty = newValue;
			overlayBase.parent.child.grandChild = newValue;
			overlayBase.complexArray[0].innerArray = [0];
			overlayBase.primitiveOverlay = simpleObj;
			overlayBase.iterableOverlay = simpleObj;
			const layerTwo = overlayBase;

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

		test('randomized test', () => {
			const getMatchingIndex = (arr, index) =>
				(index <= 0 ? arr.length : index);

			const combineChildren = (reversedChildren) => {
				const sliceIndex = reversedChildren.findIndex((element) =>
					!isArray(element));

				return reverseArray(reversedChildren
					.slice(0, getMatchingIndex(reversedChildren, sliceIndex)))
					.flat();
			};

			const getChildren = (collections, key) =>
			// TODO: Use library filter.
				tMap(collections.filter((collection) =>
					isIterable(collection)
							&& collection.hasOwnProperty(key)), (child) =>
					child[key]);

			const testCombine = (combined, ...collections) =>
				tMap(combined, (value, key) =>
					(isDict(value)
						? testCombine(value,
							...till(getChildren(collections, key), isDict))
						: isArray(value)
							? expectEquals(value,
								combineChildren(getChildren(collections, key)))
							: expectEquals(value,
								getChildren(collections, key)[0])));

			retry(() => {
				const inputs = tValues(rndNested());

				// TODO: Fix. Coverage requirement is not met sometimes.
				const combined = combine({}, ...inputs);

				testCombine(combined, ...reverseArray(inputs));
			});
		});
	});

	describe('fill fills the missing properties of the given base'
	+ ' from those of the extensions', () => {
		test('example', () => {
			const inputs = [
				{
					a: 1,
					c: 3,
					d: [1, 2, 3],
					e: { f: 4 },
				},
				{
					b: 2,
					d: [4, 5],
					e: { f: 6, g: 7 },
					g: 8,
				},
			];

			const expected = {
				a: 1,
				b: 2,
				c: 3,
				d: [1, 2, 3],
				e: { f: 4, g: 7 },
				g: 8,
			};

			const filled = fill(...inputs);

			expect(filled).toEqual(expected);
		});

		test('complete example', () => {
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

		test('randomized test', () => {
			const testFill = (filled, ...collections) => {
				testMerge(filled, ...reverseArray(collections));
			};

			retry(() => {
				const collections = tValues(rndNested());

				const filled = fill({}, ...collections);

				testFill(filled, ...collections);
			});
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

			expect(overlay({ a: [1, 2, 3] }, { a: [4, 5], b: 6 })).toEqual({
				a: [4, 5],
				b: 6,
			});

			expect(fill({ a: 1, b: [2, 3] }, { b: 4, c: 5 })).toEqual({
				a: 1,
				b: [2, 3],
				c: 5,
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

			expect(overlay(
				{ a: [1] }, undefined, { a: [4], b: 6 }
			)).toEqual({
				a: [4],
				b: 6,
			});

			expect(fill(
				{ a: [1] }, undefined, { a: 2, b: 3 }
			)).toEqual({
				a: [1],
				b: 3,
			});
		});

		test('they work with simple arrays', () => {
			expect(merge([0, 1], [1])).toEqual([1, 1]);
			expect(combine([0, 1], [1])).toEqual([0, 1, 1]);
			expect(overlay([0, 1, 2], [3, 4])).toEqual([3, 4, 2]);
			expect(fill([0, 1, 2, 3], [4, 5])).toEqual([0, 1, 2, 3]);
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
			retry(() => {
				const collection = rndDict();
				const expectation = tFromEntries(tMap(tEntries(collection),
					([key, value]) => [value, key]));

				expect(flip(collection)).toEqual(expectation);
			});
		});
	});

	describe('flipMany builds an one-to-one inverted mapping of'
	+ ' a many to one object', () => {
		test('example', () => {
		// TODO: Decide whether the values could be objects.
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
			retry(() => {
				const data = tSecure(tMap(rndDict(), () =>
					tMap(rndRange(), () => Symbol(rndString()))));

				const expected = {};

				tKeys(data).forEach((key) =>
					data[key].forEach((item) =>
						(expected[item] = key)));
				expect(flipMany(data)).toEqual(expected);
			});
		});
	});

	describe('translate gives the translation of the source based'
	+ ' on a translation map', () => {
		test('example', () => {
			const sourceObject = { a: 1, b: { c: 2 }, d: 3 };
			const selectorObject = { x: 'a', y: '/b/c', z: { w: 'd' }};
			const expectedObject = { x: 1, y: 2, z: { w: 3 }};
			const sourceArray = ['a', 'b', ['c'], 'd'];
			const selectorArray = ['1', '2/0', ['3']];
			const	expectedArray = ['b', 'c', ['d']];

			expect(translate(sourceObject, selectorObject))
				.toEqual(expectedObject);
			expect(translate(sourceArray, selectorArray))
				.toEqual(expectedArray);
		});

		test('randomized test', () => {
			retry(() => {
				const source = rndCollection();
				const keysArr = rndValues(tKeys(source));
				const selector = tSecure(tReduce(
					keysArr, (acc, key) =>
						({ ...acc, [rndString()]: key }), {}
				));

				const expected = tMap(selector, (value) => source[value]);

				expect(translate(source, selector)).toEqual(expected);
			});
		});
	});

	describe('fromEntries builds an object out of entries', () => {
		test('example', () => {
			expect(fromEntries(entries(simpleObj))).toEqual(simpleObj);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = rndCollection();
				const expectation = isArray(iterable)
					? tDict(values(iterable))
					: iterable;

				expect(fromEntries(tEntries(iterable))).toEqual(expectation);
			});
		});
	});

	describe('entries builds an array of key value pairs'
	+ ' from given collection', () => {
		test('example', () => {
			expect(entries(simpleArray)).toEqual([[0, 1], [1, 2]]);
			expect(entries(simpleObj)).toEqual([['a', 1], ['b', 2]]);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = rndCollection();
				const expectation = tValues(tMap(iterable, (value, key) =>
				// TODO: Remove converters post publishing.
					[converters[inferType(iterable)](key), value]));

				expect(entries(iterable)).toEqual(expectation);
			});
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
			test('select returns a sub-collection of the given collection,'
		+ 'with the given selector collection', () => {
				retry(() => {
					const collection = rndCollection();
					// eslint-disable-next-line max-len
					const selector = tSecure(arrayOrObject(rndKeys(collection)));
					const expectation = tClean(tFilter(collection,
						(dummy, key) => tValues(selector)
						// TODO: Remove converters.
							.includes(converters[inferType(collection)](key))));

					const selected = select(collection, selector);

					expect(selected).toEqual(expectation);
				});
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
			test('omit returns a sub-collection of the given collection,'
		+ ' without the given collection of properties', () => {
				retry(() => {
					const collection = rndCollection();
					// eslint-disable-next-line max-len
					const selector = tSecure(arrayOrObject(rndKeys(collection)));
					const expectation = tClean(tFilter(collection,
						(dummy, key) => !tValues(selector)
						// TODO: Remove converters.
							.includes(converters[inferType(collection)](key))));

					const omitted = omit(collection, selector);

					expect(omitted).toEqual(expectation);
				});
			});
		});
	});

	describe('result returns the value for the given simple path'
	+ ' or escaped path', () => {
		test('example', () => {
			const { single, parent } = complexObject;

			expect(result(complexObject, 'single')).toEqual(single);
			expect(result(complexObject, '/single')).toEqual(single);
			expect(result(complexObject, 'parent/child'))
				.toEqual(parent.child);
			expect(result(complexObject, 'parent/\\/unescaped\\/child'))
				.toEqual(parent['/unescaped/child']);
			expect(result(complexObject, 'parent/escaped\\\\\\/child'))
				.toEqual(parent['escaped\\/child']);
			expect(result(complexObject, 'array/1')).toEqual(2);
			expect(result(complexObject, '')).toEqual(complexObject);
			expect(result(complexObject, 'non-existent')).toEqual(undefined);
			expect(result(complexObject, 'non-existent/child'))
				.toEqual(undefined);
			expect(result({ '': 1 }, '//')).toEqual(1);
		});

		test('randomized test', () => {
			retry(() => {
				const data = rndNested(rndBetween(0, 3));
				// TODO: use flatMap post publishing
				const flattened = walk(data, (
					digest, value, key = ''
				) => {
					const childData = digest && reduce(
						digest, (acc, childDigest) => reduce(
							childDigest, (
								accOne, val, childPath
							) => {
								accOne[`${ key }/${ childPath }`] = val;
								return accOne;
							}, acc
						), {}
					);

					return { [`${ key }/`]: value, ...isDefined(digest) ? childData : {}};
				});

				map(flattened, (value, path) => {
					expect(result(data, path)).toEqual(value);
				});
			});
		});
	});

	describe('compose returns an object from a list of objects,'
	+ ' with only keys from the first object and the values from'
	+ ' the objects , with a ascending priority', () => {
		test('example', () => {
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

		test('randomized test', () => {
			retry(() => {
				const input = tValues(similarCols());

				const expectation = tSelect(tMerge({}, ...input),
					keys(input[0]));

				expect(compose(...input)).toEqual(expectation);
			});
		});
	});

	describe('patch creates a new variation of a baseObject based on'
	+ ' the given extension, while preserving them both', () => {
		test('example', () => {
			const extensionObj = { b: 3 };

			expect(patch(simpleObj, extensionObj)).toEqual({
				a: 1,
				b: 3,
			});

			expect(simpleObj).toEqual({ a: 1, b: 2 });
			expect(extensionObj).toEqual({ b: 3 });
		});

		test('randomized test', () => {
			retry(() => {
				const valueOne = rndNested(
					3, 3, ['nested', 'array', 'object']
				);
				const valueTwo = rndNested(
					3, 3, ['nested', 'array', 'object']
				);

				const patched = patch(valueOne, valueTwo);

				testMerge(
					patched, valueOne, valueTwo
				);
			});
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
			retry(() => {
				const type = rndValue(['array', 'object']);

				// eslint-disable-next-line no-shadow
				const base = tSecure(rndNested(
					3, 3, [type]
				));
				const compare = rndNested(
					3, 3, [type]
				);

				const difference = diff(base, compare);

				const testDifference = (
					childDiff, childBase, childCompare
				) => {
					const compareKeys = tKeys(childCompare);

					return tMap(childDiff, (value, key) =>
						(isIterable(value)
							? testDifference(
								value, childBase[key], childCompare[key]
							)
							: compareKeys.includes(key)
								? expect(value).toEqual(childCompare[key])
								: expect(value).toEqual(undefined)));
				};

				testDifference(
					difference, base, compare
				);
			});
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

		// TODO: Randomize while randomizing result test.
		test('randomized test', () => {
			const prop = rndString();
			const difference = diff({ ...object, [prop]: rndString() },
				extended);
			const patched = patch({ ...object, [prop]: rndString() },
				difference);

			expect(patched).toEqual(extended);
		});
	});

	describe('secure prevents further modifications to'
	+ ' the given iterable', () => {
		const newValue = Symbol('value');

		test('example', () => {
			const frozenObject = secure(clone(complexObject));
			const frozenArray = frozenObject.array;

			const actions = {
				objectMutation: () => {
					frozenObject.parent.child = newValue ;
				},
				objectExtension: () => {
					frozenObject.parent.newChild = newValue ;
				},
				objectDeletion: () => delete frozenObject.parent.child,
				arrayMutation: () => {
					frozenArray[0] = newValue ;
				},
				arrayExtension: () => {
					frozenArray.push(newValue) ;
				},
				arrayDeletion: () => frozenArray.pop(),
			};

			map(actions, (action) => expect(action).toThrow());
		});

		test('randomized test', () => {
			retry(() => {
				const obj = rndNested();

				const testSecured = (data) => {
					const key = rndValue(tKeys(data));
					const value = data[key];

					map([
						() => { data[key] = newValue; },
						() => { data[Symbol('newKey')] = newValue; },
						() => { delete data[key]; },
					], (fn) => expect(fn).toThrow(TypeError));

					isIterable(value) && testSecured(value);
				};

				const secured = secure(obj);

				testSecured(secured);
			});
		});
	});

	describe('contains tests whether the base object contains'
	+ ' the compared object', () => {
		test('example', () => {
			expect(contains(1, 1)).toBe(true);
			expect(contains(1, 0)).toBe(false);
			expect(contains(complexObject, clone(complexObject))).toBe(true);
			expect(contains(simpleObj, {})).toBe(true);
			expect(contains({}, simpleObj)).toBe(false);
		});

		test('randomized test', () => {
			retry(() => {
				const valueOne = rndDict();
				const valueTwo = getUnlike(valueOne);

				expect(contains(valueOne, valueTwo)).toEqual(true);
				expect(contains(valueTwo, valueOne)).toEqual(false);
			});
		});
	});

	describe('equals tests the value equality of primitives and'
	+ ' complex objects', () => {
		test('example', () => {
			expect(equals(1, 1)).toBe(true);
			expect(equals(1, 0)).toBe(false);
			expect(equals(complexObject, clone(complexObject))).toBe(true);
			expect(equals(simpleObj, {})).toBe(false);
			expect(equals({}, simpleObj)).toBe(false);
		});

		test('randomized test', () => {
			retry(() => {
				const valueOne = rnd();
				const valueTwo = getUnlike(valueOne);

				expect(equals(valueOne, tClone(valueOne))).toEqual(true);
				expect(equals(valueOne, valueTwo)).toEqual(false);
			});
		});
	});

	describe('hasSame tests the given collections for having'
	+ ' the same children', () => {
		test('example', () => {
			expect(hasSame(complexArray, [...complexArray])).toBe(true);
			expect(hasSame(complexObject, { ...complexObject })).toBe(true);
			expect(hasSame(complexArray, clone(complexArray))).toBe(false);
			expect(hasSame(complexObject, clone(complexObject))).toBe(false);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = rndCollection();
				const nested = rndNested(
					3, 3, ['nested']
				);

				expect(hasSame(collection, tClone(collection))).toEqual(true);
				expect(hasSame(nested, clone(nested))).toEqual(false);
			});
		});
	});

	describe('gather gathers the given props from the children'
	+ ' of the given iterable, as an iterable', () => {
		test('example', () => {
			const arrayOfObjects = [
				{ a: 1, b: 2 },
				{ a: 2, b: 1 },
				// NOTE: Objects do not hold references to undefined values.
				{ c: 3 },
			];
			const objectOfArrays = {
				a: [1, 2],
				b: [2, 1],
				c: [undefined, undefined, 3],
			// NOTE: Arrays do hold references to undefined values, to preserve indices.
			};

			expect(gather(arrayOfObjects, ['a', 'b', 'c']))
				.toEqual(objectOfArrays);
			expect(gather(objectOfArrays, { a: 0, b: 1, c: 2 }))
				.toEqual(arrayOfObjects);
		});

		test('randomized test', () => {
			retry(() => {
				const collections = similarCols();
				const rndChild = rndValue(collections);
				const selector = rndKeys(rndChild);

				const expectation = tReduce(
					selector, (acc, selectorKey) => {
						acc[selectorKey] = tReduce(
							collections, (
								expectedChild, child, childKey
							) => {
								isDefined(child[selectorKey])
								&& (expectedChild[childKey]
									= child[selectorKey]);
								return expectedChild;
							}, tShell(collections)
						);
						return acc;
					}, tShell(rndChild)
				);

				expect(gather(collections, selector)).toEqual(expectation);
			});
		});
	});

	describe('pick picks the given prop from the children,'
	+ ' of the given iterable as an iterable', () => {
		test('example', () => {
			const arrayOfObjects = secure([
				{ a: 1 },
				{ a: 2, b: 3 },
				{ c: 4 },
			]);

			expect(pick(arrayOfObjects, 'a')).toEqual([1, 2]);
		});

		test('randomized test', () => {
			retry(() => {
				const collections = similarCols();
				const prop = rndKey(rndValue(collections));

				const expectation = tMap(tFilter(collections, (child) =>
					child.hasOwnProperty(prop)),
				(child) => child[prop]);

				expect(pick(collections, prop)).toEqual(expectation);
			});
		});
	});

	test('toArray is an alias for values', () => {
		expect(toArray).toEqual(values);
	});

	describe('toDict converts the given collection into a dictionary', () => {
		test('example', () => {
			expect(toDict(simpleArray)).toEqual({ 0: 1, 1: 2 });
			expect(toDict(simpleObj)).toEqual(simpleObj);
		});

		test('randomized test', () => {
			retry(() => {
				const randomArray = rndRange();
				const expectedArray = tReduce(
				// eslint-disable-next-line no-return-assign
					randomArray, (
						acc, value, key
						// eslint-disable-next-line no-sequences
					) => (acc[value] = Number(key), acc),
					{}
				);
				const randomObject = rndDict();

				expect(toDict(randomArray)).toEqual(expectedArray);
				expect(toDict(randomObject)).toEqual(randomObject);
			});
		});
	});

	describe('adopt copies values from extensions into the base', () => {
		test('example', () => {
			const base = {};

			adopt(base, complexObject);

			each(base, (value, key) => {
				expect(value === complexObject[key]).toEqual(true);
			});
		});

		test('randomized test', () => {
			retry(() => {
				const collection = rndCollection();
				const base = tShell(collection);

				const adoptedObject = adopt(base, collection);

				expect(base).toEqual(collection);
				expect(adoptedObject).toEqual(base);
			});
		});
	});

	// TODO: Revisit for randomization.
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

		test('example', () => {
			expect(range(0, 9)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
			expect(range(
				0, 9, 2
			)).toEqual([0, 2, 4, 6, 8]);
			expect(range(
				0, 1, 0.5
			)).toEqual([0, 0.5]);
			expect(range(-10, -5)).toEqual([-10, -9, -8, -7, -6]);
			expect(range(10, 0)).toEqual([]);
		});

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
				retry(() => {
					const collection = rndCollection();
					const properties = rndKeys(collection);

					expect(shares(
						collection, tClone(collection), properties
					)).toBe(true);
					expect(shares(
						collection, arrayOrObject(isolated), properties
					)).toBe(false);
				});
			});
		});
	});

	describe('shuffle shuffles the given collection', () => {
		test('example', () => {
			expect(shuffle([1, 2, 3, 4, 5, 6])).not.toEqual([1, 2, 3, 4, 5, 6]);
			expect(shuffle({ a: 1, b: 2, c: 3, d: 4 }))
				.toEqual({ a: 1, c: 3, b: 2, d: 4 });
		});

		test('randomized test', () => {
			const retryCount = 10000;
			const typeTests = {
				array: (collection, shuffled) => {
					map(shuffled, (value) =>
						expect(collection.includes(value)).toEqual(true));
					return !tEquals(collection, shuffled);
				},
				object: (collection, shuffled) => {
					expect(tEquals(collection, shuffled)).toEqual(true);
					return !tEquals(tKeys(collection), tKeys(shuffled));
				},
			};

			const results = retry(() => {
				const collection = rndCollection();

				const shuffled = shuffle(collection);

				return typeTests[inferType(collection)](collection, shuffled);
			}, retryCount);

			// TODO: Replace with fn.self & collection.filter post publishing.
			const successCount = results.filter((value) => value).length;

			expect(isAcceptable(successCount, retryCount)).toEqual(true);
		});
	});

	describe('sort sorts the given collection', () => {
		describe('examples', () => {
			test('sort sorts the collection based on given sorter ', () => {
				expect(sort([10, 2, 8, 4], ascending)).toEqual([2, 4, 8, 10]);
				expect(sort({ a: 10, b: 2, c: 8, d: 4 }, descending))
					.toEqual({ a: 10, c: 8, d: 4, b: 2 });
			});

			test('sort uses ascending as the default sorter', () => {
				expect(sort([10, 2, 8, 4])).toEqual([2, 4, 8, 10]);
				expect(sort({ a: 10, b: 2, c: 8, d: 4 }))
					.toEqual({ b: 2, d: 4, c: 8, a: 10 });
			});
		});

		test('randomized test', () => {
			retry(() => {
				const collection = rndCollection();
				const input = tReduce(
					collection, (
						acc, dummy, key
					) => {
						acc.result[key] = acc.count;
						acc.count += 1;

						return acc;
					}, { count: 0, result: tShell(collection) }
				).result;
				const shuffled = tShuffle(input);

				const sorted = sort(shuffled);

				expect(sorted).toEqual(input);
			});
		});
	});

	describe('keys returns the keys of given collection', () => {
		test('example', () => {
			expect(keys(['a', 'b', 'c'])).toEqual([0, 1, 2]);
			expect(keys({ a: 1, b: 2, c: 3 })).toEqual(['a', 'b', 'c']);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = tClone(rndCollection());
				const randomKeys = rndKeys(collection);

				tMap(collection, (dummy, key) =>
				// TODO: Remove converters after publishing.
					!randomKeys.includes(converters[inferType(collection)](key))
					&& delete collection[key]);
				tSecure(collection);

				const keysResult = keys(collection);

				expect(keysResult).toEqual(randomKeys);
			});
		});
	});

	describe('length returns the length of given collection', () => {
		test('example', () => {
			const sparseArray = [];

			sparseArray[4] = 'a';

			expect(length(sparseArray)).toEqual(5);
			expect(length([1, 2, 3])).toEqual(3);
			expect(length({ a: 1, b: 2 })).toEqual(2);
		});

		test('randomized test', () => {
			retry(() => {
				const collection = rndCollection();

				expect(length(collection)).toEqual(tValues(collection).length);
			});
		});
	});

	describe('count returns the number of values in give collection', () => {
		test('example', () => {
			const sparseArray = [];

			sparseArray[4] = 'a';

			expect(count(sparseArray)).toEqual(1);
			expect(count({ a: 1, b: 2 })).toEqual(2);
		});

		test('randomized test', () => {
			retry(() => {
				const iterable = rndCollection();
				const selector = rndKeys(iterable);
				const collection = tSelect(iterable, selector);

				expect(count(collection)).toEqual(selector.length);
			});
		});
	});

	describe('flatMap return combination of path with values', () => {
		test('example', () => {
			const data = {
				a: 1,
				b: {
					c: 3,
				},
			};
			const expected = {
				'/': data,
				'/a/': 1,
				'/b/': {
					c: 3,
				},
				'/b/c/': 3,
			};

			expect(flatMap(data)).toEqual(expected);
		});

		test('randomized test', () => {
			retry(() => {
				const data = rndNested(rndBetween(0, 5));
				const buildExpectation = (input, parentPath = '') =>
					({ ...reduce(
						isIterable(input) ? input : {}, (
							acc, child, key
						) => ({
							...acc,
							[`${ parentPath }/${ key }/`]: child,
							...isIterable(child) && buildExpectation(child, `${ parentPath }/${ key }`),
						}), {}
					), '/': input });
				const expected = buildExpectation(data);

				const flattened = flatMap(data);

				expect(flattened).toEqual(expected);
			});
		});
	});

	describe('some, returns true when any values satisfy given predicate',
		() => {
			test('example', () => {
				expect(some(simpleArray, isEqual(1))).toBeTruthy();
				expect(some(simpleArray, isEqual(5))).toBeFalsy();
				expect(some(simpleObj, isEqual(1))).toBeTruthy();
				expect(some(simpleObj, isEqual(5))).toBeFalsy();
			});

			test('randomized test', () => {
				retry(() => {
					const collection = rndCollection();
					const rndSymbol = rndNested(
						0, 0, ['symbol']
					);
					const needle = rndValue(collection);
					const expectations = [
						[needle, true],
						[rndSymbol, false],
					];

					tMap(expectations, ([value, expectation]) => {
						const fn = some;
						const processor = isEqual(value);
						const data = [
							[collection, expectation],
						];

						testIterator({ fn, processor, data });
					});
				});
			});
		});

	describe('every, returns true when all values satisfy given predicate',
		() => {
			test('example', () => {
				const haystack = {
					a: 1,
					b: 1,
				};

				expect(every(haystack, isEqual(1))).toEqual(true);
				expect(every(simpleObj, isEqual(1))).toEqual(false);
			});

			test('randomized test', () => {
				retry(() => {
					const haystack = rndCollection();
					const needle = isEqual('symbol');

					expect(every(haystack, (value) =>
						needle(inferType(value)))).toBeTruthy();
					expect(every(haystack, (value) =>
						!needle(inferType(value)))).toBeFalsy();
				});
			});
		});

	describe('reverse, reverse the given collection', () => {
		test('example', () => {
			expect(reverse([2, 1])).toEqual([1, 2]);
			expect(reverse({ a: 1, b: 5 })).toEqual({ b: 5, a: 1 });
		});

		test('randomized test', () => {
			retry(() => {
				const collection = rndCollection();
				const expected = reversers[inferType(collection)](collection);

				expect(reverse(collection)).toEqual(expected);
			});
		});
	});
});
