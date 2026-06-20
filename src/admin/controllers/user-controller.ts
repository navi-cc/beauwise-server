import type { UserQuery } from '@query/user-query.js';
import { type UserService } from '@services/user-service.js';
import type { Request, Response } from 'express';

export interface UserController {
	disableUser(req: Request, res: Response): Promise<void>;
	changeUserEmail(req: Request, res: Response): Promise<void>;
	changeUserPassword(req: Request, res: Response): Promise<void>;
	getUsers(userQuery: UserQuery): (req: Request, res: Response) => Promise<void>;
}

export function createUserController(userService: UserService): UserController {
	const disableUser = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id;

		userService.disableUser(id, validatedItem);

		res.sendStatus(200);
		return;
	};

	const changeUserEmail = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id;

		userService.changeUserEmail(id, validatedItem);

		res.sendStatus(200);
		return;
	};

	const changeUserPassword = async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id;

		userService.changeUserPassword(id, validatedItem);

		res.sendStatus(200);
		return;
	};

	const getUsers = (
		userQuery: UserQuery
	): ((req: Request, res: Response) => Promise<void>) => {
		return async (req: Request, res: Response) => {
			const maxPage = req.params.maxPage as unknown as number;
			const nextPageToken = req.params.nextPageToken
				? req.params.nextPageToken
				: req.params.nextPageToken?.length <= 0
					? undefined
					: undefined;

			const data = await userQuery.getUsers(maxPage, nextPageToken);

			res.status(200).send(data);
			return;
		};
	};

	return {
		disableUser,
		changeUserEmail,
		changeUserPassword,
		getUsers
	};
}
