import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ItemCard from '@/components/ItemCard';
import SafeScreenView from '@/components/SafeScreenView';

// Définir l'interface pour les matériels disponibles
interface Material {
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
  [key: string]: any; // Pour les autres propriétés potentielles
}

// Définition des catégories
interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: "1", name: "Outils", icon: "construct" },
  { id: "2", name: "Électronique", icon: "phone-portrait" },
  { id: "3", name: "Sport", icon: "basketball" },
  { id: "4", name: "Livres", icon: "book" },
  { id: "5", name: "Jardinage", icon: "leaf" },
  { id: "6", name: "Cuisine", icon: "restaurant" },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  
  const [userName, setUserName] = useState('');
  const [availableItems, setAvailableItems] = useState<Material[]>([]);
  const [filteredItems, setFilteredItems] = useState<Material[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userType, setUserType] = useState<"borrower" | "lender">("borrower");
  
  // Garder une référence à l'ID de l'utilisateur connecté
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);
  
  // Filtrer les items quand la catégorie sélectionnée change
  useEffect(() => {
    if (selectedCategory) {
      setFilteredItems(availableItems.filter(item => item.categorie_id === selectedCategory));
    } else {
      setFilteredItems(availableItems);
    }
  }, [selectedCategory, availableItems]);
  
  async function fetchData() {
    // Get user profile data
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Stocker l'ID de l'utilisateur pour le filtrage des objets
      setUserId(user.id);
      
      // Récupérer les informations de l'utilisateur depuis la table utilisateurs
      const { data: userData, error: userError } = await supabase
        .from('utilisateurs')
        .select('nom_complet')
        .eq('id', user.id)
        .single();

      if (userData) {
        setUserName(userData.nom_complet || user.email?.split('@')[0] || 'Utilisateur');
      } else {
        setUserName(user.email?.split('@')[0] || 'Utilisateur');
      }
      
      // Récupérer les matériels disponibles
      const { data, error } = await supabase
        .from('materiels')
        .select('*')
        .eq('disponibilite', true);
        
      if (error) {
        console.error('Erreur lors de la récupération des matériels:', error);
      } else if (data) {
        setAvailableItems(data as Material[]);
      }
    }
  }
  
  // Rendu des catégories
  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity 
      style={[styles.categoryItem, selectedCategory === item.id ? { borderColor: colors.primary, borderWidth: 2 } : null]}
      onPress={() => {
        if (selectedCategory === item.id) {
          // Désélectionner si déjà sélectionné
          setSelectedCategory(null);
        } else {
          setSelectedCategory(item.id);
        }
      }}
    >
      <View style={[styles.categoryIcon, { 
        backgroundColor: selectedCategory === item.id 
          ? colors.primary 
          : (theme === 'dark' ? colors.card : '#f2f2f2') 
      }]}>
        <Ionicons 
          name={item.icon as any} 
          size={24} 
          color={selectedCategory === item.id ? '#fff' : colors.primary} 
        />
      </View>
      <Text style={[styles.categoryText, { color: colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeScreenView>
      
      {/* En-tête avec message de bienvenue et icône de paramètres */}
      <View style={styles.header}>
        <View style={styles.welcomeHeader}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Bonjour {userName} 👋
          </Text>
          {/* <TouchableOpacity onPress={() => router.push("/profile")}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity> */}
        </View>

        {/* Sélecteur de rôle (emprunteur/prêteur) */}
        <View style={[styles.roleSelector, { backgroundColor: theme === 'dark' ? colors.card : '#f2f2f2' }]}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              userType === "borrower" && [styles.activeRoleButton, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setUserType("borrower")}
          >
            <Text
              style={[
                styles.roleButtonText,
                { color: theme === 'dark' ? colors.textSecondary : '#666' },
                userType === "borrower" && styles.activeRoleButtonText,
              ]}
            >
              Emprunter
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              userType === "lender" && [styles.activeRoleButton, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setUserType("lender")}
          >
            <Text
              style={[
                styles.roleButtonText,
                { color: theme === 'dark' ? colors.textSecondary : '#666' },
                userType === "lender" && styles.activeRoleButtonText,
              ]}
            >
              Prêter
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {userType === "borrower" ? (
        <FlatList
          data={filteredItems}
          renderItem={({ item }) => <ItemCard item={item} />}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={[{ textAlign: 'center', marginBottom: 10 }, { color: colors.textSecondary }]}>
                {selectedCategory 
                  ? 'Aucun matériel disponible dans cette catégorie' 
                  : 'Aucun matériel disponible pour le moment'}
              </Text>
              {selectedCategory && (
                <TouchableOpacity 
                  onPress={() => setSelectedCategory(null)}
                  style={[{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }]}
                >
                  <Text style={{ color: '#fff' }}>Voir tous les matériels</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListHeaderComponent={(
            <>
              {/* Affichage des catégories */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Catégories</Text>
              <FlatList
                data={CATEGORIES}
                renderItem={renderCategory}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
                nestedScrollEnabled={true}
              />
              
              {/* Titre de la section matériels */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Matériels disponibles</Text>
                {selectedCategory && (
                  <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                    <Text style={{ color: colors.primary }}>Tout voir</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        />
      ) : (
        <FlatList
          data={availableItems.filter(item => item.proprietaire_id === userId)}
          renderItem={({ item }) => <ItemCard item={item} />}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={<Text style={[{ textAlign: 'center', padding: 20 }, { color: colors.textSecondary }]}>Vous n'avez pas encore d'objets à prêter</Text>}
          ListHeaderComponent={(
            <>
              {/* Vue Prêteur */}
              <View style={styles.lenderStats}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>0</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Objets prêtés</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>0</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Emprunts actifs</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.addItemButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(protected)/add-item")}
              >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.addItemButtonText}>Ajouter un objet</Text>
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes objets</Text>
            </>
          )}
        />
      )}
    </SafeScreenView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    marginTop: 10,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  roleSelector: {
    flexDirection: "row",
    borderRadius: 25,
    padding: 4,
    marginTop: 20,
    marginBottom: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeRoleButton: {
    backgroundColor: '#2E8B57',
  },
  roleButtonText: {
    textAlign: "center",
    fontSize: 16,
  },
  activeRoleButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 0,
    paddingBottom: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 16,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryText: {
    marginTop: 8,
    fontSize: 14,
  },
  lenderStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    width: "45%",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  addItemButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  itemCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  rentButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  rentButtonText: {
    fontWeight: '600',
    fontSize: 14,
  }
});