import type { Request, Response, NextFunction } from 'express';
import { auth } from '@src/admin/config.js';
import { AppError } from '@utils/error.js';
import { type UserQuery } from '@query/user-query.js';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization as string;

	try {
		if (authHeader === undefined || authHeader?.length <= 0) {
			throw new AppError('No authorization header provided.', 401);
		}

		const tokenParts = authHeader.split(' ');

		if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
			throw new AppError('Invalid token format.', 401);
		}

		const token = tokenParts[1];

		const decodedUser = await auth.verifyIdToken(token);

		res.locals.userId = decodedUser.uid;

		next();
	} catch (error) {
		next(error);
	}
};

export const authorize = (allowedRole: string, userQuery: UserQuery) => {
	return async (_: Request, res: Response, next: NextFunction) => {
		const userId = res.locals.userId;

		const user = await userQuery.getUser(userId);

		const userRole = user.getValues().customClaims.roles;

		if (userRole === allowedRole) {
			return next();
		}

		return res.sendStatus(403);
	};
};
