import nodemailer, { SendMailOptions } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { customParseInt } from '@utils/standard';
import Logger from '@utils/logger';
import { validateEmail } from '@utils/validator';
import { LanguageCode } from '@core/constants/languages';
import config from '@core/infrastructure/config/application';
import i18next from '@api/middlewares/i18n';

type AccountCreationArgs = {
	email: string;
	country: string;
	name: string;
	ip: string;
};

type SubscriptionActivationArgs = {
	email: string;
	planName: string;
};

type NewSubscriptionActivationArgs = SubscriptionActivationArgs & {
	price: number;
	currency: string;
	nextPaymentDate: string;
};

type ResetPasswordArgs = {
	email: string;
	ip: string;
	resetToken: string;
	resetId: string;
	clientDomain: string;
};

type PaymentFailedArgs = {
	email: string;
	planName: string;
	amount: string;
	failedCount: number;
	clientDomain: string;
};

type AccessCodeArgs = {
	email: string;
	code: string;
	planName: string;
	valid: {
		validFor: number;
		isMonthly: boolean;
	};
};

// Create a reusable transporter object using SMTP transport
const logoURL = config.LogoUrl;
const NoReplyEmail = config.NoReplyEmail;
const appName = config.AppName;

export class MailerController {
	// Configure the transporter for nodemailer
	private static transporter = nodemailer.createTransport({
		host: process.env.MAILER_HOST,
		port: customParseInt(process.env.MAILER_PORT),
		secure: process.env.MAILER_SECURE != 'false', // use true for 465 port
		auth: { user: process.env.MAILER_EMAIL, pass: process.env.MAILER_PASS },
		tls: { rejectUnauthorized: false }, // Disables certificate validation
	} as SMTPTransport.Options);

	public static sendAccountCreationEmail = async (
		payload: AccountCreationArgs,
		language: LanguageCode,
	): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for account creation email: ${payload.email}`);
			return false;
		}

		// Prepare email content
		const html = `
        <div style="text-align: center;">
          ${this.emailLogoElement()}
        </div>

				<h3>Welcome to ${appName}!</h3>

        <p>Hello ${payload.name},</p>

				<p>Welcome to ${appName}! Your account has been successfully created. We are excited to have you on board from ${payload.country}. Your IP address is ${payload.ip}.</p>

