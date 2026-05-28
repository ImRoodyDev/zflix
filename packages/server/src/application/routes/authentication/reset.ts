import { Router } from 'express';
import { verifyResetToken } from '@app/controllers/tokens';
import { validatePassword } from '@/utils/validator';
import { handleHardErrors } from '@/utils/standard';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';

const router = Router();

router.post('/:resetId', async (req, res) => {
	try {
		// Validate request body
		const resetId = req.params.resetId;
		const resetToken = req.body.token;
		const [passwordError, passwordRequest] = validatePassword({ password: req.body.password }, req.t);

		// Validate the token type
		if (typeof resetToken !== 'string') {
			return new HttpError({
				code: req.t('UNAUTHORIZED_CODE'),
				message: req.t('UNAUTHORIZED_MESSAGE'),
				statusCode: 401,
			}).sendResponse(res);
		}

		// Check if password is valid
		if (passwordError) {
			return new HttpError({
				code: req.t('INVALID_PASSWORD_CODE'),
				message: passwordError.details[0].message,
				statusCode: 400,
			}).sendResponse(res);
		}

		// Token validity
		const { valid, user } = await verifyResetToken(resetToken, resetId);

		//  Check if user exsist
		if (!user) {
			return new HttpError({
				code: req.t('UNEXISTENT_USER_CODE'),
				message: req.t('UNEXISTENT_USER_MESSAGE'),
				statusCode: 401,
			}).sendResponse(res);
		}

		// Check if token is valid
		if (!valid) {
			return new HttpError({
				code: req.t('INVALID_TOKEN_CODE'),
				message: req.t('INVALID_TOKEN_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Check if the new password is the same as the old password
		const samePassword = await user.compareHashPassword(passwordRequest.password);

		// Check if the user password is the same as the new password
		if (samePassword) {
			return new HttpError({
				code: req.t('INVALID_PASSWORD_CODE'),
				message: req.t('SAME_PASSWORD_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// User Model
		const isPasswordReset = await user.changePasswordReset(passwordRequest.password);

		// Check if the password was reset
		if (!isPasswordReset) {
			return new HttpError({
				code: req.t('SERVER_ERROR_CODE'),
				message: req.t('SERVER_ERROR_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Send response
		return new HttpSuccess({
			message: req.t('SUCCESS_PASSWORD_RESET_MESSAGE'),
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
