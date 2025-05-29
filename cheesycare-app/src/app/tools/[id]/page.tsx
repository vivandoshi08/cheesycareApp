'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getToolById, returnTool } from '@/lib/toolsService';
import { ToolWithCheckouts } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ToolDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [tool, setTool] = useState<ToolWithCheckouts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [processingReturnId, setProcessingReturnId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (!isSupabaseConfigured()) throw new Error('Supabase is not properly configured.');
        const toolData = await getToolById(id as string);
        if (!toolData) throw new Error('Tool not found');
        setTool(toolData);
        setError(null);
      } catch (err) {
        console.error('Error fetching tool:', err);
        setError('Failed to load tool details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleReturnTool(checkoutId: string) {
    if (!tool || isReturning) return;
    setIsReturning(true);
    setProcessingReturnId(checkoutId);
    try {
      const success = await returnTool(checkoutId);
      if (success) {
        const updatedTool = await getToolById(id as string);
        if (updatedTool) setTool(updatedTool);
      } else throw new Error('Failed to return tool');
    } catch (err) {
      console.error('Error returning tool:', err);
      alert('Failed to return the tool. Please try again.');
    } finally {
      setIsReturning(false);
      setProcessingReturnId(null);
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto py-10"><h1 className="text-3xl font-heading mb-4 text-blue-600 text-center">Loading...</h1></div>;

  if (error || !tool) return (
    <div className="max-w-4xl mx-auto text-center py-10">
      <h1 className="text-3xl font-heading mb-4 text-blue-600">Tool Not Found</h1>
      <p className="text-gray-600 mb-6">{error || "The tool you're looking for doesn't exist or has been removed."}</p>
      <Link href="/tools" className="text-blue-600 hover:text-orange-500">← Back to Tools</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-heading text-blue-600">{tool.name}</h1>
        <Link href="/tools" className="text-blue-600 hover:text-orange-500 mt-2 sm:mt-0">← Back to Tools</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Tool Info</h2>
            <div className="space-y-3">
              <div><h3 className="text-sm uppercase text-gray-500 mb-1">Category</h3><p className="text-gray-900">{tool.category || 'Uncategorized'}</p></div>
              <div><h3 className="text-sm uppercase text-gray-500 mb-1">Availability</h3><span className={`px-3 py-1 rounded-full text-sm font-medium ${tool.available_quantity === 0 ? 'bg-orange-100 text-orange-800' : tool.available_quantity < tool.total_quantity ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{tool.available_quantity} of {tool.total_quantity} Available</span></div>
            </div>
            <div className="mt-6 flex gap-3">
              {tool.available_quantity > 0 && <Link href={`/tools/checkout/${tool.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Check Out</Link>}
              <Link href={`/tools/edit/${tool.id}`} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Edit Tool</Link>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Current Status</h2>
            {tool.checkouts && tool.checkouts.length > 0 ? (
              <div className="space-y-4">
                {tool.checkouts.map((c) => (
                  <div key={c.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div><div className="text-gray-900 font-medium">{c.person?.name}</div>{c.team && <div className="text-sm text-gray-600">Team {c.team.number}</div>}</div>
                      <div className="text-right"><div className="text-sm text-gray-500">Checked out:</div><div className="text-sm font-medium">{formatDate(c.checkout_time)}</div></div>
                    </div>
                    {c.quantity > 1 && <div className="text-sm text-gray-600 mb-2">Quantity: {c.quantity}</div>}
                    {c.expected_return_time && <div className="text-sm text-gray-600 mb-2">Expected return: {formatDate(c.expected_return_time)}</div>}
                    {c.notes && <div className="text-sm text-gray-600 mb-2">Notes: {c.notes}</div>}
                    <div className="mt-3">
                      <button onClick={() => handleReturnTool(c.id)} disabled={isReturning} className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                        {processingReturnId === c.id ? 'Returning...' : 'Return Tool'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-gray-600">All units available for checkout.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
