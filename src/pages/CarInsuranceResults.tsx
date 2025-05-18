import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { ResultsFilter } from '../components/ResultsFilter';
import { useFilters } from '../hooks/useFilters';
import { supabase } from '../lib/supabase';
import Cookies from 'js-cookie';

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
  visitor_name: string;
  isUserQuote?: boolean;
  isVisitorQuote?: boolean;
  user_id?: string;
  visitor_id?: string;
  created_at: string;
  source: 'user' | 'visitor';
}

export function CarInsuranceResults() {
  const [quotes, setQuotes] = useState<InsuranceQuote[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formState } = useFormStore();
  const visitorId = Cookies.get('visitor_id');

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
    const isSkipped = location.state?.skip === true;
    console.log('Results page initialized', { isSkipped, hasFormState: Object.keys(formState).length > 0 });

    if (!isSkipped && Object.keys(formState).length === 0) {
      console.log('No form data found, redirecting to form');
      navigate('/compare/car-insurance/0');
      return;
    }

    const fetchQuotes = async () => {
      try {
        // Fetch both user form responses and visitor submissions
        const [{ data: userResponses, error: userError }, { data: visitorSubmissions, error: visitorError }] = await Promise.all([
          supabase
            .from('user_form_responses')
            .select('*')
            .eq('category', 'car-insurance')
            .order('created_at', { ascending: false }),
          supabase
            .from('visitor_submissions')
            .select('*')
            .eq('category', 'car-insurance')
            .is('claimed_by', null)
            .order('created_at', { ascending: false })
        ]);

        if (userError) throw userError;
        if (visitorError) throw visitorError;

        let allQuotes: InsuranceQuote[] = [];

        // Transform user responses
        if (userResponses) {
          const userQuotes = await Promise.all(userResponses.map(async response => {
            const annualPremium = parseFloat(response.form_data.annual_premium || '0');
            
            // Get user metadata to get the full name
            const { data: userData } = await supabase.auth.getUser();
            const fullName = userData?.user?.user_metadata?.full_name || 'Anonymous';
            
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
              visitor_name: fullName,
              isUserQuote: user?.id === response.user_id,
              user_id: response.user_id,
              created_at: response.created_at,
              source: 'user' as const
            };
          }));
          allQuotes = [...allQuotes, ...userQuotes];
        }

        // Transform visitor submissions (only unclaimed ones)
        if (visitorSubmissions) {
          const visitorQuotes = visitorSubmissions
            .filter(submission => !submission.claimed_by) // Extra safety check
            .map(submission => {
              const annualPremium = parseFloat(submission.form_data.annual_premium || '0');
              return {
                id: submission.id,
                provider: submission.form_data.current_provider || 'Unknown Provider',
                annual_premium: annualPremium,
                monthly_premium: annualPremium / 12,
                age_range: submission.form_data.age || 'Unknown',
                vehicle_make: submission.form_data.make || 'Unknown',
                vehicle_model: submission.form_data.model || 'Unknown',
                vehicle_year: submission.form_data.year || 'Unknown',
                license_age: submission.form_data.license_age || 'Unknown',
                claims_count: submission.form_data.claims || '0',
                city: submission.form_data.city || 'Unknown',
                visitor_name: submission.form_data.visitor_name || 'Visitor Submission',
                isVisitorQuote: visitorId === submission.visitor_id,
                visitor_id: submission.visitor_id,
                created_at: submission.created_at,
                source: 'visitor' as const
              };
            });
          allQuotes = [...allQuotes, ...visitorQuotes];
        }

        // Sort quotes by monthly premium
        const sortedQuotes = allQuotes.sort((a, b) => 
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
  }, [location.state, navigate, sortOrder, user, formState, visitorId]);

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sorted = [...quotes].sort((a, b) => 
      newOrder === 'asc' ? a.monthly_premium - b.monthly_premium : b.monthly_premium - a.monthly_premium
    );
    
    setQuotes(sorted);
  };

  const handleEditQuote = (quote: InsuranceQuote) => {
    navigate('/compare/car-insurance/0', {
      state: {
        editData: {
          age: quote.age_range,
          current_provider: quote.provider,
          annual_premium: quote.annual_premium.toString(),
          make: quote.vehicle_make,
          model: quote.vehicle_model,
          year: quote.vehicle_year,
          license_age: quote.license_age,
          claims: quote.claims_count,
          city: quote.city,
          visitor_name: quote.visitor_name,
          updated_at: new Date().toISOString()
        }
      }
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

      // Call the stored procedure to clear ALL car insurance data
      const { error } = await supabase
        .rpc('clear_car_insurance_data');

      if (error) {
        console.error('Error clearing car insurance data:', error);
        return;
      }

      console.log('All car insurance data cleared successfully');
      
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
                (quote.isUserQuote || quote.isVisitorQuote) ? 'ring-2 ring-theme-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {quote.provider}
                    </h3>
                    {(quote.isUserQuote || quote.isVisitorQuote) && (
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                        <button
                          onClick={() => handleEditQuote(quote)}
                          className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                          title="Edit your quote"
                        >
                          <PencilIcon className="h-4 w-4 text-theme-300" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-theme-300">
                    ${quote.monthly_premium.toFixed(2)} per month
                  </div>
                  <div className="text-sm text-theme-400">
                    {quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}
                  </div>
                  <div className="text-sm text-theme-400">
                    Age: {quote.age_range} | License: at {quote.license_age} | Claims: {quote.claims_count}
                  </div>
                  {quote.isVisitorQuote && (
                    <p className="text-sm text-theme-400">Your quote (visitor)</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-theme-800">
                <div className="flex justify-between items-center text-xs text-theme-400">
                  <span>by {quote.visitor_name}</span>
                  <span>{formatDate(quote.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}