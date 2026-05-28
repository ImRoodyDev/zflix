import crypto from 'crypto';
import {
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
	DataTypes,
	FindOptions,
	HasManyAddAssociationMixin,
	HasManyGetAssociationsMixin,
	HasOneGetAssociationMixin,
	HasOneSetAssociationMixin,
	Model,
	Optional,
	Sequelize,
	Transaction,
} from 'sequelize';
import RedisServiceInstance from '@core/infrastructure/data/redis';
import Plan from './plan';
import User from './user';
import Billing from './billing';
import AccessCode from './access-code';
import { Models } from '@/types/Models';
import { PaypalController, PayPalService } from '@core/infrastructure/services/payments/paypal';
import { StripeController, StripeService } from '@core/infrastructure/services/payments/stripe';
import { maskEmail } from '@utils/masker';
import AppConfig from '@core/infrastructure/config/application';
import logger from '@/utils/logger';

// Cache TTL in seconds
const CACHE_TTL = 3600 * 24; // 24 hours

export type SubscriptionStatus = 'ACTIVE' | 'APPROVED' | 'CREATED' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'INVALID';
export type SubscriptionSource = 'STRIPE' | 'PAYPAL' | 'MANUAL' | 'CODE' | 'OTHER';

export type SubscriptionProviderInfo = {
	code?: string;
	email?: string;
	provider?: string;
	payerId?: string;
};

// Define the structure for subscription links
export interface SubscriptionLink {
	type: string;
	url: string;
	method: string;
}

// Define the attributes for the Subscription model
export interface SubscriptionAttributes {
	id: string;
	userId: string;
	planId: string;
	active: boolean;
	status: SubscriptionStatus;
	startAt: Date | null;
	expiredAt: Date | null;
	nextBillingAt: Date | null;
	cancelledAt: Date | null;
	pausedAt: Date | null;
	lastPaymentAt: Date | null;
	failedPayments: number;
	links: SubscriptionLink[] | null;
	source: SubscriptionSource;
	oneTimePayment: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Some attributes are optional in `Subscription.build` and `Subscription.create` calls
export interface SubscriptionCreationAttributes extends Optional<
	SubscriptionAttributes,
	| 'id'
	| 'active'
	| 'status'
	| 'startAt'
	| 'expiredAt'
	| 'nextBillingAt'
	| 'cancelledAt'
	| 'pausedAt'
	| 'lastPaymentAt'
	| 'failedPayments'
	| 'links'
	| 'oneTimePayment'
	| 'createdAt'
	| 'updatedAt'
> {}

// Define a type for the client-facing subscription information
export interface SubscriptionOutputInformation {
	id: string;
	planId: string;
	active: boolean;
	status: SubscriptionStatus;
	startAt: Date | null;
	expiredAt: Date | null;
	nextBillingAt: Date | null;
	cancelledAt: Date | null;
	pausedAt: Date | null;
	lastPaymentAt: Date | null;
	failedPayments: number;
	// links: SubscriptionLink[] | null; !! CAUTION: Do not expose links to clients
	source: SubscriptionSource;
	subscriber: SubscriptionProviderInfo;
}

class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> {
	declare id: string;
	declare userId: string;
	declare planId: string;
	declare active: boolean;
	declare status: SubscriptionStatus;
	declare startAt: Date | null;
	declare expiredAt: Date | null;
	declare nextBillingAt: Date | null;
	declare cancelledAt: Date | null;
	declare pausedAt: Date | null;
	declare lastPaymentAt: Date | null;
	declare failedPayments: number;
	declare links: SubscriptionLink[] | null;
	declare source: SubscriptionSource;
	declare oneTimePayment: boolean;

	// timestamps!
	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;

	// Associations
	declare getUser: BelongsToGetAssociationMixin<User>;
	declare setUser: BelongsToSetAssociationMixin<User, string>;
	declare getPlan: BelongsToGetAssociationMixin<Plan>;
	declare setPlan: BelongsToSetAssociationMixin<Plan, string>;
	declare getBillings: HasManyGetAssociationsMixin<Billing>;
	declare addBilling: HasManyAddAssociationMixin<Billing, string>;
	declare getAccessCode: HasOneGetAssociationMixin<AccessCode>;
	declare setAccessCode: HasOneSetAssociationMixin<AccessCode, string>;

	declare readonly User?: User;
	declare readonly Plan?: Plan;
	declare readonly Billings?: Billing[];
	declare readonly AccessCode?: AccessCode;

	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	public static associate(models: Models) {
		this.belongsTo(models.User, { foreignKey: 'userId' });
		this.belongsTo(models.Plan, { foreignKey: 'planId' });
		this.hasMany(models.Billing, { foreignKey: 'subscriptionId' });
		this.hasOne(models.AccessCode, { foreignKey: 'subscriptionId', onDelete: 'SET NULL' });
	}

