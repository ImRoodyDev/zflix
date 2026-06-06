'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.bulkInsert(
			'Countries',
			[
				{
					code: '##',
					name: 'All Countries',
				},
				{
					code: 'US',
					name: 'United States',
				},
				{
					code: 'CA',
					name: 'Canada',
				},
				{
					code: 'GB',
					name: 'United Kingdom',
				},
				{
					code: 'AU',
					name: 'Australia',
				},
				{
					code: 'FR',
					name: 'France',
				},
				{
					code: 'NL',
					name: 'Netherlands',
				},
				{
					code: 'CW',
					name: 'Curaçao',
				},
			],
			{},
		);
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('Countries', null, {});
	},
};
