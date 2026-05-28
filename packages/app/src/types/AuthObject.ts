// Internal imports
import { User } from './User';


export interface AuthObject {
	user?: User;
	loggedIn: boolean;
	accessToken?: string | null;
}

export interface CachedAuthObject {
	loggedIn: boolean;
	accessToken?: string | null;
}
