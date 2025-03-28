import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function useImageUpload(bucketName: string = 'item-images') {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (image: ImagePicker.ImagePickerAsset): Promise<string | null> => {
    if (!image?.uri) return null;
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      const fileName = `item_${Date.now()}.jpg`;
      
      const response = await fetch(image.uri);
      const blob = await response.blob();
      
      // Upload vers le bucket spécifié
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        // Tentative avec le bucket public en fallback
        if (error.message.includes('does not exist')) {
          const { data: publicData, error: publicError } = await supabase.storage
            .from('public')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: true
            });
            
          if (publicError) {
            throw new Error(`Erreur bucket public: ${publicError.message}`);
          }
          
          const { data: publicUrl } = supabase.storage
            .from('public')
            .getPublicUrl(fileName);
            
          return publicUrl?.publicUrl || null;
        }
        
        throw new Error(error.message);
      }
      
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      return urlData?.publicUrl || null;
    } catch (error: any) {
      console.error('Erreur upload:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
    progress
  };
}
