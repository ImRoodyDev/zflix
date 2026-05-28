import type { Response } from 'express';
import { isDevelopment, sanitizeMessage } from '@utils/standard';

export interface HttpErrorPayload<TErrorDetails = unknown> {
	code: string;
	message: string;
	details?: TErrorDetails;
	statusCode?: number;
	expose?: boolean;
}

/**
 * Custom HTTP Error class for structured error handling in API responses
 * @template TErrorDetails - Type for additional error details (can be any type)
 * @extends Error - Built-in JavaScript Error class
 * @example
 * throw new ProcessError({
 *   code: 'NOT_FOUND',
 *   message: 'User not found',
 *   details: { userId: 123 },
 *   statusCode: 404
 * });
 */
export class HttpError<TErrorDetails = unknown> extends Error {
	/** Unique error code identifier (e.g., 'VALIDATION_ERROR', 'NOT_FOUND') */
	public readonly code: string;

	/** Additional error details with type safety via generics */
	public readonly details?: TErrorDetails;

	/** HTTP status code (e.g., 404, 500, 401) */
	public readonly statusCode: number;

	/** Whether to expose error details to the client (use false for sensitive errors) */
	public readonly expose: boolean;

	/**
	 * Creates a new ProcessError instance
	 * @param payload - Error configuration object containing all error properties
	 */
	constructor(payload: HttpErrorPayload<TErrorDetails>) {
		// Call parent Error constructor with the error message
		super(sanitizeMessage(payload.message));

		// Set the error name for better stack traces and debugging
		this.name = 'HttpError';

		// Assign the unique error code
		this.code = payload.code;

		// Assign additional error details
		this.details = payload.details;

		// Set HTTP status code, defaulting to 500 (Internal Server Error) if not provided
		this.statusCode = payload.statusCode ?? 500;

		// Set expose flag, defaulting to true to show error details to client
		this.expose = payload.expose ?? isDevelopment();

		// Capture the stack trace for debugging (maintains proper stack trace in V8 engines)
		Error.captureStackTrace?.(this, HttpError);
	}

	/**
	 * Generates the error payload for HTTP responses
	 * @param withDetails - Whether to include error details in the payload (default: false)
	 * @returns An object containing the error code, message, and optionally details
	 */
	public statusPayload(withDetails = false) {
		return {
			code: this.code,
			message: this.message,
			details: withDetails ? this.details : undefined,
		};
	}

	/**
	 * Sends the error as an HTTP response using the provided Express Response object
	 * @param res - Express Response object to send the error response
	 * @param withDetails - Whether to include error details in the response (default: false)
	 * @returns The Express Response object with the error status and JSON payload
	 */
	public sendResponse(res: Response, withDetails = isDevelopment()) {
		// !!!!!!!! WARNING !!!!!!!! CAUTION !!!!!!!!
		// Important: Only expose stack trace in development mode if the expose flag is true
		if (this.expose && isDevelopment()) {
			return res.status(this.statusCode).json({
				...this.statusPayload(withDetails),
				error: this.stack,
			});
		}
		return res.status(this.statusCode).json(this.statusPayload(withDetails));
	}
}

/**
 * Type guard to check if an error is an instance of ProcessError
 */
export const isHttpError = (error: unknown): error is HttpError => error instanceof HttpError;
