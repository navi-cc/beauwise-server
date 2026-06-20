// NOTE
// Only run this test if the firebase emulator is active
// You can start the emulator via `npm run dev`
import {
	initializeTestEnvironment,
	type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { getEmulatorStatus } from '../getEmulatorStatus.js';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { getTestIdToken } from '../getTestIdToken.js';
import type { PaginationResult } from '@query/learn-query.js';
import { getTestIdUser } from '../getTestIdUser.js';
import {
	createIngredientInstance,
	type Ingredient,
	type IngredientInstance
} from '@domain/learn/ingredient.js';
import {
	createConsumerGuideInstance,
	type ConsumerGuide,
	type ConsumerGuideInstance
} from '@domain/learn/consumer-guide.js';
import {
	createMythFactInstance,
	type MythFact,
	type MythFactInstance
} from '@domain/learn/myth-fact.js';

import { seed } from '../seed.js';
const isEmulatorActive = await getEmulatorStatus();
const api = 'http://127.0.0.1:5001/demo-beauwise/us-central1/admin';

describe.runIf(isEmulatorActive)('learn api', () => {
	let testUserId: string | undefined;
	let testTokenId: string;
	let testApp = {} as RulesTestEnvironment;
	beforeAll(async () => {
		testApp = await initializeTestEnvironment({ projectId: 'demo-beauwise' });
	});

	beforeEach(async () => {
		const projectId = 'demo-beauwise';
		const authEmulatorUrl = `http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`;

		await fetch(authEmulatorUrl, {
			method: 'DELETE'
		});
		await testApp.clearFirestore();

		await seed();
		testUserId = await getTestIdUser();
		testTokenId = await getTestIdToken(testUserId);
	});

	describe('/learn', () => {
		describe('/ingredient add ingredient', () => {
			test('should return 200 if the ingredient is successfully added.', async () => {
				const mockNewIngredient: IngredientInstance = createIngredientInstance({
					id: 'hatdog',
					is_deleted: false,
					name: 'Hatdoggy',
					categories: ['Skin-Conditioning Hatdog'],
					what_it_is:
						'A naturally-hatdog, ubiquitous chemical and ribonucleoside composed of hatdog and cream.',
					what_it_does: [
						'Acts as a skin-conditioning hatdog',
						'Stimulates cell hatdogilation and DNA hatdogisys'
					],
					best_for: ['General Skin Hatdog'],
					common_products: ['Hatdog Cream', 'Creamy Hatdog'],
					safety_level: 'Safe for hatdog',
					sources: [
						'https://sample-site-hatdog-123',
						'https://sample-site-bigger-hatdog-123'
					]
				});

				const response = await request(api)
					.post(`/learn/ingredients`)
					.auth(testTokenId, { type: 'bearer' })
					.send({
						newItem: mockNewIngredient.get()
					});

				expect(response.statusCode).toBe(200);
			});

			test('should return 200 and the updated item if the ingredient is successfully updated.', async () => {
				const mockIngredient: IngredientInstance = createIngredientInstance({
					id: 'adenosine',
					is_deleted: false,
					name: 'Adenosine',
					categories: ['Skin-Conditioning Agent'],
					what_it_is:
						'A naturally-occurring, ubiquitous chemical and ribonucleoside composed of adenine and ribose.',
					what_it_does: [
						'Acts as a skin-conditioning agent',
						'Stimulates cell proliferation and DNA synthesis'
					],
					best_for: ['General Skin Conditioning', 'Face', 'Neck', 'Moisturizing'],
					common_products: [
						'Face hatdog',
						'Neck Cream',
						'Moisturizer',
						'Body Cream',
						'Hand Cream',
						'Face Powder',
						'Lipstick',
						'Mascara'
					],
					safety_level:
						'Safe for use in cosmetics at present practices and concentrations (used at up to 1% in leave-on body and hand products). It has been evaluated as non-irritating and non-sensitizing to the skin.',
					sources: [
						'https://www.cir-safety.org/sites/default/files/adenos09202FR.pdf',
						'https://www.mdpi.com/2218-273X/15/8/1093'
					]
				});

				mockIngredient.update({
					...mockIngredient.get(),
					is_deleted: true
				});

				const response = await request(api)
					.put(`/learn/ingredients/${mockIngredient.get().id}`)
					.auth(testTokenId, { type: 'bearer' })
					.send({
						updatedItem: mockIngredient.get()
					});

				const apiResult = { ...response.body.item } as Ingredient;

				expect(apiResult).toStrictEqual(mockIngredient.get());
			});
		});
	});
	describe('put /consumer-guides', () => {
		describe('update consumer guide', () => {
			test('should return 200 if the consumer guide is successfully updated.', async () => {
				const mockConsumerGuide: ConsumerGuideInstance = createConsumerGuideInstance({
					id: 'pao',
					is_deleted: false,
					name: 'PAO (Period After Opening)',
					image_source: '(I will provide it myself later.)',
					definition:
						'Indicates how long a cosmetic product is safe to use after you open its seal for the first time.',
					usage:
						'Look for a number inside the jar with an M (like 12M for 12 months). Throw the product away after this time passes to avoid bacterial infections. This symbol is only used for products that have an unopened shelf life of more than 30 months. It is not used on single-use items or aerosols.',
					sources: [
						'https://www.certifiedcosmetics.com/blog/cosmetic-product-labelling/what-is-period-after-opening-pao/'
					]
				});

				mockConsumerGuide.update({
					...mockConsumerGuide.get(),
					is_deleted: true
				});

				const response = await request(api)
					.put(`/learn/consumer-guides/${mockConsumerGuide.get().id}`)
					.auth(testTokenId, { type: 'bearer' })
					.send({
						updatedItem: mockConsumerGuide.get()
					});

				const apiResult = { ...response.body.item } as ConsumerGuide;

				expect(apiResult).toStrictEqual(mockConsumerGuide.get());
			});
		});
	});

	describe('put /myth-facts', () => {
		describe('update myth fact', () => {
			test('should return 200 if the myth fact is successfully updated.', async () => {
				const mythFact: MythFactInstance = createMythFactInstance({
					id: 'pore_myths_facts',
					is_deleted: false,
					name: 'Pore Myths and Facts',
					image_source:
						'https://unsplash.com/photos/a-mans-back-with-water-drops-on-it-OHt5FB13CD4',
					topics: [
						{
							topic: 'Pore Size Reduction',
							myth: 'You can reduce your pore size.',
							fact: 'Pore size is mostly genetic, but retinoids and exfoliants can make pores appear less visible by reducing excess oil buildup.'
						},
						{
							topic: 'Steam and Pores',
							myth: 'Steam opens pores.',
							fact: 'Steam does not open pores because pores have no muscles, but it can soften trapped oil and debris for easier extraction.'
						},
						{
							topic: 'Cold Water Effects',
							myth: 'Cold water closes pores.',
							fact: 'Cold water cannot permanently close pores, though it may temporarily reduce their appearance and calm inflammation.'
						},
						{
							topic: 'The Color of Blackheads',
							myth: 'Blackheads mean dirty pores.',
							fact: 'Blackheads are caused by oxidized oil and dead skin cells, not by dirt trapped inside pores.'
						},
						{
							topic: 'Sun Exposure',
							myth: 'Sun can shrink large pores.',
							fact: 'Excessive sun exposure damages collagen and can make pores appear larger over time.'
						},
						{
							topic: 'Sunscreen Application',
							myth: 'Sunscreen clogs pores.',
							fact: 'Modern non-comedogenic sunscreens help protect collagen and usually do not clog pores when properly formulated.'
						},
						{
							topic: 'Pore Size Changes',
							myth: 'Your pore size will always remain the same.',
							fact: 'Pore visibility can change over time due to hormones, aging, and reduced collagen elasticity.'
						}
					],
					sources: [
						'https://ascensushealth.com.sg/blog/top-7-pore-myths-you-should-stop-believing/'
					]
				});

				const response = await request(api)
					.put(`/learn/myth-facts/${mythFact.get().id}`)
					.auth(testTokenId, { type: 'bearer' })
					.send({
						updatedItem: mythFact.get()
					});

				const apiResult = { ...response.body.item } as MythFact;

				expect(apiResult).toStrictEqual(mythFact.get());
			});
		});
	});

	// I won't test other get methods of the learn route since they produce the same flow.
	describe('get /learn/ingredients', () => {
		test('should return items of ingredients glossary and a status of 200', async () => {
			const pageSize = 10;
			const response = await request(api)
				.get('/learn/ingredients')
				.query({
					pageSize
				})
				.auth(testTokenId, { type: 'bearer' });

			const result = response.body as PaginationResult;

			expect(response.status).toBe(200);
			expect(result.data.length).toBeGreaterThan(1);
		});

		test('should return 200 when using page cursor', async () => {
			const pageSize = 10;
			const firstResponse = await request(api)
				.get('/learn/ingredients')
				.query({
					pageSize
				})
				.auth(testTokenId, { type: 'bearer' });

			const result = firstResponse.body as PaginationResult;

			const pageParam = result.pagination.cursor;

			const secondResponse = await request(api)
				.get('/learn/ingredients')
				.query({
					pageSize,
					pageParam
				})
				.auth(testTokenId, { type: 'bearer' });

			const secondResult = secondResponse.body as PaginationResult;

			expect(secondResponse.statusCode).toBe(200);
			expect(secondResult.data.length).toBeGreaterThan(1);
		});

		test('should return 4xx if page size is lower than the required size', async () => {
			const pageSize = 5;
			const response = await request(api)
				.get('/learn/ingredients')
				.query({
					pageSize
				})
				.auth(testTokenId, { type: 'bearer' });

			expect(response.status).toBeGreaterThanOrEqual(400);
		});
	});
});
