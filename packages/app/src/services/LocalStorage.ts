// External imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Internal imports
import Logger from '../utils/logger';


namespace LocalStorageService {
	export async function getItem<T = any>(key: string): Promise<T | null> {
		try {
			if (Platform.OS === 'web') {
				const item = localStorage.getItem(key);
				if (item) {
					try {
						return JSON.parse(item);
					} catch {
						return item as T;
					}
				}
				return null;
			} else {
				const item = await AsyncStorage.getItem(key);
				if (item) {
					try {
						return JSON.parse(item);
					} catch {
						return item as T;
					}
				}
				return null;
			}
		} catch (error) {
			Logger.error('Error reading from storage:', error);
			return null;
		}
	}

	export async function setItem(key: string, value: any) {
		try {
			if (value === null) {
				if (Platform.OS === 'web') {
					localStorage.removeItem(key);
				} else {
					await AsyncStorage.removeItem(key);
				}
			} else {
				const stringValue = JSON.stringify(value);
				if (Platform.OS === 'web') {
					localStorage.setItem(key, stringValue);
				} else {
					await AsyncStorage.setItem(key, stringValue);
				}
			}
		} catch (error) {
			Logger.error('Error writing to storage:', error);
		}
	}

	export async function removeItem(key: string) {
		try {
			if (Platform.OS === 'web') {
				localStorage.removeItem(key);
			} else {
				await AsyncStorage.removeItem(key);
			}
		} catch (error) {
			Logger.error('Error removing from storage:', error);
		}
	}
}

export { LocalStorageService };
