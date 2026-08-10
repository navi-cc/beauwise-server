import type { AccountStatus } from '@domain/user.js';
import { type UserRepository } from '@repo/user-repository.js';
import { logger } from 'firebase-functions/logger';

export interface UserService {
	changeUserStatus(id: string, status: AccountStatus): Promise<void>;
	changeUserEmail(id: string, email: string): Promise<void>;
	changeUserPassword(id: string, password: string): Promise<void>;
	removeUser(id: string): Promise<void>;
}

export function createUserService(repository: UserRepository): UserService {
	const removeUser = async (id: string) => {
		await repository.removeUser(id);
	};

	const changeUserStatus = async (id: string, status: AccountStatus) => {
		const user = await repository.findById(id);

		user.toggleStatus(status);
        logger.info(user.getValues().status);
		repository.updateAccountStatus(id, user.getValues().status);
	};

	const changeUserEmail = async (id: string, email: string) => {
		const user = await repository.findById(id);

		user.changeEmail(email);

		repository.updateEmail(id, user.getValues());
	};

	const changeUserPassword = async (id: string, password: string) => {
		const user = await repository.findById(id);

		user.changePassword(password);
		await repository.updatePassword(id, user.getValues());
	};

	return {
		changeUserStatus,
		removeUser,
		changeUserEmail,
		changeUserPassword
	};
}