	/** Checks if there are any dormant subscriptions in the given list.
	 * Meaning subscription that can be activated,
	 * This will ignore subscription that are under CODE which are only activated manually by admins and should not block users from subscribing to new plans.
	 */
	public static haveDormantSubscriptions(subscriptions: Subscription[]): boolean {
		return subscriptions.some(
			(sub) => ['ACTIVE', 'APPROVED', 'SUSPENDED', 'EXPIRED'].includes(sub.status) && sub.source !== 'CODE',
		);
	}

	/**
	 * Generates a unique subscription ID.
	 * @param {string} [prefix='A-'] - The prefix for the ID.
	 * @returns {string} The generated subscription ID.
	 */
	public static generateSubscriptionId(subscription: Subscription): string {
		let prefix = 'A-';

		switch (subscription.source) {
			case 'PAYPAL':
				prefix = 'P-';
				break;
			case 'CODE':
				prefix = 'C-';
				break;
			case 'STRIPE':
				prefix = 'S-';
				break;
			case 'MANUAL':
				prefix = 'M-';
				break;
		}

		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let code = prefix;
		for (let i = 0; i < 10; i++) {
			const randomByte = crypto.randomBytes(1)[0];
			code += chars[randomByte % chars.length];
		}
		return code;
	}

	/**
	 * Finds a subscription by its primary key, with caching and a status check.
	 * Revalidates subscription status when fetched from database (not from cache) to avoid hitting payment gateway repeatedly.
	 * @param {string} id - The primary key of the subscription.
	 * @param options
	 * @returns {Promise<Subscription | null>} The found subscription instance or null.
	 */
	public static override async findByPk(id: string, options?: FindOptions): Promise<Subscription | null> {
		if (!id) return null;

		// If caller provided any options (include/attributes/etc.), bypass cache to ensure correct result
		if (options && Object.keys(options).length > 0) {
			return await super.findByPk<Subscription>(id, options);
		}

		const cacheKey = `subscription:${id}`;
		const cachedSubscription = await RedisServiceInstance.getSequelizeModel(cacheKey, this);
		// If found in cache, return it without revalidation to avoid hitting payment gateway
		if (cachedSubscription) return cachedSubscription;

		// Not in cache, fetch from database, revalidate status, cache result, and return
		const subscription = await super.findByPk<Subscription>(id);
		if (subscription) {
			// Revalidate subscription status with payment gateway before caching
			await subscription.revalidateSubscription();

			// Cache the subscription after revalidation (instance is already updated in memory)
			await RedisServiceInstance.set(cacheKey, subscription.toJSON(), CACHE_TTL); // Cache for 24 hours
		}
		return subscription;
	}

	/**
	 * Finds all non-free subscriptions for a given user.
	 * @param {string} userId - The ID of the user.
	 * @returns An object containing the subscriptions and a flag indicating if the user is subscribed.
	 */
	public static async findUserSubscriptions(
		userId: string,
		transaction?: Transaction,
	): Promise<
		[
			subscriptions: Subscription[],
			isSubscribed: boolean,
			subscribedId: string,
			subscribedSubscription: Subscription | undefined,
		]
	> {
		const subscriptions = await this.findAll({ where: { userId: userId }, ...(transaction ? { transaction } : {}) });
		const isSubscribed = subscriptions.find((sub) => sub.active || sub.status === 'ACTIVE');
		return [subscriptions, isSubscribed != null, isSubscribed ? isSubscribed.id : '', isSubscribed];
	}

	/**
	 * Finds the public ID of a plan associated with a subscription.
	 * @param {string} subscriptionId - The ID of the subscription.
	 * @returns {Promise<string | null>} The public ID of the plan or null.
	 */
	public static async findSubscriptionPlanPbId(subscriptionId: string): Promise<string | null> {
		if (!subscriptionId) return null;
		const subscription = await this.findByPk(subscriptionId, { include: [Plan] });
		if (!subscription) return null;
		return subscription.Plan ? subscription.Plan.public_id : null;
	}

