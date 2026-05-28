import {
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
	DataTypes,
	FindOptions,
	HasManyAddAssociationMixin,
	HasManyGetAssociationsMixin,
	Model,
	Optional,
	Sequelize,
} from 'sequelize';
import Activity, { Runtimes } from './activity';
import Bookmark from './bookmark';
import Avatar from './avatar';
import Certification from './certification';
import User from './user';
import { Models } from '@/types/Models';
import RedisServiceInstance from '@core/infrastructure/data/redis';
import { CertificationRank } from '@core/constants/tmdb';

// Cache TTL in seconds
const CACHE_TTL = 3600 * 5;

// Define the attributes for the Profile model
export interface ProfileAttributes {
	id: string;
	userId: string;
	primary: boolean;
	profileName: string;
	autoPlay: boolean;
	defaultSubtitle: boolean;
	avatarId: string | null;
	certificationId: CertificationRank;
	languageCode: string;
	createdAt: Date;
	updatedAt: Date;
}

// Some attributes are optional in `Profile.build` and `Profile.create` calls
// Make `index` optional so it can be generated internally
export interface ProfileCreationAttributes extends Optional<
	ProfileAttributes,
	| 'id'
	| 'primary'
	| 'autoPlay'
	| 'defaultSubtitle'
	| 'avatarId'
	| 'certificationId'
	| 'languageCode'
	| 'createdAt'
	| 'updatedAt'
> {}

// Define a type for the client-facing profile information
export interface ProfileOutputInformation {
	id: string;
	primary: boolean;
	profileName: string;
	avatarId: string | null;
	certificationId: CertificationRank;
	languageCode: string;
	autoPlay: boolean;
	defaultSubtitle: boolean;
	bookmarks: { id: string; type: string }[];
	activities: { id: string; type: string; runtimes: Runtimes }[];
}

class Profile extends Model<ProfileAttributes, ProfileCreationAttributes> {
	declare id: string;
	declare userId: string;
	declare primary: boolean;
	declare profileName: string;
	declare autoPlay: boolean;
	declare defaultSubtitle: boolean;
	declare avatarId: string | null;
	declare certificationId: CertificationRank;
	declare languageCode: string;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;

	// Associations
	declare getBookmarks: HasManyGetAssociationsMixin<Bookmark>;
	declare addBookmark: HasManyAddAssociationMixin<Bookmark, number>;
	declare getActivities: HasManyGetAssociationsMixin<Activity>;
	declare addActivity: HasManyAddAssociationMixin<Activity, number>;
	declare getAvatar: BelongsToGetAssociationMixin<Avatar>;
	declare setAvatar: BelongsToSetAssociationMixin<Avatar, string>;
	declare getCertification: BelongsToGetAssociationMixin<Certification>;
	declare setCertification: BelongsToSetAssociationMixin<Certification, string>;
	declare getUser: BelongsToGetAssociationMixin<User>;
	declare setUser: BelongsToSetAssociationMixin<User, string>;

