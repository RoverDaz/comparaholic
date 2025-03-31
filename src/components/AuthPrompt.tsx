import React from 'react';
import { Link } from 'react-router-dom';
import { LockIcon } from 'lucide-react';

export function AuthPrompt() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-900 rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="bg-theme-800 p-3 rounded-full mb-4">
            <LockIcon className="h-8 w-8 text-theme-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Create an Account to Continue
          </h2>
          <p className="text-theme-300 mb-6">
            Sign up now to save your comparisons, access all categories, and get personalized recommendations.
          </p>
          <div className="space-y-4 w-full">
            <Link
              to="/auth"
              className="block w-full px-4 py-2 bg-theme-500 text-white rounded-lg text-center hover:bg-theme-600 transition-colors"
            >
              Sign Up or Sign In
            </Link>
            <button
              onClick={() => window.history.back()}
              className="block w-full px-4 py-2 bg-theme-800 text-white rounded-lg hover:bg-theme-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}