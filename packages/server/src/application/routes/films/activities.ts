import { Router } from 'express';
import Activity from '@core/models/activity';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import { getPaginations } from '@/utils/express';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import User from '@core/models/user';
import { MediaType } from '@/types/media';

// By default, a router cannot access parameters (req.params) defined in a parent route.
// Setting mergeParams: true allows the child router to see and use those parameters.
const router = Router({ mergeParams: true });

router.get('/:profileId', async (req: AuthenticatedRequest, res) => {
	try {
		// Queried data
		const type = req.params.type as MediaType; // from parent mount '/:type'
		const profileId = req.params.profileId;
		// const lang = getAcceptLanguage(req);
		const { offset, limit } = getPaginations(req.query.page as string, 20);

		// Check if provided profile is valid and belongs to the user
		if (!(await User.isValidProfile(req.user.userId, profileId))) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Retrieve all activities for the profile
		const activities =
			(await Activity.findAll({
				where: {
					profileId: profileId,
					userId: req.user.userId,
					type: type,
				},
				limit: limit,
				offset: offset,
				order: [['updatedAt', 'DESC']],
			})) || [];

		// Fetch media details for all activities ( UNOPTIMIZED: )
		// const data = await TMDBService[type == 'movies' ? 'getMoviesDetails' : 'getTvShowsDetails'](
		// 	activities.map((a) => a.id),
		// 	lang,
		// 	false
		// );

		const data = activities.map((activity) => ({
			id: activity.id,
			type: activity.type,
			external_id: activity.id,
		}));

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: data,
		}).sendResponse(res, 10);
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
