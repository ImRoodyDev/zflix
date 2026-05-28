/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/test'],
	setupFiles: ['dotenv/config'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@api/(.*)$': '<rootDir>/src/api/$1',
		'^@app/(.*)$': '<rootDir>/src/application/$1',
		'^@core/(.*)$': '<rootDir>/src/core/$1',
		'^@utils/(.*)$': '<rootDir>/src/utils/$1',
		'^@types/(.*)$': '<rootDir>/src/types/$1',
		'^@generated/(.*)$': '<rootDir>/generated/$1',
	},
	testPathIgnorePatterns: ['<rootDir>/test/subscription-concurrency.test.ts'],
	testTimeout: 60000,
	clearMocks: true,
};
