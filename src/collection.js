/* eslint-disable max-lines */
/**
* Helper functions to deal with collections (collections).
*
* Notes:
* 	* Keys with undefined values are treated as non-existent,
* 		so to allow for simplicity.
*/

/*
TODO: Complete the doc comments.
*/

import { isArray, isIterable, isDict, isDefined } from './reflection';
import { rndBetween, assign as libAssign, entries as libEntries,
	values as libValues, keys as libKeys } from './lib';
import { ascending, reverse as sReverse } from './sorters';
import { parts, resolve, unescape } from './path';

/* NOTE: Exporting named imports (like keys) turns them into getters
 (probably by the compiler), this leads to some inconsistencies when
 mocking with jest. Hence, they are imported from the source.
*/
const { abs, ceil, sign } = Math;

const wrapAsArray = (value) => (isArray(value) ? value : [value]);

// eslint-disable-next-line id-length
const { freeze, preventExtensions,
	// eslint-disable-next-line id-match
	seal } = Object;

/* Exports */
const assign = libAssign;
const entries = libEntries;
const values = libValues;
const keys = libKeys;

/**
 * Returns an empty container of the same type as the given collection.
 * @param {*} collection The collection to get a shell for.
 */
const shell = (collection) => (isArray(collection) ? [] : {});

const fromEntries = (kvPairs) => libValues(kvPairs).reduce((agg, pair) => {
	agg[pair[0]] = pair[1];
	return agg;
}, {});

// An Array.map like function for Iterables.
const map = (collection, cb) => {
	const ret = shell(collection);

	const collectionKeys = libKeys(collection);

	collectionKeys.forEach((key) => (ret[key] = cb(
		collection[key], key, collection
	)));
	return ret;
};

/*
NOTE: The standard each implementation is avoided, as it doesn't align -
	with the principle of having a return value.
*/
const each = map;

// An Array.filter like function for Objects.
const filter = (iterable, cb) => (isArray(iterable)
	? iterable.filter(cb)
	// eslint-disable-next-line no-return-assign
	: libKeys(iterable).reduce((t, key) => (
		(
			cb(
				iterable[key], key, iterable
			) && (t[key] = iterable[key]), t
		)
	)
	, {}));

// An Array.reduce like function for Objects.
const reduce = (
	obj, reducer, initial
) => {
	let acc = initial;

	libKeys(obj).forEach((key) => {
		acc = reducer(
			acc, obj[key], key, obj
		);
	});

	return acc;
};

const nReduce = (
	obj, reducer, initial
) => reduce(
	obj, (
		acc, value, key, collection
	) => (isIterable(value)
		? nReduce(
			value, reducer, acc
		)
		: reducer(
			acc, value, key, collection
		)), initial
);

const findKey = (collection, predicate) => {
	const colKeys = libKeys(collection);

	return colKeys[colKeys.findIndex((key) => predicate(
		collection[key], key, collection
	))];
};

const findIndex = findKey;

const findLastKey = (collection, predicate) => {
	const collectionKeys = libKeys(collection);
	let i = collectionKeys.length;
	let currentKey = Symbol('currentKey');

	while(!((currentKey = collectionKeys[--i]) === undefined || predicate(
		collection[currentKey], currentKey, collection
	)))
		;

	return currentKey;
};

const lFindKey = findLastKey;

const find = (collection, predicate) =>
	collection[libKeys(collection).find((key) =>
		predicate(
			collection[key], key, collection
		))];

const findLast = (collection, predicate) => {
	const key = findLastKey(collection, predicate);

	return collection[isDefined(key) ? key : Symbol('')];
};

const lFind = findLast;

/*
* Recursively passes all the primitives in the given collection
* to the given callback.
*/
const traverse = (() => {
	const worker = (
		cb, child, parentKey, parent
	) => (isIterable(child)
		? map(child, (value, key) => worker(
			cb, value, key, child
		))
		: cb(
			child, parentKey, parent
		));

	return (obj, cb) => (isIterable(obj)
		? map(obj, (value, key) =>
			worker(
				cb, value, key, obj
			))
		: cb(obj));
})();

/*
* Recursively passes all the props of the given collections
* to the given callback.
*/

