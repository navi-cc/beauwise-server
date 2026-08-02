import { auth, db } from '@src/admin/config.js';
import { Timestamp } from 'firebase-admin/firestore';
import { beforeUserCreated } from 'firebase-functions/identity';
import { logger } from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/scheduler';
export const beforeCreated = beforeUserCreated(() => {
	return {
		customClaims: {
			role: 'basic',
			permissions: ['read:documents']
		}
	};
});

export const processAccountDeletions = onSchedule('every 24 hours', async () => {
	const now = Timestamp.now();

	const snapshot = await db
		.collection('users')
		.where('status', '==', 'PENDING_DELETION')
		.where('deletionScheduledFor', '<=', now)
		.get();

	if (snapshot.empty) {
		return;
	}

	const deletePromises = snapshot.docs.map(async (userDoc) => {
		const uid = userDoc.id;

		try {
			await auth.deleteUser(uid);
			await db.recursiveDelete(userDoc.ref);
		} catch (error) {
			logger.error(`Failed to delete account ${uid}:`, error);
		}
	});

	await Promise.all(deletePromises);
});
