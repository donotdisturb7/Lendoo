export interface Material {
  id: string;
  nom: string;
  description?: string;
  disponibilite: boolean;
  prix: number;
  caution?: number;
  url_image?: string;
  localisation?: string;
  latitude?: number | null;
  longitude?: number | null;
  proprietaire_id: string;
  categorie_id: string;
  date_creation?: string;
  [key: string]: any; 
}

export interface NewItem {
  nom: string;
  description: string;
  prix: number;
  caution: number;
  disponibilite: boolean;
  url_image: string | null;
  localisation: string;
  latitude?: number | null;
  longitude?: number | null;
  proprietaire_id: string;
  categorie_id: string;
}
