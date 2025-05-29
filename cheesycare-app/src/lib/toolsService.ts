import { supabase } from './supabase';
import { Tool, ToolCategory, ToolCheckout, ToolWithCheckouts, Person, Team } from './types';

export async function getTools(): Promise<ToolWithCheckouts[]> {
  const { data: tools, error: toolsError } = await supabase
    .from('tools')
    .select(`*, tool_categories(name)`);

  if (toolsError) return [];

  const { data: checkouts, error: checkoutsError } = await supabase
    .from('tool_checkouts')
    .select(`*, person:people(*), team:teams(*)`)
    .eq('is_active', true);

  if (checkoutsError) return [];

  return tools.map((tool: any) => {
    const toolCheckouts = checkouts.filter((checkout: any) => checkout.tool_id === tool.id);

    return {
      id: tool.id,
      name: tool.name,
      category_id: tool.category_id,
      category: tool.tool_categories?.name || 'Uncategorized',
      total_quantity: tool.total_quantity,
      available_quantity: tool.available_quantity,
      created_at: tool.created_at,
      checkouts: toolCheckouts.map((checkout: any) => ({
        ...checkout,
        person: checkout.person,
        team: checkout.team
      }))
    };
  });
}

export async function getToolById(id: string): Promise<ToolWithCheckouts | null> {
  const { data: tool, error: toolError } = await supabase
    .from('tools')
    .select(`*, tool_categories(name)`)
    .eq('id', id)
    .single();

  if (toolError) return null;

  const { data: checkouts, error: checkoutsError } = await supabase
    .from('tool_checkouts')
    .select(`*, person:people(*), team:teams(*)`)
    .eq('tool_id', id)
    .eq('is_active', true);

  if (checkoutsError) return null;

  return {
    id: tool.id,
    name: tool.name,
    category_id: tool.category_id,
    category: tool.tool_categories?.name || 'Uncategorized',
    total_quantity: tool.total_quantity,
    available_quantity: tool.available_quantity,
    created_at: tool.created_at,
    checkouts: checkouts.map((checkout: any) => ({
      ...checkout,
      person: checkout.person,
      team: checkout.team
    }))
  };
}

export async function getToolCategories(): Promise<ToolCategory[]> {
  const { data, error } = await supabase
    .from('tool_categories')
    .select('*')
    .order('name');

  if (error) return [];

  return data;
}

export async function checkoutTool(
  toolId: string,
  personId: string,
  quantity: number,
  teamId?: string,
  notes?: string
): Promise<boolean> {
  const { error } = await supabase.from('tool_checkouts').insert({
    tool_id: toolId,
    person_id: personId,
    team_id: teamId,
    quantity,
    notes,
    is_active: true
  });

  return !error;
}

export async function returnTool(checkoutId: string, notes?: string): Promise<boolean> {
  const { error } = await supabase
    .from('tool_checkouts')
    .update({
      is_active: false,
      actual_return_time: new Date().toISOString(),
      notes: notes
    })
    .eq('id', checkoutId);

  return !error;
}

export async function createTool(
  name: string,
  categoryId: string,
  totalQuantity: number
): Promise<Tool | null> {
  const { data, error } = await supabase
    .from('tools')
    .insert({
      name,
      category_id: categoryId,
      total_quantity: totalQuantity,
      available_quantity: totalQuantity
    })
    .select()
    .single();

  if (error) return null;

  return data;
}

export async function updateTool(
  id: string,
  updates: Partial<Tool>
): Promise<Tool | null> {
  const { data, error } = await supabase
    .from('tools')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return null;

  return data;
}

export async function deleteTool(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('tools')
    .delete()
    .eq('id', id);

  return !error;
}

export async function getPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('name');

  if (error) return [];

  return data;
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('number');

  if (error) return [];

  return data;
}
