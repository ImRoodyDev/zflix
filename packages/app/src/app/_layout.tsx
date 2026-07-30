// External imports
import { Stack } from 'expo-router';

// Internal imports
import { RootContext } from '../contexts/RootProvider';
import { defaultModalStack, defaultStack } from '../styles/stack.style';
import RouteErrorBoundary from '../components/main/RouteErrorBoundary';

const RootLayout = () => {
	return (
		<RootContext>
			<Stack screenOptions={{ headerShown: false, freezeOnBlur: true }}>
				<Stack.Screen name="index" options={defaultStack} />
				<Stack.Screen name="(auth)" options={defaultModalStack} />
				<Stack.Screen name="(others)" options={defaultModalStack} />
				<Stack.Screen name="(user)" options={defaultStack} />
				<Stack.Screen name="(profile)" options={defaultStack} />
				<Stack.Screen name="(tabs)" options={{ ...defaultStack, gestureEnabled: false }} />
				<Stack.Screen name="(plan)" options={defaultStack} />
				<Stack.Screen name="redirect" options={defaultStack} />
				<Stack.Screen name="error" options={defaultStack} />
			</Stack>
		</RootContext>
	);
};

export const ErrorBoundary = RouteErrorBoundary;

export default RootLayout;
