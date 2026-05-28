import { BelongsToGetAssociationMixin, BelongsToSetAssociationMixin, DataTypes, Model, Optional, Sequelize } from 'sequelize';
import Profile from './profile';
import UsersConfig from '@core/infrastructure/config/users';
import Logger from '@utils/logger';
import { Models } from '@/types/Models';

// Define the attributes for the Bookmark model
export interface BookmarkAttributes {
	id: string;
	profileId: string;
	userId: string;
	type: string;
	createdAt: Date;
}

// Some attributes are optional in `Bookmark.build` and `Bookmark.create` calls
interface BookmarkCreationAttributes extends Optional<BookmarkAttributes, 'id' | 'createdAt'> {}

class Bookmark extends Model<BookmarkAttributes, BookmarkCreationAttributes> {
	declare id: string;
	declare profileId: string;
	declare userId: string;
	declare type: string;
	declare readonly createdAt: Date;

	// Associations
	declare getProfile: BelongsToGetAssociationMixin<Profile>;
	declare setProfile: BelongsToSetAssociationMixin<Profile, string>;

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
}

export const bootstrap = (sequelize: Sequelize) => {
	Bookmark.init(
		{
			id: {
				type: DataTypes.STRING(25),
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
			profileId: {
				type: DataTypes.UUID,
				primaryKey: true,
				allowNull: false,
				references: {
					model: 'Profiles',
					key: 'id',
				},
			},
			type: {
				type: DataTypes.STRING(15),
				allowNull: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'Bookmark',
			tableName: 'Bookmarks',
			indexes: [{ fields: ['profileId'] }],
			timestamps: true,
			updatedAt: false,
		}
	);

	// Cleanup old bookmarks when limit is exceeded
	Bookmark.addHook('afterCreate', async (createdBookmark: Bookmark) => {
		try {
			const profileId = createdBookmark.profileId;

			// Check the total number of bookmarks for this profile
			const bookmarkCount = await Bookmark.count({
				where: { profileId: profileId, type: createdBookmark.type },
			});

			// If the profile has more than 500 bookmarks, delete the 50 oldest bookmarks
			if (bookmarkCount > UsersConfig.maxActivitiesPerUser) {
				// Find the 50 oldest bookmarks for this profile
				const oldestBookmarks = await Bookmark.findAll({
					where: { profileId: profileId, type: createdBookmark.type },
					order: [['createdAt', 'ASC']], // Oldest first
					limit: UsersConfig.activitiesSequenceCleanupSize,
				});

				// Delete the 50 oldest bookmarks
				await Promise.all(oldestBookmarks.map((bookmark) => bookmark.destroy({ force: true })));
			}
		} catch (error) {
			Logger.warn('Error clearing extra bookmarks:', error);
		}
	});
};

export default Bookmark;
