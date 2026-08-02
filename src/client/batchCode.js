import { tz } from '@date-fns/tz';
import { db } from '@src/admin/config.js';
import { format, isAfter, parse } from 'date-fns';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/https';

const getCurrentAge = (years, months, days) => {
	let ageString = '';

	if (years) {
		ageString += years + ' Year';
		if (years > 1) {
			ageString += 's';
		}
		ageString += ' ';
	}
	if (months) {
		ageString += months + ' Month';
		if (months > 1) {
			ageString += 's';
		}
		ageString += ' ';
	}
	if (days) {
		ageString += days + ' Day';
		if (days > 1) {
			ageString += 's';
		}
		ageString += ' ';
	}

	return ageString;
};

const getMonthName = (month) => {
	switch (month) {
		case 1:
			return 'January';
		case 2:
			return 'February';
		case 3:
			return 'March';
		case 4:
			return 'April';
		case 5:
			return 'May';
		case 6:
			return 'June';
		case 7:
			return 'July';
		case 8:
			return 'August';
		case 9:
			return 'September';
		case 10:
			return 'October';
		case 11:
			return 'November';
		case 12:
			return 'December';
	}
};

export const batchCode = onCall(async (req, _) => {
	const { brand, code, clientTimeZone } = req.data.query;

	let data;
	let status;
	const todayDate = new Date();
	const formattedVerificationDate = format(todayDate, "MMMM d',' yyyy 'at' p", {
		in: tz(clientTimeZone)
	});
	try {
		const response = await fetch(
			'https://www.cosmeticcheck.app/api/decode?t=1779393293466',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ brand: brand.keyParameters, code })
			}
		);

		if (!response.ok) {
			throw new Error('INTERNAL_SERVER_ERROR');
		}

		const result = await response.json();

		if (result?.error >= 400) {
			throw new Error('INVALID_INPUT');
		}

		let currentAgeString = '';
		const manufactureDate =
			getMonthName(result?.body?.month ?? 0) +
			' ' +
			(result?.body?.date ?? '1') +
			', ' +
			result?.body?.year;
		const estimatedExpiration =
			getMonthName(result?.body?.month ?? 0) +
			' ' +
			(result?.body?.date ?? '1') +
			', ' +
			(parseInt(result?.body?.year ?? 2026) + 3);

		const day = result?.body?.date ?? 1;
		const month = result?.body?.month ?? 1;
		const year = result?.body?.year ?? 2026;
		const resultDate = new Date(year, month, day);
		const currentAge = new Date(Date.now() - resultDate);
		const currentAgeYear = Math.abs(currentAge.getUTCFullYear() - 1970);
		const currentAgeMonth = Math.abs(currentAge.getUTCMonth());
		const currentAgeDay = Math.abs(currentAge.getUTCDay() - 1);

		currentAgeString = getCurrentAge(currentAgeYear, currentAgeMonth, currentAgeDay);

		const parsedEstimatedExpirationDate = parse(
			estimatedExpiration,
			"MMMM dd',' yyyy",
			new Date()
		);

		const parsedManufactureDate = parse(manufactureDate, "MMMM dd',' yyyy", new Date());

		const isExpired = isAfter(todayDate, parsedEstimatedExpirationDate);

		const formattedEstimatedExpirationDate = format(
			parsedEstimatedExpirationDate,
			'MMMM yyyy'
		);
		const formattedManufactureDate = format(parsedManufactureDate, 'MMMM yyyy');

		data = {
			brand: brand.text,
			code,
			manufacture_date: formattedManufactureDate,
			current_age: currentAgeString,
			estimated_expiration: formattedEstimatedExpirationDate,
			is_expired: isExpired,
			verification_check_date: formattedVerificationDate
		};
	} catch (error) {
		if (error.message === 'INVALID_INPUT') {
			status = {
				code: 400,
				message: 'Bad Request'
			};

			data = {
				brand: brand.text,
				code,
				is_invalid: true,
				verification_check_date: formattedVerificationDate
			};
		}
	}

	if (req.auth) {
		await saveToDB(req.auth.uid, data);
	}
	return { data, status };
});

async function saveToDB(uid, data) {
	const collectionReference = db.collection('users');
	const subCollectionReference = collectionReference.doc(uid).collection('batch_history');

	await subCollectionReference.add({ ...data, createdAt: Timestamp.now() });
}
