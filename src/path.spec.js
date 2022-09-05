import {
	fix, parts, pathType,
	resolve, escape, unescape,
} from './path';
import {
	find, findKey, map,
	pick, range, reduce,
	filter, shuffle, sort,
} from '@laufire/utils/collection';
import {
	rndValue, rndBetween, rndValueWeighted,
	rndValues,
} from '@laufire/utils/random';
import { sum } from '@laufire/utils/reducers';
import { isProbable } from '@laufire/utils/prob';
import { unique } from '@laufire/utils/predicates';
import {
	retry, findLastIndex, summarize,
	testRatios,
	rndRange,
} from '../test/helpers';

/* Config */
const higherLimit = 8;
const lowerLimit = 0;

const navMarkers = ['.', '/'];
const escapeChar = '\\';
const specialChars = [...navMarkers, escapeChar];
const escapedChars = map(specialChars, (char) => `\\${ char }`);
const labelChars = [
	...'abcdefghijklmnopqrstuvwxyz'.split(''),
	...escapedChars,
];

const rndChars = (collection) =>
	shuffle(rndValues(collection, rndBetween(1, 8)));

const partGenerators = {
	relative: () => '.'.repeat(rndBetween(1, 5)),
	empty: () => '',
	label: () => rndChars(labelChars).join(''),
};

const randomParts = () => map(rndRange(lowerLimit, higherLimit), () =>
	rndValue(partGenerators)());

const matchers = {
	relative: /^\.+$/,
	empty: /^$/,
	label: /(?:[^\\/\\]|\\.)+/,
};

const getPartType = (part) =>
	findKey(matchers, (matcher) => matcher.test(part));

const isLabel = (part) => getPartType(part) === 'label';

const fixers = {
	absolute: {
		partFixer: (pathParts) => pathParts,
		pathFixer: (pathParts) => (pathParts.length ? '/' : ''),
		prefix: '/',
	},
	relative: {
		partFixer: (pathParts) => [partGenerators.relative(), ...pathParts],
		pathFixer: () => '',
		prefix: './',
	},
};

const toLax = (() => {
	const prefixProbs = {
		should: {
			qualifier: (source, type) =>
				type === 'absolute' || source.length === 0 || source[0] === '',
			value: 1,
		},
		shouldNot: {
			qualifier: ([firstPart], type) =>
				type === 'relative' && getPartType(firstPart) === 'relative',
			value: 0,
		},
		optional: {
			qualifier: ([firstPart], type) =>
				type === 'relative' && isLabel(firstPart),
			value: 0.5,
		},
	};

	const segments = {
		prefix: (source, type) => {
			const { prefix } = fixers[type];
			const { value: prob } = find(prefixProbs, ({ qualifier }) =>
				qualifier(source, type));

			return `${ isProbable(prob) ? prefix : '' }`;
		},
		body: (source) => source.join('/'),
		suffix: (source) => {
			const prob = source[source.length - 1] === ''
				? 1
				: source.length ? 0.5 : 0;

			return `${ isProbable(prob) ? '/' : '' }`;
		},
	};

	return (source, type) => reduce(
		segments, (acc, segment) =>
			acc + segment(source, type), ''
	);
})();

const fixParts = (source, fixedType) => [
	...fixedType === 'lax' && isLabel(source[0]) ? ['.'] : [],
	...source,
];

