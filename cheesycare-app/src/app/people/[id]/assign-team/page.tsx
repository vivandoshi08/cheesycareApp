'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getPersonById, getTeams, updatePerson, addPersonActivity } from '@/lib/peopleService';
import { Team, Person } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AssignTeamPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfigured()) throw new Error();
        const personData = await getPersonById(id as string);
        if (!personData) throw new Error();
        setPerson(personData);
        if (personData.status_team_id) setSelectedTeamId(personData.status_team_id);
        const teamsData = await getTeams();
        setTeams(teamsData);
        setError(null);
      } catch {
        setError('Failed to load necessary data. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;
    setSubmitting(true);
    setError(null);
    try {
      const isRemovingTeam = selectedTeamId === '';
      const newStatusType = isRemovingTeam ? 'free' : 'team';
      const updatedPerson = await updatePerson(person.id, {
        status_team_id: selectedTeamId || undefined,
        status_type: newStatusType,
      });
      if (!updatedPerson) throw new Error();
      const team = teams.find(t => t.id === selectedTeamId);
      const activityDetails = isRemovingTeam ? 'Removed from team' : `Assigned to Team ${team?.number} - ${team?.name}`;
      await addPersonActivity(person.id, 'team_assignment', activityDetails, selectedTeamId || undefined, 'team');
      router.push(`/people/${person.id}`);
    } catch {
      setError('Failed to update team assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-heading mb-4 text-blue-600 text-center">Loading...</h1>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <h1 className="text-3xl font-heading mb-4 text-blue-600">Error</h1>
        <p className="text-gray-600 mb-6">{error || "Could not find person details"}</p>
        <Link href="/people" className="text-blue-600 hover:text-orange-500">← Back to People</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-heading text-blue-600">Assign Team</h1>
        <Link href={`/people/${person.id}`} className="text-blue-600 hover:text-orange-500 mt-2 sm:mt-0">
          ← Back to {person.name}
        </Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
        <div className="mb-4">
          <span className="text-gray-500">Person:</span>
          <h2 className="text-xl font-semibold text-gray-900">{person.name}</h2>
        </div>
        {person.status_team && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-blue-800">
              Currently assigned to <strong>Team {person.status_team.number} - {person.status_team.name}</strong>
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="teamId" className="block text-sm font-medium mb-2 text-gray-700">
              Team Assignment
            </label>
            <select
              id="teamId"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
            >
              <option value="">No Team (Mark as Free)</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  Team {team.number} - {team.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              {selectedTeamId 
                ? "This person will be assigned to the selected team." 
                : "This person will be marked as Free and not assigned to any team."}
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <Link href={`/people/${person.id}`} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</Link>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors">
              {submitting ? 'Updating...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
