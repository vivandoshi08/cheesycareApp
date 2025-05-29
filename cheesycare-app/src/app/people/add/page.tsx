'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPerson, getTeams } from '@/lib/peopleService';
import { Team } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AddPersonPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [statusType, setStatusType] = useState<'free' | 'team' | 'assistance'>('free');
  const [teamId, setTeamId] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchTeams() {
      try {
        if (!isSupabaseConfigured()) throw new Error('Supabase is not properly configured');
        const teamsData = await getTeams();
        setTeams(teamsData);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Could not load teams data. Some features may be limited.');
      }
    }
    fetchTeams();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (statusType === 'team' && !teamId) errors.teamId = 'Please select a team';
    if (yearsExperience && isNaN(Number(yearsExperience))) errors.yearsExperience = 'Years of experience must be a number';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError(null);

    try {
      const parsedYearsExp = yearsExperience ? parseInt(yearsExperience, 10) : null;
      const teamIdToUse = statusType === 'team' || statusType === 'assistance' ? teamId : null;
      const newPerson = await createPerson(name, role || null, statusType, teamIdToUse, parsedYearsExp);
      if (newPerson) {
        router.push(`/people/${newPerson.id}`);
      } else {
        throw new Error('Failed to create person');
      }
    } catch (err) {
      console.error('Error creating person:', err);
      setError('Failed to create person. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-heading text-blue-600">Add New Person</h1>
        <Link href="/people" className="text-blue-600 hover:text-orange-500 mt-2 sm:mt-0">← Back to People</Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1 text-black-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg text-black`}
              placeholder="Enter person's name"
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium mb-1 text-black-700">Role</label>
            <input
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-black"
              placeholder="E.g., Mentor, Student, Volunteer"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-black-700">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {['free', 'team', 'assistance'].map((type) => (
                <label key={type} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="statusType"
                    value={type}
                    checked={statusType === type}
                    onChange={() => setStatusType(type as any)}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">
                    {type === 'free' ? 'Free' : type === 'team' ? 'Assigned to Team' : 'Needs Assistance'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {(statusType === 'team' || statusType === 'assistance') && (
            <div className="mb-4">
              <label htmlFor="teamId" className="block text-sm font-medium mb-1 text-black-700">
                Team <span className="text-red-500">*</span>
              </label>
              <select
                id="teamId"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className={`w-full p-2 border ${formErrors.teamId ? 'border-red-500' : 'border-gray-300'} rounded-lg text-black`}
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>Team {team.number} - {team.name}</option>
                ))}
              </select>
              {formErrors.teamId && <p className="mt-1 text-sm text-red-500">{formErrors.teamId}</p>}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="yearsExperience" className="block text-sm font-medium mb-1 text-black-700">
              Years of Experience
            </label>
            <input
              type="text"
              id="yearsExperience"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              className={`w-full p-2 border ${formErrors.yearsExperience ? 'border-red-500' : 'border-gray-300'} rounded-lg text-black`}
              placeholder="Number of years"
            />
            {formErrors.yearsExperience && <p className="mt-1 text-sm text-red-500">{formErrors.yearsExperience}</p>}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
