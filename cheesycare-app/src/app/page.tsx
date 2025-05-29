import Link from 'next/link';
import { Suspense } from 'react';
import { HomeMatchStatus } from './components/HomeMatchStatus';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-heading mb-6 text-blue-600 text-center sm:text-left">Dashboard</h1>
      <div className="w-full mb-8">
        <Suspense fallback={
          <div className="bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 p-4">
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        }>
          <HomeMatchStatus />
        </Suspense>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Link href="/teams" 
          className="group bg-white hover:bg-blue-600 hover:text-white text-gray-900 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 flex flex-col items-center p-6 touch-manipulation border border-gray-200"
          aria-label="Navigate to Teams page"
        >
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-heading mb-2">Teams</h3>
            <p className="text-sm sm:text-base text-gray-600 group-hover:text-white">Browse and manage team information.</p>
          </div>
        </Link>
        <Link href="/people" 
          className="group bg-white hover:bg-blue-600 hover:text-white text-gray-900 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 flex flex-col items-center p-6 touch-manipulation border border-gray-200"
          aria-label="Navigate to People page"
        >
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-heading mb-2">People</h3>
            <p className="text-sm sm:text-base text-gray-600 group-hover:text-white">Manage members and personnel.</p>
          </div>
        </Link>
        <Link href="/tools" 
          className="group bg-white hover:bg-blue-600 hover:text-white text-gray-900 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 flex flex-col items-center p-6 touch-manipulation border border-gray-200"
          aria-label="Navigate to Tools page"
        >
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-heading mb-2">Tools</h3>
            <p className="text-sm sm:text-base text-gray-600 group-hover:text-white">Access and manage team tools.</p>
          </div>
        </Link>
        <Link href="/docs" 
          className="group bg-white hover:bg-blue-600 hover:text-white text-gray-900 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 flex flex-col items-center p-6 touch-manipulation border border-gray-200"
          aria-label="Navigate to Docs page"
        >
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-heading mb-2">Docs</h3>
            <p className="text-sm sm:text-base text-gray-600 group-hover:text-white">View and manage documentation.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
