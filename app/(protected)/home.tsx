import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import SafeScreenView from '@/components/SafeScreenView';

// Composants nouvellement créés
import HomeHeader from '@/components/home/HomeHeader';
import RoleSelector from '@/components/home/RoleSelector';
import CategorySelector, { Category } from '@/components/home/CategorySelector';
import BorrowerView from '@/components/home/BorrowerView';
import LenderView from '@/components/home/LenderView';

// Hook personnalisé
import useHomeData from '@/hooks/useHomeData';

// Définition des catégories
const CATEGORIES: Category[] = [
  { id: "c02e1b4c-12a9-4b0d-8d80-b97315a9e1e5", name: "Outils", icon: "construct" },
  { id: "c01e1b4c-12a9-4b0d-8d80-b97315a9e1e5", name: "Électronique", icon: "phone-portrait" },
  { id: "c03e1b4c-12a9-4b0d-8d80-b97315a9e1e5", name: "Sport", icon: "basketball" },
  { id: "c04e1b4c-12a9-4b0d-8d80-b97315a9e1e5", name: "Nature", icon: "leaf" },
  { id: "c05e1b4c-12a9-4b0d-8d80-b97315a9e1e5", name: "Musique", icon: "musical-notes-outline" },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  // État pour l'interface utilisateur
  const [userType, setUserType] = useState<'borrower' | 'lender'>('borrower');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Récupération des données via notre hook personnalisé
  const { 
    userName, 
    currentUserId, 
    availableItems, 
    myItems,
    isLoading,
    error,
    refreshData 
  } = useHomeData();
  
  // Rafraîchir les données au focus
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen focused - refreshing data');
      refreshData();
      return () => {
        // Nettoyage si nécessaire
      };
    }, [refreshData])
  );
  
  // Gestion des changements de catégorie
  const handleCategoryChange = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
  }, []);
  
  // Gestion des changements de rôle
  const handleUserTypeChange = useCallback((type: 'borrower' | 'lender') => {
    setUserType(type);
  }, []);

  return (
    <SafeScreenView
      reduceTopPadding={true}
      contentStyle={styles.screenContent}
    >
      <View style={styles.header}>
        {/* Composant d'en-tête */}
        <HomeHeader userName={userName} showSettings={false} />
        
        {/* Sélecteur de rôle */}
        <RoleSelector 
          userType={userType} 
          onUserTypeChange={handleUserTypeChange} 
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement des données...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Sélecteur de catégories */}
          <CategorySelector 
            categories={CATEGORIES} 
            selectedCategory={selectedCategory} 
            onSelectCategory={handleCategoryChange}
          />
          
          {/* Afficher la vue en fonction du rôle sélectionné */}
          {userType === 'borrower' ? (
            <BorrowerView 
              items={availableItems} 
              selectedCategory={selectedCategory} 
              currentUserId={currentUserId} 
            />
          ) : (
            <LenderView 
              items={myItems} 
              selectedCategory={selectedCategory} 
              currentUserId={currentUserId} 
            />
          )}
        </ScrollView>
      )}
    </SafeScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: 1,
  },
  header: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
