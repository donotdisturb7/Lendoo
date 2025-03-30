import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { useAssets } from 'expo-asset';
import { ResizeMode, Video } from 'expo-av';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const IntroScreen = () => {
  const [assets] = useAssets([require('@/assets/videos/intro.mp4')]);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Start entrance animations
    Animated.sequence([
      // Fade in and scale up the background video
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ]),
      // Then fade in the header
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Finally fade in the buttons
      Animated.timing(buttonsFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  async function checkAuthStatus() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // User is already logged in, redirect to home
        router.replace('/(protected)/home');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {assets && (
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          width: '100%',
          height: '100%',
          position: 'absolute'
        }}>
          <Video
            resizeMode={ResizeMode.COVER}
            isMuted
            isLooping
            shouldPlay
            source={{ uri: assets[0].uri }}
            style={[styles.video, { opacity: theme === 'dark' ? 0.7 : 1 }]}
          />
          {theme === 'dark' && (
            <View style={styles.darkOverlay} />
          )}
        </Animated.View>
      )}
      
      <Animated.View style={[{ marginTop: 80, padding: 20 }, { opacity: headerFadeAnim }]}>
        <Text style={[styles.header, { color: colors.text }]}>Tout près, tout prêt !</Text>
      </Animated.View>

      <Animated.View style={[styles.buttons, { opacity: buttonsFadeAnim }]}>
        <Link
          href={'/(auth)/login'}
          style={[defaultStyles.pillButton, { flex: 1, backgroundColor: colors.primary }]}
          asChild>
          <TouchableOpacity>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '500' }}>Connexion</Text>
          </TouchableOpacity>
        </Link>
        <Link
          href={'/(auth)/register'}
          style={[defaultStyles.pillButton, { flex: 1, backgroundColor: theme === 'dark' ? '#333' : '#fff' }]}
          asChild>
          <TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: '500', color: theme === 'dark' ? '#fff' : colors.primary }}>Inscription</Text>
          </TouchableOpacity>
        </Link>
      </Animated.View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  darkOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    fontSize: 36,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 60,
    paddingHorizontal: 20,
  },
});

export default IntroScreen;
