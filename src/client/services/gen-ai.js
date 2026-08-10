import { GoogleGenAI } from '@google/genai';
import z from 'zod';
import Handlebars from 'handlebars';
import { logger } from 'firebase-functions/logger';
import { db } from '@src/admin/config.js';
import { Filter } from 'firebase-admin/firestore';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY_TWO;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const ingredientsOutputSchema = z.array(z.string());

const generateParseInstructions = async (rawOcrText) => {
	let prompt = await getParserPromptFromDB();

	if (prompt === undefined) {
		prompt = getDefaultParserPrompt(rawOcrText);
	}

	return prompt;
};

async function getParserPromptFromDB() {
	const promptsRef = db.collection('prompts');

	const snapshot = await promptsRef
		.where(
			Filter.and(
				Filter.where('promptType', '==', 'ocr_ingredient_parser'),
				Filter.where('status', '==', 'active')
			)
		)
		.get();

	const prompt = snapshot.docs.map((doc) => doc.data())[0];

	return prompt;
}

function getDefaultParserPrompt(rawOcrText) {
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
}

export async function parseIngredients(rawOcrText) {
	try {
		const prompt = await generateParseInstructions(rawOcrText);

		let instructions;
		let model;
		if (prompt?.contentTemplate) {
			const template = Handlebars.compile(prompt.contentTemplate);
			instructions = template({
				rawOcrText
			});

			model = prompt?.model;
			logger.log('template runtime value', instructions);
		} else {
			instructions = prompt;
			model = 'gemini-3.1-flash-lite';
		}

		const response = await ai.models.generateContent({
			model: model,
			contents: instructions,
			config: {
				responseMimeType: 'application/json'
			}
		});

		const result = ingredientsOutputSchema.parse(JSON.parse(response.text));

		return result;
	} catch {
		return null;
	}
}

const getDefaultAnalyzePrompt = (
	userProfile,
	ingredients,
	recommendations,
	contextURLs
) => {
	return `
You are an objective cosmetic data-matching engine. Your task is to categorize a provided list of cosmetic ingredients based strictly on established cosmetic literature (such as the ASEAN Cosmetic Directive, FDA guidelines, and standard comedogenic scales) and cross-reference them with the user's self-reported skin and hair profile. 

CRITICAL RULES:
1. DO NOT act as a dermatologist or a medical professional.
2. DO NOT make medical diagnoses, therapeutic claims, or state that a product is 100% "safe" or "dangerous," as you cannot account for complex chemical interactions or concentrations.
3. Use objective, educational language (e.g., "known in cosmetic literature to...", "has a high rating on the comedogenic scale").
4. Base your analysis strictly on the provided Context URLs and established public cosmetic databases.
5. STRICT COMPLETENESS: You must analyze EVERY SINGLE INGREDIENT provided in the input list. Do not skip, group, or omit any ingredient. The number of items in your JSON output array must exactly match the number of ingredients in the input.
6. Write the description in simple, easy-to-digest language. Always address the user directly as 'you'.
7. When the user doesn't provide self reported skin and hair profile, only use the "restricted" and "base" categorization flags. And do not mention things like "According to your skin or hair profile". Only provide general description.

CATEGORIZATION FLAGS (Assign exactly ONE mutually exclusive flag to EACH ingredient):
- "restricted": Use ONLY if the ingredient is strictly banned or highly restricted by FDA/ACD guidelines (e.g., Hydroquinone, Triclosan).
- "aligned": Use if cosmetic literature explicitly states the ingredient targets or supports the user's specific self-reported concerns (e.g., soothing ingredients for redness-prone skin).
- "attention": Only use this flag if the user has self reported skin and hair profile. Use if the ingredient conflicts with the user's profile based on literature (e.g., highly comedogenic ingredients for acne-prone users, or known drying alcohols for dry skin).
- "base": Use for standard formulation components with no direct conflict or active targeting (e.g., solvents, preservatives, thickeners like Water, Glycerin, Carbomer).
- "suggested": This flag is based on "user's suggested ingredients". Only use this flag on three ingredients with the highest ranking values from "user's suggested ingredients". Only use this flag on ingredients from the "user's suggested ingredients" that has not been flagged with "restricted", "aligned", "attention", or "base". If a suggested ingredient has also appeared as flagged with either "restricted", "aligned", "attention", or "base", then replace the suggested ingredient with the another ingredient from the "user's suggested ingredients" with the highest ranking value. There must be exactly three ingredients with this flag. Do not make any reference or mention the "user's suggested ingredients" list when giving a description of suggested ingredients.

User's Self-Reported Skin Profile:
Post-wash feel: ${userProfile.the_wash_test.post_wash_feel}
Pore Size: ${userProfile.the_wash_test.pore_visibility}
Mid Day Shine: ${userProfile.the_wash_test.mid_day_shine}
Product reactivity: ${userProfile.sensitivity_reactivity.product_reactivity}
Redness prone: ${userProfile.sensitivity_reactivity.redness_prone}
Breakout frequency: ${userProfile.acne_texture.breakout_frequency}
Texture concern: ${userProfile.acne_texture.texture_concern}
Climate reactivity: ${userProfile.environmental_factors.climate_reactivity}

User's Self-Reported Hair Profile:
Hair length: ${userProfile.hair_length_structure.hair_length}
Hair pattern: ${userProfile.hair_classification.hair_pattern}
Hair texture: ${userProfile.hair_classification.hair_texture}
Hair density: ${userProfile.hair_classification.hair_scalp_density}
Water absorption: ${userProfile.hair_porosity.water_absorption}
Drying time: ${userProfile.hair_porosity.air_dry_time}
Scalp condition: ${userProfile.scalp_health.scalp_condition}
Hair concern: ${userProfile.scalp_health.primary_concern}
Wash frequency: ${userProfile.hair_care_routine.wash_frequency}
Chemical history: ${userProfile.hair_care_routine.chemical_treatments.join(', ')}
Product knowledge: ${userProfile.hair_care_routine.product_knowledge}

User's suggested ingredients to analyze:
${recommendations.map((item) => `(ingredient: ${item.ingredient} ranking: ${item.ranking})`)}

Ingredients to analyze:
${ingredients.join(', ')}

Context URLs:
${contextURLs.join('\n')}

OUTPUT FORMAT:
You must output ONLY a valid JSON array of objects. Do not include markdown formatting, introductions, or conversational text.


Your output must perfectly match this exact schema:
	{
  		 [
    		{
      			"ingredient": "Ingredient Name 1",
      			"flag": "restricted" | "aligned" | "attention" | "base" | "suggested",
      			"description": "Brief, objective reasoning based on cosmetic literature and the user profile."
   			},

			{
      			"ingredient": "Ingredient Name 2",
      			"flag": "restricted" | "aligned" | "attention" | "base" | "suggested",
      			"description": "Brief, objective reasoning based on cosmetic literature and the user profile."
   			}
  		]
	}
    `;
};

