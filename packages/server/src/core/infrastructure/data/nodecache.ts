import NodeCache from 'node-cache';
import { Model, ModelStatic } from 'sequelize';
import { hydrateModel } from '@utils/sequelize';
import { RequestInfo, RequestInit } from 'node-fetch';
import { Encryptor } from '@utils/encryptor';
import { fetchResponse as DefaultFetchResponse } from '@utils/fetcher';
import logger from '@utils/logger';

export interface NodeCacheRequestInit extends RequestInit {
	cachedSeconds?: number;
	customCacheKey?: string;
}

export class NodeCacheService {
	public static enableCacheLogging: boolean = false;
	private readonly cache: NodeCache;

	constructor() {
		try {
			this.cache = new NodeCache();
		} catch (error) {
			logger.force('error', 'Failed to initialize in-memory cache.', error);
			throw error;
		}
	}

	public get<T>(key: string): T | undefined {
		try {
			const value = this.cache.get<string>(key);
			return typeof value === 'string' ? (JSON.parse(value) as T) : undefined;
		} catch (error) {
			logger.force('error', `Failed to read NodeCache key "${key}".`, error);
			return undefined;
		}
	}

	public set<T>(key: string, value: T, ttlSeconds: number = 600): void {
		try {
			const stringValue = JSON.stringify(value);
			this.cache.set<string>(key, stringValue, ttlSeconds);
		} catch (error) {
			logger.force('error', `Failed to write NodeCache key "${key}".`, error);
		}
	}

	public updateTtl(key: string, ttlSeconds: number): void {
		try {
			this.cache.ttl(key, ttlSeconds);
		} catch (error) {
			logger.force('error', `Failed to update TTL for NodeCache key "${key}".`, error);
		}
	}

	public has(key: string): boolean {
		try {
			return this.cache.has(key);
		} catch (error) {
			logger.force('error', `Failed to inspect NodeCache key "${key}".`, error);
			return false;
		}
	}

	public delete(key: string): void {
		try {
			this.cache.del(key);
		} catch (error) {
			logger.force('error', `Failed to delete NodeCache key "${key}".`, error);
		}
	}

	public getSequelizeModel<T extends Model>(key: string, model: ModelStatic<T>): T | undefined {
		const payload = this.get<Record<string, unknown>>(key);
		if (payload && NodeCacheService.enableCacheLogging) logger.info('Payload found in cache', { name: model.name, key, payload });
		return payload ? hydrateModel(model, payload) : undefined;
	}

	public getSequelizeModels<T extends Model>(key: string, model: ModelStatic<T>): T[] | undefined {
		const payloads = this.get<Record<string, unknown>[]>(key);
		if (payloads && NodeCacheService.enableCacheLogging) logger.info('Payloads found in cache', { name: model.name, key, payloads });
		return payloads ? payloads.map((payload) => hydrateModel(model, payload)) : undefined;
	}

	public async fetchResponse<GeneticResponse = any, GeneticError = any>(request: RequestInfo | URL, options: NodeCacheRequestInit) {
		const { cachedSeconds = 30, customCacheKey, ...fetchOptions } = options;
		const key =
			customCacheKey === undefined ? Encryptor.hashWithMD5(typeof request == 'string' ? request : request.toString()) : customCacheKey;
		const cachedData = this.get<GeneticResponse>(key);

		if (cachedData) {
			if (NodeCacheService.enableCacheLogging) logger.info('Cache hit', { key });
			return cachedData;
		}

		const response = await DefaultFetchResponse<GeneticResponse, GeneticError>(request, fetchOptions);

		if (cachedSeconds > 0) {
			setImmediate(() => {
				this.set<GeneticResponse>(key, response, cachedSeconds);
				if (NodeCacheService.enableCacheLogging) logger.info('Cache saved', { key, cachedSeconds });
			});
		}

		return response;
	}
}

export const NodeCacheInstance = new NodeCacheService();
export default NodeCacheInstance;
