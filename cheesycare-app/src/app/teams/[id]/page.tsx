'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getTeamById, getTeamMentions, addTeamNote, addTeamRedFlag, removeTeamRedFlag } from '@/lib/teamsService';
import { Team, TeamRedFlag, TeamNote } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { TeamMatchInfo as TeamMatchInfoType } from '@/lib/matchesService';
import { getTeamUpcomingMatches } from '@/lib/matchesService';
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
const SectionIcon = ({ section }: { section: string }) => {
  switch (section) {
    case 'people':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'tools':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'docs':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'matches':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = typeof params.id === 'string' ? params.id : '';
  
  const [team, setTeam] = useState<(Team & { 
    red_flags?: TeamRedFlag[], 
    notes?: TeamNote[] 
  }) | null>(null);
  const [mentions, setMentions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState<TeamMatchInfoType | null>(null);

  const [newNote, setNewNote] = useState('');
  const [newRedFlag, setNewRedFlag] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [addingRedFlag, setAddingRedFlag] = useState(false);
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase is not properly configured. Please check your environment variables.');
        }
        
        const teamData = await getTeamById(teamId);
        if (!teamData) {
          setError(`Team with ID "${teamId}" not found. Please check the team number and try again.`);
          setLoading(false);
          return;
        }
        
        setTeam(teamData);
        
        const mentionsData = await getTeamMentions(teamId);
        setMentions(mentionsData);
        
        const matchData = await getTeamUpcomingMatches(teamData.number);
        setMatchInfo(matchData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [teamId]);
  
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !team) return;
    
    setAddingNote(true);
    try {
      const note = await addTeamNote(teamId, newNote);
      
      if (note) {
        setTeam(prev => {
          if (!prev) return prev;
          
          const updatedNotes = prev.notes ? [note, ...prev.notes] : [note];
          return {
            ...prev,
            notes: updatedNotes
          };
        });
        
        setNewNote('');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setAddingNote(false);
    }
  };
  
  const handleAddRedFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRedFlag.trim() || !team) return;
    
    setAddingRedFlag(true);
    try {
      const redFlag = await addTeamRedFlag(teamId, newRedFlag);
      
      if (redFlag) {
        setTeam(prev => {
          if (!prev) return prev;
          
          const updatedRedFlags = prev.red_flags ? [...prev.red_flags, redFlag] : [redFlag];
          return {
            ...prev,
            red_flags: updatedRedFlags
          };
        });
        
        setNewRedFlag('');
      }
    } catch (error) {
      console.error('Error adding red flag:', error);
      alert('Failed to add red flag. Please try again.');
    } finally {
      setAddingRedFlag(false);
    }
  };
  
  const handleRemoveRedFlag = async (flagId: string) => {
    if (!team) return;
    
    try {
      const success = await removeTeamRedFlag(flagId);
      
      if (success) {
        setTeam(prev => {
          if (!prev || !prev.red_flags) return prev;
          
          return {
            ...prev,
            red_flags: prev.red_flags.filter(flag => flag.id !== flagId)
          };
        });
      }
    } catch (error) {
      console.error('Error removing red flag:', error);
      alert('Failed to remove red flag. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <h1 className="text-3xl font-heading mb-4 text-blue-600 text-center">Loading...</h1>
      </div>
    );
  }
  
  if (error || !team) {
    return (
      <div className="max-w-4xl mx-auto text-center py-10">
        <h1 className="text-3xl font-heading mb-4 text-blue-600">Team Not Found</h1>
        <p className="text-gray-600 mb-6">{error || "The team you're looking for doesn't exist or has been removed."}</p>
        <Link href="/teams" className="text-blue-600 hover:text-orange-500">
          ← Back to Teams
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white text-xl font-bold px-3 py-1 rounded">
            {team.number}
          </span>
          <h1 className="text-3xl font-heading text-blue-600">
            {team.name}
          </h1>
        </div>
        <Link 
          href="/teams" 
          className="text-blue-600 hover:text-orange-500 mt-2 sm:mt-0"
        >
          ← Back to Teams
        </Link>
      </div>
      
      {matchInfo && matchInfo.next_match_time && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-blue-600 px-4 py-2 rounded-t-lg">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <SectionIcon section="matches" />
                <span className="ml-2">Match Information</span>
              </h2>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-black font-bold">
                      {matchInfo.next_match ? `Next Match: ${matchInfo.next_match}` : 'No Upcoming Matches'}
                    </h3>
                    {matchInfo.next_match_time && (
                      <p className="text-gray-700 font-medium">
                        {new Date(matchInfo.next_match_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Link href="/matches" className="text-blue-600 hover:text-blue-800 text-sm">
                    View All Matches →
                  </Link>
                </div>
                
                {matchInfo.estimated_queue_time && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                      <h4 className="text-sm font-semibold text-yellow-800">Queue Time</h4>
                      <p className="text-lg font-bold text-yellow-900">
                        {new Date(matchInfo.estimated_queue_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {matchInfo.estimated_field_time && (
                      <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                        <h4 className="text-sm font-semibold text-green-800">Field Time</h4>
                        <p className="text-lg font-bold text-green-900">
                          {new Date(matchInfo.estimated_field_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {matchInfo.current_match && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-base font-medium text-gray-700">
                    Last Match: {matchInfo.current_match}
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Team Information</h2>
            
            <div className="space-y-3">
              {team.next_match_time && (
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-1">Next Match Time</h3>
                  <p className="text-black font-medium">
                    {new Date(team.next_match_time).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <Link
                href={`/teams/edit/${team.id}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit Team
              </Link>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Red Flags</h2>
            
            <form onSubmit={handleAddRedFlag} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-grow p-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Add a red flag..."
                  value={newRedFlag}
                  onChange={(e) => setNewRedFlag(e.target.value)}
                  disabled={addingRedFlag}
                />
                <button
                  type="submit"
                  disabled={addingRedFlag || !newRedFlag.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {addingRedFlag ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
            
            {team.red_flags && team.red_flags.length > 0 ? (
              <div className="space-y-2">
                {team.red_flags.map((flag) => (
                  <div 
                    key={flag.id} 
                    className="flex items-start justify-between bg-orange-50 border border-orange-200 p-3 rounded-lg"
                  >
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-gray-800">{flag.flag}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveRedFlag(flag.id)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Remove red flag"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No red flags currently.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Notes</h2>
          
          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
            <div className="mb-4">
              <label htmlFor="note" className="block text-sm font-medium mb-1 text-gray-700">
                Add a Note
              </label>
              <textarea
                id="note"
                className="w-full p-2 border border-gray-300 rounded-lg text-black"
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this team..."
                disabled={addingNote}
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </form>
          
          {team.notes && team.notes.length > 0 ? (
            <div className="space-y-4">
              {team.notes.map((note) => (
                <div 
                  key={note.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-900">
                      {note.creator?.name || 'Unknown user'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-500">No notes recorded yet</p>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Team Activity</h2>
          
          {mentions.length > 0 ? (
            <div className="space-y-4">
              {mentions.map((mention) => (
                <div 
                  key={mention.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5 text-blue-500">
                      <SectionIcon section={mention.section} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900">{mention.title}</h3>
                        <span className="text-xs text-gray-500">
                          {formatDate(mention.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{mention.details}</p>
                      <Link href={mention.link} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-500">No team activity recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 