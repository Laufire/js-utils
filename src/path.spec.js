import {
	find,	findKey, keys, map, pick, range, reduce, filter,
} from '@laufire/utils/collection';
import { sum } from '@laufire/utils/reducers';
import { rndString, rndValue, rndBetween } from '@laufire/utils/random';
// TODO: Use published import when available.
import { isProbable } from './prob';
import { retry, findLastIndex } from '../test/helpers';

import { fix, parts, pathType, resolve } from './path';

/* Config */
const higherLimit = 8;
const lowerLimit = 0;

// TODO: Use rndRange from helpers.
const getRndRange = () => range(0, rndBetween(lowerLimit, higherLimit));

const partGenerators = {
	relative: () => '.'.repeat(rndBetween(1, 5)),
	empty: () => '',
	label: () => rndString(rndBetween(5, 10),	'abcdefghijklmnopqrstuvwxyz.'),
};

const randomParts = () => map(getRndRange(), () =>
	rndValue(partGenerators)());

const matchers = {
	relative: /^\.+$/,
	empty: /^$/,
	label: /^(?:\.*[^\\.]+\.*)*$/,
};

const getPartType = (part) =>
	findKey(matchers, (matcher) =>	matcher.test(part));

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
	const fixedType = rndValue(keys(fixers));
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
	const testCases = retry(generateCase, 10000);

	describe('Generated cases', () => {
		test('Parts length should be from 0 to'
			+ 'one more than higherLimit',
		() => {
			// NOTE: Length is one more than higherLimit due relative partFixer.
			const items = map(testCases, ({ parts: { length }}) => length);
			// TODO: Use library functions post publish.
			const lengths = [...new Set(items)].sort();

			// TODO: Change the values after using published rndBetween.
			// NOTE: Published rndBetween will be exclusive.
			const expectation = range(lowerLimit, higherLimit + 2);

			expect(lengths).toEqual(expectation);
		});

		test('All types of paths should be present', () => {
			const validTypes = ['absolute', 'relative', 'lax'];
			const types = pick(testCases, 'type');
			const allTypes = filter(validTypes, (validType) =>
				types.includes(validType));

			expect(allTypes).toEqual(validTypes);
		});

		test('All path types should be present.', () => {
			const reduced = reduce(
				testCases, (acc, { parts: currentParts }) =>
					[...acc, ...currentParts], []
			);

			const summary = reduce(
				reduced, (acc, part) => {
					const type = getPartType(part);

					return { ...acc, [type]: (acc[type] || 0) + 1 };
				}, {}
			);

			const knownTypeCount = reduce(
				summary, sum, 0
			);

			expect(knownTypeCount).toEqual(reduced.length);
			expect(summary.undefined).toEqual(undefined);
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

	test('resolve resolves a valid path from the given paths', () => {
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
