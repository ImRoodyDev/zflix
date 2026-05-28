import { Router } from 'express';
import Bookmark from '@core/models/bookmark';
import { TMDBService } from '@core/infrastructure/services/media/tmdb';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { getAcceptLanguage, getQueryNumber } from '@/utils/express';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import User from '@core/models/user';

const router = Router({ mergeParams: true });

router.get('/:profileId', async (req: AuthenticatedRequest, res) => {
	try {
		// Query data
		const profileId = req.params.profileId;
		const lang = getAcceptLanguage(req);
		const page = getQueryNumber(req.query.page as string, 1) ?? 1;
		const limit = 20;
		const offset = (page - 1) * limit;

		// Check if provided profile is valid and belongs to the user
		if (!(await User.isValidProfile(req.user.userId, profileId))) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Profiles Bookmarks
		const bookmarks = await Bookmark.findAll({
			where: {
				profileId: profileId,
				userId: req.user.userId,
			},
			limit: limit,
			offset: offset,
			order: [['createdAt', 'DESC']],
		});

		// If no bookmarks found, return empty array
		if (!bookmarks || bookmarks.length === 0) {
			return new HttpSuccess({
				message: req.t('SUCCESS_RETRIEVED'),
				data: [],
			}).sendResponse(res);
		}

		// Merge back in original order
		const data = await TMDBService.getDetailsByIds(
			bookmarks.map((a) => ({ id: a.id, type: a.type as 'movies' | 'series' })),
			lang,
		);

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: data,
		}).sendResponse(res, 60);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
