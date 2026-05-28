import js from '@eslint/js';
import tseslintParser from '@typescript-eslint/parser';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

export default [
	{
		ignores: ['dist/**', 'test/**', 'node_modules/**', 'public/**', '**/migrations/**', '**/seeders/**'],
	},
	js.configs.recommended,
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
		languageOptions: {
			globals: {
				process: 'readonly',
				console: 'readonly',
				module: 'readonly',
				require: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				exports: 'readonly',
				Buffer: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				setImmediate: 'readonly',
				clearImmediate: 'readonly',
				NodeJS: 'readonly',
			},
		},
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tseslintParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tseslintPlugin,
		},
		rules: {
			...tseslintPlugin.configs.recommended.rules,
			...prettierConfig.rules,
			'no-unused-vars': 'off',
			'no-undef': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'no-console': 'off',
			'@typescript-eslint/no-namespace': 'off',
		},
	},
];
