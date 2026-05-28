import { Router } from 'express';
import Activity from '@core/models/activity';
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
		// Query profile index
		const profileId = req.params.profileId;
		const lang = getAcceptLanguage(req);
		const page = getQueryNumber(req.query.page as string, 1);
		const limit = 20;
		const offset = (page - 1) * limit;

		// Check if provided profile is valid and
		if (!(await User.isValidProfile(req.user.userId, profileId))) {
			return new HttpError({
				code: req.t('UNAUTHORIZED_CODE'),
				message: req.t('UNAUTHORIZED_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Retrieve all activities associated with the user
		const activities = await Activity.findAll({
			where: {
				profileId: profileId,
				userId: req.user.userId,
			},
			limit: limit,
			offset: offset,
			order: [['updatedAt', 'DESC']],
		});

		// Fetch media details for all activities
		if (!activities || activities.length === 0) {
			return new HttpSuccess({
				message: req.t('SUCCESS_RETRIEVED'),
				data: [],
			}).sendResponse(res, 60);
		}

		// Merge back in original order
		const data = await TMDBService.getDetailsByIds(
			activities.map((a) => ({ id: a.id, type: a.type as 'movies' | 'series' })),
			lang,
		);

		// Send response
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: data,
		}).sendResponse(res, 60);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
