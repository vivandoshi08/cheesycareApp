import { supabase } from './supabase';
import { Person, Team, Skill, PersonActivity } from './types';

export async function getPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select(`*, team:teams(id, number, name)`);

  if (error) return [];

  return data.map((person: any) => ({
    ...person,
    status_team: person.team
  }));
}

export async function getPersonById(id: string): Promise<Person | null> {
  const { data: person, error: personError } = await supabase
    .from('people')
    .select(`*, team:teams(id, number, name)`)
    .eq('id', id)
    .single();

  if (personError) return null;

  const { data: personSkills } = await supabase
    .from('people_skills')
    .select(`skills(id, name)`)
    .eq('person_id', id);

  const { data: activities } = await supabase
    .from('person_activities')
    .select('*')
    .eq('person_id', id)
    .order('timestamp', { ascending: false });

  return {
    ...person,
    status_team: person.team,
    skills: personSkills ? personSkills.map((item: any) => item.skills) : [],
    activities: activities || []
  };
}

export async function createPerson(
  name: string,
  role: string | null,
  statusType: 'team' | 'free' | 'assistance',
  statusTeamId: string | null = null,
  yearsOfExperience: number | null = null
): Promise<Person | null> {
  const { data, error } = await supabase
    .from('people')
    .insert({
      name,
      role,
      status_type: statusType,
      status_team_id: statusTeamId,
      years_of_experience: yearsOfExperience
    })
    .select()
    .single();

  if (error) return null;

  return data;
}

export async function updatePerson(
  id: string,
  updates: Partial<Person>
): Promise<Person | null> {
  const { data, error } = await supabase
    .from('people')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return null;

  return data;
}

export async function deletePerson(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('people')
    .delete()
    .eq('id', id);

  return !error;
}

export async function getSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('name');

  if (error) return [];

  return data;
}

export async function addSkillToPerson(personId: string, skillId: string): Promise<boolean> {
  const { error } = await supabase
    .from('people_skills')
    .insert({
      person_id: personId,
      skill_id: skillId
    });

  return !error;
}

export async function removeSkillFromPerson(personId: string, skillId: string): Promise<boolean> {
  const { error } = await supabase
    .from('people_skills')
    .delete()
    .eq('person_id', personId)
    .eq('skill_id', skillId);

  return !error;
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('number');

  if (error) return [];

  return data;
}

export async function addPersonActivity(
  personId: string,
  activityType: 'team_assignment' | 'tool_checkout' | 'doc_contribution' | 'note_added' | 'match_participation',
  details: string,
  targetId?: string,
  targetType?: string,
  link?: string
): Promise<PersonActivity | null> {
  const { data, error } = await supabase
    .from('person_activities')
    .insert({
      person_id: personId,
      activity_type: activityType,
      details,
      target_id: targetId,
      target_type: targetType,
      link
    })
    .select()
    .single();

  if (error) return null;

  return data;
}

export async function getPersonActivities(personId: string): Promise<PersonActivity[]> {
  const { data, error } = await supabase
    .from('person_activities')
    .select('*')
    .eq('person_id', personId)
    .order('timestamp', { ascending: false });

  if (error) return [];

  return data;
}
