import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import SafeScreenView from '@/components/SafeScreenView';

// Interface pour les éléments du panier
interface CartItem {
  id: string;
  date_creation: string;
  date_modification: string;
  materiel_id: string;
  emprunteur_id: string;
  date_debut: string;
  date_fin: string;
  date_retour?: string;
  statut: string;
  frais_location: number;
  caution_payee: number;
  caution_rendue?: boolean;
  notes?: string;
  proprietaire_id: string;
  materiel: {
    id: string;
    nom: string;
    description?: string;
    prix: number;
    caution: number;
    url_image?: string;
    localisation?: string;
  };
}

export default function CartScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Utiliser useFocusEffect pour recharger les données chaque fois que l'écran reçoit le focus (changement d'onglet)
  useFocusEffect(
    useCallback(() => {
      console.log('CartScreen focused - refreshing data');
      fetchCartItems();
      return () => {
        // Fonction de nettoyage (optionnelle) exécutée quand l'écran perd le focus
      };
    }, [])
  );
  
  async function fetchCartItems() {
    setLoading(true);
    console.log('Début fetchCartItems');
    
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Utilisateur connecté:', user?.id);
      
      if (user) {
        // Récupérer les éléments du panier (prêts avec statut 'panier')
        const { data, error } = await supabase
          .from('prets')
          .select(`
            id,
            date_creation,
            date_modification,
            materiel_id,
            emprunteur_id,
            date_debut,
            date_fin,
            date_retour,
            statut,
            frais_location,
            caution_payee,
            caution_rendue,
            notes,
            proprietaire_id,
            materiel:materiels(id, nom, description, prix, caution, url_image, localisation)
          `)
          .eq('emprunteur_id', user.id)
          .eq('statut', 'panier');
          
        console.log('Résultat requête panier:', { data, error });
          
        if (error) {
          console.error('Erreur lors de la récupération du panier:', error);
          Alert.alert('Erreur', 'Impossible de charger votre panier');
        } else if (data) {
          // S'assurer que les données sont correctement typées
          const typedData = data.map(item => ({
            ...item,
            materiel: Array.isArray(item.materiel) ? item.materiel[0] : item.materiel
          })) as CartItem[];
          
          console.log('Données typées:', typedData);
          
          setCartItems(typedData);
          
          // Calculer le prix total
          const total = typedData.reduce((sum, item) => {
            return sum + (item.frais_location || 0);
          }, 0);
          
          console.log('Prix total calculé:', total);
          
          setTotalPrice(total);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }
  
  async function updateItemQuantity(itemId: string, newDays: number) {
    if (newDays < 1) {
      // Si le nombre de jours est inférieur à 1, supprimer l'article
      removeItem(itemId);
      return;
    }
    
    try {
      // Trouver l'article dans le panier
      const cartItem = cartItems.find(item => item.id === itemId);
      if (!cartItem || !cartItem.materiel) {
        Alert.alert('Erreur', 'Article introuvable');
        return;
      }
      
      // Calculer la nouvelle date de fin en fonction du nombre de jours
      const startDate = new Date(cartItem.date_debut);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + newDays);
      
      // Calculer le nouveau prix en fonction du nombre de jours
      const newPrice = newDays * (cartItem.materiel.prix || 0);
      
      const { error } = await supabase
        .from('prets')
        .update({ 
          date_fin: endDate.toISOString(),
          frais_location: newPrice
        })
        .eq('id', itemId);
        
      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        Alert.alert('Erreur', 'Impossible de mettre à jour la durée de location');
      } else {
        // Mettre à jour l'état local
        const updatedItems = cartItems.map(item => {
          if (item.id === itemId) {
            return { 
              ...item, 
              date_fin: endDate.toISOString(),
              frais_location: newPrice
            };
          }
          return item;
        });
        
        setCartItems(updatedItems);
        
        // Recalculer le prix total
        const total = updatedItems.reduce((sum, item) => {
          return sum + (item.frais_location || 0);
        }, 0);
        
        setTotalPrice(total);
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  }
  
  async function removeItem(itemId: string) {
    try {
      const { error } = await supabase
        .from('prets')
        .delete()
        .eq('id', itemId);
        
      if (error) {
        console.error('Erreur lors de la suppression:', error);
        Alert.alert('Erreur', 'Impossible de supprimer l\'article');
      } else {
        // Mettre à jour l'état local
        const updatedItems = cartItems.filter(item => item.id !== itemId);
        setCartItems(updatedItems);
        
        // Recalculer le prix total
        const total = updatedItems.reduce((sum, item) => {
          return sum + (item.frais_location || 0);
        }, 0);
        
        setTotalPrice(total);
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  }
  
  async function checkout() {
    if (cartItems.length === 0) {
      Alert.alert('Panier vide', 'Votre panier est vide');
      return;
    }
    
    // Demander confirmation avant de procéder
    Alert.alert(
      'Confirmer la demande',
      'Voulez-vous vraiment soumettre cette demande de location ? Le propriétaire devra l\'approuver.',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              const { data: { user } } = await supabase.auth.getUser();
              
              if (user) {
                // Mettre à jour le statut des prêts de 'panier' à 'en attente'
                const cartItemIds = cartItems.map(item => item.id);
                
                const { error: updateError } = await supabase
                  .from('prets')
                  .update({ 
                    statut: 'en attente',
                    date_modification: new Date().toISOString()
                  })
                  .in('id', cartItemIds);
                  
                if (updateError) {
                  console.error('Erreur lors de la validation de la commande:', updateError);
                  Alert.alert('Erreur', 'Impossible de finaliser votre commande');
                  return;
                }
                
                // Mettre à jour l'état local
                setCartItems([]);
                setTotalPrice(0);
                
                Alert.alert(
                  'Demande envoyée', 
                  'Votre demande de location a été envoyée aux propriétaires pour validation. Vous serez notifié de leur réponse.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Erreur:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la validation');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }
  
  // Calculer le nombre de jours entre deux dates
  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const renderCartItem = ({ item }: { item: CartItem }) => {
    // Calculer le nombre de jours de location
    const days = calculateDays(item.date_debut, item.date_fin);
    
    return (
      <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.materiel.nom}</Text>
          {item.materiel.description && (
            <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
              {item.materiel.description}
            </Text>
          )}
          <Text style={[styles.itemPrice, { color: colors.primary }]}>
            {item.materiel.prix} € / jour
          </Text>
          <Text style={[styles.itemDates, { color: colors.textSecondary }]}>
            Du {new Date(item.date_debut).toLocaleDateString()} au {new Date(item.date_fin).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={[styles.quantityButton, { backgroundColor: colors.primary }]}
            onPress={() => updateItemQuantity(item.id, days - 1)}
          >
            <Ionicons name="remove" size={16} color={colors.buttonText} />
          </TouchableOpacity>
          
          <Text style={[styles.quantity, { color: colors.text }]}>{days} jour{days > 1 ? 's' : ''}</Text>
          
          <TouchableOpacity 
            style={[styles.quantityButton, { backgroundColor: colors.primary }]}
            onPress={() => updateItemQuantity(item.id, days + 1)}
          >
            <Ionicons name="add" size={16} color={colors.buttonText} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeScreenView
      reduceTopPadding={true}
      contentStyle={styles.screenContent}
    >
      <Text style={[styles.title, { color: colors.text }]}>Mon Panier</Text>
      
      {loading ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chargement...</Text>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Votre panier est vide
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Ajoutez des articles depuis la page d'accueil
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          />
          
          <View style={[styles.summaryContainer, { borderTopColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Total:</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalPrice.toFixed(2)} €</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
              onPress={checkout}
            >
              <Text style={[styles.checkoutButtonText, { color: colors.buttonText }]}>
                Valider la commande
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeScreenView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    flexGrow: 1,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDates: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  summaryContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkoutButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});