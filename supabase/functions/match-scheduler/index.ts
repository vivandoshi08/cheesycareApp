import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const TBA_API_KEY = Deno.env.get('TBA_API_KEY') || ''
const NEXUS_API_KEY = Deno.env.get('NEXUS_API_KEY') || ''

const FOCUS_TEAM_KEY = 'frc254'
const POLLING_INTERVAL = 10 * 60 * 1000
const TBA_API_BASE = 'https://www.thebluealliance.com/api/v3'
const NEXUS_API_BASE = 'https://frc.nexus/api/v1'

interface Match {
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

interface NexusEventResponse {
  eventKey: string;
  dataAsOfTime: number;
  nowQueuing: string | null;
  matches: Match[];
  announcements: any[];
  partsRequests: any[];
}

interface TBAEvent {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  year: number;
  start_date: string;
  end_date: string;
  timezone: string;
}

interface TBAMatch {
  key: string;
  comp_level: string;
  set_number: number;
  match_number: number;
  alliances: {
    red: {
      team_keys: string[];
      score?: number;
    };
    blue: {
      team_keys: string[];
      score?: number;
    };
  };
  time: number | null;
  actual_time: number | null;
  predicted_time: number | null;
  event_key: string;
}

interface TBATeamEvent {
  key: string;
  name: string;
  event_code: string;
  year: number;
}

interface TeamMatchInfo {
  team_key: string;
  event_key: string;
  current_match?: string;
  next_match?: string;
  next_match_time?: number;
  estimated_queue_time?: number;
  estimated_field_time?: number;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

Deno.serve(async (req) => {
  const url = new URL(req.url)
  if (req.method === 'GET' && url.searchParams.get('scheduled') !== 'true' && 
      req.method !== 'POST') {
    return new Response('Function should be called by scheduler or via POST', { status: 400 })
  }

  try {
    const { data: activeEvents, error: eventsError } = await supabase
      .from('teams')
      .select('next_match_time')
      .is('next_match_time', 'not.null')

    if (eventsError) {
      throw new Error(`Failed to fetch active events: ${eventsError.message}`)
    }

    let eventKeys: string[] = []
    if (!activeEvents || activeEvents.length === 0) {
      eventKeys = await findCurrentEventsForTeam(FOCUS_TEAM_KEY)
    } else {
      eventKeys = [...new Set(activeEvents
        .map(e => e.next_match_time?.split('_')[0])
        .filter(Boolean) as string[])]
    }

    if (eventKeys.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No active events found to update'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const results = await Promise.all(
      eventKeys.map(eventKey => processEvent(eventKey))
    )

    return new Response(JSON.stringify({ 
      message: 'Match schedules updated successfully',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error processing match schedules:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function processEvent(eventKey: string): Promise<any> {
  try {
    const nexusData = await fetchNexusEventData(eventKey)
    const tbaMatches = await fetchTBAEventMatches(eventKey)
    const eventTeams = await fetchTBAEventTeams(eventKey)
    const currentQualMatch = determineCurrentQualMatch(nexusData, tbaMatches)
    const teamUpdates = await updateTeamMatchTimes(
      eventKey, 
      eventTeams, 
      tbaMatches, 
      nexusData.matches, 
      currentQualMatch
    )
    await updateEventStatus(eventKey, currentQualMatch, nexusData)
    return {
      eventKey,
      currentQualMatch,
      teamsUpdated: teamUpdates.length,
      dataAsOfTime: nexusData.dataAsOfTime
    }
  } catch (error) {
    console.error(`Error processing event ${eventKey}:`, error)
    return {
      eventKey,
      error: error.message || 'Unknown error'
    }
  }
}

async function findCurrentEventsForTeam(teamKey: string): Promise<string[]> {
  const currentYear = new Date().getFullYear()
  const teamEvents = await fetchWithTBA(`/team/${teamKey}/events/${currentYear}`)
  const now = new Date()
  return teamEvents
    .filter((event: TBAEvent) => {
      const startDate = new Date(event.start_date)
      const endDate = new Date(event.end_date)
      endDate.setDate(endDate.getDate() + 1)
      return now >= startDate && now <= endDate
    })
    .map((event: TBAEvent) => event.key)
}

async function fetchNexusEventData(eventKey: string): Promise<NexusEventResponse> {
  try {
    const response = await fetch(`${NEXUS_API_BASE}/event/${eventKey}`, {
      headers: {
        'Nexus-Api-Key': NEXUS_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Nexus API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch Nexus data for event ${eventKey}:`, error)
    return {
      eventKey,
      dataAsOfTime: Date.now(),
      nowQueuing: null,
      matches: [],
      announcements: [],
      partsRequests: []
    }
  }
}

async function fetchTBAEventMatches(eventKey: string): Promise<TBAMatch[]> {
  return await fetchWithTBA(`/event/${eventKey}/matches`)
}

async function fetchTBAEventTeams(eventKey: string): Promise<string[]> {
  const teams = await fetchWithTBA(`/event/${eventKey}/teams/keys`)
  return teams
}

function determineCurrentQualMatch(
  nexusData: NexusEventResponse, 
  tbaMatches: TBAMatch[]
): string | null {
  if (nexusData.nowQueuing) {
    const matchLabel = nexusData.nowQueuing
    if (matchLabel.toLowerCase().includes('qualification')) {
      const matchNum = matchLabel.split(' ')[1]
      return matchNum || null
    }
  }

  if (tbaMatches && tbaMatches.length > 0) {
    const qualMatches = tbaMatches.filter(m => m.comp_level === 'qm')
    qualMatches.sort((a, b) => a.match_number - b.match_number)
    for (const match of qualMatches) {
      if (match.alliances.red.score === null || match.alliances.blue.score === null) {
        return match.match_number.toString()
      }
    }
    if (qualMatches.length > 0) {
      return qualMatches[qualMatches.length - 1].match_number.toString()
    }
  }
  return null
}

async function updateTeamMatchTimes(
  eventKey: string,
  teamKeys: string[],
  tbaMatches: TBAMatch[],
  nexusMatches: Match[],
  currentQualMatch: string | null
): Promise<any[]> {
  const updates: any[] = []
  for (const teamKey of teamKeys) {
    try {
      const teamMatches = tbaMatches.filter(match => 
        match.alliances.red.team_keys.includes(teamKey) || 
        match.alliances.blue.team_keys.includes(teamKey)
      )

      teamMatches.sort((a, b) => {
        if (a.comp_level !== b.comp_level) {
          const levels = ['qm', 'ef', 'qf', 'sf', 'f']
          return levels.indexOf(a.comp_level) - levels.indexOf(b.comp_level)
        }
        if (a.set_number !== b.set_number) {
          return a.set_number - b.set_number
        }
        return a.match_number - b.match_number
      })

      const teamMatchInfo: TeamMatchInfo = {
        team_key: teamKey,
        event_key: eventKey
      }

      const upcomingMatches = teamMatches.filter(match => 
        match.alliances.red.score === undefined || 
        match.alliances.blue.score === undefined
      )

      if (upcomingMatches.length > 0) {
        const nextMatch = upcomingMatches[0]
        teamMatchInfo.next_match = `${nextMatch.comp_level}${nextMatch.match_number}`
        const matchLabel = `${getCompLevelName(nextMatch.comp_level)} ${nextMatch.match_number}`
        const nexusMatchData = nexusMatches.find(m => m.label === matchLabel)

        if (nexusMatchData) {
          teamMatchInfo.estimated_queue_time = nexusMatchData.times.estimatedQueueTime
          teamMatchInfo.estimated_field_time = nexusMatchData.times.estimatedStartTime
          teamMatchInfo.next_match_time = nexusMatchData.times.estimatedStartTime
        } else if (nextMatch.predicted_time) {
          teamMatchInfo.next_match_time = nextMatch.predicted_time * 1000
        }
      }

      const playedMatches = teamMatches.filter(match => 
        match.alliances.red.score !== undefined && 
        match.alliances.blue.score !== undefined
      )

      if (playedMatches.length > 0) {
        const lastMatch = playedMatches[playedMatches.length - 1]
        teamMatchInfo.current_match = `${lastMatch.comp_level}${lastMatch.match_number}`
      }

      const { error } = await supabase
        .from('teams')
        .update({
          next_match_time: teamMatchInfo.next_match_time ? 
            new Date(teamMatchInfo.next_match_time).toISOString() : null,
          current_match: teamMatchInfo.current_match || null,
          next_match: teamMatchInfo.next_match || null,
          estimated_queue_time: teamMatchInfo.estimated_queue_time ?
            new Date(teamMatchInfo.estimated_queue_time).toISOString() : null,
          estimated_field_time: teamMatchInfo.estimated_field_time ?
            new Date(teamMatchInfo.estimated_field_time).toISOString() : null
        })
        .eq('number', teamKey.replace('frc', ''))

      if (error) throw error

      updates.push({
        team_key: teamKey,
        updated: true
      })
    } catch (error) {
      console.error(`Error updating team ${teamKey}:`, error)
      updates.push({
        team_key: teamKey,
        updated: false,
        error: error.message
      })
    }
  }
  return updates
}

async function updateEventStatus(
  eventKey: string, 
  currentQualMatch: string | null,
  nexusData: NexusEventResponse
): Promise<void> {
  try {
    const { data: existingEvent, error: getError } = await supabase
      .from('events')
      .select('*')
      .eq('key', eventKey)
      .maybeSingle()

    if (getError) {
      throw getError
    }

    const eventData = {
      key: eventKey,
      current_qual_match: currentQualMatch,
      last_updated: new Date().toISOString(),
      nexus_data: nexusData
    }

    if (existingEvent) {
      const { error: updateError } = await supabase
        .from('events')
        .update(eventData)
        .eq('key', eventKey)

      if (updateError) {
        throw updateError
      }
    } else {
      const { error: insertError } = await supabase
        .from('events')
        .insert([eventData])

      if (insertError) {
        throw insertError
      }
    }
  } catch (error) {
    console.error(`Error updating event status for ${eventKey}:`, error)
  }
}

async function fetchWithTBA(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${TBA_API_BASE}${endpoint}`, {
      headers: {
        'X-TBA-Auth-Key': TBA_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`TBA API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch from TBA endpoint ${endpoint}:`, error)
    throw error
  }
}

function getCompLevelName(compLevel: string): string {
  const levelMap: Record<string, string> = {
    'qm': 'Qualification',
    'ef': 'Eighth Final',
    'qf': 'Quarter Final',
    'sf': 'Semi Final',
    'f': 'Final'
  }
  return levelMap[compLevel] || compLevel
}