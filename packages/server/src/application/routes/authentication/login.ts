import { Router } from 'express';
import User from '@core/models/user';
import { generateAuthenticationTokens, saveProtectedTokens } from '@app/controllers/tokens';
import { validateLogin, validateDevice } from '@/utils/validator';
import { getClientLocalTime, normalizeClientIp } from '@core/infrastructure/services/tracker';
import { parseDeviceHeader } from '@/utils/parser';
import { handleHardErrors, isDevelopment } from '@/utils/standard';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';

const router = Router();

router.post('/', async (req, res) => {
	try {
		// Validate login request body
		const [authError, login] = validateLogin(req.body, req.t);

		// Retrieve the IP address from the request object
		const clientIp = normalizeClientIp((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress) || '';

		// Check if loginBody is safe
		if (authError) {
			return new HttpError({
				code: req.t('INVALID_PASSWORD_CODE'),
				message: authError.message.replace(/'/g, ''),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Device geolocation and time information
		const deviceGeolocation = await getClientLocalTime(clientIp);
		const loggedAt = deviceGeolocation.datetime ? new Date(deviceGeolocation.datetime) : new Date();

		// Validate device
		const [deviceError, device] = validateDevice(
			{
				...parseDeviceHeader(req.headers['user-agent'] || ''), // Parsed Device Information
				country: deviceGeolocation.country || '',
				countryCode: deviceGeolocation.countryCode || '',
				city: deviceGeolocation.city || '',
				loggedAt,
			},
			req.t,
		);

		// Check if device is safe
		if (deviceError) {
			return new HttpError({
				code: req.t('DEVICE_ERROR_CODE'),
				message: isDevelopment() ? deviceError.message : req.t('DEVICE_ERROR_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Find user in the database
		const user = await User.findOne({ where: { email: login.email } });

		// Check wheather user exsist
		if (!user) {
			return new HttpError({
				code: req.t('INVALID_CREDENTIALS_CODE'),
				message: req.t('INVALID_CREDENTIALS_MESSAGE'),
				statusCode: 401,
			}).sendResponse(res);
		}

		// Combined your password with the hash password
		const validPassword = await user.compareHashPassword(login.password);

		// Check if the password is valid
		if (!validPassword) {
			return new HttpError({
				code: req.t('INVALID_CREDENTIALS_CODE'),
				message: req.t('INVALID_CREDENTIALS_MESSAGE'),
				statusCode: 401,
			}).sendResponse(res);
		}

		// Sign new device on login
		await user.newLoginAttempt({
			time: loggedAt,
			name: device.name,
			type: device.type,
			ip: clientIp,
			city: device.city,
			countryCode: device.countryCode,
			loggedAt: device.loggedAt,
		});

		// Handle authentication tokens generation
		const { sessionToken, refreshToken, accessToken } = await generateAuthenticationTokens({
			uuid: user.id,
			role: 'user',
			resetCount: user.resetCount,
			userAgent: req.headers['user-agent'] || '',
		});

		// Save refresh token
		saveProtectedTokens(res, { refreshToken, sessionToken });

		// Send response to client
		return new HttpSuccess({
			message: req.t('SUCCESS_LOGIN_MESSAGE'),
			data: {
				redirect: user.setupFinished ? '/profiles' : '/plan-picker',
				access: accessToken,
			},
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
