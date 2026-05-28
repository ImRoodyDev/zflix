// Internal dependencies
import * as ENV from 'dotenv';
// Setup environment
ENV.config();

// Dependencies depended on environment variables
import { DatabaseService } from '@core/infrastructure/data/database';
import RedisService from '@core/infrastructure/data/redis';
import { isDevelopment } from '@utils/standard';

// Start Servers
(async () => {
	console.log('\nDevelopment Mode:', isDevelopment());
	// Initialize Services
	DatabaseService.initialize();
	RedisService.connect();
	console.log('Starting servers...');
	require('./src/api/webhooks').default();
	require('./src/api/server').default();
	console.log('Server started at:', new Date().toLocaleString());
})();

// Graceful shutdown: close HTTP servers first (drain in-flight requests),
// then disconnect backing services so no new work is accepted.
const gracefulShutdown = async (signal: string) => {
	console.log(signal);

	// Import server instances created by the start functions above
	const { serverInstance } = require('./src/api/server');
	const { webhookServerInstance } = require('./src/api/webhooks');

	// Close HTTP servers so they stop accepting new connections
	if (serverInstance) serverInstance.close();
	if (webhookServerInstance) webhookServerInstance.close();

	// Disconnect backing services after servers are closed
	await RedisService.disconnect();
	await DatabaseService.disconnect();
	process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
