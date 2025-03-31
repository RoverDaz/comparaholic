import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LockIcon, MailIcon } from 'lucide-react';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setSuccess(
          'Please check your email for a confirmation link. You can close this window.'
        );
        setEmail('');
        setPassword('');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-md border border-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/50 text-green-200 rounded-md border border-green-500">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-theme-300 mb-2">
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-500"
                required
              />
              <MailIcon className="h-5 w-5 text-theme-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-500"
                required
              />
              <LockIcon className="h-5 w-5 text-theme-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-theme-600 hover:bg-theme-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
            className="text-sm text-theme-300 hover:text-theme-200"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}