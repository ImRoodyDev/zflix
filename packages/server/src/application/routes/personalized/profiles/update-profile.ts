import { Router } from 'express';
import Profile from '@core/models/profile';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { validateProfile } from '@/utils/validator';
import User from '@core/models/user';

const router = Router();

router.post('/:profileId', async (req: AuthenticatedRequest, res) => {
	try {
		// Parse profile ID from URL parameters
		const profileId = req.params.profileId;

		// Validate input
		if (!profileId) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Validate profile data
		const [error, payload] = validateProfile(req.body, req.t);

		if (error) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: error.message,
				statusCode: 400,
			}).sendResponse(res);
		}

		// Check if provided profile is valid and belongs to the user
		if (!(await User.isValidProfile(req.user.userId, profileId))) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Update profile
		await Profile.update(
			{
				...payload,
			},
			{
				where: {
					id: profileId,
					userId: req.user.userId,
				},
			},
		);

		// Send success response with updated profile data
		return new HttpSuccess({
			message: req.t('SUCCESS_UPDATED'),
			data: await Profile.profileInformationByPk(profileId),
		}).sendResponse(res);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
