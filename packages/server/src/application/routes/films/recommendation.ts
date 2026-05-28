import { Router } from 'express';
import { TMDBService } from '@core/infrastructure/services/media/tmdb';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors, secondsLeftInDay } from '@/utils/standard';
import { getAcceptLanguage, getQueryNumber } from '@/utils/express';
import { HttpError } from '@/types/HttpError';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
// Type forwarded from parent router
import { MediaType } from '@/types/media';

// By default, a router cannot access parameters (req.params) defined in a parent route.
// Setting mergeParams: true allows the child router to see and use those parameters.
const router = Router({ mergeParams: true });

router.get('/:mediaId', async (req: AuthenticatedRequest, res) => {
	try {
		// Queried data
		const type = (req.params as any).type as MediaType;
		const mediaId = req.params.mediaId;
		const page = getQueryNumber(req.query.page as string, 1);
		const lang = getAcceptLanguage(req);

		// Check id
		if (!mediaId) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Retrieve recommended media
		const recommendedMedia = await TMDBService[type == 'movies' ? 'recommendationMovies' : 'recommendationTv'](mediaId, page, lang);

		// Check if recommended media exist
		if (!recommendedMedia) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: recommendedMedia,
		}).sendResponse(res, secondsLeftInDay());
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
