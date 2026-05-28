/**
 * IPTV Channels - Details Route
 * Retrieves full details for a specific channel including feeds, streams, logos and EPG guides
 * The channel ID is expected to be URI-encoded and is decoded before lookup
 */

import { Router } from 'express';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { daysToSeconds, handleHardErrors } from '@/utils/standard';
import { IPTVOrgService } from '@core/infrastructure/services/media/iptv.org';

// Enable parameter inheritance from parent routes
const router = Router({ mergeParams: true });

/**
 * GET /channels/details/:id
 * Returns full channel details: channel metadata, feeds, streams, logos (with colors) and EPG guides
 *
 * @param id - URI-encoded IPTV.org channel ID (e.g. encodeURIComponent('France3.fr'))
 */
router.get('/:id', async (req, res) => {
	try {
		const rawId = req.params.id;

		// Validate presence
		if (!rawId || rawId.trim().length === 0) {
			return new HttpError({
				code: req.t('INVALID_CHANNEL_ID_CODE'),
				message: req.t('INVALID_CHANNEL_ID_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Decode the URI-encoded channel ID
		let channelId: string;
		try {
			channelId = decodeURIComponent(rawId.trim());
		} catch {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Fetch full channel details from IPTV.org service
		const details = await IPTVOrgService.getChannelDetails(channelId);

		// Channel not found in the IPTV.org dataset
		if (!details || !details.channel) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: details.channel,
		}).sendResponse(res, daysToSeconds(1)); // Cache for 1 day
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
