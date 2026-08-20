import { onCall } from 'firebase-functions/https';
import { analyzeIngredients } from './services/gen-ai.js';
import { db } from '@src/admin/config.js';
import { generateRecommendations } from './utility/recommendations.js';
import { errorHandler } from './utility/error.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { logger } from 'firebase-functions/logger';

export const ingredientAnalysisController = onCall(
	{ cpu: 2, region: 'asia-southeast1' },
	errorHandler(async (req, _) => {
		const { ingredients, product, clientTimeZone } = req.data;
		const userId = req.auth?.uid ?? null;

		logger.log('req params', req);

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

		const userRecommendation = await generateRecommendations(userProfile);

		recommendations = userRecommendation;

		logger.log(
			'recommendations',
			recommendations.map(
				(item) => `(ingredient: ${item.ingredient} ranking: ${item.ranking})`
			)
		);
	} else {
		recommendations = [];
		userProfile = emptyProfile;
	}

	logger.log('recommendations', recommendations);
	const results = await analyzeIngredients(userProfile, ingredients, recommendations);

	const date = new Date();
	const formattedAnalysisCheckDate = format(date, 'p', {
		in: tz(clientTimeZone)
	});

	if (userId) {
		const alignedIngredients = results
			.filter(({ flag }) => flag === 'aligned')
			.map(({ ingredient, description }) => ({ ingredient, description }));
		const restrictedIngredients = results
			.filter(({ flag }) => flag === 'restricted')
			.map(({ ingredient, description }) => ({ ingredient, description }));

		const { aligned, restricted } = await updateUserAlignAndRestrictedIngredient(
			userId,
			alignedIngredients,
			restrictedIngredients
		);

		await saveToDB(
			userId,
			{
				ingredients: [...results],
				analysis_check_date: formattedAnalysisCheckDate,
				product: { ...product }
			},
			{
				alignedIngredients: aligned,
				restrictedIngredients: restricted
			}
		);
	}

	return { results };
};

async function updateUserAlignAndRestrictedIngredient(
	uid,
	alignedIngredients,
	restrictedIngredients
) {
	let aligned = [],
		restricted = [];
	const userDoc = await db.collection('users').doc(uid).get();

	const previousAligned = userDoc.data()?.alignedIngredients ?? [];
	const previousRestricted = userDoc.data()?.restrictedIngredients ?? [];

	if (previousAligned?.length > 0) {
		aligned = [...alignedIngredients, ...previousAligned];
		aligned = [...new Map(aligned.map((item) => [item.ingredient, item])).values()];
	} else {
		aligned = [...alignedIngredients];
	}

	if (previousRestricted?.length > 0) {
		restricted = [...restrictedIngredients, ...previousRestricted];
		restricted = [...new Map(restricted.map((item) => [item.ingredient, item])).values()];
	} else {
		restricted = [...restrictedIngredients];
	}

	return {
		aligned,
		restricted
	};
}
async function saveToDB(uid, data, { alignedIngredients, restrictedIngredients }) {
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
			alignedIngredients,
			restrictedIngredients
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
