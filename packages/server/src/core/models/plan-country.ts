import { DataTypes, Model, Sequelize } from 'sequelize';
import { Models } from '@/types/Models';

export interface PlanCountryAttributes {
	planId: string;
	countryCode: string;
}

interface PlanCountryCreationAttributes extends PlanCountryAttributes {}

class PlanCountry extends Model<PlanCountryAttributes, PlanCountryCreationAttributes> {
	declare planId: string;
	declare countryCode: string;

	// eslint-disable-next-line  @typescript-eslint/no-unused-vars
	public static associate(models: Models) {
		// No associations yet
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	PlanCountry.init(
		{
			planId: {
				type: DataTypes.STRING(50),
				references: {
					model: 'Plans',
					key: 'id',
				},
				allowNull: false,
				primaryKey: true,
			},
			countryCode: {
				type: DataTypes.STRING(5),
				references: {
					model: 'Countries',
					key: 'code',
				},
				allowNull: false,
				primaryKey: true,
			},
		},
		{
			sequelize,
			modelName: 'PlanCountry',
			tableName: 'PlanCountries',
			timestamps: false,
			indexes: [
				{
					unique: true,
					fields: ['planId', 'countryCode'],
				},
			],
		}
	);
};

export default PlanCountry;
