import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';

export interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}


export default function CategorySelector({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategorySelectorProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View>
      <Text style={[styles.sectionTitle, {color: colors.text, paddingHorizontal: 16}]}>
        Catégories
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.categoriesContainer}
      >
        {/* Option "Tout" */}
        <TouchableOpacity 
          style={[
            styles.categoryChip, 
            selectedCategory === null 
              ? { backgroundColor: colors.primary } 
              : { backgroundColor: theme === 'dark' ? colors.card : '#f0f0f0' }
          ]}
          onPress={() => onSelectCategory(null)}
        >
          <Text 
            style={[
              styles.categoryChipText, 
              { color: selectedCategory === null ? '#fff' : colors.text }
            ]}
          >
            Tout
          </Text>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity 
            key={category.id}
            style={[
              styles.categoryChip, 
              selectedCategory === category.id 
                ? { backgroundColor: colors.primary } 
                : { backgroundColor: theme === 'dark' ? colors.card : '#f0f0f0' }
            ]}
            onPress={() => onSelectCategory(category.id === selectedCategory ? null : category.id)}
          >
            <Ionicons 
              name={category.icon as any} 
              size={16} 
              color={selectedCategory === category.id ? '#fff' : colors.text} 
              style={styles.categoryChipIcon} 
            />
            <Text 
              style={[
                styles.categoryChipText, 
                { color: selectedCategory === category.id ? '#fff' : colors.text }
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipIcon: {
    marginRight: 4,
  },
  categoryChipText: {
    fontWeight: '500',
  },
});
