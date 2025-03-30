-- 04_indexes.sql
-- Création des index pour optimiser les performances des requêtes

-- Index pour la table materiels
CREATE INDEX IF NOT EXISTS idx_materiels_proprietaire ON public.materiels(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_materiels_categorie ON public.materiels(categorie_id);
CREATE INDEX IF NOT EXISTS idx_materiels_disponibilite ON public.materiels(disponibilite);

-- Index pour la table prets
CREATE INDEX IF NOT EXISTS idx_prets_emprunteur ON public.prets(emprunteur_id);
CREATE INDEX IF NOT EXISTS idx_prets_proprietaire ON public.prets(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_prets_materiel ON public.prets(materiel_id);
CREATE INDEX IF NOT EXISTS idx_prets_statut ON public.prets(statut);
CREATE INDEX IF NOT EXISTS idx_prets_dates ON public.prets(date_debut, date_fin);

-- Index pour la table notifications
CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur ON public.notifications(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_notifications_non_lues ON public.notifications(utilisateur_id, lu) WHERE lu = false;

-- Index pour la table avis
CREATE INDEX IF NOT EXISTS idx_avis_evalue ON public.avis(evalue_id);
