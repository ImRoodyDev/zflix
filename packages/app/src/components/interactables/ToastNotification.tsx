// External imports
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { ToastShowParams } from 'toastify-react-native/utils/interfaces';

// Internal imports
import Colors from '../../constants/colors';
import Icons from '../../constants/icons';
import ShadowStyles from '../../styles/shadow.style';


function ToastNotification(props: ToastShowParams) {
	const { t } = useTranslation();

	function sanitizeText(text: string | undefined): string {
		if (!text || text.length > 200 || /<\/?[a-z][\s\S]*>/i.test(text)) {
			return t('anErrorOccurred');
		}
		return text;
	}

	const iconElement = () => {
		const defaultStyles = {
			className: 'toast-notification-icon',
		};

		switch (props.type) {
			case 'error':
				return Icons.error({ ...defaultStyles, color: Colors.red[500] });
			case 'success':
				return Icons.success({ ...defaultStyles, color: Colors.green[500] });
			case 'info':
				return Icons.info({ ...defaultStyles, color: Colors.stone[500] });
			case 'warn':
				return Icons.warning({ ...defaultStyles, color: Colors.amber[300] });
		}
	};

	return (
		<View className="toast-notification-ptn responsive-vars" style={ShadowStyles.shadowLight1}>
			{iconElement()}
			<Text className="toast-notification-txt">{sanitizeText(props.text1)}</Text>
		</View>
	);
}

export default ToastNotification;
