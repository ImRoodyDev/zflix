import { Router } from 'express';
import Plan from '@core/models/plan';
import User from '@core/models/user';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { HttpSuccess } from '@/types/HttpSuccess';
import { HttpError } from '@/types/HttpError';
import { handleHardErrors, daysToSeconds } from '@/utils/standard';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res) => {
	try {
		// Find the user country
		const user = await User.findByPk(req.user.userId);

		if (!user) {
			return new HttpError({
				code: req.t('UNEXISTENT_USER_CODE'),
				message: req.t('UNEXISTENT_USER_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Find all plans on the database
		const plans = (await Plan.findPlanByCountry(user.countryCode))?.filter((plan) => plan.isActive) || [];

		// Send to client
		if (plans.length > 0) {
			return new HttpSuccess({
				message: req.t('SUCCESS_RETRIEVED'),
				data: Plan.plansInformation(plans),
			}).sendResponse(res, daysToSeconds(1));
		} else {
			return new HttpError({
				code: req.t('PLAN_NOT_FOUND_CODE'),
				message: req.t('PLAN_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
