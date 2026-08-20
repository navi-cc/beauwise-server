import type { UserInstance } from '@domain/user.js';
import { type UserRepository } from '@src/admin/repos/user-repository.js';
import { auth, db } from '../config.js';
import { logger } from 'firebase-functions/logger';
import { AppError } from '@utils/error.js';

export type UserQuery = {
	getUser: (id: string) => Promise<UserInstance>;
	getUsers: (
		maxPage: number,
		nextPageToken: string | undefined,
		pageCount: number | undefined
	) => Promise<object>;
	deleteUser: (uid: string) => Promise<void>;
	deleteUserAdmin: (uid: string) => Promise<void>;
};

export function createUserQuery(repository: UserRepository): UserQuery {
	const getUser = async (id: string): Promise<UserInstance> => {
		return await repository.findById(id);
	};

	const getUsers = async (
		maxPage: number,
		nextPageToken: string | undefined,
		pageCount: number | undefined
	): Promise<{
		users: any[];
		nextPageToken: string | null;
		pageCount: number;
		totalUsers: number;
	}> => {
		const MAX_RESULTS = maxPage;
		let response;
		let userData: any[] = [];

		if (nextPageToken) {
			response = await auth.listUsers(MAX_RESULTS, nextPageToken);
		} else {
			response = await auth.listUsers(MAX_RESULTS);
		}

		let totalPageCount = pageCount;
		const allUsersResponse = await auth.listUsers(1000);
		const totalUsers = allUsersResponse.users.length;
		if (!totalPageCount) {
			totalPageCount = Math.ceil(totalUsers / MAX_RESULTS) || 1;
		}

		const snapshot = await db.collection('users').get();
		userData = snapshot.docs.map((doc) => ({
			id: doc.id,
			status: doc.data().status
		}));

		const users = response.users
			.map(
				({
					uid,
					email,
					displayName,
					disabled,
					customClaims,
					metadata,
					photoURL,
					providerData
				}) => {
					const status = userData.find((d: any) => d.id === uid)?.status;
					return {
						id: uid,
						user_name: displayName,
						email,
						account_disable: disabled,
						account_access: { ...customClaims },
						metadata,
						photoURL,
						providerId: providerData?.[0]?.providerId,
						status: status ?? (disabled ? 'disabled' : 'active')
					};
				}
			)
			.sort((a, b) => {
				if (
					a.account_access?.role === 'superadmin' &&
					b.account_access?.role === 'admin'
				) {
					return -1;
				}

				if (a.account_access?.role === 'admin' && b.account_access?.role === 'basic') {
					return -1;
				}

				return 1;
			});

		return {
			users,
			nextPageToken: response.pageToken ?? null,
			pageCount: totalPageCount,
			totalUsers
		};
	};

	const deleteUser = async (uid: string) => {
		const userDoc = await db.collection('users').doc(uid).get();
		const user = await auth.getUser(uid);

		if (user.customClaims?.role === 'basic') {
			await auth.deleteUser(uid);

			if (userDoc.exists) {
				await db.recursiveDelete(userDoc.ref);
			}
		} else {
			throw new AppError('Standard / Basic users are only allowed to be deleted.', 403);
		}
	};

	const deleteUserAdmin = async (uid: string) => {
		const userDoc = await db.collection('users').doc(uid).get();
		const user = await auth.getUser(uid);

		if (user.customClaims?.role === 'admin') {
			await auth.deleteUser(uid);

			if (userDoc.exists) {
				await db.recursiveDelete(userDoc.ref);
			}
		} else {
			throw new AppError('Requested action is not allowed. Please try again.', 403);
		}
	};

	return {
		getUser,
		getUsers,
		deleteUser,
		deleteUserAdmin
	};
}
