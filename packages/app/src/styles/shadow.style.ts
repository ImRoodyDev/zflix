// External imports
import {Platform, StyleSheet} from 'react-native';


const styles = StyleSheet.create({
	topShadow: {
		position: 'absolute',
		top: '-8%',
		flex: 1,
		height: '100%',
		left: 0,
		right: 0,
		pointerEvents: 'none',
	},
	bottomShadow: {
		position: 'absolute',
		bottom: 0,
		flex: 1,
		height: '100%',
		left: 0,
		right: 0,
		pointerEvents: 'none',
	},

	shadowLight1: {
		boxShadow: '0 0 3.84px 0 rgba(0, 0, 0, 0.25)',
		elevation: 5,
	},

	shadowLight2: {
		// boxShadow: '0 0 4.65px 0 rgba(0, 0, 0, 0.3)',
		boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.3)',
		elevation: 8,
	},
	shadowLight3: {
		boxShadow: Platform.OS === 'web'
			? '0 0 18px 0 rgba(0, 0, 0, 0.20)'
			: '0 0 14px 0 rgba(0, 0, 0, 0.14)',
		elevation: 3,
	},

	shadowDark1: {
		boxShadow: '0 0 3.84px 0 black',
		elevation: 5,
	},
	shadowDark2: {
		boxShadow: '0 0 4.65px 0 black',
		elevation: 8,
	},
	shadowDark3: {
		boxShadow: Platform.OS === 'web'
			? '0 0 22px 0 black'
			: '0 0 14px 0 black',
		elevation: 3,
	}
});

export default styles;
