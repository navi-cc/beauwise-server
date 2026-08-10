import type {
	LearnItem,
	LearnItemInstance,
	LearnRepository
} from '@definitions/learn-types.js';
import { db } from '@src/admin/config.js';
import { AppError } from '@utils/error.js';
import crypto from 'crypto';
import { logger } from 'firebase-functions/logger';
export function createLearnRepository<T extends LearnItem, U extends LearnItemInstance>(
	createLearnItemInstance: (item: T) => U
): LearnRepository<T, U> {
	const save = async (
		id: string,
		item: T,
		collectionPath: string
	): Promise<LearnItem> => {
		return (await db
			.collection(collectionPath)
			.doc(id)
			.set(item as object, { merge: true })) as unknown as LearnItem;
	};

	const add = async (item: T, collectionPath: string): Promise<LearnItem> => {
		const newItemInstance = createLearnItemInstance(item);
		const newItem = newItemInstance.get();

		const id = `${generateId(item.name)}-${crypto.randomUUID()}`;
		return (await db
			.collection(collectionPath)
			.doc(id)
			.create({ ...newItem, id })) as unknown as LearnItem;
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

function generateId(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '_')
		.replace(/[^a-z0-9_]/g, '');
}
