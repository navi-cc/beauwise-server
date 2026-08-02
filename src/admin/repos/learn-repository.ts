import type {
	LearnItem,
	LearnItemInstance,
	LearnRepository
} from '@definitions/learn-types.js';
import { db } from '@src/admin/config.js';
import { AppError } from '@utils/error.js';

export function createLearnRepository<T extends LearnItem, U extends LearnItemInstance>(
	createLearnItemInstance: (item: T) => U
): LearnRepository<T, U> {
	const save = async (id: string, item: T, collectionPath: string): Promise<void> => {
		await db
			.collection(collectionPath)
			.doc(id)
			.set(item as object, { merge: true });
	};

	const add = async (item: T, collectionPath: string): Promise<void> => {
		const newItemInstance = createLearnItemInstance(item);
		const newItem = newItemInstance.get();
		await db.collection(collectionPath).doc(newItem.id).create(newItem);
	};

	const findById = async (id: string, collectionPath: string): Promise<U> => {
		const document = await db.collection(collectionPath).doc(id).get();

		if (!document.exists) {
			throw new AppError(
				'We could not find the find the specified document from our records.',
				400
			);
		}

		const learnItem = document.data() as T;
		return createLearnItemInstance(learnItem);
	};

	return {
		save,
		findById,
		add
	};
}
