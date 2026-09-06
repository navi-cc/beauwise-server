import vision from '@google-cloud/vision';
import { HttpsError, onCall } from 'firebase-functions/https';
import { parseIngredients } from './services/gen-ai.js';
import { performMultiSearch } from './services/typesense-search.js';
import { logger } from 'firebase-functions/logger';
const visionClient = new vision.ImageAnnotatorClient({
	projectId: 'beauwise-1687a'
});

export const ingredientScan = onCall({ region: 'asia-southeast1' }, async (req, _) => {
	logger.info('ingredient scan request data', req.data);
	const image = req.data.imageBase64;

	if (image === undefined || !image) {
		throw new HttpsError('data-loss', 'Invalid Input. Please try again');
	}

	const request = {
		image: {
			content: image
		},
		features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
	};
	const [result] = await visionClient.annotateImage(request);

	if (!result.fullTextAnnotation) {
		throw new HttpsError('cancelled', 'No text detected. Please try again');
	}

	let parsedIngredients = await parseIngredients(result.fullTextAnnotation.text);

	if (parsedIngredients?.length <= 0) {
		throw new HttpsError('cancelled', 'No ingredients detected. Please try again');
	}

	const searches = parsedIngredients.map((ingredient) => ({
		collection: 'ingredients',
		q: ingredient,
		query_by: 'name',
		num_typos: 2,
		filter_by: 'is_deleted:=false',
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
