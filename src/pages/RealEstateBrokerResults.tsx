import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { supabase } from '../lib/supabase';
import Cookies from 'js-cookie';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon } from 'lucide-react';
import { ResultsFilter } from '../components/ResultsFilter';

interface BrokerInfo {
  visitor_name: string;
  agency: string;
  agent_name: string;
  commission_rate: string;
  isUserBroker: boolean;
  isVisitorBroker: boolean;
  user_id: string | null;
  visitor_id: string | null;
  source: 'user' | 'visitor';
  created_at: string;
}

function RealEstateBrokerResults() {
  const [brokers, setBrokers] = useState<BrokerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { formState } = useFormStore();
  const visitorId = Cookies.get('visitor_id');

  useEffect(() => {
    const isSkipped = location.state?.skip === true;
    console.log('Results page initialized', { isSkipped, hasFormState: Object.keys(formState).length > 0 });

    if (!isSkipped && Object.keys(formState).length === 0) {
      console.log('No form data found, redirecting to form');
      navigate('/compare/real-estate-broker/form');
      return;
    }

    fetchBrokers();
  }, [location.state, formState]);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both user form responses and visitor submissions
      const [{ data: userResponses, error: userError }, { data: visitorSubmissions, error: visitorError }] = await Promise.all([
        supabase
          .from('user_form_responses')
          .select('*')
          .eq('category', 'real-estate-broker')
          .order('created_at', { ascending: false }),
        supabase
          .from('visitor_submissions')
          .select('*')
          .eq('category', 'real-estate-broker')
          .is('claimed_by', null)
          .order('created_at', { ascending: false })
      ]);

      if (userError) throw userError;
      if (visitorError) throw visitorError;

      let allBrokers: BrokerInfo[] = [];

      // Transform user responses
      if (userResponses) {
        const userBrokers = await Promise.all(userResponses.map(async response => {
          // Get user metadata
          const { data: userData } = await supabase.auth.getUser();
          const fullName = userData?.user?.user_metadata?.full_name || 'Anonymous';
          
          return {
            ...response.form_data,
            visitor_name: fullName,
            isUserBroker: response.user_id === user?.id,
            isVisitorBroker: false,
            user_id: response.user_id,
            visitor_id: null,
            source: 'user' as const,
            created_at: response.created_at
          };
        }));
        allBrokers = [...allBrokers, ...userBrokers];
      }

      // Transform visitor submissions (only unclaimed ones)
      if (visitorSubmissions) {
        const visitorBrokers = visitorSubmissions
          .filter(submission => !submission.claimed_by) // Extra safety check
          .map(submission => ({
            ...submission.form_data,
            visitor_name: submission.form_data.visitor_name || 'Visitor Submission',
            isUserBroker: false,
            isVisitorBroker: submission.visitor_id === visitorId,
            user_id: null,
            visitor_id: submission.visitor_id,
            source: 'visitor' as const,
            created_at: submission.created_at
          }));
        allBrokers = [...allBrokers, ...visitorBrokers];
      }

      // Sort brokers by commission rate
      const sortedBrokers = allBrokers.sort((a, b) => {
        const rateA = parseFloat(a.commission_rate?.replace('%', '') || '0');
        const rateB = parseFloat(b.commission_rate?.replace('%', '') || '0');
        return sortOrder === 'asc' ? rateA - rateB : rateB - rateA;
      });

      setBrokers(sortedBrokers);
    } catch (err) {
      console.error('Error fetching brokers:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const toggleFilter = (group: string, value: string) => {
    setSelectedFilters(prev => {
      const currentGroup = prev[group] || [];
      const newGroup = currentGroup.includes(value)
        ? currentGroup.filter(v => v !== value)
        : [...currentGroup, value];
      
      return {
        ...prev,
        [group]: newGroup
      };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({});
  };

  const toggleFilterMenu = () => {
    setIsFilterMenuOpen(prev => !prev);
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

  const filteredBrokers = brokers.filter(broker => {
    return Object.entries(selectedFilters).every(([group, values]) => {
      if (values.length === 0) return true;
      
      switch (group) {
        case 'agency':
          return values.includes(broker.agency);
        case 'commission_rate':
          return values.some(range => {
            const [min, max] = range.split('-').map(Number);
            const rate = parseFloat(broker.commission_rate);
            return rate >= min && rate <= max;
          });
        default:
          return true;
      }
    });
  }).sort((a, b) => {
    const rateA = parseFloat(a.commission_rate);
    const rateB = parseFloat(b.commission_rate);
    return sortOrder === 'asc' ? rateA - rateB : rateB - rateA;
  });

  const filters = [
    {
      name: 'agency',
      options: Array.from(new Set(brokers.map(broker => broker.agency)))
        .map(agency => ({ label: agency, value: agency }))
    },
    {
      name: 'commission_rate',
      options: [
        { label: '0-2%', value: '0-2' },
        { label: '2-4%', value: '2-4' },
        { label: '4-6%', value: '4-6' },
        { label: '6%+', value: '6-100' }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-theme-800 rounded w-1/4"></div>
          <div className="h-64 bg-theme-800 rounded"></div>
          <div className="h-64 bg-theme-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Real Estate Broker Comparison</h1>
        
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
            Sort by Commission Rate
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {filteredBrokers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-theme-300 text-lg">No brokers found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrokers.map((broker, index) => (
            <div
              key={index}
              className={`bg-theme-900 rounded-lg p-6 ${
                broker.isUserBroker ? 'ring-2 ring-theme-300' :
                broker.isVisitorBroker ? 'ring-2 ring-theme-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{broker.agent_name}</h3>
                  </div>
                  {(broker.isUserBroker || broker.isVisitorBroker) && (
                    <button
                      className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                      title={broker.isUserBroker ? "Your Broker" : "Your Visitor Broker"}
                    >
                      <StarIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => navigate('/compare/real-estate-broker/form', { state: { editData: broker } })}
                  className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                  title="Edit broker"
                >
                  <PencilIcon className="h-4 w-4 text-theme-300" />
                </button>
              </div>
              
              <div className="space-y-2 text-sm text-theme-200">
                <div className="flex justify-between">
                  <span>Agency</span>
                  <span>{broker.agency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission Rate</span>
                  <span>{broker.commission_rate} %</span>
                </div>
                <div className="flex justify-between text-xs text-theme-400">
                  <span>Added by {broker.visitor_name}</span>
                  <span>{formatDate(broker.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { RealEstateBrokerResults };