import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ItemsSection from '@/components/items/ItemsSection';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Material } from '@/types/material';

interface LenderViewProps {
  items: Material[];
  selectedCategory: string | null;
  currentUserId: string | null;
}

export default function LenderView({ items, selectedCategory, currentUserId }: LenderViewProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  // Filtrage des items en fonction de la catégorie sélectionnée
  const filteredItems = selectedCategory 
    ? items.filter(item => item.categorie_id === selectedCategory)
    : items;

  return (
    <View>
      {/* Section "Mes objets" */}
      <ItemsSection 
        title="Mes objets"
        items={filteredItems}
        horizontal={false}
        showSeeAll={false}
        emptyMessage="Vous n'avez pas encore ajouté d'objets"
        selectedCategory={selectedCategory}
        currentUserId={currentUserId}
      />

      {/* Action pour ajouter un nouvel objet */}
      <View style={styles.addItemContainer}>
        <TouchableOpacity 
          onPress={() => router.push("/add-item")}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Ajouter un objet</Text>
        </TouchableOpacity>
      </View>

      {/* Statistiques de prêts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>Statistiques</Text>
        </View>
        
        <View style={[styles.statsContainer, { backgroundColor: theme === 'dark' ? colors.card : '#f0f0f0' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: colors.primary}]}>{items.length}</Text>
            <Text style={[styles.statLabel, {color: colors.text}]}>Objets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: colors.primary}]}>0</Text>
            <Text style={[styles.statLabel, {color: colors.text}]}>En cours</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: colors.primary}]}>0€</Text>
            <Text style={[styles.statLabel, {color: colors.text}]}>Revenus</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addItemContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
});
