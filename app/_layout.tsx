import React from 'react';
import { Slot, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { View, Text, useColorScheme, StyleSheet } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../context/ThemeContext';
import './global.css';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate resource loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // You can add actual resource loading here if needed:
        // await Font.loadAsync({...});
        
      } catch (e) {
        console.warn(e);
      } finally {
        
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null; 
  }

  // Once ready, render the app structure
  return (
    <ThemeProvider>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          // Désactiver les gestes de swipe pour éviter la déconnexion accidentelle
          gestureEnabled: false,
          // Utiliser une animation de fondu au lieu de glissement
          animation: 'fade',
          // Personnaliser la durée de l'animation
          animationDuration: 300
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="intro" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}