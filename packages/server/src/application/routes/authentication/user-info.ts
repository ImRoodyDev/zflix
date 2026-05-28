import { Router } from 'express';
import User from '@core/models/user';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { handleHardErrors } from '@/utils/standard';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res) => {
	try {
		// Find User by id
		const user = await User.userInformation(req.user.userId);

		// Check if user exists
		if (!user) {
			return new HttpError({
				code: req.t('UNEXISTENT_USER_CODE'),
				message: req.t('UNEXISTENT_USER_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Send response
		return new HttpSuccess({
			message: req.t('SUCCESS_USER_FOUND_MESSAGE'),
			data: user,
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
