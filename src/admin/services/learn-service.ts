import type {
	LearnRepository,
	LearnService,
	LearnItem,
	BaseLearnItemInstace
} from '@definitions/learn-types.js';
import { AppError } from '@utils/error.js';
import type { MythFact } from '@zod/learn-schema.js';
import { addDays } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';
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

		if (item.get().is_deleted) {
			throw new AppError('Item cannot be updated. The item is deleted', 500);
		}

		logger.log('service layer data', updatedItem);
		item.update(updatedItem);

		if (collectionPath === 'myth_facts' && 'topics' in updatedItem) {
			const data = updatedItem as MythFact;

			let modifiedItem = {
				...data,
				topics: data.topics.map((item) => {
					const thirtyDaysDuration = addDays(new Date(), 30);

					return item?.is_deleted && !item?.scheduledDeleteAt
						? {
								...item,
								scheduledDeleteAt: Timestamp.fromDate(thirtyDaysDuration)
							}
						: {
								fact: item.fact,
								fileHash: item.fileHash,
								imageId: item.imageId,
								is_deleted: Boolean(item?.is_deleted),
								myth: item.myth,
								topic: item.topic
							};
				})
			};

			const hasPendingTopicDeletions = modifiedItem.topics.some(
				(item) => item.is_deleted
			);

			modifiedItem = hasPendingTopicDeletions
				? {
						...modifiedItem,
						hasPendingTopicDeletions: true
					}
				: { ...modifiedItem, hasPendingTopicDeletions: false };

			item.update(modifiedItem as unknown as TItem);
		}

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
