'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getPersonById, addPersonActivity, getSkills, addSkillToPerson, removeSkillFromPerson, updatePerson } from '@/lib/peopleService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Person, Skill, PersonActivity } from '@/lib/types';

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const getStatusBadge = (s: string) => {
  switch (s) {
    case 'free':
      return "bg-green-100 text-green-800";
    case 'team':
      return "bg-blue-100 text-blue-800";
    case 'assistance':
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (s: string) => {
  switch (s) {
    case 'free':
      return "Available";
    case 'team':
      return "Assigned";
    case 'assistance':
      return "Needs Assistance";
    default:
      return s;
  }
};

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activities, setActivities] = useState<PersonActivity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase is not properly configured. Please check your environment variables.');
        }
        
        const personData = await getPersonById(id as string);
        if (!personData) {
          throw new Error('Person not found');
        }
        
        setPerson(personData);
        setActivities(personData.activities || []);
        
        const availableSkills = await getSkills();
        setSkills(availableSkills);
        
      } catch (err) {
        console.error('Error fetching person:', err);
        setError('Failed to load person details. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
  
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !person) return;
    
    setAddingNote(true);
    try {
      const activity = await addPersonActivity(
        person.id,
        'note_added',
        newNote
      );
      
      if (activity) {
        setActivities([activity, ...activities]);
        setNewNote('');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setAddingNote(false);
    }
  };
  
  const handleUpdateStatus = async (newStatus: 'free' | 'team' | 'assistance') => {
    if (!person) return;
    
    try {
      const updates: Partial<Person> = {
        status_type: newStatus
      };
      
      if (newStatus === 'free') {
        updates.status_team_id = undefined;
      }
      
      if ((newStatus === 'team' || newStatus === 'assistance') && !person.status_team_id) {
        router.push(`/people/${person.id}/assign-team?status=${newStatus}`);
        return;
      }
      
      const updatedPerson = await updatePerson(person.id, updates);
      
      if (updatedPerson) {
        setPerson(updatedPerson);
        
        let activityDetails = '';
        
        if (newStatus === 'free') {
          activityDetails = 'Marked as available';
        } else if (newStatus === 'team') {
          const teamName = person.status_team?.name || '';
          const teamNumber = person.status_team?.number || '';
          activityDetails = `Assigned to Team ${teamNumber}${teamName ? ` - ${teamName}` : ''}`;
        } else if (newStatus === 'assistance') {
          const teamName = person.status_team?.name || '';
          const teamNumber = person.status_team?.number || '';
          activityDetails = `Needs assistance with Team ${teamNumber}${teamName ? ` - ${teamName}` : ''}`;
        }
        
        const activity = await addPersonActivity(
          person.id,
          'team_assignment',
          activityDetails,
          person.status_team_id,
          'team'
        );
        
        if (activity) {
          setActivities([activity, ...activities]);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };
  
  const handleAssignTeam = () => {
    if (person) {
      router.push(`/people/${person.id}/assign-team`);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <h1 className="text-3xl font-heading mb-4 text-blue-600 text-center">Loading...</h1>
      </div>
    );
  }
  
  if (error || !person) {
    return (
      <div className="max-w-4xl mx-auto text-center py-10">
        <h1 className="text-3xl font-heading mb-4 text-blue-600">Person Not Found</h1>
        <p className="text-gray-600 mb-6">{error || "The person you're looking for doesn't exist or has been removed."}</p>
        <Link href="/people" className="text-blue-600 hover:text-orange-500">
          ← Back to People
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-heading text-blue-600">
          {person.name}
        </h1>
        <Link 
          href="/people" 
          className="text-blue-600 hover:text-orange-500 mt-2 sm:mt-0"
        >
          ← Back to People
        </Link>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Basic Information</h2>
            
            <div className="space-y-3">
              {person.role && (
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-1">Role</h3>
                  <p className="text-gray-900">{person.role}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-1">Status</h3>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(person.status_type)}`}>
                    {getStatusText(person.status_type)}
                    {person.status_team && ` - Team ${person.status_team.number}`}
                  </span>
                </div>
              </div>
              
              {person.years_of_experience && (
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-1">Experience</h3>
                  <p className="text-gray-900">{person.years_of_experience} years</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-2">
              <button 
                onClick={() => handleUpdateStatus('free')}
                className={`px-3 py-1 text-sm font-medium rounded-lg border ${
                  person.status_type === 'free' 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Available
              </button>
              <button 
                onClick={() => handleUpdateStatus('team')}
                className={`px-3 py-1 text-sm font-medium rounded-lg border ${
                  person.status_type === 'team' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Assigned
              </button>
              <button 
                onClick={() => handleUpdateStatus('assistance')}
                className={`px-3 py-1 text-sm font-medium rounded-lg border ${
                  person.status_type === 'assistance' 
                    ? 'bg-orange-100 text-orange-800 border-orange-200' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Needs Assistance
              </button>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Skills</h2>
            
            {skills && skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => {
                  const hasSkill = person.skills?.some(personSkill => personSkill.id === skill.id);
                  return (
                    <button 
                      key={skill.id}
                      className={`px-3 py-1 text-sm font-medium rounded-lg border ${
                        hasSkill 
                          ? 'bg-blue-100 text-blue-800 border-blue-200' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={async () => {
                        if (hasSkill) {
                          await removeSkillFromPerson(person.id, skill.id);
                        } else {
                          await addSkillToPerson(person.id, skill.id);
                        }
                        const updatedPerson = await getPersonById(person.id);
                        if (updatedPerson) {
                          setPerson(updatedPerson);
                        }
                      }}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No skills available</p>
            )}
            
            <div className="mt-6">
              <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Team Assignment</h3>
              
              {person.status_team ? (
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
                    Team {person.status_team.number} - {person.status_team.name}
                  </span>
                  <button 
                    onClick={handleAssignTeam}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAssignTeam}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  Assign to Team
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-600">Activity</h2>
        
        <form onSubmit={handleAddNote} className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <div className="mb-4">
            <label htmlFor="note" className="block text-sm font-medium mb-1 text-gray-700">
              Add a Note
            </label>
            <textarea
              id="note"
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this person..."
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
        
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.activity_type === 'note_added' ? 'bg-gray-100 text-gray-800' :
                      activity.activity_type === 'team_assignment' ? 'bg-blue-100 text-blue-800' :
                      activity.activity_type === 'tool_checkout' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {activity.activity_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(activity.timestamp)}
                  </span>
                </div>
                <p className="text-gray-700">{activity.details}</p>
                {activity.link && (
                  <Link href={activity.link} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                    View Details
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">No activity recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
} 