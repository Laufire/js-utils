import { keys, map, range } from './collection';
import { fix, parts, pathType, resolve } from './path';
import { rndString, rndValue, rndBetween } from './random';
import { retry } from '../test/helpers';

const getRndRange = () => {
	const lowerLimit = 0;
	const higherLimit = 8;

	return range(0, rndBetween(lowerLimit, higherLimit));
};

const relativeDots = () => '.'.repeat(rndBetween(1, 5));

const rndName = () => rndString(rndBetween(5, 10));

const emptyName = () => '';

const randomParts = () => map(getRndRange(), () =>
	rndValue([emptyName, rndName, relativeDots])());

const emptyParts = () => ['.', ''];

const nonEmptyParts = () => [rndValue([relativeDots(), rndString()])];

const partFixers = {
	absolute: (pathParts) => pathParts,

	relative: (pathParts) => [relativeDots(), ...pathParts],

	lax: (pathParts) => {
		const initialParts = rndValue([emptyParts, nonEmptyParts])();
		const laxParts = [...initialParts, ...pathParts];
		const suffix = (/^\.+$/).test(laxParts[0])
			&& laxParts[laxParts.length - 1] === '';

		return [
			...laxParts,
			...suffix ? nonEmptyParts() : [],
		];
	},
};

const isName = (initialPart) => (/^[^\\.]*$/).test(initialPart);

const prefixes = {
	absolute: (pathParts) => (pathParts.length ? '/' : ''),

	relative: () => '',

	lax: ([initialPart]) => (isName(initialPart) ? './' : ''),
};

const toLax = (fixed, pathParts) =>
	fixed.slice((/[^\\.]/).test(pathParts[0]) ? 2 : 0)
		.slice(0, pathParts[pathParts.length - 1] === '' ? undefined : -1);

const generateCase = (type) => {
	const pathParts = partFixers[type](randomParts());
	const fixed = `${ prefixes[type](pathParts) }${ pathParts.join('/') }/`;
	const fixedParts = [
		...type === 'lax' && isName(pathParts[0]) ? ['.'] : [],
		...pathParts,
	];

	const path = type !== 'lax'	? fixed	: toLax(fixed, pathParts);

	return {
		parts: fixedParts,
		path: path,
		fixed: fixed,
		type: type,
	};
};

describe('path', () => {
	const combinations = retry(() =>
		generateCase(rndValue(keys(partFixers))));

	const findLastKey = (coll, predicate) => coll.find(predicate);

	const absPredicate = (
		{ type }, i, arr
	) => type === 'absolute' && !findLastKey(arr.slice(i + 1), absPredicate);

	test('parts splits the given path into parts array', () => {
		map(combinations, ({ path, parts: expected }) => {
			expect(parts(path)).toEqual(expected);
		});
	});

	test('fix fixes the given path', () => {
		map(combinations, ({ path, fixed: expected }) => {
			expect(fix(path)).toEqual(expected);
		});
	});

	test('pathType identifies the path type of the given path', () => {
		map(combinations, ({ path, type: expected }) => {
			expect(pathType(path)).toEqual(expected);
		});
	});

	// eslint-disable-next-line complexity
	test('resolves the given path', () => {
		// TODO: Use native findLastKey.
		const lastAbs = findLastKey(combinations, absPredicate);
		const lastAbsIndex = combinations.indexOf(lastAbs);
		const sliced = combinations.slice(lastAbsIndex);
		const paths = map(sliced, ({ path }) => path);
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
		const expected = lastAbsIndex > -1 && pending > 0
			? undefined
			: `${ prefixer }${ labelString }`;

		const result = resolve(...paths);

		expect(result).toEqual(expected);
	});
});
