'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.bulkInsert(
			'Languages',
			[
				{
					code: 'en',
					name: 'English',
				},
				{
					code: 'fr',
					name: 'French',
				},
				{
					code: 'es',
					name: 'Spanish',
				},
				{
					code: 'nl',
					name: 'Dutch',
				},
			],
			{}
		);
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('Languages', null, {});
	},
};
