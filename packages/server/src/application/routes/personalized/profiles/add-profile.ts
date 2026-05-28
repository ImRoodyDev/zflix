import { Router } from 'express';
import Profile from '@core/models/profile';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { validateProfile } from '@/utils/validator';

const router = Router();

router.post('/', async (req: AuthenticatedRequest, res) => {
	try {
		// Validate input
		const [error, payload] = validateProfile(req.body, req.t);

		if (error) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Create profile
		const [profile, created] = await Profile.findOrCreate({
			where: {
				userId: req.user.userId,
				profileName: payload.profileName,
			},
			defaults: {
				...payload,
				primary: false,
			} as any,
		});

		if (!created) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('PROFILE_ALREADY_EXISTS_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		return new HttpSuccess({
			message: req.t('SUCCESS_CREATED'),
			data: await profile.profileInformation(),
		}).sendResponse(res);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
