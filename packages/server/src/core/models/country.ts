import { BelongsToManyAddAssociationMixin, BelongsToManyGetAssociationsMixin, DataTypes, HasManyAddAssociationMixin, HasManyGetAssociationsMixin, Model, Sequelize } from 'sequelize';
import User from './user';
import Device from './device';
import Plan from './plan';
import { Models } from '@/types/Models';

// Define the attributes for the Country model
export interface CountryAttributes {
	code: string;
	name: string;
	allowed: boolean;
}

// `code` is not optional on creation
interface CountryCreationAttributes extends CountryAttributes {}

class Country extends Model<CountryAttributes, CountryCreationAttributes> {
	declare code: string;
	declare name: string;
	declare allowed: boolean;

	// Associations
	declare getUsers: HasManyGetAssociationsMixin<User>;
	declare addUser: HasManyAddAssociationMixin<User, string>;
	declare getDevices: HasManyGetAssociationsMixin<Device>;
	declare addDevice: HasManyAddAssociationMixin<Device, number>;
	declare getPlans: BelongsToManyGetAssociationsMixin<Plan>;
	declare addPlan: BelongsToManyAddAssociationMixin<Plan, string>;

	declare readonly Users?: User[];
	declare readonly Devices?: Device[];
	declare readonly Plans?: Plan[];

	/**
	 * Checks if a country is allowed for registration.
	 * @param {string} code - The country code to check.
	 * @returns {Promise<boolean>} True if allowed, false otherwise.
	 */
	public static async isCountryAllowed(code: string): Promise<boolean> {
		const country = await this.findByPk(code);
		if (!country) return true; // Default to allowed if country not found in DB
		return country.allowed;
	}

	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	public static associate(models: Models) {
		this.hasMany(models.User, { foreignKey: 'countryCode' });
		this.hasMany(models.Device, { foreignKey: 'countryCode' });
		this.belongsToMany(models.Plan, {
			through: models.PlanCountry,
			foreignKey: 'countryCode',
			otherKey: 'planId',
			onDelete: 'CASCADE', // Automatically deletes PlanCountry entries when a Country is deleted
		});
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Country.init(
		{
			code: {
				type: DataTypes.STRING(5),
				primaryKey: true,
				allowNull: false,
			},
			name: {
				type: DataTypes.STRING(30),
				allowNull: false,
			},
			allowed: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
		},
		{
			sequelize,
			modelName: 'Country',
			tableName: 'Countries',
			timestamps: false,
		}
	);
};

export default Country;
