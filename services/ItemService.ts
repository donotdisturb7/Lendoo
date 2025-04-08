import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface ItemData {
  proprietaire_id: string;
  categorie_id: string;
  nom: string;
  description: string;
  url_image: string | null;
  prix: number;
  caution: number;
  disponibilite: boolean;
  quantite_totale: number;
  quantite_disponible: number;
  localisation: string;
  latitude: number | null;
  longitude: number | null;
}

export class ItemService {
  static async uploadImage(uri: string): Promise<string | null> {
    try {
      console.log('Début du processus d\'upload...', { imageUri: uri });
      
      const fileName = `item_${Date.now()}.jpg`;
      
      console.log('Lecture du fichier en Base64...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('Conversion en ArrayBuffer...');
      const arrayBuffer = decode(base64);
      
      console.log('Upload vers Supabase...');
      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });
        
      if (error) {
        console.error('Erreur d\'upload Supabase:', error);
        throw error;
      }
      
      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);
        
      console.log('Image uploadée avec succès:', urlData?.publicUrl);
      return urlData?.publicUrl || null;
      
    } catch (error: any) {
      console.error('Erreur complète:', error);
      throw new Error(`Erreur lors de l'upload de l'image: ${error.message}`);
    }
  }

  static async createItem(itemData: ItemData) {
    const { data, error } = await supabase
      .from('materiels')
      .insert(itemData)
      .select();

    if (error) {
      console.error('Erreur ajout item:', error);
      throw new Error("L'ajout de l'item a échoué");
    }

    return data;
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Utilisateur non connecté');
    }

    return user;
  }
} 