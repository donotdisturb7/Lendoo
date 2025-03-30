import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface SafeScreenViewProps {
  children: ReactNode;
  style?: any;
  contentStyle?: any;
  noPadding?: boolean;
  reduceTopPadding?: boolean;
}

/**
 * Composant qui fournit une mise en page sécurisée pour toutes les pages
 * en évitant les problèmes d'affichage sur les téléphones (notch, barre d'état, etc.)
 */
export default function SafeScreenView({ 
  children, 
  style, 
  contentStyle, 
  noPadding = false,
  reduceTopPadding = false 
}: SafeScreenViewProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  // Calcul dynamique du padding en fonction des options
  const containerPadding = {
    padding: noPadding ? 0 : 20,
    paddingTop: noPadding ? 0 : 
               reduceTopPadding ? (Platform.OS === 'android' ? 24 : 16) : 
               (Platform.OS === 'android' ? 50 : 20)
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View 
        style={[
          styles.container, 
          containerPadding,
          style, 
          { backgroundColor: colors.background },
          contentStyle
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
