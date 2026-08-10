import type { ConsumerGuide } from '@domain/learn/consumer-guide.js';
import type { Ingredient } from '@domain/learn/ingredient.js';
import type { MythFact } from '@zod/learn-schema.js';
import { typesense } from '@src/admin/config.js';
import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/firestore';
import { logger } from 'firebase-functions/logger';

const ingredientCollectionPath = 'ingredients_glossary';
const ingredientDocumentPath = `${ingredientCollectionPath}/{id}`;

const consumerGuideCollectionPath = 'consumer_guides';
const consumerGuideDocumentPath = `${consumerGuideCollectionPath}/{id}`;

const mythFactsCollectionPath = 'myth_facts';
const mythFactDocumentPath = `${mythFactsCollectionPath}/{id}`;

const typsenseOnUpdateIngredient = onDocumentUpdated(
	ingredientDocumentPath,
	async (e) => {
		const data = e.data?.after.data();

		const { id, is_deleted, categories, best_for, common_products } = data as Ingredient;

		await typesense.collections('admin_ingredients_filter').documents(id).update({
			is_deleted,
			categories,
			best_for,
			common_products
		});

		await typesense
			.collections('ingredients')
			.documents(id)
			.update(data as object);
	}
);

const typsenseOnCreateIngredient = onDocumentCreated(
	ingredientDocumentPath,
	async (e) => {
		const snapshot = e.data;

		const document = { ...snapshot?.data() } as Ingredient;

		await typesense.collections('admin_ingredients_filter').documents().create(document);
		await typesense.collections('ingredients').documents().create(document);
	}
);

const typsenseOnUpdateConsumerGuide = onDocumentUpdated(
	consumerGuideDocumentPath,
	async (e) => {
		const data = e.data?.after.data();

		const { id, is_deleted, name } = data as ConsumerGuide;

		await typesense.collections('admin_consumer_guides_filter').documents(id).update({
			is_deleted,
			name
		});
	}
);

const typsenseOnCreateConsumerGuide = onDocumentCreated(
	consumerGuideDocumentPath,
	async (e) => {
		const snapshot = e.data;

		const document = { ...snapshot?.data() } as ConsumerGuide;

		const { id, name, is_deleted } = document;

		await typesense
			.collections('admin_consumer_guides_filter')
			.documents()
			.create({ id, name, is_deleted });
	}
);

const typsenseOnUpdateMythFact = onDocumentUpdated(mythFactDocumentPath, async (e) => {
	const data = e.data?.after.data();

	const { id, is_deleted, name } = data as MythFact;

	await typesense.collections('admin_myth_facts_filter').documents(id).update({
		is_deleted,
		name
	});
});

const typsenseOnCreateMythFact = onDocumentCreated(mythFactDocumentPath, async (e) => {
	const snapshot = e.data;

	const document = { ...snapshot?.data() } as MythFact;

	const { id, name, is_deleted } = document;
	try {
		await typesense
			.collections('admin_myth_facts_filter')
			.documents()
			.create({ id, name, is_deleted });
	} catch (error) {
		logger.info(error);
	}
});

export const typesenseTriggers = {
	typsenseOnCreateIngredient,
	typsenseOnUpdateIngredient,

	typsenseOnCreateConsumerGuide,
	typsenseOnUpdateConsumerGuide,

	typsenseOnCreateMythFact,
	typsenseOnUpdateMythFact
};
