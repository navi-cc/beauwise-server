import { onCall } from 'firebase-functions/https';
import { logger } from 'firebase-functions/logger';
import { analyzeIngredients } from './services/gen-ai.js';
import { db } from '@src/admin/config.js';
import { generateRecommendations } from './utility/recommendations.js';
import { errorHandler } from './utility/error.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';

export const ingredientAnalysisController = onCall(
	errorHandler(async (req, _) => {
		const { ingredients, product, clientTimeZone } = req.data;
		const userId = req.auth?.uid ?? null;

		const { results } = await ingredientAnalysis(
			ingredients,
			product,
			userId,
			clientTimeZone
		);

		return { results };
	})
);

export const ingredientAnalysis = async (
	ingredients,
	product,
	userId,
	clientTimeZone
) => {
	let recommendations;
	let userProfile;

	if (userId) {
		const userProfileResponse = await db.collection('users').doc(userId).get();
		userProfile = userProfileResponse.data().profiling;

		const userRecommendation = (await generateRecommendations(userProfile))

		recommendations = userRecommendation;
        logger.log("THE RECOMMENDATIONS: " + recommendations);
	} else {
		recommendations = [];
		userProfile = emptyProfile;
	}

	const results = await analyzeIngredients(userProfile, ingredients, recommendations);

	const date = new Date();
	const formattedAnalysisCheckDate = format(date, 'p', {
		in: tz(clientTimeZone)
	});

	const alignedIngredients = results.filter(({ flag }) => flag === 'aligned');
	const restrictedIngredients = results.filter(({ flag }) => flag === 'restricted');

	if (userId) {
		await saveToDB(
			userId,
			{
				ingredients: [...results],
				analysis_check_date: formattedAnalysisCheckDate,
				product: { ...product }
			},
			{
				numberOfAligned: alignedIngredients.length,
				numberOfRestricted: restrictedIngredients.length
			}
		);
	}

	return { results };
};

async function saveToDB(uid, data, { numberOfAligned, numberOfRestricted }) {
	const collectionReference = db.collection('users');
	const subCollectionReference = collectionReference
		.doc(uid)
		.collection('analysis_history');

	await subCollectionReference.add({
		...data,
		createdAt: Timestamp.now()
	});

	await collectionReference.doc(uid).set(
		{
			total_analysis: FieldValue.increment(1),
			total_aligned_ingredients: FieldValue.increment(numberOfAligned),
			total_restricted_ingredients: FieldValue.increment(numberOfRestricted)
		},
		{ merge: true }
	);
}

const emptyProfile = {
	the_wash_test: {
		post_wash_feel: '',
		pore_size: '',
		mid_day_shine: ''
	},

	sensitivity_reactivity: {
		product_reactivity: '',
		redness_prone: ''
	},

	acne_texture: {
		breakout_frequency: '',
		texture_concern: []
	},

	environmental_factors: {
		climate_reactivity: ''
	},

	hair_length_structure: {
		hair_length: ''
	},

	hair_classification: {
		hair_pattern: '',
		hair_texture: '',
		hair_scalp_density: ''
	},

	hair_porosity: {
		water_absorption: '',
		air_dry_time: ''
	},

	scalp_health: {
		scalp_condition: [],
		primary_concern: []
	},

	hair_care_routine: {
		wash_frequency: '',
		chemical_treatments: [],
		product_knowledge: ''
	}
};