				<p>Best regards,<br>${appName} Team</p>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Welcome to ${appName}!" <${NoReplyEmail}>`,
				to: payload.email,
				subject: `Welcome to ${appName}!`,
				text: `Hello ${payload.name},\n\nWelcome to ${appName}! Your account has been successfully created. We are excited to have you on board from ${payload.country}. Your IP address is ${payload.ip}.\n\nBest regards,\n${appName} Team`,
				html: html,
			},
			'EMAIL_ACCOUNT_CREATION_FAILED',
		);
	};

	public static sendNewSubscriptionActivation = async (
		payload: NewSubscriptionActivationArgs,
		language: LanguageCode,
	): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for new subscription activation email: ${payload.email}`);
			return false;
		}

		// Prepare email content
		const html = `
        <div style="text-align: center;">
          ${this.emailLogoElement()}
        </div>

        <h3>Welcome! Your Subscription to ${payload.planName} is Active</h3>
        <p>Dear Customer,</p>
        <p>We are excited to inform you that your subscription to the <strong>${payload.planName}</strong> plan is now active. Welcome aboard, and enjoy the new benefits!</p>
        <p><strong>Plan:</strong> ${payload.planName}</p>
        <p><strong>Price:</strong> ${payload.price} ${payload.currency}</p>
        <p><strong>Next Payment Date:</strong> ${payload.nextPaymentDate}</p>
				<p>Best regards,<br>${appName} Team</p>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Welcome to ${appName}!" <${NoReplyEmail}>`,
				to: payload.email,
				subject: `Welcome! Your Subscription to ${payload.planName} is Active`,
				text: `Dear Customer,\n\nWe are excited to inform you that your subscription to the ${payload.planName} plan is now active. Welcome aboard, and enjoy the new benefits!\n\nPlan: ${payload.planName}\nPrice: ${payload.price} ${payload.currency}\nNext Payment Date: ${payload.nextPaymentDate}\n\nBest regards,\n${appName} Team`,
				html: html,
			},
			'EMAIL_NEW_SUBSCRIPTION_ACTIVATION_FAILED',
		);
	};

	public static sendResetPassword = async (payload: ResetPasswordArgs, language: LanguageCode): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for password reset email: ${payload.email}`);
			return false;
		}

		// Build reset URL
		const resetUrl = new URL(`/reset/${payload.resetId}`, payload.clientDomain);
		resetUrl.searchParams.append('token', payload.resetToken);

		// Prepare email content
		const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta http-equiv="refresh" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <title>Password Reset</title>
          <style>
            .link-button:link, .link-button:visited {
              color: white;
              text-align: center;
              text-decoration: none;
            }

            .link-button {
              text-decoration: none;
              color: white;
              margin: 20px 0;
              background-color:#00aeef;
              padding: 12px;
              border-radius: 99999px !important;
              height: 40px;
            }
          </style>
        </head>

        <body>
          <div style="text-align: center;">
            ${this.emailLogoElement()}
          </div>

          <h3>Password Reset Request</h3>

          <p>Hello,</p>

          <p>You requested a password reset from IP: <strong>${payload.ip}</strong>. If this was you, click the link below to reset your password:</p>

          <a href="${resetUrl}" class="link-button">Reset Password</a>

          <p>If this wasn't you, you can safely ignore this email.</p>

					<p>Best regards,<br>${appName} Team</p>
        </body>

      </html>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Password Reset" <${NoReplyEmail}>`,
				to: payload.email,
				subject: 'Password Reset Request',
				text: `Hello,\n\nYou requested a password reset from IP: ${payload.ip}. If this was you, click the link below to reset your password:\n${resetUrl}\n\nIf this wasn't you, you can safely ignore this email.`,
				html: html,
			},
			'EMAIL_PASSWORD_RESET_FAILED',
		);
	};

	public static sendSubscriptionActivation = async (
		payload: SubscriptionActivationArgs,
		language: LanguageCode,
	): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for subscription activation email: ${payload.email}`);
			return false;
		}

		// Prepare email content
		const html = `
        <div style="text-align: center;">
          ${this.emailLogoElement()}
        </div>

        <h3>Welcome! Your Subscription to ${payload.planName} is Active</h3>
        <p>Dear Customer,</p>
        <p>We are excited to inform you that your subscription to the <strong>${payload.planName}</strong> plan is now active. Welcome aboard, and enjoy the new benefits!</p>
				<p>Best regards,<br>${appName} Team</p>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Welcome to ${appName}!" <${NoReplyEmail}>`,
				to: payload.email,
				subject: `Welcome! Your Subscription to ${payload.planName} is Active`,
				text: `Dear Customer,\n\nWe are excited to inform you that your subscription to the ${payload.planName} plan is now active. Welcome aboard, and enjoy the new benefits!\n\nBest regards,\n${appName} Team`,
				html: html,
			},
			'EMAIL_SUBSCRIPTION_ACTIVATION_FAILED',
		);
	};

	public static sendSubscriptionSuspended = async (
		payload: SubscriptionActivationArgs,
		language: LanguageCode,
	): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for subscription suspended email: ${payload.email}`);
			return false;
		}

		// Prepare email content
		const html = `
        <div style="text-align: center;">
          ${this.emailLogoElement()}
        </div>

        <h3>Subscription Suspended: ${payload.planName}</h3>
        <p>Dear Customer,</p>
        <p>Your subscription to the <strong>${payload.planName}</strong> plan has been temporarily suspended due to a billing issue.</p>
        <p>Please contact support to reactivate it.</p>
				<p>Best regards,<br>${appName} Team</p>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Support Team" <${NoReplyEmail}>`,
				to: payload.email,
				subject: `Subscription Suspended: ${payload.planName}`,
				text: `Dear Customer,\n\nYour subscription to the ${payload.planName} plan has been temporarily suspended due to a billing issue. Please contact support to reactivate it.\n\nBest regards,\n${appName} Team`,
				html: html,
			},
			'EMAIL_SUBSCRIPTION_SUSPENDED_FAILED',
		);
	};

	public static sendSubscriptionCancelled = async (
		payload: SubscriptionActivationArgs,
		language: LanguageCode,
	): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for subscription cancelled email: ${payload.email}`);
			return false;
		}

		// Prepare email content
		const html = `
        <div style="text-align: center;">
          ${this.emailLogoElement()}
        </div>

        <h3>Subscription Cancelled: ${payload.planName}</h3>
        <p>Dear Customer,</p>
        <p>Your subscription to the <strong>${payload.planName}</strong> plan has been cancelled. We're sorry to see you go!</p>
        <p>Feel free to reach out if you change your mind.</p>
				<p>Best regards,<br>${appName} Team</p>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Support Team" <${NoReplyEmail}>`,
				to: payload.email,
				subject: `Subscription Cancelled: ${payload.planName}`,
				text: `Dear Customer,\n\nYour subscription to the ${payload.planName} plan has been cancelled. We're sorry to see you go! Feel free to reach out if you change your mind.\n\nBest regards,\n${appName} Team`,
				html: html,
			},
			'EMAIL_SUBSCRIPTION_CANCELLED_FAILED',
		);
	};

	public static sendSubscriptionExpired = async (
		payload: SubscriptionActivationArgs,
		language: LanguageCode,
	): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for subscription expired email: ${payload.email}`);
			return false;
		}

		// Prepare email content
		const html = `
        <div style="text-align: center;">
          ${this.emailLogoElement()}
        </div>

        <h3>Subscription Expired: ${payload.planName}</h3>
        <p>Dear Customer,</p>
        <p>Your subscription to the <strong>${payload.planName}</strong> plan has expired. Please renew if you'd like to continue enjoying our services.</p>
				<p>Best regards,<br>${appName} Team</p>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Support Team" <${NoReplyEmail}>`,
				to: payload.email,
				subject: `Subscription Expired: ${payload.planName}`,
				text: `Dear Customer,\n\nYour subscription to the ${payload.planName} plan has expired. Please renew if you'd like to continue enjoying our services.\n\nBest regards,\n${appName} Team`,
				html: html,
			},
			'EMAIL_SUBSCRIPTION_EXPIRED_FAILED',
		);
	};

	public static sendSubscriptionUpgrade = async (
		payload: SubscriptionActivationArgs,
		language: LanguageCode,
	): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for subscription upgrade email: ${payload.email}`);
			return false;
		}

		// Prepare email content
		const html = `
        <div style="text-align: center;">
          ${this.emailLogoElement()}
        </div>

        <h3>Subscription Upgraded: ${payload.planName}</h3>
        <p>Dear Customer,</p>
        <p>Your subscription has been successfully upgraded to the <strong>${payload.planName}</strong> plan. Enjoy the new features and benefits!</p>
				<p>Best regards,<br>${appName} Team</p>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Support Team" <${NoReplyEmail}>`,
				to: payload.email,
				subject: `Subscription Upgraded: ${payload.planName}`,
				text: `Dear Customer,\n\nYour subscription has been successfully upgraded to the ${payload.planName} plan. Enjoy the new features and benefits!\n\nBest regards,\n${appName} Team`,
				html: html,
			},
			'EMAIL_SUBSCRIPTION_UPGRADE_FAILED',
		);
	};

	public static sendSubscriptionDowngrade = async (
		payload: SubscriptionActivationArgs,
		language: LanguageCode,
	): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for subscription downgrade email: ${payload.email}`);
			return false;
		}

		// Prepare email content
		const html = `
        <div style="text-align: center;">
          ${this.emailLogoElement()}
        </div>

        <h3>Subscription Downgraded: ${payload.planName}</h3>
        <p>Dear Customer,</p>
        <p>Your subscription has been successfully downgraded to the <strong>${payload.planName}</strong> plan. We're here if you need any assistance!</p>
				<p>Best regards,<br>${appName} Team</p>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Support Team" <${NoReplyEmail}>`,
				to: payload.email,
				subject: `Subscription Downgraded: ${payload.planName}`,
				text: `Dear Customer,\n\nYour subscription has been successfully downgraded to the ${payload.planName} plan. We're here if you need any assistance!\n\nBest regards,\n${appName} Team`,
				html: html,
			},
			'EMAIL_SUBSCRIPTION_DOWNGRADE_FAILED',
		);
	};

	public static sendPaymentFailed = async (payload: PaymentFailedArgs, language: LanguageCode): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for payment failed email: ${payload.email}`);
			return false;
		}

		// Prepare email content
		const html = `
        <div style="text-align: center;">
          ${this.emailLogoElement()}
        </div>

        <h3>Payment Failure Notice for ${payload.planName}</h3>

        <p>Dear Customer,</p>

        <p>We attempted to process your payment of <strong>${payload.amount}</strong> for the <strong>${payload.planName}</strong> plan, but it was unsuccessful. This is attempt number <strong>${payload.failedCount}</strong>.</p>

        <p>Please check your payment details or contact our support team if you have any questions.</p>

				<p>Best regards,<br>${appName} Team</p>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Billing Support" <${NoReplyEmail}>`,
				to: payload.email,
				subject: `Payment Failure Notice for ${payload.planName}`,
				text: `Dear Customer,\n\nWe attempted to process your payment of ${payload.amount} for the ${payload.planName} plan, but it was unsuccessful. This is attempt number ${payload.failedCount}.\n\nPlease check your payment details or contact our support team if you have any questions.\n\nBest regards,\n${appName} Team`,
				html: html,
			},
			'EMAIL_PAYMENT_FAILED',
		);
	};

	public static sendAccessCode = async (payload: AccessCodeArgs, language: LanguageCode): Promise<boolean> => {
		// Validate email
		const t = i18next.getFixedT(language);
		const [error, validatedEmail] = validateEmail(payload.email, t);

		// If email is invalid, return false
		if (error || !validatedEmail) {
			Logger.info(`[MAILER] Invalid email address provided for access code email: ${payload.email}`);
			return false;
		}

		// Prepare email content
		const html = `
        <div style="text-align: center;">
          ${this.emailLogoElement()}
        </div>

        <h3>Access Code for ${payload.planName}</h3>
        <p>Dear Customer,</p>
        <p>Your access code for the <strong>${payload.planName}</strong> plan is: <strong>${payload.code}</strong>. Use this code to activate your subscription.</p>
        <p>Valid for: ${payload.valid.validFor} ${payload.valid.isMonthly ? 'months' : 'days'}.</p>
				<p>Best regards,<br>${appName} Team</p>
      `;

		// Send email
		return this.sendMail(
			{
				from: `"Support Team" <${NoReplyEmail}>`,
				to: payload.email,
				subject: `Access Code for ${payload.planName}`,
				text: `Dear Customer,\n\nYour access code for the ${payload.planName} plan is: ${payload.code}. Use this code to activate your subscription.\n\nValid for: ${payload.valid.validFor} ${payload.valid.isMonthly ? 'months' : 'days'}.\n\nBest regards,\n${appName} Team`,
				html: html,
			},
			'EMAIL_ACCESS_CODE_FAILED',
		);
	};

	// Logo element for emails
	private static emailLogoElement(): string {
		return logoURL
			? `<img src="${logoURL}" alt="${appName}" width="150" height="auto" style="margin-bottom: 20px;">`
			: '';
	}

	// Send email helper method
	private static async sendMail(options: SendMailOptions, context: string): Promise<boolean> {
		try {
			await this.transporter.sendMail(options);
			return true;
		} catch (e) {
			Logger.info(`[MAILER] Failed to send ${context} email: ${(e as Error).message}`);
			return false;
		}
	}
}
