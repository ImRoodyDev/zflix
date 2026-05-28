import { BelongsToGetAssociationMixin, BelongsToSetAssociationMixin, DataTypes, Model, Optional, Sequelize } from 'sequelize';
import User from './user';
import Subscription from './subscription';
import { Models } from '@/types/Models';

// Define the attributes for the Billing model
export interface BillingAttributes {
	transactionId: string;
	subscriptionId: string;
	userId: string;
	currency: string;
	amount: number;
	method: string;
	createdAt: Date;
}

// Some attributes are optional in `Billing.build` and `Billing.create` calls
interface BillingCreationAttributes extends Optional<BillingAttributes, 'createdAt'> {}

// Define a type for the client-facing billing information
export interface BillingOutputInformation {
	transactionId: string;
	currency: string;
	amount: number;
	method: string;
	createdAt: Date;
	subscriptionId: string;
}

class Billing extends Model<BillingAttributes, BillingCreationAttributes> {
	declare transactionId: string;
	declare subscriptionId: string;
	declare userId: string;
	declare currency: string;
	declare amount: number;
	declare method: string;
	declare readonly createdAt: Date;

	// Associations
	declare getUser: BelongsToGetAssociationMixin<User>;
	declare setUser: BelongsToSetAssociationMixin<User, string>;
	declare getSubscription: BelongsToGetAssociationMixin<Subscription>;
	declare setSubscription: BelongsToSetAssociationMixin<Subscription, string>;

	// Association references
	declare readonly User?: User;
	declare readonly Subscription?: Subscription;

	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	public static associate(models: Models) {
		this.belongsTo(models.User, { foreignKey: 'userId' });
		this.belongsTo(models.Subscription, { foreignKey: 'subscriptionId' });
	}

	private static getBillingInformation(billing: Billing): BillingOutputInformation {
		return {
			transactionId: billing.transactionId,
			currency: billing.currency,
			amount: billing.amount,
			method: billing.method,
			createdAt: billing.createdAt,
			subscriptionId: billing.subscriptionId,
		};
	}

	/**
	 * Formats billing instances for client response
	 */
	public static async getBillingsInformation(billings: Billing[] = []): Promise<BillingOutputInformation[]> {
		return billings.map((b) => this.getBillingInformation(b));
	}

	/**
	 * Formats this billing instance for client response
	 */
	public async getBillingInformation(): Promise<BillingOutputInformation> {
		return Billing.getBillingInformation(this);
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Billing.init(
		{
			transactionId: {
				type: DataTypes.STRING(255),
				primaryKey: true,
				allowNull: false,
			},
			subscriptionId: {
				type: DataTypes.STRING(85),
				allowNull: false,
				references: {
					model: 'Subscriptions',
					key: 'id',
				},
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
				references: {
					model: 'Users',
					key: 'id',
				},
			},
			currency: {
				type: DataTypes.STRING(5),
				allowNull: false,
			},
			amount: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			method: {
				type: DataTypes.STRING(20),
				allowNull: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
			},
		},
		{
			sequelize,
			tableName: 'Billings',
			modelName: 'Billing',
			indexes: [{ fields: ['subscriptionId'] }, { fields: ['userId'] }],
			timestamps: true,
			updatedAt: false,
		}
	);
};

export default Billing;
