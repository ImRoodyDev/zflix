// External imports
import React from 'react';
import {ToastManagerProps} from 'toastify-react-native/utils/interfaces';

// Components
import ToastNotification from '../components/interactables/ToastNotification';


const ToastConfig: ToastManagerProps = {
	useModal: false,
	position: 'bottom',
	animationStyle: 'slide',
	duration: 2500,

	style: {},

	config: {
		info: (props: any) => React.createElement(ToastNotification, props),
		default: (props: any) => React.createElement(ToastNotification, props),

		success: (props: any) => React.createElement(ToastNotification, props),
		error: (props: any) => React.createElement(ToastNotification, props),
		warn: (props: any) => React.createElement(ToastNotification, props),
	},
};

export default ToastConfig;
