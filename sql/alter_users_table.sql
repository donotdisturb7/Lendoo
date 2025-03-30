-- Modification de la table utilisateurs pour inclure des champs nom et prénom séparés
ALTER TABLE public.utilisateurs 
  ADD COLUMN IF NOT EXISTS prenom TEXT,
  ADD COLUMN IF NOT EXISTS nom TEXT,
  ADD COLUMN IF NOT EXISTS code_postal TEXT,
  ADD COLUMN IF NOT EXISTS ville TEXT,
  ADD COLUMN IF NOT EXISTS date_naissance DATE;

-- Renommer numero_telephone en telephone pour coller au reste du code
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'utilisateurs' AND column_name = 'numero_telephone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'utilisateurs' AND column_name = 'telephone'
  ) THEN
    ALTER TABLE public.utilisateurs RENAME COLUMN numero_telephone TO telephone;
  END IF;
END $$;

-- Si la colonne nom_complet existe déjà, on peut extraire le prénom et le nom

DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Pour chaque utilisateur avec un nom_complet défini
  FOR user_record IN SELECT id, nom_complet FROM public.utilisateurs 
                    WHERE nom_complet IS NOT NULL AND 
                          (prenom IS NULL OR nom IS NULL) LOOP
    
    -- Mettre à jour les colonnes prénom et nom en divisant nom_complet
    -- On suppose que le format est "Prénom Nom"
    UPDATE public.utilisateurs 
    SET prenom = split_part(user_record.nom_complet, ' ', 1),
        nom = substring(user_record.nom_complet from position(' ' in user_record.nom_complet) + 1)
    WHERE id = user_record.id;
    
  END LOOP;
END $$;

-- Mettre à jour la table profils pour stocker plus d'informations personnelles
ALTER TABLE public.profils
  ADD COLUMN IF NOT EXISTS preferences_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS date_derniere_connexion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS statut_verification TEXT DEFAULT 'non_verifie',
  ADD COLUMN IF NOT EXISTS note_moyenne DECIMAL(3,2);
