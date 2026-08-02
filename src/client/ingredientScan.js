import vision from '@google-cloud/vision';
import { onCall } from 'firebase-functions/https';
import { parseIngredients } from './services/gen-ai.js';
import { performMultiSearch } from './services/typesense-search.js';
import { logger } from 'firebase-functions/logger';
const visionClient = new vision.ImageAnnotatorClient({
	projectId: 'beauwise-1687a'
});

export const ingredientScan = onCall(async (req, _) => {
	const image = req.data.imageBase64;

	const request = {
		image: {
			content: image
		},
		features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
	};
	const [result] = await visionClient.annotateImage(request);

	if (!result.fullTextAnnotation) {
		return [];
	}

	let parsedIngredients = await parseIngredients(result.fullTextAnnotation.text);

	const searches = parsedIngredients.map((ingredient) => ({
		collection: 'ingredients',
		q: ingredient,
		query_by: 'name',
		num_typos: 2,
		prioritize_exact_match: true,
		drop_tokens_threshold: 0,
		exhaust_max_matched_tokens: true
	}));

	const { results } = await performMultiSearch(searches);

	parsedIngredients = results
		.map((searchResult) => {
			if (searchResult.hits && searchResult.hits.length > 0) {
				const topHit = searchResult.hits[0];

				const ingredient = { name: topHit.document.name, id: topHit.document.id };

				return ingredient;
			}
		})
		.filter((item) => item !== undefined);

	return { data: parsedIngredients };
});
