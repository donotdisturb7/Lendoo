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
} from 'react-native';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

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
    
    // Si l'inscription est réussie
    Alert.alert(
      'Compte créé avec succès', 
      'Bienvenue chez Lendoo! Vous pouvez maintenant utiliser l\'application.'
    );
    router.replace('/(protected)/home');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme === 'dark' ? '#121212' : '#e8ecf4' }}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
  

          <Text style={[styles.title, { color: colors.text }]}>Créer un compte</Text>
          <Text style={[styles.subtitle, { color: theme === 'dark' ? '#aaa' : '#929292' }]}>Inscrivez vous pour continuer</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.input}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nom complet</Text>
            <TextInput
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={nom_complet => setForm({ ...form, nom_complet })}
              placeholder="Jean Dupont"
              placeholderTextColor={theme === 'dark' ? '#aaa' : '#6b7280'}
              style={[styles.inputControl, { 
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: colors.text,
                borderColor: theme === 'dark' ? '#555' : '#C9D3DB'
              }]}
              value={form.nom_complet}
            />
          </View>

          <View style={styles.input}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              keyboardType="email-address"
              onChangeText={email => setForm({ ...form, email })}
              placeholder="email@example.com"
              placeholderTextColor={theme === 'dark' ? '#aaa' : '#6b7280'}
              style={[styles.inputControl, { 
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: colors.text,
                borderColor: theme === 'dark' ? '#555' : '#C9D3DB'
              }]}
              value={form.email}
            />
          </View>

          <View style={styles.input}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Mot De Passe</Text>
            <TextInput
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={password => setForm({ ...form, password })}
              placeholder="********"
              placeholderTextColor={theme === 'dark' ? '#aaa' : '#6b7280'}
              style={[styles.inputControl, { 
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: colors.text,
                borderColor: theme === 'dark' ? '#555' : '#C9D3DB'
              }]}
              secureTextEntry={true}
              value={form.password}
            />
          </View>

          <View style={styles.input}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Confirmez votre Mot De Passe</Text>
            <TextInput
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={confirmPassword => setForm({ ...form, confirmPassword })}
              placeholder="********"
              placeholderTextColor={theme === 'dark' ? '#aaa' : '#6b7280'}
              style={[styles.inputControl, { 
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: colors.text,
                borderColor: theme === 'dark' ? '#555' : '#C9D3DB'
              }]}
              secureTextEntry={true}
              value={form.confirmPassword}
            />
          </View>

          <View style={styles.formAction}>
            <TouchableOpacity onPress={handleAuth} disabled={loading}>
              <View style={[styles.btn, { 
                backgroundColor: loading ? colors.textSecondary : colors.primary, 
                borderColor: loading ? colors.textSecondary : colors.primary 
              }]}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnText}>Inscription</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.separatorContainer}>
            <View style={[styles.separator, { backgroundColor: theme === 'dark' ? '#555' : '#929292' }]} />
            <Text style={[styles.separatorText, { color: theme === 'dark' ? '#aaa' : '#929292' }]}>or</Text>
            <View style={[styles.separator, { backgroundColor: theme === 'dark' ? '#555' : '#929292' }]} />
          </View>
          

        </View>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={[styles.formFooter, { color: theme === 'dark' ? '#eee' : '#222' }]}>
          Vous avez déja un compte ?{' '}
          <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
            Connexion
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
    color: '#1D2A32',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#929292',
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
  formFooter: {
    paddingVertical: 24,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    letterSpacing: 0.15,
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  inputControl: {
    height: 50,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    borderWidth: 1,
    borderColor: '#C9D3DB',
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
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  btnText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#fff',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separator: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#929292',
  },
  separatorText: {
    color: '#929292',
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
    borderColor: '#C9D3DB',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flex: 0.48,
  },
  socialBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginLeft: 8,
  }
});

export default Register;