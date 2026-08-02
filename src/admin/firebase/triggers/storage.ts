import { storage } from '@src/admin/config.js';
import { logger } from 'firebase-functions/logger';
import { onObjectFinalized } from 'firebase-functions/storage';
import path from 'path';
import sharp from 'sharp';
export const storageOnUploadFinished = onObjectFinalized({ cpu: 1 }, async (e) => {
	const filePath = e.data.name; // File path in the bucket.
	const contentType = e.data.contentType; // File content type.
	if (!contentType?.startsWith('image/')) {
		return;
	}

	if (contentType === 'image/webp' || filePath.endsWith('.webp')) {
		return;
	}

	const bucket = storage.bucket();
	const downloadResponse = await bucket.file(filePath).download();
	const imageBuffer = downloadResponse[0];

	const newImageBuffer = await sharp(imageBuffer).webp({ quality: 100 }).toBuffer();
	const newFileName = path.basename(filePath).split('.')[0] + '.webp';

	const basePath = path.dirname(filePath).split('/');

	const savePath = path.posix.join(...basePath, newFileName);

	await bucket.file(savePath).save(newImageBuffer);
	await bucket.file(filePath).delete();

	return;
});

export const storageTriggers = {
	storageOnUploadFinished
};
