import { auth } from './config.js';

export async function getTestIdToken(uid) {
	const customToken = await auth.createCustomToken(uid);

	const response = await fetch(
		`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=any-arbitrary-key`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ token: customToken, returnSecureToken: true })
		}
	);
	const data = await response.json();

	return data.idToken;
}
