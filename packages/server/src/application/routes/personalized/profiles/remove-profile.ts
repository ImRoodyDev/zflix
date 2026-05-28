import { Router } from 'express';
import Profile from '@core/models/profile';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import User from '@core/models/user';

const router = Router();

router.get('/:profileId', async (req: AuthenticatedRequest, res) => {
	try {
		// Parse profile ID from URL parameters
		const profileId = req.params.profileId;

		// Check if provided profile is valid and belongs to the user
		if (!(await User.isValidProfile(req.user.userId, profileId))) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Check if profile is primary (cannot delete primary profile)
		const profile = await Profile.findByPk(profileId);

		if (!profile || profile?.primary) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('CANNOT_DELETE_PRIMARY_PROFILE_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Delete profile
		await profile.destroy({ force: true });

		return new HttpSuccess({
			message: req.t('SUCCESS_DELETED'),
		}).sendResponse(res);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
