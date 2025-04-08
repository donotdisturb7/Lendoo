import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import SafeScreenView from '@/components/SafeScreenView';
import ItemImagePicker from '@/components/items/ImagePicker';
import CategoryPicker from '@/components/items/CategoryPicker';
import LocationPicker from '@/components/items/LocationPicker';
import { useAddItem } from '@/hooks/useAddItem';
import { styles } from './styles/add-item.styles';

export default function AddItemScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const {
    form,
    setForm,
    image,
    setImage,
    isLoading,
    useCurrentLocation,
    setUseCurrentLocation,
    handleSubmit
  } = useAddItem(() => router.replace('/(protected)/home'));

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
        <ItemImagePicker
          image={image}
          onImagePicked={setImage}
          colors={colors}
        />

        <View style={styles.card}>
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations générales</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nom de l'objet</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="pricetag-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme === 'dark' ? '#333' : '#f8f8f8',
                    color: colors.text,
                  }]}
                  placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
                  placeholder="Ex: Perceuse Bosch"
                  value={form.nom}
                  onChangeText={(text) => setForm({ ...form, nom: text })}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Catégorie</Text>
              <CategoryPicker
                selectedCategory={form.categorie_id}
                onCategorySelect={(categoryId) => setForm({ ...form, categorie_id: categoryId })}
                colors={colors}
                theme={theme}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 12 }]} />
                <TextInput
                  style={[styles.input, styles.textArea, { 
                    backgroundColor: theme === 'dark' ? '#333' : '#f8f8f8',
                    color: colors.text,
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
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarification</Text>
            
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Prix (€/jour)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="cash-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme === 'dark' ? '#333' : '#f8f8f8',
                      color: colors.text,
                    }]}
                    placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
                    placeholder="Ex: 15"
                    keyboardType="numeric"
                    value={form.prix}
                    onChangeText={(text) => setForm({ ...form, prix: text })}
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Caution (€)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="wallet-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme === 'dark' ? '#333' : '#f8f8f8',
                      color: colors.text,
                    }]}
                    placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
                    placeholder="Ex: 100"
                    keyboardType="numeric"
                    value={form.caution}
                    onChangeText={(text) => setForm({ ...form, caution: text })}
                  />
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Localisation</Text>
            <LocationPicker
              location={{
                address: form.localisation,
                latitude: form.latitude,
                longitude: form.longitude
              }}
              useCurrentLocation={useCurrentLocation}
              onLocationChange={(address) => setForm({ ...form, localisation: address })}
              onUseCurrentLocationChange={setUseCurrentLocation}
              colors={colors}
              theme={theme}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Quantité disponible</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Nombre d'exemplaires disponibles"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={form.quantite}
              onChangeText={(text) => setForm({ ...form, quantite: text })}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
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
