// External imports
import {Stack} from 'expo-router';


const AuthLayout = () => {
	return (
		<Stack screenOptions={{headerShown: false}}>
			<Stack.Screen name="contact"/>
			<Stack.Screen name="privacy"/>
			<Stack.Screen name="terms"/>
		</Stack>
	);
}

export default AuthLayout;
