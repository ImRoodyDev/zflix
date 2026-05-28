import { Router } from 'express';
import Activity from '@core/models/activity';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';

const router = Router({ mergeParams: true });

/**
 * POST /personalized/activities/remove-channel/:channel_id
 * Remove a channel from user's viewing history
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

		// Delete activity record
		const result = await Activity.destroy({
			where: {
				id: channel_id,
				userId: req.user.userId,
				type: 'channel',
			},
			force: true,
		});

		if (result === 0) {
			return new HttpSuccess({
				message: 'Activity not found',
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
