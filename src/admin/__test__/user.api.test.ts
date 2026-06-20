// NOTE
// Only run this test if the firebase emulator is active
// You can start the emulator via `npm run dev`

import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { getTestIdToken } from '../getTestIdToken.js';
import { getTestIdUser } from '../getTestIdUser.js';
import { getEmulatorStatus } from '../getEmulatorStatus.js';
import { seed } from '../seed.js';
import {
	initializeTestEnvironment,
	type RulesTestEnvironment
} from '@firebase/rules-unit-testing';

const isEmulatorActive = await getEmulatorStatus();
const api = 'http://127.0.0.1:5001/demo-beauwise/us-central1/admin';

describe.runIf(isEmulatorActive)('user router', () => {
	let testUserId: string | undefined;
	let testTokenId: string;

	let testApp = {} as RulesTestEnvironment;
	beforeAll(async () => {
		testApp = await initializeTestEnvironment({ projectId: 'demo-beauwise' });
	});

	beforeEach(async () => {
		const projectId = 'demo-beauwise';
		const authEmulatorUrl = `http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`;

		await fetch(authEmulatorUrl, {
			method: 'DELETE'
		});
		await testApp.clearFirestore();

		await seed();
		testUserId = await getTestIdUser();
		testTokenId = await getTestIdToken(testUserId);
	});

	describe('/users', () => {
		describe('/get', () => {
			test('should return the users and a status of 200', async () => {
				const response = await request(api)
					.get(`/users`)
					.auth(testTokenId, { type: 'bearer' })
					.query({
						maxPage: 10
					});

				const results = response.body;

				expect(results.users.length).toBeGreaterThanOrEqual(1);
				expect(response.statusCode).toBe(200);
			});
		});

		// I won't test other methods such as disable or change password since they produce the same flow.
		describe('patch user email', () => {
			test("should return 200 if the user's email is successfully updated", async () => {
				const response = await request(api)
					.patch(`/users/${testUserId}/email`)
					.auth(testTokenId, { type: 'bearer' })
					.send({
						updatedItem: 'foobar@gmail.com'
					});

				expect(response.statusCode).toBe(200);
			});

			// test("should return 4xx if the user's email is not changed", async () => {
			// 	const response = await request(api)
			// 		.patch('/users/:id/email')
			// 		.query({ id: 'this_must_be_user_id' })
			// 		.send({
			// 			newEmail: 'foobar@gmail.com'
			// 		});

			// 	expect(response.statusCode).toBeGreaterThanOrEqual(400);
			// });
		});
	});
});
