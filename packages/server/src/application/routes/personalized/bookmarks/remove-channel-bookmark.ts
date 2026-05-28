import { Router } from 'express';
import Bookmark from '@core/models/bookmark';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';

const router = Router({ mergeParams: true });

/**
 * POST /personalized/bookmarks/remove-channel/:channel_id
 * Remove a channel from user's bookmarks
 */
router.post('/:channel_id', async (req: AuthenticatedRequest, res) => {
	try {
		const { channel_id } = req.params;

		// Validate channel ID
		if (!channel_id || channel_id.trim().length === 0) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Remove bookmark
		const result = await Bookmark.destroy({
			where: {
				id: channel_id,
				userId: req.user.userId,
				type: 'channel',
			},
			force: true,
		});

		if (result === 0) {
			return new HttpSuccess({
				message: 'Channel not found in bookmarks',
			}).sendResponse(res);
		}

		return new HttpSuccess({
			message: req.t('SUCCESS_DELETED'),
		}).sendResponse(res);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
