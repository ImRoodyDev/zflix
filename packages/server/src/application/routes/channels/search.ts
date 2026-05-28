/**
 * IPTV Channels - Search Route
 * Search for TV channels by name, category, country, or language
 * Supports filtering and returns results sorted by relevance
 */

import { Router } from 'express';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { daysToSeconds, handleHardErrors } from '@/utils/standard';
import { IPTVOrgService } from '@core/infrastructure/services/media/iptv.org';
import { IPTVChannelFilters } from '@/types/iptv.org';

// Enable parameter inheritance from parent routes
const router = Router({ mergeParams: true });

/**
 * GET /channels/search
 * Search channels by query with optional filters (country, category, language)
 * Returns results sorted by cosine similarity relevance score
 */
router.get('/', async (req, res) => {
	try {
		// Extract search query from request
		const { q, country, category, language, page = '1' } = req.query;
		const query = typeof q === 'string' ? q.trim() : '';

		// Allow filter-only requests when country or category is provided.
		if (!q && !country && !category) {
			return new HttpError({
				code: req.t('INVALID_SEARCH_QUERY_CODE'),
				message: req.t('INVALID_SEARCH_QUERY_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Build filter options from query parameters
		const filters: IPTVChannelFilters = {
			...(country && typeof country === 'string' && { country: country.toUpperCase() }),
			...(category && typeof category === 'string' && { category: category.toLowerCase() }),
			...(language && typeof language === 'string' && { language }),
			limit: 20,
			page: parseInt(page as string, 10) || 1,
			include_nsfw: true,
		};

		// Use relevance search when query exists, otherwise run a paged filtered channels list.
		// Namespace handles query trimming and pagination.
		const results =
			query.length > 0
				? await IPTVOrgService.searchChannels(query, filters)
				: await IPTVOrgService.getChannels(filters);

		// Handle search failures
		if (!results) {
			return new HttpError({
				code: req.t('SEARCH_FAILED_CODE'),
				message: req.t('SEARCH_FAILED_MESSAGE'),
				statusCode: 500,
			}).sendResponse(res);
		}

		// Check if any results were found
		if (!results) {
			return new HttpError({
				code: req.t('REQUESTED_RESOURCE_NOT_FOUND_CODE'),
				message: req.t('REQUESTED_RESOURCE_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Return successful search results
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: results,
		}).sendResponse(res, daysToSeconds(1)); // Cache for 1 day
	} catch (err) {
		return handleHardErrors(err, req, res);
	}
});

export default router;
