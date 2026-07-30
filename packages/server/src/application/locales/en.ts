const en = {
	// General Server Errors
	SERVER_ERROR_CODE: 'Internal Server error',
	SERVER_ERROR_MESSAGE: 'An unexpected error occurred on the server.',
	SERVER_BAD_REQUEST_CODE: 'Bad request',
	SERVER_BAD_REQUEST_MESSAGE: 'The server could not understand the request due to invalid syntax.',
	SERVER_SESSION_ERROR_CODE: 'Session error',
	SERVER_SESSION_ERROR_MESSAGE: 'There was an error with your session. Please log in again.',
	SERVER_MAINTENANCE_CODE: 'Server maintenance',
	SERVER_MAINTENANCE_MESSAGE: 'The server is currently undergoing maintenance. Please try again later.',
	TOO_MANY_REQUESTS_CODE: 'Too many requests',
	TOO_MANY_REQUESTS_MESSAGE: 'You have sent too many requests in a given amount of time. Please try again later.',
	UNAUTHORIZED_CODE: 'Unauthorized',
	UNAUTHORIZED_MESSAGE: 'You must be logged in to access this resource.',
	FORBIDDEN_CODE: 'Forbidden',
	FORBIDDEN_MESSAGE: 'You do not have permission to access this resource.',
	MAX_SCREEN_LIMIT_REACHED_CODE: 'Maximum screens reached',
	MAX_SCREEN_LIMIT_REACHED_MESSAGE: 'You have reached the maximum number of concurrent screens for your plan.',
	MAX_SCREEN_LIMIT_REACHED_DETAILS:
		'Please close another active screen or wait for an existing session to expire before starting playback.',
	SCREEN_LIMITER_SESSION_MISSING_DETAILS: 'Authenticated playback session is missing.',
	SESSION_TOKEN_MISSING_DETAILS: 'Session token is missing from the request.',
	UNACTIVE_SUBSCRIPTION_CODE: 'Unactive subscription',
	UNACTIVE_SUBSCRIPTION_MESSAGE: 'Your subscription is not active. Please renew to continue using our services.',
	DATA_NOT_FOUND: '{data} Not Found',
	DATA_NOT_FOUND_MESSAGE: 'Your {data} has not been found : {id}',
	DEVICE_ERROR_CODE: 'Invalid device information provided',
	DEVICE_ERROR_MESSAGE: 'The device information provided is not valid.',

	// Invalid Errors
	INVALID_SEARCH_QUERY_CODE: 'Invalid search request',
	INVALID_SEARCH_QUERY_MESSAGE: 'The search query provided is not valid.',
	SEARCH_FAILED_CODE: 'Search failed',
	SEARCH_FAILED_MESSAGE: 'The search operation failed. Please try again later.',
	INVALID_CHANNEL_ID_CODE: 'Invalid channel ID',
	INVALID_CHANNEL_ID_MESSAGE: 'Channel ID is required.',
	INVALID_CREDENTIALS_CODE: 'Invalid credentials',
	INVALID_CREDENTIALS_MESSAGE: 'The email or password you entered is incorrect.',
	INVALID_EMAIL_CODE: 'Invalid email',
	INVALID_EMAIL_MESSAGE: 'The email address provided is not valid.',
	INVALID_PASSWORD_CODE: 'Invalid password',
	INVALID_PASSWORD_MESSAGE: 'The password provided does not meet the required criteria.',
	INVALID_LOCATION_CODE: 'Invalid location',
	INVALID_LOCATION_MESSAGE: 'We cant verify your location',
	COUNTRY_NOT_ALLOWED_CODE: 'Country not allowed',
	COUNTRY_NOT_ALLOWED_MESSAGE: 'Registration is not allowed from your country.',

	// User Errors
	EXISTENT_USER_CODE: 'Existent user',
	EXISTENT_USER_MESSAGE: 'A user with this email already exists.',
	UNEXISTENT_USER_CODE: 'Unexistent user',
	UNEXISTENT_USER_MESSAGE: 'User with the provided email does not exist.',
	PROFILE_NOT_FOUND_CODE: 'Profile not found',
	PROFILE_NOT_FOUND_MESSAGE: 'The specified profile could not be found.',
	CANNOT_DELETE_PRIMARY_PROFILE_MESSAGE: 'You cannot delete the primary profile.',
	MAX_PROFILES_REACHED_MESSAGE: 'You have reached the maximum number of profiles.',
	SAME_PASSWORD_MESSAGE: 'New password cannot be the same as the old password.',
	INVALID_TOKEN_CODE: 'Invalid reset link',
	INVALID_TOKEN_MESSAGE: 'The reset password link has expired or is invalid. Please request a new one.',
	EMAIL_SEND_FAILED_MESSAGE: 'Failed to send the email. Please try again later.',
	ACCOUNT_ERROR_MESSAGE: 'An error has occurred with your account.',
	PROFILE_ALREADY_EXISTS_MESSAGE: 'A profile with this name already exists.',
	REGISTRATION_DISABLED_MESSAGE: 'User registration is currently disabled.',
	MAX_USERS_REACHED_MESSAGE: 'The maximum number of users has been reached.',

	// Billing Errors
	BILLING_NOT_FOUND_CODE: 'Billing not found',
	BILLING_NOT_FOUND_MESSAGE: 'The billing information you are looking for does not exist.',
	PLAN_NOT_FOUND_CODE: 'Plan not found',
	PLAN_NOT_FOUND_MESSAGE: 'The plan you are looking for does not exist.',

	// Subscription Errors
	PLAN: 'Plan',
	SUBSCRIPTION: 'Subscription',
	SUBSCRIPTION_NOT_FOUND_CODE: 'Subscription not found',
	SUBSCRIPTION_NOT_FOUND_MESSAGE: 'The subscription you are looking for does not exist.',
	SUBSCRIPTION_ALREADY_EXISTS_CODE: 'Subscription already exists',
	SUBSCRIPTION_ALREADY_EXISTS_MESSAGE: 'An active subscription already exists for this user.',
	SUBSCRIPTION_CREATION_FAILED: 'Subscription creation failed',
	SUBSCRIPTION_CREATION_FAILED_MESSAGE:
		'Oops! We encountered a problem while creating your subscription. Please try again later.',
	SUBSCRIPTION_CANCELLATION_FAILED: 'Subscription cancellation failed',
	SUBSCRIPTION_CANCELLATION_FAILED_MESSAGE:
		'Oops! We encountered a problem while cancelling your subscription. Please try again later.',
	SUBSCRIPTION_APPROVAL_FAILED: 'Subscription approval failed',
	SUBSCRIPTION_APPROVAL_FAILED_MESSAGE:
		'Oops! We encountered a problem while approving your subscription. Please try again later.',
	SUBSCRIPTION_WAITING_FOR_PAYMENT_MESSAGE:
		'Your subscription is pending payment. Please complete the payment to activate your subscription.',
	SUBSCRIPTION_CANCELLED_MESSAGE:
		'Your subscription has been cancelled. You will retain access until the end of the current billing cycle.',
	SUBSCRIPTION_UPDATED_MESSAGE: 'Your subscription has been updated successfully.',
	SUBSCRIPTION_UPDATE_FAILED: 'Subscription update failed',
	SUBSCRIPTION_UPDATE_FAILED_MESSAGE:
		'Oops! We encountered a problem while updating your subscription. Please try again later.',
	SUBSCRIPTION_ACTIVATION_FAILED: 'Subscription activation failed',
	SUBSCRIPTION_ACTIVATION_FAILED_MESSAGE:
		'Oops! We encountered a problem while activating your subscription. Please try again later.',

	// Media Errors
	MOVIE_NOT_FOUND_CODE: 'Movie not found',
	MOVIE_NOT_FOUND_MESSAGE: 'The requested movie could not be found.',
	SERIES_NOT_FOUND_CODE: 'Series not found',
	SERIES_NOT_FOUND_MESSAGE: 'The requested series could not be found.',
	EPISODE_NOT_FOUND_CODE: 'Episode not found',
	EPISODE_NOT_FOUND_MESSAGE: 'The requested episode could not be found.',
	STREAM_SOURCE_NOT_FOUND_CODE: 'Stream source not found',
	STREAM_SOURCE_NOT_FOUND_MESSAGE: 'A streaming source for the requested media could not be found.',
	REQUESTED_RESOURCE_NOT_FOUND_CODE: 'Requested resource not found',
	REQUESTED_RESOURCE_NOT_FOUND_MESSAGE: 'The resource you are looking for could not be found.',
	PROXY_NOT_FOUND_CODE: 'Proxy not found',
	PROXY_NOT_FOUND_MESSAGE: 'No proxies are available.',

	// Success Messages
	SUCCESS_LOGIN_MESSAGE: 'User successfully logged in.',
	SUCCESS_LOGOUT_MESSAGE: 'User successfully logged out.',
	SUCCESS_PASSWORD_RESET_MESSAGE: 'Password reset successfully.',
	SUCCESS_ACCOUNT_CREATION_MESSAGE: 'Account created successfully.',
	SUCCESS_RESET_EMAIL_SENT_MESSAGE: 'Password reset email sent successfully.',
	SUCCESS_PROFILE_RETRIEVED_MESSAGE: 'Profile information retrieved successfully.',
	SUCCESS_USER_FOUND_MESSAGE: 'User information retrieved successfully.',
	SUCCESS_USER_UPDATED_MESSAGE: 'User information updated successfully.',
	SUCCESS_RETRIEVED: 'Data retrieved successfully.',
	SUCCESS_CREATED: 'Resource created successfully.',
	SUCCESS_DELETED: 'Resource deleted successfully.',
	SUCCESS_UPDATED: 'Resource updated successfully.',

	// Validation Messages
	VALIDATION_FULLNAME_EMPTY: 'Your full name cannot be empty. Please enter your name.',
	VALIDATION_FULLNAME_INVALID:
		'Your full name contains invalid characters. Please use only letters, spaces, and basic punctuation.',
	VALIDATION_FULLNAME_MIN: 'Your full name must be at least 4 characters long.',
	VALIDATION_FULLNAME_MAX: 'Your full name cannot exceed 25 characters.',
	VALIDATION_FULLNAME_REQUIRED: 'The Full Name field is required. Please provide your name.',

	VALIDATION_EMAIL_EMPTY: 'Your email address cannot be empty. Please enter a valid email.',
	VALIDATION_EMAIL_INVALID: 'The email address entered is invalid. Please use a valid format like example@domain.com.',
	VALIDATION_EMAIL_REQUIRED: 'The Email field is required. Please provide your email address.',

	VALIDATION_PASSWORD_EMPTY: 'Your password cannot be empty. Please enter a valid password.',
	VALIDATION_PASSWORD_COMPLEXITY:
		'Your password does not meet the required complexity. Please follow the specified guidelines.',
	VALIDATION_PASSWORD_REQUIRED: 'The Password field is required. Please provide a password.',

	VALIDATION_PROFILE_NAME_EMPTY: 'Profile Name cannot be empty. Please provide a name.',
	VALIDATION_PROFILE_NAME_INVALID:
		'Profile Name contains invalid characters. Please use only letters and basic punctuation.',
	VALIDATION_PROFILE_NAME_MIN: 'Profile Name must be at least 3 characters long.',
	VALIDATION_PROFILE_NAME_MAX: 'Profile Name cannot exceed 15 characters.',
	VALIDATION_PROFILE_NAME_REQUIRED: 'The Profile Name field is required.',

	VALIDATION_PIN_INVALID: 'The PIN must be exactly 4 digits.',
	VALIDATION_PIN_REQUIRED: 'The PIN field is required.',

	VALIDATION_AGE_MIN: 'The minimum age allowed is 12 years.',
	VALIDATION_AGE_MAX: 'The maximum age allowed is 100 years.',
	VALIDATION_AGE_REQUIRED: 'The Age field is required.',

	VALIDATION_ACCOUNT_HOLDER_EMPTY: 'Account Holder Name cannot be empty. Please provide your name.',
	VALIDATION_ACCOUNT_HOLDER_INVALID:
		'Account Holder Name contains invalid characters. Please use only letters and basic punctuation.',
	VALIDATION_ACCOUNT_HOLDER_MIN: 'Account Holder Name must be at least 3 characters long.',
	VALIDATION_ACCOUNT_HOLDER_MAX: 'Account Holder Name cannot exceed 30 characters.',
	VALIDATION_ACCOUNT_HOLDER_REQUIRED: 'The Account Holder Name field is required.',

	VALIDATION_DEVICE_NAME_REQUIRED: 'Device Name is required.',
	VALIDATION_DEVICE_TYPE_REQUIRED: 'Device Type is required.',
	VALIDATION_DEVICE_LOGGED_AT_REQUIRED: 'Logged At date is required.',

	VALIDATION_COUNTRY_CODE_EMPTY: 'Country Code cannot be empty. Please provide a valid Country code.',
	VALIDATION_COUNTRY_CODE_LENGTH: 'Country Code must be exactly 2 characters long.',
	VALIDATION_COUNTRY_CODE_MIN: 'Country Code must be at least 2 characters long.',
	VALIDATION_COUNTRY_CODE_MAX: 'Country Code cannot exceed 5 characters.',
	VALIDATION_COUNTRY_CODE_REQUIRED: 'The Country Code field is required. Please provide a Country code.',

	VALIDATION_COUNTRY_NAME_EMPTY: 'Country Name cannot be empty. Please provide a name.',
	VALIDATION_COUNTRY_NAME_MIN: 'Country Name must be at least 2 characters long.',
	VALIDATION_COUNTRY_NAME_MAX: 'Country Name cannot exceed 50 characters.',
	VALIDATION_COUNTRY_NAME_REQUIRED: 'The Country Name field is required.',

	VALIDATION_PUBLIC_ID_EMPTY: 'Public ID cannot be empty. Please provide a valid public ID.',
	VALIDATION_PUBLIC_ID_REQUIRED: 'The Public ID field is required. Please provide a public ID.',

	VALIDATION_PRICE_INVALID: 'Price must be a valid number.',
	VALIDATION_PRICE_NEGATIVE: 'Price cannot be negative.',
	VALIDATION_PRICE_REQUIRED: 'The Price field is required. Please provide a price.',

	VALIDATION_CURRENCY_EMPTY: 'Currency cannot be empty. Please provide a valid currency code.',
	VALIDATION_CURRENCY_REQUIRED: 'The Currency field is required. Please provide a currency code.',

	VALIDATION_MAX_SCREEN_INVALID: 'Max Screen must be a valid number.',
	VALIDATION_MAX_SCREEN_MIN: 'Max Screen must be at least 1.',
	VALIDATION_MAX_SCREEN_REQUIRED: 'The Max Screen field is required. Please provide a maximum screen value.',

	VALIDATION_TIER_INVALID: 'Tier must be a valid number.',
	VALIDATION_TIER_MIN: 'Tier cannot be below 0.',
	VALIDATION_TIER_MAX: 'Tier cannot exceed 5.',
	VALIDATION_TIER_REQUIRED: 'The Tier field is required. Please provide a tier value.',

	VALIDATION_NAMES_REQUIRED: 'The Names field is required. Please provide names for the plan.',
	VALIDATION_NAMES_INVALID: 'The Names field must be a valid object.',
	VALIDATION_DESCRIPTIONS_REQUIRED: 'The Descriptions field is required. Please provide descriptions for the plan.',
	VALIDATION_DESCRIPTIONS_INVALID: 'The Descriptions field must be a valid object.',
	VALIDATION_AUTO_RENEWAL_REQUIRED:
		'The Auto Renewal field is required. Please specify whether auto-renewal is enabled.',
	VALIDATION_AUTO_RENEWAL_INVALID: 'The Auto Renewal field must be a boolean value.',
	VALIDATION_IS_ACTIVE_INVALID: 'The Is Active field must be a boolean value.',
} as const;

export default en;
