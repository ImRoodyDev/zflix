// Internal imports
import { HttpError } from '../types/HttpError';
import { ProcessError } from '../types/ProcessError';


export function isCustomError(error: any): error is HttpError | ProcessError {
	return error instanceof HttpError || error instanceof ProcessError;
}
