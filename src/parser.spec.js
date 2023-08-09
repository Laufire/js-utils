import { rndValue } from '@laufire/utils/random';
import { tag } from './parser';
import { retry, rndCollection } from '../test/helpers';
import { defined } from './fn';
import { keys, map, merge } from './collection';
import { rndValues } from './random';

describe('Tag each item in the collection with relevant attributes', () => {
	const tags = {
		human: {
			power: 'None',
			origin: 'Evolution',
		},
		superhuman: {
			power: 'Extraordinary abilities',
			origin: 'Accidents, experiments',
		},
		mutant: {
			power: 'Super abilities',
			origin: 'Genetic mutations',
		},
	};

	test('Example for tag', () => {
		const collection = [
			{
				tags: ['human'],
				name: 'Tony Stark',
				team: 'Avengers',
			},
		];

		const expected = [
			{
				tags: ['human'],
				name: 'Tony Stark',
				team: 'Avengers',
				power: 'None',
				origin: 'Evolution',
			},
		];

		const result = tag(collection, tags);

		expect(result).toEqual(expected);
	});

	test('The collections attribute takes precedence over the tags item.', () => {
		const collection = [
			{
				tags: ['human'],
				name: 'Tony Stark',
				power: 'Powered Armor',
			},
		];

		const expected = [
			{
				tags: ['human'],
				name: 'Tony Stark',
				origin: 'Evolution',
				power: 'Powered Armor',
			},
		];

		const result = tag(collection, tags);

		expect(result).toEqual(expected);
	});

	test('Tags has ascending priority', () => {
		const collection = [
			{
				tags: ['human', 'superhuman'],
				name: 'Steve Rogers',
				team: 'Avengers',
			},
		];

		const expected = [
			{
				tags: ['human', 'superhuman'],
				name: 'Steve Rogers',
				team: 'Avengers',
				power: 'Extraordinary abilities',
				origin: 'Accidents, experiments',
			},
		];

		const result = tag(collection, tags);

		expect(result).toEqual(expected);
	});

	test('Unknown tags have no effect', () => {
		const collection = [
			{
				tags: ['alien'],
				name: 'Groot',
				team: 'Guardians of the Galaxy',
			},
		];

		const expected = [
			{
				tags: ['alien'],
				name: 'Groot',
				team: 'Guardians of the Galaxy',
			},
		];

		const result = tag(collection, tags);

		expect(result).toEqual(expected);
	});

	test('Collection items without tags have no impact.', () => {
		const collection = [
			{
				name: 'Groot',
				team: 'Guardians of the Galaxy',
			},
		];

		const expected = [
			{
				name: 'Groot',
				team: 'Guardians of the Galaxy',
			},
		];

		const result = tag(collection, tags);

		expect(result).toEqual(expected);
	});

	test('Customize tags name', () => {
		const tagProp = 'classes';
		const collection = [
			{
				[tagProp]: ['human'],
				name: 'Tony Stark',
				team: 'Avengers',
			},
		];

		const expected = [
			{
				[tagProp]: ['human'],
				name: 'Tony Stark',
				team: 'Avengers',
				power: 'None',
				origin: 'Evolution',
			},
		];

		const result = tag(
			collection, tags, tagProp
		);

		expect(result).toEqual(expected);
	});

	test('Randomized test', () => {
		retry(() => {
			const rndPropName = rndValue([Symbol('tagProp'), undefined]);
			const propName = defined(rndPropName, 'tags');
			const rndTags = map(rndCollection(), () => rndCollection());
			const rndItems = rndCollection();
			const collection = map(rndCollection(), () => ({
				[propName]: rndValues([Symbol('nonExistentTag'), ...keys(rndTags)]),
				...rndItems,
			}));

			const result = tag(
				collection, rndTags, rndPropName
			);

			map(result, (item, index) => {
				const tagNames = collection[index][propName];
				const prop = merge({},
					...map(tagNames, (tagName) => rndTags[tagName]));

				const expected = {
					...prop,
					...rndItems,
					[propName]: tagNames,
				};

				expect(item).toEqual(expected);
			});
		});
	});
});
