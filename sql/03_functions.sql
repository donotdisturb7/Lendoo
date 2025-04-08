/**
 * Système de gestion automatique des prêts
 * 
 * Ce fichier contient les fonctions et triggers qui gèrent automatiquement :
 * - Les transitions de statut des prêts
 * - La détection des retards
 * - Les prolongations de prêt
 * - Les mises à jour périodiques
 */

/**
 * Fonction : update_pret_status
 * 
 * Trigger BEFORE INSERT OR UPDATE qui gère les transitions de statut des prêts
 * et les mises à jour automatiques associées.
 * 
 * Cas gérés :
 * 1. Activation automatique des prêts approuvés quand la date de début est atteinte
 * 2. Détection et marquage des retards
 * 3. Application des prolongations acceptées
 * 4. Gestion des demandes de retour
 * 
 * @trigger BEFORE INSERT OR UPDATE ON public.prets
 * @return trigger
 */
CREATE OR REPLACE FUNCTION update_pret_status()
RETURNS trigger AS $$
BEGIN
    -- Si le prêt vient d'être approuvé et que la date de début est aujourd'hui ou dans le passé
    IF NEW.statut = 'approuvé' AND NEW.date_debut <= CURRENT_DATE THEN
        NEW.statut := 'actif';
    END IF;

    -- Gestion des retards : marquer automatiquement les prêts en retard
    IF NEW.statut = 'actif' AND NEW.date_fin < CURRENT_DATE THEN
        NEW.retard := TRUE;
    END IF;

    -- Application d'une prolongation acceptée
    -- Reset des flags et mise à jour de la date de fin
    IF NEW.prolongation_acceptee = TRUE AND NEW.nouvelle_date_fin IS NOT NULL THEN
        NEW.date_fin := NEW.nouvelle_date_fin;
        NEW.prolongation_demandee := FALSE;
        NEW.prolongation_acceptee := FALSE;
        NEW.nouvelle_date_fin := NULL;
    END IF;

    -- Gestion des demandes de retour
    -- Le propriétaire doit confirmer manuellement le retour pour plus de sécurité
    IF NEW.statut = 'demande_retour' AND OLD.statut = 'actif' THEN
        NULL; -- Pas d'action automatique, attente de confirmation
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Installation du trigger sur la table des prêts
DROP TRIGGER IF EXISTS check_pret_status ON public.prets;
CREATE TRIGGER check_pret_status
    BEFORE INSERT OR UPDATE ON public.prets
    FOR EACH ROW
    EXECUTE FUNCTION update_pret_status();

/**
 * Fonction : update_prets_status
 * 
 * Fonction de maintenance périodique qui met à jour en masse les statuts des prêts.
 * Exécutée toutes les heures via le scheduler pg_cron.
 * 
 * Actions :
 * 1. Marque les prêts actifs comme en retard si la date de fin est dépassée
 * 2. Active automatiquement les prêts approuvés dont la date de début est atteinte
 * 
 * Note : Cette fonction complète le trigger update_pret_status en gérant
 * les mises à jour en masse qui ne seraient pas déclenchées par des modifications individuelles.
 * 
 * @scheduled Toutes les heures
 * @return void
 */
CREATE OR REPLACE FUNCTION update_prets_status()
RETURNS void AS $$
BEGIN
    -- Marquer les prêts en retard
    UPDATE public.prets
    SET retard = TRUE,
        date_modification = CURRENT_TIMESTAMP
    WHERE statut = 'actif'
    AND date_fin < CURRENT_DATE
    AND retard = FALSE;

    -- Activer les prêts approuvés dont la date est arrivée
    UPDATE public.prets
    SET statut = 'actif',
        date_modification = CURRENT_TIMESTAMP
    WHERE statut = 'approuvé'
    AND date_debut <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Configuration du job périodique avec pg_cron
SELECT cron.schedule(
    'update-prets-status',
    '0 * * * *',  -- Toutes les heures
    $$SELECT update_prets_status();$$
); 