/**
 * Layout principal de l'application
 * 
 * Point d'entrée de l'application qui gère :
 * - L'initialisation des providers (thème, localisation, etc.)
 * - La structure de navigation principale
 * - Le chargement des ressources
 * - La gestion des polices
 * - La configuration du thème global
 * 
 * Architecture de navigation :
 * - (auth) : Routes d'authentification
 * - (protected) : Routes protégées nécessitant une authentification
 * - modal : Routes modales superposées
 * 
 * @component
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import './global.css';
import { useFonts } from 'expo-font';
import { StatusBar } from 'react-native';
import { LocationProvider } from '@/context/LocationContext';

// Empêcher le masquage automatique du SplashScreen
SplashScreen.preventAutoHideAsync();

/**
 * Composant racine de l'application
 * Configure les providers et la navigation principale
 * 
 * @returns {React.ReactElement} Layout racine avec providers et navigation
 */
export default function RootLayout() {
  /**
   * Chargement des polices personnalisées
   * Ajouter ici les nouvelles polices si nécessaire
   */
  const [loaded, error] = useFonts({
    // Polices personnalisées à charger
  });

  /**
   * Masque le SplashScreen une fois les ressources chargées
   */
  useEffect(() => {
    if (error) throw error;
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [error, loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <LocationProvider>
          <StatusBar />
          <Stack 
            screenOptions={{ 
              headerShown: false,
              gestureEnabled: false,
              animation: 'fade',
              animationDuration: 300
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Screen name="intro" />
            <Stack.Screen 
              name="(auth)" 
              options={{ 
                headerShown: false,
                animation: 'fade',
              }} 
            />
            <Stack.Screen 
              name="(protected)" 
              options={{ 
                headerShown: false,
                animation: 'fade',
              }} 
            />
            <Stack.Screen 
              name="modal" 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }} 
            />
          </Stack>
        </LocationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}