import { Router } from 'express';
import { TMDBService } from '@core/infrastructure/services/media/tmdb';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors, secondsLeftInDay } from '@/utils/standard';
import { getAcceptLanguage, getQueryNumber } from '@/utils/express';
import { validateSearchQuery } from '@/utils/validator';
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
		const query = (req.query.query as string) || undefined;
		const lang = getAcceptLanguage(req);
		const sortGenre = getQueryNumber(req.query.srtg as string, undefined as any) as number | undefined;
		const page = getQueryNumber(req.query.page as string, 1);

		// Validate search query
		if (!query || !validateSearchQuery(query)) {
			return new HttpError({
				code: req.t('INVALID_SEARCH_QUERY_CODE'),
				message: req.t('INVALID_SEARCH_QUERY_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

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

		// Retrieve search results
		const searchResults = await TMDBService[type == 'movies' ? 'searchMovies' : 'searchTv'](
			query,
			profile.certificationId,
			page,
			lang,
			{
				sortGenre,
			},
		);

		if (!searchResults) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Send response to client-side
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: searchResults,
		}).sendResponse(res, secondsLeftInDay());
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
