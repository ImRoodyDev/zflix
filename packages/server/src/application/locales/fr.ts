const fr = {
	// General Server Errors
	SERVER_ERROR_CODE: 'Erreur interne du serveur',
	SERVER_ERROR_MESSAGE: "Une erreur inattendue s'est produite sur le serveur.",
	SERVER_BAD_REQUEST_CODE: 'Requete invalide',
	SERVER_BAD_REQUEST_MESSAGE: "Le serveur n'a pas pu comprendre la requete en raison d'une syntaxe invalide.",
	SERVER_SESSION_ERROR_CODE: 'Erreur de session',
	SERVER_SESSION_ERROR_MESSAGE: 'Une erreur est survenue avec votre session. Veuillez vous reconnecter.',
	SERVER_MAINTENANCE_CODE: 'Maintenance du serveur',
	SERVER_MAINTENANCE_MESSAGE: 'Le serveur est actuellement en maintenance. Veuillez reessayer plus tard.',
	TOO_MANY_REQUESTS_CODE: 'Trop de requetes',
	TOO_MANY_REQUESTS_MESSAGE:
		'Vous avez envoye trop de requetes dans un laps de temps donne. Veuillez reessayer plus tard.',
	UNAUTHORIZED_CODE: 'Non autorise',
	UNAUTHORIZED_MESSAGE: 'Vous devez etre connecte pour acceder a cette ressource.',
	FORBIDDEN_CODE: 'Interdit',
	FORBIDDEN_MESSAGE: "Vous n'avez pas la permission d'acceder a cette ressource.",
	MAX_SCREEN_LIMIT_REACHED_CODE: 'Nombre maximal d ecrans atteint',
	MAX_SCREEN_LIMIT_REACHED_MESSAGE:
		'Vous avez atteint le nombre maximal d ecrans simultanes autorises par votre abonnement.',
	MAX_SCREEN_LIMIT_REACHED_DETAILS:
		'Veuillez fermer un autre ecran actif ou attendre l expiration d une session avant de lancer la lecture.',
	SCREEN_LIMITER_SESSION_MISSING_DETAILS: 'La session authentifiee de lecture est manquante.',
	SESSION_TOKEN_MISSING_DETAILS: 'Le jeton de session est manquant dans la requete.',
	UNACTIVE_SUBSCRIPTION_CODE: 'Abonnement inactif',
	UNACTIVE_SUBSCRIPTION_MESSAGE:
		"Votre abonnement n'est pas actif. Veuillez le renouveler pour continuer a utiliser nos services.",
	DATA_NOT_FOUND: '{data} introuvable',
	DATA_NOT_FOUND_MESSAGE: 'Votre {data} est introuvable : {id}',
	DEVICE_ERROR_CODE: "Informations d'appareil invalides fournies",
	DEVICE_ERROR_MESSAGE: "Les informations d'appareil fournies ne sont pas valides.",

	// Invalid Errors
	INVALID_SEARCH_QUERY_CODE: 'Requete de recherche invalide',
	INVALID_SEARCH_QUERY_MESSAGE: "La requete de recherche fournie n'est pas valide.",
	SEARCH_FAILED_CODE: 'Echec de la recherche',
	SEARCH_FAILED_MESSAGE: 'La recherche a echoue. Veuillez reessayer plus tard.',
	INVALID_CHANNEL_ID_CODE: 'ID de chaine invalide',
	INVALID_CHANNEL_ID_MESSAGE: "L'ID de la chaine est obligatoire.",
	INVALID_CREDENTIALS_CODE: 'Identifiants invalides',
	INVALID_CREDENTIALS_MESSAGE: "L'e-mail ou le mot de passe saisi est incorrect.",
	INVALID_EMAIL_CODE: 'E-mail invalide',
	INVALID_EMAIL_MESSAGE: "L'adresse e-mail fournie n'est pas valide.",
	INVALID_PASSWORD_CODE: 'Mot de passe invalide',
	INVALID_PASSWORD_MESSAGE: 'Le mot de passe fourni ne respecte pas les criteres requis.',
	INVALID_LOCATION_CODE: 'Emplacement invalide',
	INVALID_LOCATION_MESSAGE: 'Nous ne pouvons pas verifier votre emplacement',
	COUNTRY_NOT_ALLOWED_CODE: 'Pays non autorise',
	COUNTRY_NOT_ALLOWED_MESSAGE: "L'inscription n'est pas autorisee depuis votre pays.",

	// User Errors
	EXISTENT_USER_CODE: 'Utilisateur existant',
	EXISTENT_USER_MESSAGE: 'Un utilisateur avec cet e-mail existe deja.',
	UNEXISTENT_USER_CODE: 'Utilisateur inexistant',
	UNEXISTENT_USER_MESSAGE: "Aucun utilisateur avec l'e-mail fourni n'existe.",
	PROFILE_NOT_FOUND_CODE: 'Profil introuvable',
	PROFILE_NOT_FOUND_MESSAGE: 'Le profil specifie est introuvable.',
	CANNOT_DELETE_PRIMARY_PROFILE_MESSAGE: 'Vous ne pouvez pas supprimer le profil principal.',
	MAX_PROFILES_REACHED_MESSAGE: 'Vous avez atteint le nombre maximal de profils.',
	SAME_PASSWORD_MESSAGE: "Le nouveau mot de passe ne peut pas etre identique a l'ancien.",
	INVALID_TOKEN_CODE: 'Lien de reinitialisation invalide',
	INVALID_TOKEN_MESSAGE:
		'Le lien de reinitialisation du mot de passe a expire ou est invalide. Veuillez en demander un nouveau.',
	EMAIL_SEND_FAILED_MESSAGE: "Echec de l'envoi de l'e-mail. Veuillez reessayer plus tard.",
	ACCOUNT_ERROR_MESSAGE: 'Une erreur est survenue avec votre compte.',
	PROFILE_ALREADY_EXISTS_MESSAGE: 'Un profil avec ce nom existe deja.',
	REGISTRATION_DISABLED_MESSAGE: "L'inscription des utilisateurs est actuellement desactivee.",
	MAX_USERS_REACHED_MESSAGE: "Le nombre maximal d'utilisateurs a ete atteint.",

	// Billing Errors
	BILLING_NOT_FOUND_CODE: 'Facturation introuvable',
	BILLING_NOT_FOUND_MESSAGE: "Les informations de facturation que vous recherchez n'existent pas.",
	PLAN_NOT_FOUND_CODE: 'Plan introuvable',
	PLAN_NOT_FOUND_MESSAGE: "Le plan que vous recherchez n'existe pas.",

	// Subscription Errors
	PLAN: 'Plan',
	SUBSCRIPTION: 'Abonnement',
	SUBSCRIPTION_NOT_FOUND_CODE: 'Abonnement introuvable',
	SUBSCRIPTION_NOT_FOUND_MESSAGE: "L'abonnement que vous recherchez n'existe pas.",
	SUBSCRIPTION_ALREADY_EXISTS_CODE: "L'abonnement existe deja",
	SUBSCRIPTION_ALREADY_EXISTS_MESSAGE: 'Un abonnement actif existe deja pour cet utilisateur.',
	SUBSCRIPTION_CREATION_FAILED: "Echec de creation de l'abonnement",
	SUBSCRIPTION_CREATION_FAILED_MESSAGE:
		'Oups ! Un probleme est survenu lors de la creation de votre abonnement. Veuillez reessayer plus tard.',
	SUBSCRIPTION_CANCELLATION_FAILED: "Echec d'annulation de l'abonnement",
	SUBSCRIPTION_CANCELLATION_FAILED_MESSAGE:
		"Oups ! Un probleme est survenu lors de l'annulation de votre abonnement. Veuillez reessayer plus tard.",
	SUBSCRIPTION_APPROVAL_FAILED: "Echec d'approbation de l'abonnement",
	SUBSCRIPTION_APPROVAL_FAILED_MESSAGE:
		"Oups ! Un probleme est survenu lors de l'approbation de votre abonnement. Veuillez reessayer plus tard.",
	SUBSCRIPTION_WAITING_FOR_PAYMENT_MESSAGE:
		"Votre abonnement est en attente de paiement. Veuillez finaliser le paiement pour l'activer.",
	SUBSCRIPTION_CANCELLED_MESSAGE:
		"Votre abonnement a ete annule. Vous conserverez l'acces jusqu'a la fin du cycle de facturation en cours.",
	SUBSCRIPTION_UPDATED_MESSAGE: 'Votre abonnement a ete mis a jour avec succes.',
	SUBSCRIPTION_UPDATE_FAILED: "Echec de mise a jour de l'abonnement",
	SUBSCRIPTION_UPDATE_FAILED_MESSAGE:
		'Oups ! Un probleme est survenu lors de la mise a jour de votre abonnement. Veuillez reessayer plus tard.',
	SUBSCRIPTION_ACTIVATION_FAILED: "Echec d'activation de l'abonnement",
	SUBSCRIPTION_ACTIVATION_FAILED_MESSAGE:
		"Oups ! Un probleme est survenu lors de l'activation de votre abonnement. Veuillez reessayer plus tard.",

	// Media Errors
	MOVIE_NOT_FOUND_CODE: 'Film introuvable',
	MOVIE_NOT_FOUND_MESSAGE: 'Le film demande est introuvable.',
	SERIES_NOT_FOUND_CODE: 'Serie introuvable',
	SERIES_NOT_FOUND_MESSAGE: 'La serie demandee est introuvable.',
	EPISODE_NOT_FOUND_CODE: 'Episode introuvable',
	EPISODE_NOT_FOUND_MESSAGE: "L'episode demande est introuvable.",
	STREAM_SOURCE_NOT_FOUND_CODE: 'Source de streaming introuvable',
	STREAM_SOURCE_NOT_FOUND_MESSAGE: "Aucune source de streaming pour le media demande n'a ete trouvee.",
	REQUESTED_RESOURCE_NOT_FOUND_CODE: 'Ressource demandee introuvable',
	REQUESTED_RESOURCE_NOT_FOUND_MESSAGE: 'La ressource que vous recherchez est introuvable.',
	PROXY_NOT_FOUND_CODE: 'Proxy introuvable',
	PROXY_NOT_FOUND_MESSAGE: 'Aucun proxy n est disponible.',

	// Success Messages
	SUCCESS_LOGIN_MESSAGE: 'Utilisateur connecte avec succes.',
	SUCCESS_LOGOUT_MESSAGE: 'Utilisateur deconnecte avec succes.',
	SUCCESS_PASSWORD_RESET_MESSAGE: 'Mot de passe reinitialise avec succes.',
	SUCCESS_ACCOUNT_CREATION_MESSAGE: 'Compte cree avec succes.',
	SUCCESS_RESET_EMAIL_SENT_MESSAGE: 'E-mail de reinitialisation du mot de passe envoye avec succes.',
	SUCCESS_PROFILE_RETRIEVED_MESSAGE: 'Informations du profil recuperees avec succes.',
	SUCCESS_USER_FOUND_MESSAGE: "Informations de l'utilisateur recuperees avec succes.",
	SUCCESS_USER_UPDATED_MESSAGE: "Informations de l'utilisateur mises a jour avec succes.",
	SUCCESS_RETRIEVED: 'Donnees recuperees avec succes.',
	SUCCESS_CREATED: 'Ressource creee avec succes.',
	SUCCESS_DELETED: 'Ressource supprimee avec succes.',
	SUCCESS_UPDATED: 'Ressource mise a jour avec succes.',

	// Validation Messages
	VALIDATION_FULLNAME_EMPTY: 'Votre nom complet ne peut pas etre vide. Veuillez saisir votre nom.',
	VALIDATION_FULLNAME_INVALID:
		'Votre nom complet contient des caracteres invalides. Utilisez uniquement des lettres, des espaces et une ponctuation de base.',
	VALIDATION_FULLNAME_MIN: 'Votre nom complet doit contenir au moins 4 caracteres.',
	VALIDATION_FULLNAME_MAX: 'Votre nom complet ne peut pas depasser 25 caracteres.',
	VALIDATION_FULLNAME_REQUIRED: 'Le champ Nom complet est obligatoire. Veuillez fournir votre nom.',

	VALIDATION_EMAIL_EMPTY: 'Votre adresse e-mail ne peut pas etre vide. Veuillez saisir un e-mail valide.',
	VALIDATION_EMAIL_INVALID:
		"L'adresse e-mail saisie est invalide. Utilisez un format valide comme exemple@domaine.com.",
	VALIDATION_EMAIL_REQUIRED: 'Le champ E-mail est obligatoire. Veuillez fournir votre adresse e-mail.',

	VALIDATION_PASSWORD_EMPTY: 'Votre mot de passe ne peut pas etre vide. Veuillez saisir un mot de passe valide.',
	VALIDATION_PASSWORD_COMPLEXITY:
		'Votre mot de passe ne respecte pas la complexite requise. Veuillez suivre les directives specifiees.',
	VALIDATION_PASSWORD_REQUIRED: 'Le champ Mot de passe est obligatoire. Veuillez fournir un mot de passe.',

	VALIDATION_PROFILE_NAME_EMPTY: 'Le Nom du profil ne peut pas etre vide. Veuillez fournir un nom.',
	VALIDATION_PROFILE_NAME_INVALID:
		'Le Nom du profil contient des caracteres invalides. Utilisez uniquement des lettres et une ponctuation de base.',
	VALIDATION_PROFILE_NAME_MIN: 'Le Nom du profil doit contenir au moins 3 caracteres.',
	VALIDATION_PROFILE_NAME_MAX: 'Le Nom du profil ne peut pas depasser 15 caracteres.',
	VALIDATION_PROFILE_NAME_REQUIRED: 'Le champ Nom du profil est obligatoire.',

	VALIDATION_PIN_INVALID: 'Le code PIN doit contenir exactement 4 chiffres.',
	VALIDATION_PIN_REQUIRED: 'Le champ PIN est obligatoire.',

	VALIDATION_AGE_MIN: "L'age minimum autorise est de 12 ans.",
	VALIDATION_AGE_MAX: "L'age maximum autorise est de 100 ans.",
	VALIDATION_AGE_REQUIRED: 'Le champ Age est obligatoire.',

	VALIDATION_ACCOUNT_HOLDER_EMPTY: 'Le Nom du titulaire du compte ne peut pas etre vide. Veuillez fournir votre nom.',
	VALIDATION_ACCOUNT_HOLDER_INVALID:
		'Le Nom du titulaire du compte contient des caracteres invalides. Utilisez uniquement des lettres et une ponctuation de base.',
	VALIDATION_ACCOUNT_HOLDER_MIN: 'Le Nom du titulaire du compte doit contenir au moins 3 caracteres.',
	VALIDATION_ACCOUNT_HOLDER_MAX: 'Le Nom du titulaire du compte ne peut pas depasser 30 caracteres.',
	VALIDATION_ACCOUNT_HOLDER_REQUIRED: 'Le champ Nom du titulaire du compte est obligatoire.',

	VALIDATION_DEVICE_NAME_REQUIRED: "Le Nom de l'appareil est obligatoire.",
	VALIDATION_DEVICE_TYPE_REQUIRED: "Le Type d'appareil est obligatoire.",
	VALIDATION_DEVICE_LOGGED_AT_REQUIRED: 'La date de connexion est obligatoire.',

	VALIDATION_COUNTRY_CODE_EMPTY: 'Le Code pays ne peut pas etre vide. Veuillez fournir un code pays valide.',
	VALIDATION_COUNTRY_CODE_LENGTH: 'Le Code pays doit contenir exactement 2 caracteres.',
	VALIDATION_COUNTRY_CODE_MIN: 'Le Code pays doit contenir au moins 2 caracteres.',
	VALIDATION_COUNTRY_CODE_MAX: 'Le Code pays ne peut pas depasser 5 caracteres.',
	VALIDATION_COUNTRY_CODE_REQUIRED: 'Le champ Code pays est obligatoire. Veuillez fournir un code pays.',

	VALIDATION_COUNTRY_NAME_EMPTY: 'Le Nom du pays ne peut pas etre vide. Veuillez fournir un nom.',
	VALIDATION_COUNTRY_NAME_MIN: 'Le Nom du pays doit contenir au moins 2 caracteres.',
	VALIDATION_COUNTRY_NAME_MAX: 'Le Nom du pays ne peut pas depasser 50 caracteres.',
	VALIDATION_COUNTRY_NAME_REQUIRED: 'Le champ Nom du pays est obligatoire.',

	VALIDATION_PUBLIC_ID_EMPTY: "L'ID public ne peut pas etre vide. Veuillez fournir un ID public valide.",
	VALIDATION_PUBLIC_ID_REQUIRED: 'Le champ ID public est obligatoire. Veuillez fournir un ID public.',

	VALIDATION_PRICE_INVALID: 'Le prix doit etre un nombre valide.',
	VALIDATION_PRICE_NEGATIVE: 'Le prix ne peut pas etre negatif.',
	VALIDATION_PRICE_REQUIRED: 'Le champ Prix est obligatoire. Veuillez fournir un prix.',

	VALIDATION_CURRENCY_EMPTY: 'La devise ne peut pas etre vide. Veuillez fournir un code devise valide.',
	VALIDATION_CURRENCY_REQUIRED: 'Le champ Devise est obligatoire. Veuillez fournir un code devise.',

	VALIDATION_MAX_SCREEN_INVALID: 'Max Screen doit etre un nombre valide.',
	VALIDATION_MAX_SCREEN_MIN: 'Max Screen doit etre au minimum 1.',
	VALIDATION_MAX_SCREEN_REQUIRED: "Le champ Max Screen est obligatoire. Veuillez fournir une valeur maximale d'ecrans.",

	VALIDATION_TIER_INVALID: 'Tier doit etre un nombre valide.',
	VALIDATION_TIER_MIN: 'Tier ne peut pas etre inferieur a 0.',
	VALIDATION_TIER_MAX: 'Tier ne peut pas depasser 5.',
	VALIDATION_TIER_REQUIRED: 'Le champ Tier est obligatoire. Veuillez fournir une valeur de tier.',

	VALIDATION_NAMES_REQUIRED: 'Le champ Names est obligatoire. Veuillez fournir des noms pour le plan.',
	VALIDATION_NAMES_INVALID: 'Le champ Names doit etre un objet valide.',
	VALIDATION_DESCRIPTIONS_REQUIRED:
		'Le champ Descriptions est obligatoire. Veuillez fournir des descriptions pour le plan.',
	VALIDATION_DESCRIPTIONS_INVALID: 'Le champ Descriptions doit etre un objet valide.',
	VALIDATION_AUTO_RENEWAL_REQUIRED:
		'Le champ Auto Renewal est obligatoire. Veuillez indiquer si le renouvellement automatique est active.',
	VALIDATION_AUTO_RENEWAL_INVALID: 'Le champ Auto Renewal doit etre une valeur booleenne.',
	VALIDATION_IS_ACTIVE_INVALID: 'Le champ Is Active doit etre une valeur booleenne.',
} as const;

export default fr;
