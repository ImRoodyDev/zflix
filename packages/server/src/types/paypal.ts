/*#region PayPal Subscription Types */
export type PaypalStatus = 'ACTIVE' | 'APPROVED' | 'CREATED' | 'APPROVAL_PENDING' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';

export interface PaypalMoney {
	currency_code?: string;
	value?: string;
}

export interface PaypalPayment {
	amount?: PaypalMoney;
	time?: string;
}

export interface PaypalLink {
	href: string;
	rel: string;
	method?: string;
}

export interface PaypalName {
	given_name?: string;
	surname?: string;
	full_name?: string;
}

export interface PaypalPhone {
	phone_type?: 'FAX' | 'HOME' | 'MOBILE' | 'OTHER' | 'PAGER';
	phone_number?: {
		national_number?: string;
	};
}

export interface PaypalAddress {
	address_line_1?: string;
	address_line_2?: string;
	admin_area_1?: string;
	admin_area_2?: string;
	postal_code?: string;
	country_code?: string;
}

export interface PaypalShippingAddress {
	name?: PaypalName;
	address?: PaypalAddress;
}

export interface PaypalCycleExecution {
	tenure_type: 'TRIAL' | 'REGULAR';
	sequence: number;
	cycles_completed: number;
	cycles_remaining?: number;
	current_pricing_scheme_version?: number;
	total_cycles?: number;
}

export interface PaypalBillingInfo {
	next_billing_time?: string;
	final_payment_time?: string;
	last_payment?: PaypalPayment;
	outstanding_balance?: PaypalMoney;
	failed_payments_count?: number;
	cycle_executions?: PaypalCycleExecution[];
}

export interface PaypalSubscriber {
	email_address?: string;
	payer_id?: string;
	name?: PaypalName;
	phone?: PaypalPhone;
	shipping_address?: PaypalShippingAddress;
}

export interface PaypalSubscription {
	id: string;
	status: PaypalStatus;
	status_update_time?: string;
	status_change_note?: string;
	plan_id: string;
	plan_overridden?: boolean;
	custom_id?: string;
	quantity?: string;
	start_time: string;
	create_time?: string;
	update_time?: string;
	shipping_amount?: PaypalMoney;
	billing_info?: PaypalBillingInfo;
	subscriber?: PaypalSubscriber;
	links?: PaypalLink[];
}

/**
 * PayPal subscription revise request payload
 */
export interface PaypalSubscriptionRevisePayload {
	plan_id?: string;
	quantity?: string;
	shipping_amount?: PaypalMoney;
	shipping_address?: PaypalShippingAddress;
	application_context?: {
		brand_name?: string;
		locale?: string;
		shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
		user_action?: 'CONTINUE' | 'SUBSCRIBE_NOW';
		return_url?: string;
		cancel_url?: string;
		payment_method?: {
			payer_selected?: 'PAYPAL';
			payee_preferred?: 'UNRESTRICTED' | 'IMMEDIATE_PAYMENT_REQUIRED';
		};
	};
	plan?: {
		billing_cycles?: PaypalBillingCycle[];
		payment_preferences?: PaypalPaymentPreferences;
		taxes?: PaypalTaxes;
	};
}

/**
 * PayPal subscription transaction
 */
export interface PaypalSubscriptionTransaction {
	id: string;
	status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'PENDING';
	payer_email?: string;
	payer_name?: PaypalName;
	amount_with_breakdown: {
		gross_amount: PaypalMoney;
		fee_amount?: PaypalMoney;
		net_amount?: PaypalMoney;
		total_item_amount?: PaypalMoney;
		shipping_amount?: PaypalMoney;
		tax_amount?: PaypalMoney;
	};
	time: string;
}

/*#endregion */

/*#region PayPal Plan & Product Types */
export interface PaypalProductPayload {
	// Product creation payload
	name: string;
	description?: string;
	type?: 'SERVICE' | 'PHYSICAL' | 'DIGITAL';
	category?: string; // SOFTWARE etc.
	image_url?: string;
}

/**
 * Plan status enumeration
 * - CREATED: Plan exists but subscriptions cannot be created yet
 * - INACTIVE: Plan is disabled
 * - ACTIVE: Plan is active and ready for subscriptions
 */
