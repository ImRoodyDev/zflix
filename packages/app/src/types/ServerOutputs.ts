// ============================================================================
// Authentication DTOs
// ============================================================================

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	fullName: string;
	email: string;
	password: string;
}

export interface LoginResponseData {
	redirect?: string;
	access: string;
}

export interface RegisterResponseData {
	access: string;
}

export interface ResetPasswordRequest {
	email: string;
}

export interface ResetPasswordWithTokenRequest {
	resetId: string;
	token: string;
	password: string;
}

export interface AccountUpdatePayload {
	name: string;
	password?: string;
	newPassword?: string;
}

// ============================================================================
// User & Profile DTOs
// ============================================================================

export interface Avatar {
	id: string;
	imagePath: string | null;
}

export interface UserOutputInformation {
	setupFinish: boolean;
	name: string;
	email: string;
	subscription: boolean;
	profiles: ProfileOutputInformation[];
	country: string;
	countryCode: string;
	tr: number;
}

export interface ProfileOutputInformation {
	id: string;
	primary: boolean;
	profileName: string;
	avatarId: string | null;
	certificationId: string;
	languageCode: string;
	autoPlay: boolean;
	defaultSubtitle: boolean;
	bookmarks?: { id: string; type: string }[];
	activities?: { id: string; type: string; runtimes?: any }[];
}

export interface ProfilePayload {
	profileName: string;
	avatarId?: string;
	languageCode?: string;
	certificationId?: string;
	autoPlay?: boolean;
	defaultSubtitle?: boolean;
}

export interface ProfileInputInformation extends ProfilePayload {
	id?: Readonly<string>;
	primary?: Readonly<boolean>;
	avatarId?: string;
	profileName: string;
	languageCode: string;
	certificationId: string;
	autoPlay: boolean;
	defaultSubtitle: boolean;
}

// ============================================================================
// Subscription DTOs
// ============================================================================

export type SubscriptionStatus = 'ACTIVE' | 'APPROVED' | 'CREATED' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
export type SubscriptionSource = 'STRIPE' | 'PAYPAL' | 'MANUAL' | 'CODE' | 'OTHER';

export interface BillingOutputInformation {
	transactionId: string;
	currency: string;
	amount: number;
	method: string;
	createdAt: string;
	subscriptionId: string;
}

export class BillingHistory implements Readonly<Omit<BillingOutputInformation, 'createdAt'>> {
	transactionId!: string;
	currency!: string;
	amount!: number;
	method!: string;
	subscriptionId!: string;
	createdAt: Date;
	constructor(data: BillingOutputInformation) {
		const { createdAt, ...rest } = data;
		Object.assign(this, rest);
		this.createdAt = new Date(createdAt);
	}
}
export interface PlanOutputInformation {
	id: string;
	index: number;
	names: Record<string, string>;
	descriptions: Record<string, string[]>;
	autoRenewal: boolean;
	price: number;
	currency: string;
	maxScreen: number;
}

export interface SubscriptionOutputInformation {
	id: string;
	planId: string;
	active: boolean;
	status: SubscriptionStatus;
	startAt: string | null;
	expiredAt: string | null;
	nextBillingAt: string | null;
	cancelledAt: string | null;
	pausedAt: string | null;
	lastPaymentAt: string | null;
	failedPayments: number;
	links?: SubscriptionLink[] | null;
	source: SubscriptionSource;
	subscriber: SubscriptionProviderInfo;
}

export class Subscription implements Readonly<
	Omit<
		SubscriptionOutputInformation,
		'startAt' | 'expiredAt' | 'nextBillingAt' | 'cancelledAt' | 'pausedAt' | 'lastPaymentAt'
	>
> {
	id!: string;
	planId!: string;
	active!: boolean;
	status!: SubscriptionStatus;
	failedPayments!: number;
	links?: SubscriptionLink[] | null;
	source!: SubscriptionSource;
	subscriber!: SubscriptionProviderInfo;
	startAt: Date | null;
	expiredAt: Date | null;
	nextBillingAt: Date | null;
	cancelledAt: Date | null;
	pausedAt: Date | null;
	lastPaymentAt: Date | null;

	constructor(data: SubscriptionOutputInformation) {
		const { startAt, expiredAt, nextBillingAt, cancelledAt, pausedAt, lastPaymentAt, ...rest } = data;
		Object.assign(this, rest);
		this.startAt = startAt ? new Date(startAt) : null;
		this.expiredAt = expiredAt ? new Date(expiredAt) : null;
		this.nextBillingAt = nextBillingAt ? new Date(nextBillingAt) : null;
		this.cancelledAt = cancelledAt ? new Date(cancelledAt) : null;
		this.pausedAt = pausedAt ? new Date(pausedAt) : null;
		this.lastPaymentAt = lastPaymentAt ? new Date(lastPaymentAt) : null;
	}
}

export interface SubscriptionLink {
	type: string;
	url: string;
	method: string;
}

export interface SubscriptionProviderInfo {
	code?: string;
	email?: string;
	provider?: string;
	payerId?: string;
}

export interface ActivateCodeRequest {
	code: string;
}

export interface CreatePayPalSubscriptionRequest {
	redirectURI: string;
	cancelURI: string;
}

export type SubscriptionRedirectResponse<T extends 'withInfo' | 'normal' = 'normal'> = {
	url: string;
} & (T extends 'withInfo' ? { subscription: Subscription } : object);

export interface UpdatePayPalSubscriptionRequest {
	planId: string;
	redirectURI: string;
	cancelURI: string;
}

// ============================================================================
// Media DTOs
// ============================================================================

export interface SimpleMedia {
	title: string;
	tmdbId: number;
	type: 'movie' | 'series';
}

// ============================================================================
// Activity & Bookmark DTOs
// ============================================================================

export interface CreateMovieActivityParams {
	profileId: string;
	seconds?: number;
}

export interface CreateSeriesActivityParams {
	profileId: string;
	season?: number;
	episode?: number;
	seconds?: number;
}

export interface CreateBookmarkParams {
	profileId: string;
}

// ============================================================================
// Legacy/Compatibility Types
// ============================================================================

export type LoginPayload = LoginRequest;
export type RegisterPayload = RegisterRequest;

export interface DevicePayload {
	name: string;
	type: string;
	country: string;
	countryCode: string;
	city: string;
	loggedAt: Date | null;
}

export type PaymentSource = {
	enabled: boolean;
	source: SubscriptionSource;
	img: string;
	width: number | 'auto' | `${number}%`;
	height: number | 'auto' | `${number}%`;
	ratio: number | 'auto';
	type: 'link-approval' | 'direct';
};
