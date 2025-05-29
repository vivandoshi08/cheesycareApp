'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getDocuments } from '@/lib/docsService';
import { Document } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function DocsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'SW' | 'AnW'>('all');
  const [documents, setDocuments] = useState<(Document & { keywords?: string[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfigured()) throw new Error();
        const docsData = await getDocuments();
        setDocuments(docsData);
        setError(null);
      } catch {
        setError('Failed to load documents. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (searchInputRef.current && window.innerWidth >= 768) {
      searchInputRef.current.focus();
    }
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch =
        !searchTerm ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.summary && doc.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.keywords && doc.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory, documents]);

  const swDocs = useMemo(() => filteredDocuments.filter(d => d.category === 'SW'), [filteredDocuments]);
  const anwDocs = useMemo(() => filteredDocuments.filter(d => d.category === 'AnW'), [filteredDocuments]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-heading mb-6 text-blue-600 text-center sm:text-left">Documentation</h1>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search documents by title, summary, or keyword..."
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
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex border-b border-gray-200 rounded-lg overflow-hidden">
          {['all', 'SW', 'AnW'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as 'all' | 'SW' | 'AnW')}
              className={`flex-1 py-2 px-4 text-center font-medium ${
                activeCategory === cat ? 'text-white bg-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {cat === 'all' ? 'All Documents' : cat === 'SW' ? 'Software' : 'Assembly'}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Link
            href="/docs/add"
            className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Document
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="p-8 text-center bg-white rounded-xl border border-gray-200 mb-6">
          <p className="text-gray-700">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-xl border border-gray-200 mb-6">
          <p className="text-gray-700">{error}</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-gray-200 mb-6">
          <p className="text-gray-600">No documents found matching your search.</p>
          <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} className="mt-4 text-blue-600 hover:text-orange-500">Clear filters</button>
        </div>
      ) : (
        <div>
          {(activeCategory === 'all' || activeCategory === 'SW') && swDocs.length > 0 && (
            <Section title="Software (SW)" docs={swDocs} setSearchTerm={setSearchTerm} />
          )}
          {(activeCategory === 'all' || activeCategory === 'AnW') && anwDocs.length > 0 && (
            <Section title="Assembly & Writing (AnW)" docs={anwDocs} setSearchTerm={setSearchTerm} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, docs, setSearchTerm }: {
  title: string;
  docs: (Document & { keywords?: string[] })[];
  setSearchTerm: (term: string) => void;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-heading mb-4 pb-2 border-b border-blue-200 text-blue-700">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {docs.map(doc => (
          <div key={doc.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
            <div className="p-4">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">{doc.title}</h3>
              <p className="text-gray-600 mb-4">{doc.summary}</p>
              {doc.keywords && doc.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {doc.keywords.map((keyword, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs cursor-pointer" onClick={() => setSearchTerm(keyword)}>
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center">
                <a href={doc.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-orange-500">
                  View Document
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <Link href={`/docs/edit/${doc.id}`} className="text-gray-500 hover:text-gray-700">Edit</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
