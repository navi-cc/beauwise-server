import type {
	LearnRepository,
	LearnService,
	LearnItem,
	BaseLearnItemInstace
} from '@definitions/learn-types.js';
import { logger } from 'firebase-functions/logger';

export function createLearnService<
	TItem extends LearnItem,
	TItemInstance extends BaseLearnItemInstace<TItem>
>(repository: LearnRepository<TItem, TItemInstance>): LearnService<TItem> {
	const updateItem = async (
		itemId: string,
		updatedItem: TItem,
		collectionPath: string
	): Promise<TItem> => {
		const item = await repository.findById(itemId, collectionPath);

		logger.log('service layer data', updatedItem);
		item.update(updatedItem);

		return (await repository.save(itemId, item.get(), collectionPath)) as TItem;
	};

	const addItem = async (newItem: TItem, collectionPath: string): Promise<LearnItem> => {
		return await repository.add(newItem, collectionPath);
	};

	return {
		updateItem,
		addItem
	};
}
