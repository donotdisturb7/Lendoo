/**
 * Layout protégé de l'application
 * 
 * Ce composant gère la navigation par onglets pour les utilisateurs authentifiés.
 * Il implémente :
 * - Une barre de navigation inférieure avec des icônes
 * - La protection des routes (redirection si non authentifié)
 * - Le thème dynamique (clair/sombre)
 * 
 * Structure de navigation :
 * - /home : Découverte et recherche de matériel
 * - /profile : Gestion du profil et des prêts
 * - /loan-requests : Gestion des demandes de prêt
 * - /settings : Paramètres de l'application
 * 
 * @component
 */

import { Tabs, Slot } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import React, { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { LocationProvider } from '@/context/LocationContext';
import { StatusBar, TouchableOpacity, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';

/**
 * Composant de layout protégé
 * Redirige vers la connexion si l'utilisateur n'est pas authentifié
 * 
 * @returns {React.ReactElement} Layout avec navigation par onglets
 */
export default function ProtectedLayout() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const segments = useSegments();

  /**
   * Vérifie l'authentification à chaque changement de route
   * Redirige vers la connexion si nécessaire
   */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      }
    });
  }, [segments]);

  return (
    <>
      <StatusBar 
        barStyle={colors.statusBarStyle === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <LocationProvider>
        <Tabs 
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: colors.navBarBackground,
            borderTopColor: colors.border,
            paddingTop: 5,
          },
          headerShown: false, 
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity 
              onPress={toggleTheme} 
              style={{ marginRight: 15 }}
            >
              <Ionicons 
                name={isDarkMode ? 'sunny-outline' : 'moon-outline'} 
                size={24} 
                color={colors.text} 
              />
            </TouchableOpacity>
          ),
        }}
      >
      <Tabs.Screen 
        name="home" 
        options={{
          title: "Découvrir",
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="cart" 
        options={{
          title: "Panier",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="loan-requests" 
        options={{
          title: "Demandes",
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
        }} 
      />
      
      {/* Ces écrans ne seront pas affichés dans la barre de navigation */}
      <Tabs.Screen 
        name="add-item" 
        options={{
          href: null, // Ceci empêche l'écran d'apparaître dans la barre de navigation
        }} 
      />
      
      <Tabs.Screen 
        name="settings" 
        options={{
          title: "Paramètres",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />
        }} 
      />
 
      </Tabs>
      </LocationProvider>
    </>
  );
}