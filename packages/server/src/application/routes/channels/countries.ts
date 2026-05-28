/**
 * IPTV Channels - Countries Route
 * Retrieves list of countries that have available TV channels
 * Useful for filtering channels by geographical location
 */

import { Router } from 'express';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { daysToSeconds, handleHardErrors } from '@/utils/standard';
import { COUNTRIES } from '@core/constants/iptv.org';

// Enable parameter inheritance from parent routes
const router = Router({ mergeParams: true });

/**
 * GET /channels/countries
 * Returns array of countries with available channels (code, name, flag, languages)
 */
router.get('/', async (req, res) => {
	try {
		// Return static country constants.
		const countries = COUNTRIES;

		// Validate response
		if (!countries || countries.length === 0) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Cache for 30 days since countries data is static
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: countries,
		}).sendResponse(res, daysToSeconds(30));
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
