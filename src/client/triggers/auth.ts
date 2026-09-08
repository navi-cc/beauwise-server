import { auth, db } from '@src/admin/config.js';
import { Timestamp } from 'firebase-admin/firestore';
import { beforeUserCreated } from 'firebase-functions/identity';
import { logger } from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/scheduler';
import { emailService } from '../auth.js';
export const beforeCreated = beforeUserCreated(() => {
	return {
		customClaims: {
			role: 'basic'
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
		logger.info('No users found for deletion');
		return;
	}

	const deletePromises = snapshot.docs.map(async (userDoc) => {
		const uid = userDoc.id;
		const user = await auth.getUser(uid);

		try {
			await auth.deleteUser(uid);
			await db.recursiveDelete(userDoc.ref);
			await emailService.sendAccountDeleted(user.email as string);
			logger.info('The user is deleted. => ', {
				email: user.email,
				name: user.displayName,
				uid
			});
		} catch (error) {
			logger.error(`Failed to delete account ${uid}:`, error);
		}
	});

	await Promise.all(deletePromises);
});
