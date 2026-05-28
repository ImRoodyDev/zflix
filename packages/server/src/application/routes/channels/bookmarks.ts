/**
 * IPTV Channels - Bookmarks Route (GET only)
 * Retrieve user's saved/favorite TV channels
 * For adding/removing bookmarks, use /personalized/bookmarks/add-channel or /personalized/bookmarks/remove-channel
 */

import { Router } from 'express';
import Bookmark from '@core/models/bookmark';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { getPaginations } from '@/utils/express';
import { IPTVOrgService } from '@core/infrastructure/services/media/iptv.org';

// Enable parameter inheritance from parent routes
const router = Router({ mergeParams: true });

/**
 * GET /channels/bookmarks
 * Retrieve user's bookmarked channels with optional category/country filters
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
	try {
		// Query parameters
		const { offset, limit } = getPaginations(req.query.page as string, 20);

		// Get user's bookmarks from database
		const bookmarks = await Bookmark.findAll({
			where: {
				userId: req.user.userId,
				type: 'channel',
			},
			limit: limit,
			offset,
			order: [['createdAt', 'DESC']],
		});

		// If no bookmarks found, return empty array
		if (!bookmarks || bookmarks.length === 0) {
			return new HttpSuccess({
				message: req.t('SUCCESS_RETRIEVED'),
				data: [],
			}).sendResponse(res);
		}

		// Efficiently fetch only the bookmarked channels
		const bookmarkIds = bookmarks.map((b) => b.id);
		const data = await IPTVOrgService.getChannelsByIds(bookmarkIds);

		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: data,
		}).sendResponse(res, 30);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
