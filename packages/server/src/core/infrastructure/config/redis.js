const config = {
	mode: process.env.REDIS_MODE ?? 'local',
	local: {
		host: process.env.REDIS_LOCAL_HOST ?? '127.0.0.1',
		port: Math.max(0, Number.parseInt(process.env.REDIS_LOCAL_PORT ?? '6379', 10) || 6379),
	},
	external: {
		url: process.env.REDIS_EXTERNAL_URL ?? '',
	},
};

module.exports = config;
