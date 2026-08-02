import { onCall } from 'firebase-functions/https';
import { performSearch } from './services/typesense-search.js';

export const searchEngine = onCall(async (req, _) => {
	const { query, collectionKey } = req.data;

	const response = await performSearch(query, collectionKey);

	return {
		searchedData: response.searchedData
	};
});
