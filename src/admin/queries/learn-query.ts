import { db } from '@src/admin/config.js';
import { FieldPath, type DocumentData } from 'firebase-admin/firestore';

export interface LearnQuery {
	getItems(
		collectionPath: string,
		pageSize: number,
		pageParam: string
	): Promise<PaginationResult>;
}

export type PaginationResult = {
	data: Array<DocumentData>;
	pagination: {
		total_documents: number;
		total_pages: number;
		cursor: string;
	};
};

export function createLearnQuery(): LearnQuery {
	const getItems = async (
		collectionPath: string,
		pageSize: number,
		pageParam: string
	): Promise<PaginationResult> => {
		const collectionReference = db.collection(collectionPath);
		const aggregateSnapshot = await collectionReference.count().get();

		const query = pageParam
			? collectionReference
					.orderBy(FieldPath.documentId())
					.startAfter(pageParam)
					.limit(pageSize)
			: collectionReference.orderBy(FieldPath.documentId()).limit(pageSize);

		const response = await query.get();

		const items = response.docs.map((item) => item.data());
		const cursor = response.docs[response.docs.length - 1].id;
		const total_documents = aggregateSnapshot.data().count;
		const total_pages = Math.ceil(total_documents / pageSize);

		return {
			data: items,
			pagination: {
				cursor,
				total_documents,
				total_pages
			}
		};
	};
	return {
		getItems
	};
}
