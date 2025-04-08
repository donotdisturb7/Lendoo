/**
 * Layout d'authentification
 * 
 * Gère les routes liées à l'authentification des utilisateurs :
 * - Connexion
 * - Inscription
 * - Réinitialisation du mot de passe
 * 
 * Caractéristiques :
 * - Routes non protégées (accessibles sans authentification)
 * - Redirection vers l'app si déjà authentifié
 * - Design cohérent pour toutes les pages d'auth
 * - Support du thème dynamique
 * 
 * @component
 */

import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import React from 'react';
/**
 * Composant de layout d'authentification
 * Configure le style et les options de navigation pour les écrans d'auth
 * 
 * @returns {React.ReactElement} Stack de navigation pour l'authentification
 */
export default function AuthLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackTitle: "Retour",
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {/* Écran de connexion */}
      <Stack.Screen
        name="login"
        options={{
          title: "Connexion",
          headerShown: false,
        }}
      />

      {/* Écran d'inscription */}
      <Stack.Screen
        name="register"
        options={{
          title: "Inscription",
          headerShown: false,
        }}
      />

      {/* Écran de réinitialisation du mot de passe */}
      <Stack.Screen
        name="reset-password"
        options={{
          title: "Mot de passe oublié",
          headerShown: false,
        }}
      />
    </Stack>
  );
}