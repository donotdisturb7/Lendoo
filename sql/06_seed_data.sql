-- 06_seed_data.sql
-- Script d'initialisation des données de base

-- Insertion des catégories de base
INSERT INTO public.categories (id, nom, description, icon, ordre) VALUES
  ('c02e1b4c-12a9-4b0d-8d80-b97315a9e1e5', 'Outils', 'Outils et matériel de bricolage', 'construct', 1),
  ('c01e1b4c-12a9-4b0d-8d80-b97315a9e1e5', 'Électronique', 'Appareils électroniques et accessoires', 'phone-portrait', 2),
  ('c03e1b4c-12a9-4b0d-8d80-b97315a9e1e5', 'Sport', 'Équipement sportif et de loisirs', 'basketball', 3),
  ('c04e1b4c-12a9-4b0d-8d80-b97315a9e1e5', 'Nature', 'Matériel de jardinage et d''extérieur', 'leaf', 4),
  ('c05e1b4c-12a9-4b0d-8d80-b97315a9e1e5', 'Musique', 'Instruments de musique et équipement audio', 'musical-notes-outline', 5)
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  ordre = EXCLUDED.ordre; 