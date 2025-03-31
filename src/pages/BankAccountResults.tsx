import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { ResultsFilter } from '../components/ResultsFilter';
import { useFilters } from '../hooks/useFilters';
import { supabase } from '../lib/supabase';

interface BankAccount {
  id: string;
  bank: string;
  monthly_fee: number;
  free_transactions: string;
  isUserAccount?: boolean;
  user_id?: string;
}

export function BankAccountResults() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formState } = useFormStore();

  const filterConfig = {
    bank: (account: BankAccount, values: string[]) => 
      values.includes(account.bank),
    monthly_fee: (account: BankAccount, values: string[]) => {
      const ranges = values.map(range => {
        const [min, max] = range.split('-').map(num => parseInt(num.replace('$', '')));
        return { min, max };
      });
      return ranges.some(range => 
        account.monthly_fee >= range.min && account.monthly_fee <= range.max
      );
    },
    free_transactions: (account: BankAccount, values: string[]) =>
      values.includes(account.free_transactions)
  };

  const {
    selectedFilters,
    filteredItems: filteredAccounts,
    toggleFilter,
    clearFilters,
    isFilterMenuOpen,
    toggleFilterMenu
  } = useFilters<BankAccount>(accounts, filterConfig);

  useEffect(() => {
    const isSkipped = location.state?.skip === true;
    console.log('Results page initialized', { isSkipped, hasFormState: Object.keys(formState).length > 0 });

    if (!isSkipped && Object.keys(formState).length === 0) {
      console.log('No form data found, redirecting to form');
      navigate('/compare/bank-fees/0');
      return;
    }

    const fetchAccounts = async () => {
      try {
        // Fetch all user form responses for bank fees
        const { data: responses, error } = await supabase
          .from('user_form_responses')
          .select('*')
          .eq('category', 'bank-fees')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform responses into BankAccount objects
        const transformedAccounts = responses.map(response => ({
          id: response.id,
          bank: response.form_data.bank || 'Unknown Bank',
          monthly_fee: parseFloat(response.form_data.monthly_fee || '0'),
          free_transactions: response.form_data.free_transactions || '0',
          isUserAccount: user?.id === response.user_id,
          user_id: response.user_id
        }));

        // Sort accounts by monthly fee
        const sortedAccounts = transformedAccounts.sort((a, b) => 
          sortOrder === 'asc' ? a.monthly_fee - b.monthly_fee : b.monthly_fee - a.monthly_fee
        );

        setAccounts(sortedAccounts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [location.state, navigate, sortOrder, user, formState]);

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sorted = [...accounts].sort((a, b) => 
      newOrder === 'asc' ? a.monthly_fee - b.monthly_fee : b.monthly_fee - a.monthly_fee
    );
    
    setAccounts(sorted);
  };

  const handleEditAccount = () => {
    navigate('/compare/bank-fees/0?edit=true');
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
    },
    {
      name: 'monthly_fee',
      options: [
        { label: '$0-$5', value: '0-5' },
        { label: '$6-$10', value: '6-10' },
        { label: '$11-$15', value: '11-15' },
        { label: '$16+', value: '16-999' }
      ]
    },
    {
      name: 'free_transactions',
      options: Array.from(new Set(accounts.map(account => account.free_transactions)))
        .map(transactions => ({ label: transactions, value: transactions }))
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
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
            Sort by Monthly Fee
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            )}
          </button>
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
                account.isUserAccount ? 'ring-2 ring-theme-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{account.bank}</h3>
                    <p className="text-theme-300">Checking Account</p>
                    {account.isUserAccount && (
                      <p className="text-sm text-theme-400">Your current account</p>
                    )}
                  </div>
                  {account.isUserAccount && (
                    <div className="flex items-center space-x-2">
                      <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <button
                        onClick={handleEditAccount}
                        className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                        title="Edit your account"
                      >
                        <PencilIcon className="h-4 w-4 text-theme-300" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    ${account.monthly_fee.toFixed(2)}
                  </p>
                  <p className="text-theme-300">per month</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-theme-200">
                <div className="flex justify-between">
                  <span>Free Transactions</span>
                  <span>{account.free_transactions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Cost</span>
                  <span>${(account.monthly_fee * 12).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}