import { getCertifications } from '@core/constants/tmdb';
import Plan from '@core/models/plan';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { minutesToSeconds, handleHardErrors } from '@/utils/standard';
import { Router } from 'express';
import { PAYMENT_SOURCES } from '@core/constants/payments-processors';

const router = Router();

router.get('/', async (req, res) => {
	try {
		const country = ((req.query.country ?? '') as string).toLocaleUpperCase();

		if (!country) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Find all plans on the database
		const plans = (await Plan.findPlanByCountry(country)) ?? [];
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
