import { CertificationRank } from '@core/constants/tmdb';

export interface LoginPayload {
	email: string;
	password: string;
}

export interface RegisterPayload {
	fullName: string;
	email: string;
	password: string;
}

export interface AccountUpdatePayload {
	fullName: string;
	newPassword?: string;
}

export interface ProfilePayload {
	profileName: string;
	avatarId: string;
	languageCode: string;
	certificationId: CertificationRank;
	autoPlay: boolean;
	defaultSubtitle: boolean;
}

export interface DevicePayload {
	name: string;
	type: string;
	country: string;
	countryCode: string;
	city: string;
	loggedAt: Date | null;
}

export interface AdminAccountCreationPayload {
	fullName: string;
	email: string;
	password: string;
	countryCode: string;
}

export interface AdminPlanCreationPayload {
	id?: string;
	public_id: string;
	price: number;
	currency: string;
	maxScreen: number;
	countryCode: string;
	tier: number;
	index?: number;
	maxPaymentFailure?: number;
	stripePriceId?: string;
	names: Record<string, string>;
	descriptions: Record<string, string[]>;
	autoRenewal: boolean;
}

export interface AdminPlanUpdatePayload {
	public_id?: string;
	price?: number;
	currency?: string;
	maxScreen?: number;
	countryCode?: string;
	tier?: number;
	index?: number;
	maxPaymentFailure?: number;
	stripePriceId?: string | null;
	names?: Record<string, string>;
	descriptions?: Record<string, string[]>;
	autoRenewal?: boolean;
	isActive?: boolean;
}

export interface AdminCountryCreationPayload {
	code: string;
	name: string;
	allowed: boolean;
}

export interface AdminCountryUpdatePayload {
	name?: string;
	allowed?: boolean;
}