	/**
	 * Rechecks the subscription status with the external provider.
	 * For one-time (non-recurring) subscriptions, skips the provider call
	 * and checks expiration locally.
	 * @returns {Promise<Subscription>} The updated subscription instance.
	 * */
	public async revalidateSubscription(): Promise<Subscription> {
		// One-time subscriptions with expiredAt set: just check expiration locally
		if (this.oneTimePayment && this.expiredAt) {
			const isExpired = new Date() >= new Date(this.expiredAt);
			await this.update({ active: !isExpired, status: isExpired ? 'EXPIRED' : 'ACTIVE' });
			return this;
		}

		switch (this.source) {
			case 'PAYPAL':
				// One-time PayPal orders still in CREATED status: attempt to capture
				if (this.oneTimePayment) await PaypalController.captureOneTimeOrder(this);
				else await PaypalController.revalidateSubscription(this);
				break;
			case 'STRIPE':
				await StripeController.revalidateSubscription(this);
				break;
			default:
				// For locally managed subscriptions, only expire them when an expiry exists and is reached.
				// This preserves admin-managed active subscriptions with no expiry and avoids reviving cancelled ones.
				if (!this.expiredAt) {
					return this;
				}

				// If expiredAt is set and in the past, expire the subscription if it's not already inactive/expired
				if (new Date() >= new Date(this.expiredAt)) {
					const canExpire = this.active || ['ACTIVE', 'APPROVED', 'CREATED'].includes(this.status);

					if (canExpire) {
						await this.update({ active: false, status: 'EXPIRED' });
					}
				}
				break;
		}
		// Return the updated instance (update() already modifies this instance in memory)
		return this;
	}

