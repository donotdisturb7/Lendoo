import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          title: "Connexion",
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: "Inscription",
          headerShown: false 
        }} 
      />
    </Stack>
  );
}