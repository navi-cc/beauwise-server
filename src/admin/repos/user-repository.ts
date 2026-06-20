import { auth } from '@src/admin/config.js';
import { createUserInstance, type User, type UserInstance } from '@domain/user.js';

export type UserRepository = {
	save(id: string, user: User): Promise<void>;
	findById: (id: string) => Promise<UserInstance>;
};

export function createUserRepository(): UserRepository {
	const save = async (id: string, user: User): Promise<void> => {
		await auth.updateUser(id, {
			...user
		});
	};
	const findById = async (id: string): Promise<UserInstance> => {
		const userRecord = await auth.getUser(id);

		const user: User = {
			id: userRecord.uid,
			email: userRecord.email ?? '',
			password: userRecord.passwordHash ?? '',
			disabled: userRecord.disabled,
			customClaims: { ...userRecord.customClaims }
		};

		return createUserInstance(user);
	};

	return {
		save,
		findById
	};
}
