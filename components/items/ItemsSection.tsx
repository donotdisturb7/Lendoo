import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ItemCard from '@/components/items/ItemCard'
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

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
  [key: string]: any;
}

interface ItemsSectionProps {
  title: string;
  items: Material[];
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
  horizontal?: boolean;
  emptyMessage?: string;
  selectedCategory?: string | null;
  currentUserId?: string | null;
}

const ItemsSection: React.FC<ItemsSectionProps> = ({
  title,
  items,
  showSeeAll = true,
  onSeeAllPress,
  horizontal = true,
  emptyMessage = "Aucun objet disponible",
  selectedCategory,
  currentUserId
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, {color: colors.text}]}>{title}</Text>
        {/* {showSeeAll && items.length > 0 && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <Text style={[styles.seeAllButton, {color: colors.primary}]}>Voir tout</Text>
          </TouchableOpacity>
        )} */}
      </View>
      
      {horizontal ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={items.length === 0 ? styles.emptyScrollContainer : {paddingHorizontal: 16}}
        >
          {items.length > 0 ? (
            items.map(item => (
              <ItemCard key={item.id} item={item} currentUserId={currentUserId} />
            ))
          ) : (
            <View style={styles.emptySection}>
              <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
                {emptyMessage}{selectedCategory ? ' dans cette catégorie' : ''}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.gridContainer}>
          {items.length > 0 ? (
            items.map(item => (
              <View key={item.id} style={styles.gridItem}>
                <ItemCard item={item} currentUserId={currentUserId} />
              </View>
            ))
          ) : (
            <View style={styles.emptyFullSection}>
              <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
                {emptyMessage}{selectedCategory ? ' dans cette catégorie' : ''}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
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
  seeAllButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyScrollContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  emptySection: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
  },
  emptyFullSection: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyText: {
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
});

export default ItemsSection;
