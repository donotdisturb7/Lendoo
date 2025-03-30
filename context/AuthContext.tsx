import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';

// Types simplifiés
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean, message: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean, message: string }>;
  signOut: () => Promise<void>;
};

// Contexte avec valeurs par défaut
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => ({ success: false, message: "" }),
  signUp: async () => ({ success: false, message: "" }),
  signOut: async () => {},
});

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(false);

  // Initialisation et écoute des changements d'état
  useEffect(() => {
    // Récupérer l'utilisateur actuel
    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
        
        // Écouter les changements d'authentification
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log(`Événement auth: ${event}`);
          setUser(session?.user || null);
        });
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      }
    };
    
    loadUser();
  }, []);

  // Fonction de connexion simplifiée
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Validation basique des entrées (sans validation de format d'email)
      if (!email || !password) {
        return { success: false, message: 'Veuillez saisir votre email et mot de passe' };
      }
      
      // Tentative de connexion - laissons Supabase valider l'email
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.log('Erreur de connexion:', error.message);
        let message = 'Erreur de connexion. Vérifiez vos identifiants.';
        
        if (error.message.includes('Invalid login credentials')) {
          message = 'Email ou mot de passe incorrect';
        } else if (error.message.includes('Invalid email')) {
          message = 'Format d\'email invalide';
        }
        
        return { success: false, message };
      }
      
      return { success: true, message: 'Connexion réussie' };
    } catch (error: any) {
      console.error('Exception lors de la connexion:', error);
      return { success: false, message: error.message || 'Erreur lors de la connexion' };
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription améliorée
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      
      // Validation des entrées
      if (!email || !password || !fullName) {
        return { success: false, message: 'Veuillez remplir tous les champs' };
      }
      
      if (password.length < 6) {
        return { success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
      }
      
      // Tentative d'inscription avec Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      
      // Gestion des erreurs
      if (error) {
        let message = 'Erreur lors de l\'inscription';
        console.log('Erreur inscription:', error.message);
        
        if (error.message.includes('already registered')) {
          message = 'Cet email est déjà utilisé';
        } else if (error.message.includes('database')) {
          // Tentative de connexion directe si problème de BD
          console.log('Erreur BD, tentative de connexion directe...');
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email, password
          });
          
          if (!signInError) {
            return { success: true, message: 'Connexion réussie' };
          }
          
          message = 'Erreur de base de données. Contactez l\'administrateur.';
        }
        
        return { success: false, message };
      }
      
      // Ajout des infos dans la table utilisateurs
      if (data.user) {
        try {
          // 1. Création dans la table utilisateurs
          const { error: userError } = await supabase
            .from('utilisateurs')
            .insert([{
              id: data.user.id,
              email,
              nom_complet: fullName,
              roles: ['user'],
              date_creation: new Date().toISOString()
            }]);
            
          if (userError) {
            console.log('Erreur insertion utilisateur:', userError.message);
          } else {
            // 2. Création dans la table profils
            const { error: profilError } = await supabase
              .from('profils')
              .insert([{
                utilisateur_id: data.user.id,
                biographie: '',
                localisation: '',
                preference_theme: 'light'
              }]);
              
            if (profilError) {
              console.log('Erreur insertion profil (non bloquant):', profilError.message);
            }
          }
        } catch (profileError) {
          console.log('Exception insertion profil (non bloquant):', profileError);
        }
      }
      
      return { success: true, message: 'Inscription réussie' };
    } catch (error: any) {
      console.error('Exception inscription:', error.message);
      return { success: false, message: error.message || 'Erreur inattendue' };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion simplifiée
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
