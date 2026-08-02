import { typesense } from '@src/admin/config.js';

// import Typesense from 'typesense';
// Note
// Properly configure this initialization, use specific key (client search only key)
// or an admin key to use all different types of operations.

const performMultiSearch = async (searches) => {
	return typesense.multiSearch.perform({ searches });
};

const performSearch = async (searchQuery, collectionKey) => {
	const searchParams = {
		q: searchQuery,
		query_by: 'name',
		num_typos: 1,
		limit: 4
	};

	const searchResults = await typesense
		.collections(collectionKey)
		.documents()
		.search(searchParams);
	const searchedData = searchResults.hits.map(({ document }) => document);

	return { searchedData };
};

export { typesense, performMultiSearch, performSearch };
