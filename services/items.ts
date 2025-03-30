import { supabase } from '@/lib/supabase';
import { Material, NewItem } from '@/types/material';

export async function getItems() {
  const { data, error } = await supabase
    .from('materiels')
    .select('*')
    .order('date_creation', { ascending: false });
    
  if (error) throw error;
  return data as Material[];
}

export async function getItemById(id: string) {
  const { data, error } = await supabase
    .from('materiels')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data as Material;
}

export async function addItem(item: NewItem) {
  const { data, error } = await supabase
    .from('materiels')
    .insert(item)
    .select();
    
  if (error) throw error;
  return data[0] as Material;
}

export async function updateItem(id: string, item: Partial<Material>) {
  const { data, error } = await supabase
    .from('materiels')
    .update(item)
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data[0] as Material;
}

export async function deleteItem(id: string) {
  const { error } = await supabase
    .from('materiels')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
}