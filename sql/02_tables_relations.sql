-- 02_tables_relations.sql
-- Tables avec relations plus complexes

/**
 * Tables avec relations complexes pour l'application de prêt d'objets
 * 
 * Architecture de la base de données :
 * - Utilisation d'UUID pour les clés primaires pour la scalabilité et la sécurité
 * - Contraintes de clés étrangères avec ON DELETE appropriés
 * - Timestamps automatiques pour le suivi des modifications
 * - Contraintes CHECK pour la validation des données
 */

/**
 * Table des matériels disponibles à la location
 * 
 * Points clés :
 * - Gestion de la disponibilité avec un booléen simple
 * - Prix et caution avec précision décimale (10,2) pour éviter les erreurs d'arrondi
 * - Durées min/max en jours pour contrôler les périodes de prêt
 * - Localisation pour futur système de recherche géographique
 */
CREATE TABLE IF NOT EXISTS public.materiels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  categorie_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  nom TEXT NOT NULL,
  description TEXT,
  url_image TEXT,
  prix DECIMAL(10, 2) NOT NULL CHECK (prix >= 0),
  caution DECIMAL(10, 2) CHECK (caution >= 0),
  disponibilite BOOLEAN DEFAULT true,
  localisation TEXT,
  conditions_location TEXT,
  duree_min_jours SMALLINT DEFAULT 1,
  duree_max_jours SMALLINT DEFAULT 30,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(10, 8),
  date_creation TIMESTAMPTZ DEFAULT now(),
  date_modification TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT prix_positif CHECK (prix >= 0)
);

/**
 * Table des prêts et du panier
 * 
 * Workflow des statuts :
 * panier -> en attente -> approuvé -> actif -> demande_retour -> retourné
 *                      -> rejeté (fin)
 * 
 * Gestion des prolongations :
 * - prolongation_demandee : L'emprunteur demande une extension
 * - prolongation_acceptee : Le propriétaire accepte
 * - nouvelle_date_fin : Nouvelle date proposée
 * 
 * Sécurité :
 * - Double référence propriétaire/emprunteur pour éviter les confusions
 * - Contrainte sur les dates pour éviter les incohérences
 * - Suivi des cautions payées/rendues
 */
CREATE TABLE IF NOT EXISTS public.prets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materiel_id UUID NOT NULL REFERENCES public.materiels(id) ON DELETE CASCADE,
  emprunteur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ NOT NULL,
  date_retour TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'panier',
  frais_location DECIMAL(10, 2) NOT NULL CHECK (frais_location >= 0),
  caution_payee DECIMAL(10, 2) DEFAULT 0,
  caution_rendue BOOLEAN DEFAULT false,
  notes TEXT,
  date_creation TIMESTAMPTZ DEFAULT now(),
  date_modification TIMESTAMPTZ DEFAULT now(),
  prolongation_demandee BOOLEAN DEFAULT FALSE,
  prolongation_acceptee BOOLEAN DEFAULT FALSE,
  nouvelle_date_fin TIMESTAMPTZ,
  retard BOOLEAN DEFAULT FALSE,
  CONSTRAINT dates_coherentes CHECK (date_fin >= date_debut),
  CONSTRAINT statut_valide CHECK (statut IN ('panier', 'en attente', 'approuvé', 'actif', 'demande_retour', 'retourné', 'rejeté'))
);

/**
 * Table des notifications
 * 
 * Système de notifications in-app pour :
 * - Nouvelles demandes de prêt
 * - Changements de statut
 * - Demandes de prolongation
 * - Retards
 * - Messages système
 */
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  lu BOOLEAN DEFAULT false,
  lien TEXT,
  date_creation TIMESTAMPTZ DEFAULT now()
);

/**
 * Table des avis et évaluations
 * 
 * Système de réputation :
 * - Note de 1 à 5 étoiles
 * - Un seul avis par prêt et par personne
 * - Contrainte unique pour éviter les doublons
 * - Possibilité d'évaluer le prêteur et l'emprunteur
 */
CREATE TABLE IF NOT EXISTS public.avis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pret_id UUID NOT NULL REFERENCES public.prets(id) ON DELETE CASCADE,
  evaluateur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  evalue_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  note SMALLINT NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire TEXT,
  date_creation TIMESTAMPTZ DEFAULT now(),
  date_modification TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_avis_par_pret_et_evaluateur UNIQUE (pret_id, evaluateur_id, evalue_id)
);
