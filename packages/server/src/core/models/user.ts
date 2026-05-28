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
import bcrypt from 'bcrypt';
import RedisServiceInstance from '@core/infrastructure/data/redis';
import NodeCacheInstance from '@core/infrastructure/data/nodecache';
import Country from './country';
import Device from './device';
import Plan from './plan';
import Profile, { ProfileCreationAttributes, ProfileOutputInformation } from './profile';
import Subscription from './subscription';
import Billing from './billing';
import Reset from './reset';
import Activity from './activity';
import Bookmark from './bookmark';
import { isUUID } from 'validator';

// Cache TTL in seconds
const CACHE_TTL = 3600 * 5;

export type UserRole = 'user' | 'admin' | 'manager';

// Define the attributes for the User model
export interface UserAttributes {
	id: string;
	setupFinished: boolean;
	accountHolder: string;
	email: string;
	password?: string;
	countryCode: string;
	subscriptionId: string | null;
	streamingCount: number;
	resetCount: number;
	role: UserRole;
	loginAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

// Some attributes are optional in `User.build` and `User.create` calls
interface UserCreationAttributes extends Optional<
	UserAttributes,
	| 'id'
	| 'setupFinished'
	| 'subscriptionId'
	| 'streamingCount'
	| 'resetCount'
	| 'loginAt'
	| 'createdAt'
	| 'updatedAt'
	| 'role'
	| 'deletedAt'
> {}

// Define a type for the client-facing user information
export interface UserOutputInformation {
	setupFinish: boolean;
	name: string;
	email: string;
	subscription: boolean;
	profiles: ProfileOutputInformation[];
	country: string;
	countryCode: string;
	tr: number;
}

class User extends Model<UserAttributes, UserCreationAttributes> {
	declare id: string;
	declare setupFinished: boolean;
	declare accountHolder: string;
	declare email: string;
	declare password: string;
	declare countryCode: string;
	declare subscriptionId: string | null;
	declare streamingCount: number;
	declare resetCount: number;
	declare role: UserRole;
	declare loginAt: Date | null;

	// timestamps!
	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
	declare readonly deletedAt: Date;

	// Associations
	declare getCountry: BelongsToGetAssociationMixin<Country>;
	declare setCountry: BelongsToSetAssociationMixin<Country, string>;
	declare getDevices: HasManyGetAssociationsMixin<Device>;
	declare addDevice: HasManyAddAssociationMixin<Device, number>;
	declare getProfiles: HasManyGetAssociationsMixin<Profile>;
	declare addProfile: HasManyAddAssociationMixin<Profile, string>;
	declare getSubscriptions: HasManyGetAssociationsMixin<Subscription>;
	declare addSubscription: HasManyAddAssociationMixin<Subscription, string>;
	declare getBillings: HasManyGetAssociationsMixin<Billing>;
	declare addBilling: HasManyAddAssociationMixin<Billing, string>;
	declare getResets: HasManyGetAssociationsMixin<Reset>;
	declare addReset: HasManyAddAssociationMixin<Reset, string>;

