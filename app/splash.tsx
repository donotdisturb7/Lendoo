import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as SplashScreen from 'expo-splash-screen';
import Colors from '@/constants/Colors';

export default function AppSplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide the native splash screen
    SplashScreen.hideAsync();
    
    // Animation sequence
    const splashDuration = 2000; // 2 seconds to show splash
    const animationDuration = 800; // 0.8 seconds for animation
    
    setTimeout(() => {
      // Start fade out and scale animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: animationDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        // After animation completes, check auth status
        checkAuthStatus();
      });
    }, splashDuration);
  }, []);

  async function checkAuthStatus() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/(protected)/home');
      } else {
        // Redirect to intro page instead of login
        router.replace('/intro');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      router.replace('/intro'); // Fallback to intro page
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image 
          source={require('@/assets/portrait.png')} 
          style={styles.fullScreenImage}
          resizeMode="cover"
        />
        <View style={styles.overlay}>

        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  animatedContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  logo: {
    width: 200,
    height: 200,
  }
});