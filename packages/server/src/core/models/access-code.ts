import { BelongsToGetAssociationMixin, BelongsToSetAssociationMixin, DataTypes, Model, Optional, Sequelize } from 'sequelize';
import RedisServiceInstance from '@core/infrastructure/data/redis';
import type Subscription from './subscription';
import type User from './user';
import type Plan from './plan';
import crypto from 'crypto';
import Logger from '@utils/logger';
import { Models } from '@/types/Models';

// Cache TTL in seconds
const CACHE_TTL = 3600; // 1 hour

// Define the attributes for the AccessCode model
export interface AccessCodeAttributes {
	code: string; // primary key
	planId: string;
	validFor: number; // number of days or months depending on isMonthly
	isMonthly: boolean;
	used: boolean;
	subscriptionId?: string | null;
	userId?: string | null;
	requestedBy?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
}

// Some attributes are optional in `AccessCode.build` and `AccessCode.create` calls
interface AccessCodeCreationAttributes extends Optional<
	AccessCodeAttributes,
	'used' | 'isMonthly' | 'validFor' | 'userId' | 'subscriptionId' | 'requestedBy' | 'createdAt' | 'updatedAt'
> {}

class AccessCode extends Model<AccessCodeAttributes, AccessCodeCreationAttributes> {
	declare code: string;
	declare planId: string;
	declare validFor: number;
	declare isMonthly: boolean;
	declare used: boolean;
	declare subscriptionId: string | null;
	declare userId: string | null;
	declare requestedBy: string | null;
	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;

	// Associations mixins
	declare getSubscription: BelongsToGetAssociationMixin<Subscription>;
	declare setSubscription: BelongsToSetAssociationMixin<Subscription, string>;
	declare getUser: BelongsToGetAssociationMixin<User>;
	declare setUser: BelongsToSetAssociationMixin<User, string>;
	declare getPlan: BelongsToGetAssociationMixin<Plan>;
	declare setPlan: BelongsToSetAssociationMixin<Plan, string>;

	// Associations references
	declare readonly Subscription?: Subscription;
	declare readonly User?: User;
	declare readonly Plan?: Plan;

	public static associate(models: Models) {
		this.belongsTo(models.Subscription, { foreignKey: 'subscriptionId', onDelete: 'SET NULL' });
		this.belongsTo(models.User, { foreignKey: 'userId' });
		this.belongsTo(models.Plan, { foreignKey: 'planId' });
	}

	// Generate access code in format 'XXXXX-XXXXX-XXXXX'
	public static generateAccessCode(): string {
		const generateSegment = () => {
			const bytes = crypto.randomBytes(3); // 24 bits
			const number = bytes.readUIntBE(0, 3) % 100000; // 0-99999
			return number.toString().padStart(5, '0');
		};
		return [generateSegment(), generateSegment(), generateSegment()].join('-');
	}

	public static async findBySubscriptionId(subscriptionId: string): Promise<AccessCode | null> {
		const cacheKey = `accesscode:subscription:${subscriptionId}`;
		const cached = await RedisServiceInstance.getSequelizeModel<AccessCode>(cacheKey, this);
		if (cached) return cached;

		const accessCode = await this.findOne({ where: { subscriptionId } });
		if (accessCode) await RedisServiceInstance.set(cacheKey, accessCode.toJSON(), CACHE_TTL);
		return accessCode;
	}

	public static async findByCode(code: string): Promise<AccessCode | null> {
		const cacheKey = `accesscode:${code}`;
		const cached = await RedisServiceInstance.getSequelizeModel<AccessCode>(cacheKey, this);
		if (cached) return cached;

		const accessCode = await this.findByPk(code);
		if (accessCode) await RedisServiceInstance.set(cacheKey, accessCode.toJSON(), CACHE_TTL);
		return accessCode;
	}

	// Helper to compute valid-until date
	public getExpiryDate(): Date {
		const now = new Date();
		if (this.isMonthly) {
			now.setMonth(now.getMonth() + this.validFor);
		} else {
			now.setDate(now.getDate() + this.validFor);
		}
		return now;
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	AccessCode.init(
		{
			code: {
				type: DataTypes.STRING(25),
				primaryKey: true,
				allowNull: false,
			},
			planId: {
				type: DataTypes.STRING(50),
				allowNull: false,
			},
			validFor: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
				validate: {
					min: 1,
					max: 12, // Maximum 12 months or 30 days (validation logic in hooks)
				},
			},
			isMonthly: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			subscriptionId: {
				type: DataTypes.STRING(85),
				allowNull: true,
				references: { model: 'Subscriptions', key: 'id' },
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: true,
				references: { model: 'Users', key: 'id' },
			},
			requestedBy: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			used: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn('NOW'),
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn('NOW'),
			},
		},
		{
			sequelize,
			modelName: 'AccessCode',
			tableName: 'Accesscodes',
			indexes: [{ fields: ['code', 'userId'] }],
			timestamps: true,
		},
	);

	// Validation hook for validFor based on isMonthly
	AccessCode.addHook('beforeCreate', async (instance: AccessCode) => {
		if (instance.isMonthly) {
			if (instance.validFor > 12) {
				throw new Error('validFor cannot exceed 12 months when isMonthly is true');
			}
		} else {
			if (instance.validFor > 30) {
				throw new Error('validFor cannot exceed 30 days when isMonthly is false');
			}
		}
	});

	AccessCode.addHook('beforeUpdate', async (instance: AccessCode) => {
		if (instance.isMonthly) {
			if (instance.validFor > 12) {
				throw new Error('validFor cannot exceed 12 months when isMonthly is true');
			}
		} else {
			if (instance.validFor > 30) {
				throw new Error('validFor cannot exceed 30 days when isMonthly is false');
			}
		}
	});

	// Cache invalidation hooks
	AccessCode.addHook('afterCreate', async (instance: AccessCode) => {
		try {
			const cacheByCode = `accesscode:${instance.code}`;
			await RedisServiceInstance.delete(cacheByCode);
			if (instance.subscriptionId) await RedisServiceInstance.delete(`accesscode:subscription:${instance.subscriptionId}`);
		} catch (e) {
			Logger.warn('Error invalidating Access Code cache afterCreate', e);
		}
	});

	AccessCode.addHook('afterUpdate', async (instance: AccessCode) => {
		try {
			const cacheByCode = `accesscode:${instance.code}`;
			await RedisServiceInstance.delete(cacheByCode);
			if (instance.subscriptionId) await RedisServiceInstance.delete(`accesscode:subscription:${instance.subscriptionId}`);
		} catch (e) {
			Logger.warn('Error invalidating accesscode cache afterUpdate', e);
		}
	});
};

export default AccessCode;
