import { HttpsError, onCall } from 'firebase-functions/https';
import { auth, db } from '@src/admin/config.js';
import { createOtpService } from './services/otp.js';
import { firebaseOtpStorage as fbOtpStorage } from './providers/firebase-otp-storage.js';
import { createEmailService } from './services/email.js';
import { mailerSend } from '@client/providers/email-provider.js';
import { rateLimit } from './utility/rate-limit.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/logger';

const firebaseOtpStorage = fbOtpStorage();
const emailService = createEmailService(mailerSend());
const otpService = createOtpService(firebaseOtpStorage);

export const checkIfUserAlreadyExist = onCall(async (req) => {
	const email = req.data.email;

	const result = await verifyIfUserExist(email);

	return { ...result };
});

export const sendEmailVerificationCode = onCall(async (req) => {
	const { userInfo } = req.data;
	let isSuccess = false;

	const key = process.env.NODE_ENV === 'development' ? userInfo.email : req.rawRequest.ip;

	await rateLimit(key);
	const code = await otpService.storeAndGenerate(userInfo.email, 'email_verification');

	try {
		await emailService.send(userInfo.email, code);
	} catch (err) {
		logger.log(err);

		throw new HttpsError('aborted', 'Something went wrong. Please resend code.');
	}

	return { isSuccess };
});

export const verifyEmail = onCall(async (req) => {
	const { code, userInfo } = req.data;

	const result = await otpService.verify(userInfo.email, code, 'email_verification');

	if (!result.success) {
		throw new HttpsError('cancelled', result.message);
	}

	return { result };
});

export const passwordReset = onCall(async (req) => {
	const { userInfo } = req.data;

	let result;

	try {
		const isAuthenticated = await verifyIfUserExist(userInfo?.email);

		if (!isAuthenticated) {
			throw new Error('Email does not exist');
		}

		const key =
			process.env.NODE_ENV === 'development' ? userInfo.email : req.rawRequest.ip;

		await rateLimit(key);
		const code = await otpService.storeAndGenerate(userInfo.email, 'password_reset');

		const emailType = 'password_reset';

		try {
			await emailService.send(userInfo.email, code, emailType);
		} catch (err) {
			logger.log(err);
			throw new HttpsError('aborted', 'Something went wrong. Please resend code.');
		}

		result = { success: true };
	} catch (err) {
		// Silent catch to avoid brute force "kind of" attacks.

		if (err instanceof HttpsError) {
			throw new HttpsError(err.code, err.message);
		}

		result = { success: true };
	}

	return { result };
});

export const verifyPasswordReset = onCall(async (req) => {
	const { code, userInfo } = req.data;

	const result = await otpService.verify(userInfo.email, code, 'password_reset');

	if (!result.success) {
		throw new HttpsError('cancelled', result.message);
	}

	return { result };
});

export const changeUserPassword = onCall(async (req) => {
	const { email, password } = req.data;

	const user = await auth.getUserByEmail(email);

	await auth.updateUser(user.uid, {
		password
	});

	const result = { success: true };
	return { result };
});

const verifyIfUserExist = async (email) => {
	try {
		const user = await auth.getUserByEmail(email);
		return {
			provider_id: user.providerData[0].providerId,
			exists: true
		};
	} catch (error) {
		if (error.code == 'auth/user-not-found') {
			return { provider_id: null, exists: false };
		}
	}
};

export const requestAccountDeletion = onCall(async (request) => {
	const uid = request.auth.uid;
	const now = Timestamp.now();

	const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
	const scheduledFor = Timestamp.fromMillis(now.toMillis() + FOURTEEN_DAYS_MS);

	try {
		await db.collection('users').doc(uid).set(
			{
				status: 'PENDING_DELETION',
				deletionRequestedAt: now,
				deletionScheduledFor: scheduledFor
			},
			{ merge: true }
		);

		await revokeAllUserSessions(uid);
	} catch {
		throw new HttpsError('cancelled', 'Request Account Deletion Failed.');
	}

	return { success: true, deletionScheduledFor: scheduledFor.toDate().toISOString() };
});

const revokeAllUserSessions = async (uid) => {
	await auth.revokeRefreshTokens(uid);

	const userRecord = await auth.getUser(uid);
	const revocationTimeInSeconds = Math.floor(
		new Date(userRecord.tokensValidAfterTime).getTime() / 1000
	);

	await db.collection('users').doc(uid).set(
		{
			revokedAt: FieldValue.serverTimestamp(),
			tokensValidAfterTime: revocationTimeInSeconds
		},
		{ merge: true }
	);
};

export const cancelAccountDeletion = onCall(async (request) => {
	const uid = request.auth.uid;

	await db.collection('users').doc(uid).update({
		status: FieldValue.delete(),
		deletionRequestedAt: FieldValue.delete(),
		deletionScheduledFor: FieldValue.delete(),
		tokensValidAfterTime: FieldValue.delete(),
		revokedAt: FieldValue.delete()
	});

	return { success: true, message: 'Account deletion request canceled.' };
});
