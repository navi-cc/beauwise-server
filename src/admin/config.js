import { initializeApp } from 'firebase-admin/app';
import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import Typesense from 'typesense';

if (process.env.NODE_ENV === 'development') {
	initializeApp({
		projectId: 'beauwise-1687a',
		storageBucket: 'beauwise-1687a.firebasestorage.app'
	});
} else {
	initializeApp({
		storageBucket: 'beauwise-1687a.firebasestorage.app'
	});
}

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

const typesenseNodes =
	process.env.NODE_ENV === 'development'
		? [{ host: '127.0.0.1', port: 8108, protocol: 'http' }]
		: [{ host: 'search.beauwise.tech', port: 443, protocol: 'https' }];

const typesenseApiKey =
	process.env.NODE_ENV === 'development' ? 'xyz' : process.env.TYPESENSE_API_KEY;

const typesense = new Typesense.Client({
	nodes: typesenseNodes,
	apiKey: typesenseApiKey,
	connectionTimeoutSeconds: 30
});

export { auth, db, storage, typesense };
