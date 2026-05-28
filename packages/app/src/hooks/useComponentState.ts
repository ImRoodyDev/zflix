// External imports
import { useReducer } from 'react';


// Type
export type StateType = 'succeed' | 'error' | 'loading' | 'idle';
export type State = {
	type: StateType;
	message: string | string[];
};
export type Action = {
	type: StateType;
	message?: string | string[];
};

const stateReducer = (state: State, action: Action): State => {
	switch (action.type) {
		case 'succeed':
			return {
				...state,
				type: 'succeed',
				message: action.message || '',
			};
		case 'error':
			return {
				...state,
				type: 'error',
				message: action.message || '',
			};
		case 'loading':
			return {
				...state,
				type: 'loading',
				message: action.message || '',
			};
		case 'idle':
			return {
				...state,
				type: 'idle',
				message: action.message || '',
			};
		default:
			throw new Error(`Unhandled component state type: ${action.type}`);
	}
};

const useComponentStateReducer = (_default?: State) => {
	return useReducer(stateReducer, _default || { type: 'idle', message: '' });
};

export { useComponentStateReducer };
