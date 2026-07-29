// External imports
import { Tabs, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';

// Internal imports
import { Colors } from '../../constants';
import { useAppUI } from '../../contexts/AppRootContext';

// Components
import TabIcon from '../../components/interactables/TabIcon';
import AppHeader from '../../components/nav/AppHeader';
import AppTabBar from '../../components/nav/AppTabBar';

const TabsLayout = () => {
	const { t } = useTranslation();
	const segments = useSegments();
	const { tabBarVisible } = useAppUI();
	const hideTab = segments[segments.length - 1]?.includes('[id]') || segments[segments.length - 1]?.includes('bunny');

	return (
		<Tabs
			initialRouteName={'movies/index'}
			backBehavior={'history'}
			tabBar={(props) => !hideTab && tabBarVisible && <AppTabBar {...props} />}
			detachInactiveScreens={true}
			screenOptions={{
				// Animation configs
				lazy: true,
				// TV: skip the scene transition entirely. 'shift' keeps both the outgoing and
				// incoming screens mounted and animates them together on every tab switch, which
				// is the main source of tab-switch jank on Android TV. Snappy/instant is the
				// preferred TV UX anyway; keep 'shift' on web/mobile.
				animation: 'shift',
				tabBarHideOnKeyboard: true,
				freezeOnBlur: true,

				// TabBar options
				headerShown: true,
				headerTransparent: true,
				tabBarShowLabel: true,
				tabBarActiveTintColor: Colors.primary['500'],
				tabBarInactiveTintColor: Colors.zinc['400'],

				// TabBar styles
				headerStyle: { position: 'absolute', top: 0 },
				sceneStyle: { backgroundColor: 'black' },
				header: () => <AppHeader />,
			}}
		>
			<Tabs.Screen
				name="movies/index"
				options={{
					tabBarShowLabel: false,
					tabBarIcon: (props) => TabIcon({ icon: 'video_square', name: t('movies'), ...props }),
				}}
			/>

			<Tabs.Screen
				name="movies/[id]"
				options={{
					headerShown: false,
					animation: 'none',
				}}
			/>

			<Tabs.Screen
				name="movies/play/bunny"
				options={{
					headerShown: false,
					animation: 'none',
				}}
			/>

			<Tabs.Screen
				name="series/index"
				options={{
					tabBarShowLabel: false,
					tabBarIcon: (props) => TabIcon({ icon: 'video_play', name: t('series'), ...props }),
				}}
			/>

			<Tabs.Screen
				name="series/[id]"
				options={{
					headerShown: false,
					animation: 'none',
				}}
			/>

			<Tabs.Screen
				name="series/play/bunny"
				options={{
					headerShown: false,
					animation: 'none',
				}}
			/>

			<Tabs.Screen
				name="channels/index"
				options={{
					tabBarShowLabel: false,
					tabBarIcon: (props) => TabIcon({ icon: 'tv2', name: t('channels'), ...props }),
				}}
			/>

			<Tabs.Screen
				name="channels/play/bunny"
				options={{
					headerShown: false,
					animation: 'none',
				}}
			/>

			<Tabs.Screen
				name="search"
				options={{
					tabBarShowLabel: false,
					tabBarIcon: (props) => TabIcon({ icon: 'search', name: t('search'), ...props }),
				}}
			/>

			<Tabs.Screen
				name="watchlist"
				options={{
					tabBarShowLabel: false,
					tabBarIcon: (props) => TabIcon({ icon: 'heart_search', name: t('favorites'), ...props }),
				}}
			/>
		</Tabs>
	);
};

export default TabsLayout;
