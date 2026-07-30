const nl = {
	// General Server Errors
	SERVER_ERROR_CODE: 'Interne serverfout',
	SERVER_ERROR_MESSAGE: 'Er is een onverwachte fout opgetreden op de server.',
	SERVER_BAD_REQUEST_CODE: 'Ongeldige aanvraag',
	SERVER_BAD_REQUEST_MESSAGE: 'De server kon de aanvraag niet begrijpen door ongeldige syntaxis.',
	SERVER_SESSION_ERROR_CODE: 'Sessiefout',
	SERVER_SESSION_ERROR_MESSAGE: 'Er is een fout opgetreden met je sessie. Log opnieuw in.',
	SERVER_MAINTENANCE_CODE: 'Serveronderhoud',
	SERVER_MAINTENANCE_MESSAGE: 'De server is momenteel in onderhoud. Probeer het later opnieuw.',
	TOO_MANY_REQUESTS_CODE: 'Te veel aanvragen',
	TOO_MANY_REQUESTS_MESSAGE: 'Je hebt te veel aanvragen in korte tijd verzonden. Probeer het later opnieuw.',
	UNAUTHORIZED_CODE: 'Niet geautoriseerd',
	UNAUTHORIZED_MESSAGE: 'Je moet ingelogd zijn om deze bron te openen.',
	FORBIDDEN_CODE: 'Verboden',
	FORBIDDEN_MESSAGE: 'Je hebt geen toestemming om deze bron te openen.',
	MAX_SCREEN_LIMIT_REACHED_CODE: 'Maximum aantal schermen bereikt',
	MAX_SCREEN_LIMIT_REACHED_MESSAGE:
		'Je hebt het maximale aantal gelijktijdige schermen bereikt dat door je abonnement is toegestaan.',
	MAX_SCREEN_LIMIT_REACHED_DETAILS:
		'Sluit een ander actief scherm of wacht tot een bestaande sessie verloopt voordat je afspelen start.',
	SCREEN_LIMITER_SESSION_MISSING_DETAILS: 'De geauthenticeerde afspeelsessie ontbreekt.',
	SESSION_TOKEN_MISSING_DETAILS: 'Het sessietoken ontbreekt in het verzoek.',
	UNACTIVE_SUBSCRIPTION_CODE: 'Inactief abonnement',
	UNACTIVE_SUBSCRIPTION_MESSAGE: 'Je abonnement is niet actief. Verleng om onze diensten te blijven gebruiken.',
	DATA_NOT_FOUND: '{data} niet gevonden',
	DATA_NOT_FOUND_MESSAGE: 'Je {data} is niet gevonden: {id}',
	DEVICE_ERROR_CODE: 'Ongeldige apparaatinformatie opgegeven',
	DEVICE_ERROR_MESSAGE: 'De opgegeven apparaatinformatie is niet geldig.',

	// Invalid Errors
	INVALID_SEARCH_QUERY_CODE: 'Ongeldige zoekopdracht',
	INVALID_SEARCH_QUERY_MESSAGE: 'De opgegeven zoekopdracht is niet geldig.',
	SEARCH_FAILED_CODE: 'Zoeken mislukt',
	SEARCH_FAILED_MESSAGE: 'De zoekopdracht is mislukt. Probeer het later opnieuw.',
	INVALID_CHANNEL_ID_CODE: 'Ongeldige kanaal-ID',
	INVALID_CHANNEL_ID_MESSAGE: 'Kanaal-ID is verplicht.',
	INVALID_CREDENTIALS_CODE: 'Ongeldige inloggegevens',
	INVALID_CREDENTIALS_MESSAGE: 'Het e-mailadres of wachtwoord dat je hebt ingevoerd is onjuist.',
	INVALID_EMAIL_CODE: 'Ongeldig e-mailadres',
	INVALID_EMAIL_MESSAGE: 'Het opgegeven e-mailadres is niet geldig.',
	INVALID_PASSWORD_CODE: 'Ongeldig wachtwoord',
	INVALID_PASSWORD_MESSAGE: 'Het opgegeven wachtwoord voldoet niet aan de vereiste criteria.',
	INVALID_LOCATION_CODE: 'Ongeldige locatie',
	INVALID_LOCATION_MESSAGE: 'We kunnen je locatie niet verifiëren',
	COUNTRY_NOT_ALLOWED_CODE: 'Land niet toegestaan',
	COUNTRY_NOT_ALLOWED_MESSAGE: 'Registratie is niet toegestaan vanuit jouw land.',

	// User Errors
	EXISTENT_USER_CODE: 'Bestaande gebruiker',
	EXISTENT_USER_MESSAGE: 'Er bestaat al een gebruiker met dit e-mailadres.',
	UNEXISTENT_USER_CODE: 'Niet-bestaande gebruiker',
	UNEXISTENT_USER_MESSAGE: 'Er bestaat geen gebruiker met het opgegeven e-mailadres.',
	PROFILE_NOT_FOUND_CODE: 'Profiel niet gevonden',
	PROFILE_NOT_FOUND_MESSAGE: 'Het opgegeven profiel kon niet worden gevonden.',
	CANNOT_DELETE_PRIMARY_PROFILE_MESSAGE: 'Je kunt het primaire profiel niet verwijderen.',
	MAX_PROFILES_REACHED_MESSAGE: 'Je hebt het maximale aantal profielen bereikt.',
	SAME_PASSWORD_MESSAGE: 'Nieuw wachtwoord mag niet hetzelfde zijn als het oude wachtwoord.',
	INVALID_TOKEN_CODE: 'Ongeldige resetlink',
	INVALID_TOKEN_MESSAGE: 'De link om het wachtwoord te resetten is verlopen of ongeldig. Vraag een nieuwe aan.',
	EMAIL_SEND_FAILED_MESSAGE: 'Verzenden van e-mail is mislukt. Probeer het later opnieuw.',
	ACCOUNT_ERROR_MESSAGE: 'Er is een fout opgetreden met je account.',
	PROFILE_ALREADY_EXISTS_MESSAGE: 'Er bestaat al een profiel met deze naam.',
	REGISTRATION_DISABLED_MESSAGE: 'Gebruikersregistratie is momenteel uitgeschakeld.',
	MAX_USERS_REACHED_MESSAGE: 'Het maximale aantal gebruikers is bereikt.',

	// Billing Errors
	BILLING_NOT_FOUND_CODE: 'Facturatie niet gevonden',
	BILLING_NOT_FOUND_MESSAGE: 'De facturatiegegevens die je zoekt bestaan niet.',
	PLAN_NOT_FOUND_CODE: 'Plan niet gevonden',
	PLAN_NOT_FOUND_MESSAGE: 'Het plan dat je zoekt bestaat niet.',

	// Subscription Errors
	PLAN: 'Plan',
	SUBSCRIPTION: 'Abonnement',
	SUBSCRIPTION_NOT_FOUND_CODE: 'Abonnement niet gevonden',
	SUBSCRIPTION_NOT_FOUND_MESSAGE: 'Het abonnement dat je zoekt bestaat niet.',
	SUBSCRIPTION_ALREADY_EXISTS_CODE: 'Abonnement bestaat al',
	SUBSCRIPTION_ALREADY_EXISTS_MESSAGE: 'Er bestaat al een actief abonnement voor deze gebruiker.',
	SUBSCRIPTION_CREATION_FAILED: 'Aanmaken van abonnement mislukt',
	SUBSCRIPTION_CREATION_FAILED_MESSAGE:
		'Oeps. Er is een probleem opgetreden bij het aanmaken van je abonnement. Probeer het later opnieuw.',
	SUBSCRIPTION_CANCELLATION_FAILED: 'Annuleren van abonnement mislukt',
	SUBSCRIPTION_CANCELLATION_FAILED_MESSAGE:
		'Oeps. Er is een probleem opgetreden bij het annuleren van je abonnement. Probeer het later opnieuw.',
	SUBSCRIPTION_APPROVAL_FAILED: 'Goedkeuren van abonnement mislukt',
	SUBSCRIPTION_APPROVAL_FAILED_MESSAGE:
		'Oeps. Er is een probleem opgetreden bij het goedkeuren van je abonnement. Probeer het later opnieuw.',
	SUBSCRIPTION_WAITING_FOR_PAYMENT_MESSAGE:
		'Je abonnement wacht op betaling. Rond de betaling af om je abonnement te activeren.',
	SUBSCRIPTION_CANCELLED_MESSAGE:
		'Je abonnement is geannuleerd. Je behoudt toegang tot het einde van de huidige factureringsperiode.',
	SUBSCRIPTION_UPDATED_MESSAGE: 'Je abonnement is succesvol bijgewerkt.',
	SUBSCRIPTION_UPDATE_FAILED: 'Bijwerken van abonnement mislukt',
	SUBSCRIPTION_UPDATE_FAILED_MESSAGE:
		'Oeps. Er is een probleem opgetreden bij het bijwerken van je abonnement. Probeer het later opnieuw.',
	SUBSCRIPTION_ACTIVATION_FAILED: 'Activeren van abonnement mislukt',
	SUBSCRIPTION_ACTIVATION_FAILED_MESSAGE:
		'Oeps. Er is een probleem opgetreden bij het activeren van je abonnement. Probeer het later opnieuw.',

	// Media Errors
	MOVIE_NOT_FOUND_CODE: 'Film niet gevonden',
	MOVIE_NOT_FOUND_MESSAGE: 'De opgevraagde film kon niet worden gevonden.',
	SERIES_NOT_FOUND_CODE: 'Serie niet gevonden',
	SERIES_NOT_FOUND_MESSAGE: 'De opgevraagde serie kon niet worden gevonden.',
	EPISODE_NOT_FOUND_CODE: 'Aflevering niet gevonden',
	EPISODE_NOT_FOUND_MESSAGE: 'De opgevraagde aflevering kon niet worden gevonden.',
	STREAM_SOURCE_NOT_FOUND_CODE: 'Streambron niet gevonden',
	STREAM_SOURCE_NOT_FOUND_MESSAGE: 'Er kon geen streambron voor de opgevraagde media worden gevonden.',
	REQUESTED_RESOURCE_NOT_FOUND_CODE: 'Opgevraagde bron niet gevonden',
	REQUESTED_RESOURCE_NOT_FOUND_MESSAGE: 'De bron die je zoekt kon niet worden gevonden.',
	PROXY_NOT_FOUND_CODE: 'Proxy niet gevonden',
	PROXY_NOT_FOUND_MESSAGE: 'Er zijn geen proxies beschikbaar.',

	// Success Messages
	SUCCESS_LOGIN_MESSAGE: 'Gebruiker succesvol ingelogd.',
	SUCCESS_LOGOUT_MESSAGE: 'Gebruiker succesvol uitgelogd.',
	SUCCESS_PASSWORD_RESET_MESSAGE: 'Wachtwoord succesvol gereset.',
	SUCCESS_ACCOUNT_CREATION_MESSAGE: 'Account succesvol aangemaakt.',
	SUCCESS_RESET_EMAIL_SENT_MESSAGE: 'E-mail voor wachtwoordreset succesvol verzonden.',
	SUCCESS_PROFILE_RETRIEVED_MESSAGE: 'Profielinformatie succesvol opgehaald.',
	SUCCESS_USER_FOUND_MESSAGE: 'Gebruikersinformatie succesvol opgehaald.',
	SUCCESS_USER_UPDATED_MESSAGE: 'Gebruikersinformatie succesvol bijgewerkt.',
	SUCCESS_RETRIEVED: 'Gegevens succesvol opgehaald.',
	SUCCESS_CREATED: 'Bron succesvol aangemaakt.',
	SUCCESS_DELETED: 'Bron succesvol verwijderd.',
	SUCCESS_UPDATED: 'Bron succesvol bijgewerkt.',

	// Validation Messages
	VALIDATION_FULLNAME_EMPTY: 'Je volledige naam mag niet leeg zijn. Vul je naam in.',
	VALIDATION_FULLNAME_INVALID:
		'Je volledige naam bevat ongeldige tekens. Gebruik alleen letters, spaties en basisinterpunctie.',
	VALIDATION_FULLNAME_MIN: 'Je volledige naam moet minimaal 4 tekens lang zijn.',
	VALIDATION_FULLNAME_MAX: 'Je volledige naam mag niet langer zijn dan 25 tekens.',
	VALIDATION_FULLNAME_REQUIRED: 'Het veld Volledige Naam is verplicht. Vul je naam in.',

	VALIDATION_EMAIL_EMPTY: 'Je e-mailadres mag niet leeg zijn. Vul een geldig e-mailadres in.',
	VALIDATION_EMAIL_INVALID:
		'Het ingevoerde e-mailadres is ongeldig. Gebruik een geldig formaat zoals voorbeeld@domein.com.',
	VALIDATION_EMAIL_REQUIRED: 'Het veld E-mail is verplicht. Vul je e-mailadres in.',

	VALIDATION_PASSWORD_EMPTY: 'Je wachtwoord mag niet leeg zijn. Vul een geldig wachtwoord in.',
	VALIDATION_PASSWORD_COMPLEXITY:
		'Je wachtwoord voldoet niet aan de vereiste complexiteit. Volg de opgegeven richtlijnen.',
	VALIDATION_PASSWORD_REQUIRED: 'Het veld Wachtwoord is verplicht. Vul een wachtwoord in.',

	VALIDATION_PROFILE_NAME_EMPTY: 'Profielnaam mag niet leeg zijn. Vul een naam in.',
	VALIDATION_PROFILE_NAME_INVALID: 'Profielnaam bevat ongeldige tekens. Gebruik alleen letters en basisinterpunctie.',
	VALIDATION_PROFILE_NAME_MIN: 'Profielnaam moet minimaal 3 tekens lang zijn.',
	VALIDATION_PROFILE_NAME_MAX: 'Profielnaam mag niet langer zijn dan 15 tekens.',
	VALIDATION_PROFILE_NAME_REQUIRED: 'Het veld Profielnaam is verplicht.',

	VALIDATION_PIN_INVALID: 'De pincode moet exact 4 cijfers bevatten.',
	VALIDATION_PIN_REQUIRED: 'Het veld Pincode is verplicht.',

	VALIDATION_AGE_MIN: 'De minimumleeftijd is 12 jaar.',
	VALIDATION_AGE_MAX: 'De maximumleeftijd is 100 jaar.',
	VALIDATION_AGE_REQUIRED: 'Het veld Leeftijd is verplicht.',

	VALIDATION_ACCOUNT_HOLDER_EMPTY: 'Naam van rekeninghouder mag niet leeg zijn. Vul je naam in.',
	VALIDATION_ACCOUNT_HOLDER_INVALID:
		'Naam van rekeninghouder bevat ongeldige tekens. Gebruik alleen letters en basisinterpunctie.',
	VALIDATION_ACCOUNT_HOLDER_MIN: 'Naam van rekeninghouder moet minimaal 3 tekens lang zijn.',
	VALIDATION_ACCOUNT_HOLDER_MAX: 'Naam van rekeninghouder mag niet langer zijn dan 30 tekens.',
	VALIDATION_ACCOUNT_HOLDER_REQUIRED: 'Het veld Naam van rekeninghouder is verplicht.',

	VALIDATION_DEVICE_NAME_REQUIRED: 'Apparaatnaam is verplicht.',
	VALIDATION_DEVICE_TYPE_REQUIRED: 'Apparaattype is verplicht.',
	VALIDATION_DEVICE_LOGGED_AT_REQUIRED: 'Inlogdatum is verplicht.',

	VALIDATION_COUNTRY_CODE_EMPTY: 'Landcode mag niet leeg zijn. Geef een geldige landcode op.',
	VALIDATION_COUNTRY_CODE_LENGTH: 'Landcode moet exact 2 tekens bevatten.',
	VALIDATION_COUNTRY_CODE_MIN: 'Landcode moet minimaal 2 tekens lang zijn.',
	VALIDATION_COUNTRY_CODE_MAX: 'Landcode mag niet langer zijn dan 5 tekens.',
	VALIDATION_COUNTRY_CODE_REQUIRED: 'Het veld Landcode is verplicht. Geef een landcode op.',

	VALIDATION_COUNTRY_NAME_EMPTY: 'Landnaam mag niet leeg zijn. Geef een naam op.',
	VALIDATION_COUNTRY_NAME_MIN: 'Landnaam moet minimaal 2 tekens lang zijn.',
	VALIDATION_COUNTRY_NAME_MAX: 'Landnaam mag niet langer zijn dan 50 tekens.',
	VALIDATION_COUNTRY_NAME_REQUIRED: 'Het veld Landnaam is verplicht.',

	VALIDATION_PUBLIC_ID_EMPTY: 'Publieke ID mag niet leeg zijn. Geef een geldige publieke ID op.',
	VALIDATION_PUBLIC_ID_REQUIRED: 'Het veld Publieke ID is verplicht. Geef een publieke ID op.',

	VALIDATION_PRICE_INVALID: 'Prijs moet een geldig getal zijn.',
	VALIDATION_PRICE_NEGATIVE: 'Prijs mag niet negatief zijn.',
	VALIDATION_PRICE_REQUIRED: 'Het veld Prijs is verplicht. Geef een prijs op.',

	VALIDATION_CURRENCY_EMPTY: 'Valuta mag niet leeg zijn. Geef een geldige valutacode op.',
	VALIDATION_CURRENCY_REQUIRED: 'Het veld Valuta is verplicht. Geef een valutacode op.',

	VALIDATION_MAX_SCREEN_INVALID: 'Max Screen moet een geldig getal zijn.',
	VALIDATION_MAX_SCREEN_MIN: 'Max Screen moet minimaal 1 zijn.',
	VALIDATION_MAX_SCREEN_REQUIRED: 'Het veld Max Screen is verplicht. Geef een maximale schermwaarde op.',

	VALIDATION_TIER_INVALID: 'Tier moet een geldig getal zijn.',
	VALIDATION_TIER_MIN: 'Tier mag niet lager zijn dan 0.',
	VALIDATION_TIER_MAX: 'Tier mag niet hoger zijn dan 5.',
	VALIDATION_TIER_REQUIRED: 'Het veld Tier is verplicht. Geef een tierwaarde op.',

	VALIDATION_NAMES_REQUIRED: 'Het veld Names is verplicht. Geef namen voor het plan op.',
	VALIDATION_NAMES_INVALID: 'Het veld Names moet een geldig object zijn.',
	VALIDATION_DESCRIPTIONS_REQUIRED: 'Het veld Descriptions is verplicht. Geef beschrijvingen voor het plan op.',
	VALIDATION_DESCRIPTIONS_INVALID: 'Het veld Descriptions moet een geldig object zijn.',
	VALIDATION_AUTO_RENEWAL_REQUIRED:
		'Het veld Auto Renewal is verplicht. Geef aan of automatische verlenging is ingeschakeld.',
	VALIDATION_AUTO_RENEWAL_INVALID: 'Het veld Auto Renewal moet een booleaanse waarde zijn.',
	VALIDATION_IS_ACTIVE_INVALID: 'Het veld Is Active moet een booleaanse waarde zijn.',
} as const;

export default nl;
