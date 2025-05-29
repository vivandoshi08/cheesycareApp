import Link from 'next/link';
import {
  getActiveEvents,
  getCurrentQualMatch,
  getTeamUpcomingMatches,
  formatMatchLabel,
  getEventMatches,
} from '@/lib/matchesService';

export async function HomeMatchStatus() {
  const events = await getActiveEvents();
  const currentEvent = events[0] || null;
  const team254 = await getTeamUpcomingMatches('254');

  const fallbackMatch = {
    label: "Qualification 24",
    status: "Now queuing",
    redTeams: ["1323", "118", "604"],
    blueTeams: ["2056", "973", "148"],
    times: { estimatedStartTime: Date.now() + 2 * 60 * 1000 },
  };

  const matches = currentEvent ? await getEventMatches(currentEvent.key) : [];
  const currentMatch =
    matches.find(
      m =>
        m.status === "Now queuing" &&
        !m.redTeams.includes("254") &&
        !m.blueTeams.includes("254")
    ) || fallbackMatch;

  if (!currentEvent && !team254) return null;

  return (
    <div className="bg-blue-50 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-900">Match Status</h2>
        <Link href="/teams/254" className="text-blue-700 hover:text-blue-900 text-sm font-bold">
          View Team 254 →
        </Link>
      </div>

      {currentMatch && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">Current Match: {currentMatch.label}</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-2 gap-4">
              {["Red", "Blue"].map(color => (
                <div key={color} className={`bg-${color === "Red" ? "red" : "blue"}-100 p-2 rounded-lg mb-2`}>
                  <h4 className={`text-${color.toLowerCase()}-800 font-bold mb-1`}>{color} Alliance</h4>
                  <div className="space-y-1">
                    {currentMatch[color === "Red" ? "redTeams" : "blueTeams"].map((team: string) => (
                      <Link key={team} href={`/teams/${team}`} className="block bg-white rounded p-2 font-medium hover:bg-gray-50">
                        Team {team}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <div className="inline-block bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                {new Date(currentMatch.times.estimatedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      )}

      {team254?.next_match && team254?.next_match_time && (
        <div className="pt-2">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Team 254 - Next Match</h3>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-lg font-bold text-blue-900">{formatMatchLabel(team254.next_match)}</span>
                <div className="text-md font-medium text-blue-800">
                  {new Date(team254.next_match_time).toLocaleString()}
                </div>
              </div>
              {team254.estimated_queue_time && (
                <div className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                  Queue at {new Date(team254.estimated_queue_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
            <div className="mb-4 bg-red-50 p-3 rounded-lg border-2 border-red-200">
              <h4 className="text-red-800 font-bold mb-2 text-sm">OUR ALLIANCE</h4>
              <div className="grid grid-cols-3 gap-2">
                {["254", "1678", "971"].map((team) => (
                  <Link key={team} href={`/teams/${team}`} className="bg-white p-2 rounded text-center">
                    <span className="block font-bold text-red-900">{team}</span>
                    <span className="text-xs text-red-800">{team === "254" ? "Cheesy Poofs" : team === "1678" ? "Citrus Circuits" : "Spartan Robotics"}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mb-4 bg-gray-50 p-2 rounded-lg">
              <h4 className="text-gray-700 font-medium mb-1 text-sm">Opposing Alliance:</h4>
              <div className="text-sm text-gray-900 font-bold">2056, 118, 604</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <div className="text-sm font-bold text-blue-800 mb-1">Queue Time</div>
                <div className="font-bold text-blue-900 text-lg">
                  {team254.estimated_queue_time
                    ? new Date(team254.estimated_queue_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Unknown'}
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <div className="text-sm font-bold text-green-800 mb-1">On Field</div>
                <div className="font-bold text-green-900 text-lg">
                  {team254.estimated_field_time
                    ? new Date(team254.estimated_field_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
