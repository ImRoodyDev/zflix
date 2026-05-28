import fs from 'fs';
import path from 'path';

const flattenKeys = (obj: Record<string, any>, prefix = ''): string[] => {
	return Object.keys(obj).reduce((acc: string[], key) => {
		const pre = prefix.length ? prefix + '.' : '';
		if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
			acc.push(...flattenKeys(obj[key], pre + key));
		} else {
			acc.push(pre + key);
		}
		return acc;
	}, []);
};

export const validateLocales = () => {
	const localesDir = path.resolve(__dirname, '../locales');

	if (!fs.existsSync(localesDir)) {
		console.warn('Locales directory not found:', localesDir);
		return;
	}

	const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));
	const enFile = files.find((f) => f === 'en.json');

	if (!enFile) {
		// If no en.json, maybe we can't validate against a master.
		// Or we just skip.
		return;
	}

	const enContent = JSON.parse(fs.readFileSync(path.join(localesDir, enFile), 'utf-8'));
	const enKeys = new Set(flattenKeys(enContent));

	files.forEach((file) => {
		if (file === 'en.json') return;

		const filePath = path.join(localesDir, file);
		const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
		const keys = new Set(flattenKeys(content));

		const missingKeys = [...enKeys].filter((k) => !keys.has(k));

		if (missingKeys.length > 0) {
			throw new Error(`Localization consistency check failed.\nFile '${file}' is missing the following keys present in 'en.json':\n${missingKeys.join('\n')}`);
		}
	});
};
