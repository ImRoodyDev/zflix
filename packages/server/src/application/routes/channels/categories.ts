/**
 * IPTV Channels - Categories Route
 * Retrieves available TV channel categories (sports, entertainment, news, etc.)
 * Supports filtering by language and pagination
 */

import { Router } from 'express';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { getAcceptLanguage } from '@/utils/express';
import { daysToSeconds, handleHardErrors } from '@/utils/standard';
import { CATEGORIES } from '@core/constants/iptv.org';

// By default, a router cannot access parameters (req.params) defined in a parent route.
// Setting mergeParams: true allows the child router to see and use those parameters.
const router = Router({ mergeParams: true });

/**
 * GET /channels/categories
 * Returns array of all available channel categories (sports, news, entertainment, etc.)
 */
router.get('/', async (req, res) => {
	try {
		// Resolve user language and return localized category constants.
		const language = getAcceptLanguage(req);
		const categories = CATEGORIES[language] || CATEGORIES['en'];

		// Validate response
		if (!categories || categories.length === 0) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Cache for 30 days since categories data rarely changes
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: categories,
		}).sendResponse(res, daysToSeconds(30));
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
