import { Router } from 'express';
import Billing from '@core/models/billing';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { HttpSuccess } from '@/types/HttpSuccess';
import { HttpError } from '@/types/HttpError';
import { handleHardErrors } from '@/utils/standard';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res) => {
	try {
		// Now, fetch plans based on the user's country
		const billings = await Billing.findAll({
			where: { userId: req.user.userId },
		});

		// Send to client
		if (billings.length > 0) {
			return new HttpSuccess({
				message: req.t('SUCCESS_RETRIEVED'),
				data: await Billing.getBillingsInformation(billings),
			}).sendResponse(res);
		} else {
			return new HttpError({
				code: req.t('BILLING_NOT_FOUND_CODE'),
				message: req.t('BILLING_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
