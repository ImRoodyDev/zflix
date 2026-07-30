export function smartRound(num: number, threshold = 0.3) {
	const whole = Math.round(num);
	const diff = Math.abs(num - whole);
	// If the number is within the threshold of a whole number, round it
	if (diff <= threshold) {
		return whole;
	}
	// Otherwise, return the original number
	return Math.floor(num);
}

/**
 * Wait for the provided amount of time in milliseconds.
 *
 * @param time - The amount of time to wait in milliseconds.
 * @returns A promise that resolves after the specified delay.
 */
export function delay(time: number): Promise<void> {
	if (time < 0) {
		throw new Error('Time must be a positive number');
	}
	return new Promise((resolve) => setTimeout(resolve, time));
}

// Convert days to seconds
export const daysToSeconds = (days: number): number => {
	return Math.floor(days * 24 * 60 * 60);
};

// Convert minutes to seconds
export const minutesToSeconds = (minutes: number): number => {
	return Math.floor(minutes * 60);
};

// Convert hours to seconds
export const hoursToSeconds = (hours: number): number => Math.floor(hours * 60 * 60);

// Calculate the number of seconds left in the current day
export const secondsLeftInDay = (): number => {
	const now = new Date();
	const secondsElapsed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
	return 24 * 60 * 60 - secondsElapsed;
};

// Format the given minutes into a string with the hours and minutes
export const formatMinutes = (minutes: number): string => {
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	if (hours > 0) return `${hours}h ${remainingMinutes}m`;
	return `${remainingMinutes}m`;
};

export function elapsedMinutes(date: Date): number {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
	return Math.floor(diffInSeconds / 60);
}

// Format a string with the given arguments
export function format(template: string, ...args: string[]) {
	return template.replace(/%s/g, () => args.shift() ?? '');
}

// Check if the given URL is valid
export function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

// Sanitize a message by removing quotes and extra spaces
export const sanitizeMessage = (value: string): string =>
	value.replace(/\\"/g, '"').replace(/"/g, '').replace(/\s+/g, ' ').trim();

// Find the index of the certification with the given code
export function certificationIndexByCode(code?: string) {
	const certifications = window.application.certifications || [];
	if (!code) {
		// Return the highest level certification if no code is provided
		return certifications.findIndex((cert) => cert.level === Math.max(...certifications.map((c) => c.level)));
	}
	return certifications.findIndex((cert) => cert.code === code);
}

// Type guard to check if a value is not undefined or null
export function isNotEmpty<T>(value: T | undefined): value is T {
	return value !== undefined && value !== null;
}

export function commaSplitter(input: string | undefined): string[] {
	if (!input) return [];
	return input.split(',').map((part) => part.trim());
}

export type QueryValue = string | number | boolean | null | undefined;

export function buildQueryParams(query: Record<string, QueryValue>): string {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(query)) {
		if (value === undefined || value === null || value === '') {
			continue;
		}

		params.append(key, String(value));
	}

	return params.toString();
}

export function appendQuery(endpoint: string, query: Record<string, QueryValue>): string {
	const serialized = buildQueryParams(query);
	return serialized ? `${endpoint}?${serialized}` : endpoint;
}

export function hexToRgba(hex: string, alpha: number): string {
	const cleanHex = hex.replace('#', '');

	const r = parseInt(cleanHex.substring(0, 2), 16);
	const g = parseInt(cleanHex.substring(2, 4), 16);
	const b = parseInt(cleanHex.substring(4, 6), 16);

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function lightenHexColor(hex: string, amount = 0.18): string {
	const cleanHex = hex.replace('#', '');
	const normalizedHex =
		cleanHex.length === 3
			? cleanHex
					.split('')
					.map((char) => char + char)
					.join('')
			: cleanHex;

	if (!/^[0-9a-fA-F]{6}$/.test(normalizedHex)) return hex;

	const clampedAmount = Math.min(Math.max(amount, 0), 1);
	const r = parseInt(normalizedHex.substring(0, 2), 16);
	const g = parseInt(normalizedHex.substring(2, 4), 16);
	const b = parseInt(normalizedHex.substring(4, 6), 16);
	const lighten = (channel: number) => Math.round(channel + (255 - channel) * clampedAmount);

	return `#${[lighten(r), lighten(g), lighten(b)].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
