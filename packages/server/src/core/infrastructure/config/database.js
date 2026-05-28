module.exports = {
	development: {
		database: process.env.SEQUELIZE_DB,
		username: process.env.SEQUELIZE_USER,
		password: process.env.SEQUELIZE_PASS,
		host: process.env.SEQUELIZE_HOST,
		dialect: process.env.SEQUELIZE_DIALECT,
		port: process.env.SEQUELIZE_PORT,
		logging: process.env.SEQUELIZE_LOGGING,
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
