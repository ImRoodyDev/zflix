'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.bulkInsert(
			'AppConfigurations',
			[
				{
					id: 1,
					maintenanceMode: false,
					allowUserRegistrations: true,
					maxUsers: 1000,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{},
		);
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('AppConfigurations', null, {});
	},
};
