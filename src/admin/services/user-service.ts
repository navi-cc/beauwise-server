import { type UserRepository } from '@repo/user-repository.js';

export interface UserService {
	disableUser(id: string, status: boolean): Promise<void>;
	changeUserEmail(id: string, email: string): Promise<void>;
	changeUserPassword(id: string, password: string): Promise<void>;
	removeUser(id: string): Promise<void>;
}

export function createUserService(repository: UserRepository): UserService {
	const removeUser = async (id: string) => {
		await repository.removeUser(id);
	};

	const disableUser = async (id: string, status: boolean) => {
		const user = await repository.findById(id);

		user.toggleDisable(status);
		repository.updateAccountStatus(id, user.getValues());
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
		disableUser,
		removeUser,
		changeUserEmail,
		changeUserPassword
	};
}
