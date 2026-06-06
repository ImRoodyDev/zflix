import {
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
	DataTypes,
	Model,
	Optional,
	Sequelize,
} from 'sequelize';
import User from './user';
import Country from './country';
import { Models } from '@/types/Models';

export interface DeviceAttributes {
	id: number;
	userId: string;
	name: string;
	type: string;
	ip: string;
	city: string;
	countryCode: string;
	loggedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

// Optional attributes for creation
interface DeviceCreationAttributes extends Optional<DeviceAttributes, 'id' | 'loggedAt' | 'createdAt' | 'updatedAt'> {}

class Device extends Model<DeviceAttributes, DeviceCreationAttributes> {
	declare id: number;
	declare userId: string;
	declare name: string;
	declare type: string;
	declare ip: string;
	declare city: string;
	declare countryCode: string;
	declare loggedAt: Date | null;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;

	// Association methods
	declare getUser: BelongsToGetAssociationMixin<User>;
	declare setUser: BelongsToSetAssociationMixin<User, string>;
	declare getCountry: BelongsToGetAssociationMixin<Country>;
	declare setCountry: BelongsToSetAssociationMixin<Country, string>;

	declare readonly User?: User;
	declare readonly Country?: Country;

	public static associate(models: Models) {
		this.belongsTo(models.User, { foreignKey: 'userId' });
		this.belongsTo(models.Country, { foreignKey: 'countryCode' });
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Device.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
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
			name: {
				type: DataTypes.STRING(60),
				allowNull: false,
			},
			type: {
				type: DataTypes.STRING(60),
				allowNull: false,
			},
			ip: {
				type: DataTypes.STRING(60),
				allowNull: false,
			},
			city: {
				type: DataTypes.STRING(60),
				allowNull: false,
			},
			countryCode: {
				type: DataTypes.STRING(5),
				allowNull: false,
				references: {
					model: 'Countries',
					key: 'code',
				},
			},
			loggedAt: {
				type: DataTypes.DATE,
				allowNull: true,
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
			tableName: 'Devices',
			modelName: 'Device',
			indexes: [{ fields: ['userId'] }, { unique: true, fields: ['userId', 'ip'] }],
		},
	);
};

export default Device;
