import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationContextType {
  location: Location.LocationObject | null;
  address: string | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  getAddressFromCoordinates: (latitude: number, longitude: number) => Promise<string | null>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        setLoading(false);
        return false;
      }
      return true;
    } catch (err) {
      setError('Erreur lors de la demande de permissions: ' + String(err));
      setLoading(false);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(currentLocation);
      
      // Get address for the location
      if (currentLocation) {
        const currentAddress = await getAddressFromCoordinates(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude
        );
        setAddress(currentAddress);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Erreur lors de la récupération de la position: ' + String(err));
      setLoading(false);
    }
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (addressResponse && addressResponse.length > 0) {
        const addressData = addressResponse[0];
        
        // Construire l'adresse formatée
        const addressParts = [
          addressData.street,
          addressData.postalCode,
          addressData.city,
          addressData.region,
          addressData.country
        ].filter(Boolean); // Filtrer les valeurs null/undefined/vides
        
        return addressParts.join(', ');
      }
      return null;
    } catch (err) {
      console.error('Erreur lors du géocodage inverse:', err);
      return null;
    }
  };

  const refreshLocation = async () => {
    setLoading(true);
    await getCurrentLocation();
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        address,
        loading,
        error,
        refreshLocation,
        getAddressFromCoordinates,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation doit être utilisé dans un LocationProvider');
  }
  return context;
}
