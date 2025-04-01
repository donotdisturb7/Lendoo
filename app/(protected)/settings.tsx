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

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [userInfo, setUserInfo] = useState({
    id: '',
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
      console.log('SettingsScreen focused - refreshing data');
      fetchUserProfile();
      return () => {
       // Cleanup
      };
    }, [])
  );

  async function fetchUserProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserInfo({
          id: user.id,
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
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            <View style={[styles.editHeader, { backgroundColor: colors.card }]}>
              <View style={styles.avatarEditContainer}>
                <View style={[styles.avatarEdit, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarEditText}>{profileData.fullName.charAt(0).toUpperCase()}</Text>
                  <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: colors.background }]}>
                    <Ionicons name="camera" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Modifier votre profil</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Personnalisez vos informations personnelles
              </Text>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Chargement de vos informations...
                </Text>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <View style={[styles.formCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      <Ionicons name="person" size={16} color={colors.primary} style={styles.inputIcon} /> 
                      Nom complet
                    </Text>
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
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      <Ionicons name="book" size={16} color={colors.primary} style={styles.inputIcon} /> 
                      Biographie
                    </Text>
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
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      <Ionicons name="location" size={16} color={colors.primary} style={styles.inputIcon} /> 
                      Localisation
                    </Text>
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
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      <Ionicons name="call" size={16} color={colors.primary} style={styles.inputIcon} /> 
                      Numéro de téléphone
                    </Text>
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
                </View>
                
                <View style={styles.noteCard}>
                  <Ionicons name="information-circle" size={20} color={colors.primary} />
                  <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                    Ces informations vous aideront à personnaliser votre expérience et à faciliter vos interactions avec les autres utilisateurs.
                  </Text>
                </View>
                
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.buttonCancel, { borderColor: colors.border }]}
                    onPress={() => setIsEditing(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color={colors.text} style={styles.buttonIcon} />
                    <Text style={[styles.buttonCancelText, { color: colors.text }]}>Annuler</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.buttonSave, { backgroundColor: colors.primary }]}
                    onPress={handleSaveProfile}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={18} color="white" style={styles.buttonIcon} />
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

  // Affichage normal des paramètres
  return (
    <SafeScreenView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.replace('/profile')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: 0,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 40,
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
    marginHorizontal: 15,
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
    marginHorizontal: 15,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Styles améliorés pour le formulaire d'édition
  editHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    paddingVertical: 20,
    borderRadius: 15,
  },
  avatarEditContainer: {
    marginBottom: 15,
  },
  avatarEdit: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarEditText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  formContainer: {
    marginBottom: 30,
  },
  formCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  noteText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  buttonCancel: {
    flex: 1,
    height: 54,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexDirection: 'row',
  },
  buttonSave: {
    flex: 1,
    height: 54,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
}); 