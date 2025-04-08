import React from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/app/(protected)/styles/add-item.styles';

interface LocationPickerProps {
  location: {
    address: string;
    latitude: string;
    longitude: string;
  };
  useCurrentLocation: boolean;
  onLocationChange: (address: string) => void;
  onUseCurrentLocationChange: (value: boolean) => void;
  colors: any;
  theme: string;
}

export default function LocationPicker({
  location,
  useCurrentLocation,
  onLocationChange,
  onUseCurrentLocationChange,
  colors,
  theme
}: LocationPickerProps) {
  return (
    <View style={styles.formGroup}>
      <View style={styles.locationHeader}>
        <Text style={[styles.label, { color: colors.text }]}>Adresse</Text>
        <View style={styles.switchContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginRight: 8 }}>Ma position</Text>
          <Switch
            value={useCurrentLocation}
            onValueChange={onUseCurrentLocationChange}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={useCurrentLocation ? '#f4f3f4' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </View>
      
      <View style={styles.inputWrapper}>
        <Ionicons name="location-outline" size={20} color={colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme === 'dark' ? '#333' : '#f8f8f8',
            color: colors.text,
          }]}
          placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
          placeholder="Ex: Paris 11e"
          value={location.address}
          onChangeText={onLocationChange}
          editable={!useCurrentLocation}
        />
      </View>
      
      {useCurrentLocation && location.latitude && location.longitude && (
        <View style={styles.locationInfo}>
          <Ionicons name="navigate" size={16} color={colors.primary} style={{ marginRight: 5 }} />
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Position GPS: {location.latitude.substring(0, 6)}, {location.longitude.substring(0, 6)}
          </Text>
        </View>
      )}
    </View>
  );
} 