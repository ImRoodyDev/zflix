import { UAParser } from 'ua-parser-js';

export function parseDeviceHeader(agent: string) {
	// Get device information
	const parser = new UAParser();
	parser.setUA(agent);
	const parsed = parser.getResult();

	// Extract relevant information
	const browserName = parsed.browser.name ?? '';
	const osName = parsed.os.name ?? '';
	const osVersion = parsed.os.version ?? '';
	const deviceVendor = parsed.device.vendor ?? 'Unknown';
	const deviceModel = parsed.device.model ?? '';
	const deviceType = parsed.device.type ?? 'Unknown';

	return {
		name: parsed.device.model == null ? `${browserName} ${osName} ${osVersion}`.trim() : `${browserName} ${deviceVendor} ${deviceModel}`.trim(),
		type: deviceType,
	};
}
