import { createClient, RedisClientType } from 'redis';
import { Model, ModelStatic } from 'sequelize';
import { RequestInfo, RequestInit } from 'node-fetch';
import redisConfig from '@core/infrastructure/config/redis';
import logger from '@utils/logger';
import { hydrateModel } from '@utils/sequelize';
import { Encryptor } from '@utils/encryptor';
import { fetchResponse as DefaultFetchResponse } from '@utils/fetcher';
import { isDevelopment } from '@utils/standard';

export interface RedisRequestInit extends RequestInit {
	cachedSeconds?: number;
	customCacheKey?: string;
}

export class RedisService {
	public static enableCacheLogging: boolean = false;
	private readonly client: RedisClientType;

	constructor() {
		this.client = createClient(this.getClientOptions());
		this.client.on('error', this.onError.bind(this));
		this.client.on('ready', () => {
			logger.info('Redis client is ready and connected.');
		});
	}

	private getClientOptions() {
		if (redisConfig.mode === 'external' && redisConfig.external.url) {
			return {
				url: redisConfig.external.url,
				socket: {
					reconnectStrategy: (retries: number) => this.getReconnectStrategy(retries),
				},
			};
		}

		return {
			socket: {
				host: redisConfig.local.host,
				port: redisConfig.local.port,
				reconnectStrategy: (retries: number) => this.getReconnectStrategy(retries),
			},
		};
	}

	private getReconnectStrategy(retries: number): number | Error {
		const attempt = retries + 1;
		const delay = Math.min(attempt * 100, 5000); // cap delay at 5 seconds

		if (attempt % 10 === 0) {
			logger.warn(`Redis reconnecting... attempt ${attempt} after ${delay}ms delay`);
		}

		return delay;
	}

	public async connect(): Promise<void> {
		try {
			if (this.client.isOpen) return;

			await this.client.connect();
			logger.info('Connected to Redis');

			if (isDevelopment()) {
				await this.client.flushAll();
				logger.info('Redis cache cleared for development environment');
			}
		} catch (error) {
			logger.force('error', 'Failed to connect to Redis.', error);
		}
	}

	public async disconnect(): Promise<void> {
		if (!this.client.isOpen) return;

		await this.client
			.quit()
			.then(() => logger.info('Redis disconnected'))
			.catch((error: Error) => logger.force('error', 'Failed to disconnect Redis.', error));
	}

	private onError(error: Error): void {
		logger.force('error', 'Redis client error.', error.message);
	}

	public async get<T>(key: string): Promise<T | undefined> {
		const value = await this.client.get(key);
		return value ? (JSON.parse(value) as T) : undefined;
	}

	public async set<T>(key: string, value: T, seconds: number = 6000): Promise<void> {
		const stringValue = JSON.stringify(value);
		await this.client.set(key, stringValue, { EX: seconds });
	}

	public async delete(key: string): Promise<void> {
		await this.client.del(key);
	}

	public async getSequelizeModel<T extends Model>(key: string, model: ModelStatic<T>): Promise<T | undefined> {
		const payload = await this.get<Record<string, unknown>>(key);
		if (payload && RedisService.enableCacheLogging)
			logger.info('Payload found in cache', { name: model.name, key, payload });
		return payload ? hydrateModel(model, payload) : undefined;
	}

	public async getSequelizeModels<T extends Model>(key: string, model: ModelStatic<T>): Promise<T[] | undefined> {
		const payloads = await this.get<Record<string, unknown>[]>(key);
		if (payloads && RedisService.enableCacheLogging)
			logger.info('Payloads found in cache', { name: model.name, key, payloads });
		return payloads ? payloads.map((payload) => hydrateModel(model, payload)) : undefined;
	}

	public async getBuffer(key: string): Promise<Buffer | null> {
		const value = await this.client.get(key);
		return value ? Buffer.from(value, 'base64') : null;
	}

	public async setBuffer(key: string, value: Buffer, seconds: number = 6000): Promise<void> {
		await this.client.set(key, value.toString('base64'), { EX: seconds });
	}

	public async fetchResponse<GeneticResponse = any, GeneticError = any>(
		request: RequestInfo | URL,
		options: RedisRequestInit,
	) {
		const { cachedSeconds = 30, customCacheKey, ...fetchOptions } = options;
		const key =
			customCacheKey === undefined
				? Encryptor.hashWithMD5(typeof request == 'string' ? request : request.toString())
				: customCacheKey;
		const cachedData = await this.get<GeneticResponse>(key);

		if (cachedData) {
			if (RedisService.enableCacheLogging) logger.info('Cache hit', { key });
			return cachedData;
		}

		const response = await DefaultFetchResponse<GeneticResponse, GeneticError>(request, fetchOptions);

		if (cachedSeconds > 0) {
			setImmediate(async () => {
				await this.set<GeneticResponse>(key, response, cachedSeconds);
				if (RedisService.enableCacheLogging) logger.info('Cache saved', { key, cachedSeconds });
			});
		}

		return response;
	}
}

export const RedisServiceInstance = new RedisService();
export default RedisServiceInstance;
