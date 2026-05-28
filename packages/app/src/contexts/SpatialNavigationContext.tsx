// External imports
import React, { useLayoutEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { BaseRemoteControl, SpatialNavigation, SpatialNavigationDeviceTypeProvider } from 'react-native-cross-elements';

// Internal imports
import { MapSupportedKeys, RemoteControlManager as WebRemoteControlManager } from '../controllers/remote-controls';
import logger from '../utils/logger';


export const SpatialNavigationProvider = ({ children }: { children: React.ReactNode }) => {
	const targetedControlManager = useRef<BaseRemoteControl<any>>(null);

	// Initialize Spatial Navigation
	useLayoutEffect(() => {
		if (Platform.OS == 'web') {
			logger.info('[SpatialNavigationProvider] Initializing web remote control manager');
			targetedControlManager.current = new WebRemoteControlManager();

			// Configure remote control for spatial navigation
			SpatialNavigation.configureRemoteControl({
				mappedDirection: MapSupportedKeys,
				remoteControlSubscriber: (lrudCallback) => {
					return targetedControlManager.current?.addKeydownListener(lrudCallback);
				},
				remoteControlUnsubscriber: (remoteControlListener) => {
					targetedControlManager.current?.removeKeydownListener(remoteControlListener);
				},
			});
		}
	}, []);

	return <SpatialNavigationDeviceTypeProvider>{children}</SpatialNavigationDeviceTypeProvider>;
};
