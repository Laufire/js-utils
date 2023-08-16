import { tag } from './parser';
import {
	expectEquals,
	retry,
	rndCollection,
	rndNested,
	similarCols,
} from '../test/helpers';
import { defined } from './fn';
import {
	clone,
	keys,
	length,
	map,
	merge,
	reduce,
	secure,
	shell,
	shuffle,
} from './collection';
import { max } from './reducers';
import { isProbable } from './prob';
import { inferType } from './reflection';
import { rndValues, rndValue } from './random';
import { rndBetween } from './lib';

describe('Tag each item in the collection with relevant attributes', () => {
	describe('Examples', () => {
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

		test('The collections attribute takes'
		+ 'precedence over the tags item.', () => {
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
	});

	test('Randomized test', () => {
		retry(() => {
			const rndCollections = clone(similarCols());
			const childType = inferType(rndValue(rndCollections));
			const genProp = {
				array: () => rndBetween(reduce(map(rndCollections, length),
					max),
				100),
				object: () => rndValue([Symbol('tagProp'), undefined]),
			};
			const tags = map(rndCollection(), () => rndNested(
				0, 0, [childType]
			));

			const rndPropName = genProp[childType]();
			const defaultPropName = 'tags';
			const tagProp = defined(rndPropName, defaultPropName);

			const addTags = (collection) =>
				map(collection, (item) => {
					const hasTags = isProbable(0.8);
					const hasUnknownTag = isProbable(0.8);
					const candidates = keys(tags);
					const extensions = hasUnknownTag
						? [Symbol('Unknown Tag')]
						: [];

					hasTags
						&& (item[tagProp] = shuffle(rndValues([
							...extensions,
							...candidates,
						])));

					return item;
				});

			const collection = secure(addTags(rndCollections));

			const result = tag(
				collection, tags, rndPropName
			);

			expect(keys(collection)).toEqual(keys(result));

			const unify = (acc, cur) => {
				map(tags[cur] || [], (value, label) => {
					acc[label] = value;
				});
				return acc;
			};

			map(result, (item, key) => {
				const entity = collection[key];

				const propsFromTags = reduce(
					entity[tagProp] || [],
					unify,
					shell(entity)
				);

				expectEquals(keys(item), keys(merge(propsFromTags, entity)));

				map(item, (dummy, k) => {
					expect(item[k])
						.toEqual(defined(entity[k], propsFromTags[k]));
				});
			});
		});
	});
});
