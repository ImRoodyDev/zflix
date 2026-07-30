// Internal imports
import { HttpSuccess } from '../types/HttpSuccess';
import type {
	AccountUpdatePayload,
	ProfileOutputInformation,
	ProfilePayload,
	ResetPasswordWithTokenRequest,
	UserOutputInformation,
} from '../types/ServerOutputs';
import { Profile } from '../types/User';
import { fetchResponse } from '../utils/fetcher';

/** Get current user info */
export async function getUserInfo(): Promise<HttpSuccess<UserOutputInformation>> {
	return fetchResponse<HttpSuccess<UserOutputInformation>>('/v1/api/auth/user-info');
}

/** Get profile info */
export async function getProfileInfo(profileId: string): Promise<HttpSuccess<ProfileOutputInformation>> {
	return fetchResponse<HttpSuccess<ProfileOutputInformation>>(`/v1/api/auth/profile-info/${profileId}`, {
		method: 'GET',
	});
}

/** Updates the user's account information */
export async function updateUserInfo(body: AccountUpdatePayload): Promise<HttpSuccess> {
	return fetchResponse<HttpSuccess>('/v1/api/auth/user-update', {
		method: 'POST',
		body: JSON.stringify(body),
	});
}

/** Update user password.*/
export async function updatePassword(body: ResetPasswordWithTokenRequest): Promise<HttpSuccess> {
	return fetchResponse<HttpSuccess>(`/v1/api/auth/reset/${body.resetId}`, {
		method: 'POST',
		body: JSON.stringify({ token: body.token, password: body.password }),
	});
}

/** Creates a new user profile */
export async function createProfile(profile: ProfilePayload): Promise<HttpSuccess<ProfileOutputInformation>> {
	const response = await fetchResponse<HttpSuccess<ProfileOutputInformation>>('/v1/api/personalized/profiles/add', {
		method: 'POST',
		body: JSON.stringify(profile),
	});

	// Update application state if profile is returned
	if (window.application.auth && response.data) {
		window.application.auth.user?.profiles.push(new Profile(response.data));
	}

	return response;
}

/** Updates a profile */
export async function updateProfile(
	profileId: string,
	profile: ProfilePayload,
): Promise<HttpSuccess<ProfileOutputInformation>> {
	const response = await fetchResponse<HttpSuccess<ProfileOutputInformation>>(
		`/v1/api/personalized/profiles/update/${profileId}`,
		{
			method: 'POST',
			body: JSON.stringify(profile),
		},
	);

	// Find profile in user's profiles
	const profileIndex = window.application.auth.user?.profiles.findIndex((p) => p.id === profileId);
	if (profileIndex !== undefined) {
		window.application.auth.user?.profiles[profileIndex].update(profile);
	}

	return response;
}

/** Removes a profile from the user's account */
export async function removeProfile(profileId: string) {
	return fetchResponse<HttpSuccess>(`/v1/api/personalized/profiles/remove/${profileId}`, {
		method: 'GET',
	});
}

/** Create movie activity */
export async function createHistory(type: 'movies', mediaId: string, seconds: number): Promise<void>;
/** Create series activity */
export async function createHistory(
	type: 'series',
	mediaId: string,
	seconds: number,
	season: number,
	episode: number,
): Promise<void>;
export async function createHistory(
	type: 'movies' | 'series',
	mediaId: string,
	seconds: number,
	season?: number,
	episode?: number,
): Promise<void> {
	const currentProfile = window.application.currentProfile;
	if (!currentProfile) return;

	// Update local state
	if (type === 'movies') {
		currentProfile.updateActivities(mediaId, seconds);
	} else if (type === 'series' && season !== undefined && episode !== undefined) {
		currentProfile.updateActivities(mediaId, `${season}x${episode}`, seconds);
	}

	// Construct query parameters
	const params = new URLSearchParams({
		profileId: currentProfile.id,
		seconds: seconds.toString(),
		...(season !== undefined &&
			episode !== undefined && {
				season: season.toString(),
				episode: episode.toString(),
			}),
	});

	// Make API request
	const endpoint =
		type === 'movies'
			? `/v1/api/personalized/activities/movie/${mediaId}`
			: `/v1/api/personalized/activities/serie/${mediaId}`;

	await fetchResponse<HttpSuccess>(`${endpoint}?${params.toString()}`, {
		method: 'POST',
	});
}

/** Adds a media item to the user's bookmarks */
export async function createBookmark(type: 'movies' | 'series' | 'channels', mediaId: string): Promise<boolean> {
	const currentProfile = window.application.currentProfile;
	if (!currentProfile) return false;

	try {
		const params = new URLSearchParams({ profileId: currentProfile.id });
		await fetchResponse<HttpSuccess>(`/v1/api/personalized/bookmarks/add/${type}/${mediaId}?${params.toString()}`, {
			method: 'POST',
		});

		currentProfile.addBookmark(type, mediaId);
		return true;
	} catch {
		return false;
	}
}

/** Removes a media item from the user's bookmarks */
export async function removeBookmark(type: 'movies' | 'series' | 'channels', mediaId: string): Promise<boolean> {
	const currentProfile = window.application.currentProfile;
	if (!currentProfile) return false;

	try {
		const params = new URLSearchParams({ profileId: currentProfile.id });
		await fetchResponse<HttpSuccess>(`/v1/api/personalized/bookmarks/remove/${type}/${mediaId}?${params.toString()}`, {
			method: 'POST',
		});

		currentProfile.removeBookmark(type, mediaId);
		return true;
	} catch {
		return false;
	}
}
