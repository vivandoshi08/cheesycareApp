'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createDocument } from '@/lib/docsService';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AddDocumentPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    title: '',
    category: '' as '' | 'SW' | 'AnW',
    summary: '',
    link: '',
    keywords: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.category || !formState.link) {
      setError('Please fill in all required fields (Title, Category, and Link)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) throw new Error();
      const keywords = formState.keywords
        ? formState.keywords.split(',').map(k => k.trim()).filter(Boolean)
        : undefined;
      const doc = await createDocument(
        formState.title,
        formState.category,
        formState.summary,
        formState.link,
        keywords
      );
      if (!doc) throw new Error();
      router.push('/docs');
    } catch {
      setError('Failed to create document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-heading text-blue-600">Add New Document</h1>
        <Link href="/docs" className="text-blue-600 hover:text-orange-500 mt-2 sm:mt-0">← Back to Documents</Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-700">
              Title <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formState.title}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-xl bg-white text-gray-900"
              placeholder="e.g. Robot Control System Architecture"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium mb-2 text-gray-700">
              Category <span className="text-orange-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formState.category}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-xl bg-white text-gray-900"
              required
            >
              <option value="">Select a category</option>
              <option value="SW">Software (SW)</option>
              <option value="AnW">Assembly & Writing (AnW)</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="summary" className="block text-sm font-medium mb-2 text-gray-700">Summary</label>
            <textarea
              id="summary"
              name="summary"
              value={formState.summary}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-xl bg-white text-gray-900"
              placeholder="Brief description of the document..."
            />
          </div>
          <div className="mb-4">
            <label htmlFor="link" className="block text-sm font-medium mb-2 text-gray-700">
              Link <span className="text-orange-500">*</span>
            </label>
            <input
              type="url"
              id="link"
              name="link"
              value={formState.link}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-xl bg-white text-gray-900"
              placeholder="e.g. https://drive.google.com/file/123456"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="keywords" className="block text-sm font-medium mb-2 text-gray-700">Keywords (comma-separated)</label>
            <input
              type="text"
              id="keywords"
              name="keywords"
              value={formState.keywords}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-xl bg-white text-gray-900"
              placeholder="e.g. robot, control, architecture"
            />
            <p className="mt-1 text-xs text-gray-600">Separate keywords with commas</p>
          </div>
          <div className="flex justify-end gap-3">
            <Link
              href="/docs"
              className="px-6 py-2 border border-blue-600 text-blue-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