type PaypalPlanStatus = 'CREATED' | 'INACTIVE' | 'ACTIVE';

/**
 * Billing cycle interval units
 */
type PaypalIntervalUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

/**
 * Billing cycle tenure types
 * - TRIAL: Trial period (max 2 per plan)
 * - REGULAR: Regular billing period (max 1 per plan)
 */
type PaypalTenureType = 'TRIAL' | 'REGULAR';

/**
 * Pricing models for billing cycles
 * - VOLUME: Volume-based pricing with tiers
 * - TIERED: Graduated pricing tiers
 */
type PaypalPricingModel = 'VOLUME' | 'TIERED';

/**
 * Action to take when setup fee payment fails
 * - CONTINUE: Continue subscription creation despite failure
 * - CANCEL: Cancel subscription if setup fee fails
 */
type PaypalSetupFeeFailureAction = 'CONTINUE' | 'CANCEL';

/**
 * Frequency configuration for billing cycles
 */
interface PaypalFrequency {
	/** The interval unit (DAY, WEEK, MONTH, YEAR) */
	interval_unit: PaypalIntervalUnit;

	/** Number of intervals between charges (1-365, default: 1) */
	interval_count?: number;
}

/**
 * Pricing tier for volume/tiered pricing models
 */
interface PaypalPricingTier {
	/** Starting quantity for this tier (inclusive) */
	starting_quantity: string;

	/** Ending quantity for this tier (inclusive, omit for last tier) */
	ending_quantity?: string;

	/** Price for this tier */
	amount: PaypalMoney;
}

/**
 * Pricing scheme for a billing cycle
 * Can be either fixed price or tier-based pricing
 */
interface PaypalPricingScheme {
	/** Fixed price for the billing cycle (for simple plans) */
	fixed_price?: PaypalMoney;

	/** Pricing model (VOLUME or TIERED) when using tier-based pricing */
	pricing_model?: PaypalPricingModel;

	/** Array of pricing tiers (for volume/tiered pricing) */
	tiers?: PaypalPricingTier[];

	/** Version number of the pricing scheme (response only) */
	version?: number;

	/** Creation timestamp (response only) */
	create_time?: string;

	/** Last update timestamp (response only) */
	update_time?: string;
}

/**
 * Billing cycle configuration
 * Defines the frequency, pricing, and duration of a billing period
 */
interface PaypalBillingCycle {
	/** How often the billing cycle runs */
	frequency: PaypalFrequency;

	/** Type of cycle: TRIAL or REGULAR */
	tenure_type: PaypalTenureType;

	/** Execution order (1-99) - lower numbers execute first */
	sequence: number;

	/**
	 * Number of times this cycle executes
	 * - 0: infinite (REGULAR cycles only)
	 * - 1-999: finite number of cycles
	 * Default: 1
	 */
	total_cycles?: number;

	/** Pricing configuration for this cycle (not required for free trials) */
	pricing_scheme?: PaypalPricingScheme;
}

/**
 * Payment preferences for the subscription plan
 * Controls setup fees, auto-billing, and failure handling
 */
interface PaypalPaymentPreferences {
	/**
	 * Automatically bill outstanding balance on next cycle
	 * Default: true
	 */
	auto_bill_outstanding?: boolean;

	/** One-time setup fee charged at subscription creation */
	setup_fee?: PaypalMoney;

	/** Action to take if setup fee payment fails */
	setup_fee_failure_action?: PaypalSetupFeeFailureAction;

	/**
	 * Number of payment failures before subscription is suspended
	 * Range: 0-3, Default: 0
	 */
	payment_failure_threshold?: number;
}

/**
 * Tax configuration for the plan
 */
interface PaypalTaxes {
	/** Tax percentage as a string (e.g., "10" for 10%) */
	percentage: string;

	/**
	 * Whether tax is included in the pricing
	 * - true: Tax is included in the price
	 * - false: Tax is added on top of the price
	 * Default: false
	 */
	inclusive?: boolean;
}

/**
 * Payload for creating a PayPal billing plan
 * Plans define pricing and billing cycle details for subscriptions
 *
 * Constraints:
 * - Maximum 2 TRIAL billing cycles
 * - Maximum 1 REGULAR billing cycle
 * - At least 1 billing cycle required
 */
