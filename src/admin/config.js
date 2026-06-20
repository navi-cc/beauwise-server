import { initializeApp } from 'firebase-admin/app';
import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (process.env.NODE_ENV === 'development') {
	initializeApp({
		projectId: 'demo-beauwise'
	});
} else {
	initializeApp();
}

const auth = getAuth();
const db = getFirestore();

export { auth, db };
