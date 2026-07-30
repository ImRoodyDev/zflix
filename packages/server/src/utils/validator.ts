import Joi, { ValidationError } from 'joi';
import { isURL, IsURLOptions } from 'validator';
import passwordComplexity, { ComplexityOptions } from 'joi-password-complexity';
import { TFunction } from 'i18next';
import {
	AccountUpdatePayload,
	AdminAccountCreationPayload,
	AdminCountryCreationPayload,
	AdminCountryUpdatePayload,
	AdminPlanCreationPayload,
	AdminPlanUpdatePayload,
	DevicePayload,
	LoginPayload,
	ProfilePayload,
	RegisterPayload,
} from '@/types/account-dto';

type ValidationResult<T> = [ValidationError | undefined, T];

const complexityOptions: ComplexityOptions = {
	min: 4,
	max: 30,
	lowerCase: 1,
	upperCase: 1,
	numeric: 2,
	symbol: 0,
	requirementCount: 3,
};

export const validateUrl = (url: string, options?: IsURLOptions): boolean => {
	return isURL(url, {
		require_tld: false,
		allow_fragments: true,
		allow_underscores: true,
		allow_query_components: true,
		allow_trailing_dot: true,
		...options,
	});
};

export const validateEmail = (email: string, t: TFunction): ValidationResult<string> => {
	const schema = Joi.string()
		.email()
		.lowercase()
		.trim()
		.max(80)
		.messages({
			'string.email': t('VALIDATION_EMAIL_INVALID'),
			'string.empty': t('VALIDATION_EMAIL_EMPTY'),
		});
	const { error, value } = schema.validate(email);
	return [error, value];
};

const validateSchema = <T = unknown>(schema: Joi.ObjectSchema, data: T): ValidationResult<T> => {
	const { error, value } = schema.validate(data);
	return [error, value as T];
};

export const validateLogin = (payload: LoginPayload, t: TFunction): ValidationResult<LoginPayload> => {
	const schema = Joi.object<LoginPayload>({
		email: Joi.string()
			.email()
			.trim()
			.max(80)
			.required()
			.label('Email')
			.messages({
				'string.empty': t('VALIDATION_EMAIL_EMPTY'),
				'string.email': t('VALIDATION_EMAIL_INVALID'),
				'any.required': t('VALIDATION_EMAIL_REQUIRED'),
			}),
		password: Joi.string()
			.trim()
			.max(30)
			.required()
			.label('Password')
			.messages({
				'string.empty': t('VALIDATION_PASSWORD_EMPTY'),
				'string.length': t('VALIDATION_PASSWORD_COMPLEXITY'),
				'string.pattern': t('VALIDATION_PASSWORD_COMPLEXITY'),
				'any.required': t('VALIDATION_PASSWORD_REQUIRED'),
			}),
	});

	return validateSchema<LoginPayload>(schema, payload);
};

