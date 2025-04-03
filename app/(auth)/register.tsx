import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const Register = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { signUp, loading } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom_complet: '', 
  });
  
  async function handleAuth() {
    if (loading) return;
    
    if (!form.email || !form.password || !form.confirmPassword || !form.nom_complet) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (form.password !== form.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    const { success, message } = await signUp(form.email, form.password, form.nom_complet);
    
    if (!success) {
      Alert.alert('Erreur d\'inscription', message);
      return;
    }
    
    Alert.alert(
      'Compte créé avec succès', 
      'Bienvenue chez Lendoo! Vous pouvez maintenant utiliser l\'application.'
    );
    router.replace('/(protected)/home');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
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
            <Text style={[styles.title, { color: colors.text }]}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Inscrivez-vous pour continuer</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.input}>
              <View style={[styles.inputIcon, { backgroundColor: colors.inputBackground }]}>
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              </View>
              <TextInput
                autoCorrect={false}
                clearButtonMode="while-editing"
                onChangeText={nom_complet => setForm({ ...form, nom_complet })}
                placeholder="Jean Dupont"
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputControl, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.nom_complet}
              />
            </View>

            <View style={styles.input}>
              <View style={[styles.inputIcon, { backgroundColor: colors.inputBackground }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              </View>
              <TextInput
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

            <View style={styles.input}>
              <View style={[styles.inputIcon, { backgroundColor: colors.inputBackground }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              </View>
              <TextInput
                autoCorrect={false}
                clearButtonMode="while-editing"
                onChangeText={confirmPassword => setForm({ ...form, confirmPassword })}
                placeholder="********"
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputControl, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                secureTextEntry={true}
                value={form.confirmPassword}
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
                <Text style={[styles.btnText, { color: colors.buttonText }]}>Inscription</Text>
              )}
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
                onPress={() => Alert.alert('Google', 'Inscription Google à venir')}
              >
                <Ionicons name="logo-google" size={20} color={colors.text} />
                <Text style={[styles.socialBtnText, { color: colors.text }]}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialBtn, { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border 
                }]}
                onPress={() => Alert.alert('Apple', 'Inscription Apple à venir')}
              >
                <Ionicons name="logo-apple" size={20} color={colors.text} />
                <Text style={[styles.socialBtnText, { color: colors.text }]}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.footerContainer}>
        <TouchableOpacity 
          onPress={() => router.push('/(auth)/login')}
          style={styles.footer}
        >
          <Text style={[styles.formFooter, { color: colors.text }]}>
            Vous avez déjà un compte ?{' '}
            <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
              Connexion
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  logo: {
    width: 190,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
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
    marginVertical: 16,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: 12,
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
    marginTop: 4,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
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
    marginBottom: 12,
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
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footer: {
    paddingVertical: 16,
  },
  formFooter: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.15,
  }
});

export default Register;