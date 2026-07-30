// External imports
import { Stack } from 'expo-router';
import Head from 'expo-router/head';

// Internal imports
import RouteErrorBoundary from '../components/main/RouteErrorBoundary';
import { RootContext } from '../contexts/RootProvider';
import { useTheme } from '../contexts/ThemeContext';
import { defaultModalStack, defaultStack } from '../styles/stack.style';

const RootLayout = () => {
	const { themeScheme } = useTheme();
	const themeColor = themeScheme == 'dark' ? '#000000' : '#ffffff';

	return (
		<RootContext>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, shrink-to-fit=no" />{' '}
				<meta name="theme-color" content={themeColor} />
				<meta name="color-scheme" content="dark light" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				{/* <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /> */}
			</Head>
			<Stack screenOptions={{ headerShown: false, freezeOnBlur: true }}>
				<Stack.Screen name="index" options={defaultStack} />
				<Stack.Screen name="(auth)" options={defaultModalStack} />
				<Stack.Screen name="(others)" options={defaultModalStack} />
				<Stack.Screen name="(user)" options={defaultStack} />
				<Stack.Screen name="(profile)" options={defaultStack} />
				<Stack.Screen name="(tabs)" options={{ ...defaultStack, gestureEnabled: false }} />
				<Stack.Screen name="(plan)" options={defaultStack} />
				<Stack.Screen name="redirect" options={defaultStack} />
			</Stack>
		</RootContext>
	);
};

export const ErrorBoundary = RouteErrorBoundary;

export default RootLayout;
