import { Router } from 'express';
import { TMDBService } from '@core/infrastructure/services/media/tmdb';
import { HttpError } from '@/types/HttpError';
import { daysToSeconds, handleHardErrors } from '@/utils/standard';

const router = Router();

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
		const { imagePathUrl } = TMDBService.tmdbImageUrl(imagePath, imageWidth);

		res.setHeader('Cache-Control', `public, max-age=${daysToSeconds(7)}`);

		// Redirect user to the image url
		return res.redirect(imagePathUrl);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
