-- 01_tables_base.sql
-- Création des tables principales (sans relations complexes)

-- 1. Table des utilisateurs (liée à auth.users)
CREATE TABLE IF NOT EXISTS public.utilisateurs (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nom_complet TEXT,
  roles TEXT[] DEFAULT ARRAY['user'],
  date_creation TIMESTAMPTZ DEFAULT now(),
  date_modification TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des profils utilisateurs (informations supplémentaires)
CREATE TABLE IF NOT EXISTS public.profils (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID UNIQUE NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  biographie TEXT,
  localisation TEXT,
  url_avatar TEXT,
  telephone TEXT,
  preference_notification BOOLEAN DEFAULT true,
  preference_theme TEXT DEFAULT 'light',
  date_creation TIMESTAMPTZ DEFAULT now(),
  date_modification TIMESTAMPTZ DEFAULT now()
);

-- 3. Table des catégories de matériel
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Nom de l'icône à utiliser
  ordre SMALLINT DEFAULT 0, -- Pour l'ordre d'affichage
  date_creation TIMESTAMPTZ DEFAULT now(),
  date_modification TIMESTAMPTZ DEFAULT now()
);
