import {
	BelongsToManyAddAssociationMixin,
	BelongsToManyAddAssociationsMixin,
	BelongsToManyGetAssociationsMixin,
	BelongsToManyRemoveAssociationMixin,
	BelongsToManySetAssociationsMixin,
	DataTypes,
	FindOptions,
	HasManyAddAssociationMixin,
	HasManyGetAssociationsMixin,
	Model,
	Optional,
	Sequelize,
} from 'sequelize';
import RedisServiceInstance from '@core/infrastructure/data/redis';
import Country from './country';
import Subscription from './subscription';
import Billing from './billing';
import AccessCode from './access-code';
import { ProcessError } from '@/types/ProcessError';
import { Models } from '@/types/Models';

// Cache TTL in seconds
const CACHE_TTL = 3600 * 5;

export interface PlanNames {
	[language: string]: string;
}

export interface PlanDescriptions {
	[language: string]: string[];
}

// Define the attributes for the Plan model
export interface PlanAttributes {
	id: string;
	public_id: string;
	index: number;
	isActive: boolean;
	autoRenewal: boolean;
	tier: number;
	names: PlanNames;
	descriptions: PlanDescriptions;
	price: number;
	currency: string;
	maxPaymentFailure: number;
	maxScreen: number;
	stripePriceId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

// Some attributes are optional in `Plan.build` and `Plan.create` calls
interface PlanCreationAttributes extends Optional<
	PlanAttributes,
	'isActive' | 'autoRenewal' | 'maxPaymentFailure' | 'maxScreen' | 'index' | 'stripePriceId' | 'createdAt' | 'updatedAt'
> {}

// Define a type for the client-facing plan information
export interface PlanOutputInformation {
	id: string;
	index: number;
	names: PlanNames;
	descriptions: PlanDescriptions;
	autoRenewal: boolean;
	price: number;
	currency: string;
	maxScreen: number;
}

class Plan extends Model<PlanAttributes, PlanCreationAttributes> {
	declare id: string;
	declare public_id: string;
	declare isActive: boolean;
	declare autoRenewal: boolean;
	declare tier: number;
	declare names: PlanNames;
	declare descriptions: PlanDescriptions;
	declare price: number;
	declare currency: string;
	declare maxPaymentFailure: number;
	declare maxScreen: number;
	declare index: number;
	declare stripePriceId: string | null;

	// timestamps!
	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;

	// Associations
	declare getSubscriptions: HasManyGetAssociationsMixin<Subscription>;
	declare addSubscription: HasManyAddAssociationMixin<Subscription, string>;
	declare getBillings: HasManyGetAssociationsMixin<Billing>;
	declare addBilling: HasManyAddAssociationMixin<Billing, string>;
	declare getAccessCodes: HasManyGetAssociationsMixin<AccessCode>;
	declare addAccessCode: HasManyAddAssociationMixin<AccessCode, string>;
	declare getCountries: BelongsToManyGetAssociationsMixin<Country>;
	declare addCountry: BelongsToManyAddAssociationMixin<Country, string>;
	declare addCountries: BelongsToManyAddAssociationsMixin<Country, string>;
	declare removeCountry: BelongsToManyRemoveAssociationMixin<Country, string>;
	declare setCountries: BelongsToManySetAssociationsMixin<Country, string>;

	declare readonly Subscriptions?: Subscription[];
	declare readonly Billings?: Billing[];
	declare readonly AccessCodes?: AccessCode[];
	declare readonly Countries?: Country[];

	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	public static associate(models: Models) {
		this.hasMany(models.Subscription, { foreignKey: 'planId', onUpdate: 'CASCADE', onDelete: 'RESTRICT' });
		this.hasMany(models.AccessCode, { foreignKey: 'planId', onUpdate: 'CASCADE', onDelete: 'RESTRICT' });
		this.belongsToMany(models.Country, {
			through: models.PlanCountry,
			foreignKey: 'planId',
			otherKey: 'countryCode',
			onDelete: 'CASCADE',
		});
	}

	/**
	 * Finds a plan by its primary key, with caching.
	 * @param {string} id - The primary key of the plan.
	 * @param options
	 * @returns {Promise<Plan | null>} The found plan instance or null.
	 */
	public static override async findByPk(id: string, options?: FindOptions): Promise<Plan | null> {
		if (!id) return null;

		// If caller provided any options (include/attributes/etc.), bypass cache to ensure correct result
		if (options && Object.keys(options).length > 0) {
			return (await super.findByPk(id, options)) as Plan | null;
		}

		const cacheKey = `plan:${id}`;
		const cachedPlan = await RedisServiceInstance.getSequelizeModel(cacheKey, this);
		if (cachedPlan) return cachedPlan;
		const plan = await super.findByPk<Plan>(id);
		if (plan) await RedisServiceInstance.set(cacheKey, plan.toJSON(), CACHE_TTL);
		return plan;
	}

	/**
	 * Formats an array of Plan instances into a client-friendly format.
	 * @param {Plan[]} plans - An array of Plan instances.
	 * @returns {PlanOutputInformation[]} An array of formatted plan information.
	 */
	public static plansInformation(plans: Plan[] = []): PlanOutputInformation[] {
		return plans
			.map((plan) => ({
				id: plan.public_id,
				index: plan.index,
				names: plan.names,
				descriptions: plan.descriptions,
				autoRenewal: plan.autoRenewal,
				price: plan.price,
				currency: plan.currency,
				maxScreen: plan.maxScreen,
			}))
			.sort((a, b) => a.index - b.index);
	}

