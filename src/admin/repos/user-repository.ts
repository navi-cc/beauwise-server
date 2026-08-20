import { auth, db } from '@src/admin/config.js';
import {
	createUserInstance,
	type AccountStatus,
	type User,
	type UserInstance
} from '@domain/user.js';
import { FieldValue } from 'firebase-admin/firestore';
import { AppError } from '@utils/error.js';
import { parseISO } from 'date-fns';
import { logger } from 'firebase-functions';

export type UserRepository = {
	save(id: string, user: User): Promise<void>;
	updateEmail(id: string, user: User): Promise<void>;
	updateAccountStatus(id: string, newStatus: AccountStatus): Promise<void>;
	updateAdminStatus(id: string, newStatus: Partial<AccountStatus>): Promise<void>;
	updatePassword(id: string, user: User): Promise<void>;
	updateRole(id: string, role: string, permissions: string[]): Promise<void>;
	addUser(
		email: string,
		password: string
	): Promise<
		Partial<User> & {
			providerId: string;
		}
	>;
	addUserAdmin(
		email: string,
		password: string,
		permissions: string[]
	): Promise<
		Partial<User> & {
			providerId: string;
		}
	>;
	removeUser(id: string): Promise<void>;
	findById: (id: string) => Promise<UserInstance>;
};

export function createUserRepository(): UserRepository {
	const save = async (id: string, user: User): Promise<void> => {
		await auth.updateUser(id, {
			...user
		});
	};

	const addUser = async (
		email: string,
		password: string
	): Promise<
		Partial<User> & {
			providerId: string;
		}
	> => {
		const collectionReference = db.collection('users');
		const user = await auth.createUser({
			email,
			password,
			emailVerified: true
		});

		await auth.setCustomUserClaims(user.uid, {
			role: 'basic'
		});

		await collectionReference.doc(user.uid).create({
			status: 'ACTIVE'
		});

		return {
			email: user.email as string,
			providerId: user.providerData?.[0]?.providerId,
			id: user.uid
		};
	};

	const addUserAdmin = async (
		email: string,
		password: string,
		permissions: string[]
	): Promise<
		Partial<User> & {
			providerId: string;
		}
	> => {
		const collectionReference = db.collection('users');
		const user = await auth.createUser({
			email,
			password,
			emailVerified: true
		});

		auth.setCustomUserClaims(user.uid, {
			role: 'admin',
			permissions
		});

		await collectionReference.doc(user.uid).create({
			status: 'ACTIVE'
		});

		return {
			email: user.email as string,
			providerId: user.providerData?.[0]?.providerId,
			id: user.uid
		};
	};

	const removeUser = async (id: string) => {
		await auth.deleteUser(id);
	};

	const updateEmail = async (id: string, user: User): Promise<void> => {
		await auth.updateUser(id, {
			email: user.email
		});
	};

	const updateRole = async (id: string, role: string, permissions: string[]) => {
		await auth.setCustomUserClaims(id, {
			role,
			permissions
		});
	};

	const updateAccountStatus = async (
		id: string,
		newStatus: AccountStatus
	): Promise<void> => {
		let disable = false;
		const userRef = db.collection('users').doc(id);
		const userDoc = (await userRef.get()).data() as User;
		const userPreviousStatus = userDoc.status;
		const user = await auth.getUser(id);

		if (userPreviousStatus === 'PENDING_DELETION' && newStatus === 'DISABLED') {
			throw new AppError('Requested action is not allowed. Please try again.', 403);
		}

		if (user.customClaims?.role === 'admin' || user.customClaims?.role === 'superadmin') {
			throw new AppError('Requested action is not allowed. Please try again.', 403);
		}

		if (newStatus === 'DISABLED') {
			await revokeAllUserSessions(id);
			disable = true;
		}

		if (newStatus === 'ACTIVE') {
			if (user.disabled) {
				await removeRevokeUserSession(id);
			}

			disable = false;
		}

		if (newStatus === 'ACTIVE' || newStatus === 'DISABLED') {
			await auth.updateUser(id, {
				disabled: disable
			});
		}

		if (
			newStatus === 'REMOVE_PENDING_DELETION' &&
			userPreviousStatus === 'PENDING_DELETION'
		) {
			userRef.set(
				{
					deletionRequestedAt: FieldValue.delete(),
					deletionScheduledFor: FieldValue.delete(),
					status: 'ACTIVE',
					revokedAt: FieldValue.delete(),
					tokensValidAfterTime: FieldValue.delete()
				},
				{
					merge: true
				}
			);
		}
	};
	const updatePassword = async (id: string, user: User): Promise<void> => {
		await auth.updateUser(id, {
			password: user.password
		});
	};

	const updateAdminStatus = async (
		id: string,
		newStatus: AccountStatus
	): Promise<any> => {
		let disable = false;

		const userRef = db.collection('users').doc(id);

		if (newStatus === 'DISABLED') {
			disable = true;
		}

		if (newStatus === 'ACTIVE') {
			disable = false;
		}

		await userRef.set(
			{
				status: newStatus
			},
			{ merge: true }
		);

		return await auth.updateUser(id, {
			disabled: disable
		});
	};

	const findById = async (id: string): Promise<UserInstance> => {
		const userRecord = await auth.getUser(id);
		const userSnap = await db.collection('users').doc(id).get();
		const userData = userSnap.data() as User;

		const user: User = {
			id: userRecord.uid,
			email: userRecord.email ?? '',
			password: userRecord.passwordHash ?? '',
			status: userData?.status ?? 'ACTIVE',
			customClaims: {
				role: userRecord.customClaims?.role,
				permissions: [...(userRecord.customClaims?.permissions ?? [])]
			}
		};

		return createUserInstance(user);
	};

	return {
		save,
		findById,
		updateAccountStatus,
		updateAdminStatus,
		updateEmail,
		updateRole,
		removeUser,
		addUser,
		addUserAdmin,
		updatePassword
	};
}

async function revokeAllUserSessions(uid: string) {
	await auth.revokeRefreshTokens(uid);

	const userRecord = await auth.getUser(uid);

	const dateString = userRecord.tokensValidAfterTime as string;

	logger.info('user token valid after time', userRecord.tokensValidAfterTime);
	const revocationTimeInSeconds = Math.floor(new Date(dateString).getTime() / 1000);

	await db.collection('users').doc(uid).set(
		{
			revokedAt: FieldValue.serverTimestamp(),
			tokensValidAfterTime: revocationTimeInSeconds
		},
		{ merge: true }
	);
}

async function removeRevokeUserSession(uid: string) {
	await db.collection('users').doc(uid).update({
		tokensValidAfterTime: FieldValue.delete(),
		revokedAt: FieldValue.delete()
	});
}
