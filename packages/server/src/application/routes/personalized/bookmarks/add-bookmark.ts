import { Router } from 'express';
import Bookmark from '@core/models/bookmark';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import User from '@core/models/user';

const router = Router({ mergeParams: true });

router.post('/:type/:mediaId', async (req: AuthenticatedRequest, res) => {
	try {
		const type = req.params.type as 'movies' | 'series';
		const mediaId = req.params.mediaId;
		const profileId = req.query.profileId as string | undefined;

		// Validate input
		if (!profileId || !mediaId || !['movies', 'series'].includes(type)) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Check if provided profile is valid
		if (!(await User.isValidProfile(req.user.userId, profileId))) {
			return new HttpError({
				code: req.t('UNAUTHORIZED_CODE'),
				message: req.t('UNAUTHORIZED_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Create bookmark
		const [, created] = await Bookmark.findOrCreate({
			where: {
				id: mediaId,
				profileId: profileId,
				userId: req.user.userId,
				type: type,
			},
			defaults: {
				id: mediaId,
				profileId: profileId,
				userId: req.user.userId,
				type: type,
			},
		});

		if (!created) {
			return new HttpSuccess({
				message: 'Bookmark already existed',
			}).sendResponse(res);
		}

		return new HttpSuccess({
			message: req.t('SUCCESS_CREATED'),
		}).sendResponse(res);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
