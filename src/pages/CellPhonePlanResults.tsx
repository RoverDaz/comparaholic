import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { ResultsFilter } from '../components/ResultsFilter';
import { useFilters } from '../hooks/useFilters';
import { supabase } from '../lib/supabase';
import Cookies from 'js-cookie';

interface CellphonePlan {
  id: string;
  carrier: string;
  plan_name: string;
  monthly_cost: number;
  data_limit: string;
  visitor_name: string;
  isUserPlan?: boolean;
  isVisitorPlan?: boolean;
  user_id?: string;
  visitor_id?: string;
  created_at: string;
  source: 'user' | 'visitor';
}

export function CellPhonePlanResults() {
  const [plans, setPlans] = useState<CellphonePlan[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formState, setFullFormState } = useFormStore();
  const visitorId = Cookies.get('visitor_id');

  const filterConfig = {
    carrier: (plan: CellphonePlan, values: string[]) => 
      values.includes(plan.carrier),
    data_limit: (plan: CellphonePlan, values: string[]) =>
      values.includes(plan.data_limit),
    monthly_cost: (plan: CellphonePlan, values: string[]) => {
      const ranges = values.map(range => {
        const [min, max] = range.split('-').map(num => parseInt(num.replace('$', '')));
        return { min, max };
      });
      return ranges.some(range => 
        plan.monthly_cost >= range.min && plan.monthly_cost <= range.max
      );
    }
  };

  const {
    selectedFilters,
    filteredItems: filteredPlans,
    toggleFilter,
    clearFilters,
    isFilterMenuOpen,
    toggleFilterMenu
  } = useFilters<CellphonePlan>(plans, filterConfig);

  useEffect(() => {
    const isSkipped = location.state?.skip === true;
    console.log('Results page initialized', { isSkipped, hasFormState: Object.keys(formState).length > 0 });

    if (!isSkipped && Object.keys(formState).length === 0) {
      console.log('No form data found, redirecting to form');
      navigate('/compare/cell-phone-plan/0');
      return;
    }

    const fetchPlans = async () => {
      try {
        // Fetch both user form responses and visitor submissions
        const [{ data: userResponses, error: userError }, { data: visitorSubmissions, error: visitorError }] = await Promise.all([
          supabase
            .from('user_form_responses')
            .select('*')
            .eq('category', 'cell-phone-plan')
            .order('created_at', { ascending: false }),
          supabase
            .from('visitor_submissions')
            .select('*')
            .eq('category', 'cell-phone-plan')
            .is('claimed_by', null)
            .order('created_at', { ascending: false })
        ]);

        if (userError) throw userError;
        if (visitorError) throw visitorError;

        let allPlans: CellphonePlan[] = [];

        // Transform user responses
        if (userResponses) {
          const userPlans = await Promise.all(userResponses.map(async response => {
            // Get user metadata
            const { data: userData } = await supabase.auth.getUser();
            const fullName = userData?.user?.user_metadata?.full_name || 'Anonymous';
            
            const isUserPlan = user?.id === response.user_id;
            return {
              id: response.id,
              carrier: response.form_data.carrier || 'Unknown Carrier',
              plan_name: response.form_data.carrier ? `${response.form_data.carrier} Plan` : 'Unknown Plan',
              monthly_cost: parseFloat(response.form_data.monthly_cost || '0'),
              data_limit: response.form_data.data || '0GB',
              visitor_name: fullName,
              isUserPlan,
              user_id: response.user_id,
              created_at: response.created_at,
              source: 'user' as const
            };
          }));
          allPlans = [...allPlans, ...userPlans];
        }

        // Transform visitor submissions (only unclaimed ones)
        if (visitorSubmissions) {
          const visitorPlans = visitorSubmissions
            .filter(submission => !submission.claimed_by) // Extra safety check
            .map(submission => {
              const isVisitorPlan = visitorId === submission.visitor_id;
              return {
                id: submission.id,
                carrier: submission.form_data.carrier || 'Unknown Carrier',
                plan_name: submission.form_data.carrier ? `${submission.form_data.carrier} Plan` : 'Unknown Plan',
                monthly_cost: parseFloat(submission.form_data.monthly_cost || '0'),
                data_limit: submission.form_data.data || '0GB',
                visitor_name: submission.form_data.visitor_name || 'Visitor Submission',
                isVisitorPlan,
                visitor_id: submission.visitor_id,
                created_at: submission.created_at,
                source: 'visitor' as const
              };
            });
          allPlans = [...allPlans, ...visitorPlans];
        }

        // Sort plans by monthly cost
        const sortedPlans = allPlans.sort((a, b) => 
          sortOrder === 'asc' ? a.monthly_cost - b.monthly_cost : b.monthly_cost - a.monthly_cost
        );

        setPlans(sortedPlans);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setLoading(false);
      }
    };

    fetchPlans();
  }, [location.state, navigate, sortOrder, user, formState, visitorId]);

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sorted = [...plans].sort((a, b) => 
      newOrder === 'asc' ? a.monthly_cost - b.monthly_cost : b.monthly_cost - a.monthly_cost
    );
    
    setPlans(sorted);
  };

  const handleEditPlan = (plan: CellphonePlan) => {
    navigate('/compare/cell-phone-plan/0', {
      state: {
        editData: {
          carrier: plan.carrier,
          plan_name: plan.plan_name,
          monthly_cost: plan.monthly_cost.toString(),
          data_limit: plan.data_limit,
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-300 mx-auto"></div>
          <p className="mt-4 text-theme-300">Loading cellphone plans...</p>
        </div>
      </div>
    );
  }

  const filters = [
    {
      name: 'carrier',
      options: Array.from(new Set(plans.map(plan => plan.carrier)))
        .map(carrier => ({ label: carrier, value: carrier }))
    },
    {
      name: 'data_limit',
      options: Array.from(new Set(plans.map(plan => plan.data_limit)))
        .map(limit => ({ label: limit, value: limit }))
    },
    {
      name: 'monthly_cost',
      options: [
        { label: '$0-$50', value: '0-50' },
        { label: '$51-$100', value: '51-100' },
        { label: '$101-$150', value: '101-150' },
        { label: '$150+', value: '151-999999' }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Cellphone Plan Comparison</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSort}
            className="px-4 py-2 bg-theme-700 text-white rounded-lg hover:bg-theme-600 transition-colors flex items-center space-x-2"
          >
            <span>Sort by Monthly Cost</span>
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="w-4 h-4" />
            ) : (
              <ArrowDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <ResultsFilter
          filters={filters}
          selectedFilters={selectedFilters}
          onFilterChange={toggleFilter}
          onClearFilters={clearFilters}
          isOpen={isFilterMenuOpen}
          onToggle={toggleFilterMenu}
        />
      </div>

      {filteredPlans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-theme-300">No cellphone plans available yet. Be the first to add yours!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map(plan => (
            <div 
              key={plan.id} 
              className={`bg-theme-900 rounded-lg p-6 ${
                (plan.isUserPlan || plan.isVisitorPlan) ? 'ring-2 ring-theme-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {plan.carrier}
                    </h3>
                    {(plan.isUserPlan || plan.isVisitorPlan) && (
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                          title="Edit your plan"
                        >
                          <PencilIcon className="h-4 w-4 text-theme-300" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-theme-300">
                    ${plan.monthly_cost.toFixed(2)} per month
                  </div>
                  <div className="text-sm text-theme-400">
                    {plan.data_limit} data
                  </div>
                  {plan.isVisitorPlan && (
                    <p className="text-sm text-theme-400">Your plan (visitor)</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-theme-800">
                <div className="flex justify-between items-center text-xs text-theme-400">
                  <span>by {plan.visitor_name}</span>
                  <span>{formatDate(plan.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}