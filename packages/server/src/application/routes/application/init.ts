import { getCertifications } from '@core/constants/tmdb';
import Plan from '@core/models/plan';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { minutesToSeconds, handleHardErrors, isDevelopment } from '@/utils/standard';
import { Router } from 'express';
import { PAYMENT_SOURCES } from '@core/constants/payments-processors';
import { getClientLocation, isPublicIPv4, requestClientIp } from '@core/infrastructure/services/tracker';

const router = Router();

router.get('/', async (req, res) => {
	try {
		// Retrieve the IP address from the request object
		const clientIp = requestClientIp(req);

		// If IP address is not found, return an error response
		// Check if the IP address is a public IPv4 address
		if (!clientIp || (!isPublicIPv4(clientIp) && !isDevelopment())) {
			return new HttpError({
				code: req.t('INVALID_LOCATION_CODE'),
				message: req.t('INVALID_LOCATION_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Device geolocation and time information
		const deviceGeolocation = await getClientLocation(clientIp);
		if (!deviceGeolocation.country) {
			return new HttpError({
				code: req.t('INVALID_LOCATION_CODE'),
				message: req.t('INVALID_LOCATION_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Find all plans on the database
		const plans = (await Plan.findPlanByCountry(deviceGeolocation.countryCode ?? 'NL')) ?? [];
		const filteredPlans = plans.filter((plan) => plan.isActive);

		// Send to client
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: {
				paymentProcessors: PAYMENT_SOURCES,
				certifications: getCertifications(),
				plans: Plan.plansInformation(filteredPlans),
			},
		}).sendResponse(res, minutesToSeconds(1));
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
