import express from 'express';

// import { userQuery } from '@routes/user.route.js';
import { validate } from '@middleware/validate.js';
// import { authorize } from '@middleware/auth.js';

import { createLearnSchema } from '@zod/learn-schema.js';
import { createLearnQuery } from '@query/learn-query.js';
import { createLearnController } from '@controller/learn-controller.js';
import { createLearnService } from '@services/learn-service.js';
import { createLearnRepository } from '@repo/learn-repository.js';

import { createIngredientInstance } from '@domain/learn/ingredient.js';
import { createConsumerGuideInstance } from '@domain/learn/consumer-guide.js';
import { createMythFactInstance } from '@domain/learn/myth-fact.js';
import { createSearchQuery } from '@query/search-query.js';
import { authorize } from '@middleware/auth.js';
import { userQuery } from './user.route.js';

const learnRouter = express.Router();

const searchQuery = createSearchQuery();
const learnSchema = createLearnSchema();
const learnQuery = createLearnQuery(searchQuery);
const learnQueryController = createLearnController({ query: learnQuery });

const ingredientRepository = createLearnRepository(createIngredientInstance);
const ingredientService = createLearnService(ingredientRepository);
const ingredientController = createLearnController({ service: ingredientService });

const consumerGuideRepository = createLearnRepository(createConsumerGuideInstance);
const consumerGuideService = createLearnService(consumerGuideRepository);
const consumerGuideController = createLearnController({ service: consumerGuideService });

const mythFactRepository = createLearnRepository(createMythFactInstance);
const mythFactService = createLearnService(mythFactRepository);
const mythFactController = createLearnController({ service: mythFactService });

const ingredientsCollectionName = 'ingredients_glossary';
const mythFactsCollectionName = 'myth_facts';
const consumerGuideCollectionName = 'consumer_guides';

learnRouter.get(
	'/ingredients',
	authorize('admin', userQuery),
	learnQueryController.getItems(ingredientsCollectionName, 'admin_ingredients_filter')
);

learnRouter.get(
	'/myth-facts',
	authorize('admin', userQuery),
	learnQueryController.getItems(mythFactsCollectionName, 'admin_myth_facts_filter')
);

learnRouter.get(
	'/consumer-guides',
	authorize('admin', userQuery),
	learnQueryController.getItems(
		consumerGuideCollectionName,
		'admin_consumer_guides_filter'
	)
);

learnRouter.put(
	'/ingredients/:id',
	validate(learnSchema.ingredient),
	authorize('admin', userQuery),
	ingredientController.updateItem(ingredientsCollectionName)
);

learnRouter.put(
	'/consumer-guides/:id',
	validate(learnSchema.consumerGuide),
	authorize('admin', userQuery),
	consumerGuideController.updateItem(consumerGuideCollectionName)
);

learnRouter.put(
	'/myth-facts/:id',
	validate(learnSchema.mythFact),
	authorize('admin', userQuery),
	mythFactController.updateItem(mythFactsCollectionName)
);

learnRouter.post(
	'/ingredients',
	validate(learnSchema.ingredient),
	authorize('admin', userQuery),
	ingredientController.addItem(ingredientsCollectionName)
);

learnRouter.post(
	'/consumer-guides',
	validate(learnSchema.consumerGuide),
	authorize('admin', userQuery),
	consumerGuideController.addItem(consumerGuideCollectionName)
);

learnRouter.post(
	'/myth-facts',
	validate(learnSchema.mythFact),
	authorize('admin', userQuery),
	mythFactController.addItem(mythFactsCollectionName)
);

export { learnRouter };
