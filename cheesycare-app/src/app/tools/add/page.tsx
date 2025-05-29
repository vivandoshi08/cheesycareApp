'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToolCategories, createTool } from '@/lib/toolsService';
import { ToolCategory } from '@/lib/types';

export default function AddToolPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<ToolCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      try {
        const categoriesData = await getToolCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !categoryId || totalQuantity < 1) {
      setError('Please fill out all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const tool = await createTool(
        name,
        categoryId,
        totalQuantity
      );

      if (tool) {
        router.push('/tools');
      } else {
        throw new Error('Failed to create tool');
      }
    } catch (err) {
      console.error('Error creating tool:', err);
      setError('Failed to create tool. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <Link 
          href="/tools" 
          className="mr-4 text-blue-600 hover:text-blue-800"
          aria-label="Back to tools"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-heading text-blue-600">Add New Tool</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200">
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="name" className="block text-black font-medium mb-1">
            Tool Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="categoryId" className="block text-black font-medium mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="text-black">
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="totalQuantity" className="block text-black font-medium mb-1">
            Total Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="totalQuantity"
            min={1}
            value={totalQuantity}
            onChange={(e) => setTotalQuantity(parseInt(e.target.value) || 1)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || loading}
            className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {submitting ? 'Creating...' : 'Add Tool'}
          </button>
          <Link
            href="/tools"
            className="py-2 px-4 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
