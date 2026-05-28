import { Router } from 'express';
import Bookmark from '@core/models/bookmark';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { IPTVOrgService } from '@core/infrastructure/services/media/iptv.org';
import User from '@core/models/user';

const router = Router({ mergeParams: true });

/**
 * POST /personalized/bookmarks/add-channel/:channel_id
 * Add a channel to user's bookmarks
 */
router.post('/:channel_id', async (req: AuthenticatedRequest, res) => {
	try {
		const channelId = req.params.channel_id;
		const profileId = req.query.profileId as string | undefined;

		// Validate required fields
		if (!channelId || !profileId || typeof channelId !== 'string') {
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

		// Verify channel exists in IPTV.org
		const channels = await IPTVOrgService.getChannels();
		if (!channels || !channels.some((c) => c.id === channelId)) {
			return new HttpError({
				code: 'CHANNEL_NOT_FOUND',
				message: 'Channel does not exist',
				statusCode: 404,
			}).sendResponse(res);
		}

		// Create or update bookmark
		const [, created] = await Bookmark.findOrCreate({
			where: {
				id: channelId,
				userId: req.user.userId,
				type: 'channel',
			},
			defaults: {
				id: channelId,
				userId: req.user.userId,
				type: 'channel',
				profileId: profileId, // Not used for channel bookmarks but required by model
			},
		});

		if (!created) {
			return new HttpSuccess({
				message: 'Channel already bookmarked',
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
