'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getTools } from '@/lib/toolsService';
import { ToolWithCheckouts } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function ToolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tools, setTools] = useState<ToolWithCheckouts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTools() {
      setLoading(true);
      try {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase is not properly configured. Please check your environment variables.');
        }
        const toolsData = await getTools();
        setTools(toolsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching tools:', err);
        setError('Failed to load tools. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, []);

  useEffect(() => {
    if (searchInputRef.current && window.innerWidth >= 768) {
      searchInputRef.current.focus();
    }
  }, []);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => tool.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tools, searchTerm]);

  const getAvailabilityPriority = (tool: ToolWithCheckouts): number => {
    if (tool.available_quantity === 0) return 1;
    if (tool.available_quantity < tool.total_quantity) return 2;
    return 3;
  };

  const sortedTools = useMemo(() => {
    return [...filteredTools].sort((a, b) => {
      const availabilityA = getAvailabilityPriority(a);
      const availabilityB = getAvailabilityPriority(b);
      if (availabilityA !== availabilityB) return availabilityA - availabilityB;
      const categoryA = a.category || 'Uncategorized';
      const categoryB = b.category || 'Uncategorized';
      if (categoryA !== categoryB) return categoryA.localeCompare(categoryB);
      return a.name.localeCompare(b.name);
    });
  }, [filteredTools]);

  const toolsByCategory = useMemo(() => {
    const categories = new Set(sortedTools.map(tool => tool.category || 'Uncategorized'));
    return Array.from(categories).map(category => ({
      category,
      tools: sortedTools.filter(tool => (tool.category || 'Uncategorized') === category)
    }));
  }, [sortedTools]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-heading mb-6 text-blue-600 text-center sm:text-left">Tools</h1>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tools..."
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
        <Link
          href="/tools/add"
          className="w-full sm:w-auto py-3 px-6 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Tool
        </Link>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700">Loading tools...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700">{error}</p>
          </div>
        ) : sortedTools.length > 0 ? (
          <>
            {toolsByCategory.map(({ category, tools: toolsInCategory }) => (
              <div key={category}>
                <h2 className="text-xl font-heading text-blue-600 mb-3 mt-6 first:mt-0">{category}</h2>
                <div className="space-y-3">
                  {toolsInCategory.map(tool => (
                    <div
                      key={tool.id}
                      className="flex flex-col sm:flex-row items-stretch border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex-grow p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                          <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                          {tool.available_quantity === 0 ? (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                              Not Available
                            </span>
                          ) : tool.available_quantity < tool.total_quantity ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              {tool.available_quantity} of {tool.total_quantity} Available
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Available
                            </span>
                          )}
                        </div>
                        {tool.checkouts && tool.checkouts.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-semibold text-gray-700">Checked Out By:</h4>
                            <ul className="mt-1 space-y-1">
                              {tool.checkouts.map((checkout, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-center gap-1">
                                  <span>{checkout.person?.name}</span>
                                  {checkout.team && (
                                    <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-full text-xs">
                                      Team {checkout.team.number}
                                    </span>
                                  )}
                                  {checkout.quantity > 1 && (
                                    <span className="text-xs text-gray-500">
                                      (Qty: {checkout.quantity})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex sm:flex-col border-t sm:border-t-0 sm:border-l border-gray-200">
                        <Link 
                          href={`/tools/${tool.id}`}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-white text-blue-600 hover:text-blue-700 text-sm font-medium border-r sm:border-r-0 sm:border-b border-gray-200 transition-colors"
                        >
                          Details
                        </Link>
                        {tool.available_quantity > 0 ? (
                          <Link 
                            href={`/tools/checkout/${tool.id}`}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-white text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
                          >
                            Check Out
                          </Link>
                        ) : (
                          <button 
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-white text-gray-400 cursor-not-allowed text-sm font-medium"
                            disabled
                          >
                            Unavailable
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700">No tools found matching your search.</p>
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
