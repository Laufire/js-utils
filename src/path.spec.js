import { equals, findKey, keys, map, range, reduce } from './collection';
import { fix, parts, pathType, resolve } from './path';
import { rndString, rndValue, rndBetween } from './random';
import { retry } from '../test/helpers';
import { isProbable } from './prob';

const higherLimit = 8;
const lowerLimit = 0;

// TODO: Use rndRange from helpers.
const getRndRange = () => range(0, rndBetween(lowerLimit, higherLimit));

const relativeDots = () => '.'.repeat(rndBetween(1, 5));

const rndName = () => rndString(rndBetween(5, 10),
	'abcdefghijklmnopqrstuvwxyz.');

const emptyName = () => '';

const randomParts = () => map(getRndRange(), () =>
	rndValue([emptyName, rndName, relativeDots])());

// Fix matcher
const isLabel = (initialPart) => (/^[^\\.]*$/).test(initialPart);

const fixers = {
	absolute: {
		partFixer: (pathParts) => pathParts,
		pathFixer: (pathParts) => (pathParts.length ? '/' : ''),
		prefix: '/',
	},

	relative: {
		partFixer: (pathParts) => [relativeDots(), ...pathParts],
		pathFixer: () => '',
		prefix: './',
	},
};

// eslint-disable-next-line complexity
const toLax = (source, type) => {
	const { prefix } = fixers[type];
	const suffix = '/';
	const prefixProb = source.length === 0 || source[0] === ''
		? 1
		: type === 'relative'
			? isLabel(source[0]) ? 0.5 : 0
			: source.length ? 1 : 0;
	const suffixProb = source[source.length - 1] === ''
		? 1
		: source.length ? 0.5 : 0;

	return `${ isProbable(prefixProb) ? prefix : '' }${ source.join('/') }${ isProbable(suffixProb) ? suffix : '' }`;
};

// eslint-disable-next-line complexity
const generateCase = () => {
	const fixedType = rndValue(keys(fixers));
	const isLax = rndValue([true, false]);
	const { partFixer, pathFixer } = fixers[fixedType];
	const source = partFixer(randomParts());
	const fixed = `${ pathFixer(source) }${ source.join('/') }/`;
	const fixedParts = [
		...fixedType === 'lax' && isLabel(source[0]) ? ['.'] : [],
		...source,
	];

	const path = isLax ? toLax(source, fixedType) : fixed;
	const type = fixed !== path ? 'lax' : fixedType;

	return {
		type: type,
		fixedType: fixedType,
		parts: source,
		fixedParts: fixedParts,
		path: path,
		fixed: fixed,
	};
};

describe('path', () => {
	const testCases = retry(() =>
		generateCase(), 10000);

	describe('Generated cases', () => {
		const cases = retry(() =>
			generateCase(rndValue(keys(fixers))), 10000);

		test('Parts length should be from 0 to 8', () => {
			const items = map(cases, ({ parts: { length }}) => length);
			const lengths = [...new Set(items)];

			// TODO: Use publised rndBetween.
			const result = equals(range(lowerLimit, higherLimit + 1),
				lengths.sort());

			expect(result).toEqual(true);
		});

		test('All types of paths should be present', () => {
			const items = map(cases, ({ type }) => type);
			const types = ['absolute', 'relative', 'lax'];
			const result = types.filter((type) => items.includes(type));

			expect(result).toEqual(types);
		});

		test('All path types should be present.', () => {
			const matchers = {
				relative: /^\.+$/,
				empty: /^$/,
				name: /[a-z\\.]+/,
			};

			const reduced = reduce(
				cases, (acc, { parts: currentParts }) =>
					[...acc, ...currentParts], []
			);

			const { relative, empty, name } = reduce(
				reduced, (acc, part) => {
					const type = findKey(matchers, (matcher) =>
						matcher.test(part));

					return { ...acc, [type]: acc[type] + 1 };
				}, { relative: 0, empty: 0, name: 0 }
			);

			expect(relative + empty + name).toEqual(reduced.length);
		});
	});

	test('fix fixes the given path', () => {
		map(testCases, ({ path, fixed }) => {
			expect(fix(path)).toEqual(fixed);
		});
	});

	test('parts splits the given path into parts array', () => {
		map(testCases, ({ path, parts: expected }) => {
			expect(parts(path)).toEqual(expected);
		});
	});

	test('pathType identifies the path type of the given path', () => {
		map(testCases, ({ path, type: expected }) => {
			expect(pathType(path)).toEqual(expected);
		});
	});

	test('resolves the given path', () => {
		// eslint-disable-next-line complexity
		const buildExpectation = (cases) => {
			const findLastIndex = (arr, predicate) =>
				arr.findIndex((item, i) => predicate(item)
							&& (i + 1 === arr.length
							|| arr.slice(i + 1).findIndex(predicate) === -1));
			const lastAbsIndex = findLastIndex(cases, ({ fixedType }) =>
				fixedType === 'absolute');
			const sliced = cases.slice(lastAbsIndex > -1 ? lastAbsIndex : 0);
			const typeParts = map(sliced, ({ parts: x }) => x).flat();

			let pending = 0;
			const labels = [];

			const relativeMarker = /^\.+$/;
			const navigate = (part) => {
				pending += Math.max(0, part.length - labels.length - 1);
				labels.splice(1 - part.length || labels.length);
			};

			map(typeParts, (path) =>
				(!relativeMarker.test(path)
					? labels.push(path)
					: navigate(path)));

			const labelString = `${ labels.join('/') }${ labels.length ? '/' : '' }`;
			const prefixer = `${ '.'.repeat(pending + (lastAbsIndex < 0 ? 1 : 0)) }/`;

			return lastAbsIndex > -1 && pending > 0
				? undefined
				: `${ prefixer }${ labelString }`;
		};

		retry(() => {
			const cases = retry(() =>
				generateCase(), rndBetween(0, 10));

			const expected = buildExpectation(cases);

			const paths = map(cases, ({ path }) => path);
			const result = resolve(...paths);

			expect(result).toEqual(expected);
		});
	});
});
