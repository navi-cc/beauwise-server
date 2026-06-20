import Typesense from 'typesense';

// Note
// Properly configure this initialization, use specific key (client search only key)
// or an admin key to use all different types of operations.
const typesenseClient = new Typesense.Client({
	nodes: [{ host: '127.0.0.1', port: '8108', protocol: 'http' }],
	apiKey: 'xyz',
	connectionTimeoutSeconds: 30
});

const performMultiSearch = async (searchParams, commonSearchParams) => {
	return await typesenseClient.multiSearch.perform(searchParams, commonSearchParams);
};

const performSearch = async (searchQuery, collectionName) => {
	const searchParams = {
		q: searchQuery,
		query_by: collectionName ?? 'ingredient_name',
		num_typos: 1,
		limit: 4
	};

	const searchResults = await typesenseClient
		.collections('ingredients_glossary_search')
		.documents()
		.search(searchParams);
	const searchedData = searchResults.hits.map(({ document }) => document);

	return { searchedData };
};

export { typesenseClient, performMultiSearch, performSearch };
