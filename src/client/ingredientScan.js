import vision from '@google-cloud/vision';
import { onCall } from 'firebase-functions/https';
import { parseIngredients } from './services/gen-ai.js';
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

	return { data: parsedIngredients };
});
