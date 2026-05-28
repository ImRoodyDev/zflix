import { Router } from 'express';
import { isUUID } from 'validator';
import Profile, { ProfileOutputInformation } from '@core/models/profile';
import { handleHardErrors } from '@/utils/standard';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';

const router = Router();

router.get('/:profileId', async (req, res) => {
	try {
		// Get profile ID
		const profileId = req.params.profileId;

		// Validate UUID
		if (!isUUID(profileId)) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Find profile associated infrormation
		const profile = await Profile.profileInformationByPk(profileId);

		// Check if profile exists
		if (!profile) {
			return new HttpError({
				code: req.t('PROFILE_NOT_FOUND_CODE'),
				message: req.t('PROFILE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Send response
		return new HttpSuccess<ProfileOutputInformation>({
			message: req.t('SUCCESS_PROFILE_RETRIEVED_MESSAGE'),
			data: profile,
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
