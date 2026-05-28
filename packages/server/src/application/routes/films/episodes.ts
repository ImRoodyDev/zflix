import { Router } from 'express';
import { TMDBService } from '@core/infrastructure/services/media/tmdb';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors, hoursToSeconds } from '@/utils/standard';
import { getQueryNumber, getAcceptLanguage } from '@/utils/express';
import { HttpError } from '@/types/HttpError';

// mergeParams to access parent ':type'
const router = Router({ mergeParams: true });

// Episodes for a series: parent mount '/:type/episodes' with type === 'series'
router.get('/:mediaId/:season', async (req, res) => {
	try {
		// Queried data
		const seriesId = req.params.mediaId; // keep variable naming for tmdb call
		const lang = getAcceptLanguage(req);
		const season = getQueryNumber(req.params.season, undefined as any) as number | undefined;
		const type = (req.params as any).type;

		// Ensure correct media type
		if (type !== 'series') {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Check if id is valid
		if (!seriesId || seriesId?.trim() === '' || season === undefined) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Retrieve episodes
		const episodes = await TMDBService.tvEpisodes(seriesId, season, lang);

		// Check if episodes exist
		if (!episodes) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: episodes,
		}).sendResponse(res, hoursToSeconds(2));
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
