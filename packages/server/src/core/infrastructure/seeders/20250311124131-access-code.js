'use strict';
// Register ts-node to handle TypeScript imports with proper configuration
const path = require('path');
require('ts-node').register({
	transpileOnly: true, // Skip type checking - only transpile, don't type check
	project: path.resolve(__dirname, '../../../../tsconfig.json'), // Use project's tsconfig
	compilerOptions: {
		skipLibCheck: true, // Skip type checking of declaration files
	},
});
require('tsconfig-paths/register');

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const sequelize = queryInterface.sequelize;

		// Load and initialize models
		const AccessCodeModule = require(path.resolve(__dirname, '../../models/access-code.ts'));

		// Initialize models with Sequelize instance if not already initialized
		if (AccessCodeModule.bootstrap && !sequelize.models.AccessCode) {
			AccessCodeModule.bootstrap(sequelize);
		}

		// Get model instances (use from sequelize.models if available, otherwise from module)
		const AccessCode = sequelize.models.AccessCode || AccessCodeModule.default || AccessCodeModule;

		// Query plans directly from database to ensure we get the data
		// This is more reliable than using the model which might not be fully initialized
		const plans = await sequelize.query('SELECT id FROM Plans WHERE isActive = true', {
			type: Sequelize.QueryTypes.SELECT,
		});

		// Validate that plans exist
		if (!plans || plans.length === 0) {
			throw new Error('No active plans found. Please run the plans seeder first.');
		}

		// Generating random access codes for seeding
		const accessCodes = Array.from({ length: 50 }).map(() => {
			const randomPlan = plans[Math.floor(Math.random() * plans.length)];
			return {
				code: AccessCode.generateAccessCode(),
				planId: randomPlan.id, // Use seeded plans
				userId: null,
				subscriptionId: null,
				isMonthly: Math.random() > 0.5, // Randomly setting whether the access code is monthly
				validFor: Math.floor(Math.random() * 6) + 1, // Random validity period between 1 and 12 months
				requestedBy: 'AUTO', // Placeholder for requestedBy
				createdAt: new Date(),
				updatedAt: new Date(),
			};
		});

		await queryInterface.bulkInsert('Accesscodes', accessCodes, {});
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('Accesscodes', null, {});
	},
};
