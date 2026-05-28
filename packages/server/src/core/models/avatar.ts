import { DataTypes, HasManyAddAssociationMixin, HasManyGetAssociationsMixin, Model, Optional, Sequelize } from 'sequelize';
import Profile from './profile';
import { Models } from '@/types/Models';

export interface AvatarAttributes {
	id: string;
	imagePath: string | null;
}

// Optional attributes for creation
interface AvatarCreationAttributes extends Optional<AvatarAttributes, 'imagePath'> {}

class Avatar extends Model<AvatarAttributes, AvatarCreationAttributes> {
	declare id: string;
	declare imagePath: string | null;

	// Association methods
	declare getProfiles: HasManyGetAssociationsMixin<Profile>;
	declare addProfile: HasManyAddAssociationMixin<Profile, string>;
	declare readonly profiles?: Profile[];

	public static associate(models: Models) {
		this.hasMany(models.Profile, { foreignKey: 'avatarId', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Avatar.init(
		{
			id: {
				type: DataTypes.STRING(25),
				primaryKey: true,
				allowNull: false,
			},
			imagePath: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
		},
		{
			sequelize,
			modelName: 'Avatar',
			tableName: 'Avatars',
			timestamps: false,
		}
	);
};

export default Avatar;
