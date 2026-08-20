import type { UserQuery } from '@query/user-query.js';
import { type UserService } from '@services/user-service.js';
import type { Request, Response } from 'express';
import { logger } from 'firebase-functions/logger';

export interface UserController {
	changeUserStatus(req: Request, res: Response): Promise<void>;
	changeAdminUserStatus(req: Request, res: Response): Promise<void>;
	changeUserEmail(req: Request, res: Response): Promise<void>;
	changeUserPassword(req: Request, res: Response): Promise<void>;
	changeUserRole(req: Request, res: Response): Promise<void>;
	getUsers(userQuery: UserQuery): (req: Request, res: Response) => Promise<void>;
	deleteUser(userQuery: UserQuery): (req: Request, res: Response) => Promise<void>;
	deleteUserAdmin(userQuery: UserQuery): (req: Request, res: Response) => Promise<void>;
	addUser(req: Request, res: Response): Promise<void>;
	addUserAdmin(req: Request, res: Response): Promise<void>;
}

export function createUserController(userService: UserService): UserController {
	const changeUserStatus = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id as string;

		let status, message;

		try {
			await userService.changeUserStatus(id, validatedItem);
			status = 200;
			message = 'User status is successfully updated';
		} catch (error: any) {
			status = error?.code ? error.code : 400;
			message = error?.message
				? error?.message
				: 'Use status not updated. Please try again';
			logger.error('Error occured at changing user status. Reason => ', error);
		}

		res.status(status).send({
			message
		});
		return;
	};

	const changeAdminUserStatus = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id as string;

		let status, message;

		try {
			await userService.changeAdminUserStatus(id, validatedItem);
			status = 200;
			message = 'Admin User status is successfully updated';
		} catch (error) {
			logger.error('Error occured at changing user admin status. Reason => ', error);
			message = 'An error occured admin user status is not updated';
			status = 400;
		}

		res.status(status).send({ message });
		return;
	};

	const changeUserEmail = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id as string;

		await userService.changeUserEmail(id, validatedItem);

		res.sendStatus(200);
		return;
	};

	const changeUserPassword = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id as string;

		await userService.changeUserPassword(id, validatedItem);

		res.sendStatus(200);
		return;
	};

	const changeUserRole = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id as string;

		let status;

		try {
			await userService.changeUserRole(id, validatedItem.role);
			status = 200;
		} catch (error) {
			logger.error('Error occured at changing user role. Reason => ', error);
			status = 400;
		}

		res.sendStatus(status);
		return;
	};

	const deleteUser = (
		userQuery: UserQuery
	): ((req: Request, res: Response) => Promise<void>) => {
		return async (req: Request, res: Response) => {
			let status, message;

			try {
				await userQuery.deleteUser(req.params.id);
				message = 'User is successfully deleted.';
				status = 200;
			} catch (err: any) {
				message = 'Requested action failed. Please try again.';
				status = err?.code ? err?.code : 500;

				if (status === 403) {
					message = 'Requestion action not allowed to perform the operation.';
				}

				logger.error('Error occured when deleting the user. Reason => ', err);
			}

			res.status(status).send({ message });
			return;
		};
	};

	const deleteUserAdmin = (
		userQuery: UserQuery
	): ((req: Request, res: Response) => Promise<void>) => {
		return async (req: Request, res: Response) => {
			let status, message;

			try {
				await userQuery.deleteUserAdmin(req.params.id);
				status = 200;
				message = 'The requested user admin is successfully deleted.';
			} catch (err: any) {
				message = 'The request user admin is not deleted. Please try again.';
				status = 500;
				logger.error('Error occured when deleting the user admin. Reason => ', err);

				if (err?.message || err?.code) {
					status = err?.code;
					message = err?.message;
				}
			}

			res.status(status).send({ message });
			return;
		};
	};

	const addUser = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;

		let result, status;
		try {
			const user = await userService.addUser(validatedItem.email, validatedItem.password);

			status = 200;
			result = { status: 200, ...user };
		} catch (err: any) {
			status = 400;

			logger.error('Error occured when adding new user. Reason => ', err);

			let message = 'User not created. Please try again';
			if (err?.code === 'auth/email-already-exists') {
				message = 'The email already exists. Please try again';
			}

			result = {
				message
			};
		}

		res.status(status).send(result);
		return;
	};

	const addUserAdmin = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;

		let result, status;
		try {
			const user = await userService.addUserAdmin(
				validatedItem.email,
				validatedItem.password
			);

			status = 200;
			result = { status: 200, ...user };
		} catch (err: any) {
			status = 400;

			logger.error('Error occured when adding new user admin. Reason => ', err);

			let message = 'User not created. Please try again';
			if (err?.code === 'auth/email-already-exists') {
				message = 'The email already exists. Please try again';
			}

			result = {
				message
			};
		}

		res.status(status).send(result);
		return;
	};

	const getUsers = (
		userQuery: UserQuery
	): ((req: Request, res: Response) => Promise<void>) => {
		return async (req: Request, res: Response) => {
			const maxPage = Number(req.query.maxPage) || 10;

			const nextPageToken =
				typeof req.query.nextPageToken === 'string' &&
				req.query.nextPageToken !== 'undefined' &&
				req.query.nextPageToken !== 'null' &&
				req.query.nextPageToken.trim() !== ''
					? req.query.nextPageToken
					: undefined;

			const pageCount = req.query.pageCount ? Number(req.query.pageCount) : undefined;

			const data = await userQuery.getUsers(maxPage, nextPageToken, pageCount);

			res.status(200).send(data);
			return;
		};
	};

	return {
		changeUserStatus,
		changeAdminUserStatus,
		changeUserEmail,
		changeUserPassword,
		getUsers,
		deleteUser,
		changeUserRole,
		deleteUserAdmin,
		addUser,
		addUserAdmin
	};
}
