// External imports
import {Stack} from 'expo-router';
import React from "react";


export default function AuthLayout() {
	return (
		<Stack screenOptions={{headerShown: false}}>
			<Stack.Screen name="manage-profiles" options={{animation: 'fade'}}/>
			<Stack.Screen name="profiles" options={{animation: 'fade'}}/>
			<Stack.Screen name="create-profile" options={{animation: 'fade'}}/>
			<Stack.Screen name="edit-profile" options={{animation: 'fade'}}/>
		</Stack>
	);
}
