'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getPeople } from '@/lib/peopleService';
import { Person } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPeople() {
      setLoading(true);
      try {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase is not properly configured.');
        }
        const peopleData = await getPeople();
        setPeople(peopleData);
        setError(null);
      } catch (err) {
        console.error('Error fetching people:', err);
        setError('Failed to load people. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchPeople();
  }, []);

  const filteredPeople = useMemo(() =>
    people.filter(person =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [people, searchTerm]);

  const getStatusPriority = (status: string): number => {
    switch (status) {
      case 'assistance': return 1;
      case 'free': return 2;
      case 'team': return 3;
      default: return 4;
    }
  };

  const sortedPeople = useMemo(() =>
    [...filteredPeople].sort((a, b) => {
      const priorityA = getStatusPriority(a.status_type);
      const priorityB = getStatusPriority(b.status_type);
      return priorityA !== priorityB ? priorityA - priorityB : a.name.localeCompare(b.name);
    }), [filteredPeople]);

  const StatusDisplay = ({ status_type, status_team }: { status_type: string, status_team?: any }) => {
    const baseStyle = "px-2 py-1 rounded-full text-sm font-medium";
    const statusMap: Record<string, { text: string, style: string }> = {
      'team': { text: `Team ${status_team?.number}`, style: "bg-yellow-100 text-yellow-800" },
      'free': { text: "Free", style: "bg-green-100 text-green-800" },
      'assistance': { text: `Need Assistance (${status_team?.number})`, style: "bg-orange-100 text-orange-800" }
    };
    const status = statusMap[status_type];
    return status ? <span className={`${baseStyle} ${status.style}`}>{status.text}</span> : null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-heading mb-6 text-blue-600 text-center sm:text-left">People</h1>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search people..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder:text-gray-400"
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
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-6">
        <Link
          href="/people/add"
          className="w-full sm:w-auto py-3 px-6 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Person
        </Link>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700">Loading people...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700">{error}</p>
          </div>
        ) : sortedPeople.length > 0 ? (
          sortedPeople.map((person) => (
            <div
              key={person.id}
              className="flex flex-col sm:flex-row items-stretch border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex-grow flex flex-col sm:flex-row p-4 items-center gap-3">
                <span className="font-semibold text-lg sm:w-1/3 text-center sm:text-left text-gray-900">{person.name}</span>
                <div className="sm:w-1/3 flex justify-center">
                  <StatusDisplay status_type={person.status_type} status_team={person.status_team} />
                </div>
              </div>
              <Link
                href={`/people/${person.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:px-6 text-center font-medium transition-colors flex items-center justify-center sm:w-1/6"
              >
                Details
              </Link>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700">No people found matching your search.</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 text-blue-600 hover:text-orange-500"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
