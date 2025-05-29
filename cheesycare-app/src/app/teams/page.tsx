'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getTeams } from '@/lib/teamsService';
import { Team, TeamRedFlag } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function TeamsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState<(Team & { red_flags?: TeamRedFlag[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      try {
        if (!isSupabaseConfigured()) throw new Error('Supabase is not properly configured.');
        const teamsData = await getTeams();
        setTeams(teamsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    const lower = searchTerm.toLowerCase();
    return teams.filter(team => team.number.includes(searchTerm) || team.name.toLowerCase().includes(lower));
  }, [teams, searchTerm]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-heading mb-6 text-blue-600 text-center sm:text-left">FRC Teams</h1>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search teams by number or name..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white !text-white placeholder:text-gray-400"
            style={{ color: 'white' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-3.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" aria-label="Clear search">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <Link href="/teams/add" className="w-full sm:w-auto py-3 px-6 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Team
        </Link>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700">Loading teams...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700">{error}</p>
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => (
              <div key={team.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                <div className="p-4">
                  <div className="mb-3">
                    <span className="bg-blue-600 text-white text-lg font-bold px-3 py-1 rounded">{team.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 truncate" title={team.name}>{team.name}</h3>
                  {team.next_match_time && (
                    <div className="mb-2">
                      <div className="flex items-center text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Next Match:</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm text-gray-700 font-medium">
                          {new Date(team.next_match_time).toLocaleString([], {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                  {team.red_flags && team.red_flags.length > 0 && (
                    <div className="flex items-start mt-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm text-orange-600 font-medium">
                        {team.red_flags.length} red flag{team.red_flags.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  <Link href={`/teams/${team.number}`} className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    View Details
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700">No teams found matching your search.</p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 hover:text-orange-500">
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
