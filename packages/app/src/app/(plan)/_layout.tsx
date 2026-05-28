// External imports
import {Stack} from 'expo-router';


export default function AuthLayout() {
	return (
		<Stack screenOptions={{headerShown: false}}>
			<Stack.Screen name="check-plan"/>
			<Stack.Screen name="manage-plan"/>
			<Stack.Screen name="process-plan"/>
			<Stack.Screen name="plan-picker"/>
			<Stack.Screen name="plan-payment"/>
			<Stack.Screen name="update-plan"/>
			{/* Stack.Screen name="transactions" */}
		</Stack>
	);
}

