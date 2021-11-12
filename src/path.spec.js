import { map } from './collection';
import { fix, parts } from './path';
import { rndString, rndValue } from './random';

describe('path', () => {
	test('builds parts based on path', () => {
		const single = rndString();
		const parent = rndString();
		const child = rndString();

		const expectation = [
			[[single], [single]],
			[[`${ parent }/${ child }`], [parent, child]],
			[[`${ parent }/\\/${ child }`], [parent, `/${ child }`]],
			[['/'], ['']],
		];

		expectation.forEach(([path, expected]) => {
			const result = parts(path);

			expect(result).toEqual(expected);
		});
	});

	test('fixes the given path', () => {
		const path = `${ rndValue(['', '.']) }${ rndString() }${ rndValue(['', '/']) }`;
		const fixExpectation = ([input, expectation]) =>
			[input, expectation.replace(/(\/\/)$/, '/')];
		const combinations = map([
			[`/${ path }`, `/${ path }/`],
			[path, `./${ path }/`],
			[`./${ path }`, `./${ path }/`],
		], fixExpectation);

		combinations.forEach(([pathToFix, expected]) => {
			const result = fix(pathToFix);

			expect(result).toEqual(expected);
		});
	});
});
