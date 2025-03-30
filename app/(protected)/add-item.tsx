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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { useLocation } from '@/context/LocationContext';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

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
  const { location, address, getAddressFromCoordinates } = useLocation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<ImageAsset | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    description: '',
    prix: '',
    caution: '',
    categorie_id: '1',
    localisation: '',
    latitude: '',
    longitude: '',
  });

  // Effet pour demander les permissions de la galerie
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

  // Effet pour mettre à jour la localisation lorsque useCurrentLocation change
  useEffect(() => {
    if (useCurrentLocation && location) {
      const updateLocation = async () => {
        try {
          // Récupérer l'adresse à partir des coordonnées
          const formattedAddress = address || await getAddressFromCoordinates(
            location.coords.latitude,
            location.coords.longitude
          );
          
          // Mettre à jour le formulaire avec les coordonnées et l'adresse
          setForm({
            ...form,
            localisation: formattedAddress || '',
            latitude: location.coords.latitude.toString(),
            longitude: location.coords.longitude.toString()
          });
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la localisation :', error);
        }
      };
      
      updateLocation();
    }
  }, [useCurrentLocation, location, address]);

  const pickImage = async () => {
    try {
      // Modification pour utiliser moins d'options pour éviter les problèmes
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,  // Utilisation de l'énumération correcte
        allowsEditing: true,
        quality: 0.7,  // Qualité réduite pour faciliter l'upload
      });

      console.log('Résultat de l\'image picker:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Conversion explicite en ImageAsset
        const asset = result.assets[0] as ImageAsset;
        console.log('Image sélectionnée:', asset.uri);
        setImage(asset);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Fonction pour générer un ID unique basé sur la date et un nombre aléatoire
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  const uploadImage = async () => {
    if (!image || !image.uri) {
      Alert.alert('Erreur', 'Aucune image à uploader');
      return null;
    }
    
    try {
      console.log('Début du processus d\'upload...');
      // Approche simplifiée : Utiliser directement le fichier URI avec une extension en dur
      const fileName = `item_${Date.now()}.jpg`;
      
      // Détruire le chemin complet pour ne garder que le fichier local
      let localUri = image.uri;
      
      console.log('Chemin de l\'image:', localUri);
      
      // Créer un objet File pour Supabase
      // Pour mobile, on peut utiliser fetch pour obtenir le blob
      const response = await fetch(localUri);
      const blob = await response.blob();
      
      console.log('Taille du blob:', blob.size, 'bytes');
      
      // Upload direct vers le bucket 'avatars' sans vérification préalable
      console.log('Tentative d\'upload direct...');
      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error('Erreur d\'upload Supabase:', error);
        
        // Si le bucket 'avatars' n'existe pas, proposer de le créer
        if (error.message.includes('does not exist')) {
          console.log('Le bucket n\'existe pas. Tentative avec le bucket public...');
          
          // Essayer avec le bucket 'public' qui existe souvent par défaut
          const { data: publicData, error: publicError } = await supabase.storage
            .from('public')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: true
            });
            
          if (publicError) {
            console.error('Erreur avec le bucket public:', publicError);
            Alert.alert(
              'Configuration Supabase requise',
              'Créez un bucket nommé "item-images" dans votre projet Supabase (section Storage)'
            );
            return null;
          }
          
          // Récupérer l'URL du bucket public
          const { data: publicUrl } = supabase.storage
            .from('public')
            .getPublicUrl(fileName);
            
          console.log('Image uploadée avec succès dans public:', publicUrl?.publicUrl);
          return publicUrl?.publicUrl || null;
        }
        
        Alert.alert('Erreur d\'upload', `Détail: ${error.message}`);
        return null;
      }
      
      // Récupérer l'URL publique de l'image
      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);
      
      console.log('Upload réussi:', urlData?.publicUrl);
      return urlData?.publicUrl || null;
    } catch (error) {
      console.error('Erreur générale:', error);
      Alert.alert('Erreur', 'Erreur lors de l\'upload de l\'image. Vérifiez votre connexion internet.');
      return null;
    }
  };

  const handleSubmit = async () => {
    // Validation basique
    if (!form.nom || !form.description || !form.prix || !form.caution) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (!image) {
      Alert.alert('Attention', 'Aucune image sélectionnée. Souhaitez-vous continuer sans image ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', onPress: () => processSubmit() }
      ]);
      return;
    }
    
    await processSubmit();
  };
  
  const processSubmit = async () => {

    setIsLoading(true);

    try {
      // 1. Upload de l'image (si une image est sélectionnée)
      let imageUrl = null;
      if (image) {
        console.log('Tentative d\'upload d\'image...');
        imageUrl = await uploadImage();
        console.log('Résultat URL:', imageUrl);
        
        if (!imageUrl && image) {
          // L'upload a échoué mais nous avons une image
          Alert.alert(
            'Avertissement', 
            "L'upload de l'image a échoué. Voulez-vous continuer sans image ?",
            [
              { text: 'Annuler', style: 'cancel', onPress: () => setIsLoading(false) },
              { text: 'Continuer', onPress: () => continueSubmitWithoutImage() }
            ]
          );
          return;
        }
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
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
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
  
  const continueSubmitWithoutImage = async () => {
    try {
      // 2. Récupérer l'ID de l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        setIsLoading(false);
        return;
      }
      // 3. Ajouter l'item dans la base de données sans image
      const { data, error } = await supabase
        .from('materiels')
        .insert({
          proprietaire_id: user.id,
          categorie_id: form.categorie_id,
          nom: form.nom,
          description: form.description,
          url_image: null, // Pas d'image
          prix: parseFloat(form.prix),
          caution: parseFloat(form.caution),
          disponibilite: true,
          localisation: form.localisation || 'Non spécifiée',
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
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
        'Votre item a été ajouté avec succès (sans image)',
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
          <View style={styles.locationHeader}>
            <Text style={[styles.label, { color: colors.text }]}>Localisation</Text>
            <View style={styles.switchContainer}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginRight: 8 }}>Utiliser ma position</Text>
              <Switch
                value={useCurrentLocation}
                onValueChange={setUseCurrentLocation}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={useCurrentLocation ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
          </View>
          
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
            editable={!useCurrentLocation} // Désactiver si utilisant la position actuelle
          />
          
          {useCurrentLocation && (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={16} color={colors.primary} style={{ marginRight: 5 }} />
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Position GPS: {form.latitude ? form.latitude.substring(0, 6) : '?'}, {form.longitude ? form.longitude.substring(0, 6) : '?'}
              </Text>
            </View>
          )}
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
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