	/**
	 * Formats the subscription instance into a client-friendly object.
	 * @returns {Promise<SubscriptionOutputInformation>} The formatted subscription information.
	 */
	public async subscriptionInformation(): Promise<SubscriptionOutputInformation> {
		// Use the already loaded Plan if available to avoid extra DB call
		const plan = this.Plan ?? (await this.getPlan());

		// Placeholder for subscriber info - to be implemented as needed
		const subscriberInfo: SubscriptionProviderInfo = {
			payerId: 'P-XXXXXXX',
			email: '*****@****.com',
			code: '****-****-****',
			provider: AppConfig.AppName,
		};

		switch (this.source) {
			case 'PAYPAL': {
				// Implement PayPal-specific subscriber info retrieval here
				const info = await PayPalService.getSubscriptionById(this.id).catch(() => null);
				// You can extract subscriber info from 'info' if needed
				if (info && info.subscriber) {
					subscriberInfo.payerId = info.subscriber.payer_id;
					subscriberInfo.email = info.subscriber.email_address
						? maskEmail(info.subscriber.email_address)
						: '*****@****.com';
				}
				break;
			}
			case 'STRIPE': {
				subscriberInfo.provider = 'Stripe';
				// Skip fetching for placeholder subscriptions (CREATED status)
				// Because stripe doesnt create a subscription until checkout is completed, so CREATED subscriptions won't have any Stripe data yet
				if (this.status !== 'CREATED') {
					const stripeSub = await StripeService.getSubscription(this.id).catch(() => null);
					if (stripeSub) {
						const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer?.id;
						if (customerId) {
							subscriberInfo.payerId = customerId;
							const customer = await StripeService.getCustomer(customerId).catch(() => null);
							if (customer && !customer.deleted) {
								subscriberInfo.email = customer.email ? maskEmail(customer.email) : '*****@****.com';
							}
						}
					}
				}
				break;
			}
			case 'CODE': {
				// Implement Access Code-specific subscriber info retrieval here
				const accessCode = await this.getAccessCode().catch(() => null);

				if (accessCode) {
					subscriberInfo.code = accessCode.code ?? '****-****-****';
					subscriberInfo.provider = accessCode.requestedBy ?? AppConfig.AppName;
				}
				break;
			}
		}

		return {
			id: this.id,
			planId: plan.public_id,
			active: this.active,
			status: this.status,
			startAt: this.startAt,
			expiredAt: this.expiredAt,
			nextBillingAt: this.nextBillingAt,
			cancelledAt: this.cancelledAt,
			pausedAt: this.pausedAt,
			lastPaymentAt: this.lastPaymentAt,
			failedPayments: this.failedPayments,
			source: this.source,
			subscriber: subscriberInfo,
			// links: this.links, !! CAUTION: Do not expose links to clients
		};
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Subscription.init(
		{
			id: {
				type: DataTypes.STRING(85),
				primaryKey: true,
				allowNull: false,
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
				references: {
					model: 'Users',
					key: 'id',
				},
			},
			planId: {
				type: DataTypes.STRING(255),
				allowNull: false,
				references: {
					model: 'Plans',
					key: 'id',
				},
			},
			active: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			status: {
				type: DataTypes.ENUM('ACTIVE', 'APPROVED', 'CREATED', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'INVALID'),
				allowNull: false,
				defaultValue: 'CREATED',
			},
			startAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			expiredAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			nextBillingAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			cancelledAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			pausedAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			lastPaymentAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			failedPayments: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			links: {
				type: DataTypes.TEXT('long'),
				allowNull: true,
				get(): SubscriptionLink[] | null {
					const rawValue = this.getDataValue('links') as unknown as string;
					return rawValue ? JSON.parse(rawValue) : null;
				},
				set(value: SubscriptionLink[] | null) {
					this.setDataValue('links', value ? (JSON.stringify(value) as unknown as SubscriptionLink[]) : null);
				},
			},
			source: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			oneTimePayment: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'Subscription',
			tableName: 'Subscriptions',
			indexes: [{ fields: ['userId'] }, { fields: ['planId'] }],
			timestamps: true,
			deletedAt: true,
		},
	);

	// Auto-generate unique ID before validation (runs first)
	Subscription.addHook('beforeValidate', async (instance: Subscription) => {
		// Only generate ID if it's not already set
		if (!instance.id) {
			// Ensure source is set (default to 'OTHER' if not provided)
			if (!instance.source) {
				instance.source = 'OTHER';
			}

			// Generate ID immediately without checking for uniqueness (faster)
			// Uniqueness will be checked in beforeCreate if needed
			const baseId = Subscription.generateSubscriptionId(instance);
			instance.id = baseId + '-' + crypto.randomBytes(4).toString('hex');
		}
	});

	// Auto-generate unique ID before creation (runs after beforeValidate)
	// This hook tries to ensure uniqueness, but beforeValidate already set an ID for validation
	Subscription.addHook('beforeCreate', async (instance: Subscription) => {
		// Ensure source is set
		if (!instance.source) {
			instance.source = 'OTHER';
		}

		// Try to ensure ID is unique (optional optimization, ID already set in beforeValidate)
		// Only check if we have a simple ID without the extra randomness
		if (instance.id && !instance.id.includes('-')) {
			try {
				const existing = await Subscription.findByPk(instance.id);
				if (existing) {
					// ID collision detected, regenerate with extra randomness
					const baseId = Subscription.generateSubscriptionId(instance);
					instance.id = baseId + '-' + crypto.randomBytes(4).toString('hex');
				}
			} catch (error) {
				// If check fails, keep the existing ID (it already has randomness)
				logger.error('Error checking for existing subscription ID:', error);
			}
		}

		// Final safety check - ensure ID is always set
		if (!instance.id) {
			const fallbackPrefix =
				instance.source === 'PAYPAL'
					? 'P-'
					: instance.source === 'CODE'
						? 'C-'
						: instance.source === 'STRIPE'
							? 'S-'
							: instance.source === 'MANUAL'
								? 'M-'
								: 'A-';
			instance.id = fallbackPrefix + crypto.randomBytes(8).toString('hex').toUpperCase();
		}

		// Validate subscription validity (max 1 year) for MANUAL and OTHER sources
		if (['MANUAL', 'OTHER'].includes(instance.source) && instance.startAt && instance.expiredAt) {
			const startDate = new Date(instance.startAt);
			const expiredDate = new Date(instance.expiredAt);
			const validityInMs = expiredDate.getTime() - startDate.getTime();
			const validityInDays = validityInMs / (1000 * 60 * 60 * 24);
			const maxValidityDays = 365; // 1 year

			if (validityInDays > maxValidityDays) {
				throw new Error(
					`Subscription validity cannot exceed ${maxValidityDays} days (1 year) for MANUAL/OTHER sources`,
				);
			}

			if (validityInDays < 0) {
				throw new Error('Expired date cannot be before start date');
			}
		}
	});

	// Validate subscription validity on update (max 1 year) for MANUAL and OTHER sources
	Subscription.addHook('beforeUpdate', async (instance: Subscription) => {
		if (['MANUAL', 'OTHER'].includes(instance.source) && instance.startAt && instance.expiredAt) {
			const startDate = new Date(instance.startAt);
			const expiredDate = new Date(instance.expiredAt);
			const validityInMs = expiredDate.getTime() - startDate.getTime();
			const validityInDays = validityInMs / (1000 * 60 * 60 * 24);
			const maxValidityDays = 365; // 1 year

			if (validityInDays > maxValidityDays) {
				throw new Error(
					`Subscription validity cannot exceed ${maxValidityDays} days (1 year) for MANUAL/OTHER sources`,
				);
			}

			if (validityInDays < 0) {
				throw new Error('Expired date cannot be before start date');
			}
		}
	});

	Subscription.afterUpdate(async (subscription) => {
		const cacheKey = `subscription:${subscription.id}`;
		await RedisServiceInstance.delete(cacheKey);
	});

	Subscription.afterDestroy(async (subscription) => {
		const cacheKey = `subscription:${subscription.id}`;
		await RedisServiceInstance.delete(cacheKey);
	});
};
export default Subscription;