export const validateRegister = (payload: RegisterPayload, t: TFunction): ValidationResult<RegisterPayload> => {
	const schema = Joi.object<RegisterPayload>({
		fullName: Joi.string()
			.pattern(/^[a-zA-Z\s'.-]+$/)
			.trim()
			.min(4)
			.max(25)
			.required()
			.label('Full Name')
			.messages({
				'string.empty': t('VALIDATION_FULLNAME_EMPTY'),
				'string.pattern.base': t('VALIDATION_FULLNAME_INVALID'),
				'string.min': t('VALIDATION_FULLNAME_MIN'),
				'string.max': t('VALIDATION_FULLNAME_MAX'),
				'any.required': t('VALIDATION_FULLNAME_REQUIRED'),
			}),
		email: Joi.string()
			.email()
			.lowercase()
			.trim()
			.max(80)
			.required()
			.label('Email')
			.messages({
				'string.empty': t('VALIDATION_EMAIL_EMPTY'),
				'string.email': t('VALIDATION_EMAIL_INVALID'),
				'any.required': t('VALIDATION_EMAIL_REQUIRED'),
			}),
		password: passwordComplexity(complexityOptions)
			.trim()
			.max(30)
			.required()
			.label('Password')
			.messages({
				'string.empty': t('VALIDATION_PASSWORD_EMPTY'),
				'string.length': t('VALIDATION_PASSWORD_COMPLEXITY'),
				'string.pattern': t('VALIDATION_PASSWORD_COMPLEXITY'),
				'any.required': t('VALIDATION_PASSWORD_REQUIRED'),
			}),
	});

	return validateSchema<RegisterPayload>(schema, payload);
};

export const validateUserUpdate = (
	data: AccountUpdatePayload,
	t: TFunction,
): ValidationResult<AccountUpdatePayload> => {
	const schema = Joi.object<AccountUpdatePayload>({
		fullName: Joi.string()
			.pattern(/^[a-zA-Z\s'.-]+$/)
			.trim()
			.min(3)
			.max(30)
			.required()
			.label('Account Holder Name')
			.messages({
				'string.empty': t('VALIDATION_ACCOUNT_HOLDER_EMPTY'),
				'string.pattern.base': t('VALIDATION_ACCOUNT_HOLDER_INVALID'),
				'string.min': t('VALIDATION_ACCOUNT_HOLDER_MIN'),
				'string.max': t('VALIDATION_ACCOUNT_HOLDER_MAX'),
				'any.required': t('VALIDATION_ACCOUNT_HOLDER_REQUIRED'),
			}),
		newPassword: passwordComplexity(complexityOptions)
			.trim()
			.max(30)
			.label('Password')
			.messages({
				'string.empty': t('VALIDATION_PASSWORD_EMPTY'),
				'string.length': t('VALIDATION_PASSWORD_COMPLEXITY'),
				'string.pattern': t('VALIDATION_PASSWORD_COMPLEXITY'),
				'any.required': t('VALIDATION_PASSWORD_REQUIRED'),
			}),
	});

	return validateSchema<AccountUpdatePayload>(schema, data);
};

export const validateDevice = (data: DevicePayload, t: TFunction): ValidationResult<DevicePayload> => {
	const schema = Joi.object<DevicePayload>({
		name: Joi.string()
			.trim()
			.min(3)
			.max(50)
			.required()
			.messages({
				'any.required': t('VALIDATION_DEVICE_NAME_REQUIRED'),
			}),
		type: Joi.string()
			.trim()
			.min(3)
			.max(50)
			.required()
			.messages({
				'any.required': t('VALIDATION_DEVICE_TYPE_REQUIRED'),
			}),
		country: Joi.string().trim().min(3).max(30),
		countryCode: Joi.string().trim().max(3),
		city: Joi.string().trim().min(3).max(30),
		loggedAt: Joi.date()
			.required()
			.allow(null)
			.messages({
				'any.required': t('VALIDATION_DEVICE_LOGGED_AT_REQUIRED'),
			}),
	});

	return validateSchema<DevicePayload>(schema, data);
};

export const validateProfile = (data: ProfilePayload, t: TFunction): ValidationResult<ProfilePayload> => {
	// Every word should start with uppercase
	data.profileName = data.profileName
		.replace(/\s{2,}/g, ' ') // Replace double or more spaces with single space
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase());

	const schema = Joi.object<ProfilePayload>({
		profileName: Joi.string()
			.pattern(/^(?!.*\s{2,})[a-zA-Z0-9\s-]+$/)
			.trim()
			.min(4)
			.max(18)
			.required()
			.label('Profile Name')
			.messages({
				'string.pattern.base': t('VALIDATION_PROFILE_NAME_INVALID'),
				'string.empty': t('VALIDATION_PROFILE_NAME_EMPTY'),
				'any.required': t('VALIDATION_PROFILE_NAME_REQUIRED'),
				'string.min': t('VALIDATION_PROFILE_NAME_MIN'),
				'string.max': t('VALIDATION_PROFILE_NAME_MAX'),
			}),
		avatarId: Joi.string().min(14).max(22),
		languageCode: Joi.string().trim().min(2).max(10),
		certificationId: Joi.string().trim().min(1).max(8),
		autoPlay: Joi.boolean(),
		defaultSubtitle: Joi.boolean(),
	});

	return validateSchema<ProfilePayload>(schema, data);
};

export const validateAccountCreationByAdmin = (
	data: AdminAccountCreationPayload,
	t: TFunction,
): ValidationResult<AdminAccountCreationPayload> => {
	const schema = Joi.object<AdminAccountCreationPayload>({
		fullName: Joi.string()
			.pattern(/^[a-zA-Z\s'.-]+$/)
			.trim()
			.min(4)
			.max(25)
			.required()
			.label('Full Name')
			.messages({
				'string.empty': t('VALIDATION_FULLNAME_EMPTY'),
				'string.pattern.base': t('VALIDATION_FULLNAME_INVALID'),
				'string.min': t('VALIDATION_FULLNAME_MIN'),
				'string.max': t('VALIDATION_FULLNAME_MAX'),
				'any.required': t('VALIDATION_FULLNAME_REQUIRED'),
			}),
		email: Joi.string()
			.email()
			.lowercase()
			.trim()
			.max(80)
			.required()
			.label('Email')
			.messages({
				'string.empty': t('VALIDATION_EMAIL_EMPTY'),
				'string.email': t('VALIDATION_EMAIL_INVALID'),
				'any.required': t('VALIDATION_EMAIL_REQUIRED'),
			}),
		password: passwordComplexity(complexityOptions)
			.max(30)
			.trim()
			.required()
			.label('Password')
			.messages({
				'string.empty': t('VALIDATION_PASSWORD_EMPTY'),
				'string.length': t('VALIDATION_PASSWORD_COMPLEXITY'),
				'string.pattern': t('VALIDATION_PASSWORD_COMPLEXITY'),
				'any.required': t('VALIDATION_PASSWORD_REQUIRED'),
			}),
		countryCode: Joi.string()
			.trim()
			.min(2)
			.max(2)
			.required()
			.label('Country Code')
			.messages({
				'string.empty': t('VALIDATION_COUNTRY_CODE_EMPTY'),
				'any.required': t('VALIDATION_COUNTRY_CODE_REQUIRED'),
			}),
	});

	return validateSchema<AdminAccountCreationPayload>(schema, data);
};

export const validatePlanCreationByAdmin = (
	data: AdminPlanCreationPayload,
	t: TFunction,
): ValidationResult<AdminPlanCreationPayload> => {
	const schema = Joi.object<AdminPlanCreationPayload>({
		id: Joi.string().max(50).optional().label('ID'),
		public_id: Joi.string()
			.min(3)
			.max(50)
			.required()
			.label('Public ID')
			.messages({
				'string.empty': t('VALIDATION_PUBLIC_ID_EMPTY'),
				'any.required': t('VALIDATION_PUBLIC_ID_REQUIRED'),
			}),
		price: Joi.number()
			.min(0)
			.required()
			.label('Price')
			.messages({
				'number.base': t('VALIDATION_PRICE_INVALID'),
				'number.min': t('VALIDATION_PRICE_NEGATIVE'),
				'any.required': t('VALIDATION_PRICE_REQUIRED'),
			}),
		currency: Joi.string()
			.max(3)
			.required()
			.label('Currency')
			.messages({
				'string.empty': t('VALIDATION_CURRENCY_EMPTY'),
				'any.required': t('VALIDATION_CURRENCY_REQUIRED'),
			}),
		maxScreen: Joi.number()
			.min(1)
			.required()
			.label('Max Screen')
			.messages({
				'number.base': t('VALIDATION_MAX_SCREEN_INVALID'),
				'number.min': t('VALIDATION_MAX_SCREEN_MIN'),
				'any.required': t('VALIDATION_MAX_SCREEN_REQUIRED'),
			}),
		countryCode: Joi.string()
			.max(3)
			.required()
			.label('Country Code')
			.messages({
				'string.empty': t('VALIDATION_COUNTRY_CODE_EMPTY'),
				'any.required': t('VALIDATION_COUNTRY_CODE_REQUIRED'),
			}),
		tier: Joi.number()
			.min(0)
			.max(5)
			.required()
			.label('Tier')
			.messages({
				'number.base': t('VALIDATION_TIER_INVALID'),
				'number.min': t('VALIDATION_TIER_MIN'),
				'number.max': t('VALIDATION_TIER_MAX'),
				'any.required': t('VALIDATION_TIER_REQUIRED'),
			}),
		names: Joi.object()
			.required()
			.label('Names')
			.messages({
				'any.required': t('VALIDATION_NAMES_REQUIRED'),
			}),
		descriptions: Joi.object()
			.required()
			.label('Descriptions')
			.messages({
				'any.required': t('VALIDATION_DESCRIPTIONS_REQUIRED'),
			}),
		autoRenewal: Joi.boolean()
			.required()
			.label('Auto Renewal')
			.messages({
				'any.required': t('VALIDATION_AUTO_RENEWAL_REQUIRED'),
			}),
		index: Joi.number().integer().min(0).optional().label('Index'),
		maxPaymentFailure: Joi.number().integer().min(1).optional().label('Max Payment Failure'),
		stripePriceId: Joi.string().max(255).allow('', null).optional().label('Stripe Price ID'),
	});

	return validateSchema<AdminPlanCreationPayload>(schema, data);
};

export const validatePlanUpdateByAdmin = (
	data: AdminPlanUpdatePayload,
	t: TFunction,
): ValidationResult<AdminPlanUpdatePayload> => {
	const schema = Joi.object<AdminPlanUpdatePayload>({
		public_id: Joi.string()
			.min(3)
			.max(50)
			.label('Public ID')
			.messages({
				'string.empty': t('VALIDATION_PUBLIC_ID_EMPTY'),
			}),
		price: Joi.number()
			.min(0)
			.label('Price')
			.messages({
				'number.base': t('VALIDATION_PRICE_INVALID'),
				'number.min': t('VALIDATION_PRICE_NEGATIVE'),
			}),
		currency: Joi.string()
			.max(3)
			.label('Currency')
			.messages({
				'string.empty': t('VALIDATION_CURRENCY_EMPTY'),
			}),
		maxScreen: Joi.number()
			.min(1)
			.label('Max Screen')
			.messages({
				'number.base': t('VALIDATION_MAX_SCREEN_INVALID'),
				'number.min': t('VALIDATION_MAX_SCREEN_MIN'),
			}),
		countryCode: Joi.string()
			.length(2)
			.label('Country Code')
			.messages({
				'string.empty': t('VALIDATION_COUNTRY_CODE_EMPTY'),
				'string.length': t('VALIDATION_COUNTRY_CODE_LENGTH'),
			}),
		tier: Joi.number()
			.min(0)
			.max(5)
			.label('Tier')
			.messages({
				'number.base': t('VALIDATION_TIER_INVALID'),
				'number.min': t('VALIDATION_TIER_MIN'),
				'number.max': t('VALIDATION_TIER_MAX'),
			}),
		names: Joi.object()
			.pattern(Joi.string(), Joi.string())
			.label('Names')
			.messages({
				'object.base': t('VALIDATION_NAMES_INVALID'),
			}),
		descriptions: Joi.object()
			.pattern(Joi.string(), Joi.array().items(Joi.string()))
			.label('Descriptions')
			.messages({
				'object.base': t('VALIDATION_DESCRIPTIONS_INVALID'),
			}),
		autoRenewal: Joi.boolean()
			.label('Auto Renewal')
			.messages({
				'boolean.base': t('VALIDATION_AUTO_RENEWAL_INVALID'),
			}),
		isActive: Joi.boolean()
			.label('Is Active')
			.messages({
				'boolean.base': t('VALIDATION_IS_ACTIVE_INVALID'),
			}),
		index: Joi.number().integer().min(0).optional().label('Index'),
		maxPaymentFailure: Joi.number().integer().min(1).optional().label('Max Payment Failure'),
		stripePriceId: Joi.string().max(255).allow('', null).optional().label('Stripe Price ID'),
	});

	return validateSchema<AdminPlanUpdatePayload>(schema, data);
};

export const validateCountryCreationByAdmin = (
	data: AdminCountryCreationPayload,
	t: TFunction,
): ValidationResult<AdminCountryCreationPayload> => {
	const schema = Joi.object<AdminCountryCreationPayload>({
		code: Joi.string()
			.min(2)
			.max(5)
			.required()
			.uppercase()
			.label('Country Code')
			.messages({
				'string.empty': t('VALIDATION_COUNTRY_CODE_EMPTY'),
				'string.min': t('VALIDATION_COUNTRY_CODE_MIN'),
				'string.max': t('VALIDATION_COUNTRY_CODE_MAX'),
				'any.required': t('VALIDATION_COUNTRY_CODE_REQUIRED'),
			}),
		name: Joi.string()
			.min(2)
			.max(50)
			.required()
			.label('Country Name')
			.messages({
				'string.empty': t('VALIDATION_COUNTRY_NAME_EMPTY'),
				'string.min': t('VALIDATION_COUNTRY_NAME_MIN'),
				'string.max': t('VALIDATION_COUNTRY_NAME_MAX'),
				'any.required': t('VALIDATION_COUNTRY_NAME_REQUIRED'),
			}),
		allowed: Joi.boolean().required(),
	});
	return validateSchema<AdminCountryCreationPayload>(schema, data);
};

export const validateCountryUpdateByAdmin = (
	data: AdminCountryUpdatePayload,
	t: TFunction,
): ValidationResult<AdminCountryUpdatePayload> => {
	const schema = Joi.object<AdminCountryUpdatePayload>({
		name: Joi.string()
			.min(2)
			.max(50)
			.label('Country Name')
			.messages({
				'string.empty': t('VALIDATION_COUNTRY_NAME_EMPTY'),
				'string.min': t('VALIDATION_COUNTRY_NAME_MIN'),
				'string.max': t('VALIDATION_COUNTRY_NAME_MAX'),
			}),
		allowed: Joi.boolean(),
	});
	return validateSchema<AdminCountryUpdatePayload>(schema, data);
};

export const validatePassword = (data: { password: string }, t: TFunction): ValidationResult<{ password: string }> => {
	const schema = Joi.object({
		password: passwordComplexity(complexityOptions)
			.trim()
			.max(30)
			.required()
			.label('Password')
			.messages({
				'string.empty': t('VALIDATION_PASSWORD_EMPTY'),
				'string.length': t('VALIDATION_PASSWORD_COMPLEXITY'),
				'string.pattern': t('VALIDATION_PASSWORD_COMPLEXITY'),
				'any.required': t('VALIDATION_PASSWORD_REQUIRED'),
			}),
	});
	return validateSchema<{ password: string }>(schema, data);
};

export const validateSearchQuery = (query: string): boolean => {
	// Allows English letters, numbers, spaces, and the basic CJK Unicode range.
	const queryRegex = /^[a-zA-Z0-9\s\u4E00-\u9FFF&"' - ]+$/;
	const maxQueryLength = 20;
	return queryRegex.test(query) && query.length <= maxQueryLength;
};

export const validateAppConfiguration = (payload: any): ValidationResult<any> => {
	const schema = Joi.object({
		maintenanceMode: Joi.boolean().required(),
		allowUserRegistrations: Joi.boolean().required(),
		maxUsers: Joi.number().integer().min(0).required(),
	});
	const { error, value } = schema.validate(payload);
	return [error, value];
};

export const validateProxyUrl = (url: string): boolean => {
	return validateUrl(url, {
		require_protocol: true,
		protocols: ['http', 'https', 'socks', 'socks4', 'socks5'],
	});
};
