-- 07_alter_tables.sql
-- Script pour ajouter les colonnes manquantes

-- Ajout des colonnes pour la géolocalisation
ALTER TABLE public.materiels
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 8);

-- Ajout des colonnes pour la gestion des quantités
ALTER TABLE public.materiels
  ADD COLUMN IF NOT EXISTS quantite_totale INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS quantite_disponible INTEGER DEFAULT 1;

-- Ajout des colonnes pour la gestion des dates
ALTER TABLE public.materiels
  ADD COLUMN IF NOT EXISTS date_creation TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS date_modification TIMESTAMPTZ DEFAULT now();

-- Ajout des colonnes pour la gestion des conditions de location
ALTER TABLE public.materiels
  ADD COLUMN IF NOT EXISTS conditions_location TEXT,
  ADD COLUMN IF NOT EXISTS duree_min_jours SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS duree_max_jours SMALLINT DEFAULT 30;

-- Ajout des contraintes
ALTER TABLE public.materiels
  ADD CONSTRAINT IF NOT EXISTS prix_positif CHECK (prix >= 0),
  ADD CONSTRAINT IF NOT EXISTS caution_positive CHECK (caution >= 0),
  ADD CONSTRAINT IF NOT EXISTS quantite_positive CHECK (quantite_totale >= 0),
  ADD CONSTRAINT IF NOT EXISTS quantite_disponible_valide CHECK (quantite_disponible >= 0 AND quantite_disponible <= quantite_totale);

-- Ajout des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_materiels_proprietaire ON public.materiels(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_materiels_categorie ON public.materiels(categorie_id);
CREATE INDEX IF NOT EXISTS idx_materiels_disponibilite ON public.materiels(disponibilite);
CREATE INDEX IF NOT EXISTS idx_materiels_localisation ON public.materiels(localisation);
CREATE INDEX IF NOT EXISTS idx_materiels_date_creation ON public.materiels(date_creation);

-- Ajout des politiques RLS pour le stockage
DO $$
BEGIN
  -- Vérifier si les politiques existent déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Tout le monde peut télécharger des images'
  ) THEN
    -- Créer la politique si elle n'existe pas
    EXECUTE 'CREATE POLICY "Tout le monde peut télécharger des images" ON storage.objects FOR INSERT WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Tout le monde peut voir les images'
  ) THEN
    -- Créer la politique si elle n'existe pas
    EXECUTE 'CREATE POLICY "Tout le monde peut voir les images" ON storage.objects FOR SELECT USING (true)';
  END IF;
END $$; 