const walk = (() => {
	const walkWorker = (
		walker, child, parentKey, parent
	) => (isIterable(child)
		? walker(
			map(child, (value, key) =>
				walkWorker(
					walker, value, key, child
				)), child, parentKey, parent
		)
		: walker(
			undefined, child, parentKey, parent
		));

	return (obj, walker) => walker(isIterable(obj)
		? map(obj, (value, key) => walkWorker(
			walker, value, key, obj
		))
		: undefined, obj);
})();

const clone = (() => {
	const cloneObj = (obj) => map(obj, clone);
	const cloneArray = (arr) => arr.map(clone);

	return (value) =>
		(isDict(value)
			? cloneObj(value)
			: isArray(value)
				? cloneArray(value)
				: value
		);
})();

/**
 * Has tells whether the given collection has the given value.
 * @param {*} collection The collection to collect the values from.
 * @param {*} value The props to collect from the children of the collection.
 */
const has = (collection, value) => values(collection).indexOf(value) > -1;

const hasKey = (collection, key) =>
	isIterable(collection) && collection.hasOwnProperty(key);

// NOTE: Clean does not clean recursively to allow for shallow cleaning.
const clean = (collection) => {
	if(isArray(collection))
		return collection.filter((value) => value !== undefined);

	const ret = {};
	const objectKeys = libKeys(collection);
	const l = objectKeys.length;
	let i = 0;

	while(i < l) {
		const key = objectKeys[i++];
		const val = collection[key];

		if(val !== undefined)
			ret[key] = val;
	}

	return ret;
};

/* A recursive clean */
const sanitize = (collection) =>
	clean(map(collection,
		(value) => (isIterable(value) ? sanitize(value) : value)));

const select = (collection, selector) => {
	const propsToSelect = values(selector);

	return filter(collection, (dummy, key) =>
		propsToSelect.includes(key));
};

const omit = (obj, selector) => {
	const propsToOmit = values(selector);

	return filter(obj, (dummy, key) =>
		!propsToOmit.includes(key));
};

/**
 * Gathers the given props from the children of the given collection,
 * as a collection.
 * @param {*} collection The collection to collect the values from.
 * @param {...any} props The props to collect from the children
 * of the collection.
 */
// eslint-disable-next-line no-shadow
const gather = (collection, props) => {
	const propShell = shell(collection);
	const ret = shell(values(collection)[0]);

	values(props).forEach((prop) => {
		const child = shell(propShell);

		map(collection, (value, key) => (child[key] = value[prop]));
		ret[prop] = child;
	});

	return ret;
};

/**
 * Picks the given prop from the children of the given collection,
 * as a collection.
 * @param {*} collection The collection to collect the values from.
 * @param {any} props The props to collect from the children of the collection.
 */
// TODO: Rewrite for performance.
const pick = (collection, prop) =>
	gather(collection, [prop])[prop];

/**
 * Combines multiple objects and their descendants with the given base object.
 * When immutability is required, a shell could be passed as the base object.
 * @param {collection} base The base collection on which
 * the extensions would be combined to.
 * @param {...collection} extensions The extensions to be combined.
 */
const combine = (() => {
	const worker = (base, extension) =>
		(isArray(base)
			? isArray(extension)
				? (base.push(...extension), base)
				: extension
			: (libKeys(extension).forEach((key) => {
				const child = base[key];
				const childExtension = extension[key];

				base[key] = isIterable(childExtension)
					? isIterable(child)
						? worker(child, childExtension)
					// eslint-disable-next-line no-use-before-define
					// TODO: Check whether the clone is necessary.
						: clone(childExtension)
					: childExtension;
			}), base)
		);

	return (base, ...extensions) =>
		extensions.forEach((extension) =>
			isIterable(extension) && worker(base, clone(extension))) || base;
})();

/**
 * Merges multiple objects and their descendants with to the given base object.
 * When immutability is required, a shell could be passed as the base object.
 * @param {collection} base The base collection on which
 * the extensions would be merged to.
 * @param {...collection} extensions The extensions to be merged.
 */
const merge = (() => {
	const worker = (base, extension) => {
		libKeys(extension).forEach((key) => {
			const child = base[key];
			const childExtension = extension[key];

			base[key] = isIterable(childExtension)
				? isIterable(child)
					? worker(child, childExtension)
					// eslint-disable-next-line no-use-before-define
					// TODO: Check whether the clone is necessary.
					: clone(childExtension)
				: childExtension;
		});

		return base;
	};

	return (base, ...extensions) =>
		extensions.forEach((extension) =>
			isIterable(extension) && worker(base, extension)) || base;
})();

