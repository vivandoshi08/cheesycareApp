import { supabase } from './supabase';
import { Team, TeamRedFlag, TeamNote, Person } from './types';

export async function getTeams(): Promise<(Team & { red_flags?: TeamRedFlag[] })[]> {
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .order('number');

  if (teamsError) return [];

  const { data: redFlags, error: redFlagsError } = await supabase
    .from('team_red_flags')
    .select('*');

  if (redFlagsError) return teams;

  return teams.map(team => {
    const teamRedFlags = redFlags.filter(flag => flag.team_id === team.id);
    return {
      ...team,
      red_flags: teamRedFlags.length > 0 ? teamRedFlags : undefined
    };
  });
}

export async function getTeamById(id: string): Promise<(Team & { red_flags?: TeamRedFlag[], notes?: TeamNote[] }) | null> {
  let { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single();

  if (teamError) {
    const { data: teamByNumber, error: numberError } = await supabase
      .from('teams')
      .select('*')
      .eq('number', id)
      .single();

    if (numberError) return null;
    team = teamByNumber;
  }

  if (!team) return null;

  const { data: redFlags } = await supabase
    .from('team_red_flags')
    .select('*')
    .eq('team_id', team.id);

  const { data: notes } = await supabase
    .from('team_notes')
    .select(`*, creator:people(*)`)
    .eq('team_id', team.id)
    .order('created_at', { ascending: false });

  return {
    ...team,
    red_flags: redFlags && redFlags.length > 0 ? redFlags : undefined,
    notes: notes && notes.length > 0 ? notes : undefined
  };
}

export async function getTeamPeople(teamId: string): Promise<Person[]> {
  let actualTeamId = teamId;

  if (/^\d+$/.test(teamId)) {
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('number', teamId)
      .single();

    if (teamError) return [];
    if (teamData) actualTeamId = teamData.id;
  }

  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('status_team_id', actualTeamId);

  if (error) return [];

  return data;
}

export async function getTeamMentions(teamId: string): Promise<any[]> {
  let actualTeamId = teamId;

  if (/^\d+$/.test(teamId)) {
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('number', teamId)
      .single();

    if (teamError) return [];
    if (teamData) actualTeamId = teamData.id;
  }

  const { data: toolCheckouts } = await supabase
    .from('tool_checkouts')
    .select(`*, tool:tools(*), person:people(*)`)
    .eq('team_id', actualTeamId)
    .eq('is_active', true);

  const { data: people } = await supabase
    .from('people')
    .select('*')
    .eq('status_team_id', actualTeamId);

  let matches = [];
  try {
    const { data: matchesData } = await supabase
      .from('team_matches')
      .select(`*, match:matches(*)`)
      .eq('team_id', actualTeamId);

    matches = matchesData || [];
  } catch (err) {}

  const mentions = [
    ...(toolCheckouts || []).map(checkout => ({
      id: checkout.id,
      section: 'tools',
      title: checkout.tool?.name || 'Unknown Tool',
      details: `Checked out by ${checkout.person?.name || 'Unknown'}`,
      timestamp: checkout.checkout_time,
      link: `/tools/${checkout.tool_id}`
    })),
    ...(people || []).map(person => ({
      id: person.id,
      section: 'people',
      title: person.name,
      details: `${person.status_type === 'team' ? 'Assigned to' : 'Needs assistance with'} Team ${/^\d+$/.test(teamId) ? teamId : actualTeamId}`,
      timestamp: person.created_at,
      link: `/people/${person.id}`
    })),
    ...(matches || []).map(teamMatch => ({
      id: teamMatch.id,
      section: 'matches',
      title: `Match #${teamMatch.match?.match_number || 'Unknown'}`,
      details: `${teamMatch.alliance?.toUpperCase() || 'Unknown'} Alliance, Position ${teamMatch.position || 'Unknown'}`,
      timestamp: teamMatch.match?.match_time || new Date().toISOString(),
      link: `/matches/${teamMatch.match_id || 'unknown'}`
    }))
  ];

  return mentions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addTeamNote(
  teamId: string,
  content: string,
  createdBy?: string
): Promise<TeamNote | null> {
  let actualTeamId = teamId;

  if (/^\d+$/.test(teamId)) {
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('number', teamId)
      .single();

    if (teamError) return null;
    if (teamData) actualTeamId = teamData.id;
  }

  const { data, error } = await supabase
    .from('team_notes')
    .insert({
      team_id: actualTeamId,
      content,
      created_by: createdBy
    })
    .select()
    .single();

  if (error) return null;

  return data;
}

export async function addTeamRedFlag(
  teamId: string,
  flag: string
): Promise<TeamRedFlag | null> {
  let actualTeamId = teamId;

  if (/^\d+$/.test(teamId)) {
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('number', teamId)
      .single();

    if (teamError) return null;
    if (teamData) actualTeamId = teamData.id;
  }

  const { data, error } = await supabase
    .from('team_red_flags')
    .insert({
      team_id: actualTeamId,
      flag
    })
    .select()
    .single();

  if (error) return null;

  return data;
}

export async function removeTeamRedFlag(flagId: string): Promise<boolean> {
  const { error } = await supabase
    .from('team_red_flags')
    .delete()
    .eq('id', flagId);

  return !error;
}

export async function createTeam(
  number: string,
  name: string,
  nextMatchTime?: string,
  description?: string,
  website?: string
): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      number,
      name,
      next_match_time: nextMatchTime,
      description,
      website
    })
    .select()
    .single();

  if (error) return null;

  return data;
}

export async function updateTeam(
  id: string,
  updates: Partial<Team>
): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return null;

  return data;
}
