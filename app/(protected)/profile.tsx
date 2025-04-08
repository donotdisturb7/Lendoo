/**
 * ProfileScreen Component
 * 
 * Composant principal de la page de profil utilisateur qui gère :
 * - L'affichage des informations de l'utilisateur
 * - La liste des emprunts et des prêts
 * - Les actions sur les prêts (prolongation, retour, etc.)
 * - L'édition du profil
 * 
 * Architecture :
 * - Utilisation de React Navigation pour la gestion de la navigation
 * - Intégration avec Supabase pour la persistance des données
 * - Gestion des thèmes clair/sombre
 * - Composants réutilisables pour les cartes de prêt
 * 
 * @component
 */

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
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import SafeScreenView from '@/components/SafeScreenView';

/**
 * Types pour la gestion des prêts et emprunts
 * 
 * @typedef {Object} ItemType
 * @property {string} id - Identifiant unique du prêt
 * @property {string} nom - Nom de l'objet
 * @property {string} description - Description de l'objet
 * @property {string} image_url - URL de l'image de l'objet
 * @property {string} date_debut - Date de début du prêt
 * @property {string} date_fin - Date de fin du prêt
 * @property {('panier'|'en attente'|'approuvé'|'actif'|'demande_retour'|'retourné'|'rejeté')} statut - Statut du prêt
 * @property {boolean} retard - Indique si le prêt est en retard
 * @property {boolean} prolongation_demandee - Indique si une prolongation a été demandée
 * @property {boolean} prolongation_acceptee - Indique si la prolongation a été acceptée
 * @property {string} [nouvelle_date_fin] - Nouvelle date de fin proposée
 * @property {Object} utilisateur - Informations sur l'autre partie (prêteur ou emprunteur)
 */
