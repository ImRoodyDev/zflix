import { DataTypes, Model, Sequelize } from 'sequelize';
import { Models } from '@/types/Models';

export interface LanguageAttributes {
	code: string;
	name: string;
}

interface LanguageCreationAttributes extends LanguageAttributes {}

class Language extends Model<LanguageAttributes, LanguageCreationAttributes> {
	declare code: string;
	declare name: string;

	// eslint-disable-next-line  @typescript-eslint/no-unused-vars
	public static associate(models: Models) {
		// No associations yet
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Language.init(
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
		},
		{
			sequelize,
			modelName: 'Language',
			tableName: 'Languages',
			timestamps: false,
		}
	);
};

export default Language;
