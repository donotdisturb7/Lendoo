import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ItemService } from '@/services/ItemService';
import { useLocation } from '@/context/LocationContext';

interface FormData {
  nom: string;
  description: string;
  prix: string;
  caution: string;
  categorie_id: string;
  localisation: string;
  latitude: string;
  longitude: string;
  quantite: string;
}

export const useAddItem = (onSuccess: () => void) => {
  const { location, address, getAddressFromCoordinates } = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [form, setForm] = useState<FormData>({
    nom: '',
    description: '',
    prix: '',
    caution: '',
    categorie_id: 'c02e1b4c-12a9-4b0d-8d80-b97315a9e1e5',
    localisation: '',
    latitude: '',
    longitude: '',
    quantite: '',
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

  useEffect(() => {
    if (useCurrentLocation && location) {
      const updateLocation = async () => {
        try {
          const formattedAddress = address || await getAddressFromCoordinates(
            location.coords.latitude,
            location.coords.longitude
          );
          
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

  const handleSubmit = async () => {
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
      let imageUrl = null;
      if (image) {
        console.log('Tentative d\'upload d\'image...');
        imageUrl = await ItemService.uploadImage(image.uri);
        console.log('Résultat URL:', imageUrl);
        
        if (!imageUrl && image) {
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

      const user = await ItemService.getCurrentUser();

      await ItemService.createItem({
        proprietaire_id: user.id,
        categorie_id: form.categorie_id,
        nom: form.nom,
        description: form.description,
        url_image: imageUrl,
        prix: parseFloat(form.prix),
        caution: parseFloat(form.caution),
        disponibilite: true,
        quantite_totale: parseInt(form.quantite) || 1,
        quantite_disponible: parseInt(form.quantite) || 1,
        localisation: form.localisation || 'Non spécifiée',
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });

      Alert.alert(
        'Succès',
        'Votre item a été ajouté avec succès',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const continueSubmitWithoutImage = async () => {
    try {
      const user = await ItemService.getCurrentUser();

      await ItemService.createItem({
        proprietaire_id: user.id,
        categorie_id: form.categorie_id,
        nom: form.nom,
        description: form.description,
        url_image: null,
        prix: parseFloat(form.prix),
        caution: parseFloat(form.caution),
        disponibilite: true,
        quantite_totale: parseInt(form.quantite) || 1,
        quantite_disponible: parseInt(form.quantite) || 1,
        localisation: form.localisation || 'Non spécifiée',
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });

      Alert.alert(
        'Succès',
        'Votre item a été ajouté avec succès (sans image)',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    setForm,
    image,
    setImage,
    isLoading,
    useCurrentLocation,
    setUseCurrentLocation,
    handleSubmit
  };
}; 