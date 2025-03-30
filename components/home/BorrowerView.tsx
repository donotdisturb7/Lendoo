import React from 'react';
import { View } from 'react-native';
import ItemsSection from '@/components/items/ItemsSection';
import { Material } from '@/types/material';

interface BorrowerViewProps {
  items: Material[];
  selectedCategory: string | null;
  currentUserId: string | null;
}

export default function BorrowerView({ items, selectedCategory, currentUserId }: BorrowerViewProps) {
  // Filtrage des items en fonction de la catégorie sélectionnée
  const filteredItems = selectedCategory 
    ? items.filter(item => item.categorie_id === selectedCategory)
    : items;

  return (
    <View>
      {/* Section "Tendances près de chez vous" */}
      <ItemsSection 
        title="Tendances près de chez vous"
        items={filteredItems.filter(item => item.localisation).slice(0, 10)}
        emptyMessage="Aucun objet disponible"
        selectedCategory={selectedCategory}
        currentUserId={currentUserId}
      />

      {/* Section "Récemment ajoutés" */}
      <ItemsSection 
        title="Récemment ajoutés"
        items={[...filteredItems].sort((a, b) => 
          (b.created_at ? new Date(b.created_at).getTime() : 0) - 
          (a.created_at ? new Date(a.created_at).getTime() : 0)
        ).slice(0, 10)}
        emptyMessage="Aucun objet disponible"
        selectedCategory={selectedCategory}
        currentUserId={currentUserId}
      />

      {/* Section "Économique" (prix bas) */}
      <ItemsSection 
        title="Économique"
        items={[...filteredItems].sort((a, b) => a.prix - b.prix).slice(0, 10)}
        emptyMessage="Aucun objet disponible"
        selectedCategory={selectedCategory}
        currentUserId={currentUserId}
      />
    </View>
  );
}