	declare readonly Country?: Country;
	declare readonly Devices?: Device[];
	declare readonly Profiles?: Profile[];
	declare readonly Subscriptions?: Subscription[];
	declare readonly Billings?: Billing[];
	declare readonly Resets?: Reset[];

	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	public static associate(models: any) {
		this.belongsTo(models.Country, { foreignKey: 'countryCode', targetKey: 'code' });
		this.belongsTo(models.Subscription, { foreignKey: 'subscriptionId', as: 'ActiveSubscription', onDelete: 'SET NULL' });
		this.hasMany(models.Device, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
		this.hasMany(models.Profile, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
		this.hasMany(models.Subscription, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
		this.hasMany(models.Billing, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
		this.hasMany(models.Reset, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
	}

	/**
	 * Compares a plaintext password with the user's hashed password.
	 * @param {string} password - The plaintext password.
	 * @returns {Promise<boolean>} True if the passwords match.
	 */
	public async compareHashPassword(password: string): Promise<boolean> {
		if (!this.password) {
			throw new Error('Password is not set for this user.');
		}
		return bcrypt.compare(password, this.password);
	}

	private static async getSubscriptionTargetResolution(subscriptionId: string | null): Promise<number> {
		if (!subscriptionId) return 0;

		const subscription = await Subscription.findByPk(subscriptionId, {
			attributes: ['planId'],
		});

		if (!subscription) return Plan.subscriptionTargetResolution(0);
		return Plan.subscriptionTargetResolutionByPlanId(subscription.planId);
	}

	/**
	 * Gathers comprehensive client information for a user.
	 * @param {string} primaryKey - The primary key of the user.
	 * @returns {Promise<UserOutputInformation>} The user's client information.
	 */
	public static async userInformation(primaryKey: string): Promise<UserOutputInformation | null> {
		const user = await this.findByPk(primaryKey, {
			include: [
				{
					model: Profile,
					as: 'Profiles',
					separate: true,
					order: [['createdAt', 'ASC']],
					include: [
						{ model: Activity, as: 'Activities' },
						{ model: Bookmark, as: 'Bookmarks' },
					],
				},
				{
					model: Country,
					as: 'Country',
				},
			],
		});
		if (!user) return null;

		const [profiles, tr] = await Promise.all([
			Promise.all(user.Profiles?.map((profile) => profile.profileInformation()) || []),
			this.getSubscriptionTargetResolution(user.subscriptionId),
		]);

		return {
			setupFinish: user.setupFinished,
			name: user.accountHolder,
			email: user.email,
			subscription: user.subscriptionId != null,
			tr,
			profiles: profiles,
			country: user.Country?.name || '',
			countryCode: user.Country?.code || '',
		};
	}

	/**
	 * Finds a user by primary key, utilizing a cache-aside strategy.
	 * @param {string} primaryKey - The primary key of the user.
	 * @param options - Find options.
	 * @returns {Promise<User | null>} The found user instance or null.
	 */
	public static override async findByPk(primaryKey: string, options?: FindOptions): Promise<User | null> {
		if (!primaryKey) return null;
		// If caller provided any options (include/attributes/etc.), bypass cache to ensure correct result
		if (options && Object.keys(options).length > 0) {
			return await super.findByPk<User>(primaryKey, options);
		}

		const cacheKey = `user:${primaryKey}`;
		const cachedUser = await RedisServiceInstance.getSequelizeModel(cacheKey, this);
		if (cachedUser) return cachedUser;
		const user = await super.findByPk<User>(primaryKey);
		if (user) await RedisServiceInstance.set(cacheKey, user.toJSON(), CACHE_TTL);
		return user;
	}

	/**
	 * Creates a new user and their initial profile and device.
	 * @param {UserCreationAttributes} register - The user registration data.
	 * @param {any} device - The device information.
	 * @returns {Promise<{ user: User; existingUser: boolean }>} The user instance and a flag indicating if they existed.
	 */
	public static async createUser(
		register: UserCreationAttributes,
		device: any,
	): Promise<{ user: User; existingUser: boolean }> {
		const [user, created] = await User.findOrCreate({
			where: { email: register.email },
			defaults: {
				...register,
				countryCode: device.countryCode,
				loginAt: device.datetime,
			},
		});

		if (!created) {
			// User already existed
			return { user, existingUser: true };
		}

		// New user, create device and primary profile
		await Promise.all([
			user.createDevice(device),
			user.createProfile({
				primary: true,
				profileName: 'Parent',
				certificationId: 'NC-17',
			} as ProfileCreationAttributes),
		]);

		return { user, existingUser: false };
	}

	/**
	 * Changes a user's password by their primary key.
	 * @param {string} pk - The primary key of the user.
	 * @param {string} newPassword - The new password.
	 * @returns {Promise<boolean>} True if the password was changed successfully.
	 */
	public static async changePasswordResetByPk(pk: string, newPassword: string): Promise<boolean> {
		const user = await User.findByPk(pk);
		if (!user) return false;
		return user.changePasswordReset(newPassword);
	}

	/**
	 * Creates a new profile for the user instance.
	 * @param {ProfileCreationAttributes} profileData - The data for the new profile.
	 * @returns {Promise<Profile | null>} The created profile instance.
	 */
	public async createProfile(profileData: ProfileCreationAttributes): Promise<Profile | null> {
		return Profile.create({
			...profileData,
			userId: this.id,
		});
	}

	/**
	 * Validates if a profile belongs to a user.
	 * @param {string} userId - The ID of the user.
	 * @param {string} profileId - The ID of the profile.
	 * @returns {Promise<boolean>} True if the profile belongs to the user.
	 */
	public static async isValidProfile(userId: string, profileId: string): Promise<boolean> {
		if (!isUUID(profileId)) return false;
		const profile = await Profile.findByPk(profileId);
		if (!profile) return false;
		return profile.userId === userId;
	}

	/**
	 * Validates if a profile belongs to a user.
	 * @param {string} userId - The ID of the user.
	 * @param {string} profileId - The ID of the profile.
	 */
	public static async getValidProfile(userId: string, profileId?: string): Promise<[boolean, Profile | null]> {
		if (!profileId || !isUUID(profileId)) return [false, null];
		const profile = await Profile.findByPk(profileId);
		if (!profile) return [false, null];
		const valid = profile.userId === userId;
		return [valid, valid ? profile : null];
	}

	/**
	 * Updates the user's subscription ID.
	 * @param {string} userId - The ID of the user.
	 * @param {string | null} subscriptionId - The new subscription ID.
	 */
	public static async newSubscription(userId: string, subscriptionId: string): Promise<void> {
		const user = await this.findByPk(userId);
		if (user) {
			user.subscriptionId = subscriptionId;
			await user.save();
			NodeCacheInstance.delete(`auth_user:${userId}`);
		}
	}

	/**
	 * Creates a new device for the user instance.
	 * @param {any} deviceData - The data for the new device.
	 * @returns {Promise<Device | null>} The created device instance.
	 */
	public async createDevice(deviceData: any): Promise<Device | null> {
		return Device.create({
			...deviceData,
			userId: this.id,
		});
	}

	/**
	 * Updates the user's last login time.
	 * @param {Date} time - The login time.
	 */
	public async updateLoginTime(time: Date): Promise<void> {
		this.loginAt = time;
		await this.save();
	}

	/**
	 * Records a new login attempt, updating device info and login time.
	 * @param {any} device - The device information for the login attempt.
	 */
	public async newLoginAttempt(device: any): Promise<void> {
		this.loginAt = device.time;
		if (this.countryCode !== device.countryCode) {
			this.countryCode = device.countryCode;
		}

		await this.createDevice(device);
		await this.save();
	}

	/**
	 * Changes user password
	 */
	public async changePasswordReset(password: string): Promise<boolean> {
		if (!password) return false;
		this.password = password;
		this.resetCount++;
		await this.save();
		NodeCacheInstance.delete(`auth_user:${this.id}`);
		return true;
	}

	/**
	 * Changes account holder name
	 */
	public async changeName(name: string): Promise<void> {
		if (!name) {
			throw new Error('Name is required');
		}
		this.accountHolder = name;
		await this.save();
	}

	/**
	 * Returns basic user info for client
	 */
	public async basicUserInformation(): Promise<Partial<UserOutputInformation>> {
		const tr = await User.getSubscriptionTargetResolution(this.subscriptionId);

		return {
			setupFinish: this.setupFinished,
			name: this.accountHolder,
			email: this.email,
			subscription: this.subscriptionId != null,
			tr,
		};
	}
}

export const bootstrap = (sequelize: Sequelize) => {
	User.init(
		{
			id: {
				type: DataTypes.UUID,
				primaryKey: true,
				allowNull: false,
				defaultValue: DataTypes.UUIDV4,
			},
			setupFinished: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			accountHolder: {
				type: DataTypes.STRING(25),
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING(80),
				allowNull: false,
				unique: true,
			},
			password: {
				type: DataTypes.STRING(72),
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
			subscriptionId: {
				type: DataTypes.STRING(85),
				allowNull: true,
				unique: true,
			},
			streamingCount: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			resetCount: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			role: {
				type: DataTypes.ENUM('user', 'admin', 'manager'),
				allowNull: false,
				defaultValue: 'user',
			},
			loginAt: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: null,
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
			modelName: 'User',
			tableName: 'Users',
			timestamps: true,
			deletedAt: true,
			paranoid: true,
			indexes: [{ unique: true, fields: ['email'] }],
		},
	);

	User.beforeCreate(async (user) => {
		if (user.password) {
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(user.password, salt);
		}
	});

	User.beforeUpdate(async (user) => {
		if (user.changed('password') && user.password) {
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(user.password, salt);
		}

		if (user.changed('subscriptionId') && user.subscriptionId) {
			user.setupFinished = true;
		}
	});

	User.afterUpdate(async (user, options) => {
		const clearCaches = async () => {
			await RedisServiceInstance.delete(`user:${user.id}`);
			NodeCacheInstance.delete(`auth_user:${user.id}`);
		};

		if (options.transaction) {
			options.transaction.afterCommit(() => {
				void clearCaches();
			});
			return;
		}

		await clearCaches();
	});
};

export default User;
