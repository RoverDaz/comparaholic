import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { ResultsFilter } from '../components/ResultsFilter';
import { useFilters } from '../hooks/useFilters';
import { supabase } from '../lib/supabase';

interface InternetPlan {
  id: string;
  provider: string;
  monthly_cost: number;
  speed: string;
  isUserPlan?: boolean;
  user_id?: string;
}

export function InternetCableResults() {
  const [plans, setPlans] = useState<InternetPlan[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formState } = useFormStore();

  const filterConfig = {
    provider: (plan: InternetPlan, values: string[]) => 
      values.includes(plan.provider),
    speed: (plan: InternetPlan, values: string[]) =>
      values.includes(plan.speed),
    monthly_cost: (plan: InternetPlan, values: string[]) => {
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
  } = useFilters<InternetPlan>(plans, filterConfig);

  useEffect(() => {
    const isSkipped = location.state?.skip === true;
    console.log('Results page initialized', { isSkipped, hasFormState: Object.keys(formState).length > 0 });

    if (!isSkipped && Object.keys(formState).length === 0) {
      console.log('No form data found, redirecting to form');
      navigate('/compare/internet-cable/0');
      return;
    }

    const fetchPlans = async () => {
      try {
        // Fetch all user form responses for internet & cable
        const { data: responses, error } = await supabase
          .from('user_form_responses')
          .select('*')
          .eq('category', 'internet-cable')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform responses into InternetPlan objects
        const transformedPlans = responses.map(response => ({
          id: response.id,
          provider: response.form_data.provider || 'Unknown Provider',
          monthly_cost: parseFloat(response.form_data.monthly_cost || '0'),
          speed: response.form_data.speed || 'Unknown',
          isUserPlan: user?.id === response.user_id,
          user_id: response.user_id
        }));

        // Sort plans by monthly cost
        const sortedPlans = transformedPlans.sort((a, b) => 
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
  }, [location.state, navigate, sortOrder, user, formState]);

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sorted = [...plans].sort((a, b) => 
      newOrder === 'asc' ? a.monthly_cost - b.monthly_cost : b.monthly_cost - a.monthly_cost
    );
    
    setPlans(sorted);
  };

  const handleEditPlan = () => {
    navigate('/compare/internet-cable/0?edit=true');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-300 mx-auto"></div>
          <p className="mt-4 text-theme-300">Loading internet plans...</p>
        </div>
      </div>
    );
  }

  const filters = [
    {
      name: 'provider',
      options: Array.from(new Set(plans.map(plan => plan.provider)))
        .map(provider => ({ label: provider, value: provider }))
    },
    {
      name: 'speed',
      options: Array.from(new Set(plans.map(plan => plan.speed)))
        .map(speed => ({ label: speed, value: speed }))
    },
    {
      name: 'monthly_cost',
      options: [
        { label: '$0-$50', value: '0-50' },
        { label: '$51-$100', value: '51-100' },
        { label: '$101-$150', value: '101-150' },
        { label: '$151+', value: '151-999' }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Internet & Cable Plans</h1>
        
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
            Sort by Monthly Cost
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-theme-300">No internet plans available yet. Be the first to add yours!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map(plan => (
            <div 
              key={plan.id} 
              className={`bg-theme-900 rounded-lg p-6 ${
                plan.isUserPlan ? 'ring-2 ring-theme-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{plan.provider}</h3>
                    <p className="text-theme-300">{plan.speed} Plan</p>
                    {plan.isUserPlan && (
                      <p className="text-sm text-theme-400">Your current plan</p>
                    )}
                  </div>
                  {plan.isUserPlan && (
                    <div className="flex items-center space-x-2">
                      <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <button
                        onClick={handleEditPlan}
                        className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                        title="Edit your plan"
                      >
                        <PencilIcon className="h-4 w-4 text-theme-300" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    ${plan.monthly_cost.toFixed(2)}
                  </p>
                  <p className="text-theme-300">per month</p>
                  <p className="text-sm text-theme-300">
                    ${(plan.monthly_cost * 12).toFixed(2)}/year
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-theme-200">
                <div className="flex justify-between">
                  <span>Internet Speed</span>
                  <span>{plan.speed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Cost</span>
                  <span>${(plan.monthly_cost * 12).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}