export type Models = {
	Avatar: typeof import('@core/models/avatar').default;
	AccessCode: typeof import('@core/models/access-code').default;
	Activity: typeof import('@core/models/activity').default;
	Billing: typeof import('@core/models/billing').default;
	Profile: typeof import('@core/models/profile').default;
	Subscription: typeof import('@core/models/subscription').default;
	User: typeof import('@core/models/user').default;
	Plan: typeof import('@core/models/plan').default;
	Country: typeof import('@core/models/country').default;
	Certification: typeof import('@core/models/certification').default;
	Language: typeof import('@core/models/language').default;
	PlanCountry: typeof import('@core/models/plan-country').default;
	Bookmark: typeof import('@core/models/bookmark').default;
	Device: typeof import('@core/models/device').default;
	Reset: typeof import('@core/models/reset').default;
	AppConfiguration: typeof import('@core/models/app-configuration').default;
};
