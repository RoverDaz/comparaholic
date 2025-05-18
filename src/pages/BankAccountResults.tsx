import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { ResultsFilter } from '../components/ResultsFilter';
import { useFilters } from '../hooks/useFilters';
import { supabase } from '../lib/supabase';
import Cookies from 'js-cookie';

interface BankAccount {
  id: string;
  bank: string;
  visitor_name: string;
  monthly_fee: string;
  free_transactions: string;
  created_at: string;
  isUserAccount?: boolean;
  isVisitorAccount?: boolean;
  visitor_id?: string;
  user_id?: string;
  source: 'user' | 'visitor';
}

export function BankAccountResults() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to newest first
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formState } = useFormStore();
  
  // Get visitor ID from cookie or generate a new one
  const getVisitorId = () => {
    let visitorId = Cookies.get('visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      Cookies.set('visitor_id', visitorId, { expires: 7 });
    }
    return visitorId;
  };

  const visitorId = getVisitorId();

  const filterConfig = {
    bank: (account: BankAccount, values: string[]) => 
      values.includes(account.bank)
  };

  const {
    selectedFilters,
    filteredItems: filteredAccounts,
    toggleFilter,
    clearFilters,
    isFilterMenuOpen,
    toggleFilterMenu
  } = useFilters<BankAccount>(accounts, filterConfig);

  // Check admin status when user changes
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (error) throw error;
        setIsAdmin(data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        // Fetch both user form responses and visitor submissions
        const [{ data: userResponses, error: userError }, { data: visitorSubmissions, error: visitorError }] = await Promise.all([
          supabase
            .from('user_form_responses')
            .select('*')
            .eq('category', 'bank-fees')
            .order('created_at', { ascending: false }),
          supabase
            .from('visitor_submissions')
            .select('*')
            .eq('category', 'bank-fees')
            .is('claimed_by', null)
            .order('created_at', { ascending: false })
        ]);

        if (userError) throw userError;
        if (visitorError) throw visitorError;

        let allAccounts: BankAccount[] = [];

        // Transform user responses
        if (userResponses) {
          const userAccounts = userResponses.map(response => ({
            id: response.id,
            bank: response.form_data.bank || 'Unknown Bank',
            visitor_name: response.form_data.visitor_name || 'Anonymous',
            monthly_fee: response.form_data.monthly_fee || '$0',
            free_transactions: response.form_data.free_transactions || '0',
            created_at: response.created_at,
            isUserAccount: user?.id === response.user_id,
            user_id: response.user_id,
            source: 'user' as const
          }));
          allAccounts = [...allAccounts, ...userAccounts];
        }

        // Transform visitor submissions (only unclaimed ones)
        if (visitorSubmissions) {
          const visitorAccounts = visitorSubmissions
            .filter(submission => !submission.claimed_by) // Extra safety check
            .map(submission => ({
              id: submission.id,
              bank: submission.form_data.bank || 'Unknown Bank',
              visitor_name: submission.form_data.visitor_name || 'Anonymous',
              monthly_fee: submission.form_data.monthly_fee || '$0',
              free_transactions: submission.form_data.free_transactions || '0',
              created_at: submission.created_at,
              isVisitorAccount: visitorId === submission.visitor_id,
              visitor_id: submission.visitor_id,
              source: 'visitor' as const
            }));
          allAccounts = [...allAccounts, ...visitorAccounts];
        }

        // Sort by date
        const sortedAccounts = [...allAccounts].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setAccounts(sortedAccounts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setLoading(false);
      }
    }

    fetchAccounts();
  }, [user, visitorId, sortOrder]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleEdit = (account: BankAccount) => {
    navigate('/compare/bank-fees/0', {
      state: {
        editData: {
          bank: account.bank,
          visitor_name: account.visitor_name,
          monthly_fee: account.monthly_fee,
          free_transactions: account.free_transactions,
          updated_at: new Date().toISOString()
        }
      }
    });
  };

  const handleNewSubmission = () => {
    navigate('/compare/bank-fees/0', {
      state: { newSubmission: true }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearAll = async () => {
    try {
      console.log('Button clicked - starting deletion process...');

      // Call the stored procedure to clear ALL bank fees data
      const { error } = await supabase
        .rpc('clear_bank_fees_data');

      if (error) {
        console.error('Error clearing bank fees data:', error);
        return;
      }

      console.log('All bank fees data cleared successfully');
      
      // Wait 3 seconds before refreshing to see the logs
      console.log('Waiting 3 seconds before refreshing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Force a hard refresh
      window.location.reload();
    } catch (error) {
      console.error('Error in deletion process:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-300 mx-auto"></div>
          <p className="mt-4 text-theme-300">Loading bank accounts...</p>
        </div>
      </div>
    );
  }

  const filters = [
    {
      name: 'bank',
      options: Array.from(new Set(accounts.map(account => account.bank)))
        .map(bank => ({ label: bank, value: bank }))
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Bank Account Comparison</h1>
        
        <div className="flex items-center space-x-4">
          <ResultsFilter
            filters={filters}
            selectedFilters={selectedFilters}
            onFilterChange={toggleFilter}
            onClearFilters={clearFilters}
            isOpen={isFilterMenuOpen}
            onToggle={toggleFilterMenu}
          />
          
          <button
            onClick={toggleSort}
            className="flex items-center px-4 py-2 bg-theme-800 text-white rounded-lg hover:bg-theme-700"
          >
            Sort by Date
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            )}
          </button>

          <button
            onClick={handleNewSubmission}
            className="px-4 py-2 bg-theme-600 text-white rounded-lg hover:bg-theme-700 transition-colors"
          >
            Add New Submission
          </button>

          {isAdmin && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All Results
            </button>
          )}
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-theme-300">No bank account comparisons available yet. Be the first to add yours!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map(account => (
            <div 
              key={account.id} 
              className={`bg-theme-900 rounded-lg p-6 ${
                (account.isUserAccount || account.isVisitorAccount) ? 'ring-2 ring-theme-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {account.bank}
                    </h3>
                    {(account.isUserAccount || account.isVisitorAccount) && (
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                        <button
                          onClick={() => handleEdit(account)}
                          className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                          title="Edit your account"
                        >
                          <PencilIcon className="h-4 w-4 text-theme-300" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-theme-300">
                    {account.monthly_fee} per month
                  </div>
                  <div className="text-sm text-theme-400">
                    {account.free_transactions} free transactions per month
                  </div>
                  {account.isVisitorAccount && (
                    <p className="text-sm text-theme-400">Your account (visitor)</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-theme-800">
                <div className="flex justify-between items-center text-xs text-theme-400">
                  <span>by {account.visitor_name}</span>
                  <span>{formatDate(account.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}