export interface PaypalPlanPayload {
	/** Product ID from PayPal Catalog Products API (required) */
	product_id: string;

	/** Display name for the plan (required) */
	name: string;

	/**
	 * Initial plan status
	 * - CREATED: Plan created but not yet active for subscriptions
	 * - ACTIVE: Ready for subscriptions immediately
	 * Default: ACTIVE
	 */
	status?: PaypalPlanStatus;

	/** Detailed description of the plan */
	description?: string;

	/**
	 * Array of billing cycles (required)
	 * Must contain 1-3 cycles (max 2 TRIAL + 1 REGULAR)
	 */
	billing_cycles: PaypalBillingCycle[];

	/** Payment and setup fee configuration */
	payment_preferences?: PaypalPaymentPreferences;

	/** Tax settings for the plan */
	taxes?: PaypalTaxes;

	/**
	 * Whether subscribers can specify quantity when subscribing
	 * Useful for seat-based or volume-based subscriptions
	 */
	quantity_supported?: boolean;
}

/*#endregion */

/**
 * PayPal subscription transactions list response
 */
export interface PaypalSubscriptionTransactionsResponse {
	transactions: PaypalSubscriptionTransaction[];
	total_items?: number;
	total_pages?: number;
	links?: PaypalLink[];
}

/**
 * Response from PayPal when verifying a webhook signature
 */
export interface PaypalVerifyWebhookSignatureResponse {
	verification_status: 'SUCCESS' | 'FAILURE';
}

/**
 * Response from PayPal when requesting an access token
 */
export interface PayPalAccessTokenResponse {
	scope: string;
	access_token: string;
	token_type: string;
	app_id: string;
	expires_in: number;
	nonce: string;
}

/**
 * PayPal Product response
 */
export interface PaypalProductResponse {
	id: string;
	name: string;
	description?: string;
	type: string;
	category?: string;
	image_url?: string;
	home_url?: string;
	create_time?: string;
	update_time?: string;
	links?: PaypalLink[];
}

/**
 * Response from PayPal after creating a billing plan
 * Includes all plan details plus PayPal-generated metadata
 */
export interface PaypalPlanResponse extends PaypalPlanPayload {
	/** PayPal-generated unique plan ID */
	id: string;

	/** Plan creation timestamp (ISO 8601 format) */
	create_time?: string;

	/** Last update timestamp (ISO 8601 format) */
	update_time?: string;

	/** HATEOAS links for plan operations (get, update, activate, deactivate) */
	links?: PaypalLink[];
}

/**
 * PayPal subscription revise response
 */
export interface PaypalSubscriptionReviseResponse {
	plan_id: string;
	plan_overridden?: boolean;
	quantity?: string;
	shipping_amount?: PaypalMoney;
	shipping_address?: PaypalShippingAddress;
	links?: PaypalLink[];
}

/*#region PayPal Orders API Types (one-time payments) */

/** PayPal Order status */
export type PaypalOrderStatus = 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';

/** PayPal Order response (v2 Orders API) */
export interface PaypalOrderResponse {
	id: string;
	status: PaypalOrderStatus;
	payment_source?: {
		paypal?: {
			email_address?: string;
			account_id?: string;
		};
	};
	purchase_units?: Array<{
		reference_id?: string;
		custom_id?: string;
		amount?: PaypalMoney;
		payments?: {
			captures?: Array<{
				id: string;
				status: string;
				amount: PaypalMoney;
				create_time?: string;
			}>;
		};
	}>;
	links?: PaypalLink[];
}

/*#endregion */

export interface PaypalApplicationContext {
	user: { id: string; accountHolder: string; email: string };
	locale: string;
	return_url: string;
	cancel_url: string;
}

export interface PaypalReviseContext {
	// Revise subscription redirect urls
	return_url: string;
	cancel_url: string;
}

export interface PaypalPlanInfo {
	id: string;
	public_id: string;
}

export interface PaypalSubscriptionTransactionWindow {
	// Time window for subscription transactions
	id: string;
	start_time: string;
	status_update_time: string;
}