type ItemType = {
  id: string;
  nom: string;
  description: string;
  image_url: string;
  date_debut: string;
  date_fin: string;
  statut: 'panier' | 'en attente' | 'approuvé' | 'actif' | 'demande_retour' | 'retourné' | 'rejeté';
  retard: boolean;
  prolongation_demandee: boolean;
  prolongation_acceptee: boolean;
  nouvelle_date_fin?: string;
  utilisateur: {
    nom_complet: string;
    email: string;
  };
};

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
  const [loading, setLoading] = useState(true);
  
  // État pour les données du profil en mode édition
  const [profileData, setProfileData] = useState({
    fullName: '',
    biography: '',
    location: '',
    phoneNumber: '',
  });

  // États pour les prêts et emprunts
  const [emprunts, setEmprunts] = useState<ItemType[]>([]);
  const [prets, setPrets] = useState<ItemType[]>([]);
  
  const [activeTab, setActiveTab] = useState('emprunts'); // 'emprunts' ou 'prets'

  // États pour le modal de détails
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

  /**
   * Ouvre le modal avec les détails d'un prêt
   * @param {ItemType} item - Le prêt à afficher en détail
   */
  const openDetailsModal = (item: ItemType) => {
    setSelectedItem(item);
    setDetailsModalVisible(true);
  };

  /**
   * Ferme le modal
   */
  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedItem(null);
  };

  /**
   * Effect qui recharge les données du profil à chaque fois que l'écran est focus
   * Utilisation de useFocusEffect pour garantir la mise à jour même en navigation par tab
   */
  useFocusEffect(
    useCallback(() => {
      console.log('ProfileScreen focused - refreshing data');
      fetchUserProfile();
      return () => {
        // Cleanup si nécessaire
      };
    }, [])
  );

  /**
   * Récupère toutes les données du profil utilisateur :
   * - Informations de base (email, nom)
   * - Données personnalisées (profil étendu)
   * - Liste des emprunts
   * - Liste des prêts
   */
  async function fetchUserProfile() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Mise à jour des informations de base
        setUserInfo({
          email: user.email || '',
          name: user.email?.split('@')[0] || 'Utilisateur',
          createdAt: new Date(user.created_at).toLocaleDateString(),
        });
        
        // Récupération des données utilisateur étendues
        const { data: userData, error: userError } = await supabase
          .from('utilisateurs')
          .select('nom_complet')
          .eq('id', user.id)
          .single();
          
        if (!userError && userData) {
          setUserInfo(prev => ({
            ...prev,
            name: userData.nom_complet || prev.name
          }));
        }
        
        // Chargement parallèle des emprunts et prêts
        await Promise.all([
          fetchEmprunts(user.id),
          fetchPrets(user.id)
        ]);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du profil');
    } finally {
      setLoading(false);
    }
  }
  
  /**
   * Récupère la liste des emprunts de l'utilisateur
   * 
   * Processus :
   * 1. Récupère les prêts où l'utilisateur est emprunteur
   * 2. Récupère les informations des matériels associés
   * 3. Combine les données pour l'affichage
   * 
   * @param {string} userId - ID de l'utilisateur connecté
   */
  async function fetchEmprunts(userId: string) {
    try {
      // Récupération des prêts (hors panier)
      const { data: pretsData, error: pretsError } = await supabase
        .from('prets')
        .select(`
          id,
          date_debut,
          date_fin,
          statut,
          materiel_id,
          utilisateurs!prets_proprietaire_id_fkey (
            nom_complet,
            email
          )
        `)
        .eq('emprunteur_id', userId)
        .neq('statut', 'panier');
        
      if (pretsError) throw pretsError;
      
      if (pretsData && pretsData.length > 0) {
        // Récupération des informations des matériels
        const materielIds = pretsData.map(item => item.materiel_id);
        const { data: materielsData, error: materielsError } = await supabase
          .from('materiels')
          .select('id, nom, description, url_image')
          .in('id', materielIds);
          
        if (materielsError) {
          console.error('Erreur récupération des matériels:', materielsError);
        }
        
        // Mapping pour un accès rapide aux données des matériels
        const materielsMap = {};
        if (materielsData) {
          materielsData.forEach(materiel => {
            materielsMap[materiel.id] = materiel;
          });
        }
        
        // Formatage des données pour l'affichage
        const formattedEmprunts = pretsData.map(item => {
          const materiel = materielsMap[item.materiel_id] || {};
          return {
            id: item.id,
            nom: materiel.nom || 'Matériel #' + item.materiel_id,
            description: materiel.description || '',
            image_url: materiel.url_image || '',
            date_debut: new Date(item.date_debut).toLocaleDateString(),
            date_fin: new Date(item.date_fin).toLocaleDateString(),
            statut: item.statut,
            retard: false,
            prolongation_demandee: false,
            prolongation_acceptee: false,
            utilisateur: {
              nom_complet: item.utilisateurs?.nom_complet || 'Utilisateur inconnu',
              email: item.utilisateurs?.email || '',
            }
          };
        });
        
        setEmprunts(formattedEmprunts);
      } else {
        setEmprunts([]);
      }
    } catch (error) {
      console.error('Error fetching emprunts:', error);
    }
  }
  
  /**
   * Récupère la liste des prêts où l'utilisateur est propriétaire
   * Structure similaire à fetchEmprunts mais avec le point de vue du prêteur
   * 
   * @param {string} userId - ID de l'utilisateur connecté
   */
  async function fetchPrets(userId: string) {
    try {
      const { data: pretsData, error: pretsError } = await supabase
        .from('prets')
        .select(`
          id,
          date_debut,
          date_fin,
          statut,
          materiel_id,
          utilisateurs!prets_emprunteur_id_fkey (
            nom_complet,
            email
          )
        `)
        .eq('proprietaire_id', userId)
        .neq('statut', 'panier');
        
      if (pretsError) throw pretsError;
      
      if (pretsData && pretsData.length > 0) {
        const materielIds = pretsData.map(item => item.materiel_id);
        const { data: materielsData, error: materielsError } = await supabase
          .from('materiels')
          .select('id, nom, description, url_image')
          .in('id', materielIds);
          
        if (materielsError) {
          console.error('Erreur récupération des matériels:', materielsError);
        }
        
        const materielsMap = {};
        if (materielsData) {
          materielsData.forEach(materiel => {
            materielsMap[materiel.id] = materiel;
          });
        }
        
        const formattedPrets = pretsData.map(item => {
          const materiel = materielsMap[item.materiel_id] || {};
          return {
            id: item.id,
            nom: materiel.nom || 'Matériel #' + item.materiel_id,
            description: materiel.description || '',
            image_url: materiel.url_image || '',
            date_debut: new Date(item.date_debut).toLocaleDateString(),
            date_fin: new Date(item.date_fin).toLocaleDateString(),
            statut: item.statut,
            retard: false,
            prolongation_demandee: false,
            prolongation_acceptee: false,
            utilisateur: {
              nom_complet: item.utilisateurs?.nom_complet || 'Utilisateur inconnu',
              email: item.utilisateurs?.email || '',
            }
          };
        });
        
        setPrets(formattedPrets);
      } else {
        setPrets([]);
      }
    } catch (error) {
      console.error('Error fetching prets:', error);
    }
  }
  
  /**
   * Gère le rendu d'un élément de prêt dans la liste
   * Affiche les informations et les actions disponibles selon le statut
   * 
   * @param {Object} props - Props du composant
   * @param {ItemType} props.item - L'élément à afficher
   * @returns {React.ReactElement} - Le composant de rendu
   */
  const renderItem = ({ item }: { item: ItemType }) => {
    const isEmprunt = activeTab === 'emprunts';
    
    // Couleurs selon le statut du prêt
    const statusColors = {
      'panier': '#9E9E9E',      // Gris
      'en attente': '#FFC107',  // Jaune
      'approuvé': '#4CAF50',    // Vert
      'actif': '#2196F3',       // Bleu
      'demande_retour': '#FF9800', // Orange
      'retourné': '#9C27B0',    // Violet
      'rejeté': '#F44336',      // Rouge
    };

    /**
     * Gère la demande de prolongation d'un prêt
     * Ajoute 7 jours par défaut à la date de fin actuelle
     */
    const handleProlongation = async () => {
      try {
        const currentEndDate = new Date(item.date_fin);
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + 7);

        const { error } = await supabase
          .from('prets')
          .update({
            prolongation_demandee: true,
            nouvelle_date_fin: newEndDate.toISOString()
          })
          .eq('id', item.id);

        if (error) throw error;

        Alert.alert('Succès', 'Votre demande de prolongation a été envoyée');
        fetchUserProfile();
      } catch (error) {
        console.error('Erreur:', error);
        Alert.alert('Erreur', 'Impossible de demander une prolongation');
      }
    };

    /**
     * Gère la demande de retour d'un prêt par l'emprunteur
     */
    const handleDemandeRetour = async () => {
      try {
        const { error } = await supabase
          .from('prets')
          .update({
            statut: 'demande_retour',
            date_modification: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) throw error;

        Alert.alert('Succès', 'Votre demande de retour a été envoyée');
        fetchUserProfile();
      } catch (error) {
        console.error('Erreur:', error);
        Alert.alert('Erreur', 'Impossible de demander le retour');
      }
    };

    /**
     * Gère la confirmation du retour d'un prêt par le propriétaire
     */
    const handleConfirmRetour = async () => {
      try {
        const { error } = await supabase
          .from('prets')
          .update({
            statut: 'retourné',
            date_modification: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) throw error;

        Alert.alert('Succès', 'Le retour a été confirmé');
        fetchUserProfile();
      } catch (error) {
        console.error('Erreur:', error);
        Alert.alert('Erreur', 'Impossible de confirmer le retour');
      }
    };

    return (
      <View style={[styles.itemCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemImageContainer}>
            {item.image_url ? (
              <Image 
                source={{ uri: item.image_url }} 
                style={styles.itemImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.itemPlaceholder, { backgroundColor: colors.primary + '40' }]}>
                <Ionicons name={isEmprunt ? "arrow-down-circle" : "arrow-up-circle"} size={24} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.nom}</Text>
            <Text style={[styles.userName, { color: colors.textSecondary }]} numberOfLines={1}>
              {isEmprunt ? 'Prêté par' : 'Emprunté par'}: {item.utilisateur.nom_complet}
            </Text>
            <View style={styles.dateRow}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                Du {item.date_debut} au {item.date_fin}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[item.statut] + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColors[item.statut] }]} />
              <Text style={[styles.statusText, { color: statusColors[item.statut] }]}>
                {item.statut.charAt(0).toUpperCase() + item.statut.slice(1)}
              </Text>
            </View>
            
            {item.retard && (
              <View style={[styles.retardBadge, { backgroundColor: colors.danger + '20' }]}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={[styles.retardText, { color: colors.danger }]}>En retard</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            {item.statut === 'actif' && isEmprunt && !item.prolongation_demandee && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleProlongation}
              >
                <Text style={styles.actionButtonText}>Prolonger</Text>
              </TouchableOpacity>
            )}

            {item.statut === 'actif' && isEmprunt && !item.prolongation_demandee && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleDemandeRetour}
              >
                <Text style={styles.actionButtonText}>Demander le retour</Text>
              </TouchableOpacity>
            )}

            {item.statut === 'demande_retour' && !isEmprunt && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={handleConfirmRetour}
              >
                <Text style={styles.actionButtonText}>Confirmer le retour</Text>
              </TouchableOpacity>
            )}

            {item.prolongation_demandee && !isEmprunt && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={() => handleAcceptProlongation(item.id)}
              >
                <Text style={styles.actionButtonText}>Accepter prolongation</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };
  
  /**
   * Rendu pour l'état vide (aucun prêt/emprunt)
   * Affiche un message approprié et un bouton d'action selon le contexte
   * 
   * @returns {React.ReactElement} Composant pour l'état vide
   */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={activeTab === 'emprunts' ? 'arrow-down-circle' : 'arrow-up-circle'} 
        size={60} 
        color={colors.textSecondary}
        style={{ opacity: 0.5 }}
      />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {activeTab === 'emprunts' 
          ? "Vous n'avez pas encore d'emprunts."
          : "Vous n'avez pas pas encore prêté d'objets."}
      </Text>
      <TouchableOpacity 
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/home')}
      >
        <Text style={styles.emptyButtonText}>
          {activeTab === 'emprunts' ? 'Emprunter maintenant' : 'Mettre en prêt'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Rendu du formulaire d'édition du profil
   * Permet à l'utilisateur de modifier ses informations personnelles
   * 
   * @returns {React.ReactElement} Formulaire d'édition du profil
   */
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
            {/* En-tête du formulaire */}
            <View style={[styles.editHeader, { backgroundColor: colors.card }]}>
              <View style={styles.avatarEditContainer}>
                <View style={[styles.avatarEdit, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarEditText}>
                    {profileData.fullName.charAt(0).toUpperCase()}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.editAvatarButton, { backgroundColor: colors.background }]}
                  >
                    <Ionicons name="camera" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Modifier votre profil
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Personnalisez vos informations personnelles
              </Text>
            </View>
            
            {/* Affichage du loader pendant le chargement */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Chargement de vos informations...
                </Text>
              </View>
            ) : (
              <View style={styles.formContainer}>
                {/* Carte principale du formulaire */}
                <View style={[styles.formCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                  {/* Champ : Nom complet */}
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
                  
                  {/* Champ : Biographie */}
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
                  
                  {/* Champ : Localisation */}
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
                  
                  {/* Champ : Téléphone */}
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
                
                {/* Note d'information */}
                <View style={styles.noteCard}>
                  <Ionicons name="information-circle" size={20} color={colors.primary} />
                  <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                    Ces informations vous aideront à personnaliser votre expérience et à faciliter vos interactions avec les autres utilisateurs.
                  </Text>
                </View>
                
                {/* Boutons d'action */}
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

  /**
   * Rendu principal du profil
   * Affiche les informations de l'utilisateur et la liste des prêts/emprunts
   * 
   * @returns {React.ReactElement} Vue principale du profil
   */
  return (
    <SafeScreenView>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement de votre profil...
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* En-tête du profil */}
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <View style={styles.headerTop}>
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerGreeting, { color: colors.textSecondary }]}>
                  Bonjour,
                </Text>
                <Text style={[styles.headerName, { color: colors.text }]}>
                  {userInfo.name}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.settingsButton, { backgroundColor: colors.background }]}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Statistiques utilisateur */}
            <View style={styles.userStatsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {emprunts.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Emprunts
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {prets.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Prêts
                </Text>
              </View>
            </View>
            
            {/* Onglets de navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[
                  styles.tab, 
                  activeTab === 'emprunts' && [styles.activeTab, { borderBottomColor: colors.primary }]
                ]}
                onPress={() => setActiveTab('emprunts')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    { color: activeTab === 'emprunts' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  Mes Emprunts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.tab, 
                  activeTab === 'prets' && [styles.activeTab, { borderBottomColor: colors.primary }]
                ]}
                onPress={() => setActiveTab('prets')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    { color: activeTab === 'prets' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  Mes Prêts
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Liste des prêts/emprunts */}
          <FlatList
            data={activeTab === 'emprunts' ? emprunts : prets}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Modal des détails */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={closeDetailsModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDetailsModal}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeDetailsModal}>
              <Ionicons name="close-circle" size={24} color={colors.text} />
            </TouchableOpacity>
            
            {selectedItem && (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedItem.nom}</Text>
                
                {/* Image du matériel ou placeholder si pas d'image */}
                {selectedItem.image_url ? (
                  <Image 
                    source={{ uri: selectedItem.image_url }}
                    style={styles.modalImageContainer}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.modalImageContainer, { backgroundColor: colors.border + '40' }]}>
                    <Ionicons 
                      name={activeTab === 'emprunts' ? "arrow-down-circle" : "arrow-up-circle"} 
                      size={40} 
                      color={colors.primary} 
                    />
                  </View>
                )}
                
                <Text style={[styles.modalDescription, { color: colors.text }]}>
                  {selectedItem.description || "Aucune description disponible"}
                </Text>
                
                <View style={styles.modalInfoContainer}>
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={[styles.modalInfoText, { color: colors.text }]}>
                      Du {selectedItem.date_debut} au {selectedItem.date_fin}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoItem}>
                    <View style={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: 8, 
                      backgroundColor: {
                        'panier': '#9E9E9E',      // Gris
                        'en attente': '#FFC107',  // Jaune
                        'approuvé': '#4CAF50',    // Vert
                        'actif': '#2196F3',       // Bleu
                        'retourné': '#9C27B0',    // Violet
                        'rejeté': '#F44336',      // Rouge
                      }[selectedItem.statut],
                      justifyContent: 'center',
                      alignItems: 'center'
                    }} />
                    <Text style={[styles.modalInfoText, { color: colors.text }]}>
                      Statut: {selectedItem.statut.charAt(0).toUpperCase() + selectedItem.statut.slice(1)}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="person-outline" size={16} color={colors.primary} />
                    <Text style={[styles.modalInfoText, { color: colors.text }]}>
                      {activeTab === 'emprunts' ? 'Prêté par' : 'Emprunté par'}: {selectedItem.utilisateur.nom_complet}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="mail-outline" size={16} color={colors.primary} />
                    <Text style={[styles.modalInfoText, { color: colors.text }]}>
                      Email: {selectedItem.utilisateur.email || "Non disponible"}
                    </Text>
                  </View>
                </View>
                
                {selectedItem.statut === 'actif' && (
                  <TouchableOpacity 
                    style={[styles.modalActionButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.modalActionButtonText}>
                      {activeTab === 'emprunts' ? 'Demander à retourner' : 'Marquer comme retourné'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeScreenView>
  );
}

/**
 * Styles pour le composant ProfileScreen
 * Organisation en sections logiques :
 * - Container et états de chargement
 * - En-tête et navigation
 * - Cartes de prêt et d'emprunt
 * - Formulaire d'édition
 * - Modal de détails
 */
const styles = StyleSheet.create({
  // Container principal et états de chargement
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },

  // En-tête du profil et navigation
  header: {
    paddingTop: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 14,
  },
  headerName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Statistiques utilisateur
  userStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },

  // Navigation par onglets
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Liste des prêts/emprunts
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 40,
  },
  itemCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 15,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
  },

  // Pied de carte avec statut et actions
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // État vide (pas de prêts/emprunts)
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  // Formulaire d'édition du profil
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

  // Note d'information et boutons d'action
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

  // Modal de détails
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
  },
  modalImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  modalInfoContainer: {
    marginBottom: 20,
  },
  modalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalInfoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  modalActionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalInfoSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  retardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  retardText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});
