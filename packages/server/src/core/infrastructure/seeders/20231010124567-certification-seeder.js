'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.bulkInsert(
			'Certifications',
			[
				{
					id: 'PG',
					names: JSON.stringify({ en: 'For little kids only' }),
				},
				{
					id: 'PG-13',
					names: JSON.stringify({ en: 'For older kids and below' }),
				},
				{
					id: 'R',
					names: JSON.stringify({ en: 'For teens and below' }),
				},
				{
					id: 'NC-17',
					names: JSON.stringify({ en: 'No restriction for adults only' }),
				},
			],
			{}
		);
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('Certifications', null, {});
	},
};
