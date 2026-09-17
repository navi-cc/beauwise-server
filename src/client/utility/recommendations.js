import { db } from '@src/admin/config.js';

const generateProfileTagWeights = (userProfile) => {
	let profileWeights = {};
	let userProfileTags = [];
	for (const section in userProfile) {
		if (section === 'about_you') {
			continue;
		}
		for (const question in userProfile[section]) {
			if (
				Array.isArray(userProfile[section][question]) &&
				userProfile[section][question].length < 1
			) {
				continue;
			}
			if (question === 'chemical_treatments') {
				for (const items of userProfile[section][question]) {
					userProfileTags = userProfileTags.concat(profileTags[section][question][items]);
				}
			} else {
				const answer = userProfile[section][question];
				userProfileTags = userProfileTags.concat(profileTags[section][question][answer]);
			}
		}
	}

	for (const tag of userProfileTags) {
		if (tag === 'Exfoliant') {
			const removeIndex = userProfileTags.indexOf(tag);
			if (removeIndex > -1) {
				userProfileTags = userProfileTags.splice(removeIndex, 1);
			}
			userProfileTags = userProfileTags.concat(exfoliantNames);
		}
		if (tag === 'Emollient') {
			const removeIndex = userProfileTags.indexOf(tag);
			if (removeIndex > -1) {
				userProfileTags = userProfileTags.splice(removeIndex, 1);
			}
			userProfileTags = userProfileTags.concat(emollientNames);
		}
		if (tag === 'Emulsifier') {
			const removeIndex = userProfileTags.indexOf(tag);
			if (removeIndex > -1) {
				userProfileTags = userProfileTags.splice(removeIndex, 1);
			}
			userProfileTags = userProfileTags.concat(emulsifierNames);
		}
		if (tag === 'Skin Lightening') {
			const removeIndex = userProfileTags.indexOf(tag);
			if (removeIndex > -1) {
				userProfileTags = userProfileTags.splice(removeIndex, 1);
			}
			userProfileTags = userProfileTags.concat(skinLighteningNames);
		}
		if (tag === 'Moisturizer') {
			const removeIndex = userProfileTags.indexOf(tag);
			if (removeIndex > -1) {
				userProfileTags = userProfileTags.splice(removeIndex, 1);
			}
			userProfileTags = userProfileTags.concat(moisturizerNames);
		}
		if (tag === 'Retinoid') {
			const removeIndex = userProfileTags.indexOf(tag);
			if (removeIndex > -1) {
				userProfileTags = userProfileTags.splice(removeIndex, 1);
			}
			userProfileTags = userProfileTags.concat(retinoidNames);
		}
		if (tag === 'Skin Restoring') {
			const removeIndex = userProfileTags.indexOf(tag);
			if (removeIndex > -1) {
				userProfileTags = userProfileTags.splice(removeIndex, 1);
			}
			userProfileTags = userProfileTags.concat(skinRestoringNames);
		}
	}

	for (const tag of userProfileTags) {
		if (profileWeights[tag]) {
			profileWeights[tag] += 1;
		} else {
			profileWeights[tag] = 1;
		}
	}

	return profileWeights;
};

export const generateRecommendations = async (userProfile) => {
	const profileWeights = generateProfileTagWeights(userProfile);
	let rankedIngredients = [];

	//TODO: convert to fetch ingredients in a seperate function
	const ingredientsCollectionName = 'ingredients_glossary';

	const collectionReference = db.collection(ingredientsCollectionName);

	const collectionSnapshot = await collectionReference.get();

	collectionSnapshot.forEach((doc) => {
		let ranking = 0;
		if (doc.data().name === 'Chemical X') {
			return; //NOTE: Skip chemical X from recommendations, its in DB
		}

		if (doc.data().name === 'Tretinoin') {
			return;
		}

		for (const category of doc.data().categories) {
			if (profileWeights[category]) {
				ranking += profileWeights[category];
			}
		}
		const rankedIngredient = {
			ingredient: doc.data().name,
			ranking: ranking
		};
		rankedIngredients = [...rankedIngredients, rankedIngredient];
	});

	rankedIngredients.sort((a, b) => {
		if (a.ranking < b.ranking) return 1;
		if (a.ranking > b.ranking) return -1;
		return 0;
	});

	return rankedIngredients;
};

//NOTE: Name is Exfoliant
const exfoliantNames = [
	'Chemical Exfoliant (AHA)',
	'Alpha-Hydroxy Acid (AHA)',
	'Hydroxy Acid',
	'Exfoliating',
	'Exfoliant',
	'Chemical Peeling Agent',
	'Polyhydroxy Acid (PHA)'
];

//NOTE: Occulusive) seems to be cut off in the database for propylene-glycol
//NOTE: Name is Emollient
const emollientNames = [
	'Emollient',
	'Skin-Conditioning Agent (Emollient)',
	'Skin-Conditioning Agent',
	'Conditioning Agent',
	'Skin-Conditioning Agent (Emollient',
	'Occlusive)'
];

