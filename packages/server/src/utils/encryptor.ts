import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import {Buffer} from 'buffer';
import {ProcessError} from "@/types/ProcessError";

/**
 * Provides utility functions for encryption, decryption, and hashing.
 */
export class Encryptor {

	/**
	 * Hashes a string using the MD5 algorithm.
	 * @param text The string to hash.
	 * @returns A 32-character MD5 hash.
	 */
	static hashWithMD5(text: string): string {
		return crypto.createHash('md5').update(text).digest('hex'); // Produces a 32-character hash
	}

	/**
	 * Hashes a string using the SHA256 algorithm.
	 * @param text The string to hash.
	 * @returns A SHA256 hash.
	 */
	static hashWithSHA256(text: string): string {
		return crypto.createHash('sha256').update(text).digest('hex');
	}

	/**
	 * Hashes a string using bcrypt.
	 * @param text The string to hash.
	 * @param saltRounds The cost factor for hashing. Defaults to 10.
	 * @returns A promise that resolves to the bcrypt hash.
	 */
	static async bcryptHash(text: string, saltRounds: number = 10): Promise<string> {
		return await bcrypt.hash(text, saltRounds);
	}

	/**
	 * Compares a plain text string with a bcrypt hash.
	 * @param text The plain text string.
	 * @param hash The bcrypt hash to compare against.
	 * @returns A promise that resolves to true if the text matches the hash, false otherwise.
	 */
	static async bcryptCompare(text: string, hash: string): Promise<boolean> {
		return await bcrypt.compare(text, hash);
	}

	/**
	 * Encrypts a value using AES-128-CBC.
	 * @param value The string or number to encrypt.
	 * @param encryptionKey A 32-character hex string (16 bytes) to be used as the encryption key.
	 * @param customIv An optional 32-character hex string (16 bytes) for the initialization vector. If not provided, a random IV will be generated.
	 * @returns The encrypted value, prefixed with the IV.
	 */
	static encryptId(value: string | number, encryptionKey: string, customIv?: string): string {
		// Use a custom IV if provided, otherwise generate a random 16-byte IV.
		const iv = customIv ? Buffer.from(customIv, 'hex') : crypto.randomBytes(16);
		const key = Buffer.from(encryptionKey, 'hex');

		// The key must be 16 bytes (128 bits) for AES-128.
		if (key.length !== 16) {
			throw new ProcessError({
				details: {key: value},
				message: 'Encryption key must be 16 bytes (32 hex characters) long. (AES-128)',
				code: 'INVALID_ENCRYPTION_KEY_LENGTH',
				expose: true
			});
		}

		// Create a cipher using the AES-128-CBC algorithm, key, and IV.
		const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
		// Encrypt the value and convert it to a hex string.
		let encryptedHex = cipher.update(`${value}`, 'utf-8', 'hex');
		encryptedHex += cipher.final('hex');
		// Prepend the IV to the encrypted hex string for later use in decryption.
		return `${iv.toString('hex')}${encryptedHex}`;
	}

	/**
	 * Decrypt a value using AES-128-CBC
	 * @param encryptedValue - IV + encrypted hex string
	 * @param encryptionKey - 32-character hex key (16 bytes)
	 * @returns Decrypted ID
	 */
	static decryptId(encryptedValue: string, encryptionKey: string): string {
		// Validate encryption key: must be a 32-character hex string (16 bytes)
		if (!encryptionKey || encryptionKey.length < 32) throw new ProcessError({
			details: {encryptionKey},
			message: 'Invalid encrypted value provided for decryption.',
			code: 'INVALID_ENCRYPTED_VALUE',
			expose: true
		});

		// The IV is the first 32 characters (16 bytes) of the encrypted value.
		const iv = Buffer.from(`${encryptedValue}`.slice(0, 32), 'hex');
		const key = Buffer.from(encryptionKey, 'hex');

		// The IV and key must be 16 bytes long for AES-128.
		if (iv.length !== 16 || key.length !== 16) {
			throw new ProcessError({
				details: {encryptedValue},
				message: 'Invalid encrypted value or encryption key provided for decryption.',
				code: 'INVALID_DECRYPTION_PARAMETERS',
				expose: true
			});
		}

		// The encrypted data is the rest of the string after the IV.
		const encryptedHex = encryptedValue.slice(32);

		// Decrypt the data using the key and IV.
		const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
		let decryptedValue = decipher.update(encryptedHex, 'hex', 'utf-8');
		decryptedValue += decipher.final('utf-8');

		return decryptedValue;
	}
}
