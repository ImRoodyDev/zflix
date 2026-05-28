// External imports
import { Platform } from 'react-native';
// @ts-ignore
import { DrawerProps } from 'react-native-drawer-layout/lib/typescript/src/types';

// Initialize the application drawer options
export const defaultDrawerOption: DrawerProps = {
	drawerStyle: {
		width: '100%',
		maxWidth: '100%',
		height: '100%',
		flexDirection: 'row',
		justifyContent: 'flex-end',
		pointerEvents: Platform.OS == 'web' ? 'none' : 'box-none',
		backgroundColor: 'transparent',
	},
	headerShown: false,
	swipeEnabled: true,
	drawerType: 'front',
	drawerPosition: 'right',
	// This is for web to prevent horizontal scroll when app is wrapped with drawer in a browser with body scrolling on
	// style: {
	// 	overflowX: 'clip',
	// },
};
