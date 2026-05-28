import {NextFunction, Response} from "express";
import {AuthenticatedRequest} from "@api/middlewares/authentications";
import {MediaType} from "@/types/media";
import {HttpError} from "@/types/HttpError";

export function ValidateMediaType(req: AuthenticatedRequest, res: Response, next: NextFunction) {
	// We cast req to ValidatedRequest here to access params.type and t()
	const type = req.params.type as string;
	const ALLOWED_TYPES: MediaType[] = ['movies', 'series'];

	if (!ALLOWED_TYPES.includes(type as MediaType)) {
		// Validation failed, send 400 Bad Request
		return new HttpError({
			code: req.t('SERVER_BAD_REQUEST_CODE'),
			message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
			statusCode: 400,
		}).sendResponse(res);
	}

	// Validation succeeded, continue to the next middleware/handler
	return next();
}

