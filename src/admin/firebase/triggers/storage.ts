import { storage } from '@src/admin/config.js';
import { logger } from 'firebase-functions/logger';

import { onObjectFinalized } from 'firebase-functions/v2/storage';
import path from 'path';
import sharp from 'sharp';

export const storageOnUploadFinished = onObjectFinalized(
	{ cpu: 2, region: 'asia-east2', bucket: 'beauwise-asia' },
	async (e) => {
		const filePath = e.data.name;
		const contentType = e.data.contentType;

		logger.log('file content type', contentType);
		logger.log('file info', filePath);

		if (!contentType?.startsWith('image/')) {
			logger.info('The content is not an image');
			return;
		}

		if (contentType === 'image/webp') {
			logger.info('The content is already a webp file');
			return;
		}

		const bucket = storage.bucket();
		const downloadResponse = await bucket.file(filePath).download();
		const imageBuffer = downloadResponse[0];

		const newImageBuffer = await sharp(imageBuffer).webp({ quality: 100 }).toBuffer();
		const newFileName = path.parse(filePath).name + '.webp';

		logger.log('new file name', newFileName);

		const basePath = path.dirname(filePath).split('/');

		const savePath = path.posix.join(...basePath, newFileName);

		logger.info('base path', basePath);
		logger.info('saving path', savePath);
		await bucket
			.file(savePath)
			.save(newImageBuffer, { metadata: { contentType: 'image/webp' } });

		return;
	}
);

export const storageTriggers = {
	storageOnUploadFinished
};
