import { Router } from 'express';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { TMDBService } from '@core/infrastructure/services/media/tmdb';
import RedisServiceInstance from '@core/infrastructure/data/redis';
import { HttpError } from '@/types/HttpError';
import { daysToSeconds, handleHardErrors } from '@/utils/standard';

const router = Router();

sharp.cache(false);
sharp.concurrency(10);

router.get('/:path', async (req, res) => {
	try {
		// Image path
		const imageWidth = parseInt(req.query.width as string) || 0;
		const imagePath = req.params.path;

		if (!imagePath) {
			return new HttpError({
				statusCode: 400,
				code: 'MISSING_IMAGE_PATH',
				message: 'Missing Image Path',
			}).sendResponse(res);
		}

		// Formatted image url
		const { imagePathUrl, id } = TMDBService.tmdbImageUrl(imagePath, imageWidth);

		const cacheKey = `webp:${id}`;
		const cachedImage = await RedisServiceInstance.getBuffer(cacheKey);

		if (cachedImage && cachedImage.byteLength > 0) {
			res.setHeader('Content-Type', 'image/webp');
			res.setHeader('Cache-Control', `public, max-age=${daysToSeconds(7)}`);
			return res.send(cachedImage);
		}

		// Fetch Image url
		const remoteResponse = await fetch(imagePathUrl);

		// Attach image
		if (remoteResponse.ok) {
			let imageBuffer: Buffer | null = await remoteResponse.buffer();
			const sharpInstance = sharp(imageBuffer).toFormat('webp').withMetadata();
			const webpBuffer = await sharpInstance.toBuffer();

			// Clean up the original buffer
			imageBuffer = null;

			// Clean up the sharp instance
			sharpInstance.destroy();

			// Cache in parallel without blocking response
			setImmediate(async () => {
				try {
					// Set image cache
					await RedisServiceInstance.setBuffer(cacheKey, webpBuffer, 2 * 24 * 60 * 60); // 2 days
				} catch (cacheError) {
					console.error('Caching failed:', cacheError);
				}
			});

			if (!res.headersSent) {
				res.setHeader('Content-Type', 'image/webp');
				res.setHeader('Cache-Control', `public, max-age=${daysToSeconds(7)}`);
				return res.send(webpBuffer);
			}
			return res;
		} else {
			return new HttpError({
				statusCode: remoteResponse.status,
				code: 'FETCH_FAILED',
				message: 'Failed to fetch image',
			}).sendResponse(res);
		}
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
