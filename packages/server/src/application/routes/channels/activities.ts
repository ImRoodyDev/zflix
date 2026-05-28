/**
 * IPTV Channels - Activities Route (GET only)
 * Retrieve user viewing history for TV channels
 * For adding/removing activities, use /personalized/activities/add-channel or /personalized/activities/remove-channel
 */

import { Router } from 'express';
import Activity from '@core/models/activity';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { getPaginations } from '@/utils/express';
import { IPTVOrgService } from '@core/infrastructure/services/media/iptv.org';

// Enable parameter inheritance from parent routes
const router = Router({ mergeParams: true });

/**
 * GET /channels/activities
 * Retrieve user's channel watching history with pagination
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
	try {
		// Query parameters
		const { offset, limit } = getPaginations(req.query.page as string, 20);

		// Get user's channel activities from database
		const activities = await Activity.findAll({
			where: {
				userId: req.user.userId,
				type: 'channel',
			},
			limit: limit,
			offset,
			order: [['updatedAt', 'DESC']],
		});

		// If no activities found, return empty array
		if (!activities || activities.length === 0) {
			return new HttpSuccess({
				message: req.t('SUCCESS_RETRIEVED'),
				data: [],
			}).sendResponse(res);
		}

		// Efficiently fetch only the channels present in the user's watch history
		const channelIds = activities.map((a) => a.id);
		const data = await IPTVOrgService.getChannelsByIds(channelIds);

		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: data,
		}).sendResponse(res, 60);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
