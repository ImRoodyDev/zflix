/* global fetch */
import Vibrant from 'node-vibrant';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import pLimit from 'p-limit';

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatedDir = path.join(__dirname, '..', 'generated');

// Request pacing and parallelism
const CONCURRENCY_DELAY_MS = 500;
const CONCURRENT_REQUEST_LIMIT = 8;
const SKIP_AVAILABLE_LOGOS = true; // Set to true to skip logos that already have colors (for testing)
const CHECKPOINT_EVERY_PROCESSED = 25;

const red = '\x1b[31m';
const brightWhite = '\x1b[97m';
const bgRed = '\x1b[41m';
const reset = '\x1b[0m';
const redBar = `${red}│${reset}`;

// Shuffle the list in place
function shuffleArray(items) {
	for (let index = items.length - 1; index > 0; index--) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[items[index], items[swapIndex]] = [items[swapIndex], items[index]];
	}

	return items;
}

// Simple async delay
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate relative luminance of a color
 * Formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/
 */
function getRelativeLuminance(hexColor) {
	if (!hexColor) return 0.5; // Default to neutral if no color

	const hex = hexColor.replace('#', '');
	const r = parseInt(hex.substr(0, 2), 16) / 255;
	const g = parseInt(hex.substr(2, 2), 16) / 255;
	const b = parseInt(hex.substr(4, 2), 16) / 255;

	const luminance =
		0.2126 * (r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)) +
		0.7152 * (g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)) +
		0.0722 * (b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4));

	return luminance;
}

/**
 * Determine if light or dark background would be better based on dominant color
 */
function determineBestBackground(palette) {
	const dominantColor = palette.Vibrant?.getHex() || palette.Muted?.getHex() || '#ffffff';

	const luminance = getRelativeLuminance(dominantColor);

	return luminance < 0.5 ? 'light' : 'dark';
}

/**
 * Extract colors from a single logo with robust error handling
 * Returns { success, palette, error, reason }
 */
