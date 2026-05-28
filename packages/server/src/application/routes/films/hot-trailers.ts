import { Router } from 'express';
import { MovieDetails, TMDBService, TvDetails } from '@core/infrastructure/services/media/tmdb';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors, secondsLeftInDay } from '@/utils/standard';
import { getAcceptLanguage } from '@/utils/express';
import { ValidateMediaType } from '@api/middlewares/media-type';
import { MediaType } from '@/types/media';

const router = Router();

router.get('/:type', ValidateMediaType, async (req, res) => {
	try {
		// Queried data
		const type = req.params.type as MediaType;
		const lang = getAcceptLanguage(req);

		// Retrieve all trending media
		const trending = (await TMDBService[type == 'movies' ? 'trendingMovies' : 'trendingTv']('day', 1, lang))?.filter((e) => e !== null)?.slice(0, 5) || [];

		// Retrieve detailed information for each trending movie
		const data = await TMDBService.getDetailsByIds<MovieDetails | TvDetails>(
			trending.map((item) => ({
				id: item.id,
				type: item.type,
			})),
			lang
		);

		// Add cache param for each teaser video
		data.forEach((detail) => {
			if (detail.teaser) {
				detail.teaser = detail.teaser + '?ch=true';
			}
		});

		// Check if details exist
		if (data.length <= 0) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: data,
		}).sendResponse(res, secondsLeftInDay());
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
