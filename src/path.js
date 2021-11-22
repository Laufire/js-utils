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
	absolute: /^(\/)(?:.+\/$)?/,
	relative: /^(\.+\/)(?:.*\/$)?$/,
	lax: /(^(?:(?!\.+\/)|\/).+)|(.+[^\\/]$)/,
};

const pathType = (path) => findKey(matchers, (matcher) => matcher.test(path));

export {
	parts,
	fix,
	pathType,
};
