import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface SafeScreenViewProps {
  children: ReactNode;
  style?: any;
}

/**
 * Composant qui fournit une mise en page sécurisée pour toutes les pages
 * en évitant les problèmes d'affichage sur les téléphones (notch, barre d'état, etc.)
 */
export default function SafeScreenView({ children, style }: SafeScreenViewProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.container, style, { backgroundColor: colors.background }]}>
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
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 20, // Plus de padding sur Android
  },
});