/**
 * Overlays multiple objects and their descendants with the given base object.
 * When immutability is required, a shell could be passed as the base object.
 * @param {collection} base The base collection on which
 * the extensions would be overlaid to.
 * @param {...collection} extensions The extensions to be overlaid.
 */
const overlay = (() => {
	const worker = (base, extension) => {
		libKeys(extension).forEach((key) => {
			const child = base[key];
			const childExtension = extension[key];

			base[key] = isDict(childExtension)
				? isDict(child)
					? worker(child, childExtension)
					// eslint-disable-next-line no-use-before-define
				// TODO: Check whether the clone is necessary.
					: clone(childExtension)
				: childExtension;
		});

		return base;
	};

	return (base, ...extensions) =>
		extensions.forEach((extension) =>
			isIterable(extension) && worker(base, extension)) || base;
})();

// TODO: Maintain the key order, similar to merge.
/**
 * Fills the missing properties of the given base from those of the extensions.
 * @param {collection} base The base collection on which
 * the extensions would be filled.
 * @param {...collection} extensions The extensions with properties to fill.
 */
const fill = (base, ...extensions) =>
	merge(base, merge(
		{}, ...extensions.reverse(), base
	));

// Merges an array of objects / object-arrays into a single object.
const squash = (...objects) =>
	assign({}, ...objects.reduce((aggregate, value) =>
		[...aggregate, ...wrapAsArray(value)], []));

/**
 * Retrieves the value, notified by a path, from a nested map.
 * Slashes are used as the separator for readability.
 * Starting paths with a slash yields better accuracy.
 * @param {collection} obj The collection to look into.
 * @param {string} path The path to look for. Slash is the separator.
 * And backslash is the escape char.
 * @returns {*} The value from the path or undefined.
 */
const result = (obj, path) => {
	const pathParts = map(parts(resolve('/', path)), unescape);
	const partCount = pathParts.length;
	let currentObject = obj;
	let cursor = 0;

	while(cursor < partCount && isDefined(currentObject))
		currentObject = currentObject[pathParts[cursor++]];

	return currentObject;
};

// Swaps the keys and values of a collection.
const flip = (collection) => reduce(
	collection, (
		acc, value, key
	) => ({
		...acc,
		[value]: key,
	}), {}
);

/*
Converts a one-to-many map (an object of array values)
as an one-to-one inverted map, to ease reverse lookups.
IE: {'a': ['b', 'c']} => {'b': 'a', 'c': 'a'}.
*/
const flipMany = (obj) => reduce(
	obj, (
		a, items, key
	) =>
		reduce(
			items, (acc, item) =>
				({ ...acc, [item]: key }), a
		), {}
);

const translate = (source, selector) =>
	// eslint-disable-next-line no-return-assign
	entries(selector).reduce((acc, [key, value]) =>
		(acc[key] = isIterable(value)
			? translate(source, value)
			// eslint-disable-next-line no-sequences
			: result(source, value), acc), shell(selector));

const compose = (...objects) => {
	const keysToPick = libKeys(objects[0]);
	const keysLength = keysToPick.length;

	return objects.reduce((aggregate, current) => {
		let i = 0;

		while(i < keysLength) {
			const key = keysToPick[i++];
			const val = current[key];

			if(current.hasOwnProperty(key))
				aggregate[key] = val;
		}

		return aggregate;
	}, {});
};

const patch = (base, extension) =>
	sanitize(merge(clone(base), extension));

const diff = (base, compared) => {
	const difference = shell(base);

	libKeys(compared).forEach((key) => {
		const baseChild = base[key];
		const comparedChild = compared[key];

		if(baseChild !== comparedChild) {
			difference[key] = isIterable(comparedChild) && isIterable(baseChild)
				?	diff(baseChild, comparedChild)
				: comparedChild;
		}
	});

	libKeys(base).forEach((key) =>
		compared[key] === undefined && (difference[key] = undefined));

	return difference;
};

const secure = (object) =>
	freeze(preventExtensions(seal(map(object, (value) =>
		(isIterable(value) ? secure(value) : value)))));

