import React from 'react';
import { TouchableOpacity, Image, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '@/app/(protected)/styles/add-item.styles';

interface ImagePickerProps {
  image: ImagePicker.ImagePickerAsset | null;
  onImagePicked: (image: ImagePicker.ImagePickerAsset) => void;
  colors: any;
}

export default function ItemImagePicker({ image, onImagePicked, colors }: ImagePickerProps) {
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImagePicked(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.imageContainer, { borderColor: colors.primary }]} 
      onPress={pickImage}
    >
      {image && image.uri ? (
        <>
          <Image source={{ uri: image.uri }} style={styles.image} />
          <View style={styles.imageOverlay}>
            <Ionicons name="camera" size={24} color="#fff" />
          </View>
        </>
      ) : (
        <View style={styles.imagePlaceholder}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={30} color="#fff" />
          </View>
          <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
            Ajouter une photo
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
} 