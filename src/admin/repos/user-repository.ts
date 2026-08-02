import { auth } from '@src/admin/config.js';
import { createUserInstance, type User, type UserInstance } from '@domain/user.js';

export type UserRepository = {
	save(id: string, user: User): Promise<void>;
	updateEmail(id: string, user: User): Promise<void>;
	updateAccountStatus(id: string, user: User): Promise<void>;
	updatePassword(id: string, user: User): Promise<void>;
	removeUser(id: string): Promise<void>;
	findById: (id: string) => Promise<UserInstance>;
};

export function createUserRepository(): UserRepository {
	const save = async (id: string, user: User): Promise<void> => {
		await auth.updateUser(id, {
			...user
		});
	};

	const removeUser = async (id: string) => {
		await auth.deleteUser(id);
	};

	const updateEmail = async (id: string, user: User): Promise<void> => {
		await auth.updateUser(id, {
			email: user.email
		});
	};

	const updateAccountStatus = async (id: string, user: User): Promise<void> => {
		await auth.updateUser(id, {
			disabled: user.disabled
		});
	};

	const updatePassword = async (id: string, user: User): Promise<void> => {
		await auth.updateUser(id, {
			password: user.password
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
		findById,
		updateAccountStatus,
		updateEmail,
		removeUser,
		updatePassword
	};
}
