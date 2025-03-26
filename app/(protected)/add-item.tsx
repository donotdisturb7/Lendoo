import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

// Type personnalisé pour l'asset d'image avec base64
interface ImageAsset extends ImagePicker.ImagePickerAsset {
  base64?: string;
}
import { Picker } from '@react-native-picker/picker';
import SafeScreenView from '@/components/SafeScreenView';
// Fonction pour convertir une chaîne base64 en Blob

const CATEGORIES = [
  { id: '1', name: 'Outillage', icon: 'hammer' },
  { id: '2', name: 'Jardinage', icon: 'leaf' },
  { id: '3', name: 'Cuisine', icon: 'restaurant' },
  { id: '4', name: 'Sport', icon: 'football' },
  { id: '5', name: 'Électronique', icon: 'laptop' },
  { id: '6', name: 'Autre', icon: 'ellipsis-horizontal' },
];

export default function AddItemScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<ImageAsset | null>(null);
  const [form, setForm] = useState({
    nom: '',
    description: '',
    prix: '',
    caution: '',
    categorie_id: '1',
    localisation: '',
  });

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à votre galerie.');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Conversion explicite en ImageAsset
      const asset = result.assets[0] as ImageAsset;
      setImage(asset);
    }
  };

  // Fonction pour générer un ID unique basé sur la date et un nombre aléatoire
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  const uploadImage = async () => {
    if (!image || !image.base64) return null;
    
    try {
      const fileName = `${generateUniqueId()}.jpg`;
      const filePath = `public/${fileName}`;
      const contentType = 'image/jpeg';
      
      // Convertir base64 en blob
      const base64Response = await fetch(`data:image/jpeg;base64,${image.base64}`);
      const blob = await base64Response.blob();
      
      const { error } = await supabase.storage
        .from('item-images')
        .upload(filePath, blob, {
          contentType,
          upsert: true,
        });
        
      if (error) {
        console.error('Erreur upload image:', error);
        return null;
      }
      
      // Récupérer l'URL publique de l'image
      const { data } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);
        
      return data?.publicUrl || null;
    } catch (error) {
      console.error('Erreur:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Validation basique
    if (!form.nom || !form.description || !form.prix || !form.caution || !image) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs et ajouter une image');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload de l'image
      const imageUrl = await uploadImage();
      if (!imageUrl) {
        Alert.alert('Erreur', "L'upload de l'image a échoué");
        setIsLoading(false);
        return;
      }

      // 2. Récupérer l'ID de l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        setIsLoading(false);
        return;
      }

      // 3. Ajouter l'item dans la base de données
      const { data, error } = await supabase
        .from('materiels')
        .insert({
          proprietaire_id: user.id,
          categorie_id: form.categorie_id,
          nom: form.nom,
          description: form.description,
          url_image: imageUrl,
          prix: parseFloat(form.prix),
          caution: parseFloat(form.caution),
          disponibilite: true,
          localisation: form.localisation || 'Non spécifiée',
        })
        .select();

      if (error) {
        console.error('Erreur ajout item:', error);
        Alert.alert('Erreur', "L'ajout de l'item a échoué");
        setIsLoading(false);
        return;
      }

      Alert.alert(
        'Succès',
        'Votre item a été ajouté avec succès',
        [{ text: 'OK', onPress: () => router.replace('/(protected)/home') }]
      );
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreenView style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ajouter un objet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={[styles.imageContainer, { borderColor: colors.border }]} 
          onPress={pickImage}
        >
          {image && image.uri ? (
            <Image source={{ uri: image.uri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color={colors.primary} />
              <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                Ajouter une photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nom de l'objet</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: colors.text,
              borderColor: theme === 'dark' ? '#555' : '#ddd'
            }]}
            placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
            placeholder="Ex: Perceuse Bosch"
            value={form.nom}
            onChangeText={(text) => setForm({ ...form, nom: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Catégorie</Text>
          <View style={[styles.pickerContainer, { 
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            borderColor: theme === 'dark' ? '#555' : '#ddd'
          }]}>
            <Picker
              selectedValue={form.categorie_id}
              onValueChange={(itemValue: string) => setForm({ ...form, categorie_id: itemValue })}
              style={{ color: colors.text }}
              dropdownIconColor={colors.text}
            >
              {CATEGORIES.map((category) => (
                <Picker.Item 
                  key={category.id} 
                  label={category.name} 
                  value={category.id} 
                  color={theme === 'dark' ? '#fff' : '#000'}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { 
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: colors.text,
              borderColor: theme === 'dark' ? '#555' : '#ddd'
            }]}
            placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
            placeholder="Décrivez votre objet (état, caractéristiques, etc.)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Prix (€/jour)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: colors.text,
                borderColor: theme === 'dark' ? '#555' : '#ddd'
              }]}
              placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
              placeholder="Ex: 15"
              keyboardType="numeric"
              value={form.prix}
              onChangeText={(text) => setForm({ ...form, prix: text })}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Caution (€)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: colors.text,
                borderColor: theme === 'dark' ? '#555' : '#ddd'
              }]}
              placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
              placeholder="Ex: 100"
              keyboardType="numeric"
              value={form.caution}
              onChangeText={(text) => setForm({ ...form, caution: text })}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Localisation</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: colors.text,
              borderColor: theme === 'dark' ? '#555' : '#ddd'
            }]}
            placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
            placeholder="Ex: Paris 11e"
            value={form.localisation}
            onChangeText={(text) => setForm({ ...form, localisation: text })}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Ajouter l'objet</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeScreenView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
