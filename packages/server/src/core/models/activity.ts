import { BelongsToGetAssociationMixin, BelongsToSetAssociationMixin, DataTypes, Model, Optional, Sequelize } from 'sequelize';
import type Profile from './profile';
import UsersConfig from '@core/infrastructure/config/users';
import Logger from '@utils/logger';
import { Models } from '@/types/Models';

export type Runtimes = number | { epId: `${number}x${number}`; runtime: number }[];

// Define the attributes for the Activity model
export interface ActivityAttributes {
	key: number;
	id: string;
	profileId: string;
	userId: string;
	type: string;
	runtimes: Runtimes;
	updatedAt: Date;
}

// Some attributes are optional in `Activity.build` and `Activity.create` calls
interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'key' | 'updatedAt'> {}

class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> {
	declare key: number;
	declare id: string;
	declare profileId: string;
	declare userId: string;
	declare type: string;
	declare runtimes: Runtimes;
	declare readonly updatedAt: Date;

	// Associations
	declare getProfile: BelongsToGetAssociationMixin<Profile>;
	declare setProfile: BelongsToSetAssociationMixin<Profile, string>;

	// Association references
	declare readonly Profile?: Profile;

	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	public static associate(models: Models) {
		this.belongsTo(models.Profile, {
			foreignKey: 'profileId',
		});
	}

	/**
	 * Create or update an activity
	 * @param payload
	 */
	public static async createOrUpdate(payload: ActivityCreationAttributes) {
		const [activity, created] = await Activity.findOrCreate({
			where: {
				id: payload.id,
				profileId: payload.profileId,
				userId: payload.userId,
			},
			defaults: payload,
		});

		if (!created) {
			// Check if runtimes is array and existing is also array
			if (Array.isArray(payload.runtimes) && Array.isArray(activity.runtimes)) {
				// Create a copy to trigger Sequelize setter
				const updatedRuntimes = [...activity.runtimes];

				for (const newEpisode of payload.runtimes) {
					const existingIndex = updatedRuntimes.findIndex((ep) => ep.epId === newEpisode.epId);

					if (existingIndex !== -1) {
						// Update existing episode runtime
						updatedRuntimes[existingIndex] = newEpisode;
					} else {
						// Add new episode runtime
						updatedRuntimes.push(newEpisode);
					}
				}

				// Assign the new array to trigger the setter
				activity.runtimes = updatedRuntimes;
			} else {
				activity.runtimes = payload.runtimes;
			}
			await activity.save();
		}
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Activity.init(
		{
			key: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			id: {
				type: DataTypes.STRING(25),
				allowNull: false,
			},
			profileId: {
				type: DataTypes.UUID,
				allowNull: false,
				references: {
					model: 'Profiles',
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
			type: {
				type: DataTypes.STRING(15),
				allowNull: false,
			},
			runtimes: {
				type: DataTypes.TEXT('long'),
				allowNull: false,
				get(): Runtimes | null {
					const rawValue = this.getDataValue('runtimes');
					if (!rawValue) return null;

					// Parse from string (TEXT column always returns string)
					try {
						return JSON.parse(rawValue as any);
					} catch {
						// If JSON parsing fails, try to parse as number
						const num = Number(rawValue);
						return isNaN(num) ? null : num;
					}
				},
				set(value: Runtimes | null) {
					if (value === null || value === undefined) {
						this.setDataValue('runtimes', null as any);
					} else if (typeof value === 'number') {
						// Store numbers as strings
						this.setDataValue('runtimes', String(value) as any);
					} else {
						// Stringify arrays/objects as JSON
						this.setDataValue('runtimes', JSON.stringify(value) as any);
					}
				},
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'Activity',
			tableName: 'Activities',
			indexes: [
				{ fields: ['profileId'] },
				{ fields: ['userId'] },
				{
					// Unique constraint for profileId + id
					fields: ['profileId', 'id'],
					unique: true,
				},
			],
			timestamps: true,
			createdAt: false,
		}
	);
	// Cleanup old activities when limit is exceeded
	Activity.addHook('afterCreate', async (createdActivity: Activity) => {
		try {
			const profileId = createdActivity.profileId;
			const activityCount = await Activity.count({
				where: { profileId: profileId, type: createdActivity.type },
			});
			// Delete oldest 20% if limit exceeded
			if (activityCount > UsersConfig.maxActivitiesPerUser) {
				const oldestActivities = await Activity.findAll({
					where: { profileId: profileId, type: createdActivity.type },
					order: [['updatedAt', 'ASC']],
					limit: UsersConfig.activitiesSequenceCleanupSize,
				});
				await Promise.all(oldestActivities.map((activity) => activity.destroy({ force: true })));
			}
		} catch (error) {
			Logger.warn('Error clearing extra activities:', error);
		}
	});
};

export default Activity;
