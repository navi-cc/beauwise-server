import { ZodBoolean, ZodEmail, type ZodObject } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export function validate(schema: ZodObject | ZodEmail | ZodBoolean) {
	return async (req: Request, _: Response, next: NextFunction) => {
		try {
			const { updatedItem, newItem } = req.body;

			const item = updatedItem ?? newItem;

			req.body = {
				validatedItem: schema.parse(item)
			};

			return next();
		} catch (error) {
			next(error);
		}
	};
}
