import { Router } from 'express';
import User from '@core/models/user';
import { generateAuthenticationTokens, saveProtectedTokens } from '@app/controllers/tokens';
import { validateRegister, validateDevice } from '@/utils/validator';
import { getClientLocalTime as getLocationTime, isPublicIPv4 } from '@core/infrastructure/services/tracker';
import { parseDeviceHeader } from '@/utils/parser';
import { MailerController } from '@core/infrastructure/services/mailer';
import { handleHardErrors, isDevelopment } from '@/utils/standard';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import AppConfiguration from '@core/models/app-configuration';
import Country from '@core/models/country';
import { getAcceptLanguage } from '@/utils/express';

const router = Router();

router.post('/', async (req, res) => {
	try {
		// Check App Configuration
		const language = getAcceptLanguage(req);
		const allowed = await AppConfiguration.canRegisterUser();
		if (!allowed) {
			return new HttpError({
				code: 'REGISTRATION_DISABLED',
				message: req.t('REGISTRATION_DISABLED_MESSAGE'),
				statusCode: 403,
			}).sendResponse(res);
		}

		// Validate request body
		const [registerError, register] = validateRegister(req.body, req.t);

		// Retrieve the IP address from the request object
		const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

		// Check if postBody is safe
		if (registerError) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: registerError.message.replace(/'/g, ''),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Check if the IP address is a public IPv4 address
		if (!isPublicIPv4(clientIp) && !isDevelopment()) {
			return new HttpError({
				code: req.t('INVALID_LOCATION_CODE'),
				message: req.t('INVALID_LOCATION_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Device geolocation and time information
		const deviceGeolocation = await getLocationTime(clientIp);

		// Check if country is allowed
		const isCountryAllowed = await Country.isCountryAllowed(deviceGeolocation.countryCode || '');
		if (!isCountryAllowed && !isDevelopment()) {
			return new HttpError({
				code: req.t('COUNTRY_NOT_ALLOWED_CODE'),
				message: req.t('COUNTRY_NOT_ALLOWED_MESSAGE'),
				statusCode: 403,
			}).sendResponse(res);
		}

		// Validate device
		const [deviceError, device] = validateDevice(
			{
				...parseDeviceHeader(req.headers['user-agent'] || ''),
				country: deviceGeolocation.country || '',
				countryCode: deviceGeolocation.countryCode || '',
				city: deviceGeolocation.city || '',
				loggedAt: deviceGeolocation.datetime ? new Date(deviceGeolocation.datetime) : null,
			},
			req.t,
		);

		// Check if device is safe
		if (deviceError) {
			return new HttpError({
				code: req.t('INVALID_LOCATION_CODE'),
				message: req.t('INVALID_LOCATION_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Find or create User
		const { user, existingUser } = await User.createUser(
			{
				accountHolder: register.fullName,
				email: register.email,
				password: register.password,
				countryCode: deviceGeolocation.countryCode || '',
				loginAt: deviceGeolocation.datetime ? new Date(deviceGeolocation.datetime) : null,
			},
			{
				name: device.name,
				type: device.type,
				ip: clientIp,
				city: device.city,
				countryCode: device.countryCode,
				loggedAt: device.loggedAt,
			},
		);

		// If user is already created / existing user
		if (existingUser) {
			return new HttpError({
				code: req.t('EXISTENT_USER_CODE'),
				message: req.t('EXISTENT_USER_MESSAGE'),
				statusCode: 409,
			}).sendResponse(res);
		}

		// Send email to the user
		MailerController.sendAccountCreationEmail(
			{
				email: user.email,
				country: deviceGeolocation.country || '',
				name: register.fullName,
				ip: clientIp,
			},
			language,
		);

		// Handle authentication tokens generation
		const { sessionToken, refreshToken, accessToken } = await generateAuthenticationTokens({
			uuid: user.id,
			role: 'user',
			resetCount: user.resetCount,
			userAgent: req.headers['user-agent'] || '',
		});

		// Save refresh token
		saveProtectedTokens(res, { refreshToken, sessionToken });

		// Send response
		return new HttpSuccess({
			message: req.t('SUCCESS_ACCOUNT_CREATION_MESSAGE'),
			data: {
				access: accessToken,
			},
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
