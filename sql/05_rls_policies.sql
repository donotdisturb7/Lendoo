-- 05_rls_policies.sql
-- Politiques de sécurité Row Level Security (RLS)

-- Activer RLS sur toutes les tables
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avis ENABLE ROW LEVEL SECURITY;

-- Politique pour le stockage
CREATE POLICY "Tout le monde peut télécharger des images" ON storage.objects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Tout le monde peut voir les images" ON storage.objects
  FOR SELECT USING (true);

-- Politique pour utilisateurs: un utilisateur peut voir son propre profil et les admins peuvent voir tous les profils
CREATE POLICY utilisateurs_select ON public.utilisateurs 
  FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.utilisateurs WHERE id = auth.uid() AND 'admin' = ANY(roles)));

CREATE POLICY utilisateurs_update ON public.utilisateurs 
  FOR UPDATE USING (auth.uid() = id);

-- Politique pour profils: similaire à utilisateurs
CREATE POLICY profils_select ON public.profils 
  FOR SELECT USING (auth.uid() = utilisateur_id OR EXISTS (SELECT 1 FROM public.utilisateurs WHERE id = auth.uid() AND 'admin' = ANY(roles)));

CREATE POLICY profils_update ON public.profils 
  FOR UPDATE USING (auth.uid() = utilisateur_id);

-- Politique pour catégories: visible par tous, modifiable par admin
CREATE POLICY categories_select ON public.categories 
  FOR SELECT USING (true);

CREATE POLICY categories_insert_update_delete ON public.categories 
  USING (EXISTS (SELECT 1 FROM public.utilisateurs WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- Politique pour matériels: visible par tous, modifiable par le propriétaire ou admin
CREATE POLICY materiels_select ON public.materiels 
  FOR SELECT USING (true);

CREATE POLICY materiels_insert ON public.materiels 
  FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY materiels_update ON public.materiels 
  FOR UPDATE USING (auth.uid() = proprietaire_id);

CREATE POLICY materiels_delete ON public.materiels 
  FOR DELETE USING (auth.uid() = proprietaire_id);

-- Politique pour prêts: visible par le propriétaire et l'emprunteur
CREATE POLICY prets_select ON public.prets 
  FOR SELECT USING (auth.uid() = emprunteur_id OR auth.uid() = proprietaire_id);

CREATE POLICY prets_insert ON public.prets 
  FOR INSERT WITH CHECK (auth.uid() = emprunteur_id);

CREATE POLICY prets_update_emprunteur ON public.prets 
  FOR UPDATE USING (auth.uid() = emprunteur_id AND statut IN ('panier', 'en attente'));

CREATE POLICY prets_update_proprietaire ON public.prets 
  FOR UPDATE USING (auth.uid() = proprietaire_id);

-- Politique pour notifications: visible uniquement par le destinataire
CREATE POLICY notifications_select ON public.notifications 
  FOR SELECT USING (auth.uid() = utilisateur_id);

CREATE POLICY notifications_update ON public.notifications 
  FOR UPDATE USING (auth.uid() = utilisateur_id);

-- Politique pour avis: visible par tous, modifiable par l'auteur
CREATE POLICY avis_select ON public.avis 
  FOR SELECT USING (true);

CREATE POLICY avis_insert ON public.avis 
  FOR INSERT WITH CHECK (auth.uid() = evaluateur_id);

CREATE POLICY avis_update ON public.avis 
  FOR UPDATE USING (auth.uid() = evaluateur_id);
