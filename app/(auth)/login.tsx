import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const Page = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { signIn, loading } = useAuth();
  
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  
  // Référence pour les champs de formulaire
  const emailInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);
  
  // Effet pour gérer l'autofill d'Apple
  useEffect(() => {
    // Lorsque le mot de passe est rempli automatiquement mais pas l'email
    if (form.password && !form.email && emailInputRef.current) {
      // Focus sur le champ email pour encourager l'utilisateur à le remplir
      emailInputRef.current.focus();
    }
  }, [form.password, form.email]);
  
  async function handleAuth() {
    if (loading) return;
    
    if (!form.email || !form.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    const { success, message } = await signIn(form.email, form.password);
    
    if (!success) {
      Alert.alert('Erreur de connexion', message);
      return;
    }
    
    // La connexion a réussi, rediriger l'utilisateur
    router.replace('/(protected)/home');
  }

  return (
    <SafeAreaView style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Image 
              source={require('@/assets/Fichier_17.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: colors.text }]}>Bienvenue</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Connectez-vous pour continuer</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.input}>
              <View style={[styles.inputIcon, { backgroundColor: colors.inputBackground }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              </View>
              <TextInput
                ref={emailInputRef}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                keyboardType="email-address"
                onChangeText={email => setForm({ ...form, email })}
                placeholder="email@example.com"
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputControl, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.border, 
                  color: colors.text 
                }]}
                value={form.email}
              />
            </View>

            <View style={styles.input}>
              <View style={[styles.inputIcon, { backgroundColor: colors.inputBackground }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              </View>
              <TextInput
                ref={passwordInputRef}
                autoCorrect={false}
                clearButtonMode="while-editing"
                onChangeText={password => setForm({ ...form, password })}
                placeholder="********"
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputControl, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.border, 
                  color: colors.text 
                }]}
                secureTextEntry={true}
                value={form.password}
              />
            </View>

            <TouchableOpacity 
              onPress={handleAuth} 
              disabled={loading}
              style={[styles.btn, { 
                backgroundColor: loading ? colors.textSecondary : colors.primary,
                opacity: loading ? 0.7 : 1
              }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.buttonText} />
              ) : (
                <Text style={[styles.btnText, { color: colors.buttonText }]}>Connexion</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => Alert.alert('Réinitialisation du mot de passe', 'Fonctionnalité à venir')}
              style={styles.forgotPassword}
            >
              <Text style={[styles.formLink, { color: colors.primary }]}>Mot de passe oublié?</Text>
            </TouchableOpacity>
            
            <View style={styles.separatorContainer}>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <Text style={[styles.separatorText, { color: colors.textSecondary }]}>ou</Text>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            </View>
            
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={[styles.socialBtn, { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border 
                }]}
                onPress={() => Alert.alert('Google', 'Connexion Google à venir')}
              >
                <Ionicons name="logo-google" size={20} color={colors.text} />
                <Text style={[styles.socialBtnText, { color: colors.text }]}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialBtn, { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border 
                }]}
                onPress={() => Alert.alert('Apple', 'Connexion Apple à venir')}
              >
                <Ionicons name="logo-apple" size={20} color={colors.text} />
                <Text style={[styles.socialBtnText, { color: colors.text }]}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => router.push('/(auth)/register')}
          style={styles.footer}
        >
          <Text style={[styles.formFooter, { color: colors.text }]}>
            Pas encore inscrit ?{' '}
            <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
              Inscription
            </Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    padding: 24,
  },
  logo: {
    width: 190,
    height: 100,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 36,
  },
  form: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  input: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputControl: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 8,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  formLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separator: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  separatorText: {
    fontSize: 16,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 20,
    flex: 0.48,
  },
  socialBtnText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    paddingVertical: 24,
  },
  formFooter: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.15,
  }
});

export default Page;