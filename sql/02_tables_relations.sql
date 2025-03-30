-- 02_tables_relations.sql
-- Tables avec relations plus complexes

-- 4. Table des matériels disponibles à la location
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
  date_creation TIMESTAMPTZ DEFAULT now(),
  date_modification TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT prix_positif CHECK (prix >= 0)
);

-- 5. Table des prêts et du panier
CREATE TABLE IF NOT EXISTS public.prets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materiel_id UUID NOT NULL REFERENCES public.materiels(id) ON DELETE CASCADE,
  emprunteur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ NOT NULL,
  date_retour TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'cart',
  frais_location DECIMAL(10, 2) NOT NULL CHECK (frais_location >= 0),
  caution_payee DECIMAL(10, 2) DEFAULT 0,
  caution_rendue BOOLEAN DEFAULT false,
  notes TEXT,
  date_creation TIMESTAMPTZ DEFAULT now(),
  date_modification TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT dates_coherentes CHECK (date_fin >= date_debut),
  CONSTRAINT statut_valide CHECK (statut IN ('cart', 'pending', 'approved', 'active', 'returned', 'cancelled'))
);

-- 6. Table de notifications pour informer les utilisateurs des changements
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

-- 7. Table pour les avis et les évaluations
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
