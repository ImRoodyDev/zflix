import 'express';
import type { TFunction } from 'i18next';
import type { UserInfo } from '@api/middlewares/authentications';
import type { PlanInfo } from '@api/middlewares/subscription';

declare global {
	namespace Express {
		interface Request {
			user: UserInfo;
			plan: PlanInfo;
			t: TFunction<'translation'>;
			language: string;
		}
	}
}

declare module 'express-serve-static-core' {
	interface Request {
		user: UserInfo;
		plan: PlanInfo;
		t: TFunction<'translation'>;
		language: string;
	}
}
