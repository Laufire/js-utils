import { keys, map, range } from './collection';
import { fix, parts, pathType } from './path';
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
});
