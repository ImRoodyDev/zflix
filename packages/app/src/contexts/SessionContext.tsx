// External imports
import React from 'react';
import { Platform } from 'react-native';


type SessionValue = unknown;

type SessionContextType = {
	getSessionValue: <T = SessionValue>(key: string) => T | undefined;
	setSessionValue: (key: string, value: SessionValue) => void;
	removeSessionValue: (key: string) => void;
};

const SessionContext = React.createContext<SessionContextType | undefined>(undefined);

const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const memoryStorage = React.useRef(new Map<string, SessionValue>());
	const isWebSessionStorageAvailable =
		Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

	const getSessionValue = React.useCallback(
		<T = SessionValue,>(key: string): T | undefined => {
			if (isWebSessionStorageAvailable) {
				const storedValue = window.sessionStorage.getItem(key);

				if (storedValue == null) return undefined;

				try {
					return JSON.parse(storedValue) as T;
				} catch {
					return storedValue as T;
				}
			}

			return memoryStorage.current.get(key) as T | undefined;
		},
		[isWebSessionStorageAvailable],
	);

	const setSessionValue = React.useCallback(
		(key: string, value: SessionValue) => {
			if (isWebSessionStorageAvailable) {
				if (typeof value === 'undefined') {
					window.sessionStorage.removeItem(key);
					return;
				}

				window.sessionStorage.setItem(key, JSON.stringify(value));
				return;
			}

			memoryStorage.current.set(key, value);
		},
		[isWebSessionStorageAvailable],
	);

	const removeSessionValue = React.useCallback(
		(key: string) => {
			if (isWebSessionStorageAvailable) {
				window.sessionStorage.removeItem(key);
				return;
			}

			memoryStorage.current.delete(key);
		},
		[isWebSessionStorageAvailable],
	);

	const contextValue = React.useMemo(
		() => ({ getSessionValue, setSessionValue, removeSessionValue }),
		[getSessionValue, setSessionValue, removeSessionValue],
	);

	return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
};

const useSessionContext = () => {
	const context = React.useContext(SessionContext);
	if (!context) {
		throw new Error('useSessionContext must be used within a SessionProvider');
	}
	return context;
};

export { SessionProvider, useSessionContext };
