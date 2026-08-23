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

	try {
		await rateLimit(key);
		const code = await otpService.storeAndGenerate(userInfo.email, 'email_verification');

		if (process.env.NODE_ENV === 'development') {
			console.log(code);
		} else {
			await emailService.send(userInfo.email, code);
		}
	} catch (err) {
		logger.error(
			'An error occured while sending email verification code. Reason => ',
			err
		);

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

export const changeUserEmail = onCall(async ({ data }) => {
	const { previousEmail, newEmail } = data;
	const user = await auth.getUserByEmail(previousEmail);

	let updatedUser;
	try {
		updatedUser = await auth.updateUser(user.uid, {
			email: newEmail,
			emailVerified: true
		});
	} catch (error) {
		logger.info(error);

		if (error.code === 'auth/email-already-exists') {
			throw new HttpsError(
				'cancelled',
				'Cannot change email. The email is already in use.'
			);
		}
	}

	return {
		updatedEmail: updatedUser.email
	};
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
			if (process.env.NODE_ENV === 'development') {
				console.log(code);
			} else {
				await emailService.send(userInfo.email, code, emailType);
			}
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
		logger.info(error);
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
	} catch (err) {
		logger.info(err);
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

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;
export const secureLogin = onCall(async (req) => {
	const { email, password } = req.data;

	const attemptRef = db.collection('login_attempts').doc(email);
	const attemptDoc = await attemptRef.get();
	const now = Timestamp.now();

	if (attemptDoc.exists) {
		const status = attemptDoc.data();
		const lockedUntilInSeconds = status.lockedUntil?.seconds;

		logger.log('account lock until', lockedUntilInSeconds);

		if (status?.lockedUntil && lockedUntilInSeconds > now.seconds) {
			return {
				success: false,
				message: 'This account is temporarily locked. Try again later.',
				code: 'account-locked',
				lockedUntil: lockedUntilInSeconds
			};
		}
	}

	try {
		const response = await verifyUserPasswordRestAPI(email, password);

		logger.info('response secure login', response);

		if (response?.error && response.error.message === 'USER_DISABLED') {
			throw new HttpsError('cancelled', 'You are currently suspended. Please try again');
		}

		if (response?.error && response.error.message === 'INVALID_PASSWORD') {
			let failedAttempts = 1;
			let lockedUntil = null;

			if (attemptDoc.exists) {
				failedAttempts = attemptDoc.data().failedAttempts + 1;
				if (failedAttempts >= MAX_ATTEMPTS) {
					lockedUntil = Timestamp.fromMillis(now.toMillis() + LOCK_TIME_MS);
				}
			}

			await attemptRef.set(
				{
					failedAttempts,
					lockedUntil,
					lastAttempt: now
				},
				{ merge: true }
			);

			return {
				success: false,
				code: 'invalid-credentials',
				remainingAttempts: MAX_ATTEMPTS - failedAttempts,
				message: 'Invalid credential. Please try again'
			};
		} else {
			const token = await auth.createCustomToken(response.localId);

			logger.log('token', token);
			await attemptRef.delete();
			return { token, success: true };
		}
	} catch (error) {
		logger.info(error);

		if (error.code === 'permission-denied') {
			throw new HttpsError(error.code, error.message);
		} else {
			throw new HttpsError('cancelled', error.message);
		}
	}
});

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

async function verifyUserPasswordRestAPI(email, password) {
	const url =
		process.env.NODE_ENV === 'development'
			? 'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=xyz'
			: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FB_WEB_API_KEY}`;

	logger.info('current secure login url', url);
	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({ email, password, returnSecureToken: true }),
		headers: { 'Content-Type': 'application/json', Referer: 'https://app.beauwise.tech' }
	});

	const user = await response.json();

	return user;
}
