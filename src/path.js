import { equals, findKey, reduce } from './collection';

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
	absolute: /^(\/)(?:.+\/$)?/,
	relative: /^(\.+\/)(?:.*\/$)?$/,
	lax: /(^(?:(?!\.+\/)|\/).+)|(.+[^\\/]$)/,
};

const pathType = (path) => findKey(matchers, (matcher) => matcher.test(path));

const operations = {
	absolute: () => [],
	relative: (baseParts, part) => baseParts.slice(0, 1 - part.length),
	lax: (baseParts, pathToInclude) =>
		baseParts.concat(pathToInclude),
};
// TODO: test current implementation with unescaped paths
const join = (pathParts) => (equals(pathParts, []) ? '/' : `${ pathParts.join('/') }/`);

const resolve = (...paths) => join(reduce(
	paths, (baseParts, path) => {
		reduce(
			parts(path), (acc, part) =>
				operations[pathType(part)](acc, part), baseParts
		);
	}, []
));

export {
	parts,
	fix,
	pathType,
	resolve,
};
