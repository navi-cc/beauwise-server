import type {
	LearnRepository,
	LearnService,
	LearnItem,
	BaseLearnItemInstace
} from '@definitions/learn-types.js';

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

		item.update(updatedItem);

		const { id } = item.get();

		await repository.save(id, item.get(), collectionPath);

		return item.get();
	};

	const addItem = async (newItem: TItem, collectionPath: string): Promise<void> => {
		repository.add(newItem, collectionPath);
	};

	return {
		updateItem,
		addItem
	};
}
