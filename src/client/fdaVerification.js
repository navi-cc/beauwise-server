import { db } from '@src/admin/config.js';
import { onCall } from 'firebase-functions/https';

export const fdaVerification = onCall(async (req, _) => {
	let { query } = req.query;

	if (!query.trim().length) {
		return {
			success: false,
			error: 'Provide product name or notification number'
		};
	}

	if (query[0].toLowerCase().startsWith('n')) {
		query = query.trim().toUpperCase();
	} else {
		query = query.trim();
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 30000);

	const url = new URL('https://verification.fda.gov.ph/api/search');
	url.searchParams.append('q', query);

	let data, status;
	try {
		const response = await fetch(url, {
			signal: controller.signal,
			method: 'GET',
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
				Accept: 'application/json, text/plain, */*',
				'Accept-Language': 'en-US,en;q=0.9',
				Origin: 'https://verification.fda.gov.ph',
				Referer: 'https://verification.fda.gov.ph/',
				Connection: 'keep-alive'
			}
		});

		const result = await response.json();

		if (result.error) {
			throw new Error('FDA_SERVER_ERROR');
		}

		if (result.cosmetic_NN?.length > 0) {
			data = result.cosmetic_NN[0];
		} else if (result.cdrr?.length > 0) {
			data = result.cdrr[0];
		} else if (result.fdafoodproducts?.length > 0) {
			data = result.fdafoodproducts[0];
		}

		status = {
			code: 200,
			text: 'OK'
		};

		saveToDB(data);
	} catch (error) {
		status = {
			code: 500,
			text: 'Something went wrong. Please try again later.'
		};

		if (error.message === 'FDA_SERVER_ERROR') {
			status = {
				code: 500,
				text: 'FDA servers are unavailable. Please try again later.'
			};
		}
	} finally {
		clearTimeout(timeoutId);
	}

	return {
		data,
		status
	};
});

function saveToDB(data) {
	const collectionReference = db.collection('fda_verifications_dev');
	const documentId = data.PRODUCT_NAME.split(' ').join('_').toLowerCase();

	collectionReference.doc(documentId).create(data);
}
