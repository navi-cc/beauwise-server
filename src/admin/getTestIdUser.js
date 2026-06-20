/* eslint-disable no-console */

import { auth } from './config.js';

export async function getTestIdUser() {
	try {
		const response = await auth.listUsers(10);

		return response.users[response.users.length - 1].uid;
	} catch {
		console.error('Error reading or parsing JSON:');
	}
}
