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
} from 'react-native';
import { supabase } from '@/lib/supabase';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';

const Page = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  
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
    if (!form.email || !form.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    await signIn(form.email, form.password);
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    // Navigate to home page
    router.replace('/(protected)/home');
  }

  return (
    <SafeAreaView style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          {/* <Image
            alt="App Logo"
            resizeMode="contain"
            style={styles.headerImg}
            source={require('@/assets/images/icon.png')} 
          /> */}

          <Text style={[styles.title, { color: colors.text }]}>Bienvenue</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Connectez-vous pour continuer</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.input}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
            <TextInput
              ref={emailInputRef}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              keyboardType="email-address"
              onChangeText={email => setForm({ ...form, email })}
              placeholder="email@example.com"
              placeholderTextColor={colors.textSecondary}
              style={[styles.inputControl, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              value={form.email}
    
            />
          </View>

          <View style={styles.input}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Mot De Passe</Text>
            <TextInput
              ref={passwordInputRef}
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={password => setForm({ ...form, password })}
              placeholder="********"
              placeholderTextColor={colors.textSecondary}
              style={[styles.inputControl, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              secureTextEntry={true}
              value={form.password}
            />
          </View>

          <View style={styles.formAction}>
            <TouchableOpacity onPress={handleAuth}>
              <View style={[styles.btn, { backgroundColor: colors.buttonBackground, borderColor: colors.buttonBackground }]}>
                <Text style={[styles.btnText, { color: colors.buttonText }]}>Connexion</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => Alert.alert('Réinitialisation du mot de passe', 'Fonctionnalité à venir')}>
            <Text style={[styles.formLink, { color: colors.primary }]}>Mot de passe oublié?</Text>
          </TouchableOpacity>
          
          <View style={styles.separatorContainer}>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <Text style={[styles.separatorText, { color: colors.textSecondary }]}>ou</Text>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          </View>
          
          <View style={styles.socialButtons}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="logo-google" size={20} color={colors.text} />
              <Text style={[styles.socialBtnText, { color: colors.text }]}>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="logo-apple" size={20} color={colors.text} />
              <Text style={[styles.socialBtnText, { color: colors.text }]}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={[styles.formFooter, { color: colors.text }]}>
          Pas encore inscrit ?{' '}
          <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
            Inscription
          </Text>
        </Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 36,
  },
  headerImg: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 36,
    borderRadius: 40,
  },
  form: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  formAction: {
    marginTop: 16,
    marginBottom: 16,
  },
  formLink: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  formFooter: {
    paddingVertical: 24,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.15,
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputControl: {
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
  }
});

export default Page;