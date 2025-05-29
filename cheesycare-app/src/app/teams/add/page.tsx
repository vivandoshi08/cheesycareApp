'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createTeam } from '@/lib/teamsService';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AddTeamPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({ number: '', name: '', description: '', website: '', nextMatchTime: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.number || !formState.name) {
      setError('Please fill in all required fields (Team Number and Name)');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) throw new Error('Supabase is not properly configured. Please check your environment variables.');
      const team = await createTeam(
        formState.number,
        formState.name,
        formState.nextMatchTime || undefined,
        formState.description || undefined,
        formState.website || undefined
      );
      if (team) router.push('/teams');
      else throw new Error('Failed to create team');
    } catch (err) {
      console.error('Error creating team:', err);
      setError('Failed to create team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-heading text-blue-600">Add New Team</h1>
        <Link href="/teams" className="text-blue-600 hover:text-orange-500 mt-2 sm:mt-0">← Back to Teams</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="number" className="block text-sm font-medium mb-2 text-gray-700">Team Number <span className="text-orange-500">*</span></label>
            <input type="text" id="number" name="number" value={formState.number} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-xl bg-white text-gray-900" placeholder="e.g. 254" required />
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">Team Name <span className="text-orange-500">*</span></label>
            <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-xl bg-white text-gray-900" placeholder="e.g. The Cheesy Poofs" required />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700">Description</label>
            <textarea id="description" name="description" value={formState.description} onChange={handleInputChange} rows={3} className="w-full p-2 border border-gray-300 rounded-xl bg-white text-gray-900" placeholder="Brief description of the team..." />
          </div>

          <div className="mb-4">
            <label htmlFor="website" className="block text-sm font-medium mb-2 text-gray-700">Website</label>
            <input type="url" id="website" name="website" value={formState.website} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-xl bg-white text-gray-900" placeholder="e.g. https://team254.com" />
          </div>

          <div className="mb-6">
            <label htmlFor="nextMatchTime" className="block text-sm font-medium mb-2 text-gray-700">Next Match Time</label>
            <input type="text" id="nextMatchTime" name="nextMatchTime" value={formState.nextMatchTime} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-xl bg-white text-gray-900" placeholder="e.g. 2h 15m" />
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/teams" className="px-6 py-2 border border-blue-600 text-blue-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</Link>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">{isSubmitting ? 'Adding...' : 'Add Team'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
