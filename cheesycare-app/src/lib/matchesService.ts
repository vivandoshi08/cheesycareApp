import { supabase } from './supabase';
import { Team } from './types';

export interface Event {
  id: string;
  key: string;
  name: string;
  current_qual_match: string | null;
  last_updated: string;
  nexus_data: {
    eventKey: string;
    dataAsOfTime: number;
    nowQueuing: string | null;
    matches: Match[];
    announcements: any[];
    partsRequests: any[];
  };
  tba_data: any;
}

export interface Match {
  label: string;
  status: string;
  redTeams: string[];
  blueTeams: string[];
  times: {
    estimatedQueueTime: number;
    estimatedOnDeckTime: number;
    estimatedOnFieldTime: number;
    estimatedStartTime: number;
    actualQueueTime?: number;
  };
  replayOf?: string;
}

export interface TeamMatchInfo extends Team {
  current_match: string | null;
  next_match: string | null;
  next_match_time: string | undefined;
  estimated_queue_time: string | null;
  estimated_field_time: string | null;
}

export async function getActiveEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('last_updated', { ascending: false });

  if (error) return [];

  return data || [];
}

export async function getCurrentQualMatch(eventKey: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('events')
    .select('current_qual_match')
    .eq('key', eventKey)
    .single();

  if (error || !data) return null;

  return data.current_qual_match;
}

export async function getTeamsWithUpcomingMatches(limit = 10): Promise<TeamMatchInfo[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_red_flags(*)')
    .not('next_match_time', 'is', null)
    .order('next_match_time', { ascending: true })
    .limit(limit);

  if (error) return [];

  return data || [];
}

export async function getTeamUpcomingMatches(teamNumber: string): Promise<TeamMatchInfo | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_red_flags(*)')
    .eq('number', teamNumber)
    .single();

  if (error || !data) return null;

  return data;
}

export async function getEventMatches(eventKey: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('events')
    .select('nexus_data')
    .eq('key', eventKey)
    .single();

  if (error || !data || !data.nexus_data) return [];

  return data.nexus_data.matches || [];
}

export function formatMatchLabel(label: string): string {
  if (!label) return '';
  if (label.startsWith('qm')) return `Qualification ${label.substring(2)}`;
  if (label.startsWith('sf')) {
    const setNumber = label.substring(2, 3);
    const matchNumber = label.substring(4);
    return `Semifinal ${setNumber}-${matchNumber}`;
  }
  if (label.startsWith('qf')) {
    const setNumber = label.substring(2, 3);
    const matchNumber = label.substring(4);
    return `Quarterfinal ${setNumber}-${matchNumber}`;
  }
  if (label.startsWith('f')) {
    const matchNumber = label.substring(2);
    return `Final ${matchNumber}`;
  }
  return label;
}

export function getTimeUntilMatch(matchTime: string | null): string {
  if (!matchTime) return 'Unknown';
  const now = new Date();
  const match = new Date(matchTime);
  const diffMs = match.getTime() - now.getTime();
  if (diffMs < 0) return 'Now';
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours} hour${hours === 1 ? '' : 's'}${minutes > 0 ? ` ${minutes} minute${minutes === 1 ? '' : 's'}` : ''}`;
}
