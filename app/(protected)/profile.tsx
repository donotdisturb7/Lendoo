import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
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

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserInfo({
          email: user.email || '',
          name: user.email?.split('@')[0] || 'Utilisateur',
          createdAt: new Date(user.created_at).toLocaleDateString(),
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
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
});
