import { Router } from 'express';
import { clearCookies } from '@app/controllers/tokens';
import { handleHardErrors } from '@/utils/standard';
import { HttpSuccess } from '@/types/HttpSuccess';

const router = Router();

router.post('/', async (req, res) => {
	try {
		// Clear tokens
		clearCookies(res);

		// Send response
		return new HttpSuccess({
			message: req.t('SUCCESS_LOGOUT_MESSAGE'),
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
