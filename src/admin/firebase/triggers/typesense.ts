import type { ConsumerGuide } from '@domain/learn/consumer-guide.js';
import type { Ingredient } from '@domain/learn/ingredient.js';
import type { MythFact } from '@zod/learn-schema.js';
import { storage, typesense } from '@src/admin/config.js';
import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/logger';

const ingredientCollectionPath = 'ingredients_glossary';
const ingredientDocumentPath = `${ingredientCollectionPath}/{id}`;

const consumerGuideCollectionPath = 'consumer_guides';
const consumerGuideDocumentPath = `${consumerGuideCollectionPath}/{id}`;

const mythFactsCollectionPath = 'myth_facts';
const mythFactDocumentPath = `${mythFactsCollectionPath}/{id}`;

const typsenseOnUpdateIngredient = onDocumentUpdated(
	{ document: ingredientDocumentPath, retry: true },
	async (e) => {
		const data = e.data?.after.data();

		const { id, name, is_deleted, categories, best_for, common_products } =
			data as Ingredient;

		await typesense.collections('admin_ingredients_filter').documents().upsert({
			id,
			name,
			is_deleted,
			categories,
			best_for,
			common_products
		});

		await typesense
			.collections('ingredients')
			.documents()
			.upsert(data as Ingredient);
	}
);

const typsenseOnCreateIngredient = onDocumentCreated(
	{ document: ingredientDocumentPath, retry: true },
	async (e) => {
		const snapshot = e.data;

		const document = { ...snapshot?.data() } as Ingredient;

		await typesense.collections('admin_ingredients_filter').documents().upsert(document);
		await typesense.collections('ingredients').documents().upsert(document);
	}
);

const typsenseOnUpdateConsumerGuide = onDocumentUpdated(
	{ document: consumerGuideDocumentPath, retry: true },
	async (e) => {
		const data = e.data?.after.data();

		const { id, is_deleted, name } = data as ConsumerGuide;

		await typesense.collections('admin_consumer_guides_filter').documents().upsert({
			id,
			is_deleted,
			name
		});
	}
);

const typsenseOnCreateConsumerGuide = onDocumentCreated(
	{ document: consumerGuideDocumentPath, retry: true },
	async (e) => {
		const snapshot = e.data;

		const document = { ...snapshot?.data() } as ConsumerGuide;

		const { id, name, is_deleted } = document;

		await typesense
			.collections('admin_consumer_guides_filter')
			.documents()
			.upsert({ id, name, is_deleted });
	}
);

const typsenseOnUpdateMythFact = onDocumentUpdated(
	{ document: mythFactDocumentPath, retry: true },
	async (e) => {
		const staleData = e.data?.before.data() as MythFact;
		const newData = e.data?.after.data() as MythFact;

		const newImageIds = new Set(newData.topics.map((topic) => topic.imageId));

		const deletedTopics = staleData.topics.filter(
			(staleTopic) => !newImageIds.has(staleTopic.imageId)
		);

		logger.info('new image ids', newImageIds);
		logger.info('deleted topics', deletedTopics);

		if (deletedTopics.length > 0) {
			const bucket = storage.bucket('beauwise-asia');
			logger.info('Deleting orphaned topic images:', deletedTopics);

			for await (const item of deletedTopics) {
				if (!item.imageId) continue;
				const filePath = `learn/${newData.baseImagePath}/${item.imageId}.webp`;

				try {
					await bucket.file(filePath).delete({ ignoreNotFound: true });
				} catch (error) {
					logger.error(`Failed to delete image: ${filePath}`, error);
				}
			}
		}

		const { id, is_deleted, name } = newData as MythFact;

		await typesense.collections('admin_myth_facts_filter').documents().upsert({
			id,
			is_deleted,
			name
		});
	}
);

const typsenseOnCreateMythFact = onDocumentCreated(
	{ document: mythFactDocumentPath, retry: true },
	async (e) => {
		const snapshot = e.data;

		const document = { ...snapshot?.data() } as MythFact;

		const { id, name, is_deleted } = document;

		await typesense
			.collections('admin_myth_facts_filter')
			.documents()
			.upsert({ id, name, is_deleted });
	}
);

export const typesenseTriggers = {
	typsenseOnCreateIngredient,
	typsenseOnUpdateIngredient,

	typsenseOnCreateConsumerGuide,
	typsenseOnUpdateConsumerGuide,

	typsenseOnCreateMythFact,
	typsenseOnUpdateMythFact
};

function checkFoo(beforeData: MythFact, afterData: MythFact) {
	logger.info('before data', beforeData);
	logger.info('after data', afterData);

	return (
		beforeData.topics.length === afterData.topics.length &&
		JSON.stringify(beforeData) === JSON.stringify(afterData)
	);
}
