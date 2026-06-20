import { GoogleGenAI } from '@google/genai';
import z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const ingredientsOutputSchema = z.array(z.string());

const generateInstructions = (rawOcrText) => {
	const prompt = `
You are an expert data extraction assistant specializing in cosmetic formulation. Your task is to extract only the cosmetic ingredients from the raw, messy OCR text provided by the user.

RULES:
1. Extract ONLY ingredients. Completely ignore marketing copy, product descriptions, instructions, warnings, company names, and batch numbers.
2. Separate individual ingredients. If the text says "Water, Glycerin", treat them as two separate items.
3. Handle INCI Aliases/Translations: If an ingredient lists a scientific/Latin name alongside a common name separated by slashes or parentheses (e.g., "AQUA / WATER", "WATER (AQUA)", or "BUTYROSPERMUM PARKII (SHEA) BUTTER"), extract ONLY the common English name (e.g., "WATER", "SHEA BUTTER"). 
4. Preserve Complex Chemicals: Do NOT split distinct chemical compounds that naturally contain slashes (e.g., keep "CAPRYLIC/CAPRIC TRIGLYCERIDE" intact).
5. Keep spelling exactly as it appears in the OCR, even with minor typos (e.g., "Ceteryl" instead of "Cetearyl"). The downstream search engine will handle typo correction.
6. Strip out prefixes/suffixes like "Active ingredients:", "Contains:", or "10%".
7. Capitalize each ingredien (e.g., Phosphate, Ceteryl Alcohol).
8. If absolutely no ingredients are found in the text, return an empty array: []

OUTPUT FORMAT:
You must output ONLY a valid JSON array of strings. Do not include markdown formatting, introductions, or conversational text.

EXAMPLE INPUT:
"NEW SAMPLE DESCRIPTION ascorbyl liquid. Apply to face daily. Ingredients: AQUA / WATER, Magnesiym Ascorbyl Phosphate, Ceteryl Alcohol, TOCOPHEROL (VITAMIN E), Fragrance. Keep away from eyes."

EXAMPLE OUTPUT:
["Water", "Magnesiym Ascorbyl Phosphate", "Ceteryl Alcohol", "Vitamin E", "Fragrance"]


USER PROVIDED FULL OCR RAW TEXT:  
${rawOcrText}
`;

	return prompt;
};

export async function parseIngredients(rawOcrText) {
	const instructions = generateInstructions(rawOcrText);

	try {
		const response = await ai.models.generateContent({
			model: 'gemini-3.5-flash',
			contents: instructions,
			config: {
				responseMimeType: 'application/json',
				responseJsonSchema: zodToJsonSchema(ingredientsOutputSchema)
			}
		});

		const result = ingredientsOutputSchema.parse(JSON.parse(response.text));

		return result;
	} catch {
		return null;
	}
}