	// Associated models
	declare readonly Bookmarks?: Bookmark[];
	declare readonly Activities?: Activity[];
	declare readonly Avatar?: Avatar;
	declare readonly Certification?: Certification;
	declare readonly User?: User;

	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	public static associate(models: Models) {
		this.hasMany(models.Bookmark, { foreignKey: 'profileId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
		this.hasMany(models.Activity, { foreignKey: 'profileId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
		this.belongsTo(models.Avatar, { foreignKey: 'avatarId' });
		this.belongsTo(models.Certification, { foreignKey: 'certificationId' });
		this.belongsTo(models.User, { foreignKey: 'userId' });
	}

	public static async profileInformationByPk(profileId: string): Promise<ProfileOutputInformation | null> {
		const profile = await this.findByPk(profileId, {
			include: [
				{ model: Activity, as: 'Activities' },
				{ model: Bookmark, as: 'Bookmarks' },
			],
		});
		if (!profile) return null;
		return profile.profileInformation();
	}

	/**
	 * Finds a user by primary key, utilizing a cache-aside strategy.
	 * @param {string} primaryKey - The primary key of the profile.
	 * @param options - Find options.
	 * @returns {Promise<Profile | null>} The found profile instance or null.
	 */
	public static override async findByPk(primaryKey: string, options?: FindOptions): Promise<Profile | null> {
		if (!primaryKey) return null;
		// If caller provided any options (include/attributes/etc.), bypass cache to ensure correct result
		if (options && Object.keys(options).length > 0) {
			return await super.findByPk<Profile>(primaryKey, options);
		}

		const cacheKey = `profile:${primaryKey}`;
		const cacheProfile = await RedisServiceInstance.getSequelizeModel(cacheKey, this);
		if (cacheProfile) return cacheProfile;
		const profile = await super.findByPk<Profile>(primaryKey);
		if (profile) await RedisServiceInstance.set(cacheKey, profile.toJSON(), CACHE_TTL);
		return profile;
	}

	/**
	 * Private helper to map bookmarks with client-facing IDs
	 * @private
	 */
	private async getBookmarksInformation() {
		const bookmarks = this.Bookmarks ?? (await this.getBookmarks());
		return (
			bookmarks?.map((bookmark) => ({
				id: bookmark.id,
				type: bookmark.type,
			})) || []
		);
	}

	/**
	 * Private helper to map activities with client-facing IDs and parsed runtimes
	 * @private
	 */
	private async getActivitiesInformation() {
		const activities = this.Activities ?? (await this.getActivities());
		return (
			activities?.map((activity) => ({
				id: activity.id,
				type: activity.type,
				runtimes: activity.runtimes, // Already parsed by Activity model getter
			})) || []
		);
	}

	/**
	 * Formats the profile instance into a client-friendly object.
	 */
	public async profileInformation(): Promise<ProfileOutputInformation> {
		return {
			id: this.id,
			primary: this.primary,
			profileName: this.profileName,
			avatarId: this.avatarId,
			certificationId: this.certificationId,
			languageCode: this.languageCode,
			autoPlay: this.autoPlay,
			defaultSubtitle: this.defaultSubtitle,
			bookmarks: await this.getBookmarksInformation(),
			activities: await this.getActivitiesInformation(),
		};
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	Profile.init(
		{
			id: {
				type: DataTypes.UUID,
				primaryKey: true,
				allowNull: false,
				defaultValue: DataTypes.UUIDV4,
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
				references: {
					model: 'Users',
					key: 'id',
				},
			},
			primary: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			profileName: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			autoPlay: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			defaultSubtitle: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			avatarId: {
				type: DataTypes.STRING(25),
				allowNull: true,
				references: {
					model: 'Avatars',
					key: 'id',
				},
				defaultValue: 'AM-188-X200-H200',
			},
			certificationId: {
				type: DataTypes.STRING(25),
				allowNull: false,
				references: {
					model: 'Certifications',
					key: 'id',
				},
				defaultValue: 'NC-17',
			},
			languageCode: {
				type: DataTypes.STRING(3),
				allowNull: false,
				defaultValue: 'en',
				references: {
					model: 'Languages',
					key: 'code',
				},
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
			timestamps: true,
			sequelize,
			modelName: 'Profile',
			tableName: 'Profiles',
			indexes: [
				{ fields: ['userId'] },
				{
					unique: true,
					fields: ['userId', 'profileName'],
				},
			],
		},
	);

	Profile.afterUpdate(async (profile) => {
		const cacheKey = `profile:${profile.id}`;
		await RedisServiceInstance.delete(cacheKey);
	});

	// // Auto-generate index before creation
	// Profile.addHook('beforeCreate', async (instance: Profile) => {
	// 	// Get the highest existing index for the user (returns null if none)
	// 	const maxIndexRaw = await Profile.max('index', {where: {userId: instance.userId}});
	// 	const maxIndex = (typeof maxIndexRaw === 'number' && !isNaN(maxIndexRaw)) ? (maxIndexRaw as number) : null;

	// 	// If maxIndex is a number, set the new index to maxIndex + 1, otherwise start at 0
	// 	instance.index = (maxIndex !== null) ? maxIndex + 1 : 0;
	// });

	// // Reindex profiles after deletion
	// Profile.addHook('afterDestroy', async (deletedProfile: Profile) => {
	// 	await Profile.update(
	// 		{index: sequelize.literal('`index` - 1')},
	// 		{
	// 			where: {
	// 				userId: deletedProfile.userId,
	// 				index: {
	// 					[Op.gt]: deletedProfile.index,
	// 				},
	// 			},
	// 		}
	// 	);
	// });
};

export default Profile;
