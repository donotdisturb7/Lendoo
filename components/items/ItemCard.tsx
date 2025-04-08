import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

interface ItemProps {
  item: {
    id: string;
    nom: string;
    description?: string;
    disponibilite: boolean;
    prix: number;
    caution?: number;
    url_image?: string;
    localisation?: string;
    proprietaire_id: string;
    categorie_id: string;
    proprietaire_nom?: string;
    quantite_disponible: number;
    quantite_totale: number;
    prochaine_disponibilite?: string;
    [key: string]: any;
  };
  currentUserId?: string | null;
  showModal?: boolean;
}

const ItemCard: React.FC<ItemProps> = ({ item, currentUserId }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [loading, setLoading] = useState(false);
  const [ownerName, setOwnerName] = useState<string>(item.proprietaire_nom || 'Utilisateur');
  const [modalVisible, setModalVisible] = useState(false);
  
  // Récupérer le nom du propriétaire si non fourni
  useEffect(() => {
    if (!item.proprietaire_nom) {
      async function getOwnerName() {
        const { data: userData, error: userError } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('id', item.proprietaire_id)
          .single();
        
        if (userData && !userError) {
  
          if (userData.prenom && userData.nom) {
            setOwnerName(`${userData.prenom} ${userData.nom}`);
            return;
          }
          if (userData.nom_complet) {
            setOwnerName(userData.nom_complet);
            return;
          }
          
          if (userData.email) {
            setOwnerName(userData.email.split('@')[0]);
            return;
          }
        }
        setOwnerName('Utilisateur');
      }
      
      getOwnerName();
    }
  }, [item.proprietaire_id, item.proprietaire_nom]);
  
  async function addToCart(itemId: string) {
    setLoading(true);
    console.log('Début addToCart pour itemId:', itemId);
    
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Utilisateur connecté:', user?.id);
      
      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour ajouter au panier');
        return;
      }
      
      // Vérifier si l'article est déjà dans le panier
      const { data: existingItem, error: checkError } = await supabase
        .from('prets')
        .select('id, date_debut, date_fin, frais_location')
        .eq('emprunteur_id', user.id)
        .eq('materiel_id', itemId)
        .eq('statut', 'panier')
        .single();
      
      console.log('Vérification panier:', { existingItem, checkError });
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Erreur lors de la vérification du panier:', checkError);
        Alert.alert('Erreur', 'Impossible de vérifier votre panier');
        return;
      }
      
      // Récupérer les détails du matériel
      const { data: materiel, error: materielError } = await supabase
        .from('materiels')
        .select('*')
        .eq('id', itemId)
        .single();
      
      console.log('Détails matériel:', { materiel, materielError });
        
      if (materielError) {
        console.error('Erreur lors de la récupération du matériel:', materielError);
        Alert.alert('Erreur', 'Impossible de récupérer les détails du matériel');
        return;
      }

      // Vérifier la disponibilité
      if (materiel.quantite_disponible <= 0) {
        if (materiel.prochaine_disponibilite) {
          Alert.alert(
            'Non disponible',
            `Cet article sera disponible à partir du ${new Date(materiel.prochaine_disponibilite).toLocaleDateString()}`
          );
        } else {
          Alert.alert('Non disponible', 'Cet article n\'est plus disponible pour le moment');
        }
        return;
      }
      
      // Dates par défaut: aujourd'hui et dans 3 jours
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 3); // Location par défaut de 3 jours
      
      let result;
      
      if (existingItem) {
        console.log('Mise à jour article existant dans le panier');
        // Mettre à jour la durée si l'article existe déjà dans le panier
        const newEndDate = new Date(existingItem.date_fin);
        newEndDate.setDate(newEndDate.getDate() + 1); // Ajouter un jour
        
        // Calculer le nouveau prix
        const days = Math.ceil((newEndDate.getTime() - new Date(existingItem.date_debut).getTime()) / (1000 * 60 * 60 * 24));
        const newPrice = days * (materiel.prix || 0);
        
        result = await supabase
          .from('prets')
          .update({ 
            date_fin: newEndDate.toISOString(),
            frais_location: newPrice
          })
          .eq('id', existingItem.id);
      } else {
        console.log('Ajout nouvel article au panier');
        // Ajouter un nouvel article au panier
        result = await supabase
          .from('prets')
          .insert({
            emprunteur_id: user.id,
            materiel_id: itemId,
            proprietaire_id: materiel.proprietaire_id,
            date_debut: today.toISOString(),
            date_fin: endDate.toISOString(),
            statut: 'panier',
            frais_location: 3 * (materiel.prix || 0), // 3 jours par défaut
            caution_payee: materiel.caution || 0
          });
      }
      
      console.log('Résultat opération:', result);
      
      if (result.error) {
        console.error('Erreur lors de l\'ajout au panier:', result.error);
        Alert.alert('Erreur', 'Impossible d\'ajouter l\'article au panier');
      } else {
        Alert.alert('Succès', 'Article ajouté au panier avec succès');
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.card,
          borderColor: colors.border 
        }
      ]}
      activeOpacity={0.9}
    >
      {/* Background image avec overlay pour le texte */}
      {item.url_image ? (
        <Image 
          source={{ uri: item.url_image }} 
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]} />
      )}
      
      {/* Badge pour la localisation */}
      {item.localisation && (
        <View style={[styles.locationBadge, { backgroundColor: colors.cardHighlight }]}>
          <Ionicons name="location-outline" size={12} color={colors.text} />
          <Text style={[styles.locationBadgeText, { color: colors.text }]}>
            {item.localisation}
          </Text>
        </View>
      )}
      
      {/* Contenu textuel */}
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.nom}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {item.prix}€/jour
          </Text>
          <Text style={[styles.owner, { color: colors.textSecondary }]}>
            Par {ownerName}
          </Text>
        </View>
        
        {/* Bouton d'action */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { 
              backgroundColor: item.proprietaire_id === currentUserId ? colors.border : colors.primary 
            }]}
            onPress={() => item.proprietaire_id === currentUserId ? null : addToCart(item.id)}
            disabled={item.proprietaire_id === currentUserId}
          >
            <Text style={[styles.buttonText, { 
              color: item.proprietaire_id === currentUserId ? colors.textSecondary : '#ffffff' 
            }]}>
              {item.proprietaire_id === currentUserId ? "Mes objets" : "Ajouter"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.infoButton, { borderColor: colors.border }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Modal avec plus d'informations */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <Text style={[styles.modalTitle, { color: colors.text }]}>{item.nom}</Text>
              
              {item.url_image && (
                <Image 
                  source={{ uri: item.url_image }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
              
              <Text style={[styles.modalDescription, { color: colors.text }]}>
                {item.description || "Aucune description disponible"}
              </Text>
              
              <View style={styles.modalInfoContainer}>
                <View style={styles.modalInfoItem}>
                  <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
                  <Text style={[styles.modalInfoText, { color: colors.text }]}>{item.prix}€/jour</Text>
                </View>
                
                <View style={styles.modalInfoItem}>
                  <Ionicons name="cube-outline" size={16} color={colors.primary} />
                  <Text style={[styles.modalInfoText, { color: colors.text }]}>
                    {item.quantite_disponible} sur {item.quantite_totale} disponible{item.quantite_totale > 1 ? 's' : ''}
                  </Text>
                </View>
                
                {item.prochaine_disponibilite && item.quantite_disponible === 0 && (
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={[styles.modalInfoText, { color: colors.text }]}>
                      Prochain disponible le {new Date(item.prochaine_disponibilite).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                
                {item.caution && (
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="shield-outline" size={16} color={colors.primary} />
                    <Text style={[styles.modalInfoText, { color: colors.text }]}>Caution: {item.caution}€</Text>
                  </View>
                )}
                
                {item.localisation && (
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="location-outline" size={16} color={colors.primary} />
                    <Text style={[styles.modalInfoText, { color: colors.text }]}>{item.localisation}</Text>
                  </View>
                )}
                
                <View style={styles.modalInfoItem}>
                  <Ionicons name="person-outline" size={16} color={colors.primary} />
                  <Text style={[styles.modalInfoText, { color: colors.text }]}>Propriétaire: {ownerName}</Text>
                </View>
              </View>
              
              {item.proprietaire_id !== currentUserId && (
                <TouchableOpacity 
                  style={[styles.modalAddButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    addToCart(item.id);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalAddButtonText}>Ajouter au panier</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
    height: 210,
  },
  image: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#e0e0e0',
  },
  locationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  contentContainer: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
  },
  caution: {
    fontSize: 10,
  },
  button: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  owner: {
    fontSize: 12,
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  infoButton: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
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
  modalAddButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalAddButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ItemCard;