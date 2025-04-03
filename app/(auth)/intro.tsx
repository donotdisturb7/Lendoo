import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Page = () => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/Fichier_17.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={[styles.logoBackground, { backgroundColor: colors.primary + '20' }]} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.primary }]}>Bienvenue sur Lendoo</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            La plateforme qui facilite le partage et la location d'objets entre particuliers
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>Échangez facilement</Text>
          </View>

          <View style={styles.feature}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>Transactions sécurisées</Text>
          </View>

          <View style={styles.feature}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>Communauté active</Text>
          </View>
        </View>
      </View>

      <View style={[styles.buttonContainer, { backgroundColor: colors.background }]}>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Commencer</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity 
            style={[styles.button, { 
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              borderWidth: 1
            }]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>J'ai déjà un compte</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    width: width * 0.7,
    height: width * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    position: 'relative',
  },
  logo: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  logoBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: width * 0.35,
    opacity: 0.1,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginTop: 48,
    width: '100%',
    gap: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 24,
    gap: 16,
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  }
});

export default Page; 