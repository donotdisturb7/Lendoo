import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/app/(protected)/styles/add-item.styles';

export const CATEGORIES = [
  { id: 'c02e1b4c-12a9-4b0d-8d80-b97315a9e1e5', name: 'Outils', icon: 'construct' },
  { id: 'c01e1b4c-12a9-4b0d-8d80-b97315a9e1e5', name: 'Électronique', icon: 'phone-portrait' },
  { id: 'c03e1b4c-12a9-4b0d-8d80-b97315a9e1e5', name: 'Sport', icon: 'basketball' },
  { id: 'c04e1b4c-12a9-4b0d-8d80-b97315a9e1e5', name: 'Nature', icon: 'leaf' },
  { id: 'c05e1b4c-12a9-4b0d-8d80-b97315a9e1e5', name: 'Musique', icon: 'musical-notes-outline' },
];

interface CategoryPickerProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  colors: any;
  theme: string;
}

export default function CategoryPicker({ selectedCategory, onCategorySelect, colors, theme }: CategoryPickerProps) {
  return (
    <View style={styles.categoriesContainer}>
      {CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id ? 
              { backgroundColor: colors.primary, borderColor: colors.primary } : 
              { backgroundColor: theme === 'dark' ? '#333' : '#f8f8f8', borderColor: theme === 'dark' ? '#555' : '#ddd' }
          ]}
          onPress={() => onCategorySelect(category.id)}
        >
          <View style={styles.categoryIconContainer}>
            <Ionicons 
              name={category.icon as any} 
              size={24} 
              color={selectedCategory === category.id ? '#fff' : colors.primary} 
            />
          </View>
          <Text 
            style={[
              styles.categoryText, 
              { color: selectedCategory === category.id ? '#fff' : colors.text }
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
} 