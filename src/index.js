import { onRequest } from 'firebase-functions/https';
import { app } from './admin/app.js';
import { fdaVerification } from './client/fdaVerification.js';
import { ingredientScan } from './client/ingredientScan.js';
import { searchEngine } from './client/searchEngine.js';

export const client = {
	fdaVerification,
	ingredientScan,
	searchEngine
};

export const admin = onRequest({ cors: true }, app);
