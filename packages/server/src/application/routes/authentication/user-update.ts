import { Router } from 'express';
import User from '@core/models/user';
import { validateUserUpdate } from '@/utils/validator';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { handleHardErrors } from '@/utils/standard';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';

const router = Router();

router.post('/', async (req: AuthenticatedRequest, res) => {
	try {
		// Get update body and validate it
		const { name, newPassword, password } = req.body;

		// Check if both is not null
		if (!name && !password) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Validate the user update data
		const [error, value] = validateUserUpdate({ fullName: name, newPassword }, req.t);

		if (error) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: error.message.replace(/'/g, ''),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Find User by id
		const user = await User.findByPk(req.user.userId);

		// Check if user exists
		if (!user) {
			return new HttpError({
				code: req.t('UNEXISTENT_USER_CODE'),
				message: req.t('UNEXISTENT_USER_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Check if the password is correct
		const validPassword = await user.compareHashPassword(password);
		if (!validPassword) {
			return new HttpError({
				code: req.t('INVALID_CREDENTIALS_CODE'),
				message: req.t('INVALID_CREDENTIALS_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Update the user data with the new values
		await user.update({
			...(name && { accountHolder: value.fullName }),
			...(newPassword && { password: value.newPassword }),
		});

		// User information
		const userClientInfo = await User.userInformation(user.id);

		// Send response
		return new HttpSuccess({
			message: req.t('SUCCESS_USER_UPDATED_MESSAGE'),
			data: userClientInfo,
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
