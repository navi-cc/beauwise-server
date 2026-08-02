import Typesense, { type DocumentSchema, type SearchResponse } from 'typesense';
import { typesense } from '@src/admin/config.js';

export interface SearchQuery {
	search(
		searchParams: Typesense.SearchParams<object, string>,
		collectionKey: string
	): Promise<SearchResponse<DocumentSchema>>;
}

export function createSearchQuery(): SearchQuery {
	const search = async (
		searchParams: Typesense.SearchParams<object, string>,
		collectionKey: string
	) => {
		const searchResults = await typesense
			.collections(collectionKey)
			.documents()
			.search(searchParams);

		return searchResults;
	};

	return { search };
}
