import { db } from '@src/admin/config.js';
import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';

export async function rateLimit(key: string) {
	const FIVE_MINUTES_MS = 5 * 60 * 1000; // 300,000 ms
	const MAX_REQUESTS_IN_WINDOW = 3;

	const rateLimitRef = db.collection('otp_rate_limits').doc(key);
	const now = Timestamp.now();
	const nowMs = now.toMillis();

	await db.runTransaction(async (transaction) => {
		const doc = await transaction.get(rateLimitRef);
		const data = doc.data();
		if (data) {
			const blockedUntilMs = data.blockedUntil ? data.blockedUntil.toMillis() : 0;
			if (nowMs < blockedUntilMs) {
				const remainingSeconds = Math.ceil((blockedUntilMs - nowMs) / 1000);
				const remainingMinutes = Math.ceil(remainingSeconds / 60);
				throw new HttpsError(
					'resource-exhausted',
					`Too many code requests. Please wait for ${remainingMinutes} minute(s)`
				);
			}
			const recentTimestamps: number[] = (data.requestTimestamps || []).filter(
				(ts: number) => nowMs - ts < FIVE_MINUTES_MS
			);
			recentTimestamps.push(nowMs);

			if (recentTimestamps.length >= MAX_REQUESTS_IN_WINDOW) {
				const newBlockedUntil = Timestamp.fromMillis(nowMs + FIVE_MINUTES_MS);
				transaction.set(
					rateLimitRef,
					{
						requestTimestamps: [],
						blockedUntil: newBlockedUntil,
						lastRequestedAt: now
					},
					{ merge: true }
				);
			} else {
				transaction.set(
					rateLimitRef,
					{
						requestTimestamps: recentTimestamps,
						blockedUntil: null,
						lastRequestedAt: now
					},
					{ merge: true }
				);
			}
		} else {
			transaction.set(rateLimitRef, {
				requestTimestamps: [nowMs],
				blockedUntil: null,
				lastRequestedAt: now
			});
		}
	});
}
