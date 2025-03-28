import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Material } from '@/types/material';

export interface HomeData {
  userName: string;
  currentUserId: string | null;
  availableItems: Material[];
  myItems: Material[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export default function useHomeData(): HomeData {
  const [userName, setUserName] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<Material[]>([]);
  const [myItems, setMyItems] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Récupérer les informations de l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Utilisateur non connecté');
        return;
      }
      
      // Stocker l'ID de l'utilisateur
      setCurrentUserId(user.id);

      // Récupérer le nom d'utilisateur depuis la table utilisateurs
      const { data: userData, error: userError } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Erreur lors de la récupération des données utilisateur:', userError);
        // Fallback : utiliser l'email comme nom d'utilisateur
        setUserName(user.email?.split('@')[0] || 'Utilisateur');
      } else if (userData) {
        // Priorité 1: utiliser prenom et nom s'ils existent (après migration)
        if (userData.prenom && userData.nom) {
          setUserName(userData.prenom);
        }
        // Priorité 2: utiliser nom_complet s'il existe
        else if (userData.nom_complet) {
          setUserName(userData.nom_complet.split(' ')[0] || userData.nom_complet);
        }
        // Priorité 3: utiliser email comme fallback
        else {
          setUserName(userData.email?.split('@')[0] || 'Utilisateur');
        }
      } else {
        // Fallback : utiliser l'email comme nom d'utilisateur
        setUserName(user.email?.split('@')[0] || 'Utilisateur');
      }

      // Récupérer les matériels disponibles (qui ne sont pas les miens)
      const { data: availableData, error: availableError } = await supabase
        .from('materiels')
        .select('*')
        .eq('disponibilite', true)
        .neq('proprietaire_id', user.id);

      if (availableError) {
        console.error('Erreur lors de la récupération des matériels disponibles:', availableError);
        setError('Erreur lors de la récupération des matériels disponibles');
      } else if (availableData) {
        setAvailableItems(availableData);
      }

      // Récupérer mes matériels
      const { data: myItemsData, error: myItemsError } = await supabase
        .from('materiels')
        .select('*')
        .eq('proprietaire_id', user.id);

      if (myItemsError) {
        console.error('Erreur lors de la récupération de mes matériels:', myItemsError);
        setError('Erreur lors de la récupération de vos matériels');
      } else if (myItemsData) {
        setMyItems(myItemsData);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    userName,
    currentUserId,
    availableItems,
    myItems,
    isLoading,
    error,
    refreshData
  };
}
