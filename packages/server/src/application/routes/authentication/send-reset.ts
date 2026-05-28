import { Router } from 'express';
import User from '@core/models/user';
import { generateResetToken } from '@app/controllers/tokens';
import { MailerController } from '@core/infrastructure/services/mailer';
import { validateEmail, validateUrl } from '@/utils/validator';
import { handleHardErrors } from '@/utils/standard';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { getAcceptLanguage } from '@/utils/express';

const router = Router();

router.post('/', async (req, res) => {
	try {
		// Validate request body
		const language = getAcceptLanguage(req);
		const [invalidEmail, email] = validateEmail(req.body.email, req.t);

		// Get referer in the request header
		const referer = req.get('referer');

		if (!referer || validateUrl(referer) === false) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		if (invalidEmail) {
			return new HttpError({
				code: req.t('INVALID_EMAIL_CODE'),
				message: invalidEmail.details[0].message,
				statusCode: 400,
			}).sendResponse(res);
		}

		// Find the user by email, and only fetch necessary fields
		const user = await User.findOne({
			where: { email },
			attributes: ['id', 'email', 'role', 'resetCount'],
		});

		// If user doesn't exist, return a 404 error
		if (!user) {
			return new HttpError({
				code: req.t('UNEXISTENT_USER_CODE'),
				message: req.t('UNEXISTENT_USER_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Generate reset password
		const [resetToken, resetId] = await generateResetToken(user.id, user.resetCount);

		// Send to email the reset token
		const mailSent = await MailerController.sendResetPassword(
			{
				email: user.email,
				ip: req.ip || '',
				resetToken,
				resetId,
				clientDomain: referer,
			},
			language,
		);

		// If email is sent successfully, return a 200 response
		if (mailSent) {
			return new HttpSuccess({
				message: req.t('SUCCESS_RESET_EMAIL_SENT_MESSAGE'),
			}).sendResponse(res);
		} else {
			return new HttpError({
				code: req.t('SERVER_ERROR_CODE'),
				message: req.t('EMAIL_SEND_FAILED_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
