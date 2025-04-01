import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import SafeScreenView from '@/components/SafeScreenView';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [userInfo, setUserInfo] = useState({
    email: '',
    name: 'Utilisateur',
    createdAt: '',
  });
  
  // État pour contrôler le mode d'édition
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // État pour les données du profil en mode édition
  const [profileData, setProfileData] = useState({
    fullName: '',
    biography: '',
    location: '',
    phoneNumber: '',
  });

  useFocusEffect(
    useCallback(() => {
      console.log('ProfileScreen focused - refreshing data');
      fetchUserProfile();
      return () => {
       
      };
    }, [])
  );

  async function fetchUserProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserInfo({
          email: user.email || '',
          name: user.email?.split('@')[0] || 'Utilisateur',
          createdAt: new Date(user.created_at).toLocaleDateString(),
        });
        
        // Récupérer les données de l'utilisateur pour le mode édition
        const { data: userData, error: userError } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (userError && userError.code !== 'PGRST116') {
          console.error('Erreur récupération utilisateur:', userError);
        }
        
        // Récupérer les données du profil
        const { data: profileInfo, error: profileError } = await supabase
          .from('profils')
          .select('*')
          .eq('utilisateur_id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Erreur récupération profil:', profileError);
        }
        
        // Mettre à jour l'état du profil
        setProfileData({
          fullName: userData?.nom_complet || user.email?.split('@')[0] || '',
          biography: profileInfo?.biographie || '',
          location: profileInfo?.localisation || '',
          phoneNumber: profileInfo?.telephone || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Erreur', error.message);
            } else {
              // Redirect to intro screen
              router.replace('/intro');
            }
          },
        },
      ]
    );
  }
  
  async function handleSaveProfile() {
    try {
      setLoading(true);
      
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }
      
      // Mettre à jour la table utilisateurs
      const { error: userError } = await supabase
        .from('utilisateurs')
        .update({
          nom_complet: profileData.fullName,
          date_modification: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (userError) {
        throw userError;
      }
      
      // Vérifier si le profil existe déjà
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profils')
        .select('id')
        .eq('utilisateur_id', user.id)
        .single();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Erreur vérification profil:', profileCheckError);
      }
      
      let profileUpdateError;
      
      if (existingProfile) {
        // Mettre à jour le profil existant
        const { error } = await supabase
          .from('profils')
          .update({
            biographie: profileData.biography,
            localisation: profileData.location,
            telephone: profileData.phoneNumber,
            date_modification: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);
          
        profileUpdateError = error;
      } else {
        // Créer un nouveau profil
        const { error } = await supabase
          .from('profils')
          .insert({
            utilisateur_id: user.id,
            biographie: profileData.biography,
            localisation: profileData.location,
            telephone: profileData.phoneNumber,
            date_creation: new Date().toISOString(),
            date_modification: new Date().toISOString(),
          });
          
        profileUpdateError = error;
      }
      
      if (profileUpdateError) {
        throw profileUpdateError;
      }
      
      // Mettre à jour l'affichage du nom
      setUserInfo(prev => ({
        ...prev,
        name: profileData.fullName || prev.name,
      }));
      
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      setIsEditing(false);
      
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  }
  
  // Gérer les changements dans les champs du formulaire
  const handleChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // Afficher le formulaire d'édition
  if (isEditing) {
    return (
      <SafeScreenView>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Modifier le profil</Text>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Nom complet</Text>
                  <TextInput
                    style={[styles.input, { 
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border 
                    }]}
                    placeholder="Votre nom complet"
                    placeholderTextColor={colors.textSecondary}
                    value={profileData.fullName}
                    onChangeText={(text) => handleChange('fullName', text)}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Biographie</Text>
                  <TextInput
                    style={[styles.textArea, { 
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border 
                    }]}
                    placeholder="Parlez-nous de vous"
                    placeholderTextColor={colors.textSecondary}
                    value={profileData.biography}
                    onChangeText={(text) => handleChange('biography', text)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Localisation</Text>
                  <TextInput
                    style={[styles.input, { 
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border 
                    }]}
                    placeholder="Votre ville"
                    placeholderTextColor={colors.textSecondary}
                    value={profileData.location}
                    onChangeText={(text) => handleChange('location', text)}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Numéro de téléphone</Text>
                  <TextInput
                    style={[styles.input, { 
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border 
                    }]}
                    placeholder="Votre numéro de téléphone"
                    placeholderTextColor={colors.textSecondary}
                    value={profileData.phoneNumber}
                    onChangeText={(text) => handleChange('phoneNumber', text)}
                    keyboardType="phone-pad"
                  />
                </View>
                
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.buttonCancel, { borderColor: colors.border }]}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={[styles.buttonCancelText, { color: colors.text }]}>Annuler</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.buttonSave, { backgroundColor: colors.primary }]}
                    onPress={handleSaveProfile}
                    disabled={loading}
                  >
                    <Text style={styles.buttonSaveText}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeScreenView>
    );
  }

  // Affichage normal du profil
  return (
    <SafeScreenView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{userInfo.name.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{userInfo.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{userInfo.email}</Text>
          <Text style={[styles.memberSince, { color: colors.textSecondary }]}>Membre depuis le {userInfo.createdAt}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Paramètres du compte</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="person-outline" size={24} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Modifier le profil</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Préférences</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="moon-outline" size={24} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Mode sombre</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="language-outline" size={24} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Langue</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Aide et FAQ</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>À propos</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.primary }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeScreenView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 14,
  },
  section: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Styles pour le formulaire d'édition
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  formContainer: {
    paddingHorizontal: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 50,
  },
  buttonCancel: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  buttonCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSave: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