	/**
	 * Finds a plan by its public ID, with caching.
	 * @param {string} publicId - The public ID of the plan.
	 * @returns {Promise<Plan | null>} The found plan instance or null.
	 */
	public static async findByPb(publicId: string): Promise<Plan | null> {
		if (!publicId) return null;
		const cacheKey = `plan:public:${publicId}`;
		const cachedPlan = await RedisServiceInstance.getSequelizeModel(cacheKey, this);
		if (cachedPlan) return cachedPlan;
		const plan = await this.findOne({ where: { public_id: publicId } });
		if (plan) await RedisServiceInstance.set(cacheKey, plan.toJSON(), CACHE_TTL);
		return plan;
	}

	/**
	 * Maps a plan tier to its target streaming resolution.
	 */
	public static subscriptionTargetResolution(tier: number): number {
		switch (tier) {
			case 1:
				return 999999;
			case 2:
				return 1080;
			default:
				return 720;
		}
	}

	/**
	 * Resolves the target streaming resolution for a plan primary key.
	 */
	public static async subscriptionTargetResolutionByPlanId(planId: string): Promise<number> {
		if (!planId) return this.subscriptionTargetResolution(0);

		const plan = await this.findByPk(planId);
		return plan ? plan.targetResolution() : this.subscriptionTargetResolution(0);
	}

	/**
	 * Returns the target streaming resolution for this plan instance.
	 */
	public targetResolution(): number {
		return Plan.subscriptionTargetResolution(this.tier);
	}

	/**
	 * Finds all plans associated with a specific Country, with caching.
	 * @param {string} countryCode - The code of the Country.
	 * @returns {Promise<Plan[] | null>} An array of plan instances or null.
	 */
	public static async findPlanByCountry(countryCode: string): Promise<Plan[] | null> {
		if (!countryCode) return null;
		const cacheKey = `plans:country:${countryCode}`;
		const cachedPlans = await RedisServiceInstance.getSequelizeModels(cacheKey, this);
		if (cachedPlans) return cachedPlans;
		const plans = await this.findAll({
			include: [
				{
					model: Country,
					where: { code: countryCode },
					attributes: [],
					required: true,
					through: { attributes: [] },
				},
			],
		});
		if (plans && plans.length > 0)
			await RedisServiceInstance.set(
				cacheKey,
				plans.map((p) => p.toJSON()),
				CACHE_TTL,
			);
		return plans;
	}

	/**
	 * Gets plan public ID from primary key
	 */
	public static async findPlanPbByPk(pk: string): Promise<string | null> {
		if (!pk) return null;
		const plan = await this.findByPk(pk);
		return plan ? plan.public_id : null;
	}

	/**
	 * Creates plan and associates it with a country
	 */
	public static async createPlanWithCountry(
		planData: PlanCreationAttributes,
		countryCode: string,
	): Promise<Plan | null> {
		if (!planData || !countryCode) return null;
		const plan = await Plan.create(planData);
		const country = await Country.findByPk(countryCode);
		if (!country) throw new ProcessError({ status: 400, message: 'Country not found', code: 'COUNTRY_NOT_FOUND' });
		await plan.addCountry(country);
		return plan;
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Plan.init(
		{
			id: {
				type: DataTypes.STRING(50),
				primaryKey: true,
				allowNull: false,
				onUpdate: 'CASCADE',
				onDelete: 'RESTRICT',
			},
			public_id: {
				type: DataTypes.STRING(50),
				unique: true,
				allowNull: false,
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			autoRenewal: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			tier: {
				type: DataTypes.BIGINT,
				allowNull: false,
			},
			names: {
				type: DataTypes.TEXT('long'),
				allowNull: false,
				get(): PlanNames {
					const rawValue = this.getDataValue('names');
					return rawValue ? JSON.parse(rawValue as any) : {};
				},
				set(value: PlanNames) {
					this.setDataValue('names', JSON.stringify(value) as any);
				},
			},
			descriptions: {
				type: DataTypes.TEXT('long'),
				allowNull: false,
				get(): PlanDescriptions {
					const rawValue = this.getDataValue('descriptions');
					return rawValue ? JSON.parse(rawValue as any) : {};
				},
				set(value: PlanDescriptions) {
					this.setDataValue('descriptions', JSON.stringify(value) as any);
				},
			},
			price: {
				type: DataTypes.DECIMAL(4, 2),
				allowNull: false,
			},
			currency: {
				type: DataTypes.STRING(4),
				allowNull: false,
			},
			maxPaymentFailure: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 3,
			},
			maxScreen: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			},
			index: {
				type: DataTypes.BIGINT,
				allowNull: false,
				defaultValue: 0,
			},
			stripePriceId: {
				type: DataTypes.STRING(255),
				allowNull: true,
				defaultValue: null,
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
			tableName: 'Plans',
			modelName: 'Plan',
			timestamps: true,
		},
	);

	Plan.afterUpdate(async (plan: Plan) => {
		await RedisServiceInstance.delete(`plan:${plan.id}`);
		await RedisServiceInstance.delete(`plan:public:${plan.public_id}`);
	});
};

export default Plan;
