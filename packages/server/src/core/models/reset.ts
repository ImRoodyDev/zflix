import { BelongsToGetAssociationMixin, BelongsToSetAssociationMixin, DataTypes, Model, Optional, Sequelize } from 'sequelize';
import User from './user';

export interface ResetAttributes {
	id: string;
	userId: string;
	completed: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Optional attributes for creation
interface ResetCreationAttributes extends Optional<ResetAttributes, 'completed' | 'createdAt' | 'updatedAt'> {}

class Reset extends Model<ResetAttributes, ResetCreationAttributes> {
	declare id: string;
	declare userId: string;
	declare completed: boolean;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;

	// Association methods
	declare getUser: BelongsToGetAssociationMixin<User>;
	declare setUser: BelongsToSetAssociationMixin<User, string>;

	declare readonly User?: User;

	public static associate(models: any) {
		this.belongsTo(models.User, { foreignKey: 'userId' });
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Reset.init(
		{
			id: {
				type: DataTypes.STRING(255),
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
			completed: {
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
			tableName: 'Resets',
			modelName: 'Reset',
			indexes: [{ fields: ['userId'] }],
		}
	);
};

export default Reset;
