import { findKey } from './collection';

const initialSlash = /^\//;

const fix = (path) => [
	[/^(?!(?:\.+\/)|\/|^\.+$)/, './'],
	[/^(\.+)$/, '$1/'],
	[/([^\\/]$)/, '$1/'],
].reduce((acc, [matcher, replacement]) =>
	(acc.match(matcher)
		? acc.replace(matcher, replacement)
		: acc
	), path);

const parts = (() => {
	const matcher = /(?:(?:[^/\\]|\\.)*\/)/g;
	const escapedSequence = /\\(.)/g;

	return (path) => (`${ fix(path) }`.replace(initialSlash, '').match(matcher) || [])
		.map((part) => part.replace(escapedSequence, '$1').slice(0, -1));
})();

const matchers = {
	absolute: /^(\/)/,
	lax: /^(?!(?:\.+\/)|\/)/,
	relative: /^(\.+\/)/,
};

const operations = {
	absolute: () => [],
	lax: (baseParts, pathToInclude) =>
		baseParts.concat(pathToInclude),
	relative: (baseParts, part) => baseParts.slice(0, 1 - part.length),
};

const pathType = (path) => {
	const type = findKey(matchers, (value) => value.test(path));

	return type;
};

const resolve = (base, current) => {
	const currentParts = parts(current);
	const baseParts = parts(base);

	const newPath = currentParts.reduce((acc, op) =>
		operations[pathType(`${ op }/`)](acc, op), baseParts).join('/');

	return newPath;
};

export {
	parts,
	fix,
	resolve,
	pathType,
};
