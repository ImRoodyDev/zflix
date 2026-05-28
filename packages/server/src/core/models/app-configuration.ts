import { DataTypes, FindOptions, Model, Optional, Sequelize } from 'sequelize';
import { Models } from '@/types/Models';
import RedisServiceInstance from '@core/infrastructure/data/redis';
import User from './user';

// Cache TTL in seconds (e.g., 1 hour)
const CACHE_TTL = 3600;

// Define the attributes for the AppConfiguration model
export interface AppConfigurationAttributes {
	id: number;
	maintenanceMode: boolean;
	allowUserRegistrations: boolean;
	maxUsers: number;
	createdAt?: Date;
	updatedAt?: Date;
}

// Some attributes are optional in `AppConfiguration.build` and `AppConfiguration.create` calls
interface AppConfigurationCreationAttributes extends Optional<AppConfigurationAttributes, 'id'> {}

class AppConfiguration extends Model<AppConfigurationAttributes, AppConfigurationCreationAttributes> {
	declare id: number;
	declare maintenanceMode: boolean;
	declare allowUserRegistrations: boolean;
	declare maxUsers: number;
	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;

	/**
	 * Finds an AppConfiguration by primary key, utilizing a cache-aside strategy.
	 * @param {number} primaryKey - The primary key of the configuration.
	 * @param options - Find options.
	 * @returns {Promise<AppConfiguration | null>} The found configuration instance or null.
	 */
	public static override async findByPk(primaryKey: number, options?: FindOptions): Promise<AppConfiguration | null> {
		if (!primaryKey) return null;
		// If caller provided any options (include/attributes/etc.), bypass cache to ensure correct result
		if (options && Object.keys(options).length > 0) {
			return await super.findByPk<AppConfiguration>(primaryKey, options);
		}

		const cacheKey = `app_config:${primaryKey}`;
		const cachedConfig = await RedisServiceInstance.getSequelizeModel(cacheKey, this);
		if (cachedConfig) return cachedConfig;

		const config = await super.findByPk<AppConfiguration>(primaryKey);
		if (config) await RedisServiceInstance.set(cacheKey, config.toJSON(), CACHE_TTL);
		return config;
	}

	/**
	 * Checks if a new user can be registered based on the configuration.
	 * @returns {Promise<boolean>}
	 */
	public static async canRegisterUser(): Promise<boolean> {
		const config = await this.findByPk(1);
		if (!config) return true;

		if (!config.allowUserRegistrations) {
			return false;
		}

		const userCount = await User.count();
		if (userCount >= config.maxUsers) {
			return false;
		}

		return true;
	}

	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	// eslint-disable-next-line  @typescript-eslint/no-unused-vars
	public static associate(models: Models) {
		// Define associations here if any
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	AppConfiguration.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			maintenanceMode: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			allowUserRegistrations: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			maxUsers: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1000,
			},
		},
		{
			sequelize,
			modelName: 'AppConfiguration',
			tableName: 'AppConfigurations',
			timestamps: true,
		},
	);

	AppConfiguration.afterUpdate(async (config) => {
		const cacheKey = `app_config:${config.id}`;
		await RedisServiceInstance.delete(cacheKey);
	});
};

export default AppConfiguration;
