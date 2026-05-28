import { Response, Router } from 'express';
import { MovieDetails, TMDBService, TvDetails } from '@core/infrastructure/services/media/tmdb';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors, secondsLeftInDay, shuffleArray } from '@/utils/standard';
import { getAcceptLanguage } from '@/utils/express';
import { SubscriptionRequest } from '@api/middlewares/subscription';
import { MediaType } from '@/types/media';

// By default, a router cannot access parameters (req.params) defined in a parent route.
// Setting mergeParams: true allows the child router to see and use those parameters.
const router = Router({ mergeParams: true });
const TRENDING_LENGTH = 5;

router.get('/', async (req: SubscriptionRequest, res: Response) => {
	try {
		// Query data
		const type = (req.params as any).type as MediaType;
		const lang = getAcceptLanguage(req);

		// Retrieve all trending media
		const trendingRaw = (await TMDBService[type == 'movies' ? 'trendingMovies' : 'trendingTv']('day', 1, lang))
			?.filter((e) => e !== null)
			?.slice(0, TRENDING_LENGTH);

		// Check if trending media exist
		if (!trendingRaw || trendingRaw.length === 0) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Shuffle trending media
		const trending = shuffleArray(trendingRaw);

		// Resolve all promises using settledData utility
		const data = await TMDBService.getDetailsByIds<MovieDetails | TvDetails>(
			trending.map((t) => ({ id: t.id, type: type == 'movies' ? 'movies' : 'series' })),
			lang,
		);

		// For each teaser video add cache param
		data.forEach((detail) => {
			if (detail.teaser) {
				detail.teaser = detail.teaser + '?ch=true';
			}
		});

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: data,
		}).sendResponse(res, secondsLeftInDay());
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