//NOTE: Name is Emulsifier
const emulsifierNames = ['Emulsifying Agent', 'Emulsifier'];

//NOTE: Name is Skin Lightening
const skinLighteningNames = [
	'Depigmenting',
	'Skin Lightening Agent',
	'Prescription Skin Lightening',
	'Skin Lightener'
];

//NOTE: Name is Moisturizer
const moisturizerNames = [
	'Moisturizing',
	'Moisturizer',
	'Moisturizing Agent',
	'Moisturizer Component'
];

//NOTE: Name is Retinoid
const retinoidNames = [
	'Retinoid',
	'Retinoid Derivative',
	'First-Generation Retinoid',
	'Over-the-Counter Retinoid'
];

//NOTE: Name is Skin Restoring
const skinRestoringNames = ['Skin Restoring', 'Skin Rejuvenating', 'Skin-Replenishing'];

const profileTags = {
	the_wash_test: {
		post_wash_feel: {
			tight_and_dry: [
				'Anti-Aging',
				'Antioxidant',
				'Exfoliant',
				'Emollient',
				'Film Former',
				'Humectant',
				'Keratolytic',
				'Liquid Wax',
				'Moisturizer',
				'Retinoid',
				'Skin Protectant',
				'Skin Restoring'
			],
			comfortable: [],
			oily_in_spots: ['Absorbent'],
			greasy: ['Absorbent', 'Absorbent']
		},
		pore_size: {
			invisible_very_small: [],
			visible_in_t_zone: ['Absorbent'],
			large_visible_everywhere: ['Absorbent', 'Absorbent'],
			normal: []
		},
		mid_day_shine: {
			flaky_dull: [
				'Anti-Aging',
				'Antioxidant',
				'Exfoliant',
				'Emollient',
				'Film Former',
				'Keratolytic',
				'Retinoid'
			],
			radiant_normal: [],
			shiny_t_zone: ['Absorbent'],
			very_shiny: ['Absorbent', 'Absorbent']
		}
	},
	sensitivity_reactivity: {
		product_reactivity: {
			never: [],
			rarely: [
				'Anti-inflammatory',
				'Fixed Oil',
				'Fatty Acid',
				'Healing Agent',
				'Liquid Wax',
				'Skin Protectant',
				'Surfactant',
				'Topical Corticosteroid',
				'Wound Healing'
			],
			sometimes: [
				'Anti-inflammatory',
				'Anti-inflammatory',
				'Fixed Oil',
				'Fixed Oil',
				'Fatty Acid',
				'Fatty Acid',
				'Healing Agent',
				'Healing Agent',
				'Liquid Wax',
				'Liquid Wax',
				'Skin Protectant',
				'Skin Protectant',
				'Surfactant',
				'Surfactant',
				'Topical Corticosteroid',
				'Topical Corticosteroid',
				'Wound Healing',
				'Wound Healing'
			],
			frequently: [
				'Anti-inflammatory',
				'Anti-inflammatory',
				'Anti-inflammatory',
				'Fixed Oil',
				'Fixed Oil',
				'Fixed Oil',
				'Fatty Acid',
				'Fatty Acid',
				'Fatty Acid',
				'Healing Agent',
				'Healing Agent',
				'Healing Agent',
				'Liquid Wax',
				'Liquid Wax',
				'Liquid Wax',
				'Surfactant',
				'Surfactant',
				'Surfactant',
				'Topical Corticosteroid',
				'Topical Corticosteroid',
				'Topical Corticosteroid',
				'Wound Healing',
				'Wound Healing',
				'Wound Healing'
			]
		},
		redness_prone: {
			no_never: [],
			occasionally: [
				'Anti-inflammatory',
				'Fixed Oil',
				'Fatty Acid',
				'Healing Agent',
				'Liquid Wax',
				'Topical Corticosteroid',
				'Wound Healing'
			],
			yes_very_easily: [
				'Anti-inflammatory',
				'Anti-inflammatory',
				'Fixed Oil',
				'Fixed Oil',
				'Fatty Acid',
				'Fatty Acid',
				'Healing Agent',
				'Healing Agent',
				'Liquid Wax',
				'Liquid Wax',
				'Topical Corticosteroid',
				'Topical Corticosteroid',
				'Wound Healing',
				'Wound Healing'
			]
		}
	},
	acne_texture: {
		breakout_frequency: {
			never_very_rarely: [],
			monthly: [
				'Antimicrobial',
				'Bactericidal',
				'Antiacne Agent',
				'Fixed Oil',
				'Liquid Wax',
				'Retinoid'
			],
			frequently: [
				'Antimicrobial',
				'Antimicrobial',
				'Bactericidal',
				'Bactericidal',
				'Antiacne Agent',
				'Antiacne Agent',
				'Fixed Oil',
				'Fixed Oil',
				'Liquid Wax',
				'Liquid Wax',
				'Retinoid',
				'Retinoid'
			],
			constantly: [
				'Antimicrobial',
				'Antimicrobial',
				'Antimicrobial',
				'Bactericidal',
				'Bactericidal',
				'Bactericidal',
				'Antiacne Agent',
				'Antiacne Agent',
				'Antiacne Agent',
				'Fixed Oil',
				'Fixed Oil',
				'Fixed Oil',
				'Liquid Wax',
				'Liquid Wax',
				'Liquid Wax',
				'Retinoid',
				'Retinoid',
				'Retinoid'
			]
		},
		texture_concern: {
			rough_flaky_patches: [
				'Anti-Aging',
				'Antioxidant',
				'Exfoliant',
				'Emollient',
				'Film Former',
				'Keratolytic',
				'Retinoid',
				'Skin Protectant',
				'Skin Restoring'
			],
			blackheads_whiteheads: ['Antimicrobial', 'Bactericidal', 'Exfoliant', 'Fixed Oil'],
			redness_inflammation: [
				'Anti-inflammatory',
				'Fixed Oil',
				'Fatty Acid',
				'Healing Agent',
				'Liquid Wax',
				'Topical Corticosteroid',
				'Wound Healing'
			],
			none_smooth_texture: []
		}
	},
	environmental_factors: {
		climate_reactivity: {
			feels_the_same: [],
			little_drier: [
				'Anti-Aging',
				'Antioxidant',
				'Emollient',
				'Film Former',
				'Humectant',
				'Keratolytic',
				'Liquid Wax',
				'Moisturizer',
				'Retinoid',
				'Skin Protectant',
				'Skin Restoring'
			],
			painfully_dry: [
				'Anti-Aging',
				'Anti-Aging',
				'Antioxidant',
				'Antioxidant',
				'Emollient',
				'Emollient',
				'Film Former',
				'Film Former',
				'Humectant',
				'Humectant',
				'Keratolytic',
				'Keratolytic',
				'Liquid Wax',
				'Liquid Wax',
				'Moisturizer',
				'Moisturizer',
				'Retinoid',
				'Retinoid',
				'Skin Protectant',
				'Skin Protectant',
				'Skin Restoring',
				'Skin Restoring'
			],
			gets_oilier: ['Absorbent']
		}
	},
	hair_length_structure: {
		hair_length: {
			buzz_cut_very_short: [],
			short_ear_length: [],
			medium_shoulder_length: [],
			long_below_shoulders: [],
			very_long_mid_back: []
		}
	},
	hair_classification: {
		hair_pattern: {
			type_one_straight: [],
			type_two_wavy: [],
			type_three_curly: [],
			type_four_coily_kinky: []
		},
		hair_texture: {
			fine: [],
			medium: [],
			coarse: []
		},
		hair_scalp_density: {
			high: [],
			medium: [],
			low: []
		}
	},
	hair_porosity: {
		water_absorption: {
			low_porosity: [],
			normal_porosity: [],
			high_porosity: []
		},
		air_dry_time: {
			very_fast: [],
			average: [],
			slow: [],
			very_slow: []
		}
	},
	scalp_health: {
		scalp_condition: {
			oily: ['Absorbent'],
			normal: [],
			dry: [
				'Antioxidant',
				'Emollient',
				'Film Former',
				'Humectant',
				'Keratolytic',
				'Liquid Wax',
				'Moisturizer',
				'Retinoid',
				'Skin Protectant',
				'Skin Restoring'
			],
			sensitive: [
				'Anti-inflammatory',
				'Fixed Oil',
				'Fatty Acid',
				'Healing Agent',
				'Liquid Wax',
				'Surfactant',
				'Topical Corticosteroid'
			],
			dandruff_prone: ['Fixed Oil', 'Keratolytic']
		},
		primary_concern: {
			hair_fall_thinning: [],
			dryness_damage_split_ends: [
				'Cationic Surfactant',
				'Emollient',
				'Film Former',
				'Hair Conditioning Agent',
				'Retinoid',
				'Skin Protectant',
				'Skin Restoring',
				'Surfactant'
			],
			frizz_control: ['Cationic Surfactant', 'Hair Conditioning Agent', 'Surfactant'],
			oily_scalp_greasiness: ['Absorbent', 'Absorbent'],
			lack_of_volume: ['Fixed Oil'],
			none_satisfied: []
		}
	},
	hair_care_routine: {
		wash_frequency: {
			daily: [],
			every_other_day: [],
			twice_a_week: [],
			once_a_week: [],
			less_than_once_a_week: []
		},
		chemical_treatments: {
			coloring_bleaching: [],
			rebonding_straightening: [],
			perming: [],
			keratin_treatment: [],
			none_virgin_hair: []
		},
		product_knowledge: {
			'1_not_knowledgeable': [],
			'2_slightly_knowledgeable': [],
			'3_moderately_knowledgeable': [],
			'4_very_knowledgeable': [],
			'5_expert': []
		}
	}
};
