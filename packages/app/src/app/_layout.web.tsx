// External imports
import { Stack } from 'expo-router';
import Head from 'expo-router/head';

// Internal imports
import { RootContext } from '../contexts/AppRootContext';
import { useTheme } from '../contexts/ThemeContext';
import { defaultModalStack, defaultStack } from '../styles/stack.style';

const RootLayout = () => {
	const { themeScheme } = useTheme();
	const themeColor = themeScheme == 'dark' ? '#000000' : '#ffffff';

	return (
		<RootContext>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
				<meta name="theme-color" content={themeColor} />
				<meta name="color-scheme" content="dark light" />
			</Head>
			<Stack screenOptions={{ headerShown: false, freezeOnBlur: true }}>
				<Stack.Screen name="index" options={defaultStack} />
				<Stack.Screen name="(auth)" options={defaultModalStack} />
				<Stack.Screen name="(others)" options={defaultModalStack} />
				<Stack.Screen name="(user)" options={defaultStack} />
				<Stack.Screen name="(profile)" options={defaultStack} />
				<Stack.Screen name="(tabs)" options={{ ...defaultStack, gestureEnabled: false }} />
				<Stack.Screen name="(plan)" options={defaultStack} />
			</Stack>
		</RootContext>
	);
};

export default RootLayout;
