import { handleHardErrors } from '@/utils/standard';
import { AuthenticatedRequest } from './authentications';
import type { NextFunction, Response } from 'express';
import { HttpError } from '@/types/HttpError';
import { isSubscriptionActive2 } from '@app/controllers/subscription';

export type PlanInfo = {
	id: string;
	tier: number;
};

export interface SubscriptionRequest extends AuthenticatedRequest {
	plan: {
		id: string;
		tier: number;
	};
}

export const SubscriptionMiddleware = async (req: SubscriptionRequest, res: Response, next: NextFunction) => {
	try {
		// Check if user has an active subscription
		if (!req.user || !req.user.subscriptionId) {
			return new HttpError({
				code: req.t('UNACTIVE_SUBSCRIPTION_CODE'),
				message: req.t('UNACTIVE_SUBSCRIPTION_MESSAGE'),
				statusCode: 403,
			}).sendResponse(res);
		}

		// Verify subscription status
		const { active, tier } = await isSubscriptionActive2(req.user.subscriptionId);

		if (!active) {
			return new HttpError({
				code: req.t('UNACTIVE_SUBSCRIPTION_CODE'),
				message: req.t('UNACTIVE_SUBSCRIPTION_MESSAGE'),
				statusCode: 403,
			}).sendResponse(res);
		}

		// Attach plan info to request
		req.plan = {
			id: req.user.subscriptionId,
			tier,
		};

		return next();
	} catch (error) {
		handleHardErrors(error, req, res);
	}
};
