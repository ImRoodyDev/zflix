// Internal imports
import {
	AccountUpdatePayload,
	ProfileOutputInformation,
	ProfilePayload,
	Subscription,
	UserOutputInformation,
} from './ServerOutputs';

export class User {
	public name: string;
	public email: string;
	public country: string;
	public countryCode: string;
	public profiles: Profile[] = [];
	public subscribed: boolean = false;
	public setupComplete: boolean = false;
	public subscription: Subscription | null = null;
	public tr = 0;

	constructor(props: UserOutputInformation) {
		this.name = props.name;
		this.email = props.email;
		this.country = props.country;
		this.countryCode = props.countryCode;
		this.subscribed = props.subscription;
		this.setupComplete = props.setupFinish;
		this.profiles = props.profiles.map((profile: ProfileOutputInformation) => new Profile(profile));
		this.tr = props.tr;
	}

	public update(props: UserOutputInformation | AccountUpdatePayload) {
		Object.assign(this, props);
	}
}

export class Profile {
	public readonly id: string;
	public profileName: string;
	public avatarId?: string;
	public certificationId: string;
	public languageCode: string;
	public autoPlay: boolean;
	public defaultSubtitle: boolean;
	public readonly primary: boolean;
	private activities: WatchActivity[];
	private bookmarks: Omit<WatchActivity, 'runtimes'>[];

	constructor(props: ProfileOutputInformation) {
		this.id = props.id;
		this.profileName = props.profileName;
		this.avatarId = props.avatarId ?? undefined;
		this.primary = props.primary;
		this.languageCode = props.languageCode;
		this.autoPlay = props.autoPlay;
		this.defaultSubtitle = props.defaultSubtitle;
		this.certificationId = props.certificationId;
		this.activities = props.activities?.map((e: any) => new WatchActivity(e)) || [];
		this.bookmarks = props.bookmarks?.map((e: any) => ({ id: e.id, type: e.type })) || [];
	}

	public getPayload(): ProfilePayload {
		return {
			profileName: this.profileName,
			avatarId: this.avatarId,
			languageCode: this.languageCode,
			certificationId: this.certificationId,
			autoPlay: this.autoPlay,
			defaultSubtitle: this.defaultSubtitle,
		};
	}

	public update(props: ProfileOutputInformation | ProfilePayload) {
		Object.assign(this, props);
	}

	public getRecommendationId(type: 'movies' | 'series'): string | undefined {
		if (this.activities.length === 0) return undefined;
		const filteredActivities = this.activities.filter((activity) => activity.type === type);
		return filteredActivities[0]?.id;
	}

	public isBookmarked(id: string, type: 'movies' | 'series' | 'channels'): boolean {
		// Check if the activity with the given id and type exists in the activities list
		return this.bookmarks.some((activity) => activity.id === id && activity.type === type);
	}

	public addBookmark(type: 'movies' | 'series' | 'channels', id: string) {
		// Add a bookmark to the profile
		this.bookmarks.push({ id, type });
	}

	public removeBookmark(type: 'movies' | 'series' | 'channels', id: string) {
		// Remove a bookmark from the profile
		const targetIndex = this.bookmarks.findIndex((bookmark) => bookmark.id === id && bookmark.type === type);
		if (targetIndex !== -1) {
			this.bookmarks.splice(targetIndex, 1);
		}
	}

	public updateActivities(id: string, runtime: number): void;
	public updateActivities(id: string, epId: `${number}x${number}`, runtime: number): void;
	public updateActivities(id: string, epIdOrRuntime: `${number}x${number}` | number, runtime?: number): void {
		const activityIndex = this.activities.findIndex((activity) => activity.id === id);

		if (typeof epIdOrRuntime == 'number') {
			if (activityIndex < 0) this.activities.push(new WatchActivity({ id, type: 'series', runtimes: epIdOrRuntime }));
			else this.activities[activityIndex].runtimes = epIdOrRuntime;
		} else {
			const epId = epIdOrRuntime as `${number}x${number}`;
			if (runtime === undefined) return;

			if (activityIndex < 0) {
				this.activities.push(new WatchActivity({ id, type: 'series', runtimes: [{ epId, runtime }] }));
			} else {
				const existingActivity = this.activities[activityIndex];
				if (existingActivity.type === 'series' && typeof existingActivity.runtimes !== 'number') {
					const existingRuntime = existingActivity.runtimes.find((e) => e.epId === epId);
					if (existingRuntime) {
						existingRuntime.runtime = runtime;
					} else {
						existingActivity.runtimes.push({ epId, runtime });
					}
				}
			}
		}
	}

	public isWatching(id: string, type: 'movies' | 'series' | 'channels'): boolean {
		// Check if the activity with the given id and type exists in the activities list
		return this.activities.some((activity) => activity.id === id && activity.type === type);
	}

	public getActivity(id: string, type: 'movies' | 'series' | 'channels'): WatchActivity | null {
		// Get the activity with the given id and type from the activities list
		const activity = this.activities.find((activity) => activity.id === id && activity.type === type);
		return activity || null;
	}

	public getMovieRuntime(id: string): number | undefined {
		// Get the runtime of a movie
		const activity = this.getActivity(id, 'movies');
		if (!activity || typeof activity.runtimes !== 'number') return undefined;
		return activity.runtimes;
	}

	public getEpisodeRuntime(id: string, epId: `${number}x${number}`): number | 0 {
		// Get the runtime of a specific episode in a series
		const activity = this.getActivity(id, 'series');
		if (!activity || !Array.isArray(activity.runtimes)) return 0;

		const episodeRuntime = activity.runtimes.find((runtime) => runtime.epId === epId);
		return episodeRuntime ? episodeRuntime.runtime : 0;
	}

	public getLastWatchSeasonEpisode(id: string): { season: number; episode: number } | null {
		// Get the last watched season and episode of a series
		const activity = this.getActivity(id, 'series');
		if (!activity || !Array.isArray(activity.runtimes) || activity.runtimes.length === 0) return null;

		const lastRuntime = activity.runtimes[activity.runtimes.length - 1];
		if (!lastRuntime) return null;

		const [season, episode] = lastRuntime.epId.split('x').map(Number);
		return { season, episode };
	}

	public getActivityCount(type: 'movies' | 'series' | 'channels'): number {
		// Get the count of activities for a specific type
		return this.activities.filter((activity) => activity.type === type).length;
	}

	public getBookmarkCount(type: 'movies' | 'series' | 'channels'): number {
		// Get the count of bookmarks for a specific type
		return this.bookmarks.filter((bookmark) => bookmark.type === type).length;
	}
}

export class WatchActivity {
	public readonly id: string;
	public readonly type: 'movies' | 'series' | 'channels';
	public runtimes: { epId: `${number}x${number}`; runtime: number }[] | number;

	constructor(props: any) {
		this.id = props.id;
		this.type = props.type;

		if (this.type === 'series') this.runtimes = props.runtimes || [];
		else this.runtimes = props.runtimes || 0;
	}
}
