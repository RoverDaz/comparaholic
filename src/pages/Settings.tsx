import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function Settings() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          setFullName(data.full_name || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    }

    loadProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (!user) throw new Error('No user logged in');

      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: email,
          full_name: fullName,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });

        if (emailError) throw emailError;
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) throw passwordError;
      }

      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

        {message && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-theme-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-300"
            />
          </div>

          <div className="border-t border-theme-700 pt-6">
            <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-300"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-theme-600 hover:bg-theme-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}