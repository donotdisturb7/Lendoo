-- Script pour désactiver RLS sur toutes les tables


-- Désactiver RLS pour les tables principales
ALTER TABLE public.utilisateurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profils DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS pour les tables relationnelles
ALTER TABLE public.materiels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.avis DISABLE ROW LEVEL SECURITY;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'RLS désactivé sur toutes les tables';
END $$;
