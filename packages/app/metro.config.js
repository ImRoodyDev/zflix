const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

module.exports = (() => {
	const projectRoot = __dirname;
	const monorepoRoot = path.resolve(projectRoot, '../..');

	const config = getDefaultConfig(__dirname);
	const { transformer, resolver } = config;

	// Monorepo support: keep Metro focused on the app and hoisted dependencies.
	// Watching the repository root makes web export crawl server/generated files.
	config.watchFolders = [path.resolve(monorepoRoot, 'node_modules')];
	config.resolver.nodeModulesPaths = [
		path.resolve(projectRoot, 'node_modules'),
		path.resolve(monorepoRoot, 'node_modules'),
	];

	const defaultResolveRequest = config.resolver.resolveRequest;
	config.resolver.resolveRequest = (context, moduleName, platform) => {
		if (moduleName === 'react') {
			return {
				type: 'sourceFile',
				filePath: path.resolve(monorepoRoot, 'node_modules/react/index.js'),
			};
		}

		if (moduleName === 'react/jsx-runtime') {
			return {
				type: 'sourceFile',
				filePath: path.resolve(monorepoRoot, 'node_modules/react/jsx-runtime.js'),
			};
		}

		if (moduleName === 'react/jsx-dev-runtime') {
			return {
				type: 'sourceFile',
				filePath: path.resolve(monorepoRoot, 'node_modules/react/jsx-dev-runtime.js'),
			};
		}

		if (moduleName === 'pretty-format') {
			return {
				type: 'sourceFile',
				filePath: path.resolve(monorepoRoot, 'node_modules/pretty-format/build/index.js'),
			};
		}

		return defaultResolveRequest
			? defaultResolveRequest(context, moduleName, platform)
			: context.resolveRequest(context, moduleName, platform);
	};

	config.transformer = {
		...transformer,
		babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
	};
	config.resolver = {
		...resolver,
		assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
		sourceExts: [...resolver.sourceExts, 'svg'],
		extraNodeModules: {
			...(resolver.extraNodeModules || {}),
		},
	};
	return withNativeWind(config, { input: './src/styles/global.css' });
})();
