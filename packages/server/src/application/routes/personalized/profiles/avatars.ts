import { Router } from 'express';
import Avatar from '@core/models/avatar';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors, daysToSeconds } from '@/utils/standard';
import { HttpError } from '@/types/HttpError';

const router = Router();

router.get('/', async (req, res) => {
	try {
		// Retrieve all avatars
		const avatars = (await Avatar.findAll()) ?? [];

		// If empty avatars
		if (avatars.length === 0) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: avatars.map((a) => ({ id: a.id, imagePath: a.imagePath ?? null })),
		}).sendResponse(res, daysToSeconds(30));
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
