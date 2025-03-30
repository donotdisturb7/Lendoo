import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';

interface HomeHeaderProps {
  userName: string;
  showSettings?: boolean;
}

export default function HomeHeader({ userName, showSettings = false }: HomeHeaderProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={styles.welcomeHeader}>
      <Text style={[styles.welcomeText, { color: colors.text }]}>
        Bonjour {userName} 👋
      </Text>
      {showSettings && (
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
  },
});
