import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import SafeScreenView from '@/components/SafeScreenView';

interface LoanRequest {
  id: string;
  date_creation: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  frais_location: number;
  caution_payee: number;
  emprunteur: {
    id: string;
    email: string;
    nom_complet?: string;
  };
  materiel: {
    id: string;
    nom: string;
    description?: string;
    url_image?: string;
    quantite_disponible: number;
  };
}

export default function LoanRequestsScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchLoanRequests();
    }, [])
  );

  async function fetchLoanRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('prets')
        .select(`
          id,
          date_creation,
          date_debut,
          date_fin,
          statut,
          frais_location,
          caution_payee,
          emprunteur:utilisateurs!prets_emprunteur_id_fkey(
            id,
            email,
            nom_complet
          ),
          materiel:materiels(
            id,
            nom,
            description,
            url_image,
            quantite_disponible
          )
        `)
        .eq('proprietaire_id', user.id)
        .eq('statut', 'en attente')
        .order('date_creation', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        return;
      }

      setRequests(data as LoanRequest[]);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(requestId: string, approve: boolean) {
    try {
      setLoading(true);
      
      const newStatus = approve ? 'approuvé' : 'rejeté';
      
      const { error } = await supabase
        .from('prets')
        .update({ 
          statut: newStatus,
          date_modification: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Succès',
        `La demande a été ${approve ? 'approuvée' : 'refusée'} avec succès`
      );

      // Rafraîchir la liste
      fetchLoanRequests();
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  const renderRequest = ({ item }: { item: LoanRequest }) => {
    const startDate = new Date(item.date_debut).toLocaleDateString();
    const endDate = new Date(item.date_fin).toLocaleDateString();
    const borrowerName = item.emprunteur.nom_complet || item.emprunteur.email.split('@')[0];

    return (
      <View style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.requestHeader}>
          <View style={styles.itemInfo}>
            {item.materiel.url_image ? (
              <Image 
                source={{ uri: item.materiel.url_image }} 
                style={styles.itemImage}
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.materiel.nom}</Text>
              <Text style={[styles.borrowerName, { color: colors.textSecondary }]}>
                Par {borrowerName}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              Du {startDate} au {endDate}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {item.frais_location}€ + {item.caution_payee}€ de caution
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.danger }]}
            onPress={() => handleRequest(item.id, false)}
          >
            <Text style={styles.actionButtonText}>Refuser</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton, { backgroundColor: colors.success }]}
            onPress={() => handleRequest(item.id, true)}
          >
            <Text style={styles.actionButtonText}>Approuver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeScreenView>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Demandes de prêt</Text>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="documents-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aucune demande en attente
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeScreenView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  requestHeader: {
    padding: 12,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  borrowerName: {
    fontSize: 14,
  },
  requestDetails: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  rejectButton: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  approveButton: {
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
}); 