import { Router } from 'express';
import Activity from '@core/models/activity';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import User from '@core/models/user';
import { getQueryNumber } from '@/utils/express';

const router = Router({ mergeParams: true });

router.post('/:mediaId', async (req: AuthenticatedRequest, res) => {
	try {
		const seriesId = req.params.mediaId;
		const profileId = req.query.profileId as string | undefined;
		const season = getQueryNumber(req.query.season, 1);
		const episode = getQueryNumber(req.query.episode, 1);
		const runtime = getQueryNumber(req.query.seconds, 0);

		// Validate input
		if (!profileId || !seriesId) {
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

		// Create or update activity
		await Activity.createOrUpdate({
			id: seriesId,
			profileId: profileId,
			userId: req.user.userId,
			type: 'series',
			runtimes: [{ epId: `${season}x${episode}`, runtime }],
			updatedAt: new Date(),
		});

		return new HttpSuccess({
			message: req.t('SUCCESS_CREATED'),
		}).sendResponse(res);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
