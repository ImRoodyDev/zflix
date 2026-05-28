const es = {
	// General Server Errors
	SERVER_ERROR_CODE: 'Error interno del servidor',
	SERVER_ERROR_MESSAGE: 'Ocurrio un error inesperado en el servidor.',
	SERVER_BAD_REQUEST_CODE: 'Solicitud incorrecta',
	SERVER_BAD_REQUEST_MESSAGE: 'El servidor no pudo entender la solicitud debido a una sintaxis invalida.',
	SERVER_SESSION_ERROR_CODE: 'Error de sesion',
	SERVER_SESSION_ERROR_MESSAGE: 'Hubo un error con tu sesion. Inicia sesion nuevamente.',
	SERVER_MAINTENANCE_CODE: 'Mantenimiento del servidor',
	SERVER_MAINTENANCE_MESSAGE: 'El servidor esta actualmente en mantenimiento. Intentalo de nuevo mas tarde.',
	TOO_MANY_REQUESTS_CODE: 'Demasiadas solicitudes',
	TOO_MANY_REQUESTS_MESSAGE:
		'Has enviado demasiadas solicitudes en un periodo de tiempo. Intentalo de nuevo mas tarde.',
	UNAUTHORIZED_CODE: 'No autorizado',
	UNAUTHORIZED_MESSAGE: 'Debes iniciar sesion para acceder a este recurso.',
	FORBIDDEN_CODE: 'Prohibido',
	FORBIDDEN_MESSAGE: 'No tienes permiso para acceder a este recurso.',
	MAX_SCREEN_LIMIT_REACHED_CODE: 'Maximo de pantallas alcanzado',
	MAX_SCREEN_LIMIT_REACHED_MESSAGE: 'Has alcanzado el numero maximo de pantallas concurrentes permitidas por tu plan.',
	MAX_SCREEN_LIMIT_REACHED_DETAILS:
		'Cierra otra pantalla activa o espera a que una sesion existente expire antes de iniciar la reproduccion.',
	SCREEN_LIMITER_SESSION_MISSING_DETAILS: 'Falta la sesion autenticada de reproduccion.',
	SESSION_TOKEN_MISSING_DETAILS: 'Falta el token de sesion en la solicitud.',
	UNACTIVE_SUBSCRIPTION_CODE: 'Suscripcion inactiva',
	UNACTIVE_SUBSCRIPTION_MESSAGE: 'Tu suscripcion no esta activa. Renuevala para seguir usando nuestros servicios.',
	DATA_NOT_FOUND: '{data} no encontrado',
	DATA_NOT_FOUND_MESSAGE: 'No se encontro tu {data}: {id}',
	DEVICE_ERROR_CODE: 'Se proporciono informacion de dispositivo invalida',
	DEVICE_ERROR_MESSAGE: 'La informacion del dispositivo proporcionada no es valida.',

	// Invalid Errors
	INVALID_SEARCH_QUERY_CODE: 'Solicitud de busqueda invalida',
	INVALID_SEARCH_QUERY_MESSAGE: 'La consulta de busqueda proporcionada no es valida.',
	SEARCH_FAILED_CODE: 'Fallo en la busqueda',
	SEARCH_FAILED_MESSAGE: 'La operacion de busqueda fallo. Intentalo de nuevo mas tarde.',
	INVALID_CHANNEL_ID_CODE: 'ID de canal invalido',
	INVALID_CHANNEL_ID_MESSAGE: 'El ID del canal es obligatorio.',
	INVALID_CREDENTIALS_CODE: 'Credenciales invalidas',
	INVALID_CREDENTIALS_MESSAGE: 'El correo o la contrasena que ingresaste es incorrecto.',
	INVALID_EMAIL_CODE: 'Correo invalido',
	INVALID_EMAIL_MESSAGE: 'La direccion de correo proporcionada no es valida.',
	INVALID_PASSWORD_CODE: 'Contrasena invalida',
	INVALID_PASSWORD_MESSAGE: 'La contrasena proporcionada no cumple con los criterios requeridos.',
	INVALID_LOCATION_CODE: 'Ubicacion invalida',
	INVALID_LOCATION_MESSAGE: 'No podemos verificar tu ubicacion',
	COUNTRY_NOT_ALLOWED_CODE: 'Pais no permitido',
	COUNTRY_NOT_ALLOWED_MESSAGE: 'El registro no esta permitido desde tu pais.',

	// User Errors
	EXISTENT_USER_CODE: 'Usuario existente',
	EXISTENT_USER_MESSAGE: 'Ya existe un usuario con este correo.',
	UNEXISTENT_USER_CODE: 'Usuario inexistente',
	UNEXISTENT_USER_MESSAGE: 'No existe un usuario con el correo proporcionado.',
	PROFILE_NOT_FOUND_CODE: 'Perfil no encontrado',
	PROFILE_NOT_FOUND_MESSAGE: 'No se pudo encontrar el perfil especificado.',
	CANNOT_DELETE_PRIMARY_PROFILE_MESSAGE: 'No puedes eliminar el perfil principal.',
	MAX_PROFILES_REACHED_MESSAGE: 'Has alcanzado el numero maximo de perfiles.',
	SAME_PASSWORD_MESSAGE: 'La nueva contrasena no puede ser igual a la anterior.',
	INVALID_TOKEN_CODE: 'Enlace de restablecimiento invalido',
	INVALID_TOKEN_MESSAGE: 'El enlace para restablecer la contrasena ha expirado o es invalido. Solicita uno nuevo.',
	EMAIL_SEND_FAILED_MESSAGE: 'No se pudo enviar el correo. Intentalo de nuevo mas tarde.',
	ACCOUNT_ERROR_MESSAGE: 'Ha ocurrido un error con tu cuenta.',
	PROFILE_ALREADY_EXISTS_MESSAGE: 'Ya existe un perfil con este nombre.',
	REGISTRATION_DISABLED_MESSAGE: 'El registro de usuarios esta deshabilitado actualmente.',
	MAX_USERS_REACHED_MESSAGE: 'Se alcanzo el numero maximo de usuarios.',

	// Billing Errors
	BILLING_NOT_FOUND_CODE: 'Facturacion no encontrada',
	BILLING_NOT_FOUND_MESSAGE: 'La informacion de facturacion que buscas no existe.',
	PLAN_NOT_FOUND_CODE: 'Plan no encontrado',
	PLAN_NOT_FOUND_MESSAGE: 'El plan que buscas no existe.',

	// Subscription Errors
	PLAN: 'Plan',
	SUBSCRIPTION: 'Suscripcion',
	SUBSCRIPTION_NOT_FOUND_CODE: 'Suscripcion no encontrada',
	SUBSCRIPTION_NOT_FOUND_MESSAGE: 'La suscripcion que buscas no existe.',
	SUBSCRIPTION_ALREADY_EXISTS_CODE: 'La suscripcion ya existe',
	SUBSCRIPTION_ALREADY_EXISTS_MESSAGE: 'Ya existe una suscripcion activa para este usuario.',
	SUBSCRIPTION_CREATION_FAILED: 'Error al crear la suscripcion',
	SUBSCRIPTION_CREATION_FAILED_MESSAGE:
		'Ups. Tuvimos un problema al crear tu suscripcion. Intentalo de nuevo mas tarde.',
	SUBSCRIPTION_CANCELLATION_FAILED: 'Error al cancelar la suscripcion',
	SUBSCRIPTION_CANCELLATION_FAILED_MESSAGE:
		'Ups. Tuvimos un problema al cancelar tu suscripcion. Intentalo de nuevo mas tarde.',
	SUBSCRIPTION_APPROVAL_FAILED: 'Error al aprobar la suscripcion',
	SUBSCRIPTION_APPROVAL_FAILED_MESSAGE:
		'Ups. Tuvimos un problema al aprobar tu suscripcion. Intentalo de nuevo mas tarde.',
	SUBSCRIPTION_WAITING_FOR_PAYMENT_MESSAGE:
		'Tu suscripcion esta pendiente de pago. Completa el pago para activar tu suscripcion.',
	SUBSCRIPTION_CANCELLED_MESSAGE:
		'Tu suscripcion ha sido cancelada. Mantendras el acceso hasta el final del ciclo de facturacion actual.',
	SUBSCRIPTION_UPDATED_MESSAGE: 'Tu suscripcion se actualizo correctamente.',
	SUBSCRIPTION_UPDATE_FAILED: 'Error al actualizar la suscripcion',
	SUBSCRIPTION_UPDATE_FAILED_MESSAGE:
		'Ups. Tuvimos un problema al actualizar tu suscripcion. Intentalo de nuevo mas tarde.',
	SUBSCRIPTION_ACTIVATION_FAILED: 'Error al activar la suscripcion',
	SUBSCRIPTION_ACTIVATION_FAILED_MESSAGE:
		'Ups. Tuvimos un problema al activar tu suscripcion. Intentalo de nuevo mas tarde.',

	// Media Errors
	MOVIE_NOT_FOUND_CODE: 'Pelicula no encontrada',
	MOVIE_NOT_FOUND_MESSAGE: 'No se pudo encontrar la pelicula solicitada.',
	SERIES_NOT_FOUND_CODE: 'Serie no encontrada',
	SERIES_NOT_FOUND_MESSAGE: 'No se pudo encontrar la serie solicitada.',
	EPISODE_NOT_FOUND_CODE: 'Episodio no encontrado',
	EPISODE_NOT_FOUND_MESSAGE: 'No se pudo encontrar el episodio solicitado.',
	STREAM_SOURCE_NOT_FOUND_CODE: 'Fuente de transmision no encontrada',
	STREAM_SOURCE_NOT_FOUND_MESSAGE: 'No se pudo encontrar una fuente de transmision para el contenido solicitado.',
	REQUESTED_RESOURCE_NOT_FOUND_CODE: 'Recurso solicitado no encontrado',
	REQUESTED_RESOURCE_NOT_FOUND_MESSAGE: 'No se pudo encontrar el recurso que buscas.',

	// Success Messages
	SUCCESS_LOGIN_MESSAGE: 'Usuario inicio sesion correctamente.',
	SUCCESS_LOGOUT_MESSAGE: 'Usuario cerro sesion correctamente.',
	SUCCESS_PASSWORD_RESET_MESSAGE: 'Contrasena restablecida correctamente.',
	SUCCESS_ACCOUNT_CREATION_MESSAGE: 'Cuenta creada correctamente.',
	SUCCESS_RESET_EMAIL_SENT_MESSAGE: 'Correo de restablecimiento enviado correctamente.',
	SUCCESS_PROFILE_RETRIEVED_MESSAGE: 'Informacion del perfil obtenida correctamente.',
	SUCCESS_USER_FOUND_MESSAGE: 'Informacion del usuario obtenida correctamente.',
	SUCCESS_USER_UPDATED_MESSAGE: 'Informacion del usuario actualizada correctamente.',
	SUCCESS_RETRIEVED: 'Datos obtenidos correctamente.',
	SUCCESS_CREATED: 'Recurso creado correctamente.',
	SUCCESS_DELETED: 'Recurso eliminado correctamente.',
	SUCCESS_UPDATED: 'Recurso actualizado correctamente.',

	// Validation Messages
	VALIDATION_FULLNAME_EMPTY: 'Tu nombre completo no puede estar vacio. Ingresa tu nombre.',
	VALIDATION_FULLNAME_INVALID:
		'Tu nombre completo contiene caracteres invalidos. Usa solo letras, espacios y puntuacion basica.',
	VALIDATION_FULLNAME_MIN: 'Tu nombre completo debe tener al menos 4 caracteres.',
	VALIDATION_FULLNAME_MAX: 'Tu nombre completo no puede exceder 25 caracteres.',
	VALIDATION_FULLNAME_REQUIRED: 'El campo Nombre Completo es obligatorio. Proporciona tu nombre.',

	VALIDATION_EMAIL_EMPTY: 'Tu correo no puede estar vacio. Ingresa un correo valido.',
	VALIDATION_EMAIL_INVALID:
		'La direccion de correo ingresada es invalida. Usa un formato valido como ejemplo@dominio.com.',
	VALIDATION_EMAIL_REQUIRED: 'El campo Correo es obligatorio. Proporciona tu correo electronico.',

	VALIDATION_PASSWORD_EMPTY: 'Tu contrasena no puede estar vacia. Ingresa una contrasena valida.',
	VALIDATION_PASSWORD_COMPLEXITY:
		'Tu contrasena no cumple con la complejidad requerida. Sigue las pautas especificadas.',
	VALIDATION_PASSWORD_REQUIRED: 'El campo Contrasena es obligatorio. Proporciona una contrasena.',

	VALIDATION_PROFILE_NAME_EMPTY: 'El Nombre de Perfil no puede estar vacio. Proporciona un nombre.',
	VALIDATION_PROFILE_NAME_INVALID:
		'El Nombre de Perfil contiene caracteres invalidos. Usa solo letras y puntuacion basica.',
	VALIDATION_PROFILE_NAME_MIN: 'El Nombre de Perfil debe tener al menos 3 caracteres.',
	VALIDATION_PROFILE_NAME_MAX: 'El Nombre de Perfil no puede exceder 15 caracteres.',
	VALIDATION_PROFILE_NAME_REQUIRED: 'El campo Nombre de Perfil es obligatorio.',

	VALIDATION_PIN_INVALID: 'El PIN debe tener exactamente 4 digitos.',
	VALIDATION_PIN_REQUIRED: 'El campo PIN es obligatorio.',

	VALIDATION_AGE_MIN: 'La edad minima permitida es 12 anos.',
	VALIDATION_AGE_MAX: 'La edad maxima permitida es 100 anos.',
	VALIDATION_AGE_REQUIRED: 'El campo Edad es obligatorio.',

	VALIDATION_ACCOUNT_HOLDER_EMPTY: 'El Nombre del Titular no puede estar vacio. Proporciona tu nombre.',
	VALIDATION_ACCOUNT_HOLDER_INVALID:
		'El Nombre del Titular contiene caracteres invalidos. Usa solo letras y puntuacion basica.',
	VALIDATION_ACCOUNT_HOLDER_MIN: 'El Nombre del Titular debe tener al menos 3 caracteres.',
	VALIDATION_ACCOUNT_HOLDER_MAX: 'El Nombre del Titular no puede exceder 30 caracteres.',
	VALIDATION_ACCOUNT_HOLDER_REQUIRED: 'El campo Nombre del Titular es obligatorio.',

	VALIDATION_DEVICE_NAME_REQUIRED: 'El Nombre del Dispositivo es obligatorio.',
	VALIDATION_DEVICE_TYPE_REQUIRED: 'El Tipo de Dispositivo es obligatorio.',
	VALIDATION_DEVICE_LOGGED_AT_REQUIRED: 'La fecha de inicio de sesion es obligatoria.',

	VALIDATION_COUNTRY_CODE_EMPTY: 'El Codigo de Pais no puede estar vacio. Proporciona un codigo valido.',
	VALIDATION_COUNTRY_CODE_LENGTH: 'El Codigo de Pais debe tener exactamente 2 caracteres.',
	VALIDATION_COUNTRY_CODE_MIN: 'El Codigo de Pais debe tener al menos 2 caracteres.',
	VALIDATION_COUNTRY_CODE_MAX: 'El Codigo de Pais no puede exceder 5 caracteres.',
	VALIDATION_COUNTRY_CODE_REQUIRED: 'El campo Codigo de Pais es obligatorio. Proporciona un codigo de pais.',

	VALIDATION_COUNTRY_NAME_EMPTY: 'El Nombre del Pais no puede estar vacio. Proporciona un nombre.',
	VALIDATION_COUNTRY_NAME_MIN: 'El Nombre del Pais debe tener al menos 2 caracteres.',
	VALIDATION_COUNTRY_NAME_MAX: 'El Nombre del Pais no puede exceder 50 caracteres.',
	VALIDATION_COUNTRY_NAME_REQUIRED: 'El campo Nombre del Pais es obligatorio.',

	VALIDATION_PUBLIC_ID_EMPTY: 'El ID Publico no puede estar vacio. Proporciona un ID publico valido.',
	VALIDATION_PUBLIC_ID_REQUIRED: 'El campo ID Publico es obligatorio. Proporciona un ID publico.',

	VALIDATION_PRICE_INVALID: 'El precio debe ser un numero valido.',
	VALIDATION_PRICE_NEGATIVE: 'El precio no puede ser negativo.',
	VALIDATION_PRICE_REQUIRED: 'El campo Precio es obligatorio. Proporciona un precio.',

	VALIDATION_CURRENCY_EMPTY: 'La moneda no puede estar vacia. Proporciona un codigo de moneda valido.',
	VALIDATION_CURRENCY_REQUIRED: 'El campo Moneda es obligatorio. Proporciona un codigo de moneda.',

	VALIDATION_MAX_SCREEN_INVALID: 'Max Screen debe ser un numero valido.',
	VALIDATION_MAX_SCREEN_MIN: 'Max Screen debe ser al menos 1.',
	VALIDATION_MAX_SCREEN_REQUIRED: 'El campo Max Screen es obligatorio. Proporciona un valor maximo de pantallas.',

	VALIDATION_TIER_INVALID: 'Tier debe ser un numero valido.',
	VALIDATION_TIER_MIN: 'Tier no puede ser menor que 0.',
	VALIDATION_TIER_MAX: 'Tier no puede exceder 5.',
	VALIDATION_TIER_REQUIRED: 'El campo Tier es obligatorio. Proporciona un valor de tier.',

	VALIDATION_NAMES_REQUIRED: 'El campo Names es obligatorio. Proporciona nombres para el plan.',
	VALIDATION_NAMES_INVALID: 'El campo Names debe ser un objeto valido.',
	VALIDATION_DESCRIPTIONS_REQUIRED: 'El campo Descriptions es obligatorio. Proporciona descripciones para el plan.',
	VALIDATION_DESCRIPTIONS_INVALID: 'El campo Descriptions debe ser un objeto valido.',
	VALIDATION_AUTO_RENEWAL_REQUIRED:
		'El campo Auto Renewal es obligatorio. Especifica si la renovacion automatica esta habilitada.',
	VALIDATION_AUTO_RENEWAL_INVALID: 'El campo Auto Renewal debe ser un valor booleano.',
	VALIDATION_IS_ACTIVE_INVALID: 'El campo Is Active debe ser un valor booleano.',
} as const;

export default es;
