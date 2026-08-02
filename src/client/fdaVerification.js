import { db } from '@src/admin/config.js';
import { HttpsError, onCall } from 'firebase-functions/https';
import { format, isAfter, parse } from 'date-fns';
import { tz } from '@date-fns/tz';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/logger';
export const fdaVerification = onCall({ region: 'asia-southeast1' }, async (req, _) => {
	let { query, clientTimeZone } = req.data;

	query = query.product?.trim() ?? query.notificationNumber?.trim();

	const url = new URL('https://verification.fda.gov.ph/api/search');
	url.searchParams.append('q', query);

	const todayDate = new Date();
	let formattedVerificationDate = format(todayDate, "MMMM d',' yyyy 'at' p", {
		in: tz(clientTimeZone)
	});

	let data = null,
		status;

	try {
		const response = await fetch(url, {
			signal: AbortSignal.timeout(30000),
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

		logger.info('response', response);
		logger.log('result', result);

		if (result.error) {
			throw new Error('FDA_SERVER_ERROR');
		}

		if (
			result.cosmetic_NN?.length <= 0 &&
			result.cdrr?.length <= 0 &&
			result.fdafoodproducts?.length <= 0
		) {
			throw new Error('NO_RECORD_FOUND');
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

		const productValidityDate = parse(
			data.NOTIFICATION_VALIDITY,
			'dd MMMM yyyy',
			new Date()
		);

		const isExpired = isAfter(todayDate, productValidityDate);
		const formattedProduct = data.PRODUCT_NAME.split(' ')
			.map((str) => {
				str = str.toLowerCase();

				return str !== 'and' ? str[0].toUpperCase() + str.slice(1) : str;
			})
			.join(' ');

		const formattedProductValidityDate = format(productValidityDate, "MMMM d',' yyyy");

		data = {
			product: formattedProduct,
			company: data.COMPANY_NAME,
			notification_number: data.ACCOUNTCODE,
			is_expired: isExpired,
			product_validity_date: formattedProductValidityDate,
			verification_check_date: formattedVerificationDate
		};
	} catch (error) {
		logger.log(error);

		status = {
			code: 500,
			text: 'Something went wrong. Please try again later.'
		};

		if (error.name === 'TimeoutError') {
			throw new HttpsError('aborted', 'Things are running a bit slow. Please try again');
		}

		if (error.message === 'NO_RECORD_FOUND') {
			status = {
				code: 200,
				text: 'the request went through, but no record was found.'
			};

			data = {
				name: query,
				verification_check_date: formattedVerificationDate,
				is_invalid: true
			};
		}

		if (error.message === 'FDA_SERVER_ERROR') {
			status = {
				code: 500,
				text: 'FDA servers are unavailable. Please try again later.'
			};
		}
	}

	if (req.auth && data !== null) {
		await saveToDB(req.auth.uid, data);
	}

	return {
		data,
		status
	};
});

async function saveToDB(uid, data) {
	const collectionReference = db.collection('users');
	const subCollectionReference = collectionReference.doc(uid).collection('fda_history');

	await subCollectionReference.add({
		...data,
		createdAt: Timestamp.now(),
		search_key: data?.product ?? data?.name ?? null
	});

	await collectionReference.doc(uid).set(
		{
			total_fda_notified: FieldValue.increment(1)
		},
		{ merge: true }
	);
}
