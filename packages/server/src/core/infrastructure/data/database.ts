import { Dialect, Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import config from '@core/infrastructure/config/database';
import appConfig from '@core/infrastructure/config/application';
import { isDevelopment } from '@utils/standard';
import logger from '@utils/logger';

const { database, username, password, host, dialect, port, logging } = config[appConfig.ENV as keyof typeof config];

export class DatabaseService {
	private static initialized = false;

	private static readonly sequelize = new Sequelize(database as string, username as string, password as string, {
		host,
		dialect: dialect as Dialect,
		port: parseInt(port as string, 10),
		logging: logging == 'true' && isDevelopment() ? (message: string) => logger.debug(message) : false,
	});

	public static async initialize(): Promise<void> {
		try {
			if (this.initialized) return;

			await DatabaseService.sequelize.authenticate();
			logger.info(`Database connected successfully in ${appConfig.ENV} environment.`);

			await this.bootstrapModels();

			if (isDevelopment()) {
				// NOTE: In production, use migrations instead of sync().
			}

			this.initialized = true;
			logger.info('Database synchronized successfully.');
		} catch (error) {
			logger.force('error', 'Unable to connect to the database.', error);
			throw error;
		}
	}

	public static async disconnect(): Promise<void> {
		try {
			await DatabaseService.sequelize.close();
			logger.info('Database connection closed successfully.');
		} catch (error) {
			logger.force('error', 'Error closing the database connection.', error);
		}
	}

	public static async runSeeders(): Promise<void> {
		try {
			const seedersDir = path.join(__dirname, '..', '..', '..', 'seeders');

			const seedFiles = fs
				.readdirSync(seedersDir)
				.filter((file) => file.endsWith('.js') || file.endsWith('.ts'))
				.sort();

			for (const file of seedFiles) {
				const filePath = path.join(seedersDir, file);
				const seeder = require(filePath);

				await seeder.up(this.sequelize.getQueryInterface(), Sequelize);
				logger.info(`Successfully executed seeder: ${file}`);
			}
		} catch (error) {
			logger.error('Seeder execution failed.', error);
		}
	}

	private static async bootstrapModels(): Promise<void> {
		const models: Record<string, any> = {};
		const modelsDir = path.resolve(__dirname, '..', '..', 'models');

		fs.readdirSync(modelsDir)
			.filter((fileName) => {
				return !fileName.startsWith('.') && (fileName.endsWith('.js') || fileName.endsWith('.ts')) && !fileName.endsWith('.d.ts');
			})
			.forEach((fileName) => {
				const modelPath = path.join(modelsDir, fileName);
				const modelModule = require(modelPath);

				if (!modelModule.bootstrap) {
					logger.warn('Model missing bootstrap function.', fileName);
					return;
				}

				modelModule.bootstrap(this.sequelize);
				const modelInstance = modelModule.default || modelModule;

				if (!modelInstance || !modelInstance.name) {
					logger.warn('Model missing name.', fileName);
					return;
				}

				models[modelInstance.name] = modelInstance;
			});

		Object.keys(models).forEach((modelName) => {
			if (typeof models[modelName].associate === 'function') {
				models[modelName].associate(models);
			}
		});
	}
}
