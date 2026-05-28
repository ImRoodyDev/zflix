import { Router } from 'express';
import { HttpError } from '@/types/HttpError';
import { handleHardErrors } from '@/utils/standard';
import logger from '@/utils/logger';

const router = Router();

router.get('/:path', async (req, res) => {
	try {
		// Video path
		const videoKey = req.params.path;
		if (!videoKey) {
			return new HttpError({
				statusCode: 400,
				code: 'INVALID_PATH',
				message: 'Invalid video path',
			}).sendResponse(res);
		}

		// Check if caching is enabled
		// const cacheVideo = req.query.ch == 'true';

		// NOT IMPLEMENTED: For now, we always generate the video on demand without caching.
		return res.status(501).json({ message: 'Video generation is not implemented yet' });
	} catch (error) {
		logger.error(`Error processing video for key ${req.params.path}:`, error);
		return handleHardErrors(error, req, res);
	}
});

export default router;
