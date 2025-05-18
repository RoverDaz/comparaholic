import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PencilIcon, SaveIcon, XIcon } from 'lucide-react';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
  created_at: string;
}

interface EditableUser extends User {
  isEditing: boolean;
  editedName: string;
  editedEmail: string;
  newPassword: string;
}

export function Admin() {
  const [users, setUsers] = useState<EditableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAndFetchUsers() {
      console.log('Starting checkAdminAndFetchUsers...');
      
      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate('/auth');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Checking admin status for user:', user.id);
        // Check if user is admin
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
        
        if (adminError) {
          console.error('Admin check error:', adminError);
          throw new Error(`Admin check failed: ${adminError.message}`);
        }
        
        console.log('Admin check result:', isAdmin);
        if (!isAdmin) {
          console.log('User is not admin, redirecting to home');
          navigate('/');
          return;
        }

        console.log('User is admin, proceeding to fetch users...');
        // Fetch all users using the secure function
        const { data: usersData, error: usersError } = await supabase.rpc('get_users');

        if (usersError) {
          console.error('Error fetching users:', usersError);
          throw new Error(`Failed to fetch users: ${usersError.message}`);
        }

        if (!isMounted) {
          console.log('Component unmounted, stopping execution');
          return;
        }

        console.log('Users data received:', usersData);
        console.log('Number of users:', usersData?.length || 0);

        if (!Array.isArray(usersData)) {
          console.error('Users data is not an array:', usersData);
          throw new Error('Invalid users data format');
        }

        if (usersData.length === 0) {
          console.log('No users found');
        }

        const processedUsers = usersData.map((user: { 
          id: string; 
          email: string; 
          user_metadata: { full_name?: string }; 
          created_at: string; 
        }) => {
          console.log('Processing user:', user.id, user.email);
          return {
            ...user,
            isEditing: false,
            editedName: user.user_metadata?.full_name || '',
            editedEmail: user.email,
            newPassword: ''
          };
        });

        console.log('Setting users state with processed data');
        setUsers(processedUsers);
        console.log('Users state updated successfully');
      } catch (err) {
        console.error('Error in checkAdminAndFetchUsers:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load users');
        }
      } finally {
        if (isMounted) {
          console.log('Setting loading to false');
          setLoading(false);
        }
      }
    }

    checkAdminAndFetchUsers();

    return () => {
      console.log('Cleanup: setting isMounted to false');
      isMounted = false;
    };
  }, [user, navigate]);

  const handleEdit = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isEditing: true }
        : user
    ));
  };

  const handleCancel = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            isEditing: false,
            editedName: user.user_metadata?.full_name || '',
            editedEmail: user.email,
            newPassword: ''
          }
        : user
    ));
  };

  const handleSave = async (userId: string) => {
    try {
      console.log('Starting user update for:', userId);
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        throw new Error('User not found');
      }

      // Create new metadata object
      const newMetadata = {
        ...userToUpdate.user_metadata,
        full_name: userToUpdate.editedName
      };

      console.log('Updating user metadata:', newMetadata);
      
      // Call our new function instead of using admin API
      const { error } = await supabase.rpc('update_user_metadata', {
        target_user_id: userId,
        new_metadata: newMetadata
      });

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      console.log('User updated successfully');
      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              isEditing: false,
              email: userToUpdate.editedEmail,
              user_metadata: {
                ...user.user_metadata,
                full_name: userToUpdate.editedName
              },
              newPassword: ''
            }
          : user
      ));
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-300 mx-auto"></div>
          <p className="mt-4 text-theme-300">Loading users...</p>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-theme-600 text-white rounded hover:bg-theme-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-8">User Management</h1>
      
      <div className="bg-theme-900 rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-theme-800">
          <thead className="bg-theme-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-300 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-theme-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-theme-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isEditing ? (
                    <input
                      type="text"
                      value={user.editedName}
                      onChange={(e) => setUsers(users.map(u => 
                        u.id === user.id ? { ...u, editedName: e.target.value } : u
                      ))}
                      className="bg-theme-700 text-white px-2 py-1 rounded"
                    />
                  ) : (
                    <div className="text-white">{user.user_metadata?.full_name || 'No name'}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isEditing ? (
                    <input
                      type="email"
                      value={user.editedEmail}
                      onChange={(e) => setUsers(users.map(u => 
                        u.id === user.id ? { ...u, editedEmail: e.target.value } : u
                      ))}
                      className="bg-theme-700 text-white px-2 py-1 rounded"
                    />
                  ) : (
                    <div className="text-white">{user.email}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-theme-300">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {user.isEditing ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleSave(user.id)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <SaveIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleCancel(user.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(user.id)}
                      className="text-theme-300 hover:text-theme-200"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 