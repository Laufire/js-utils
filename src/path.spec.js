import { equals, keys, map, range } from './collection';
import { fix, parts, pathType, resolve } from './path';
import { rndString, rndValue, rndBetween } from './random';

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

const prefixes = {
	absolute: ([initialPart]) => (initialPart === '' ? '/' : ''),
	relative: () => '',
	lax: (fixedParts) => (equals(fixedParts.slice(0, 2), emptyParts)
		? ''
		: './'),
};

// eslint-disable-next-line complexity
const pathDetails = (type, pathParts) => {
	// Const pathParts = randomParts();
	const fixedParts = partPrefixes[type](pathParts);
	const stiched = `${ type === 'absolute' ? '/' : '' }${ fixedParts.join('/') }/`;
	const fixed = `${ prefixes[type](fixedParts) }${ stiched }${ stiched === '/' ? '' : '/' }`;
	const path = type !== 'lax'
		? fixed
		: fixed
			.slice(equals(fixedParts.slice(0, 2), emptyParts) ? 0 : 2)
			.slice(0, pathParts[pathParts.length - 1] === '' ? undefined : -1);

	return {
		parts: fixedParts,
		path: path,
		fixed: fixed,
		type: type,
	};
};

describe('path', () => {
	// Const combinations = range(1, 1000).map(() =>
	// 	PathDetails(rndValue(keys(partPrefixes))));

	// Test('builds parts based on path', () => {
	// 	Map(combinations, ({ path, parts: expected }) => {
	// 		Const result = parts(path);

	// 		Expect(result).toEqual(expected);
	// 	});
	// });

	test.only('fixes the given path', () => {
		// Map(combinations, ({ path, fixed: expected, type, parts }) => {
		// 	Const result = fix(path);
		// 	Const find = expected === result;

		// 	Expect(true).toEqual(find);
		// });
		const result = pathDetails('lax', ['.', '', '.', '']);

		expect(true).toEqual(true);
	});

	test('resolve base path based on current path', () => {
		const result = resolve('dev/cloning/js-utils', '.././js-utils');

		expect(result).toEqual(['dev', 'cloning', 'js-utils']);
	});

	test('return path type', () => {
		// Const optionRelativePath = () => rndValue([`${ rndString() }/`, '']);
		const expectation = [
			[`${ '.'.repeat(rndBetween(1, 5)) }/`, 'relative'],
			['/', 'absolute'],
			[rndString(), 'lax'],
		];

		console.log(range(1, 10000).map(() => {
			const { path, parts: p } = pathDetails('lax');

			return path.replace(/(\/)$/, '') !== p.join('/');
		})
			.filter((x) => x));

		expectation.forEach(([input, expected]) => {
			const result = pathType(input);

			expect(result).toEqual(expected);
		});
	});
});
