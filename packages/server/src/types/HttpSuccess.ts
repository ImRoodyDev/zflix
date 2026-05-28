import { setCacheHeaders } from '@/utils/express';
import { Response } from 'express';

export interface HttpSuccessPayload<TData = any> {
	message: string;
	statusCode?: number;
	data?: TData;
}

export class HttpSuccess<TData = any> {
	public readonly success: boolean = true;
	public readonly message: string;
	public readonly statusCode: number;
	public readonly data?: TData;

	constructor(payload: HttpSuccessPayload<TData>) {
		this.message = payload.message;
		this.statusCode = payload.statusCode ?? 200;
		this.data = payload.data;
	}

	public sendResponse(res: Response, cacheSeconds?: number): Response {
		if (cacheSeconds !== undefined) {
			setCacheHeaders(res, cacheSeconds);
		}
		return res.status(this.statusCode).json({
			success: this.success,
			message: this.message,
			data: this.data,
		});
	}
}
