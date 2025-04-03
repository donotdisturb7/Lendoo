import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
  Dimensions,
} from "react-native";
import Colors from "@/constants/Colors";
import { defaultStyles } from "@/constants/Styles";
import { useAssets } from "expo-asset";
import { ResizeMode, Video } from "expo-av";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

interface BackgroundVideoProps {
  assets: any[];
  theme: "light" | "dark";
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

interface HeaderProps {
  theme: "light" | "dark";
  colors: typeof Colors.light;
  headerFadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

interface ActionButtonsProps {
  theme: "light" | "dark";
  colors: typeof Colors.light;
  buttonsFadeAnim: Animated.Value;
}

// Custom hook for animations
const useIntroAnimations = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(headerFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonsFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { fadeAnim, scaleAnim, headerFadeAnim, buttonsFadeAnim, slideAnim };
};

// Background Video Component
const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  assets,
  theme,
  fadeAnim,
  scaleAnim,
}) => (
  <Animated.View
    style={{
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }],
      width: "100%",
      height: "55%",
      marginTop: 150,
      position: "absolute",
    }}
  >
    <Video
      resizeMode={ResizeMode.COVER}
      isMuted
      isLooping
      shouldPlay
      source={{ uri: assets[0].uri }}
      style={[styles.video, { opacity: theme === "dark" ? 0.7 : 1 }]}
    />
    {theme === "dark" && <View style={styles.darkOverlay} />}
  </Animated.View>
);

// Header Component
const Header: React.FC<HeaderProps> = ({
  theme,
  colors,
  headerFadeAnim,
  slideAnim,
}) => (
  <Animated.View
    style={[
      styles.headerContainer,
      {
        opacity: headerFadeAnim,
        transform: [{ translateY: slideAnim }],
      },
    ]}
  >
    <Image
      source={require("@/assets/Fichier_18.png")}
      style={styles.logo}
      resizeMode="contain"
    />
    <Text style={[styles.header, { color: colors.text }]}>
      Pourquoi acheter quand on peut emprunter ?
    </Text>
  </Animated.View>
);

// Action Buttons Component
const ActionButtons: React.FC<ActionButtonsProps> = ({
  theme,
  colors,
  buttonsFadeAnim,
}) => (
  <Animated.View style={[styles.buttons, { opacity: buttonsFadeAnim }]}>
    <Text style={[styles.smallText, { color: colors.text, marginBottom: 35 }]}>
      Avec Lendoo, partagez en toute confiance.
    </Text>
    <View style={styles.buttonContainer}>
      <Link
        href={"/(auth)/login"}
        style={[
          defaultStyles.pillButton,
          styles.button,
          { backgroundColor: colors.primary },
        ]}
        asChild
      >
        <TouchableOpacity>
          <Text style={styles.buttonText}>Connexion</Text>
        </TouchableOpacity>
      </Link>
      <Link
        href={"/(auth)/register"}
        style={[
          defaultStyles.pillButton,
          styles.button,
          {
            backgroundColor: theme === "dark" ? "#333" : "#fff",
            borderWidth: 2,
            borderColor: colors.primary,
          },
        ]}
        asChild
      >
        <TouchableOpacity>
          <Text
            style={[
              styles.buttonText,
              { color: theme === "dark" ? "#fff" : colors.primary },
            ]}
          >
            Inscription
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  </Animated.View>
);

const IntroScreen = () => {
  const [assets] = useAssets([require("@/assets/videos/intro.mp4")]);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const { fadeAnim, scaleAnim, headerFadeAnim, buttonsFadeAnim, slideAnim } =
    useIntroAnimations();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/(protected)/home");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {assets && (
        <BackgroundVideo
          assets={assets}
          theme={theme}
          fadeAnim={fadeAnim}
          scaleAnim={scaleAnim}
        />
      )}

      <Header
        theme={theme}
        colors={colors}
        headerFadeAnim={headerFadeAnim}
        slideAnim={slideAnim}
      />

      <ActionButtons
        theme={theme}
        colors={colors}
        buttonsFadeAnim={buttonsFadeAnim}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  logo: {
    width: 350,
    height: 70,
    backgroundColor: "#00BF12",
    borderRadius: 10,
    padding: 10,
    marginTop: 40,
    marginBottom: 40,
  },
  video: {
    width: "100%",
    height: "100%",
    position: "absolute",
    marginTop: 20,
  },
  darkOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  headerContainer: {
    marginTop: 80,
    padding: 20,
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "900",
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 5,
  },
  subheader: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.8,
  },
  buttons: {
    flexDirection: "column",
    justifyContent: "center",
    marginBottom: 130,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  button: {
    flex: 1,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: "500",
    color: "white",
  },
  smallText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.8,
  },
});

export default IntroScreen;
