import { Router } from 'express';
import { TMDBService } from '@core/infrastructure/services/media/tmdb';
import { getAcceptLanguage } from '@/utils/express';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { daysToSeconds, handleHardErrors } from '@/utils/standard';
import { MediaType } from '@/types/media';

// By default, a router cannot access parameters (req.params) defined in a parent route.
// Setting mergeParams: true allows the child router to see and use those parameters.
const router = Router({ mergeParams: true });

router.get('/:mediaId', async (req, res) => {
	try {
		// Queried data
		const type = (req.params as any).type as MediaType; // provided by parent mount '/:type'
		const mediaId = req.params.mediaId;
		const lang = getAcceptLanguage(req);

		// Check if id is valid
		if (!mediaId || mediaId?.trim() === '') {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Retrieve media details
		const data = await TMDBService[type == 'movies' ? 'movieDetails' : 'tvDetails'](mediaId, lang, false);

		// Check if media details exist
		if (!data) {
			return new HttpError({
				code: req.t('MOVIE_NOT_FOUND_CODE'),
				message: req.t('MOVIE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: data,
		}).sendResponse(res, daysToSeconds(7));
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
