import { Router } from 'express';
import { getAcceptLanguage } from '@/utils/express';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { daysToSeconds, handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { MediaType } from '@/types/media';
import { getConstantMovieGenres, getConstantTvGenres } from '@core/constants/tmdb';

// By default, a router cannot access parameters (req.params) defined in a parent route.
// Setting mergeParams: true allows the child router to see and use those parameters.
const router = Router({ mergeParams: true });

router.get('/', async (req: AuthenticatedRequest, res) => {
	try {
		// Queried data
		const type = (req.params as any).type as MediaType;
		const lang = getAcceptLanguage(req);

		// Retrieve all media genres
		const genres = type == 'movies' ? getConstantMovieGenres(lang) : getConstantTvGenres(lang); // await TMDBService[type == 'movies' ? 'moviesGenres' : 'tvGenres'](lang);

		// Check if genres exist — reject an empty list too so an empty response is
		// never cached for the full 30 days.
		if (!genres?.length) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: genres,
		}).sendResponse(res, daysToSeconds(30));
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
