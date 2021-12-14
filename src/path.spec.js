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

const emptyParts = ['.', ''];

const partPrefixes = {
	relative: (pathParts) => [relativeDots(), ...pathParts],

	lax: (pathParts) => [
		...rndValue([[rndString()], emptyParts, [relativeDots()]]),
		...pathParts,
	],

	absolute: (pathParts) => pathParts,
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
	const pathParts = partPrefixes[type](randomParts());
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
		generateCase(rndValue(keys(partPrefixes))));

	test('builds parts based on path', () => {
		map(combinations, ({ path, parts: expected }) => {
			const result = parts(path);

			expect(result).toEqual(expected);
		});
	});

	test('fixes the given path', () => {
		map(combinations, ({ path, fixed: expected }) => {
			const result = fix(path);

			expect(result).toEqual(expected);
		});
	});

	test.only('resolve', () => {
		const cases = [
			['absolute', ['/'], '/'],
			// ['absolute', ['/a/'], '/a/'],
			// ['absolute', ['/a/../b/'], '/b/'],
			// ['absolute', ['/a/../b/../'], '/'],
			// ['absolute', ['/a/.../b/'], undefined],
			// ['relative', ['./'], '/'],
		];

		map(cases, ([type, input, expected]) => {
			expect(resolve(input)).toEqual(expected);
		});
	});
});
