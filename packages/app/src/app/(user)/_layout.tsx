// External imports
import {Stack} from 'expo-router';


export default function AuthLayout() {
	return (
		<Stack screenOptions={{headerShown: false, animation: 'fade'}}>
			<Stack.Screen name="account-info" options={{animation: 'fade'}}/>
		</Stack>
	);
}
