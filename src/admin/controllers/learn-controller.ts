import type { LearnItem, LearnService } from '@definitions/learn-types.js';
import type { LearnQuery } from '@query/learn-query.js';

import type { Request, Response } from 'express';
import { z } from 'zod';

export function createLearnController<TLearnService extends LearnService<LearnItem>>({
	service,
	query
}: {
	service?: TLearnService;
	query?: LearnQuery;
}) {
	const getItems = (collectionPath: string) => {
		return async (req: Request, res: Response) => {
			const { pageSize, pageParam } = req.query;

			const parsedPageSize = z.coerce.number().min(10).parse(pageSize);

			const data = await query?.getItems(
				collectionPath,
				parsedPageSize,
				pageParam as string
			);

			res.status(200).send({ ...data });
		};
	};

	const updateItem = (collectionPath: string) => async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id;

		const item = await service?.updateItem(id, validatedItem, collectionPath);

		res.status(200).send({ item });
	};

	const addItem = (collectionPath: string) => async (req: Request, res: Response) => {
		const { validatedItem } = req.body;

		await service?.addItem(validatedItem, collectionPath);

		res.sendStatus(200);
	};

	return {
		getItems,
		updateItem,
		addItem
	};
}
