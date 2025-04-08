-- 03_triggers_functions.sql
-- Fonctions et déclencheurs pour l'automatisation

-- Fonction pour maintenir la date de modification à jour
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modification = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour la mise à jour des dates de modification
CREATE TRIGGER trigger_update_utilisateurs_timestamp
BEFORE UPDATE ON public.utilisateurs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_profils_timestamp
BEFORE UPDATE ON public.profils
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_categories_timestamp
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_materiels_timestamp
BEFORE UPDATE ON public.materiels
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_prets_timestamp
BEFORE UPDATE ON public.prets
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_avis_timestamp
BEFORE UPDATE ON public.avis
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Fonction déclencheur pour mettre à jour la disponibilité du matériel lorsqu'un prêt est approuvé
CREATE OR REPLACE FUNCTION update_materiel_disponibilite()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut IN ('approved', 'active') AND OLD.statut NOT IN ('approved', 'active') THEN
    -- Marquer comme non disponible lorsqu'un prêt est approuvé
    UPDATE public.materiels SET disponibilite = false WHERE id = NEW.materiel_id;
  ELSIF NEW.statut = 'returned' AND OLD.statut != 'returned' THEN
    -- Marquer comme disponible lorsqu'un prêt est retourné
    UPDATE public.materiels SET disponibilite = true WHERE id = NEW.materiel_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_materiel_disponibilite
AFTER UPDATE ON public.prets
FOR EACH ROW
EXECUTE FUNCTION update_materiel_disponibilite();

-- Fonction pour créer automatiquement une notification lors de l'approbation d'un prêt
CREATE OR REPLACE FUNCTION create_pret_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'approuvé' AND OLD.statut = 'en attente' THEN
    -- Notifier l'emprunteur
    INSERT INTO public.notifications (utilisateur_id, titre, message, type, lien)
    VALUES (
      NEW.emprunteur_id,
      'Prêt approuvé',
      'Votre demande de prêt a été approuvée par le propriétaire.',
      'success',
      '/pret/' || NEW.id
    );
  ELSIF NEW.statut = 'annulé' AND OLD.statut != 'annulé' THEN
    -- Notifier selon qui a annulé
    IF auth.uid() = NEW.proprietaire_id THEN
      -- Le propriétaire a annulé
      INSERT INTO public.notifications (utilisateur_id, titre, message, type, lien)
      VALUES (
        NEW.emprunteur_id,
        'Prêt annulé',
        'Le propriétaire a annulé votre demande de prêt.',
        'warning',
        '/pret/' || NEW.id
      );
    ELSE
      -- L'emprunteur a annulé
      INSERT INTO public.notifications (utilisateur_id, titre, message, type, lien)
      VALUES (
        NEW.proprietaire_id,
        'Prêt annulé',
        'L''emprunteur a annulé sa demande de prêt.',
        'warning',
        '/pret/' || NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pret_notification
AFTER UPDATE ON public.prets
FOR EACH ROW
EXECUTE FUNCTION create_pret_notification();
