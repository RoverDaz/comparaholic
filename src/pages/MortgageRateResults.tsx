import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { ResultsFilter } from '../components/ResultsFilter';
import { useFilters } from '../hooks/useFilters';
import { supabase } from '../lib/supabase';

interface MortgageRate {
  id: string;
  bank: string;
  mortgage_amount: number;
  down_payment_percent: number;
  interest_rate: number;
  monthly_payment: number;
  term_years: string;
  amortization_period: string;
  isUserRate?: boolean;
  user_id?: string;
}

export function MortgageRateResults() {
  const [rates, setRates] = useState<MortgageRate[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formState } = useFormStore();

  const filterConfig = {
    bank: (rate: MortgageRate, values: string[]) => 
      values.includes(rate.bank),
    term_years: (rate: MortgageRate, values: string[]) =>
      values.includes(rate.term_years),
    interest_rate: (rate: MortgageRate, values: string[]) => {
      const ranges = values.map(range => {
        const [min, max] = range.split('-').map(num => parseFloat(num.replace('%', '')));
        return { min, max };
      });
      return ranges.some(range => 
        rate.interest_rate >= range.min && rate.interest_rate <= range.max
      );
    },
    monthly_payment: (rate: MortgageRate, values: string[]) => {
      const ranges = values.map(range => {
        const [min, max] = range.split('-').map(num => parseInt(num.replace('$', '')));
        return { min, max };
      });
      return ranges.some(range => 
        rate.monthly_payment >= range.min && rate.monthly_payment <= range.max
      );
    },
    mortgage_amount: (rate: MortgageRate, values: string[]) => {
      const ranges = values.map(range => {
        const [min, max] = range.split('-').map(num => parseInt(num.replace('$', '')));
        return { min, max };
      });
      return ranges.some(range => 
        rate.mortgage_amount >= range.min && rate.mortgage_amount <= range.max
      );
    }
  };

  const {
    selectedFilters,
    filteredItems: filteredRates,
    toggleFilter,
    clearFilters,
    isFilterMenuOpen,
    toggleFilterMenu
  } = useFilters<MortgageRate>(rates, filterConfig);

  const calculateMonthlyPayment = (principal: number, rate: number, years: number) => {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = years * 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  useEffect(() => {
    const isSkipped = location.state?.skip === true;
    console.log('Results page initialized', { isSkipped, hasFormState: Object.keys(formState).length > 0 });

    if (!isSkipped && Object.keys(formState).length === 0) {
      console.log('No form data found, redirecting to form');
      navigate('/compare/mortgage-rate/0');
      return;
    }

    const fetchRates = async () => {
      try {
        // Fetch all user form responses for mortgage rates
        const { data: responses, error } = await supabase
          .from('user_form_responses')
          .select('*')
          .eq('category', 'mortgage-rate')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform responses into MortgageRate objects
        const transformedRates = responses.map(response => {
          const mortgageAmount = parseFloat(response.form_data.mortgage_amount || '0');
          const downPaymentPercent = parseFloat(response.form_data.down_payment_percent || '0');
          const interestRate = parseFloat(response.form_data.interest_rate || '0');
          const amortizationYears = parseInt(response.form_data.amortization_period?.split(' ')[0] || '25');
          
          const principal = mortgageAmount * (1 - downPaymentPercent / 100);
          const monthlyPayment = calculateMonthlyPayment(principal, interestRate, amortizationYears);

          return {
            id: response.id,
            bank: response.form_data.bank || 'Unknown Bank',
            mortgage_amount: mortgageAmount,
            down_payment_percent: downPaymentPercent,
            interest_rate: interestRate,
            monthly_payment: monthlyPayment,
            term_years: response.form_data.term_years || '',
            amortization_period: response.form_data.amortization_period || '',
            isUserRate: user?.id === response.user_id,
            user_id: response.user_id
          };
        });

        // Sort rates by interest rate
        const sortedRates = transformedRates.sort((a, b) => 
          sortOrder === 'asc' ? a.interest_rate - b.interest_rate : b.interest_rate - a.interest_rate
        );

        setRates(sortedRates);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching rates:', error);
        setLoading(false);
      }
    };

    fetchRates();
  }, [location.state, navigate, sortOrder, user, formState]);

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sorted = [...rates].sort((a, b) => 
      newOrder === 'asc' ? a.interest_rate - b.interest_rate : b.interest_rate - a.interest_rate
    );
    
    setRates(sorted);
  };

  const handleEditRate = () => {
    navigate('/compare/mortgage-rate/0?edit=true');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-300 mx-auto"></div>
          <p className="mt-4 text-theme-300">Loading mortgage rates...</p>
        </div>
      </div>
    );
  }

  const filters = [
    {
      name: 'bank',
      options: Array.from(new Set(rates.map(rate => rate.bank)))
        .map(bank => ({ label: bank, value: bank }))
    },
    {
      name: 'term_years',
      options: Array.from(new Set(rates.map(rate => rate.term_years)))
        .map(term => ({ label: term, value: term }))
    },
    {
      name: 'interest_rate',
      options: [
        { label: '0-3%', value: '0-3' },
        { label: '3-5%', value: '3-5' },
        { label: '5-7%', value: '5-7' },
        { label: '7%+', value: '7-100' }
      ]
    },
    {
      name: 'monthly_payment',
      options: [
        { label: '$0-$1000', value: '0-1000' },
        { label: '$1001-$2000', value: '1001-2000' },
        { label: '$2001-$3000', value: '2001-3000' },
        { label: '$3000+', value: '3001-999999' }
      ]
    },
    {
      name: 'mortgage_amount',
      options: [
        { label: '$0-$250k', value: '0-250000' },
        { label: '$250k-$500k', value: '250000-500000' },
        { label: '$500k-$750k', value: '500000-750000' },
        { label: '$750k+', value: '750000-999999999' }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Mortgage Rate Comparison</h1>
        
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
            Sort by Interest Rate
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {rates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-theme-300">No mortgage rates available yet. Be the first to add yours!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRates.map(rate => (
            <div 
              key={rate.id} 
              className={`bg-theme-900 rounded-lg p-6 ${
                rate.isUserRate ? 'ring-2 ring-theme-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{rate.bank}</h3>
                    <p className="text-theme-300">{rate.term_years}</p>
                    {rate.isUserRate && (
                      <p className="text-sm text-theme-400">Your current rate</p>
                    )}
                  </div>
                  {rate.isUserRate && (
                    <div className="flex items-center space-x-2">
                      <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <button
                        onClick={handleEditRate}
                        className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                        title="Edit your rate"
                      >
                        <PencilIcon className="h-4 w-4 text-theme-300" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {rate.interest_rate.toFixed(2)}%
                  </p>
                  <p className="text-theme-300">interest rate</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-theme-200">
                <div className="flex justify-between">
                  <span>Mortgage Amount</span>
                  <span>${rate.mortgage_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Down Payment</span>
                  <span>{rate.down_payment_percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Payment</span>
                  <span>${rate.monthly_payment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amortization</span>
                  <span>{rate.amortization_period}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}