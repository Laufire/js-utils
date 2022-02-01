import { findKey, reduce, findLastKey, map } from './collection';
import { isDefined } from './reflection';

const initialSlash = /^\//;

const fix = (path) => [
	[/^(?!(?:\.+\/)|\/|^\.+$)/, './'],
	[/^(\.+)$/, '$1/'],
	[/([^/]|(^|[^\\])((?:\\{2})*)\\\/)$/, '$1/'],
].reduce((acc, [matcher, replacement]) =>
	(acc.match(matcher)
		? acc.replace(matcher, replacement)
		: acc
	), path);

const parts = (() => {
	const matcher = /(?:(?:[^/\\]|\\.)*\/)/g;

	return (path) => (`${ fix(path) }`.replace(initialSlash, '').match(matcher) || [])
		.map((part) => part.slice(0, -1));
})();

const join = (pathParts) => `${ pathParts.join('/') }/`;

const pathType = (() => {
	const types = {
		absolute: /^\/(?:(?:[^\\/\\]|\\.)*\/)*$/,
		relative: /^\.+\/(?:(?:[^\\/\\]|\\.)*\/)*$/,
		lax: /.*/,
	};

	return (path) => findKey(types, (matcher) => matcher.test(path));
})();

const appendLabel = (baseParts, part) => baseParts.concat(part);

const navigate = (baseParts, part) => {
	const diff = part.length - baseParts.length;

	return diff > 0
		?	[`${ baseParts[0] }${ '.'.repeat(diff) }`]
		: baseParts.slice(0, 1 - part.length || baseParts.length);
};

// eslint-disable-next-line max-lines-per-function
const resolve = (() => {
	const navigationMarker = /^\.+$/;
	const isAbsolute = (path) =>
		pathType(path) === 'absolute';

	return (...paths) => {
		const fixedPaths = map(paths, fix);
		const absoluteKey = findLastKey(fixedPaths, isAbsolute);
		const trimmed = fixedPaths.slice(absoluteKey);
		const reduced = reduce(
			trimmed, (baseParts, path) => reduce(
				parts(path), (acc, part) =>
					(navigationMarker.test(part)
						? navigate
						: appendLabel)(acc, part)
				, baseParts
			), ['.']
		);

		return isDefined(absoluteKey)
			? reduced[0].length > 1
				? undefined
				: join(['', ...reduced.slice(1)])
			: join(reduced);
	};
})();

const escape = (() => {
	const escapePattern = /([\\.\\/\\])/g;

	return (path) => path.replace(escapePattern, '\\$1');
})();

const unescape = (() => {
	const unescapePattern = /\\(.|$)/g;

	return (path) => path.replace(unescapePattern, '$1');
})();

export {
	parts,
	fix,
	pathType,
	resolve,
	escape,
	unescape,
};
