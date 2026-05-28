export type RegisterConcurrentScreenParams = {
	userId: string;
	subscriptionId: string;
	sessionToken: string;
	routePath?: string;
};

export type RegisterConcurrentScreenResult = {
	allowed: boolean;
	alreadyRegistered: boolean;
	activeScreens: number;
	maxScreens: number;
	sessionLabel: string;
	reason?: 'MAX_SCREEN_LIMIT_REACHED';
};

export type ConcurrentScreenSummary = {
	totalAccounts: number;
	totalSessions: number;
	sessionTtlHours: number;
	updatedAt: number;
};

export type ConcurrentScreenRow = {
	userId: string;
	subscriptionId: string;
	activeScreens: number;
	maxScreens: number;
	sessionLabel: string;
	startedAt: number;
	lastSeenAt: number;
	expiresAt: number;
	routePath: string;
};

export type ConcurrentScreenPage = {
	items: ConcurrentScreenRow[];
	pagination: {
		currentPage: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
	summary: ConcurrentScreenSummary;
};

export type ConcurrentScreensWebhookPayload = {
	summary: ConcurrentScreenSummary;
	timestamp: number;
};
