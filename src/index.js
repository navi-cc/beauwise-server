import { setGlobalOptions } from 'firebase-functions/v2';
setGlobalOptions({ region: 'asia-east2' });

import { onRequest } from 'firebase-functions/https';
import { app } from './admin/app.js';
import { typesenseTriggers } from './admin/firebase/triggers/typesense.js';

import { fdaVerification } from './client/fdaVerification.js';
import { ingredientScan } from './client/ingredientScan.js';
import { searchEngine } from './client/searchEngine.js';
import { batchCode } from './client/batchCode.js';
import {
	changeUserPassword,
	checkIfUserAlreadyExist,
	passwordReset,
	sendEmailVerificationCode,
	verifyEmail,
	verifyPasswordReset,
	requestAccountDeletion,
	cancelAccountDeletion,
	changeUserEmail,
	secureLogin
} from './client/auth.js';
import { ingredientAnalysisController } from './client/ingredientAnalysis.js';
import { beforeCreated, processAccountDeletions } from './client/triggers/auth.js';
import { storageTriggers } from './admin/firebase/triggers/storage.js';
import { cleanupExpiredTopics } from './admin/firebase/scheduled/deletions.js';

export const client = {
	fdaVerification,
	ingredientScan,
	searchEngine,
	batchCode,
	ingredientAnalysisController,
	auth: {
		triggers: {
			processAccountDeletions,
			beforeCreated
		},
		secureLogin,
		sendEmailVerificationCode,
		verifyEmail,
		checkIfUserAlreadyExist,
		passwordReset,
		verifyPasswordReset,
		changeUserPassword,
		changeUserEmail,
		requestAccountDeletion,
		cancelAccountDeletion
	}
};

export const admin = onRequest({ cors: true }, app);
export const adminTriggers = {
	typesense: {
		...typesenseTriggers
	},

	cleanupExpiredTopics,

	storage: {
		...storageTriggers
	}
};
