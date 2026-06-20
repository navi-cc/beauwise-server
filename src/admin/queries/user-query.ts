import type { UserInstance } from '@domain/user.js';
import { type UserRepository } from '@src/admin/repos/user-repository.js';
import { auth } from '../config.js';

export type UserQuery = {
	getUser: (id: string) => Promise<UserInstance>;
	getUsers: (maxPage: number, nextPageToken: string | undefined) => Promise<object>;
};

export function createUserQuery(repository: UserRepository): UserQuery {
	const getUser = async (id: string): Promise<UserInstance> => {
		return await repository.findById(id);
	};

	const getUsers = async (
		maxPage: number,
		nextPageToken: string | undefined
	): Promise<object> => {
		// if (nextPageToken === undefined) {
		// 	throw new AppError('Requested page exceeds the maximum available pages.', 400);
		// }

		const MAX_RESULTS = maxPage;
		let response;

		if (nextPageToken) {
			response = await auth.listUsers(MAX_RESULTS, nextPageToken);
		} else {
			response = await auth.listUsers(MAX_RESULTS);
		}

		const users = response.users.map(
			({ uid, email, displayName, disabled, customClaims, metadata, photoURL }) => {
				return {
					id: uid,
					user_name: displayName,
					email,
					account_status: disabled,
					account_access: { ...customClaims },
					metadata,
					photoURL
				};
			}
		);

		nextPageToken = response.pageToken !== undefined ? response.pageToken : undefined;

		return { users, nextPageToken };
	};

	return {
		getUser,
		getUsers
	};
}
