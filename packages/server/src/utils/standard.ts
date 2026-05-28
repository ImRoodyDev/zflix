import { isHttpError, HttpError } from '@/types/HttpError';
import { isProcessError } from '@/types/ProcessError';
import { Response, Request } from 'express';
import Logger from './logger';

export function commaSplitter(input: string | undefined): string[] {
	if (!input) return [];
	return input.split(',').map((part) => part.trim());
}

export async function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const daysToSeconds = (days: number): number => {
	return Math.floor(days * 24 * 60 * 60);
};

export const minutesToSeconds = (minutes: number): number => {
	return Math.floor(minutes * 60);
};

export const hoursToSeconds = (hours: number): number => Math.floor(hours * 60 * 60);

export const secondsLeftInDay = (): number => {
	const now = new Date();
	const secondsElapsed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
	return 24 * 60 * 60 - secondsElapsed;
};

export const customParseInt = (input: string | undefined): number => {
	if (input == null) return Number.NaN;
	return /^[0-9]+$/.test(input) ? Number.parseInt(input, 10) : Number.NaN;
};

export const shuffleArray = <T>(array: T[] | undefined): T[] => {
	if (!array) return [];
	for (let i = array.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
};

export const parseDate = (dateString: string): Date | null => {
	const timestamp = Date.parse(dateString);
	if (isNaN(timestamp)) {
		return null;
	}
	return new Date(timestamp);
};

export const isDevelopment = () => process.env.ENV !== 'production';

/**
 * Normalizes and logs errors without sending a response
 * Use this for view routes where you want to render an error page
 */
export const normalizeError = (error: any): HttpError => {
	// If already an HttpError, return it
	if (isHttpError(error)) {
		Logger.error('An error occurred:', error);
		return error;
	}

	// If ProcessError, convert to HttpError
	if (isProcessError(error)) {
		Logger.error('An error occurred:', error);
		return new HttpError({
			statusCode: error.status || 500,
			code: error.code || 'PROCESS_ERROR',
			message: error.message || 'An error occurred',
		});
	}

	// Log the error details
	Logger.error('An error occurred:', error);

	// Convert generic error to HttpError
	return new HttpError({
		statusCode: 500,
		code: 'SERVER_ERROR',
		message: error?.message || 'An internal server error occurred',
	});
};

export const handleHardErrors = (error: any, req: Request, res: Response) => {
	// Log the error details
	Logger.error('An error occurred:', error);

	if (isDevelopment()) {
		if (isProcessError(error)) {
			return error.sendHttpResponse(res);
		}
		if (isHttpError(error)) return error.sendResponse(res);

		return new HttpError({
			statusCode: 500,
			code: 'SERVER_ERROR',
			message: error?.message || 'An internal server error occurred',
			details: error?.details,
		}).sendResponse(res);
	}

	return res.status(500).json({
		code: req.t('SERVER_ERROR_CODE'),
		message: req.t('SERVER_ERROR_MESSAGE'),
	});
};

export const sanitizeMessage = (value: string): string =>
	value.replace(/\\"/g, '"').replace(/"/g, '').replace(/\s+/g, ' ').trim();

/**
 * Calculate cosine similarity between two strings
 * Returns a score between 0 and 1, where 1 is perfect match
 *
 * Algorithm:
 * 1. Convert strings to character vectors
 * 2. Calculate dot product of vectors
 * 3. Calculate magnitude (length) of each vector
 * 4. Divide dot product by product of magnitudes
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Cosine similarity score (0-1)
 *
 * @example
 * cosineSimilarity('hello', 'hello') // 1.0
 * cosineSimilarity('hello', 'hallo') // ~0.866
 * cosineSimilarity('hello', 'world') // ~0.408
 */
export const cosineSimilarity = (str1: string, str2: string): number => {
	// Normalize strings to lowercase for case-insensitive comparison
	const s1 = str1.toLowerCase();
	const s2 = str2.toLowerCase();

	// Create character frequency maps
	const createVector = (str: string): Record<string, number> => {
		const vector: Record<string, number> = {};
		for (const char of str) {
			vector[char] = (vector[char] || 0) + 1;
		}
		return vector;
	};

	const vector1 = createVector(s1);
	const vector2 = createVector(s2);

	// Get all unique characters
	const allChars = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);

	// Calculate dot product
	let dotProduct = 0;
	for (const char of allChars) {
		dotProduct += (vector1[char] || 0) * (vector2[char] || 0);
	}

	// Calculate magnitudes
	let magnitude1 = 0;
	let magnitude2 = 0;
	for (const char of allChars) {
		magnitude1 += Math.pow(vector1[char] || 0, 2);
		magnitude2 += Math.pow(vector2[char] || 0, 2);
	}
	magnitude1 = Math.sqrt(magnitude1);
	magnitude2 = Math.sqrt(magnitude2);

	// Avoid division by zero
	if (magnitude1 === 0 || magnitude2 === 0) {
		return s1 === s2 ? 1 : 0;
	}

	// Calculate and return cosine similarity
	return dotProduct / (magnitude1 * magnitude2);
};
