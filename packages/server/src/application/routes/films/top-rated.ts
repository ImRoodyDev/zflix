import { Router } from 'express';
import { TMDBService } from '@core/infrastructure/services/media/tmdb';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors, secondsLeftInDay } from '@/utils/standard';
import { getAcceptLanguage, getQueryNumber } from '@/utils/express';
import { HttpError } from '@/types/HttpError';
import User from '@core/models/user';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
// Type forwarded from parent router
import { MediaType } from '@/types/media';

// By default, a router cannot access parameters (req.params) defined in a parent route.
// Setting mergeParams: true allows the child router to see and use those parameters.
const router = Router({ mergeParams: true });

router.get('/', async (req: AuthenticatedRequest, res) => {
	try {
		// Queried data
		const type = (req.params as any).type as MediaType;
		const profileId = req.query.profileId as string | undefined;
		const page = getQueryNumber(req.query.page as string, 1);
		const lang = getAcceptLanguage(req);

		// Retrieve user profile information based on UUID
		const [isValidProfile, profile] = await User.getValidProfile(req.user.userId, profileId);

		// Check if provided profile is valid and belongs to the user
		if (!isValidProfile || !profile) {
			return new HttpError({
				code: req.t('PROFILE_NOT_FOUND_CODE'),
				message: req.t('PROFILE_NOT_FOUND_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Retrieve top rated media
		const topRatedMedia = await TMDBService[type == 'movies' ? 'mostRatedMovies' : 'mostRatedTv'](profile.certificationId, page, lang);

		// Check if top rated media exist
		if (!topRatedMedia) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: topRatedMedia,
		}).sendResponse(res, secondsLeftInDay());
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
