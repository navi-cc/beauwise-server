import type { LearnItem, LearnService } from '@definitions/learn-types.js';
import type { LearnQuery } from '@query/learn-query.js';

import type { NextFunction, Request, Response } from 'express';
import { logger } from 'firebase-functions/logger';
import { z } from 'zod';

export function createLearnController<TLearnService extends LearnService<LearnItem>>({
	service,
	query
}: {
	service?: TLearnService;
	query?: LearnQuery;
}) {
	const getItems = (collectionPath: string, searchKeyFilter: string) => {
		return async (req: Request, res: Response) => {
			const { pageSize, pageNumber, deleted, categories, commonProducts, bestFor } =
				req.query;

			let { q } = req.query;

			const parsedCategories =
				categories !== undefined ? z.coerce.string().parse(categories).split(',') : [];

			const parsedCommonProducts =
				commonProducts !== undefined
					? z.coerce.string().parse(commonProducts).split(',')
					: [];

			const parsedBestFor =
				bestFor !== undefined ? z.coerce.string().parse(bestFor).split(',') : [];

			const parsedPageSize = z.coerce.number().min(10).parse(pageSize) ?? 10;
			const parsedPageNumber = z.coerce.number().min(1).parse(pageNumber) ?? 1;

			q = q ?? '';

			const filters = {
				best_for: parsedBestFor,
				categories: parsedCategories,
				common_products: parsedCommonProducts,
				is_deleted: deleted as string
			};

			logger.log(filters);

			const data = await query?.getItems(
				q as string,
				parsedPageSize,
				parsedPageNumber,
				collectionPath,
				searchKeyFilter,
				filters
			);

			res.status(200).send({ ...data });
		};
	};

	const updateItem = (collectionPath: string) => async (req: Request, res: Response) => {
		const { validatedItem } = req.body;
		const id = req.params.id;

		let status,
			message,
			item = null;

		try {
			item = await service?.updateItem(id, validatedItem, collectionPath);
			status = 200;
			message = 'Item is successfully added.';
		} catch {
			status = 400;
			message = 'Item is not updated. Please try again.';
		}

		res.status(status).send({ item, message });
	};

	const addItem =
		(collectionPath: string) => async (req: Request, res: Response, _: NextFunction) => {
			const { validatedItem } = req.body;

			let status, message;

			try {
				await service?.addItem(validatedItem, collectionPath);
				status = 200;
				message = 'Item is successfully added.';
			} catch {
				status = 400;
				message = 'Item is not added. Please try again.';
			}

			res.status(status).send({ message });
		};

	return {
		getItems,
		updateItem,
		addItem
	};
}
