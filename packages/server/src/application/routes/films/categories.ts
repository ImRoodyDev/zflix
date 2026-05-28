import { Router } from 'express';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { daysToSeconds, handleHardErrors } from '@/utils/standard';
import { getAcceptLanguage } from '@/utils/express';
import { TMDBService } from '@core/infrastructure/services/media/tmdb';

// By default, a router cannot access parameters (req.params) defined in a parent route.
// Setting mergeParams: true allows the child router to see and use those parameters.
const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
	try {
		// Queried data
		// const type = (req.params as any).type as MediaType;
		const lang = getAcceptLanguage(req);

		// Retrieve media categories
		const categories = TMDBService.mediaCategories(lang);

		// Check if categories are available
		if (!categories) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: categories,
		}).sendResponse(res, daysToSeconds(30));
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
