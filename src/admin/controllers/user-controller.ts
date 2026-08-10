import type { UserQuery } from '@query/user-query.js';
import { type UserService } from '@services/user-service.js';
import type { Request, Response } from 'express';

export interface UserController {
	changeUserStatus(req: Request, res: Response): Promise<void>;
	changeUserEmail(req: Request, res: Response): Promise<void>;
	changeUserPassword(req: Request, res: Response): Promise<void>;
	getUsers(userQuery: UserQuery): (req: Request, res: Response) => Promise<void>;
	deleteUser(userQuery: UserQuery): (req: Request, res: Response) => Promise<void>;
}

export function createUserController(userService: UserService): UserController {
	const changeUserStatus = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id as string;

		userService.changeUserStatus(id, validatedItem);

		res.sendStatus(200);
		return;
	};

	const changeUserEmail = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id as string;

		userService.changeUserEmail(id, validatedItem);

		res.sendStatus(200);
		return;
	};

	const changeUserPassword = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id as string;

		userService.changeUserPassword(id, validatedItem);

		res.sendStatus(200);
		return;
	};

	const deleteUser = (
		userQuery: UserQuery
	): ((req: Request, res: Response) => Promise<void>) => {
		return async (req: Request, res: Response) => {
			let status;

			try {
				await userQuery.deleteUser(req.params.id);
				status = 200;
			} catch {
				status = 500;
			}

			res.sendStatus(status);
			return;
		};
	};

	const getUsers = (
		userQuery: UserQuery
	): ((req: Request, res: Response) => Promise<void>) => {
		return async (req: Request, res: Response) => {
			const maxPage = Number(req.query.maxpage) || 10;

			const nextPageToken =
				typeof req.query.nextpagetoken === 'string' ? req.query.nextpagetoken : undefined;

			const pageCount = req.query.pagecount ? Number(req.query.pagecount) : undefined;

			const data = await userQuery.getUsers(maxPage, nextPageToken, pageCount);

			res.status(200).send(data);
			return;
		};
	};

	return {
		changeUserStatus,
		changeUserEmail,
		changeUserPassword,
		getUsers,
		deleteUser
	};
}