const generateCase = () => {
	const weights = { absolute: 1, relative: 3 };
	const fixedType = rndValueWeighted(weights)();
	const isLax = isProbable(0.5);
	const { partFixer, pathFixer } = fixers[fixedType];
	const source = partFixer(randomParts());
	const fixed = `${ pathFixer(source) }${ source.join('/') }/`;
	const fixedParts = fixParts(source, fixedType);
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
	const generatedCases = retry(generateCase, 10000);

	const testCases = (fn, cases) => map(cases, ({ input, expectation }) => {
		expect(fn(input)).toEqual(expectation);
	});

	describe('Generated cases', () => {
		test('Parts length is from 0 to'
			+ ' one more than higherLimit',
		() => {
			// NOTE: Length is one more than higherLimit due relative partFixer.
			const items = map(generatedCases, ({ parts: { length }}) => length);
			const lengths = sort(filter(items, unique));

			// TODO: Change the values after using published rndBetween.
			// NOTE: Published rndBetween will be exclusive.
			const expectation = range(lowerLimit, higherLimit + 1);

			expect(lengths).toEqual(expectation);
		});

		test('All types of paths are present', () => {
			const validTypes = ['absolute', 'relative', 'lax'];
			const types = pick(generatedCases, 'type');
			const allTypes = filter(validTypes, (validType) =>
				types.includes(validType));

			expect(allTypes).toEqual(validTypes);
		});

		test('All part types are present', () => {
			const flattenedParts = reduce(
				generatedCases, (acc, { parts: currentParts }) =>
					[...acc, ...currentParts], []
			);

			const summary = summarize(map(flattenedParts, getPartType));

			const knownTypeCount = reduce(
				summary, sum, 0
			);

			expect(knownTypeCount).toEqual(flattenedParts.length);
			expect(summary.undefined).toEqual(undefined);
		});

		test('Ratio between absolute and relative paths is 1:3', () => {
			const allTypes = pick(generatedCases, 'fixedType');

			testRatios(allTypes, {
				absolute: 1 / 4,
				relative: 3 / 4,
			});
		});
	});

	describe('fix fixes the given path', () => {
		test('example', () => {
			const cases = [
				{
					input: '/a/b',
					expectation: '/a/b/',
				},
				{
					input: 'a/b',
					expectation: './a/b/',
				},
				{
					input: './a/b/',
					expectation: './a/b/',
				},
				{
					input: 0,
					expectation: './0/',
				},
			];

			testCases(fix, cases);
		});

		test('randomized test', () => {
			map(generatedCases, ({ path, fixed }) => {
				expect(fix(path)).toEqual(fixed);
			});
		});
	});

	describe('parts splits the given path into parts array', () => {
		test('example', () => {
			const cases = [
				{
					input: '/a/b/',
					expectation: ['a', 'b'],
				},
				{
					input: './a/b//',
					expectation: ['.', 'a', 'b', ''],
				},
				{
					input: 'a/b',
					expectation: ['.', 'a', 'b'],
				},
			];

			testCases(parts, cases);
		});

		test('randomized test', () => {
			map(generatedCases, ({ path, parts: expected }) => {
				expect(parts(path)).toEqual(expected);
			});
		});
	});

	describe('pathType identifies the path type of the given path', () => {
		test('example', () => {
			const cases = [
				{
					input: '/a/b/',
					expectation: 'absolute',
				},
				{
					input: './a/b/',
					expectation: 'relative',
				},
				{
					input: './a/b',
					expectation: 'lax',
				},
				{
					input: 'a/b/',
					expectation: 'lax',
				},
			];

			testCases(pathType, cases);
		});

		test('randomized test', () => {
			map(generatedCases, ({ path, type: expected }) => {
				expect(pathType(path)).toEqual(expected);
			});
		});
	});

	describe('resolve resolves a valid path from the given paths', () => {
		test('example', () => {
			const cases = [
				{
					input: '/a/b/',
					expectation: '/a/b/',
				},
				{
					input: '/a/.../',
					expectation: undefined,
				},
				{
					input: './a//b/../',
					expectation: './a//',
				},
				{
					input: './a/.../b/',
					expectation: '../b/',
				},
				{
					input: '/.a/b./',
					expectation: '/.a/b./',
				},
			];

			testCases(resolve, cases);
		});

		test('randomized test', () => {
			const digest = (typeParts, isAbsolute) => {
				let pending = 0;
				const labels = [];

				const navigate = (part) => {
					pending += Math.max(0, part.length - labels.length - 1);
					labels.splice(1 - part.length || labels.length);
				};

				map(typeParts, (part) =>
					(getPartType(part) !== 'relative'
						? labels.push(part)
						: navigate(part)));

				const body = `${ labels.join('/') }${ labels.length ? '/' : '' }`;
				const prefix = `${ '.'.repeat(pending + (isAbsolute ? 0 : 1)) }/`;

				const resolved = `${ prefix }${ body }`;

				return { pending, labels, resolved };
			};

			const buildExpectation = (cases) => {
				const lastAbsIndex = findLastIndex(cases, ({ fixedType }) =>
					fixedType === 'absolute');
				const isAbsolute = lastAbsIndex > -1;
				const sliced = cases.slice(isAbsolute ? lastAbsIndex : 0);
				const typeParts = map(sliced,
					({ parts: currentParts }) => currentParts).flat();

				const { pending, resolved } = digest(typeParts, isAbsolute);

				return lastAbsIndex > -1 && pending > 0
					? undefined
					: resolved;
			};

			retry(() => {
				const cases = retry(generateCase, rndBetween(0, 10));
				const expected = buildExpectation(cases);
				const paths = pick(cases, 'path');

				const result = resolve(...paths);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('escaping and unescaping', () => {
		const inputs = retry(() =>
			rndChars([...labelChars, ...specialChars, ...escapedChars]));
		const cases = map(inputs, (characters) => {
			const input = characters.join('');
			const escaped = map(characters, (character) =>
				character.split('').map((item) =>
					(specialChars.includes(item) ? `${ escapeChar }${ item }` : item))
					.join('')).join('');
			const unescaped = input.split(escapeChar.repeat(2))
				.map((part) =>	part.split(escapeChar).join(''))
				.join(escapeChar);

			return { input, escaped, unescaped };
		});

		describe('escape escapes the given path', () => {
			test('example', () => {
				const escapeCases = [
					{
						input: 'a.',
						expectation: 'a\\.',
					},
					{
						input: 'a\\b/',
						expectation: 'a\\\\b\\/',
					},
					{
						input: 'a./\\',
						expectation: 'a\\.\\/\\\\',
					},
				];

				testCases(escape, escapeCases);
			});

			test('randomized test', () => {
				map(cases, ({ input, escaped }) => {
					const result = escape(input);

					expect(result).toEqual(escaped);
				});
			});
		});

		describe('unescape unescapes the given path', () => {
			test('example', () => {
				const unescapeCases = [
					{
						input: 'a\\.',
						expectation: 'a.',
					},
					{
						input: 'a\\\\b\\/',
						expectation: 'a\\b/',
					},
					{
						input: 'a\\.\\/\\\\',
						expectation: 'a./\\',
					},
				];

				testCases(unescape, unescapeCases);
			});

			test('randomized test', () => {
				map(cases, ({ input, unescaped }) => {
					const result = unescape(input);

					expect(result).toEqual(unescaped);
				});
			});
		});
	});
});
