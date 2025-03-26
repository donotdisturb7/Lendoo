import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
    [key: string]: any;
  };
}

const ItemCard: React.FC<ItemProps> = ({ item }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [loading, setLoading] = useState(false);
  
  async function addToCart(itemId: string) {
    setLoading(true);
    
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
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
        .eq('statut', 'cart')
        .single();
      
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
        
      if (materielError) {
        console.error('Erreur lors de la récupération du matériel:', materielError);
        Alert.alert('Erreur', 'Impossible de récupérer les détails du matériel');
        return;
      }
      
      // Dates par défaut: aujourd'hui et dans 3 jours
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 3); // Location par défaut de 3 jours
      
      let result;
      
      if (existingItem) {
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
        // Ajouter un nouvel article au panier (créer un prêt avec statut 'cart')
        result = await supabase
          .from('prets')
          .insert({
            emprunteur_id: user.id,
            materiel_id: itemId,
            proprietaire_id: materiel.proprietaire_id,
            date_debut: today.toISOString(),
            date_fin: endDate.toISOString(),
            statut: 'cart',
            frais_location: 3 * (materiel.prix || 0), // 3 jours par défaut
            caution_payee: materiel.caution || 0
          });
      }
      
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
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.card,
        borderColor: colors.border 
      }
    ]}>
      <Text style={[styles.title, { color: colors.text }]}>{item.nom}</Text>
      {item.description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      )}
      <Text style={[styles.price, { color: colors.primary }]}>
        {item.prix} € / jour
      </Text>
      {item.caution && (
        <Text style={[styles.caution, { color: colors.textSecondary }]}>
          Caution: {item.caution} €
        </Text>
      )}
      {item.localisation && (
        <Text style={[styles.location, { color: colors.textSecondary }]}>
          Localisation: {item.localisation}
        </Text>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => addToCart(item.id)}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Ajouter au panier</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  caution: {
    fontSize: 12,
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  }
});

export default ItemCard;