const analysisContextURLs = [
	'https://www.jessicaelizabethskincare.com/wp-content/uploads/2023/01/Pore-Clogging-Ingredients-.pdf',
	'https://www.personalcarecouncil.org/wp-content/uploads/2023/03/INCI-Nomenclature-Conventions-and-Reference-Information-2023.pdf',
	'https://asean.org/wp-content/uploads/2023/08/Annex-II-Release_5-Jun-2023.pdf',
	'https://www.aseancosmetics.org/docdocs/technical.pdf',
	'https://int.eucerin.com/about-skin/basic-skin-knowledge/skin-types',
	'https://www.medicalnewstoday.com/articles/hair-types#hair-types',
	'https://pmc.ncbi.nlm.nih.gov/articles/PMC6560912/pdf/12915_2019_Article_660.pdf',
	'https://health.clevelandclinic.org/skin-care-ingredients-explained',
	'https://www.researchgate.net/publication/334857152_Impact_of_Selected_Cosmetic_Ingredients_on_Common_Microorganisms_of_Healthy_Human_Skin/fulltext/5d439a27299bf1995b5e6729/Impact-of-Selected-Cosmetic-Ingredients-on-Common-Microorganisms-of-Healthy-Human-Skin.pdf?_tp=eyJjb250ZXh0Ijp7ImZpcnN0UGFnZSI6InB1YmxpY2F0aW9uIiwicGFnZSI6InB1YmxpY2F0aW9uIn19',
	'https://www.clinikally.com/blogs/news/harmful-hair-care-ingredients-to-avoid',
	'https://dela.pl/a-guide-to-active-ingredients-in-cosmetics-understand-and-use-to-your-advantage/'
];

const generateAnalyzeInstruction = async (userProfile, ingredients, recommendations) => {
	let prompt = await getAnalysisPromptFromDB();

	if (prompt === undefined) {
		prompt = getDefaultAnalyzePrompt(
			userProfile,
			ingredients,
			recommendations,
			analysisContextURLs
		);
	}

	return prompt;
};

const getAnalysisPromptFromDB = async () => {
	const promptsRef = db.collection('prompts');

	const snapshot = await promptsRef
		.where(
			Filter.and(
				Filter.where('promptType', '==', 'ingredient_analysis'),
				Filter.where('status', '==', 'active')
			)
		)
		.get();

	const prompt = snapshot.docs.map((doc) => doc.data())[0];

	return prompt;
};

const flaggedIngredientSchema = z.object({
	flag: z.enum(['restricted', 'aligned', 'attention', 'base', 'suggested']),
	ingredient: z.string(),
	description: z.string()
});

const analysisSchema = z.array(flaggedIngredientSchema);

export async function analyzeIngredients(userProfile, ingredients, recommendations) {
	const prompt = await generateAnalyzeInstruction(
		userProfile,
		ingredients,
		recommendations
	);

	let instructions;
	let model;

	if (prompt?.contentTemplate) {
		const template = Handlebars.compile(prompt.contentTemplate);
		instructions = template({
			profiling: {
				...userProfile,
				hair_care_routine: {
					...userProfile.hair_care_routine,
					chemical_treatments:
						userProfile.hair_care_routine.chemical_treatments.join(', ')
				}
			},
			user_recommended_ingredients: recommendations.map(
				(item) => `(ingredient: ${item.ingredient} ranking: ${item.ranking})`
			),
			ingredients: ingredients.join(', '),
			context_url: prompt.contextUrls.join('\n')
		});

		model = prompt?.model;
		logger.log('template runtime value', instructions);
	} else {
		instructions = prompt;
		model = 'gemini-3.1-flash-lite';
	}

	const response = await ai.models.generateContent({
		model: model,
		contents: instructions,
		config: {
			responseMimeType: 'application/json'
		}
	});

	const parsedOutput = JSON.parse(response.text);

	logger.log('ingredients scanned', ingredients);
	logger.log('parsed output', response.text);
	return analysisSchema.parse(parsedOutput);
}
