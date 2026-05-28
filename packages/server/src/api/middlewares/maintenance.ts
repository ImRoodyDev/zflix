import AppConfiguration from '@core/models/app-configuration';
import { HttpError } from '@/types/HttpError';
import { handleHardErrors } from '@/utils/standard';
import type { NextFunction, Request, Response } from 'express';

// PERFORMANCE: Cache maintenance mode to avoid a DB query on every single request.
// The flag is refreshed every 30 seconds — a good balance between responsiveness
// (toggling maintenance mode takes effect within 30 s) and reducing DB load.
let cachedMaintenanceMode: boolean | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

export const MaintenanceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const now = Date.now();

		// Re-fetch from DB only when the cached value has expired
		if (cachedMaintenanceMode === null || now > cacheExpiry) {
			const config = await AppConfiguration.findByPk(1);
			cachedMaintenanceMode = config?.maintenanceMode ?? false;
			cacheExpiry = now + CACHE_TTL_MS;
		}

		if (cachedMaintenanceMode) {
			return new HttpError({
				code: req.t('SERVER_MAINTENANCE_CODE'),
				message: req.t('SERVER_MAINTENANCE_MESSAGE'),
				statusCode: 503,
			}).sendResponse(res);
		}

		return next();
	} catch (error) {
		handleHardErrors(error, req, res);
	}
};
