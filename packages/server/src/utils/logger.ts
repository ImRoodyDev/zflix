// import config from '@core/infrastructure/config/application';
/**
 * Log level types for categorizing log messages
 * - info: General informational messages
 * - warn: Warning messages for potential issues
 * - error: Error messages for failures
 * - debug: Detailed debugging information
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

type LoggerOptions = {
	force?: boolean;
};

/**
 * Logger class for handling application logging with environment-aware behavior
 * Automatically adjusts logging output based on ENV:
 * - Production: Only logs errors
 * - Development/Staging: Logs all levels (info, warn, error, debug)
 *
 * @example
 * logger.info('User logged in', { userId: 123 });
 * logger.error('Database connection failed', error);
 * logger.debug('Processing payment', { amount: 100, currency: 'USD' });
 */
class Logger {
	private static readonly RESET = '\u001b[0m';

	private static readonly LEVEL_BADGES: Record<LogLevel, string> = {
		info: '\u001b[44;97m [INFO] \u001b[0m',
		warn: '\u001b[43;97m [WARN] \u001b[0m',
		error: '\u001b[41;97m [ERROR] \u001b[0m',
		debug: '\u001b[45;97m [DEBUG] \u001b[0m',
	};

	/**
	 * Flag indicating if the application is running in production mode
	 * Used to control which log levels are output to console
	 */
	private readonly isProduction: boolean;

	/**
	 * Initializes the Logger and determines the current environment
	 * Sets up the isProduction flag based on ENV
	 */
	constructor() {
		// Check if running in production environment
		// Do it this way to avoid circular dependency issues with config ENV access
		this.isProduction = process.env.ENV === 'production';
	}

	private shouldWrite(level: LogLevel, options?: LoggerOptions): boolean {
		return options?.force === true || level === 'error' || !this.isProduction;
	}

	private createMessage(level: LogLevel, message: string): string {
		return `${Logger.LEVEL_BADGES[level]} ${message}${Logger.RESET}`;
	}

	private write(level: LogLevel, message: string, optionalParams: unknown[], options?: LoggerOptions): void {
		if (!this.shouldWrite(level, options)) return;

		const formattedMessage = this.createMessage(level, message);

		switch (level) {
			case 'warn':
				console.warn(formattedMessage, ...optionalParams);
				break;
			case 'error':
				console.error(formattedMessage, ...optionalParams);
				break;
			case 'debug':
				console.debug(formattedMessage, ...optionalParams);
				break;
			default:
				console.log(formattedMessage, ...optionalParams);
		}
	}

	/**
	 * Logs informational messages (only in non-production environments)
	 * Use for general application flow information
	 *
	 * @param message - The informational message to log
	 * @param optionalParams - Additional parameters to log (objects, values, etc.)
	 * @example
	 * logger.info('Server started', { port: 3000 });
	 */
	public info(message: string, ...optionalParams: unknown[]): void {
		this.write('info', message, optionalParams);
	}

	/**
	 * Logs warning messages (only in non-production environments)
	 * Use for potential issues that don't prevent execution
	 *
	 * @param message - The warning message to log
	 * @param optionalParams - Additional parameters to log (context, values, etc.)
	 * @example
	 * logger.warn('API rate limit approaching', { remaining: 10 });
	 */
	public warn(message: string, ...optionalParams: unknown[]): void {
		this.write('warn', message, optionalParams);
	}

	/**
	 * Logs error messages (ALWAYS logged, even in production)
	 * Use for errors, exceptions, and critical failures
	 *
	 * @param message - The error message to log
	 * @param optionalParams - Additional parameters to log (error objects, stack traces, context)
	 * @example
	 * logger.error('Failed to connect to database', error);
	 */
	public error(message: string, ...optionalParams: unknown[]): void {
		this.write('error', message, optionalParams);
	}

	/**
	 * Logs debug messages for detailed troubleshooting (only in non-production environments)
	 * Use for detailed technical information during development
	 *
	 * @param message - The debug message to log
	 * @param optionalParams - Additional parameters to log (detailed state, variables, etc.)
	 * @example
	 * logger.debug('Processing request', { headers, body, query });
	 */
	public debug(message: string, ...optionalParams: unknown[]): void {
		this.write('debug', message, optionalParams);
	}

	public force(level: LogLevel, message: string, ...optionalParams: unknown[]): void {
		this.write(level, message, optionalParams, { force: true });
	}

	/**
	 * Generic log method that delegates to specific log level methods
	 * Provides a unified interface for logging at different levels
	 *
	 * @param level - The log level (info, warn, error, or debug)
	 * @param message - The message to log
	 * @param optionalParams - Additional parameters to log
	 * @example
	 * logger.log('info', 'Application started');
	 * logger.log('error', 'Connection failed', error);
	 */
	public log(level: LogLevel, message: string, ...optionalParams: unknown[]): void {
		this.write(level, message, optionalParams);
	}
}

/**
 * Singleton logger instance for use throughout the application
 * Import and use this instance instead of creating new Logger instances
 *
 * @example
 * import { logger } from './utils/logger';
 * logger.info('Application started');
 */
const logger = new Logger();

export default logger;
