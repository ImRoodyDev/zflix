import { Router } from 'express';
import Activity from '@core/models/activity';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { IPTVOrgService } from '@core/infrastructure/services/media/iptv.org';

const router = Router({ mergeParams: true });

/**
 * POST /personalized/activities/add-channel/:channel_id
 * Record a channel view for the current user
 */
router.post('/:channel_id', async (req: AuthenticatedRequest, res) => {
	try {
		const channelId = req.params.channel_id;

		// Validate required fields
		if (!channelId || typeof channelId !== 'string') {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
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

		// Create or update activity record
		await Activity.createOrUpdate({
			id: channelId,
			userId: req.user.userId,
			profileId: '', // Not used for channel activities
			type: 'channel',
			runtimes: 0, // Not applicable for channels
			updatedAt: new Date(),
		});

		// Send success response
		return new HttpSuccess({
			message: req.t('SUCCESS_CREATED'),
		}).sendResponse(res);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
