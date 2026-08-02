import { db } from '@src/admin/config.js';
import type { SearchQuery } from './search-query.js';
import type { DocumentSchema, SearchParams, SearchResponse } from 'typesense';
import type { LearnItem } from '@definitions/learn-types.js';

type FilterParameters = {
	[key: string]: string[] | undefined | string;
	best_for: string[];
	categories: string[];
	common_products: string[];
	is_deleted: string | undefined;
};
export interface LearnQuery {
	getItems(
		query: string,
		pageSize: number,
		pageNumber: number,
		collectionPath: string,
		searchKeyFilter: string,
		filters?: FilterParameters | undefined
	): Promise<PaginationResult>;
}

export type PaginationResult = {
	data: LearnItem[];
	pagination: {
		total_documents: number;
		total_pages: number;
	};
};

export function createLearnQuery(searchQuery: SearchQuery): LearnQuery {
	const getItems = async (
		query: string,
		pageSize: number,
		pageNumber: number,
		collectionPath: string,
		searchKeyFilter: string,
		filters: FilterParameters
	): Promise<PaginationResult> => {
		const collectionReference = db.collection(collectionPath);

		const searchParams: SearchParams<DocumentSchema> = {
			q: query.length <= 0 ? '*' : query,
			query_by: 'name',
			sort_by: 'name:asc',
			page: pageNumber,
			limit: pageSize
		};

		const hasFilters =
			filters.categories.length > 0 ||
			filters.common_products.length > 0 ||
			filters.best_for.length > 0 ||
			filters.is_deleted !== undefined;

		if (hasFilters) {
			const items: string[] = [];
			let filterString;

			for (const key in filters) {
				const hasItems = (filters[key]?.length ?? 0) > 0;

				if (filters[key] !== 'is_deleted' && hasItems) {
					items.push(`${key}:=[${filters[key]}]`);
				}

				if (key === 'is_deleted' && filters[key] !== undefined) {
					items.push(`${key}:${filters[key]}`);
				}
			}

			if (items.length > 1) {
				filterString = items.join(' || ');
			} else {
				filterString = items[0];
			}

			searchParams['filter_by'] = filterString;
		}

		const searchResults: SearchResponse<DocumentSchema> = await searchQuery.search(
			searchParams,
			searchKeyFilter
		);

		let data: LearnItem[];

		const hits = searchResults.hits?.length ?? 0;
		const hasResult = searchResults.found && hits;

		if (hasResult) {
			const documentIds = searchResults.hits?.map(({ document }) => document.id) ?? [];
			const documentRefs = documentIds.map((id: string) => collectionReference.doc(id));
			const snapshot = await db.getAll(...documentRefs);
			data = snapshot.map((doc) => doc.data()) as LearnItem[];
		} else {
			data = [];
		}

		const totalDocuments = searchResults?.out_of;
		const totalFound = searchResults?.found;
		const totalPages = Math.ceil(totalFound / pageSize);

		return {
			data,
			pagination: {
				total_documents: totalDocuments,
				total_pages: totalPages
			}
		};
	};
	return {
		getItems
	};
}

// query = collectionReference.orderBy(FieldPath.documentId());
// query =
// 	filter === 'deleted'
// 		? query.where('is_deleted', '==', true)
// 		: filter === 'active'
// 			? query.where('is_deleted', '==', false)
// 			: query;

// const total_deleted_documents =
// 	filter === 'deleted' ? await query.count().get() : undefined;

// query = pageParam
// 	? query.startAfter(pageParam).limit(pageSize)
// 	: query.limit(pageSize);

// const response = await query.get();

// const items = response.docs.map((item) => item.data());
// const cursor = response.docs[response.docs.length - 1]?.id;
// const total_documents = aggregateSnapshot.data().count;
// const total_pages =
// 	filter === 'deleted'
// 		? Math.ceil(total_deleted_documents.data().count / pageSize)
// 		: Math.ceil(total_documents / pageSize);

// return {
// 	data: items,
// 	pagination: {
// 		cursor,
// 		total_documents,
// 		total_pages
// 	}
// };
