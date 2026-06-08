'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. AppConfigurations
		await queryInterface.createTable('AppConfigurations', {
			id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			maintenanceMode: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			allowUserRegistrations: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			maxUsers: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 1000,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// 2. Avatars
		await queryInterface.createTable('Avatars', {
			id: {
				type: Sequelize.STRING(25),
				primaryKey: true,
				allowNull: false,
			},
			imagePath: {
				type: Sequelize.STRING(255),
				allowNull: true,
			},
		});

		// 3. Certifications
		await queryInterface.createTable('Certifications', {
			id: {
				type: Sequelize.STRING(25),
				primaryKey: true,
				allowNull: false,
			},
			names: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
		});

		// 4. Countries
		await queryInterface.createTable('Countries', {
			code: {
				type: Sequelize.STRING(5),
				primaryKey: true,
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING(30),
				allowNull: false,
			},
			allowed: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
		});

		// 5. Languages
		await queryInterface.createTable('Languages', {
			code: {
				type: Sequelize.STRING(5),
				primaryKey: true,
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING(30),
				allowNull: false,
			},
		});

		// 6. Plans
		await queryInterface.createTable('Plans', {
			id: {
				type: Sequelize.STRING(50),
				primaryKey: true,
				allowNull: false,
			},
			public_id: {
				type: Sequelize.STRING(50),
				unique: true,
				allowNull: false,
			},
			stripePriceId: {
				type: Sequelize.STRING(255),
				allowNull: true,
				defaultValue: null,
			},
			isActive: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			autoRenewal: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			tier: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			names: {
				type: Sequelize.TEXT('long'),
				allowNull: false,
			},
			descriptions: {
				type: Sequelize.TEXT('long'),
				allowNull: false,
			},
			price: {
				type: Sequelize.DECIMAL(4, 2),
				allowNull: false,
			},
			currency: {
				type: Sequelize.STRING(4),
				allowNull: false,
			},
			maxPaymentFailure: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 3,
			},
			maxScreen: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 1,
			},
			index: {
				type: Sequelize.BIGINT,
				allowNull: false,
				defaultValue: 0,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// 7. PlanCountries
		await queryInterface.createTable('PlanCountries', {
			planId: {
				type: Sequelize.STRING(50),
				references: {
					model: 'Plans',
					key: 'id',
				},
				allowNull: false,
				primaryKey: true,
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			},
			countryCode: {
				type: Sequelize.STRING(5),
				references: {
					model: 'Countries',
					key: 'code',
				},
				allowNull: false,
				primaryKey: true,
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			},
		});
		await queryInterface.addIndex('PlanCountries', ['planId', 'countryCode'], {
			unique: true,
		});

		// 8. Users
		await queryInterface.createTable('Users', {
			id: {
				type: Sequelize.UUID,
				primaryKey: true,
				allowNull: false,
				defaultValue: Sequelize.UUIDV4,
			},
			setupFinished: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			accountHolder: {
				type: Sequelize.STRING(25),
				allowNull: false,
			},
			email: {
				type: Sequelize.STRING(80),
				allowNull: false,
				unique: true,
			},
			password: {
				type: Sequelize.STRING(72),
				allowNull: false,
			},
			countryCode: {
				type: Sequelize.STRING(5),
				allowNull: false,
				references: {
					model: 'Countries',
					key: 'code',
				},
				onUpdate: 'CASCADE',
				onDelete: 'RESTRICT',
			},
			subscriptionId: {
				type: Sequelize.STRING(85),
				allowNull: true,
				unique: true,
			},
			streamingCount: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			resetCount: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			role: {
				type: Sequelize.ENUM('user', 'admin', 'manager'),
				allowNull: false,
				defaultValue: 'user',
			},
			loginAt: {
				type: Sequelize.DATE,
				allowNull: true,
				defaultValue: null,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			deletedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		});
		await queryInterface.addIndex('Users', ['email'], {
			unique: true,
		});

		// 9. Devices
		await queryInterface.createTable('Devices', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'Users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			name: {
				type: Sequelize.STRING(60),
				allowNull: false,
			},
			type: {
				type: Sequelize.STRING(60),
				allowNull: false,
			},
			ip: {
				type: Sequelize.STRING(60),
				allowNull: false,
			},
			city: {
				type: Sequelize.STRING(60),
				allowNull: false,
			},
			countryCode: {
				type: Sequelize.STRING(5),
				allowNull: false,
				references: {
					model: 'Countries',
					key: 'code',
				},
				onUpdate: 'CASCADE',
				onDelete: 'RESTRICT',
			},
			loggedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});
		await queryInterface.addIndex('Devices', ['userId']);
		await queryInterface.addIndex('Devices', ['userId', 'ip'], {
			unique: true,
		});

		// 10. Subscriptions
		await queryInterface.createTable('Subscriptions', {
			id: {
				type: Sequelize.STRING(85),
				primaryKey: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'Users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			planId: {
				type: Sequelize.STRING(255),
				allowNull: false,
				references: {
					model: 'Plans',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'RESTRICT',
			},
			active: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			status: {
				type: Sequelize.ENUM('ACTIVE', 'APPROVED', 'CREATED', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'INVALID'),
				allowNull: false,
				defaultValue: 'CREATED',
			},
			startAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			expiredAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			nextBillingAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			cancelledAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			pausedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			lastPaymentAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			failedPayments: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			links: {
				type: Sequelize.TEXT('long'),
				allowNull: true,
			},
			source: {
				type: Sequelize.STRING(255),
				allowNull: false,
			},
			oneTimePayment: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			deletedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		});
		await queryInterface.addIndex('Subscriptions', ['userId']);
		await queryInterface.addIndex('Subscriptions', ['planId']);

		// Add FK constraint for Users.subscriptionId -> Subscriptions.id (deferred because Users is created before Subscriptions)
		await queryInterface.addConstraint('Users', {
			fields: ['subscriptionId'],
			type: 'foreign key',
			name: 'fk_users_subscriptionId',
			references: {
				table: 'Subscriptions',
				field: 'id',
			},
			onUpdate: 'CASCADE',
			onDelete: 'SET NULL',
		});

		// 11. AccessCodes
		await queryInterface.createTable('Accesscodes', {
			code: {
				type: Sequelize.STRING(25),
				primaryKey: true,
				allowNull: false,
			},
			planId: {
				type: Sequelize.STRING(50),
				allowNull: false,
				references: {
					model: 'Plans',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'RESTRICT',
			},
			validFor: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 1,
			},
			isMonthly: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			subscriptionId: {
				type: Sequelize.STRING(85),
				allowNull: true,
				references: { model: 'Subscriptions', key: 'id' },
				onUpdate: 'CASCADE',
				onDelete: 'SET NULL',
			},
			userId: {
				type: Sequelize.UUID,
				allowNull: true,
				references: { model: 'Users', key: 'id' },
				onUpdate: 'CASCADE',
				onDelete: 'SET NULL',
			},
			requestedBy: {
				type: Sequelize.STRING(255),
				allowNull: true,
			},
			used: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn('NOW'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn('NOW'),
			},
		});
		await queryInterface.addIndex('Accesscodes', ['code', 'userId']);

		// 12. Billings
		await queryInterface.createTable('Billings', {
			transactionId: {
				type: Sequelize.STRING(255),
				primaryKey: true,
				allowNull: false,
			},
			subscriptionId: {
				type: Sequelize.STRING(85),
				allowNull: false,
				references: {
					model: 'Subscriptions',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'RESTRICT',
			},
			userId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'Users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			currency: {
				type: Sequelize.STRING(5),
				allowNull: false,
			},
			amount: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: false,
			},
			method: {
				type: Sequelize.STRING(20),
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			deletedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		});
		await queryInterface.addIndex('Billings', ['subscriptionId']);
		await queryInterface.addIndex('Billings', ['userId']);

		// 13. Profiles
		await queryInterface.createTable('Profiles', {
			id: {
				type: Sequelize.UUID,
				primaryKey: true,
				allowNull: false,
				defaultValue: Sequelize.UUIDV4,
			},
			userId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'Users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			primary: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			profileName: {
				type: Sequelize.STRING(255),
				allowNull: false,
			},
			autoPlay: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			defaultSubtitle: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			avatarId: {
				type: Sequelize.STRING(25),
				allowNull: true,
				references: {
					model: 'Avatars',
					key: 'id',
				},
				defaultValue: 'AM-188-X200-H200',
				onUpdate: 'CASCADE',
				onDelete: 'SET NULL',
			},
			certificationId: {
				type: Sequelize.STRING(25),
				allowNull: false,
				references: {
					model: 'Certifications',
					key: 'id',
				},
				defaultValue: 'NC-17',
				onUpdate: 'CASCADE',
				onDelete: 'RESTRICT',
			},
			languageCode: {
				type: Sequelize.STRING(3),
				allowNull: false,
				defaultValue: 'en',
				references: {
					model: 'Languages',
					key: 'code',
				},
				onUpdate: 'CASCADE',
				onDelete: 'RESTRICT',
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			deletedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		});
		await queryInterface.addIndex('Profiles', ['userId']);
		await queryInterface.addIndex('Profiles', ['userId', 'profileName'], {
			unique: true,
		});

		// 14. Activities
		await queryInterface.createTable('Activities', {
			key: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			id: {
				type: Sequelize.STRING(25),
				allowNull: false,
			},
			profileId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'Profiles',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			userId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'Users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			type: {
				type: Sequelize.STRING(15),
				allowNull: false,
			},
			runtimes: {
				type: Sequelize.TEXT('long'),
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});
		await queryInterface.addIndex('Activities', ['profileId']);
		await queryInterface.addIndex('Activities', ['userId']);
		await queryInterface.addIndex('Activities', ['profileId', 'id'], {
			unique: true,
		});

		// 15. Bookmarks
		await queryInterface.createTable('Bookmarks', {
			id: {
				type: Sequelize.STRING(25),
				primaryKey: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'Users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			profileId: {
				type: Sequelize.UUID,
				primaryKey: true,
				allowNull: false,
				references: {
					model: 'Profiles',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			type: {
				type: Sequelize.STRING(15),
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});
		await queryInterface.addIndex('Bookmarks', ['profileId']);

		// 16. Resets
		await queryInterface.createTable('Resets', {
			id: {
				type: Sequelize.STRING(255),
				primaryKey: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'Users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			completed: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});
		await queryInterface.addIndex('Resets', ['userId']);
	},

	async down(queryInterface, Sequelize) {
		// Drop tables in reverse order
		await queryInterface.dropTable('Resets');
		await queryInterface.dropTable('Bookmarks');
		await queryInterface.dropTable('Activities');
		await queryInterface.dropTable('Profiles');
		await queryInterface.dropTable('Billings');
		await queryInterface.dropTable('Accesscodes');
		// Remove FK constraint before dropping Subscriptions/Users
		await queryInterface.removeConstraint('Users', 'fk_users_subscriptionId');
		await queryInterface.dropTable('Subscriptions');
		await queryInterface.dropTable('Devices');
		await queryInterface.dropTable('Users');
		await queryInterface.dropTable('PlanCountries');
		await queryInterface.dropTable('Plans');
		await queryInterface.dropTable('Languages');
		await queryInterface.dropTable('Countries');
		await queryInterface.dropTable('Certifications');
		await queryInterface.dropTable('Avatars');
		await queryInterface.dropTable('AppConfigurations');
	},
};