const contains = (base, compared) =>
	(isIterable(base) && isIterable(compared)
		? libKeys(compared)
			.findIndex((key) => !contains(base[key], compared[key])) === -1
		: base === compared);

const equals = (base, compared) =>
	(isIterable(base) && isIterable(compared)
		? libKeys(base).length === libKeys(compared).length
			&& libKeys(base)
				.findIndex((key) => !equals(base[key], compared[key])) === -1
		: base === compared);

/* Tests the collections to have same children. */
const hasSame = (base, compared) =>
	libKeys(base).length === libKeys(compared).length
	&& findKey(base, (value, key) => value !== compared[key]) === undefined;

const toArray = values;

const toDict = (collection) =>
	fromEntries(map(collection, (value, key) => [key, value]));

const adopt = (base, ...extensions) =>
	(each(extensions, (extension) =>
		each(extension, (value, key) => (base[key] = value)))
	// eslint-disable-next-line no-sequences
	, base);

const range = (
	// eslint-disable-next-line no-magic-numbers
	start = 0, end = 9, step = 1
) => Array.from({
	length: sign(end - start) !== sign(step) || !step
		? 0
		: ceil(abs(end - start) / abs(step)),
},
(dummy, i) => (i * step) + start);

const length = (collection) =>
	(isArray(collection) ? collection : libKeys(collection)).length;

const count = (collection) => libKeys(collection).length;

const shares = (
	left, right, props = ['id']
) =>
	length(filter(props, (prop) => left[prop] === right[prop]))
		=== props.length;

const shuffle = (collection) => {
	const ixs = libKeys(collection);
	const newIxs = [];

	while(ixs.length)
		newIxs.push(ixs.splice(rndBetween(0, ixs.length), 1)[0]);

	return newIxs.reduce(isArray(collection)
		// eslint-disable-next-line no-return-assign
		? (
			t, c, i
		// eslint-disable-next-line no-sequences
		) => (t[i] = collection[c], t)
		// eslint-disable-next-line no-return-assign
		: (t, c) =>
		// eslint-disable-next-line no-sequences
			(t[c] = collection[c], t),
	shell(collection));
};

const sort = (collection, sorter = ascending) => (isArray(collection)
	? collection.slice().sort(sorter)
	: fromEntries(entries(collection).sort((a, b) => sorter(a[1], b[1]))));

const flatMap = (collection) => walk(collection, (
	digest, value, key = ''
) => ({ [`${ key }/`]: value,
	...isDefined(digest)
		? reduce(
			digest, (acc, childDigest) => reduce(
				childDigest, (
					accOne, val, childPath
				) => {
					accOne[`${ key }/${ childPath }`] = val;
					return accOne;
				}, acc
			), {}
		)
		: {}}));

const some = (collection, predicate) =>
	isDefined(findKey(collection, predicate));

const every = (collection, predicate) =>
	!some(collection, (...args) => !predicate(...args));

const reverse = (collection) => sort(collection, sReverse);

const scaffold = (path, data = {}) => {
	const reducer = (acc, c) => ({ [unescape(c)]: acc });

	return reduce(
		sort(parts(resolve('/', path)), sReverse), reducer, data
	);
};

const reduceSync = async (
	collection, reducer, initial
) => {
	let acc = initial;

	const indexes = libKeys(collection);
	const indexLength = indexes.length;

	for(let i = 0; i < indexLength; i++) {
		const index = indexes[i];

		// eslint-disable-next-line no-await-in-loop
		acc = await reducer(
			acc, collection[index], index, collection
		);
	}

	return acc;
};

const pipe = (pipes, data) => reduceSync(
	pipes, (acc, c) => c(acc), data,
);

export {
	keys, values, entries, fromEntries,
	each, map, filter, reduce, nReduce,
	traverse, walk, has, hasKey,
	clean, sanitize, omit, select, result,
	flip, flipMany, translate,
	shell, assign, clone, squash, combine, merge, overlay, compose, fill,
	patch, diff, secure, equals, contains,
	gather, pick, toArray, toDict, adopt,
	find, findLast, lFind, findKey, findIndex, findLastKey, lFindKey,
	range, hasSame, shares, shuffle, sort, length, count, flatMap,
	scaffold, every, reverse, some, reduceSync, pipe,
};