async function extractLogoColors(logoUrl) {
	try {
		// Skip problematic image formats
		if (!logoUrl || typeof logoUrl !== 'string') {
			return { success: false, palette: null, reason: 'Invalid URL', error: null };
		}

		const urlLower = logoUrl.toLowerCase();

		// Skip animated formats
		if (urlLower.includes('.gif') || urlLower.includes('.webp')) {
			return { success: false, palette: null, reason: 'Animated format not supported', error: null };
		}

		// Fetch image with proper headers
		const response = await fetch(logoUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				Accept: 'image/*,*/*',
				'Accept-Encoding': 'gzip, deflate',
				'Cache-Control': 'no-cache',
			},
			timeout: 10000,
		});

		if (!response.ok) {
			return { success: false, palette: null, reason: `HTTP ${response.status}`, error: null };
		}

		const buffer = await response.arrayBuffer();

		// Validate buffer is not empty
		if (!buffer || buffer.byteLength === 0) {
			return { success: false, palette: null, reason: 'Empty buffer', error: null };
		}

		// Convert to Buffer
		let imageBuffer = Buffer.from(buffer);
		const contentType = (response.headers.get('content-type') || '').toLowerCase();
		const svgPrefix = imageBuffer.toString('utf8', 0, Math.min(512, imageBuffer.length)).trimStart();
		const isPng = imageBuffer.length >= 8 && imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50;
		const isJpeg = imageBuffer.length >= 3 && imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8;
		const isGif = imageBuffer.length >= 4 && imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49;
		const isWebp =
			imageBuffer.length >= 12 &&
			imageBuffer[0] === 0x52 &&
			imageBuffer[1] === 0x49 &&
			imageBuffer[2] === 0x46 &&
			imageBuffer[3] === 0x46 &&
			imageBuffer[8] === 0x57 &&
			imageBuffer[9] === 0x45 &&
			imageBuffer[10] === 0x42 &&
			imageBuffer[11] === 0x50;
		const isRasterMagic = isPng || isJpeg || isGif || isWebp;
		const isSvgByUrl = /\.svg(?:\?|$)/i.test(urlLower);
		const isSvgByHeader = contentType.includes('image/svg+xml') || contentType.includes('text/xml');
		const isSvgByContent = svgPrefix.startsWith('<svg') || svgPrefix.startsWith('<?xml');
		const isSvg = !isRasterMagic && (isSvgByHeader || isSvgByContent || isSvgByUrl);

		if (isSvg) {
			try {
				const svgText = imageBuffer.toString('utf8');
				const resvg = new Resvg(svgText, {
					fitTo: {
						mode: 'width',
						value: 512,
					},
				});
				const rendered = resvg.render();
				imageBuffer = Buffer.from(rendered.asPng());
			} catch (svgError) {
				return {
					success: false,
					palette: null,
					reason: 'SVG conversion failed',
					error: svgError instanceof Error ? svgError.message : String(svgError),
				};
			}
		}

		// Use sharp to validate and normalize the image
		try {
			const metadata = await sharp(imageBuffer).metadata();

			// Validate image dimensions
			if (!metadata.width || !metadata.height /* || metadata.width < 32 || metadata.height < 32*/) {
				return {
					success: false,
					palette: null,
					reason: `Invalid dimensions: ${metadata.width}x${metadata.height}`,
					error: null,
				};
			}

			// Convert to PNG if needed (removes alpha, ensures compatibility)
			const normalizedBuffer = await sharp(imageBuffer).png({ progressive: true }).toBuffer();

			// Extract colors using Vibrant
			const palette = await Vibrant.from(normalizedBuffer).maxDimension(200).getPalette();

			return { success: true, palette, reason: null, error: null };
		} catch {
			// If sharp fails to validate, try direct Vibrant extraction
			try {
				const palette = await Vibrant.from(imageBuffer).maxDimension(200).getPalette();
				return { success: true, palette, reason: null, error: null };
			} catch (vibrantError) {
				return {
					success: false,
					palette: null,
					reason: 'Color extraction failed',
					error: vibrantError instanceof Error ? vibrantError.message : String(vibrantError),
				};
			}
		}
	} catch (error) {
		return {
			success: false,
			palette: null,
			reason: 'Unexpected error',
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Format color from Vibrant swatch to hex string
 */
function formatColor(swatch) {
	return swatch ? swatch.getHex() : null;
}

async function writeJsonAtomic(filePath, data) {
	const tempPath = `${filePath}.tmp`;
	const serialized = JSON.stringify(data, null, 2);

	await fs.promises.writeFile(tempPath, serialized);

	try {
		await fs.promises.rename(tempPath, filePath);
	} catch (error) {
		const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : null;

		if (errorCode === 'EPERM' || errorCode === 'EACCES' || errorCode === 'EBUSY') {
			await fs.promises.writeFile(filePath, serialized);
			await fs.promises.unlink(tempPath).catch(() => {});
			return;
		}

		throw error;
	}
}

// Generate logo color files
async function generateIptvLogoColorBatches() {
	console.log('🎨 Building IPTV.org Logo Colors...');
	let handleSigint = null;

	try {
		// Fetch logos from IPTV.org API
		console.log('📡 Fetching logos from IPTV.org API...');
		const response = await fetch('https://iptv-org.github.io/api/logos.json');
		if (!response.ok) {
			throw new Error(`Failed to fetch logos: ${response.statusText}`);
		}
		const logos = await response.json();
		console.log(`📊 Total logos fetched: ${logos.length}`);
		const shuffledLogos = shuffleArray([...logos]);

		console.log(
			`📦 Processing ${shuffledLogos.length} logos with concurrency ${CONCURRENT_REQUEST_LIMIT} and ${CONCURRENCY_DELAY_MS}ms pacing...`,
		);

		const outputPath = path.join(generatedDir, 'iptv-logo-colors.json');
		const colorData = {};
		let processed = 0;
		let failed = 0;
		let skipped = 0;
		const failures = []; // Track failures with details

		let logosToProcess = shuffledLogos;

		if (SKIP_AVAILABLE_LOGOS && fs.existsSync(outputPath)) {
			try {
				const existingContent = fs.readFileSync(outputPath, 'utf8');
				const existingData = JSON.parse(existingContent);

				if (existingData && typeof existingData === 'object' && !Array.isArray(existingData)) {
					Object.assign(colorData, existingData);
					logosToProcess = shuffledLogos.filter((logo) => {
						const existingLogoEntry = existingData[logo.channel];
						const existingLogoUrl = existingLogoEntry?.logo?.url;
						return !(existingLogoEntry && existingLogoUrl && existingLogoUrl === logo.url);
					});

					skipped = shuffledLogos.length - logosToProcess.length;
					console.log(
						`⏭️  SKIP_AVAILABLE_LOGOS enabled: skipped ${skipped} logos already present by channel ID + URL.`,
					);
				}
			} catch (parseError) {
				const backupPath = `${outputPath}.corrupt-${Date.now()}.json`;
				try {
					fs.copyFileSync(outputPath, backupPath);
					console.warn(`⚠️  Existing output appears corrupted. Backed up to: ${backupPath}`);
				} catch {
					console.warn('⚠️  Existing output appears corrupted and could not be backed up.');
				}

				console.warn(
					`⚠️  Could not parse existing ${outputPath}. Continuing without skip optimization: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
				);
			}
		}

		console.log(`🚀 Logos queued for processing: ${logosToProcess.length}`);
		await writeJsonAtomic(outputPath, colorData);

		let writeQueue = Promise.resolve();
		let lastCheckpointProcessed = 0;
		const queueJsonWrite = () => {
			writeQueue = writeQueue
				.catch((writeError) => {
					console.warn(
						`⚠️  Previous checkpoint write failed, retrying: ${writeError instanceof Error ? writeError.message : String(writeError)}`,
					);
				})
				.then(() => writeJsonAtomic(outputPath, colorData));
			return writeQueue;
		};

		handleSigint = () => {
			console.log('\n⚠️  Interrupt received, saving checkpoint before exit...');
			queueJsonWrite()
				.then(() => {
					console.log('💾 Checkpoint saved.');
					process.exit(130);
				})
				.catch((writeError) => {
					console.error(
						`❌ Failed to save checkpoint on interrupt: ${writeError instanceof Error ? writeError.message : String(writeError)}`,
					);
					process.exit(130);
				});
		};
		process.once('SIGINT', handleSigint);

		const limit = pLimit(CONCURRENT_REQUEST_LIMIT);
		const jobs = logosToProcess.map((logo) =>
			limit(async () => {
				await sleep(CONCURRENCY_DELAY_MS);
				try {
					const result = await extractLogoColors(logo.url);

					if (result.success && result.palette) {
						const aspectRatio = logo.width / logo.height;
						const bestBackground = determineBestBackground(result.palette);

						colorData[logo.channel] = {
							channel: logo.channel,
							logo: {
								width: logo.width,
								height: logo.height,
								aspectRatio,
								url: logo.url,
								colors: {
									Vibrant: formatColor(result.palette.Vibrant),
									DarkVibrant: formatColor(result.palette.DarkVibrant),
									LightVibrant: formatColor(result.palette.LightVibrant),
									Muted: formatColor(result.palette.Muted),
									DarkMuted: formatColor(result.palette.DarkMuted),
									LightMuted: formatColor(result.palette.LightMuted),
								},
								bestBackground,
							},
						};

						processed++;
						if (processed % 10 === 0) {
							console.log(`  ✓ Processed ${processed}/${logosToProcess.length} logos...`);
						}

						if (processed - lastCheckpointProcessed >= CHECKPOINT_EVERY_PROCESSED) {
							await queueJsonWrite();
							lastCheckpointProcessed = processed;
						}
					} else {
						failed++;
						failures.push({
							channel: logo.channel,
							url: logo.url,
							reason: result.reason,
							error: result.error,
						});
					}
				} catch (error) {
					failed++;
					failures.push({
						channel: logo.channel,
						url: logo.url,
						reason: 'Unexpected error',
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}),
		);

		await Promise.all(jobs);
		if (processed > lastCheckpointProcessed) {
			await queueJsonWrite();
			lastCheckpointProcessed = processed;
		}
		await writeQueue;
		if (handleSigint) {
			process.removeListener('SIGINT', handleSigint);
		}

		await writeJsonAtomic(outputPath, colorData);

		console.log(`✅ Logo colors generated successfully`);
		const attempted = processed + failed;
		const successRate = attempted > 0 ? ((processed / attempted) * 100).toFixed(1) : '100.0';
		console.log(
			`📊 Results: ${processed} processed, ${failed} failed, ${skipped} skipped (${successRate}% success rate on attempted logos)`,
		);
		console.log(`📁 Output: ${outputPath}`);

		// Log failures if any
		if (failures.length > 0) {
			console.log(`\n${bgRed}${brightWhite} ⚠ Failed logos (${failures.length}) ${reset}`);
			console.log(`${red}┌──────────────────────────────────────────────────────────────────────────────┐${reset}`);

			// Group failures by reason
			const failuresByReason = {};
			failures.forEach((f) => {
				if (!failuresByReason[f.reason]) {
					failuresByReason[f.reason] = [];
				}
				failuresByReason[f.reason].push(f);
			});

			Object.entries(failuresByReason).forEach(([reason, items]) => {
				console.log(`\n${redBar} ${brightWhite}${reason}${reset} ${red}(${items.length} logos)${reset}`);
				items.forEach((item) => {
					console.log(`${redBar}   Channel ID: ${item.channel}`);
					console.log(`${redBar}   URL: ${item.url}`);
					if (item.error) {
						console.log(`${redBar}   Error: ${item.error}`);
					}
				});
			});

			console.log(`${red}└──────────────────────────────────────────────────────────────────────────────┘${reset}`);
		}
	} catch (error) {
		if (handleSigint) {
			process.removeListener('SIGINT', handleSigint);
		}
		console.error('❌ Error building logo colors:', error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}

// Generate colors from a logo list
export async function generateIptvLogoColorsFromLogos(logos) {
	const colorData = {};

	for (const logo of logos) {
		try {
			const result = await extractLogoColors(logo.url);

			if (result.success && result.palette) {
				const aspectRatio = logo.width / logo.height;
				const bestBackground = determineBestBackground(result.palette);

				colorData[logo.channel] = {
					channel: logo.channel,
					logo: {
						width: logo.width,
						height: logo.height,
						aspectRatio,
						url: logo.url,
						colors: {
							Vibrant: formatColor(result.palette.Vibrant),
							DarkVibrant: formatColor(result.palette.DarkVibrant),
							LightVibrant: formatColor(result.palette.LightVibrant),
							Muted: formatColor(result.palette.Muted),
							DarkMuted: formatColor(result.palette.DarkMuted),
							LightMuted: formatColor(result.palette.LightMuted),
						},
						bestBackground,
					},
				};

				console.log(`✓ ${logo.channel} - Background: ${bestBackground}`);
			}
		} catch (error) {
			console.warn(`⚠️  Skipping ${logo.channel}:`, error instanceof Error ? error.message : String(error));
		}
	}

	return colorData;
}

// Run if executed directly
if (process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/')) {
	// Create generated directory if it doesn't exist
	if (!fs.existsSync(generatedDir)) {
		fs.mkdirSync(generatedDir, { recursive: true });
	}
	generateIptvLogoColorBatches().catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
}
