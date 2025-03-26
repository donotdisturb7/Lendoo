import { Tabs, Slot } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar, TouchableOpacity, View } from 'react-native';

export default function AppLayout() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const colors = Colors[theme];
  
  // Déterminer si nous sommes dans un écran qui ne devrait pas avoir de tabs
  // Cela sera géré par la structure des dossiers et le routage d'Expo
  
  return (
    <>
      <StatusBar 
        barStyle={colors.statusBarStyle === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <Tabs 
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: colors.card,
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
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
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
 
    </Tabs>
    </>
  );
}