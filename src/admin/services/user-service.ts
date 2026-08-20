import type { Roles } from '@definitions/user.js';
import type { AccountStatus, User } from '@domain/user.js';
import { roles } from '@middleware/rbac.js';
import { type UserRepository } from '@repo/user-repository.js';
import { logger } from 'firebase-functions/logger';

export interface UserService {
	changeUserStatus(id: string, status: AccountStatus): Promise<void>;
	changeAdminUserStatus(id: string, status: AccountStatus): Promise<void>;
	changeUserEmail(id: string, email: string): Promise<void>;
	changeUserPassword(id: string, password: string): Promise<void>;
	changeUserRole(id: string, role: string): Promise<void>;
	removeUser(id: string): Promise<void>;
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
		password: string
	): Promise<
		Partial<User> & {
			providerId: string;
		}
	>;
}

export function createUserService(repository: UserRepository): UserService {
	const removeUser = async (id: string) => {
		await repository.removeUser(id);
	};

	const addUser = async (
		email: string,
		password: string
	): Promise<
		Partial<User> & {
			providerId: string;
		}
	> => {
		return await repository.addUser(email, password);
	};

	const addUserAdmin = async (
		email: string,
		password: string
	): Promise<
		Partial<User> & {
			providerId: string;
		}
	> => {
		const permissions = roles['admin'];
		return await repository.addUserAdmin(email, password, permissions);
	};

	const changeUserStatus = async (id: string, status: AccountStatus) => {
		const user = await repository.findById(id);

		user.toggleStatus(status);

		await repository.updateAccountStatus(id, user.getValues().status);
	};

	const changeAdminUserStatus = async (id: string, status: Partial<AccountStatus>) => {
		const user = await repository.findById(id);

		user.toggleStatus(status);
		await repository.updateAdminStatus(id, user.getValues().status);
	};

	const changeUserRole = async (id: string, role: Roles) => {
		const permissions = roles[role];
		await repository.updateRole(id, role, permissions);
	};

	const changeUserEmail = async (id: string, email: string) => {
		const user = await repository.findById(id);

		user.changeEmail(email);

		await repository.updateEmail(id, user.getValues());
	};

	const changeUserPassword = async (id: string, password: string) => {
		const user = await repository.findById(id);

		user.changePassword(password);
		await repository.updatePassword(id, user.getValues());
	};

	return {
		changeUserStatus,
		changeAdminUserStatus,
		removeUser,
		addUser,
		addUserAdmin,
		changeUserRole,
		changeUserEmail,
		changeUserPassword
	};
}
