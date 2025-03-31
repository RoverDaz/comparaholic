import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { ResultsFilter } from '../components/ResultsFilter';
import { useFilters } from '../hooks/useFilters';
import { supabase } from '../lib/supabase';

interface InsuranceQuote {
  id: string;
  provider: string;
  annual_premium: number;
  monthly_premium: number;
  age_range: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  license_age: string;
  claims_count: string;
  city: string;
  isUserQuote?: boolean;
  user_id?: string;
}

export function CarInsuranceResults() {
  const [quotes, setQuotes] = useState<InsuranceQuote[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formState } = useFormStore();

  const filterConfig = {
    provider: (quote: InsuranceQuote, values: string[]) => 
      values.includes(quote.provider),
    age_range: (quote: InsuranceQuote, values: string[]) =>
      values.includes(quote.age_range),
    vehicle_make: (quote: InsuranceQuote, values: string[]) =>
      values.includes(quote.vehicle_make),
    monthly_premium: (quote: InsuranceQuote, values: string[]) => {
      const ranges = values.map(range => {
        const [min, max] = range.split('-').map(num => parseInt(num.replace('$', '')));
        return { min, max };
      });
      return ranges.some(range => 
        quote.monthly_premium >= range.min && quote.monthly_premium <= range.max
      );
    },
    city: (quote: InsuranceQuote, values: string[]) =>
      values.includes(quote.city)
  };

  const {
    selectedFilters,
    filteredItems: filteredQuotes,
    toggleFilter,
    clearFilters,
    isFilterMenuOpen,
    toggleFilterMenu
  } = useFilters<InsuranceQuote>(quotes, filterConfig);

  useEffect(() => {
    const isSkipped = location.state?.skip === true;
    console.log('Results page initialized', { isSkipped, hasFormState: Object.keys(formState).length > 0 });

    if (!isSkipped && Object.keys(formState).length === 0) {
      console.log('No form data found, redirecting to form');
      navigate('/compare/car-insurance/0');
      return;
    }

    const fetchQuotes = async () => {
      try {
        // Fetch all user form responses for car insurance
        const { data: responses, error } = await supabase
          .from('user_form_responses')
          .select('*')
          .eq('category', 'car-insurance')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform responses into InsuranceQuote objects
        const transformedQuotes = responses.map(response => {
          const annualPremium = parseFloat(response.form_data.annual_premium || '0');
          return {
            id: response.id,
            provider: response.form_data.current_provider || 'Unknown Provider',
            annual_premium: annualPremium,
            monthly_premium: annualPremium / 12,
            age_range: response.form_data.age || 'Unknown',
            vehicle_make: response.form_data.make || 'Unknown',
            vehicle_model: response.form_data.model || 'Unknown',
            vehicle_year: response.form_data.year || 'Unknown',
            license_age: response.form_data.license_age || 'Unknown',
            claims_count: response.form_data.claims || '0',
            city: response.form_data.city || 'Unknown',
            isUserQuote: user?.id === response.user_id,
            user_id: response.user_id
          };
        });

        // Sort quotes by monthly premium
        const sortedQuotes = transformedQuotes.sort((a, b) => 
          sortOrder === 'asc' ? a.monthly_premium - b.monthly_premium : b.monthly_premium - a.monthly_premium
        );

        setQuotes(sortedQuotes);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quotes:', error);
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [location.state, navigate, sortOrder, user, formState]);

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sorted = [...quotes].sort((a, b) => 
      newOrder === 'asc' ? a.monthly_premium - b.monthly_premium : b.monthly_premium - a.monthly_premium
    );
    
    setQuotes(sorted);
  };

  const handleEditQuote = () => {
    navigate('/compare/car-insurance/0?edit=true');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-300 mx-auto"></div>
          <p className="mt-4 text-theme-300">Loading insurance quotes...</p>
        </div>
      </div>
    );
  }

  const filters = [
    {
      name: 'provider',
      options: Array.from(new Set(quotes.map(quote => quote.provider)))
        .map(provider => ({ label: provider, value: provider }))
    },
    {
      name: 'age_range',
      options: Array.from(new Set(quotes.map(quote => quote.age_range)))
        .map(age => ({ label: age, value: age }))
    },
    {
      name: 'vehicle_make',
      options: Array.from(new Set(quotes.map(quote => quote.vehicle_make)))
        .map(make => ({ label: make, value: make }))
    },
    {
      name: 'monthly_premium',
      options: [
        { label: '$0-$100', value: '0-100' },
        { label: '$101-$200', value: '101-200' },
        { label: '$201-$300', value: '201-300' },
        { label: '$300+', value: '301-999999' }
      ]
    },
    {
      name: 'city',
      options: Array.from(new Set(quotes.map(quote => quote.city)))
        .map(city => ({ label: city, value: city }))
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Car Insurance Comparison</h1>
        
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
            Sort by Monthly Premium
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-theme-300">No insurance quotes available yet. Be the first to add yours!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map(quote => (
            <div 
              key={quote.id} 
              className={`bg-theme-900 rounded-lg p-6 ${
                quote.isUserQuote ? 'ring-2 ring-theme-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{quote.provider}</h3>
                    <p className="text-theme-300">Car Insurance</p>
                    {quote.isUserQuote && (
                      <p className="text-sm text-theme-400">Your current plan</p>
                    )}
                  </div>
                  {quote.isUserQuote && (
                    <div className="flex items-center space-x-2">
                      <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <button
                        onClick={handleEditQuote}
                        className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                        title="Edit your quote"
                      >
                        <PencilIcon className="h-4 w-4 text-theme-300" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    ${quote.monthly_premium.toFixed(2)}
                  </p>
                  <p className="text-theme-300">per month</p>
                  <p className="text-sm text-theme-300">
                    ${quote.annual_premium.toFixed(2)}/year
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-theme-200">
                <div className="flex justify-between">
                  <span>Vehicle</span>
                  <span>{quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}</span>
                </div>
                <div className="flex justify-between">
                  <span>Driver Age</span>
                  <span>{quote.age_range}</span>
                </div>
                <div className="flex justify-between">
                  <span>License Age</span>
                  <span>{quote.license_age}</span>
                </div>
                <div className="flex justify-between">
                  <span>Claims</span>
                  <span>{quote.claims_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>City</span>
                  <span>{quote.city}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}