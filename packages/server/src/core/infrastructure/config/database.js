module.exports = {
	development: {
		username: process.env.SEQUELIZE_USER ?? 'root',
		password: process.env.SEQUELIZE_PASS ?? '1234',
		database: process.env.SEQUELIZE_DB ?? 'development',
		host: process.env.SEQUELIZE_HOST ?? '127.0.0.1',
		dialect: process.env.SEQUELIZE_DIALECT ?? 'mysql',
		port: process.env.SEQUELIZE_PORT ?? '3306',
		logging: process.env.SEQUELIZE_LOGGING ?? 'false',
	},
	production: {
		database: process.env.SEQUELIZE_DB,
		username: process.env.SEQUELIZE_USER,
		password: process.env.SEQUELIZE_PASS,
		host: process.env.SEQUELIZE_HOST,
		dialect: process.env.SEQUELIZE_DIALECT,
		port: process.env.SEQUELIZE_PORT,
		logging: process.env.SEQUELIZE_LOGGING,
	},
};
