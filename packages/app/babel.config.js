module.exports = function (api) {
	api.cache(true);
	return {
		presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
		plugins: [
			'react-native-reanimated/plugin', // Keep this for Reanimated
		],
		env: {
			production: {
				plugins: ['transform-remove-console'],
			},
		},
	};
};
