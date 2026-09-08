import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Timestamp } from 'firebase-admin/firestore';
import { db, storage } from '@src/admin/config.js';
import type { MythFact } from '@zod/learn-schema.js';
import { logger } from 'firebase-functions';
import { subMonths } from 'date-fns';

export const cleanupExpiredTopics = onSchedule(
	{
		schedule: 'every 24 hours',
		region: 'asia-east2'
	},
	async () => {
		const RETENTION_DAYS = 30;
		const expirationThreshold = Timestamp.fromMillis(
			Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
		);

		const snapshot = await db
			.collection('myth_facts')
			.where('hasPendingTopicDeletions', '==', true)
			.get();

		if (snapshot.empty) {
			logger.info('has no pending deletetions, snapshots =>', snapshot);
			return;
		}

		const batch = db.batch();

		const promises = snapshot.docs.map(async (doc) => {
			const data = doc.data() as MythFact;
			const items = data.topics || [];

			const updatedItems = items.filter((item) => {
				if (!item?.is_deleted) return true;

				const itemScheduledDate = subMonths(item?.scheduledDeleteAt.toDate(), 1);
				const itemScheduledDateTimestamp = Timestamp.fromDate(itemScheduledDate);

				return (
					item?.scheduledDeleteAt &&
					itemScheduledDateTimestamp.seconds > expirationThreshold.seconds
				);
			});

			const removedItemConfirmed = items.filter((item) => {
				if (!item?.is_deleted) return false;

				const itemScheduledDate = subMonths(item?.scheduledDeleteAt.toDate(), 1);
				const itemScheduledDateTimestamp = Timestamp.fromDate(itemScheduledDate);

				return itemScheduledDateTimestamp.seconds <= expirationThreshold.seconds;
			});

			if (removedItemConfirmed.length > 0) {
				const bucket = storage.bucket('beauwise-asia');

				const promises = removedItemConfirmed.map(async (item) => {
					const filePath = `learn/${data.baseImagePath}/${item.imageId}.webp`;

					try {
						await bucket.file(filePath).delete();
						logger.log('Image deleted in the bucket, file info =>', filePath);
					} catch (error) {
						logger.error(`Failed to delete image: ${filePath}`, error);
					}
				});

				await Promise.allSettled(promises);
			}

			const stillHasPending = updatedItems.some((item) => item?.is_deleted);

			batch.update(doc.ref, {
				topics: updatedItems,
				hasPendingTopicDeletions: stillHasPending
			});
		});

		await Promise.allSettled(promises);

		await batch.commit();
	}
);
