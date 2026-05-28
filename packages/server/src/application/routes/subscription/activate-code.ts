import { Router } from 'express';
import AccessCode from '@core/models/access-code';
import Subscription from '@core/models/subscription';
import User from '@core/models/user';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { HttpSuccess } from '@/types/HttpSuccess';
import { HttpError } from '@/types/HttpError';
import { handleHardErrors } from '@/utils/standard';
import { getAcceptLanguage } from '@/utils/express';
import { sendActivationEmail } from '@app/controllers/subscription';
import { Transaction } from 'sequelize';

const router = Router();

router.post('/', async (req: AuthenticatedRequest, res) => {
	// To handle transaction rollback in case of error
	let transaction: Transaction | null = null;
	try {
		const { code } = req.body;
		const locale = getAcceptLanguage(req);

		// Check if the code is provided
		if (!code || typeof code !== 'string') {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Start transaction
		transaction = await AccessCode.sequelize!.transaction();

		// Get the access code with lock
		const accessCode = await AccessCode.findOne({ where: { code }, lock: true, transaction });

		// Check to see if the access code exists and is not activated
		if (!accessCode || accessCode.used) {
			await transaction.rollback();
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Lock the user to prevent concurrent activations
		const user = await User.findByPk(req.user.userId, { transaction, lock: true });

		if (!user) {
			await transaction.rollback();
			return new HttpError({
				statusCode: 404,
				code: req.t('UNEXISTENT_USER_CODE'),
				message: req.t('UNEXISTENT_USER_MESSAGE'),
			}).sendResponse(res);
		}

		// Check to see if user not subscribed to the plan
		const [, isSubscribed] = await Subscription.findUserSubscriptions(user.id, transaction);
		if (isSubscribed) {
			await transaction.rollback();
			return new HttpError({
				statusCode: 409,
				code: req.t('SUBSCRIPTION_ALREADY_EXISTS_CODE'),
				message: req.t('SUBSCRIPTION_ALREADY_EXISTS_MESSAGE'),
			}).sendResponse(res);
		}

		// Create subscription
		const subscription = await Subscription.create(
			{
				active: true,
				planId: accessCode.planId,
				userId: req.user.userId,
				status: 'ACTIVE',
				startAt: new Date(),
				expiredAt: accessCode.getExpiryDate(),
				source: 'CODE',
			},
			{ transaction },
		);

		// Update the user subscription
		await user.update({ subscriptionId: subscription.id }, { transaction });

		// Set the accessCode used to true
		await accessCode.update({ used: true, userId: req.user.userId, subscriptionId: subscription.id }, { transaction });

		// Commit transaction
		await transaction.commit();
		transaction = null;

		// Send email
		await sendActivationEmail(subscription, locale);

		// Subscription client data
		const data = await subscription.subscriptionInformation();

		// Send the response
		return new HttpSuccess({
			message: req.t('SUCCESS_CREATED'),
			data,
		}).sendResponse(res);
	} catch (error) {
		if (transaction) await transaction.rollback();
		return handleHardErrors(error, req, res);
	}
});

export default router;
