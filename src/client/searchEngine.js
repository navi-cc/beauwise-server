import { onCall } from 'firebase-functions/https';
import { performSearch } from './services/typesense-search.js';

export const searchEngine = onCall(async (req, _) => {
	const { searchQuery } = req.data;

	const response = await performSearch(searchQuery);

	return {
		searchedData: response.searchedData
	};
});
