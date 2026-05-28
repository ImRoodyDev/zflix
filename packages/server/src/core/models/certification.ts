import { DataTypes, HasManyAddAssociationMixin, HasManyGetAssociationsMixin, Model, Optional, Sequelize } from 'sequelize';
import Profile from './profile';
import { Models } from '@/types/Models';

export interface CertificationAttributes {
	id: string;
	names: string;
}

// Optional attributes for creation
interface CertificationCreationAttributes extends Optional<CertificationAttributes, 'id'> {}

class Certification extends Model<CertificationAttributes, CertificationCreationAttributes> {
	declare id: string;
	declare names: string;

	// Association methods
	declare readonly profiles?: Profile[];
	declare addProfile: HasManyAddAssociationMixin<Profile, string>;
	declare getProfiles: HasManyGetAssociationsMixin<Profile>;

	public static associate(models: Models) {
		this.hasMany(models.Profile, { foreignKey: 'certificationId' });
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Certification.init(
		{
			id: {
				type: DataTypes.STRING(25),
				primaryKey: true,
				allowNull: false,
			},
			names: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'Certification',
			tableName: 'Certifications',
			timestamps: false,
		}
	);
};

export default Certification;
