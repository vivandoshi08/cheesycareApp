import { formatMatchLabel } from '@/lib/matchesService';
import type { TeamMatchInfo as TeamMatchInfoType } from '@/lib/matchesService';

interface TeamMatchInfoProps {
  team: TeamMatchInfoType;
  showHeading?: boolean;
  compact?: boolean;
}

export function TeamMatchInfo({ team, showHeading = true, compact = false }: TeamMatchInfoProps) {
  if (!team.next_match_time && !team.next_match) {
    return compact
      ? <div className="text-sm text-black-500">No upcoming matches</div>
      : <div className="p-4 bg-gray-50 rounded-lg"><p className="text-black-600">No upcoming matches scheduled for this team.</p></div>;
  }

  const nextMatchLabel = formatMatchLabel(team.next_match || '');
  const lastMatchLabel = formatMatchLabel(team.current_match || '');

  if (compact) {
    return (
      <div className="text-sm">
        <div className="flex items-center space-x-2">
          <span className="font-medium">{nextMatchLabel}</span>
          {team.next_match_time && (
            <span className="text-xs">
              {new Date(team.next_match_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {showHeading && (
        <div className="bg-blue-600 px-4 py-2">
          <h3 className="text-lg font-semibold text-white">Match Information</h3>
        </div>
      )}
      <div className="p-4">
        {team.next_match && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold">Next Match: {nextMatchLabel}</h4>
              {team.next_match_time && (
                <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  {new Date(team.next_match_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              {team.estimated_queue_time && (
                <div className="bg-yellow-50 p-2 rounded">
                  <span className="font-medium">Queue Time:</span>{' '}
                  {new Date(team.estimated_queue_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {team.estimated_field_time && (
                <div className="bg-green-50 p-2 rounded">
                  <span className="font-medium">Field Time:</span>{' '}
                  {new Date(team.estimated_field_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        )}
        {team.current_match && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-base font-medium text-gray-700">Last Match: {lastMatchLabel}</h4>
          </div>
        )}
      </div>
    </div>
  );
}
